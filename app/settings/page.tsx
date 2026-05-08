import Link from "next/link";
import { LinearClient } from "@linear/sdk";
import { getSession } from "@/lib/auth/get-session";

const ERRORS: Record<string, string> = {
  missing: "Paste your Linear personal API key.",
  invalid: "Linear rejected that key. Double-check it's a personal API key.",
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function SettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getSession();

  let viewerName: string | null = null;
  if (session) {
    try {
      const linear = new LinearClient({ apiKey: session.accessToken });
      const viewer = await linear.viewer;
      viewerName = viewer.name ?? viewer.displayName ?? "Connected";
    } catch {
      viewerName = null;
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-[520px] w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Connect Linear</h1>
        <p className="mt-3 text-sm text-ink-2 leading-relaxed">
          better-linear talks to Linear with a personal API key. Anyone in any workspace can mint one. We never share or persist your key, it lives only in an encrypted httpOnly cookie on this device.
        </p>

        {session && viewerName && (
          <div className="mt-6 rounded border border-line bg-surface p-4">
            <p className="text-sm text-ink">Connected as <span className="font-medium">{viewerName}</span>.</p>
            <div className="mt-3 flex items-center gap-3">
              <Link
                href="/graph"
                className="inline-block px-3 py-1.5 rounded text-sm bg-ink text-paper hover:bg-ink-2 transition-colors"
              >
                Open graph
              </Link>
              <form action="/api/auth/disconnect" method="POST" className="inline">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded text-sm text-ink-2 hover:bg-hover hover:text-ink transition-colors"
                >
                  Disconnect
                </button>
              </form>
            </div>
          </div>
        )}

        {session && !viewerName && (
          <div className="mt-6 rounded border border-line bg-surface p-4">
            <p className="text-sm text-ink-2">
              We have a key on file but Linear rejected it. Paste a fresh one below.
            </p>
          </div>
        )}

        <form action="/api/auth/key" method="POST" className="mt-6 space-y-3">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.09em] text-muted">Personal API key</span>
            <input
              type="password"
              name="apiKey"
              autoComplete="off"
              spellCheck={false}
              required
              placeholder="lin_api_..."
              className="mt-1.5 w-full rounded border border-line bg-surface px-3 py-2 text-sm font-mono tracking-tight focus:border-line-ink focus:outline-none"
            />
          </label>

          {params?.error && (
            <p className="text-xs text-ink">{ERRORS[params.error] ?? "Something went wrong."}</p>
          )}

          <button
            type="submit"
            className="px-4 py-2 rounded text-sm bg-ink text-paper hover:bg-ink-2 transition-colors"
          >
            {session ? "Replace key" : "Connect"}
          </button>
        </form>

        <p className="mt-6 text-xs text-muted">
          Get a key at <a href="https://linear.app/settings/api" target="_blank" rel="noreferrer" className="underline hover:text-ink">linear.app/settings/api</a> &rsaquo; <span className="font-mono">Personal API keys</span> &rsaquo; <span className="font-mono">New key</span>. Read scope is enough.
        </p>
      </div>
    </main>
  );
}
