"use client";

import { ChangeEvent, DragEvent, useCallback, useRef, useState } from "react";
import { SecondaryButton } from "./Buttons";

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
        className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isDragging ? "border-primary bg-primary-light/50" : "border-gray-200 bg-white"
        } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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
          <p className="text-lg font-semibold text-gray-900">Drag & drop your image</p>
          <p className="text-sm text-gray-600">
            JPG or PNG only. Max 10MB. We’ll keep your file local while processing.
          </p>
        </div>
        <SecondaryButton type="button" disabled={disabled}>
          Browse files
        </SecondaryButton>
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
        <p className="text-sm text-amber-700">{localError ?? error}</p>
      )}
    </div>
  );
}

