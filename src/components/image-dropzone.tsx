"use client";

import { ChangeEvent, DragEvent, useEffect, useId, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Label } from "radix-ui";
import { Calculator, Loader2, Upload } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImageDropzoneProps = {
  isConvexConfigured: boolean;
};

export function ImageDropzone({ isConvexConfigured }: ImageDropzoneProps) {
  if (isConvexConfigured) {
    return <ConfiguredImageDropzone />;
  }

  return <DropzoneSurface />;
}

function ConfiguredImageDropzone() {
  const router = useRouter();
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<Id<"media"> | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const saveImage = useMutation(api.media.saveImage);
  const createDetection = useMutation(api.detections.create);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function uploadImage(file: File) {
    setIsUploading(true);
    setFileName(file.name);
    setUploadedImageId(null);
    setUploadError(null);
    setDetectionError(null);

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Image upload failed.");
      }

      const { storageId } = (await result.json()) as {
        storageId: Id<"_storage">;
      };

      const mediaId = await saveImage({
        storageId,
        name: file.name,
        size: file.size,
        contentType: file.type,
      });

      setUploadedImageId(mediaId);
    } catch (error) {
      setUploadedImageId(null);
      setUploadError(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleCalculateResult() {
    if (!uploadedImageId) {
      return;
    }

    setIsCalculating(true);
    setDetectionError(null);

    try {
      const detectionId = await createDetection({ mediaId: uploadedImageId });
      router.push(`/detection/${detectionId}`);
    } catch (error) {
      setDetectionError(
        error instanceof Error
          ? error.message
          : "Detection could not be created.",
      );
      setIsCalculating(false);
    }
  }

  function selectImage(file: File) {
    setPreviewUrl(URL.createObjectURL(file));
    void uploadImage(file);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files.item(0);

    if (file?.type.startsWith("image/")) {
      selectImage(file);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.item(0);

    if (file?.type.startsWith("image/")) {
      selectImage(file);
      event.target.value = "";
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <DropzoneSurface
        inputId={inputId}
        isDragging={isDragging}
        isUploading={isUploading}
        fileName={fileName}
        previewUrl={previewUrl}
        uploadError={uploadError}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFileChange={handleFileChange}
      />
      {uploadedImageId ? (
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={isCalculating}
          onClick={handleCalculateResult}
        >
          {isCalculating ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Calculator aria-hidden="true" />
          )}
          Calculate result
        </Button>
      ) : null}
      {detectionError ? (
        <p className="text-sm text-destructive">{detectionError}</p>
      ) : null}
    </div>
  );
}

type DropzoneSurfaceProps = {
  inputId?: string;
  isDragging?: boolean;
  isUploading?: boolean;
  fileName?: string | null;
  previewUrl?: string | null;
  uploadError?: string | null;
  onDragOver?: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLLabelElement>) => void;
  onDrop?: (event: DragEvent<HTMLLabelElement>) => void;
  onFileChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

function DropzoneSurface({
  inputId,
  isDragging = false,
  isUploading = false,
  fileName = null,
  previewUrl = null,
  uploadError = null,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
}: DropzoneSurfaceProps) {
  const fallbackInputId = useId();
  const resolvedInputId = inputId ?? fallbackInputId;

  return (
    <Label.Root
      htmlFor={resolvedInputId}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "grid aspect-[4/3] w-full max-w-xl cursor-pointer place-items-center rounded-lg border border-dashed border-border bg-card p-4 text-center shadow-sm transition-colors",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40",
        isDragging && "border-amber-500 bg-amber-50",
      )}
    >
      <input
        id={resolvedInputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileChange}
      />
      {previewUrl ? (
        <span className="flex h-full w-full flex-col gap-3">
          <span className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-background">
            <Image
              src={previewUrl}
              alt={
                fileName ? `Preview of ${fileName}` : "Selected image preview"
              }
              fill
              sizes="(max-width: 768px) 100vw, 36rem"
              className="object-contain"
              unoptimized
            />
          </span>
          <span className="flex min-h-11 flex-col justify-center gap-1">
            <span className="block truncate text-sm font-medium">
              {isUploading
                ? "Uploading image"
                : uploadError
                  ? "Upload failed"
                  : "Uploaded image"}
            </span>
            <span
              className={cn(
                "block truncate text-xs text-muted-foreground",
                uploadError && "text-destructive",
              )}
            >
              {uploadError ?? fileName ?? "Click or drop to replace"}
            </span>
          </span>
        </span>
      ) : (
        <span className="flex flex-col items-center gap-4">
          <span className="grid size-14 place-items-center rounded-lg border border-border bg-background">
            <Upload
              className="size-6 text-muted-foreground"
              aria-hidden="true"
            />
          </span>
          <span className="space-y-1">
            <span className="block text-base font-medium">
              {isUploading ? "Uploading image" : "Drop a Catan board image"}
            </span>
            <span className="block text-sm text-muted-foreground">
              {fileName ?? "or click to choose one"}
            </span>
          </span>
        </span>
      )}
    </Label.Root>
  );
}
