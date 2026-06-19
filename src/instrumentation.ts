// Next.js calls register() once when a server instance boots. We start the RSS
// poller here, but only in the Node.js runtime (never Edge), and the poller
// itself is idempotent so dev reloads won't spawn duplicates.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    silenceUrlParseDeprecation();
    const { startPoller } = await import("./lib/poller");
    startPoller();
  }
}

// rss-parser still calls the legacy url.parse() internally, which makes Node
// print a noisy DEP0169 deprecation warning on the first fetch. It's harmless
// and comes from a transitive dependency we don't control, so we filter out
// just that one warning code (all other warnings still surface normally).
function silenceUrlParseDeprecation(): void {
  const original = process.emitWarning.bind(process);
  process.emitWarning = ((warning: unknown, ...rest: unknown[]) => {
    const opt = rest[0];
    const code =
      opt && typeof opt === "object" && "code" in opt
        ? (opt as { code?: string }).code
        : typeof rest[1] === "string"
          ? rest[1]
          : undefined;
    if (code === "DEP0169") return;
    return (original as (...a: unknown[]) => void)(warning, ...rest);
  }) as typeof process.emitWarning;
}
