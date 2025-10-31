import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://nanobanana.ai",
    "X-Title": "Nano Banana",
  },
});

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt } = await req.json();

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "Image URL and prompt are required" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = completion.choices[0].message as any;

    // Log the full response for debugging
    console.log("Full message object keys:", Object.keys(message));
    console.log("Has images?", message.images ? "Yes" : "No");

    // Extract images from the response
    let images: string[] = [];
    let textResult = "";

    // Gemini returns images in message.images (not message.content)
    if (message.images && Array.isArray(message.images)) {
      const imageArray = message.images;
      console.log("Found images array, length:", imageArray.length);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      images = imageArray.map((img: any) => {
        // The structure is { type: "image_url", image_url: { url: "data:image/..." } }
        if (img.image_url && img.image_url.url) {
          return img.image_url.url;
        }
        return img.url || img;
      });

      console.log("Extracted image URLs, count:", images.length);
    }

    // Get text content
    if (typeof message.content === 'string') {
      textResult = message.content;
    }

    console.log("Total images found:", images.length);
    console.log("Text result:", textResult);

    return NextResponse.json({
      success: true,
      result: textResult,
      images: images,
    });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
