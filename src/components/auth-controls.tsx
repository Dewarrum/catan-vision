"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export function AuthControls() {
  const pathname = usePathname();

  if (pathname.startsWith("/detection/")) {
    return null;
  }

  return (
    <div className="fixed right-6 top-6 z-10 flex min-h-9 items-center gap-2 md:right-8 md:top-8">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="h-8 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="h-8 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/80">
            Sign up
          </button>
        </SignUpButton>
      </Show>

      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  );
}
