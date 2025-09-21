import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

// GET /api/load-space?projectId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const projectDir = path.join(process.cwd(), "public", "projects", projectId);
  try {
    // Check for index.html as a marker for existence
    const indexPath = path.join(projectDir, "index.html");
    await fs.access(indexPath);

    // Read all files: index.html, style.css, prompts.txt, README.md, .gitattributes
    const result = {};
    const filesToRead = [
      "index.html",
      "style.css",
      "prompts.txt",
      "README.md",
      ".gitattributes"
    ];
    for (const file of filesToRead) {
      const filePath = path.join(projectDir, file);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        result[file] = content;
      } catch {
        // File may not exist, skip
      }
    }
    return NextResponse.json({ success: true, project: result });
  } catch (err) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}
