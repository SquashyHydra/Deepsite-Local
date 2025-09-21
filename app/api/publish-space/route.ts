import { NextRequest, NextResponse } from "next/server";
import path from "path"; 
import fs from "fs/promises";
import Project from "@/models/Project";
import dbConnect from "@/lib/mongodb";
import { COLORS } from "@/lib/utils";
import { Page } from "@/types";
import { exec } from "child_process";
//const { exec } = require('child_process');

export const runtime = "nodejs";

function encodeTitleToUuid(title: string): string {
    // Convert title to UTF-8 byte array
    const encoder = new TextEncoder();
    const bytes = Array.from(encoder.encode(title));
    // Pad or trim to 16 bytes (UUID is 16 bytes = 32 hex chars)
    while (bytes.length < 16) bytes.push(0);
    const trimmed = bytes.slice(0, 16);
    // Convert to hex string
    const hex = trimmed.map(b => b.toString(16).padStart(2, '0')).join('');
    // Insert hyphens at UUID positions
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32)
    ].join('-');
}

export async function GET() {
  const user = process.env.displayname || "MEEP";

  await dbConnect();

  const projects = await Project.find({
    user_id: user,
  })
    .sort({ _createdAt: -1 })
    .limit(100)
    .lean();
  if (!projects) {
    return NextResponse.json(
      {
        ok: false,
        projects: [],
      },
      { status: 404 }
    );
  }
  return NextResponse.json(
    {
      ok: true,
      projects,
    },
    { status: 200 }
  );
}

// POST /api/publish-space
export async function POST(req: NextRequest) {
  const user = process.env.displayname || "MEEP";

  const { title, pages, prompts } = await req.json();

  if (!title || !pages || pages.length === 0) {
    return NextResponse.json(
      { message: "Title and HTML content are required.", ok: false },
      { status: 400 }
    );
  }

  const colorFrom = COLORS[Math.floor(Math.random() * COLORS.length)];
  const colorTo = COLORS[Math.floor(Math.random() * COLORS.length)];

  const newTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .split("-")
    .filter(Boolean)
    .join("-")
    .slice(0, 96);

  const projectId = encodeTitleToUuid(title);

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  // Destination: /public/{user}/{projectId}
  const destDir = path.join(process.cwd(), "public", user, projectId);

  try {
    await dbConnect();

    // Check for duplicate by projectId (UUID from title) or by title (case-insensitive)
    const existingProject = await Project.findOne({
      space_id: `${user}/${projectId}`,
      $or: [
        { space_id: `${user}/${projectId}` },
        { user_id: { $regex: `^${user}$`, $options: "i" } },
      ],
    });

    if (existingProject) {
      return NextResponse.json(
        { error: "A project with this title or ID already exists.", ok: false },
        { status: 409 }
      );
    }

    // Also check if directory already exists (filesystem duplicate)
    try {
      await fs.access(destDir);
      return NextResponse.json(
        { error: "A project directory with this ID already exists.", ok: false },
        { status: 409 }
      );
    } catch {}
    
    await fs.mkdir(destDir, { recursive: true });

    // Write README.md
    const readme = `---
title: ${newTitle}
emoji: 🐳
colorFrom: ${colorFrom}
colorTo: ${colorTo}
sdk: static
pinned: false
tags:
  - deepsite
---`;
    await fs.writeFile(path.join(destDir, "README.md"), readme, "utf-8");

    // Write prompts.txt
    if (prompts && Array.isArray(prompts)) {
      await fs.writeFile(path.join(destDir, "prompts.txt"), prompts.join("\n"), "utf-8");
    }

    // Write each page as a file (html/css/etc)
    if (Array.isArray(pages)) {
      for (const page of pages) {
        if (page && page.path && page.html) {
          const filePath = path.join(destDir, page.path);
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, page.html, "utf-8");
        }
      }
    }

    // Run TailwindCSS build to generate style.css
    // Assumes you have input.css and tailwind/postcss config in your project root
    const inputCss = path.join(process.cwd(), "public", "tailwind.css");
    const outputCss = path.join(destDir, "style.css");
    const tailwindCmd = `npx tailwindcss -i "${inputCss}" -o "${outputCss}" --minify --content "${path.join(destDir, 'index.html')}"`;
    await new Promise((resolve, reject) => {
      exec(tailwindCmd, (err, stdout, stderr) => {
        if (err) {
          console.error("Tailwind build error:", stderr);
          reject(stderr);
        } else {
          resolve(stdout);
        }
      });
    });

    const projectPath = `${user}/${projectId}`;
    // Save project metadata to MongoDB, including title
    const project = await Project.create({
      user_id: user,
      space_id: projectPath,
      prompts,
      title,
    });

  return NextResponse.json({ project: { ...project.toObject(), project_id: project.space_id }, path: projectPath, ok: true }, { status: 201 });
  } catch (err: any) {
    console.log("Error publishing space:", err);
    return NextResponse.json(
      { error: err.message, ok: false },
      { status: 500 }
    );
  }
}