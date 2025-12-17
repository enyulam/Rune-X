"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
        <Card>
          <CardHeader>
            <CardTitle>Uploaded image</CardTitle>
            <CardDescription>Image ID: {imageId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted">
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
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground sm:text-sm">
                  Preview not available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
                <CardTitle>Extraction summary</CardTitle>
                <CardDescription>{loading ? "Fetching results..." : "OCR completed"}</CardDescription>
              </div>
              <Badge tone={error ? "warning" : "success"}>
                {error ? "Issue" : "Completed"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
          {error && <p className="mb-3 text-xs text-destructive sm:mb-4 sm:text-sm">{error}</p>}
          {loading && <p className="text-xs text-muted-foreground sm:text-sm">Loading…</p>}
          {!loading && result && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <p className="text-xs font-semibold text-foreground sm:text-sm">Extracted text</p>
                <p className="mt-2 rounded-lg bg-muted p-2 text-sm text-foreground sm:p-3 sm:text-base">
                  {result.text}
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-foreground sm:text-sm">Characters</p>
                  <Badge tone="neutral">{result.characters.length} entries</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Character</TableHead>
                      <TableHead>Pinyin</TableHead>
                      <TableHead>Meaning</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.characters.map((row, idx) => (
                      <TableRow key={`${row.char}-${idx}`}>
                        <TableCell>
                          <span className="text-base font-semibold sm:text-lg">
                            {row.char}
                          </span>
                        </TableCell>
                        <TableCell>{row.pinyin}</TableCell>
                        <TableCell>{row.english}</TableCell>
                        <TableCell>
                          {Math.round(row.confidence * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground sm:text-sm">
                  Full sentence translation
                </p>
                <p className="mt-2 rounded-lg bg-primary/10 px-2 py-1.5 text-sm text-foreground sm:px-3 sm:py-2 sm:text-base">
                  {result.translation}
                </p>
              </div>
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
