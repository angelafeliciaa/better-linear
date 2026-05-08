import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-[520px] text-center">
        <h1 className="text-2xl font-semibold tracking-tight">better-linear</h1>
        <p className="mt-3 text-base text-ink-2 leading-relaxed">
          A graph view for your Linear issues. See what blocks what, and what to work on next.
        </p>
        <Link
          href="/settings"
          className="inline-block mt-6 px-4 py-2 rounded text-sm bg-ink text-paper hover:bg-ink-2 transition-colors"
        >
          Connect with Linear
        </Link>
      </div>
    </main>
  );
}
