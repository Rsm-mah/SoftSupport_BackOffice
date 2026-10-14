/**
 * Modèles partagés, repris de `@soft-mfe/shared-models` (SOFTAPPLICATION) pour les seuls
 * composants communs embarqués dans SoftSupport. Les contrats sont identiques à l'original.
 */

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type PageSize = 10 | 25 | 50 | 100;

export const PAGE_SIZES: readonly PageSize[] = [10, 25, 50, 100] as const;

export interface CardDashboardConfig {
  label: string;
  value: number | string;
  displayValue?: string;
  valueSuffix?: string;
  valueSuffixKey?: string;
  color: string;
  icon?: string;
}

export interface HttpErrorWithDetail {
  parsedDetail?: string;
  error?: {
    detail?: string;
    message?: string;
    title?: string;
  };
  message?: string;
  status?: number;
}

/** Configuration chargée au démarrage depuis `/config.json` (déploiement sans rebuild). */
export interface AppConfig {
  softSupportApiUrl: string;
  helpContactUrl?: string;
}
