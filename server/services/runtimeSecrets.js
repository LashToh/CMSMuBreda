/**
 * Back-compat shim — donation/integration secrets live in adminConfigService.
 */
export {
  applyRuntimeSecrets,
  loadRuntimeSecretsOnBoot,
  getSecretsPublicView,
  saveRuntimeSecretsAndEnv,
} from './adminConfigService.js';
