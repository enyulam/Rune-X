"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { ProgressSpinner } from "@/components/ProgressSpinner";
import { ProgressBar } from "@/components/ProgressBar";
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
        // Error toast is handled in api.ts
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
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-6 lg:py-12">
      <PageHeader
        badge="Processing image"
        title="Working on your OCR results"
        description="We are extracting characters, meanings, and a full-sentence translation. This usually takes a few seconds."
      />
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <ProgressSpinner />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold sm:text-lg">
                Job ID: <span className="break-all font-mono text-primary">{jobId}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Polling the backend every second for completion status.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3 sm:mt-8">
            <ProgressBar progress={progress} label="Progress" />
            <p className="text-xs text-muted-foreground sm:text-sm">
              We will redirect you once processing completes.
            </p>
            {error && <p className="text-xs text-destructive sm:text-sm">{error}</p>}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 sm:mt-10 sm:gap-3">
            <Button variant="secondary" type="button" onClick={() => router.push("/")}>
              Start a new upload
            </Button>
            <Button type="button" onClick={() => router.refresh()}>
              Refresh now
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
