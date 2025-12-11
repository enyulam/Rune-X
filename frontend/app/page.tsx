"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { Card } from "@/components/Card";
import { UploadDropzone } from "@/components/UploadDropzone";
import { submitImage } from "@/services/api";

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Home() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image to continue.");
      return;
    }
    setIsUploading(true);
    try {
      const preview = await toDataUrl(selectedFile);
      sessionStorage.setItem("rune-x-upload-preview", preview);
      const { jobId, imageId } = await submitImage(selectedFile);
      const search = new URLSearchParams({
        jobId,
        imageId: imageId ?? "demo-image",
      });
      router.push(`/processing?${search.toString()}`);
    } catch (err) {
      setError("Upload failed. Please try again.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-start lg:py-16">
      <section className="flex-1 space-y-6">
        <Badge tone="info">Rune-X · OCR & Translation</Badge>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight text-gray-900">
            Upload Chinese handwriting or print. Get instant text & translation.
          </h1>
          <p className="text-lg text-gray-600">
            Drag an image into the dropzone and we will extract text, meanings, and full
            sentence translations. No signup required.
          </p>
        </div>
        <Card
          title="Upload an image"
          subtitle="Supports JPG and PNG. Your file stays private."
          actions={
            selectedFile && (
              <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                {selectedFile.name}
              </span>
            )
          }
          className="p-2"
        >
          <UploadDropzone
            onFileSelected={handleFileSelected}
            disabled={isUploading}
            error={error ?? undefined}
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton onClick={handleUpload} disabled={isUploading} loading={isUploading}>
              {isUploading ? "Uploading..." : "Process image"}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setSelectedFile(null)} disabled={isUploading}>
              Clear selection
            </SecondaryButton>
          </div>
        </Card>
        <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white/80 p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <p className="text-sm font-semibold text-gray-800">How it works</p>
          </div>
          <ol className="grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
            <li className="rounded-lg bg-gray-50 px-3 py-2">
              1. Upload an image of Chinese handwriting or print.
            </li>
            <li className="rounded-lg bg-gray-50 px-3 py-2">
              2. We run OCR, character lookup, and translation.
            </li>
            <li className="rounded-lg bg-gray-50 px-3 py-2">
              3. View characters, pinyin, meanings, and export JSON.
            </li>
          </ol>
        </div>
      </section>
      <aside className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white/90 p-6 shadow-card lg:sticky lg:top-16">
        <h3 className="text-lg font-semibold text-gray-900">Upload tips</h3>
        <ul className="mt-4 space-y-3 text-sm text-gray-600">
          <li>Use clear lighting and avoid heavy shadows.</li>
          <li>Crop tightly around the text for best accuracy.</li>
          <li>Supports simplified and traditional characters.</li>
        </ul>
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-primary-light px-4 py-3 text-sm text-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#0066ff" strokeWidth="1.5" />
            <path d="M12 7v5l3 3" stroke="#0066ff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Average processing time: ~5 seconds per image.</span>
        </div>
      </aside>
    </main>
  );
}
