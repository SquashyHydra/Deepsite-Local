import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/models/Project";
import path from "path";
import fs from "fs/promises";
import { Page } from "@/types";

export const runtime = "nodejs";

// GET /api/local-projects/[projectId]
export async function GET(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {

    const user = process.env.displayname || "MEEP";
    const { projectId } = await params;
    if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }
    const projectDir = path.join(process.cwd(), "public", user, projectId);
    try {
        const htmlFiles: Page[] = [];
        const images: string[] = [];
        const allowedImagesExtensions = ["jpg", "jpeg", "png", "gif", "svg", "webp", "avif", "heic", "heif", "ico", "bmp", "tiff", "tif"];

        // Read all files in the project directory
        const entries = await fs.readdir(projectDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isFile()) {
                const filePath = path.join(projectDir, entry.name);
                const ext = entry.name.split('.').pop()?.toLowerCase() || "";
                if (entry.name.endsWith(".html")) {
                    const html = await fs.readFile(filePath, "utf-8");
                    if (entry.name === "index.html") {
                        htmlFiles.unshift({ path: entry.name, html });
                    } else {
                        htmlFiles.push({ path: entry.name, html });
                    }
                } else if (allowedImagesExtensions.includes(ext)) {
                    // Local images: return as relative path
                    images.push(`/${user}/${projectId}/images/${entry.name}`);  
                }
            }
        }

        if (htmlFiles.length === 0) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "No HTML files found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                project: {
                    pages: htmlFiles,
                    images,
                    project_id: projectId,
                    _id: projectId,
                },
                ok: true,
            },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
}

// PUT /api/local-projects/[projectId]
export async function PUT(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) { 
    const { projectId } = await params;
    const user = process.env.displayname || "MEEP";

    if (!projectId) {
        return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }
    const body = await req.json();
    const { pages, prompts } = body;
    if (!Array.isArray(pages)) {
        return NextResponse.json({ error: "Missing pages" }, { status: 400 });
    }
    const projectDir = path.join(process.cwd(), "public", user, projectId);
    try {
        await fs.mkdir(projectDir, { recursive: true });
        // Save each page as an HTML file
        for (const page of pages) {
            if (page.path && page.html) {
                const filePath = path.join(projectDir, page.path);
                await fs.writeFile(filePath, String(page.html), "utf-8");
            }
        }
        // Save prompts as prompts.txt if provided
        if (Array.isArray(prompts)) {
            const promptsFile = path.join(projectDir, "prompts.txt");
            await fs.writeFile(promptsFile, prompts.join("\n"), "utf-8");
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Failed to save files" }, { status: 500 });
    }
}

// DELETE /api/local-projects/[projectId]
export async function DELETE(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    const user = process.env.displayname || "MEEP";
    const { projectId } = params;
    if (!projectId) {
        return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }
    const projectDir = path.join(process.cwd(), "public", user, projectId);
    try {
        // Recursively delete the project directory and all its contents
        await fs.rm(projectDir, { recursive: true, force: true });
        await dbConnect();
        await Project.deleteOne({ space_id: `${user}/${projectId}` });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}
