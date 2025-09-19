/**
 * Plugin Development SDK
 * Story 02: WordPress-Style Plugin Architecture Implementation
 */

// Core SDK
export { default as PluginSDK } from './plugin-sdk';
export type {
  PluginSDKConfig,
  PluginContext,
  PluginHooks,
  PluginFilters,
  PluginAPI,
  PluginStorage,
  PluginSecurity
} from './plugin-sdk';

// CLI Tools
export { default as PluginCLI } from './cli/plugin-cli';
export type { PluginCLIOptions } from './cli/plugin-cli';

// Testing Framework
export { default as PluginTestFramework, TestSuiteBuilder, TestUtils } from './testing/plugin-test-framework';
export type {
  TestConfig,
  TestResult,
  TestSuite,
  TestCase,
  CoverageReport,
  TestRunner
} from './testing/plugin-test-framework';

// Re-export types from marketplace
export type {
  PluginManifest,
  HealthcareComplianceConfig,
  PluginPermissions,
  PluginApiEndpoints
} from '@/types/plugins/marketplace';