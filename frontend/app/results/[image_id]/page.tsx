"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table, TableRow } from "@/components/ui/Table";
import { PageHeader } from "@/components/PageHeader";
import { OCRResponse, fetchResult } from "@/services/api";

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams<{ image_id: string }>();
  const imageId = useMemo(() => params?.image_id ?? "demo-image", [params]);

  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<OCRResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(sessionStorage.getItem("rune-x-upload-preview"));
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchResult(imageId);
        if (!active) return;
        setResult(data);
      } catch (err) {
        // Error toast is handled in api.ts
        console.error(err);
        setError("Unable to load results. Please retry.");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [imageId]);

  const handleExportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rune-x-${imageId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-6 lg:py-12">
      <PageHeader
        badge="Results ready"
        title="OCR & translation"
        description="Preview your upload and inspect extracted text, per-character meanings, and the translated sentence."
        actions={
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button variant="secondary" type="button" onClick={() => router.push("/")}>
              New upload
            </Button>
            <Button type="button" onClick={handleExportJson} disabled={!result}>
              Export JSON
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.1fr_1.3fr]">
        <Card title="Uploaded image" subtitle={`Image ID: ${imageId}`}>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
            {preview ? (
              <Image
                src={preview}
                alt="Uploaded preview"
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 520px, 100vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-gray-500 sm:text-sm">
                Preview not available
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Extraction summary"
          subtitle={loading ? "Fetching results..." : "OCR completed"}
          actions={
            <Badge tone={error ? "warning" : "success"}>
              {error ? "Issue" : "Completed"}
            </Badge>
          }
        >
          {error && <p className="mb-3 text-xs text-amber-700 sm:mb-4 sm:text-sm">{error}</p>}
          {loading && <p className="text-xs text-gray-600 sm:text-sm">Loading…</p>}
          {!loading && result && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-700 sm:text-sm">Extracted text</p>
                <p className="mt-2 rounded-lg bg-gray-50 p-2 text-sm text-gray-900 sm:p-3 sm:text-base">
                  {result.text}
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-gray-700 sm:text-sm">Characters</p>
                  <Badge tone="neutral">{result.characters.length} entries</Badge>
                </div>
                <Table headers={["Character", "Pinyin", "Meaning", "Confidence"]}>
                  {result.characters.map((row, idx) => (
                    <TableRow
                      key={`${row.char}-${idx}`}
                      cells={[
                        {
                          key: "char",
                          content: (
                            <span className="text-base font-semibold text-gray-900 sm:text-lg">
                              {row.char}
                            </span>
                          ),
                        },
                        {
                          key: "pinyin",
                          content: <span className="text-gray-700">{row.pinyin}</span>,
                        },
                        {
                          key: "meaning",
                          content: <span className="text-gray-700">{row.english}</span>,
                        },
                        {
                          key: "confidence",
                          content: (
                            <span className="text-gray-700">
                              {Math.round(row.confidence * 100)}%
                            </span>
                          ),
                        },
                      ]}
                    />
                  ))}
                </Table>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 sm:text-sm">
                  Full sentence translation
                </p>
                <p className="mt-2 rounded-lg bg-primary-light px-2 py-1.5 text-sm text-gray-900 sm:px-3 sm:py-2 sm:text-base">
                  {result.translation}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
