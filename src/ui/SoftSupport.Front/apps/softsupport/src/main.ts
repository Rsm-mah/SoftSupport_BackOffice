import { bootstrapApplication } from '@angular/platform-browser';
import type { AppConfig } from '@soft-mfe/shared-models';
import { App } from './app/app';
import { appConfig } from './app/app.config';

async function start(): Promise<void> {
  try {
    const response = await fetch(`/config.json?v=${Date.now()}`, { cache: 'no-store' });
    if (response.ok) {
      globalThis.__softSupportRuntimeConfig = (await response.json()) as AppConfig;
    }
  } catch (error) {
    console.warn('SoftSupport : config.json introuvable, configuration par défaut.', error);
  }

  await bootstrapApplication(App, appConfig);
}

void start().catch((error: unknown) => console.error('Échec du démarrage de SoftSupport.', error));
