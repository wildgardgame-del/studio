'use server';
/**
 * @fileOverview A flow to upload an image to Catbox.moe.
 * 
 * - uploadImage - A function that handles the image upload process.
 * - UploadImageInput - The input type for the uploadImage function.
 * - UploadImageOutput - The return type for the uploadImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UploadImageInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A file (e.g., an image) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileName: z.string().describe('The name of the file.'),
});
export type UploadImageInput = z.infer<typeof UploadImageInputSchema>;

const UploadImageOutputSchema = z
  .string()
  .url()
  .describe('The public URL of the uploaded file on Catbox.');
export type UploadImageOutput = z.infer<typeof UploadImageOutputSchema>;

export async function uploadImage(
  input: UploadImageInput
): Promise<UploadImageOutput> {
  return uploadImageFlow(input);
}

const uploadImageFlow = ai.defineFlow(
  {
    name: 'uploadImageFlow',
    inputSchema: UploadImageInputSchema,
    outputSchema: UploadImageOutputSchema,
  },
  async ({fileDataUri, fileName}) => {
    // Catbox API requires the data URI to be converted to a Blob/File
    const fetchResponse = await fetch(fileDataUri);
    const fileBlob = await fetchResponse.blob();

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', fileBlob, fileName);

    const uploadResponse = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Catbox API error: ${uploadResponse.status} ${errorText}`);
    }

    const fileUrl = await uploadResponse.text();
    return fileUrl;
  }
);
