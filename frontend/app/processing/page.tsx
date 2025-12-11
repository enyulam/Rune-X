"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/Badge";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { Card } from "@/components/Card";
import { fetchJobStatus } from "@/services/api";

export default function ProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = useMemo(() => searchParams.get("jobId") ?? "demo-job", [searchParams]);
  const fallbackImageId = searchParams.get("imageId") ?? "demo-image";

  const [progress, setProgress] = useState(15);
  const [status, setStatus] = useState<"processing" | "failed">("processing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(async () => {
      if (!mounted || status === "failed") return;
      try {
        const result = await fetchJobStatus(jobId);
        if (result.progress) setProgress(Math.min(result.progress, 100));
        if (result.status === "done") {
          const id = result.imageId ?? fallbackImageId;
          router.push(`/results/${id}`);
        }
        if (result.status === "failed") {
          setStatus("failed");
          setError("Processing failed. Please try again.");
        }
      } catch (err) {
        console.error(err);
        setError("Unable to reach the server. Retrying...");
      }
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fallbackImageId, jobId, router, status]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <Badge tone="info">Processing image</Badge>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Working on your OCR results</h1>
          <p className="text-gray-600">
            We are extracting characters, meanings, and a full-sentence translation. This
            usually takes a few seconds.
          </p>
        </div>
      </div>
      <Card>
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <div className="absolute inset-2 rounded-full bg-primary-light" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              Job ID: <span className="font-mono text-primary">{jobId}</span>
            </p>
            <p className="text-sm text-gray-600">
              Polling the backend every second for completion status.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">We will redirect you once processing completes.</p>
          {error && <p className="text-sm text-amber-700">{error}</p>}
        </div>

        <div className="mt-10 flex gap-3">
          <SecondaryButton type="button" onClick={() => router.push("/")}>
            Start a new upload
          </SecondaryButton>
          <PrimaryButton type="button" onClick={() => router.refresh()}>
            Refresh now
          </PrimaryButton>
        </div>
      </Card>
    </main>
  );
}

