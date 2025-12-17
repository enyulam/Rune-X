import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { OCRResponse } from "@/types/ocr";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockResult: OCRResponse = {
  image_id: "demo-image",
  text: "学中文是一个有趣的过程。",
  translation: "Learning Chinese is an interesting journey.",
  characters: [
    { char: "学", pinyin: "xué", english: "study", confidence: 0.98 },
    { char: "中", pinyin: "zhōng", english: "middle/China", confidence: 0.96 },
    { char: "文", pinyin: "wén", english: "language", confidence: 0.95 },
    { char: "有趣", pinyin: "yǒu qù", english: "interesting", confidence: 0.92 },
  ],
};

export async function submitImage(
  file: File
): Promise<{ jobId: string; imageId?: string }> {
  // Simulate if no backend configured.
  if (!api.defaults.baseURL) {
    await sleep(500);
    return { jobId: "demo-job", imageId: "demo-image" };
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/process", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Backend returns ProcessResponse with image_id immediately
    // Return it as both jobId and imageId for compatibility
    const imageId = response.data.image_id;
    return { jobId: imageId, imageId };
  } catch (error) {
    let message = "Upload failed. Please try again.";
    if (axios.isAxiosError(error)) {
      // Try to extract error message from different response formats
      const errorData = error.response?.data;
      if (errorData) {
        message = errorData.message || errorData.detail?.message || errorData.detail || message;
        // Log full error for debugging
        console.error("Backend error:", errorData);
      }
    }
    toast({
      variant: "destructive",
      title: "Error",
      description: message,
    });
    throw error;
  }
}

export async function fetchJobStatus(
  jobId: string
): Promise<{ status: "processing" | "done" | "failed"; progress?: number; imageId?: string }> {
  if (!api.defaults.baseURL) {
    await sleep(500);
    const progress = Math.min(Math.floor((Date.now() / 1000) % 10) * 10 + 10, 100);
    return progress >= 100
      ? { status: "done", progress: 100, imageId: "demo-image" }
      : { status: "processing", progress };
  }

  // Backend processes immediately, so check if results exist
  try {
    const response = await api.get(`/results/${jobId}`);
    // If we can fetch results, processing is done
    return { status: "done", progress: 100, imageId: jobId };
  } catch (error) {
    // If 404, still processing; otherwise failed
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { status: "processing", progress: 50 };
    }
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message || error.response?.data?.detail?.message || "Unable to check job status."
      : "Unable to check job status.";
    toast({
      variant: "destructive",
      title: "Error",
      description: message,
    });
    return { status: "failed" };
  }
}

export async function fetchResult(imageId: string): Promise<OCRResponse> {
  if (!api.defaults.baseURL) {
    await sleep(300);
    return mockResult;
  }

  try {
    const response = await api.get(`/results/${imageId}`);
    // Backend returns ResultResponse with original_text, map to text for frontend
    const data = response.data;
    return {
      image_id: data.image_id,
      text: data.original_text,
      characters: data.characters,
      translation: data.translation,
    };
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message || error.response?.data?.detail?.message || "Unable to load results. Please retry."
      : "Unable to load results. Please retry.";
    toast({
      variant: "destructive",
      title: "Error",
      description: message,
    });
    throw error;
  }
}
