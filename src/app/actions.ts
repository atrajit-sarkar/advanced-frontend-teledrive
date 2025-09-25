"use server";

import { suggestTags, type SuggestTagsInput } from "@/ai/flows/ai-powered-tagging";

export async function generateTags(input: SuggestTagsInput) {
  try {
    const result = await suggestTags(input);
    return { success: true, tags: result.tags };
  } catch (error) {
    console.error("Error generating tags:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}
