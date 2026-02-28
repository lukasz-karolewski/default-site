export {
  type CaddyApplyResult,
  pushConfigToCaddyApi,
} from "~/lib/caddy/caddyPushConfig";
export {
  renderAndWriteCaddyfile,
  syncCaddy as applyCaddyConfig,
} from "~/lib/caddy/caddySyncPipeline";
