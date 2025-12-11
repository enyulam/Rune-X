"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { Card } from "@/components/Card";
import { Table, TableRow } from "@/components/Table";
import { OcrResult, fetchResult } from "@/services/api";

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams<{ image_id: string }>();
  const imageId = useMemo(() => params?.image_id ?? "demo-image", [params]);

  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
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
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="info">Results ready</Badge>
          <h1 className="text-3xl font-bold text-gray-900">OCR & translation</h1>
          <p className="text-gray-600">
            Preview your upload and inspect extracted text, per-character meanings, and the
            translated sentence.
          </p>
        </div>
        <div className="flex gap-3">
          <SecondaryButton type="button" onClick={() => router.push("/")}>
            New upload
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleExportJson} disabled={!result}>
            Export JSON
          </PrimaryButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.3fr]">
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
              <div className="flex h-full items-center justify-center text-gray-500">
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
          {error && <p className="mb-4 text-sm text-amber-700">{error}</p>}
          {loading && <p className="text-sm text-gray-600">Loading…</p>}
          {!loading && result && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-700">Extracted text</p>
                <p className="mt-2 rounded-lg bg-gray-50 p-3 text-base text-gray-900">
                  {result.text}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Characters</p>
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
                            <span className="text-lg font-semibold text-gray-900">{row.char}</span>
                          ),
                        },
                        { key: "pinyin", content: <span className="text-gray-700">{row.pinyin}</span> },
                        { key: "meaning", content: <span className="text-gray-700">{row.meaning}</span> },
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
                <p className="text-sm font-semibold text-gray-700">Full sentence translation</p>
                <p className="mt-2 rounded-lg bg-primary-light px-3 py-2 text-gray-900">
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

