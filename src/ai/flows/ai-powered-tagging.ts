// This is a server-side file.
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant tags for uploaded media files using AI.
 *
 * @exports {
 *   suggestTags,
 *   SuggestTagsInput,
 *   SuggestTagsOutput
 * }
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * Input schema for the suggestTags flow.
 */
const SuggestTagsInputSchema = z.object({
  mediaType: z.enum(['image', 'video', 'audio', 'document']).describe('The type of the uploaded media.'),
  mediaDataUri: z.string().describe("The media file's data, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  textualDescription: z.string().optional().describe('An optional textual description of the media content.'),
});

export type SuggestTagsInput = z.infer<typeof SuggestTagsInputSchema>;

/**
 * Output schema for the suggestTags flow.
 */
const SuggestTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of suggested tags for the media file.'),
});

export type SuggestTagsOutput = z.infer<typeof SuggestTagsOutputSchema>;

/**
 * Flow definition for suggesting tags for uploaded media.
 */
const suggestTagsFlow = ai.defineFlow(
  {
    name: 'suggestTagsFlow',
    inputSchema: SuggestTagsInputSchema,
    outputSchema: SuggestTagsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestTagsPrompt(input);
    return output!;
  }
);

/**
 * Prompt definition for suggesting tags.
 */
const suggestTagsPrompt = ai.definePrompt({
  name: 'suggestTagsPrompt',
  input: { schema: SuggestTagsInputSchema },
  output: { schema: SuggestTagsOutputSchema },
  prompt: `You are an AI assistant that suggests relevant tags for uploaded media files.

  Given the following information about the media, suggest a list of tags that can be used to easily search and filter the media later.

  Media Type: {{{mediaType}}}
  {{#if textualDescription}}
  Textual Description: {{{textualDescription}}}
  {{/if}}
  Media: {{media url=mediaDataUri}}

  The tags should be relevant to the content of the media and should be suitable for natural language queries.
  Return only array of tags.
  Do not include any other text or explanation.
  `, // Updated to request only the array of tags.
});

/**
 * Async wrapper function to suggest tags for media files.
 * @param input - The input data for tag suggestion.
 * @returns A promise that resolves to the suggested tags.
 */
export async function suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput> {
  return suggestTagsFlow(input);
}
