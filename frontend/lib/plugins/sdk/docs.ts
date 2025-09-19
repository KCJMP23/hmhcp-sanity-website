// Plugin Documentation Generator
// Story 6.2: WordPress-Style Plugin Marketplace & Management

import * as fs from 'fs';
import * as path from 'path';
import { PluginManifest } from './core';

export interface DocumentationOptions {
  outputDir: string;
  format: 'markdown' | 'html' | 'pdf';
  includeExamples: boolean;
  includeAPI: boolean;
  includeChangelog: boolean;
  theme?: string;
}

export interface APIDocumentation {
  name: string;
  description: string;
  methods: APIMethod[];
  events: APIEvent[];
  types: APIType[];
}

export interface APIMethod {
  name: string;
  description: string;
  parameters: APIParameter[];
  returnType: string;
  example?: string;
}

export interface APIEvent {
  name: string;
  description: string;
  parameters: APIParameter[];
  example?: string;
}

export interface APIType {
  name: string;
  description: string;
  properties: APIProperty[];
}

export interface APIParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
}

export interface APIProperty {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export class PluginDocumentationGenerator {
  private manifest: PluginManifest;
  private options: DocumentationOptions;

  constructor(manifest: PluginManifest, options: DocumentationOptions) {
    this.manifest = manifest;
    this.options = options;
  }

