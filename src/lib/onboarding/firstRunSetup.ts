import { runStartupBootstrap } from './onboarding';

export async function runFirstTimeSetup(): Promise<void> {
  await runStartupBootstrap();
}
