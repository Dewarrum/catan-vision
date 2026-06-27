import { CatanBoardEditor } from "@/components/catan-board-editor";

type DetectionPageProps = {
  params: Promise<{
    detectionId: string;
  }>;
};

export default async function DetectionPage({ params }: DetectionPageProps) {
  const { detectionId } = await params;

  return (
    <CatanBoardEditor
      detectionId={detectionId}
      isConvexConfigured={Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)}
    />
  );
}
