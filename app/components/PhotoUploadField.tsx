"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Trash2, Upload, X } from "lucide-react";

type PhotoUploadFieldProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  disabled?: boolean;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoUploadField({ value, onChange, error, disabled = false }: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const displayError = error || internalError;

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Invalid file type. Accepted: JPG, PNG, WEBP. Received: ${file.type.split("/")[1]?.toUpperCase() || "unknown"}`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File is too large (${formatFileSize(file.size)}). Maximum allowed: 5 MB.`;
    }
    return null;
  }, []);

  const processFile = useCallback(
    (file: File) => {
      setInternalError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setInternalError(validationError);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          onChange(result);
        }
      };
      reader.onerror = () => {
        setInternalError("Failed to read the file. Please try again.");
      };
      reader.readAsDataURL(file);
    },
    [onChange, validateFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      processFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      processFile(file);
    },
    [processFile],
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    setInternalError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onChange]);

  const handleBrowseClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Photo</label>

      {value ? (
        /* ── Preview state ── */
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <div className="relative aspect-[3/2] w-full sm:aspect-[4/1]">
            <Image
              src={value}
              alt="Member photo preview"
              fill
              className="object-cover"
              unoptimized
            />
            {/* Gradient overlay for better button visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          {/* Action buttons overlay */}
          <div className="absolute right-2 top-2 flex gap-2">
            <button
              type="button"
              onClick={handleBrowseClick}
              disabled={disabled}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white hover:text-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Change photo"
            >
              <Camera className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white hover:text-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Remove photo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* File info bar */}
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
            <p className="text-xs font-medium text-white/90 drop-shadow-sm">
              Photo uploaded — tap the camera icon to change
            </p>
          </div>
        </div>
      ) : (
        /* ── Drop zone state ── */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleBrowseClick();
            }
          }}
          className={`
            relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8
            transition-all duration-200
            ${
              isDragOver
                ? "border-blue-400 bg-blue-50/60 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
                : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30"
            }
            ${disabled ? "cursor-not-allowed opacity-50" : ""}
          `}
          aria-label="Upload photo"
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            aria-hidden="true"
          />

          <div
            className={`
              flex h-12 w-12 items-center justify-center rounded-2xl transition-colors
              ${isDragOver ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}
            `}
          >
            <Upload className="h-5 w-5" />
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              {isDragOver ? "Drop your photo here" : "Upload member photo"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Drag & drop or click to browse
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span>JPG</span>
            <span>PNG</span>
            <span>WEBP</span>
            <span className="text-slate-300">|</span>
            <span>Max 5 MB</span>
          </div>
        </div>
      )}

      {/* Validation error */}
      {displayError ? (
        <p className="flex items-center gap-1.5 text-sm text-rose-600">
          <X className="h-3.5 w-3.5 flex-shrink-0" />
          {displayError}
        </p>
      ) : null}

      {/* Hint */}
      {!value && !displayError ? (
        <p className="text-xs text-slate-500">Optional. Recommended size: 400×400 px.</p>
      ) : null}
    </div>
  );
}