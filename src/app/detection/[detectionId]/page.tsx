import { DetectionPreview } from "@/components/detection-preview";

type DetectionPageProps = {
  params: Promise<{
    detectionId: string;
  }>;
};

export default async function DetectionPage({ params }: DetectionPageProps) {
  const { detectionId } = await params;

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-10 text-foreground">
      <DetectionPreview
        detectionId={detectionId}
        isConvexConfigured={Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)}
      />
    </main>
  );
}
