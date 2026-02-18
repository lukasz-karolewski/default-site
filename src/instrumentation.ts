export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return;
  const { runFirstTimeSetup } = await import('./app/utils/firstRunSetup');
  await runFirstTimeSetup();
}
