// Leonardo.ai Image Generation Service

const LEONARDO_API_URL = 'https://cloud.leonardo.ai/api/rest/v1';

interface GenerationResponse {
  sdGenerationJob: {
    generationId: string;
  };
}

interface GenerationResult {
  generations_by_pk: {
    generated_images: Array<{
      url: string;
      id: string;
    }>;
    status: string;
  };
}

export interface QuestionImages {
  imageUrl: string | null;
  imageOptionA: string | null;
  imageOptionB: string | null;
  imageOptionC: string | null;
  imageOptionD: string | null;
  imageResults: string | null;
}

async function waitForGeneration(generationId: string, apiKey: string, maxAttempts = 30): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks

    const response = await fetch(`${LEONARDO_API_URL}/generations/${generationId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to check generation status:', await response.text());
      continue;
    }

    const result: GenerationResult = await response.json();

    if (result.generations_by_pk?.status === 'COMPLETE') {
      const images = result.generations_by_pk.generated_images;
      if (images && images.length > 0) {
        return images[0].url;
      }
    } else if (result.generations_by_pk?.status === 'FAILED') {
      console.error('Image generation failed');
      return null;
    }
  }

  console.error('Image generation timed out');
  return null;
}

async function generateImage(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(`${LEONARDO_API_URL}/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        num_images: 1,
        width: 512,
        height: 512,
        guidance_scale: 7,
        sd_version: 'PHOENIX', // Good balance of quality and speed
        alchemy: true,
        presetStyle: 'DYNAMIC',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to start image generation:', error);
      return null;
    }

    const data: GenerationResponse = await response.json();
    const generationId = data.sdGenerationJob?.generationId;

    if (!generationId) {
      console.error('No generation ID received');
      return null;
    }

    // Wait for the generation to complete
    return await waitForGeneration(generationId, apiKey);
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

export async function generateQuestionImages(
  questionPrompt: string,
  optionA: string,
  optionB: string,
  optionC?: string | null,
  optionD?: string | null
): Promise<QuestionImages> {
  const apiKey = process.env.LEONARDO_API_KEY;

  if (!apiKey) {
    console.warn('LEONARDO_API_KEY not set, skipping image generation');
    return {
      imageUrl: null,
      imageOptionA: null,
      imageOptionB: null,
      imageOptionC: null,
      imageOptionD: null,
      imageResults: null,
    };
  }

  console.log('Generating images for question:', questionPrompt);

  // Generate all images in parallel for efficiency
  const baseStyle = 'modern digital illustration, vibrant colors, clean design, suitable for a prediction game app';

  const prompts = [
    // Main question image
    `${questionPrompt}, ${baseStyle}, wide shot, engaging composition`,
    // Option A
    `${optionA}, ${baseStyle}, iconic representation`,
    // Option B
    `${optionB}, ${baseStyle}, iconic representation`,
  ];

  // Add option C and D if they exist
  if (optionC) {
    prompts.push(`${optionC}, ${baseStyle}, iconic representation`);
  }
  if (optionD) {
    prompts.push(`${optionD}, ${baseStyle}, iconic representation`);
  }

  // Results image - celebratory/reveal style
  prompts.push(`Results revealed, celebration, winner announcement, ${baseStyle}, dramatic lighting, confetti`);

  // Generate all images
  const results = await Promise.all(prompts.map(prompt => generateImage(prompt, apiKey)));

  return {
    imageUrl: results[0],
    imageOptionA: results[1],
    imageOptionB: results[2],
    imageOptionC: optionC ? results[3] : null,
    imageOptionD: optionD ? (optionC ? results[4] : results[3]) : null,
    imageResults: results[results.length - 1],
  };
}
