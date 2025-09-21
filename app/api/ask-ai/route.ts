/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getLmStudioModels, PROVIDERS, LMSTUDIO_URL } from "@/lib/providers";
const MODELS = await getLmStudioModels(); 
import {
  DIVIDER,
  FOLLOW_UP_SYSTEM_PROMPT,
  INITIAL_SYSTEM_PROMPT,
  MAX_REQUESTS_PER_IP,
  NEW_PAGE_END,
  NEW_PAGE_START,
  REPLACE_END,
  SEARCH_START,
  UPDATE_PAGE_START,
  UPDATE_PAGE_END,
} from "@/lib/prompts";
import { Page } from "@/types";
import { get } from "http";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { prompt, provider, model, redesignMarkdown, previousPrompts, pages } = body;

  if (!model || (!prompt && !redesignMarkdown)) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const selectedModel = MODELS.find(
    (m: any) => m.value === model || m.label === model
  );

  if (!selectedModel) {
    return NextResponse.json(
      { ok: false, error: "Invalid model selected" },
      { status: 400 }
    );
  }

  if (!selectedModel.providers.includes(provider) && provider !== "auto") {
    return NextResponse.json(
      {
        ok: false,
        error: `The selected model does not support the ${provider} provider.`,
        openSelectProvider: true,
      },
      { status: 400 }
    );
  }

  const DEFAULT_PROVIDER = PROVIDERS.lmstudio;
  const selectedProvider =
    provider === "auto"
      ? PROVIDERS[selectedModel.autoProvider as keyof typeof PROVIDERS]
      : PROVIDERS[provider as keyof typeof PROVIDERS] ?? DEFAULT_PROVIDER;

  const rewrittenPrompt = prompt;
  /*
  if (prompt?.length < 240) {
    rewrittenPrompt = await callAiRewritePrompt(prompt, { token, billTo });
  }
  */
  try {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const response = new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

    (async () => {
      if (selectedProvider.id === "lmstudio") {
        const lmPayload = {
          model: selectedModel.value,
          messages: [
            { role: "system", content: INITIAL_SYSTEM_PROMPT },
            ...(pages?.length > 1
              ? [{
                  role: "assistant",
                  content: `Here are the current pages:\n\n${pages
                    .map((p: Page) => `- ${p.path} \n${p.html}`)
                    .join("\n")}\n\nNow, please create a new page based on this code. Also here are the previous prompts:\n\n${previousPrompts
                    .map((p: string) => `- ${p}`)
                    .join("\n")}`,
                }]
              : []),
            {
              role: "user",
              content: redesignMarkdown
                ? `Here is my current design as a markdown:\n\n${redesignMarkdown}\n\nNow, please create a new design based on this markdown.`
                : rewrittenPrompt,
            },
          ],
          max_tokens: selectedProvider.max_tokens,
          stream: true,
        };

        try {
          const lmResponse = await fetch(`${LMSTUDIO_URL}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lmPayload),
          });
          if (!lmResponse.body) throw new Error("No response body from LM Studio");
          const reader = lmResponse.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let done = false;
          while (!done) {
            const { value, done: doneReading } = await reader.read();
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              let lines = buffer.split("\n");
              buffer = lines.pop() || "";
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.replace("data: ", "").trim();
                  if (data === "[DONE]") {
                    done = true;
                    break;
                  }
                  try {
                    const parsed = JSON.parse(data);
                    const chunk = parsed.choices?.[0]?.delta?.content;
                    if (chunk) {
                      await writer.write(encoder.encode(chunk));
                    }
                  } catch (e) {
                    // ignore malformed lines
                  }
                }
              }
            }
            done = done || doneReading;
          }
        } catch (err: any) {
          await writer.write(
            encoder.encode(
              JSON.stringify({
                ok: false,
                message:
                  err?.message ||
                  "An error occurred while processing your request to LM Studio.",
              })
            )
          );
        } finally {
          await writer?.close();
        }
        return;
      } 
    })();
    
    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        openSelectProvider: true,
        message:
          error?.message || "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { prompt, previousPrompts, provider, selectedElementHtml, model, pages, files, } =
    body;

  console.log(`files in PUT /api/ask-ai:`, files);

  if (!prompt || pages.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const selectedModel = MODELS.find(
    (m: any) => m.value === model || m.label === model
  );
  if (!selectedModel) {
    return NextResponse.json(
      { ok: false, error: "Invalid model selected" },
      { status: 400 }
    );
  }

  const DEFAULT_PROVIDER = PROVIDERS.lmstudio;
  const selectedProvider =
    provider === "auto"
      ? PROVIDERS[selectedModel.autoProvider as keyof typeof PROVIDERS]
      : PROVIDERS[provider as keyof typeof PROVIDERS] ?? DEFAULT_PROVIDER;

  try {
    // LMSTUDIO IMPLEMENTATION
    const lmPayload = {
      model: selectedModel.value,
      messages: [
        {
          role: "system",
          content: FOLLOW_UP_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: previousPrompts
            ? `Also here are the previous prompts:\n\n${previousPrompts.map((p: string) => `- ${p}`).join("\n")}`
            : "You are modifying the HTML file based on the user's request.",
        },
        {
          role: "assistant",

          content: `${
            selectedElementHtml
              ? `\n\nYou have to update ONLY the following element, NOTHING ELSE: \n\n\`\`\`html\n${selectedElementHtml}\n\`\`\``
              : ""
          }. Current pages: ${pages?.map((p: Page) => `- ${p.path} \n${p.html}`).join("\n")}. ${files?.length > 0 ? `Current images: ${files?.map((f: string) => `- ${f}`).join("\n")}.` : ""}`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: selectedProvider.max_tokens,
      stream: true,
    };

    const response = await fetch(`${LMSTUDIO_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lmPayload),
    });
    // LM Studio returns a streaming response, not a .choices[0].message.content
    // We need to read the stream and accumulate the content
    let content = "";
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { ok: false, message: "No response body from LM Studio" },
        { status: 400 }
      );
    }
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      if (value) {
        content += decoder.decode(value, { stream: true });
      }
      done = doneReading;
    }
    // LM Studio streams lines like 'data: {json}'\n, so parse and accumulate the content
    let fullText = "";
    for (const line of content.split("\n")) {
      if (line.startsWith("data: ")) {
        const data = line.replace("data: ", "").trim();
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) fullText += chunk;
        } catch (e) {
          // ignore malformed lines
        }
      }
    }
    if (!fullText) {
      return NextResponse.json(
        { ok: false, message: "No content returned from the model" },
        { status: 400 }
      );
    }
    // Now process fullText as the chunk
    const chunk = fullText;
    const updatedLines: number[][] = [];
    let newHtml = "";
    const updatedPages = [...(pages || [])];

    const updatePageRegex = new RegExp(`${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\s]+)\\s*${UPDATE_PAGE_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)(?=${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|$)`, 'g');
    let updatePageMatch;
    while ((updatePageMatch = updatePageRegex.exec(chunk)) !== null) {
      const [, pagePath, pageContent] = updatePageMatch;
      const pageIndex = updatedPages.findIndex(p => p.path === pagePath);
      if (pageIndex !== -1) {
        let pageHtml = updatedPages[pageIndex].html;
        let processedContent = pageContent;
        const htmlMatch = pageContent.match(/```html\s*([\s\S]*?)\s*```/);
        if (htmlMatch) {
          processedContent = htmlMatch[1];
        }
        let position = 0;
        let moreBlocks = true;
        while (moreBlocks) {
          const searchStartIndex = processedContent.indexOf(SEARCH_START, position);
          if (searchStartIndex === -1) {
            moreBlocks = false;
            continue;
          }
          const dividerIndex = processedContent.indexOf(DIVIDER, searchStartIndex);
          if (dividerIndex === -1) {
            moreBlocks = false;
            continue;
          }
          const replaceEndIndex = processedContent.indexOf(REPLACE_END, dividerIndex);
          if (replaceEndIndex === -1) {
            moreBlocks = false;
            continue;
          }
          const searchBlock = processedContent.substring(
            searchStartIndex + SEARCH_START.length,
            dividerIndex
          );
          const replaceBlock = processedContent.substring(
            dividerIndex + DIVIDER.length,
            replaceEndIndex
          );
          if (searchBlock.trim() === "") {
            pageHtml = `${replaceBlock}\n${pageHtml}`;
            updatedLines.push([1, replaceBlock.split("\n").length]);
          } else {
            const blockPosition = pageHtml.indexOf(searchBlock);
            if (blockPosition !== -1) {
              const beforeText = pageHtml.substring(0, blockPosition);
              const startLineNumber = beforeText.split("\n").length;
              const replaceLines = replaceBlock.split("\n").length;
              const endLineNumber = startLineNumber + replaceLines - 1;
              updatedLines.push([startLineNumber, endLineNumber]);
              pageHtml = pageHtml.replace(searchBlock, replaceBlock);
            }
          }
          position = replaceEndIndex + REPLACE_END.length;
        }
        updatedPages[pageIndex].html = pageHtml;
        if (pagePath === '/' || pagePath === '/index' || pagePath === 'index') {
          newHtml = pageHtml;
        }
      }
    }
    const newPageRegex = new RegExp(`${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\s]+)\\s*${NEW_PAGE_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)(?=${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|$)`, 'g');
    let newPageMatch;
    while ((newPageMatch = newPageRegex.exec(chunk)) !== null) {
      const [, pagePath, pageContent] = newPageMatch;
      let pageHtml = pageContent;
      const htmlMatch = pageContent.match(/```html\s*([\s\S]*?)\s*```/);
      if (htmlMatch) {
        pageHtml = htmlMatch[1];
      }
      const existingPageIndex = updatedPages.findIndex(p => p.path === pagePath);
      if (existingPageIndex !== -1) {
        updatedPages[existingPageIndex] = {
          path: pagePath,
          html: pageHtml.trim()
        };
      } else {
        updatedPages.push({
          path: pagePath,
          html: pageHtml.trim()
        });
      }
    }
    if (updatedPages.length === pages?.length && !chunk.includes(UPDATE_PAGE_START)) {
      let position = 0;
      let moreBlocks = true;
      while (moreBlocks) {
        const searchStartIndex = chunk.indexOf(SEARCH_START, position);
        if (searchStartIndex === -1) {
          moreBlocks = false;
          continue;
        }
        const dividerIndex = chunk.indexOf(DIVIDER, searchStartIndex);
        if (dividerIndex === -1) {
          moreBlocks = false;
          continue;
        }
        const replaceEndIndex = chunk.indexOf(REPLACE_END, dividerIndex);
        if (replaceEndIndex === -1) {
          moreBlocks = false;
          continue;
        }
        const searchBlock = chunk.substring(
          searchStartIndex + SEARCH_START.length,
          dividerIndex
        );
        const replaceBlock = chunk.substring(
          dividerIndex + DIVIDER.length,
          replaceEndIndex
        );
        if (searchBlock.trim() === "") {
          newHtml = `${replaceBlock}\n${newHtml}`;
          updatedLines.push([1, replaceBlock.split("\n").length]);
        } else {
          const blockPosition = newHtml.indexOf(searchBlock);
          if (blockPosition !== -1) {
            const beforeText = newHtml.substring(0, blockPosition);
            const startLineNumber = beforeText.split("\n").length;
            const replaceLines = replaceBlock.split("\n").length;
            const endLineNumber = startLineNumber + replaceLines - 1;
            updatedLines.push([startLineNumber, endLineNumber]);
            newHtml = newHtml.replace(searchBlock, replaceBlock);
          }
        }
        position = replaceEndIndex + REPLACE_END.length;
      }
      // Update the main HTML if it's the index page
      const mainPageIndex = updatedPages.findIndex(p => p.path === '/' || p.path === '/index' || p.path === 'index');
      if (mainPageIndex !== -1) {
        updatedPages[mainPageIndex].html = newHtml;
      }
    }
    return NextResponse.json({
      ok: true,
      updatedLines,
      pages: updatedPages,
    });
  } catch (error: any) {
    if (error.message?.includes("exceeded your monthly included credits")) {
      return NextResponse.json(
        {
          ok: false,
          openProModal: true,
          message: error.message,
        },
        { status: 402 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        openSelectProvider: true,
        message:
          error.message || "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}
