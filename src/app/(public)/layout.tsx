import Link from "next/link";
import { Gavel } from "lucide-react";

/** Spectator pages: no sidebar, no session — just the board. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface/60">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex size-9 items-center justify-center rounded-lg bg-amber text-ink">
            <Gavel className="size-5" aria-hidden />
          </span>
          <Link href="/live" className="display text-lg text-text">
            MedianV Auction · Live
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6">{children}</main>
    </div>
  );
}
