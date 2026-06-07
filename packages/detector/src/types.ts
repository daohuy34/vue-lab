export type DependencyType = 
  | 'pinia'
  | 'router'
  | 'i18n'
  | 'inject'
  | 'nuxt'
  | 'unknown';

export interface Dependency {
  type: DependencyType;
  name?: string;
  message: string;
  missing: string[];
}

export interface DetectionResult {
  dependencies: Dependency[];
  hasPinia: boolean;
  hasRouter: boolean;
  hasI18n: boolean;
  hasNuxt: boolean;
  hasInject: boolean;
}

export interface DetectorOptions {
  strict?: boolean;
}