  /**
   * Generate documentation
   */
  async generate(): Promise<void> {
    try {
      // Create output directory
      if (!fs.existsSync(this.options.outputDir)) {
        fs.mkdirSync(this.options.outputDir, { recursive: true });
      }

      // Generate main documentation
      await this.generateMainDocumentation();

      // Generate API documentation
      if (this.options.includeAPI) {
        await this.generateAPIDocumentation();
      }

      // Generate examples
      if (this.options.includeExamples) {
        await this.generateExamples();
      }

      // Generate changelog
      if (this.options.includeChangelog) {
        await this.generateChangelog();
      }

      // Generate configuration file
      await this.generateConfigFile();

      console.log('✅ Documentation generated successfully!');

    } catch (error) {
      console.error('❌ Documentation generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate main documentation
   */
  private async generateMainDocumentation(): Promise<void> {
    const content = this.generateMainContent();
    const filename = `README.${this.options.format === 'html' ? 'html' : 'md'}`;
    const filepath = path.join(this.options.outputDir, filename);
    
    fs.writeFileSync(filepath, content);
  }

  /**
   * Generate main content
   */
  private generateMainContent(): string {
    if (this.options.format === 'html') {
      return this.generateHTMLContent();
    } else {
      return this.generateMarkdownContent();
    }
  }

  /**
   * Generate markdown content
   */
  private generateMarkdownContent(): string {
    return `# ${this.manifest.name}

${this.manifest.description}

## Installation

\`\`\`bash
npm install ${this.manifest.name}
\`\`\`

## Quick Start

\`\`\`javascript
const { PluginSDK } = require('@hmhcp/plugin-sdk');
const ${this.manifest.name.replace(/[^a-zA-Z0-9]/g, '')} = require('${this.manifest.name}');

// Initialize plugin
const sdk = new PluginSDK(context, config);
const plugin = new ${this.manifest.name.replace(/[^a-zA-Z0-9]/g, '')}(sdk);

await plugin.initialize();
\`\`\`

## Configuration

${this.generateConfigurationSection()}

## Permissions

${this.generatePermissionsSection()}

## API Reference

${this.generateAPISection()}

## Examples

${this.generateExamplesSection()}

## Healthcare Compliance

${this.generateComplianceSection()}

## License

${this.manifest.license}

## Support

- **Author**: ${this.manifest.author}
- **Homepage**: ${this.manifest.homepage || 'N/A'}
- **Repository**: ${this.manifest.repository || 'N/A'}
`;
  }

  /**
   * Generate HTML content
   */
  private generateHTMLContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.manifest.name} - Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .permission { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; margin: 2px; font-size: 0.8em; }
        .compliance { display: inline-block; background: #e8f5e8; color: #2e7d32; padding: 2px 8px; border-radius: 12px; margin: 2px; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${this.manifest.name}</h1>
        <p>${this.manifest.description}</p>
        
        <h2>Installation</h2>
        <pre><code>npm install ${this.manifest.name}</code></pre>
        
        <h2>Quick Start</h2>
        <pre><code>const { PluginSDK } = require('@hmhcp/plugin-sdk');
const ${this.manifest.name.replace(/[^a-zA-Z0-9]/g, '')} = require('${this.manifest.name}');

// Initialize plugin
const sdk = new PluginSDK(context, config);
const plugin = new ${this.manifest.name.replace(/[^a-zA-Z0-9]/g, '')}(sdk);

await plugin.initialize();</code></pre>
        
        <h2>Configuration</h2>
        ${this.generateConfigurationHTML()}
        
        <h2>Permissions</h2>
        ${this.generatePermissionsHTML()}
        
        <h2>Healthcare Compliance</h2>
        ${this.generateComplianceHTML()}
        
        <h2>License</h2>
        <p>${this.manifest.license}</p>
        
        <h2>Support</h2>
        <ul>
            <li><strong>Author</strong>: ${this.manifest.author}</li>
            <li><strong>Homepage</strong>: ${this.manifest.homepage || 'N/A'}</li>
            <li><strong>Repository</strong>: ${this.manifest.repository || 'N/A'}</li>
        </ul>
    </div>
</body>
</html>`;
  }

  /**
   * Generate configuration section
   */
  private generateConfigurationSection(): string {
    if (Object.keys(this.manifest.settings).length === 0) {
      return 'This plugin has no configuration options.';
    }

    let content = 'The following configuration options are available:\n\n';
    
    for (const [key, value] of Object.entries(this.manifest.settings)) {
      content += `### \`${key}\`\n`;
      content += `- **Type**: ${typeof value}\n`;
      content += `- **Default**: \`${JSON.stringify(value)}\`\n`;
      content += `- **Description**: Configuration option for ${key}\n\n`;
    }

    return content;
  }

  /**
   * Generate permissions section
   */
  private generatePermissionsSection(): string {
    const permissions = Object.entries(this.manifest.permissions)
      .filter(([_, value]) => value === true || (Array.isArray(value) && value.length > 0))
      .map(([key, value]) => `- **${key}**: ${Array.isArray(value) ? value.join(', ') : 'true'}`)
      .join('\n');

    if (permissions.length === 0) {
      return 'This plugin requires no special permissions.';
    }

    return `This plugin requires the following permissions:\n\n${permissions}`;
  }

  /**
   * Generate API section
   */
  private generateAPISection(): string {
    return `The plugin provides the following API methods:

### Data Access
- \`readData(table, filters)\` - Read data from a table
- \`writeData(table, data)\` - Write data to a table
- \`updateData(table, id, data)\` - Update data in a table
- \`deleteData(table, id)\` - Delete data from a table

### Healthcare Data Access
- \`readHealthcareData(patientId, dataType)\` - Read healthcare data
- \`writeHealthcareData(patientId, dataType, data)\` - Write healthcare data

### User Management
- \`getUsers(filters)\` - Get users
- \`getUser(userId)\` - Get a specific user
- \`createUser(userData)\` - Create a new user
- \`updateUser(userId, userData)\` - Update a user
- \`deleteUser(userId)\` - Delete a user

### Content Management
- \`getContent(contentType, filters)\` - Get content
- \`createContent(contentType, content)\` - Create content
- \`updateContent(contentId, content)\` - Update content
- \`deleteContent(contentId)\` - Delete content

### Analytics
- \`getAnalytics(metric, filters)\` - Get analytics data
- \`trackEvent(event, data)\` - Track an event

### Network
- \`httpRequest(url, options)\` - Make HTTP requests

### File System
- \`readFile(path)\` - Read a file
- \`writeFile(path, content)\` - Write a file
- \`deleteFile(path)\` - Delete a file
- \`listFiles(path)\` - List files in a directory

### Logging
- \`log(level, message, data)\` - Log a message

### Configuration
- \`getConfig(key)\` - Get configuration value
- \`setConfig(key, value)\` - Set configuration value

### Events
- \`emit(event, data)\` - Emit an event
- \`on(event, callback)\` - Listen for an event
- \`off(event, callback)\` - Stop listening for an event`;
  }

  /**
   * Generate examples section
   */
  private generateExamplesSection(): string {
    return `### Basic Usage

\`\`\`javascript
const { PluginSDK } = require('@hmhcp/plugin-sdk');
const ${this.manifest.name.replace(/[^a-zA-Z0-9]/g, '')} = require('${this.manifest.name}');

// Initialize plugin
const sdk = new PluginSDK(context, config);
const plugin = new ${this.manifest.name.replace(/[^a-zA-Z0-9]/g, '')}(sdk);

await plugin.initialize();

// Use plugin
const data = await sdk.getAPI().readData('users');
console.log('Users:', data);
\`\`\`

### Event Handling

\`\`\`javascript
// Listen for events
sdk.getAPI().on('user.created', (data) => {
  console.log('User created:', data);
});

// Emit events
await sdk.getAPI().emit('custom.event', { message: 'Hello World' });
\`\`\`

### Error Handling

\`\`\`javascript
try {
  const data = await sdk.getAPI().readData('users');
} catch (error) {
  console.error('Error reading data:', error);
  await sdk.getAPI().log('error', 'Failed to read data', { error: error.message });
}
\`\`\``;
  }

  /**
   * Generate compliance section
   */
  private generateComplianceSection(): string {
    const compliance = this.manifest.healthcareCompliance;
    const complianceItems = [];

    if (compliance.hipaa) complianceItems.push('HIPAA');
    if (compliance.fda) complianceItems.push('FDA');
    if (compliance.cms) complianceItems.push('CMS');
    if (compliance.jcaho) complianceItems.push('JCAHO');

    if (complianceItems.length === 0) {
      return 'This plugin is not healthcare compliant.';
    }

    return `This plugin meets the following healthcare compliance requirements:\n\n${complianceItems.map(item => `- **${item}**`).join('\n')}`;
  }

  /**
   * Generate configuration HTML
   */
  private generateConfigurationHTML(): string {
    if (Object.keys(this.manifest.settings).length === 0) {
      return '<p>This plugin has no configuration options.</p>';
    }

    let content = '<ul>';
    
    for (const [key, value] of Object.entries(this.manifest.settings)) {
      content += `<li><strong>${key}</strong>: ${typeof value} (default: <code>${JSON.stringify(value)}</code>)</li>`;
    }

    content += '</ul>';
    return content;
  }

  /**
   * Generate permissions HTML
   */
  private generatePermissionsHTML(): string {
    const permissions = Object.entries(this.manifest.permissions)
      .filter(([_, value]) => value === true || (Array.isArray(value) && value.length > 0))
      .map(([key, value]) => `<span class="permission">${key}: ${Array.isArray(value) ? value.join(', ') : 'true'}</span>`)
      .join('');

    if (permissions.length === 0) {
      return '<p>This plugin requires no special permissions.</p>';
    }

    return `<div>${permissions}</div>`;
  }

  /**
   * Generate compliance HTML
   */
  private generateComplianceHTML(): string {
    const compliance = this.manifest.healthcareCompliance;
    const complianceItems = [];

    if (compliance.hipaa) complianceItems.push('HIPAA');
    if (compliance.fda) complianceItems.push('FDA');
    if (compliance.cms) complianceItems.push('CMS');
    if (compliance.jcaho) complianceItems.push('JCAHO');

    if (complianceItems.length === 0) {
      return '<p>This plugin is not healthcare compliant.</p>';
    }

    const complianceHTML = complianceItems.map(item => `<span class="compliance">${item}</span>`).join('');
    return `<div>${complianceHTML}</div>`;
  }

  /**
   * Generate API documentation
   */
  private async generateAPIDocumentation(): Promise<void> {
    const apiDoc = this.generateAPIDoc();
    const filename = `API.${this.options.format === 'html' ? 'html' : 'md'}`;
    const filepath = path.join(this.options.outputDir, filename);
    
    fs.writeFileSync(filepath, apiDoc);
  }

  /**
   * Generate API documentation content
   */
  private generateAPIDoc(): string {
    if (this.options.format === 'html') {
      return this.generateAPIHTML();
    } else {
      return this.generateAPIMarkdown();
    }
  }

  /**
   * Generate API markdown
   */
  private generateAPIMarkdown(): string {
    return `# ${this.manifest.name} API Reference

## Data Access

### readData(table, filters)
Read data from a table.

**Parameters:**
- \`table\` (string): Table name
- \`filters\` (object, optional): Filter criteria

**Returns:** Promise<Array>

**Example:**
\`\`\`javascript
const users = await sdk.getAPI().readData('users', { role: 'admin' });
\`\`\`

### writeData(table, data)
Write data to a table.

**Parameters:**
- \`table\` (string): Table name
- \`data\` (object): Data to write

**Returns:** Promise<Object>

**Example:**
\`\`\`javascript
const user = await sdk.getAPI().writeData('users', { name: 'John Doe', email: 'john@example.com' });
\`\`\`

## Healthcare Data Access

### readHealthcareData(patientId, dataType)
Read healthcare data for a patient.

**Parameters:**
- \`patientId\` (string): Patient ID
- \`dataType\` (string): Type of healthcare data

**Returns:** Promise<Object>

**Example:**
\`\`\`javascript
const vitals = await sdk.getAPI().readHealthcareData('patient-123', 'vitals');
\`\`\`

## Events

### on(event, callback)
Listen for an event.

**Parameters:**
- \`event\` (string): Event name
- \`callback\` (function): Event handler

**Example:**
\`\`\`javascript
sdk.getAPI().on('user.created', (data) => {
  console.log('User created:', data);
});
\`\`\`

### emit(event, data)
Emit an event.

**Parameters:**
- \`event\` (string): Event name
- \`data\` (any, optional): Event data

**Returns:** Promise<void>

**Example:**
\`\`\`javascript
await sdk.getAPI().emit('custom.event', { message: 'Hello World' });
\`\`\``;
  }

  /**
   * Generate API HTML
   */
  private generateAPIHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.manifest.name} API Reference</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .method { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 10px 0; }
        .method-name { font-size: 1.2em; font-weight: bold; color: #1976d2; }
        .parameter { margin: 5px 0; }
        .parameter-name { font-weight: bold; }
        .parameter-type { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${this.manifest.name} API Reference</h1>
        
        <div class="method">
            <div class="method-name">readData(table, filters)</div>
            <p>Read data from a table.</p>
            <p><strong>Parameters:</strong></p>
            <ul>
                <li class="parameter">
                    <span class="parameter-name">table</span> 
                    <span class="parameter-type">(string)</span> - Table name
                </li>
                <li class="parameter">
                    <span class="parameter-name">filters</span> 
                    <span class="parameter-type">(object, optional)</span> - Filter criteria
                </li>
            </ul>
            <p><strong>Returns:</strong> Promise<Array></p>
            <p><strong>Example:</strong></p>
            <pre><code>const users = await sdk.getAPI().readData('users', { role: 'admin' });</code></pre>
        </div>
        
        <div class="method">
            <div class="method-name">writeData(table, data)</div>
            <p>Write data to a table.</p>
            <p><strong>Parameters:</strong></p>
            <ul>
                <li class="parameter">
                    <span class="parameter-name">table</span> 
                    <span class="parameter-type">(string)</span> - Table name
                </li>
                <li class="parameter">
                    <span class="parameter-name">data</span> 
                    <span class="parameter-type">(object)</span> - Data to write
                </li>
            </ul>
            <p><strong>Returns:</strong> Promise<Object></p>
            <p><strong>Example:</strong></p>
            <pre><code>const user = await sdk.getAPI().writeData('users', { name: 'John Doe', email: 'john@example.com' });</code></pre>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate examples
   */
  private async generateExamples(): Promise<void> {
    const examples = this.generateExamplesContent();
    const filename = `examples.${this.options.format === 'html' ? 'html' : 'md'}`;
    const filepath = path.join(this.options.outputDir, filename);
    
    fs.writeFileSync(filepath, examples);
  }

  /**
   * Generate examples content
   */
  private generateExamplesContent(): string {
    if (this.options.format === 'html') {
      return this.generateExamplesHTML();
    } else {
      return this.generateExamplesMarkdown();
    }
  }

  /**
   * Generate examples markdown
   */
  private generateExamplesMarkdown(): string {
    return `# ${this.manifest.name} Examples

## Basic Usage

\`\`\`javascript
const { PluginSDK } = require('@hmhcp/plugin-sdk');
const ${this.manifest.name.replace(/[^a-zA-Z0-9]/g, '')} = require('${this.manifest.name}');

// Initialize plugin
const sdk = new PluginSDK(context, config);
const plugin = new ${this.manifest.name.replace(/[^a-zA-Z0-9]/g, '')}(sdk);

await plugin.initialize();
\`\`\`

## Data Processing

\`\`\`javascript
// Read data
const users = await sdk.getAPI().readData('users');

// Process data
const adminUsers = users.filter(user => user.role === 'admin');

// Write processed data
await sdk.getAPI().writeData('admin_users', adminUsers);
\`\`\`

## Event Handling

\`\`\`javascript
// Listen for events
sdk.getAPI().on('user.created', async (data) => {
  console.log('New user created:', data);
  
  // Send welcome email
  await sdk.getAPI().httpRequest('/api/email/send', {
    method: 'POST',
    body: JSON.stringify({
      to: data.email,
      subject: 'Welcome!',
      body: 'Welcome to our platform!'
    })
  });
});

// Emit custom events
await sdk.getAPI().emit('plugin.initialized', {
  plugin: '${this.manifest.name}',
  version: '${this.manifest.version}'
});
\`\`\`

## Error Handling

\`\`\`javascript
try {
  const data = await sdk.getAPI().readData('users');
  console.log('Data loaded successfully');
} catch (error) {
  console.error('Error loading data:', error);
  
  // Log error
  await sdk.getAPI().log('error', 'Failed to load data', {
    error: error.message,
    stack: error.stack
  });
  
  // Notify administrators
  await sdk.getAPI().emit('error.notification', {
    type: 'data_load_error',
    message: error.message
  });
}
\`\`\`

## Healthcare Data Access

\`\`\`javascript
// Read patient vitals
const vitals = await sdk.getAPI().readHealthcareData('patient-123', 'vitals');

// Process vitals data
const abnormalVitals = vitals.filter(vital => 
  vital.blood_pressure > 140 || vital.heart_rate > 100
);

// Alert healthcare providers
if (abnormalVitals.length > 0) {
  await sdk.getAPI().emit('healthcare.alert', {
    patientId: 'patient-123',
    type: 'abnormal_vitals',
    data: abnormalVitals
  });
}
\`\`\`

## Analytics Integration

\`\`\`javascript
// Track plugin usage
await sdk.getAPI().trackEvent('plugin.used', {
  plugin: '${this.manifest.name}',
  action: 'data_processed',
  timestamp: new Date().toISOString()
});

// Get analytics data
const usageStats = await sdk.getAPI().getAnalytics('plugin_usage', {
  plugin: '${this.manifest.name}',
  period: '30d'
});

console.log('Usage stats:', usageStats);
\`\`\``;
  }

  /**
   * Generate examples HTML
   */
  private generateExamplesHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.manifest.name} Examples</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .example { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .example-title { font-size: 1.2em; font-weight: bold; color: #1976d2; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${this.manifest.name} Examples</h1>
        
        <div class="example">
            <div class="example-title">Basic Usage</div>
            <pre><code>const { PluginSDK } = require('@hmhcp/plugin-sdk');
const ${this.manifest.name.replace(/[^a-zA-Z0-9]/g, '')} = require('${this.manifest.name}');

// Initialize plugin
const sdk = new PluginSDK(context, config);
const plugin = new ${this.manifest.name.replace(/[^a-zA-Z0-9]/g, '')}(sdk);

await plugin.initialize();</code></pre>
        </div>
        
        <div class="example">
            <div class="example-title">Data Processing</div>
            <pre><code>// Read data
const users = await sdk.getAPI().readData('users');

// Process data
const adminUsers = users.filter(user => user.role === 'admin');

// Write processed data
await sdk.getAPI().writeData('admin_users', adminUsers);</code></pre>
        </div>
        
        <div class="example">
            <div class="example-title">Event Handling</div>
            <pre><code>// Listen for events
sdk.getAPI().on('user.created', async (data) => {
  console.log('New user created:', data);
});

// Emit custom events
await sdk.getAPI().emit('plugin.initialized', {
  plugin: '${this.manifest.name}',
  version: '${this.manifest.version}'
});</code></pre>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate changelog
   */
  private async generateChangelog(): Promise<void> {
    const changelog = this.generateChangelogContent();
    const filename = `CHANGELOG.${this.options.format === 'html' ? 'html' : 'md'}`;
    const filepath = path.join(this.options.outputDir, filename);
    
    fs.writeFileSync(filepath, changelog);
  }

  /**
   * Generate changelog content
   */
  private generateChangelogContent(): string {
    if (this.options.format === 'html') {
      return this.generateChangelogHTML();
    } else {
      return this.generateChangelogMarkdown();
    }
  }

  /**
   * Generate changelog markdown
   */
  private generateChangelogMarkdown(): string {
    return `# Changelog

All notable changes to this project will be documented in this file.

## [${this.manifest.version}] - ${new Date().toLocaleDateString()}

### Added
- Initial release of ${this.manifest.name}
- Basic plugin functionality
- API integration
- Documentation

### Changed
- N/A

### Fixed
- N/A

### Security
- N/A
`;
  }

  /**
   * Generate changelog HTML
   */
  private generateChangelogHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.manifest.name} Changelog</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1, h2, h3 { color: #333; }
        .version { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .version-title { font-size: 1.2em; font-weight: bold; color: #1976d2; margin-bottom: 10px; }
        .added { color: #2e7d32; }
        .changed { color: #f57c00; }
        .fixed { color: #d32f2f; }
        .security { color: #7b1fa2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Changelog</h1>
        <p>All notable changes to this project will be documented in this file.</p>
        
        <div class="version">
            <div class="version-title">[${this.manifest.version}] - ${new Date().toLocaleDateString()}</div>
            
            <h3 class="added">Added</h3>
            <ul>
                <li>Initial release of ${this.manifest.name}</li>
                <li>Basic plugin functionality</li>
                <li>API integration</li>
                <li>Documentation</li>
            </ul>
            
            <h3 class="changed">Changed</h3>
            <ul>
                <li>N/A</li>
            </ul>
            
            <h3 class="fixed">Fixed</h3>
            <ul>
                <li>N/A</li>
            </ul>
            
            <h3 class="security">Security</h3>
            <ul>
                <li>N/A</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate configuration file
   */
  private async generateConfigFile(): Promise<void> {
    const config = {
      name: this.manifest.name,
      version: this.manifest.version,
      description: this.manifest.description,
      author: this.manifest.author,
      license: this.manifest.license,
      homepage: this.manifest.homepage,
      repository: this.manifest.repository,
      keywords: this.manifest.keywords,
      categories: this.manifest.categories,
      healthcareCompliance: this.manifest.healthcareCompliance,
      permissions: this.manifest.permissions,
      resources: this.manifest.resources,
      settings: this.manifest.settings,
      dependencies: this.manifest.dependencies
    };

    const configPath = path.join(this.options.outputDir, 'plugin.config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}
