"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadDropzone } from "@/components/UploadDropzone";
import { PageHeader } from "@/components/PageHeader";
import { HowItWorks } from "@/components/HowItWorks";
import { UploadTips } from "@/components/UploadTips";
import { submitImage } from "@/services/api";
import { toast } from "@/components/ui/use-toast";

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
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an image to continue.",
      });
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
      // Error toast is handled in api.ts
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:flex lg:flex-row lg:items-start lg:gap-10 lg:px-6 lg:py-12">
      <section className="flex-1 space-y-4 sm:space-y-6">
        <PageHeader
          badge="Rune-X · OCR & Translation"
          title="Upload Chinese handwriting or print. Get instant text & translation."
          description="Drag an image into the dropzone and we will extract text, meanings, and full sentence translations. No signup required."
        />
        <Card className="p-2">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
                <CardTitle>Upload an image</CardTitle>
                <CardDescription>Supports JPG and PNG. Your file stays private.</CardDescription>
              </div>
              {selectedFile && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary sm:px-3 sm:py-1">
                  {selectedFile.name}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadDropzone
              onFileSelected={handleFileSelected}
              disabled={isUploading}
            />
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Process image"}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
              >
                Clear selection
              </Button>
            </div>
          </CardContent>
        </Card>
        <HowItWorks />
      </section>
      <UploadTips />
    </main>
  );
}
