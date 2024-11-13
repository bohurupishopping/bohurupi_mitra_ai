export type ImageSize = "1024x1024" | "256x256" | "512x512" | "1792x1024" | "1024x1792";

export interface ImageGenerationParams {
  model: string;
  prompt: string;
  negative_prompt?: string;
  n: number;
  size: ImageSize;
} 