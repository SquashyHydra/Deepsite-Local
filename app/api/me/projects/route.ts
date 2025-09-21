import { NextRequest, NextResponse } from "next/server";
import { createRepo, RepoDesignation, uploadFiles } from "@huggingface/hub";
import path from "path";
import { isAuthenticated } from "@/lib/auth";
import Project from "@/models/Project";
import dbConnect from "@/lib/mongodb";
import { COLORS } from "@/lib/utils";
import { Page } from "@/types";

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

export async function POST(request: NextRequest) {
  const user = process.env.displayname || "MEEP";

  const { title, pages, prompts } = await request.json();

  if (!title || !pages || pages.length === 0) {
    return NextResponse.json(
      { message: "Title and HTML content are required.", ok: false },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    let readme = "";

    const newTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .split("-")
      .filter(Boolean)
      .join("-")
      .slice(0, 96);

    const projectId = encodeTitleToUuid(title);
     /*
    const repo: RepoDesignation = {
      type: "space",
      name: `projects/${projectId}`,
    };
    */
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }
    
    // Destination: /public/projects/{projectId}
    const destDir = path.join(process.cwd(), "public", user, projectId);

    /*
    const { repoUrl } = await createRepo({
      repo,
      accessToken: user.token as string,
    });
    */
    const colorFrom = COLORS[Math.floor(Math.random() * COLORS.length)];
    const colorTo = COLORS[Math.floor(Math.random() * COLORS.length)];
    readme = `---
title: ${newTitle}
emoji: 🐳
colorFrom: ${colorFrom}
colorTo: ${colorTo}
sdk: static
pinned: false
tags:
  - deepsite
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference`;

    const readmeFile = new File([readme], "README.md", {
      type: "text/markdown",
    });
    const promptsFile = new File([prompts.join("\n")], "prompts.txt", {
      type: "text/plain",
    });
    const files = [readmeFile, promptsFile];
    pages.forEach((page: Page) => {
      const file = new File([page.html], page.path, { type: "text/html" });
      files.push(file);
    });
    /*
    await uploadFiles({
      repo,
      files,
      accessToken: user.token as string,
      commitTitle: `${prompts[prompts.length - 1]} - Initial Deployment`,
    });
    */
    
    const project_path = `projects/${projectId}`;
    const project = await Project.create({
      user_id: user,
      space_id: project_path,
      prompts,
    });
    return NextResponse.json({ project, path: project_path, ok: true }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, ok: false },
      { status: 500 }
    );
  }
}
