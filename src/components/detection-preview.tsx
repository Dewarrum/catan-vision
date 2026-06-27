"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type DetectionPreviewProps = {
  detectionId: string;
  isConvexConfigured: boolean;
};

export function DetectionPreview({
  detectionId,
  isConvexConfigured,
}: DetectionPreviewProps) {
  if (!isConvexConfigured) {
    return <PreviewMessage>Image preview unavailable.</PreviewMessage>;
  }

  return <ConfiguredDetectionPreview detectionId={detectionId} />;
}

function ConfiguredDetectionPreview({
  detectionId,
}: Pick<DetectionPreviewProps, "detectionId">) {
  const detection = useQuery(api.detections.get, { detectionId });

  if (detection === undefined) {
    return <PreviewMessage>Loading image preview.</PreviewMessage>;
  }

  if (!detection?.image.url) {
    return <PreviewMessage>Image preview unavailable.</PreviewMessage>;
  }

  return (
    <div className="relative aspect-[4/3] w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <Image
        src={detection.image.url}
        alt={`Preview of ${detection.image.name}`}
        fill
        sizes="(max-width: 768px) 100vw, 64rem"
        className="object-contain"
        unoptimized
        priority
      />
    </div>
  );
}

function PreviewMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
      {children}
    </p>
  );
}
