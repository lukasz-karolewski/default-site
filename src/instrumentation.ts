export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return;
  const { runFirstTimeSetup } = await import('./lib/onboarding/firstRunSetup');
  await runFirstTimeSetup();
}
