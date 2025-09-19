/**
 * Plugin Core System - WordPress-Style Plugin Architecture
 * Story 02: WordPress-Style Plugin Architecture Implementation
 */

// Core plugin system components
export { default as PluginLoader } from './plugin-loader';
export { default as PluginRegistry } from './plugin-registry';
export { default as PluginValidator } from './plugin-validator';
export { default as SandboxManager } from './sandbox-manager';
export { default as SecurityScanner } from './security-scanner';
export { default as HooksFiltersSystem } from './hooks-filters';

// Re-export types
export type {
  PluginLoaderConfig,
  LoadedPlugin
} from './plugin-loader';

export type {
  PluginRegistryConfig,
  PluginSearchOptions
} from './plugin-registry';

export type {
  ValidationResult,
  ValidationRule
} from './plugin-validator';

export type {
  SandboxInstance,
  ResourceUsage,
  SandboxManagerConfig
} from './sandbox-manager';

export type {
  SecurityScannerConfig,
  ScanResult
} from './security-scanner';

export type {
  HookCallback,
  FilterCallback,
  HookResult,
  FilterResult
} from './hooks-filters';
