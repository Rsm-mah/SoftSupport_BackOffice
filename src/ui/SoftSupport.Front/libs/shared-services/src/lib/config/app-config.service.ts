import { Injectable, signal } from '@angular/core';
import type { AppConfig } from '@soft-mfe/shared-models';

declare global {
  // Posé par `main.ts` avant le démarrage d'Angular.
  var __softSupportRuntimeConfig: AppConfig | undefined;
}

const DEFAULT_CONFIG: AppConfig = {
  softSupportApiUrl: 'http://localhost:5051/api',
};

/**
 * Configuration d'exécution lue dans `config.json` : l'URL de l'API change d'un
 * environnement à l'autre sans reconstruire le front.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly config = signal<AppConfig>({ ...DEFAULT_CONFIG, ...(globalThis.__softSupportRuntimeConfig ?? {}) });

  getAll(): AppConfig {
    return this.config();
  }

  /** Base de l'API sans barre finale, ex. `http://localhost:5051/api`. */
  get apiBaseUrl(): string {
    return (this.config().softSupportApiUrl || DEFAULT_CONFIG.softSupportApiUrl).replace(/\/$/, '');
  }

  /** Racine du serveur (hubs SignalR), ex. `http://localhost:5051`. */
  get serverBaseUrl(): string {
    return this.apiBaseUrl.replace(/\/api$/, '');
  }
}
