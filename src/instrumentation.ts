export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { runStartupBootstrap } = await import("./lib/caddy/onboarding");
  await runStartupBootstrap();
}
