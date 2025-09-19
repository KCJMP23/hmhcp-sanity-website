/**
 * Plugin CLI Tools
 * Story 02: WordPress-Style Plugin Architecture Implementation
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { PluginManifest, HealthcareComplianceConfig } from '@/types/plugins/marketplace';

export interface PluginCLIOptions {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  type?: 'ai_agent' | 'integration' | 'ui_component' | 'workflow_extension';
  category?: string;
  outputDir?: string;
  template?: string;
  healthcare?: boolean;
  interactive?: boolean;
}

export class PluginCLI {
  private options: PluginCLIOptions;

  constructor(options: PluginCLIOptions) {
    this.options = {
      version: '1.0.0',
      type: 'ui_component',
      category: 'general',
      outputDir: './plugins',
      template: 'basic',
      healthcare: true,
      interactive: false,
      ...options
    };
  }

  /**
   * Create a new plugin
   */
  async createPlugin(): Promise<void> {
    try {
      console.log(`Creating plugin: ${this.options.name}`);

      // Validate options
      this.validateOptions();

      // Create plugin directory
      const pluginDir = this.createPluginDirectory();

      // Generate plugin files
      await this.generatePluginFiles(pluginDir);

      // Install dependencies
      await this.installDependencies(pluginDir);

      // Initialize git repository
      await this.initializeGit(pluginDir);

      console.log(`✅ Plugin created successfully at: ${pluginDir}`);
      console.log('\nNext steps:');
      console.log('1. cd ' + pluginDir);
      console.log('2. npm run dev');
      console.log('3. Start developing your plugin!');

    } catch (error) {
      console.error('❌ Failed to create plugin:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate CLI options
   */
  private validateOptions(): void {
    if (!this.options.name) {
      throw new Error('Plugin name is required');
    }

    if (!/^[a-z0-9-]+$/.test(this.options.name)) {
      throw new Error('Plugin name must contain only lowercase letters, numbers, and hyphens');
    }

    if (this.options.name.length < 3) {
      throw new Error('Plugin name must be at least 3 characters long');
    }

    if (this.options.name.length > 50) {
      throw new Error('Plugin name must be less than 50 characters long');
    }
  }

  /**
   * Create plugin directory
   */
  private createPluginDirectory(): string {
    const pluginDir = join(this.options.outputDir!, this.options.name!);
    
    if (existsSync(pluginDir)) {
      throw new Error(`Directory ${pluginDir} already exists`);
    }

    mkdirSync(pluginDir, { recursive: true });
    return pluginDir;
  }

  /**
   * Generate plugin files
   */
  private async generatePluginFiles(pluginDir: string): Promise<void> {
    // Generate package.json
    this.generatePackageJson(pluginDir);

    // Generate plugin manifest
    this.generatePluginManifest(pluginDir);

    // Generate main plugin file
    this.generateMainPluginFile(pluginDir);

    // Generate TypeScript configuration
    this.generateTypeScriptConfig(pluginDir);

    // Generate README
    this.generateReadme(pluginDir);

    // Generate test files
    this.generateTestFiles(pluginDir);

    // Generate development files
    this.generateDevelopmentFiles(pluginDir);
  }

  /**
   * Generate package.json
   */
  private generatePackageJson(pluginDir: string): void {
    const packageJson = {
      name: `@hmhcp/plugin-${this.options.name}`,
      version: this.options.version,
      description: this.options.description || `A WordPress-style plugin for ${this.options.name}`,
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      scripts: {
        build: 'tsc',
        dev: 'tsc --watch',
        test: 'jest',
        'test:watch': 'jest --watch',
        lint: 'eslint src/**/*.ts',
        'lint:fix': 'eslint src/**/*.ts --fix',
        validate: 'npm run lint && npm run test && npm run build',
        package: 'npm run build && npm pack'
      },
      keywords: [
        'hmhcp',
        'plugin',
        'healthcare',
        this.options.type,
        this.options.category
      ],
      author: this.options.author || 'Plugin Author',
      license: 'MIT',
      dependencies: {
        '@hmhcp/plugin-sdk': '^1.0.0'
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/jest': '^29.0.0',
        'typescript': '^5.0.0',
        'jest': '^29.0.0',
        'eslint': '^8.0.0',
        '@typescript-eslint/eslint-plugin': '^6.0.0',
        '@typescript-eslint/parser': '^6.0.0'
      },
      peerDependencies: {
        'react': '^18.0.0',
        'react-dom': '^18.0.0'
      }
    };

    writeFileSync(
      join(pluginDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  /**
   * Generate plugin manifest
   */
  private generatePluginManifest(pluginDir: string): void {
    const manifest: PluginManifest = {
      name: this.options.name!,
      version: this.options.version!,
      main: 'dist/index.js',
      description: this.options.description || `A WordPress-style plugin for ${this.options.name}`,
      author: this.options.author || 'Plugin Author',
      license: 'MIT',
      keywords: [this.options.type!, this.options.category!],
      dependencies: {},
      peerDependencies: {
        'react': '^18.0.0',
        'react-dom': '^18.0.0'
      },
      scripts: {
        build: 'tsc',
        dev: 'tsc --watch',
        test: 'jest'
      },
      config: {
        enabled: true,
        debug: false
      },
      permissions: {
        read: ['content', 'users'],
        write: ['content'],
        execute: ['api_calls'],
        network: true,
        fileSystem: false,
        database: true,
        healthcareData: this.options.healthcare
      },
      healthcareCompliance: this.generateHealthcareCompliance(),
      apiEndpoints: {
        webhooks: [],
        rest: [],
        graphql: undefined
      }
    };

    writeFileSync(
      join(pluginDir, 'plugin.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  /**
   * Generate healthcare compliance configuration
   */
  private generateHealthcareCompliance(): HealthcareComplianceConfig {
    return {
      hipaa: this.options.healthcare || false,
      fda: false,
      cms: false,
      jcaho: false,
      dataClassification: this.options.healthcare ? 'confidential' : 'public',
      auditLogging: this.options.healthcare || false,
      encryptionRequired: this.options.healthcare || false
    };
  }

  /**
   * Generate main plugin file
   */
  private generateMainPluginFile(pluginDir: string): void {
    const srcDir = join(pluginDir, 'src');
    mkdirSync(srcDir, { recursive: true });

    const mainFile = `/**
 * ${this.options.name} Plugin
 * Generated by HMHCP Plugin CLI
 */

import PluginSDK from '@hmhcp/plugin-sdk';
import { PluginManifest } from '@/types/plugins/marketplace';

// Plugin manifest
const manifest: PluginManifest = require('../plugin.json');

// Plugin class
export class ${this.toPascalCase(this.options.name!)}Plugin {
  private sdk: PluginSDK;
  private isInitialized = false;

  constructor() {
    this.sdk = new PluginSDK({
      pluginId: '${this.options.name}',
      version: '${this.options.version}',
      organizationId: 'current_org',
      sandboxMode: process.env.NODE_ENV === 'development',
      debugMode: process.env.NODE_ENV === 'development'
    }, manifest);
  }

  /**
   * Initialize the plugin
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.sdk.initialize();
      this.setupHooks();
      this.setupFilters();
      this.isInitialized = true;
      
      console.log('${this.options.name} plugin initialized');
    } catch (error) {
      console.error('Failed to initialize ${this.options.name} plugin:', error);
      throw error;
    }
  }

  /**
   * Setup plugin hooks
   */
  private setupHooks(): void {
    const context = this.sdk.getContext();

    // Example: Register init hook
    context.hooks.register('init', () => {
      console.log('${this.options.name} plugin init hook executed');
    });

    // Example: Register admin_init hook
    context.hooks.register('admin_init', () => {
      console.log('${this.options.name} plugin admin_init hook executed');
    });

    // Example: Register wp_enqueue_scripts hook
    context.hooks.register('wp_enqueue_scripts', () => {
      console.log('${this.options.name} plugin scripts enqueued');
    });
  }

  /**
   * Setup plugin filters
   */
  private setupFilters(): void {
    const context = this.sdk.getContext();

    // Example: Register content filter
    context.filters.register('the_content', (content: string) => {
      return content + '\\n<!-- Modified by ${this.options.name} plugin -->';
    });

    // Example: Register title filter
    context.filters.register('the_title', (title: string) => {
      return \`[\${this.options.name}] \${title}\`;
    });
  }

  /**
   * Plugin activation
   */
  async activate(): Promise<void> {
    console.log('${this.options.name} plugin activated');
    
    // Add activation logic here
    const context = this.sdk.getContext();
    await context.storage.set('activated_at', new Date().toISOString());
  }

  /**
   * Plugin deactivation
   */
  async deactivate(): Promise<void> {
    console.log('${this.options.name} plugin deactivated');
    
    // Add deactivation logic here
    const context = this.sdk.getContext();
    await context.storage.delete('activated_at');
  }

  /**
   * Plugin cleanup
   */
  async cleanup(): Promise<void> {
    console.log('${this.options.name} plugin cleaned up');
    
    // Add cleanup logic here
    await this.sdk.shutdown();
  }
}

// Export plugin instance
export default new ${this.toPascalCase(this.options.name!)}Plugin();
`;

    writeFileSync(join(srcDir, 'index.ts'), mainFile);
  }

  /**
   * Generate TypeScript configuration
   */
  private generateTypeScriptConfig(pluginDir: string): void {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        resolveJsonModule: true,
        baseUrl: '.',
        paths: {
          '@/*': ['./src/*'],
          '@/types/*': ['./types/*']
        }
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.ts']
    };

    writeFileSync(
      join(pluginDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }

  /**
   * Generate README
   */
  private generateReadme(pluginDir: string): void {
    const readme = `# ${this.options.name} Plugin

${this.options.description || `A WordPress-style plugin for ${this.options.name}`}

## Description

This plugin provides functionality for ${this.options.name} in the HMHCP healthcare platform.

## Installation

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Build the plugin:
   \`\`\`bash
   npm run build
   \`\`\`

3. Package the plugin:
   \`\`\`bash
   npm run package
   \`\`\`

## Development

1. Start development mode:
   \`\`\`bash
   npm run dev
   \`\`\`

2. Run tests:
   \`\`\`bash
   npm test
   \`\`\`

3. Lint code:
   \`\`\`bash
   npm run lint
   \`\`\`

## Configuration

The plugin can be configured through the admin interface or by modifying the \`plugin.json\` file.

## Hooks

This plugin registers the following hooks:
- \`init\` - Plugin initialization
- \`admin_init\` - Admin interface initialization
- \`wp_enqueue_scripts\` - Script enqueuing

## Filters

This plugin registers the following filters:
- \`the_content\` - Content modification
- \`the_title\` - Title modification

## Healthcare Compliance

${this.options.healthcare ? 'This plugin handles healthcare data and complies with HIPAA requirements.' : 'This plugin does not handle healthcare data.'}

## License

MIT

## Author

${this.options.author || 'Plugin Author'}
`;

    writeFileSync(join(pluginDir, 'README.md'), readme);
  }

  /**
   * Generate test files
   */
  private generateTestFiles(pluginDir: string): void {
    const testDir = join(pluginDir, '__tests__');
    mkdirSync(testDir, { recursive: true });

    const testFile = `/**
 * ${this.options.name} Plugin Tests
 */

import ${this.toPascalCase(this.options.name!)}Plugin from '../src/index';

describe('${this.options.name} Plugin', () => {
  let plugin: ${this.toPascalCase(this.options.name!)}Plugin;

  beforeEach(() => {
    plugin = new ${this.toPascalCase(this.options.name!)}Plugin();
  });

  afterEach(async () => {
    await plugin.cleanup();
  });

  test('should initialize successfully', async () => {
    await expect(plugin.init()).resolves.not.toThrow();
  });

  test('should activate successfully', async () => {
    await plugin.init();
    await expect(plugin.activate()).resolves.not.toThrow();
  });

  test('should deactivate successfully', async () => {
    await plugin.init();
    await plugin.activate();
    await expect(plugin.deactivate()).resolves.not.toThrow();
  });

  test('should cleanup successfully', async () => {
    await plugin.init();
    await expect(plugin.cleanup()).resolves.not.toThrow();
  });
});
`;

    writeFileSync(join(testDir, 'index.test.ts'), testFile);
  }

  /**
   * Generate development files
   */
  private generateDevelopmentFiles(pluginDir: string): void {
    // Generate .gitignore
    const gitignore = `node_modules/
dist/
*.log
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
coverage/
.nyc_output/
`;

    writeFileSync(join(pluginDir, '.gitignore'), gitignore);

    // Generate .eslintrc.js
    const eslintrc = `module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  env: {
    node: true,
    es6: true,
  },
};
`;

    writeFileSync(join(pluginDir, '.eslintrc.js'), eslintrc);

    // Generate jest.config.js
    const jestConfig = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
`;

    writeFileSync(join(pluginDir, 'jest.config.js'), jestConfig);
  }

  /**
   * Install dependencies
   */
  private async installDependencies(pluginDir: string): Promise<void> {
    console.log('Installing dependencies...');
    
    try {
      execSync('npm install', { 
        cwd: pluginDir, 
        stdio: 'inherit' 
      });
    } catch (error) {
      console.warn('Failed to install dependencies:', error.message);
    }
  }

  /**
   * Initialize git repository
   */
  private async initializeGit(pluginDir: string): Promise<void> {
    console.log('Initializing git repository...');
    
    try {
      execSync('git init', { 
        cwd: pluginDir, 
        stdio: 'inherit' 
      });
      
      execSync('git add .', { 
        cwd: pluginDir, 
        stdio: 'inherit' 
      });
      
      execSync(`git commit -m "Initial commit: ${this.options.name} plugin"`, { 
        cwd: pluginDir, 
        stdio: 'inherit' 
      });
    } catch (error) {
      console.warn('Failed to initialize git repository:', error.message);
    }
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}

export default PluginCLI;
