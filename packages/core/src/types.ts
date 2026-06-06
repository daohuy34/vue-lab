/**
 * Represents the unique identifier for a component
 */
export type ComponentId = string;

/**
 * Represents the namespace/category of a component
 * e.g., "Auth", "Product", "Shared"
 */
export type Namespace = string;

/**
 * Represents the file path of a component
 */
export type ComponentPath = string;

/**
 * Component metadata extracted from Vue SFC
 */
export interface ComponentMeta {
  id: ComponentId;
  name: string;
  namespace: Namespace;
  path: ComponentPath;
  tags?: string[];
}

/**
 * Prop definition extracted from component
 */
export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
  description?: string;
}

/**
 * Emits definition extracted from component
 */
export interface EmitDefinition {
  event: string;
  payload?: string;
}

/**
 * Slot definition extracted from component
 */
export interface SlotDefinition {
  name: string;
  props?: string[];
}

/**
 * Detailed component analysis result
 */
export interface ComponentAnalysis {
  meta: ComponentMeta;
  props: PropDefinition[];
  emits: EmitDefinition[];
  slots: SlotDefinition[];
  dependencies: ComponentId[];
  dependenciesGraph: Record<ComponentId, ComponentId[]>;
}

/**
 * Status of component render
 */
export type RenderStatus = 'ready' | 'warning' | 'failed';

/**
 * Render result when previewing a component
 */
export interface RenderResult {
  status: RenderStatus;
  error?: {
    type: 'MISSING_STORE' | 'MISSING_INJECT' | 'MISSING_ROUTER' | 'MISSING_I18N' | 'MISSING_NUXT' | 'COMPILE_ERROR' | 'UNKNOWN';
    message: string;
    missingDeps?: string[];
  };
}

/**
 * Project type detection
 */
export type ProjectType = 'vue' | 'nuxt';

/**
 * Project configuration
 */
export interface ProjectConfig {
  root: string;
  srcDir: string;
  type: ProjectType;
  componentsDir: string;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  port: number;
  host: string;
  openBrowser: boolean;
}

/**
 * Watch event types
 */
export type WatchEvent = 'add' | 'change' | 'unlink';

/**
 * File watch event
 */
export interface FileWatchEvent {
  event: WatchEvent;
  path: string;
  component?: ComponentMeta;
}

/**
 * WebSocket message types
 */
export type WSMessageType = 
  | 'SCAN_COMPLETE'
  | 'COMPONENT_ADDED'
  | 'COMPONENT_UPDATED'
  | 'COMPONENT_REMOVED'
  | 'RENDER_RESULT'
  | 'ERROR';

/**
 * WebSocket message payload
 */
export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
