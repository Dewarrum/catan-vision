import { auth } from "@clerk/nextjs/server";
import { ImageDropzone } from "@/components/image-dropzone";

export default async function Home() {
  await auth.protect();
  const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="absolute left-6 top-6 md:left-8 md:top-8">
        <div className="flex items-center gap-3">
          <div
            className="grid size-9 place-items-center border border-foreground/20 bg-amber-300 text-sm font-semibold text-stone-950 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)]"
            aria-hidden="true"
          >
            CV
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.16em]">
            Catan Vision
          </span>
        </div>
      </header>

      <main className="grid min-h-dvh place-items-center px-6">
        <ImageDropzone isConvexConfigured={isConvexConfigured} />
      </main>
    </div>
  );
}
