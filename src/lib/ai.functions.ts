"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({ text: z.string().min(1).max(2000) });

export const translateToEnglish = createServerFn({ method: "POST" })
  .validator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.AI_API_KEY;
    const apiUrl = process.env.AI_API_URL;

    if (!apiKey || !apiUrl) {
      // AI not configured — return the original text as-is
      return { text: data.text };
    }

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a professional translator for a mobile & electronics repair shop in India. Translate the user's device issue description into clear, concise technical English. If it's already English, keep it but polish grammar. Return ONLY the translated text — no quotes, no prefix, no explanation.",
          },
          { role: "user", content: data.text },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`AI gateway ${res.status}: ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const out = json.choices?.[0]?.message?.content?.trim();
    if (!out) throw new Error("Empty translation");
    return { text: out };
  });
