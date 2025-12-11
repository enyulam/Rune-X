import axios from "axios";

export type OcrCharacter = {
  char: string;
  pinyin: string;
  meaning: string;
  confidence: number;
};

export type OcrResult = {
  text: string;
  characters: OcrCharacter[];
  translation: string;
  imageUrl?: string;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockResult: OcrResult = {
  text: "学中文是一个有趣的过程。",
  translation: "Learning Chinese is an interesting journey.",
  imageUrl: "",
  characters: [
    { char: "学", pinyin: "xué", meaning: "study", confidence: 0.98 },
    { char: "中", pinyin: "zhōng", meaning: "middle/China", confidence: 0.96 },
    { char: "文", pinyin: "wén", meaning: "language", confidence: 0.95 },
    { char: "有趣", pinyin: "yǒu qù", meaning: "interesting", confidence: 0.92 },
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

  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/process", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
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

  const response = await api.get(`/process/${jobId}`);
  return response.data;
}

export async function fetchResult(imageId: string): Promise<OcrResult> {
  if (!api.defaults.baseURL) {
    await sleep(300);
    return mockResult;
  }

  const response = await api.get(`/results/${imageId}`);
  return response.data;
}

