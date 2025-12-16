"use client";

import { ChangeEvent, DragEvent, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type UploadDropzoneProps = {
  onFileSelected: (file: File) => void;
  accept?: string[];
  disabled?: boolean;
  error?: string | null;
};

const defaultAccept = ["image/png", "image/jpeg", "image/jpg"];

export function UploadDropzone({
  onFileSelected,
  accept = defaultAccept,
  disabled,
  error,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateAndSend = useCallback(
    (file?: File | null) => {
      if (!file) return;
      if (!accept.includes(file.type)) {
        const err = "Please upload a JPG or PNG image.";
        setLocalError(err);
        return;
      }
      setLocalError(null);
      onFileSelected(file);
    },
    [accept, onFileSelected]
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    const [file] = Array.from(event.dataTransfer.files);
    validateAndSend(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    validateAndSend(file);
  };

  return (
    <div className="space-y-3">
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors sm:gap-4 sm:px-6 sm:py-12 ${
          isDragging ? "border-primary bg-primary-light/50" : "border-gray-200 bg-white"
        } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light sm:h-12 sm:w-12">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="sm:w-7 sm:h-7">
            <path
              d="M12 3v12m0-12 4 4m-4-4-4 4M4 15v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3"
              stroke="#0066ff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-gray-900 sm:text-lg">Drag & drop your image</p>
          <p className="text-xs text-gray-600 sm:text-sm">
            JPG or PNG only. Max 10MB. We&apos;ll keep your file local while processing.
          </p>
        </div>
        <Button variant="secondary" type="button" disabled={disabled}>
          Browse files
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept.join(",")}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>
      {(localError || error) && (
        <p className="text-xs text-amber-700 sm:text-sm">{localError ?? error}</p>
      )}
    </div>
  );
}
