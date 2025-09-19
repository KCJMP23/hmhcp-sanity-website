/**
 * Component Override System - Component styling and behavior override system
 * Healthcare-focused component customization with accessibility compliance
 */

import { 
  ComponentOverride, 
  OverrideTemplate, 
  ValidationResult, 
  OverrideCondition,
  ValidationError,
  ValidationWarning
} from '@/types/themes/theme-types';

export class ComponentOverrideSystem {
  private overrides: Map<string, ComponentOverride[]> = new Map();
  private templates: Map<string, OverrideTemplate> = new Map();

  /**
   * Create component override
   */
  async createOverride(override: ComponentOverride): Promise<ComponentOverride> {
    try {
      // Validate override
      const validation = await this.validateOverride(override);
      if (!validation.valid) {
        throw new Error(`Override validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Generate unique ID if not provided
      if (!override.id) {
        override.id = `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Store override
      const componentOverrides = this.overrides.get(override.component_name) || [];
      componentOverrides.push(override);
      this.overrides.set(override.component_name, componentOverrides);

      // Log override creation
      await this.logOverrideCreation(override);

      return override;
    } catch (error) {
      console.error('Failed to create component override:', error);
      throw new Error(`Failed to create component override: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update component override
   */
  async updateOverride(overrideId: string, override: Partial<ComponentOverride>): Promise<ComponentOverride> {
    try {
      // Find existing override
      const existingOverride = await this.findOverrideById(overrideId);
      if (!existingOverride) {
        throw new Error(`Override with ID ${overrideId} not found`);
      }

      // Merge updates
      const updatedOverride: ComponentOverride = {
        ...existingOverride,
        ...override,
        id: overrideId // Ensure ID doesn't change
      };

      // Validate updated override
      const validation = await this.validateOverride(updatedOverride);
      if (!validation.valid) {
        throw new Error(`Override validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Update override
      await this.updateOverrideInStorage(overrideId, updatedOverride);

      // Log override update
      await this.logOverrideUpdate(overrideId, override);

      return updatedOverride;
    } catch (error) {
      console.error('Failed to update component override:', error);
      throw new Error(`Failed to update component override: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete component override
   */
  async deleteOverride(overrideId: string): Promise<void> {
    try {
      // Find and remove override
      const removed = await this.removeOverrideFromStorage(overrideId);
      if (!removed) {
        throw new Error(`Override with ID ${overrideId} not found`);
      }

      // Log override deletion
      await this.logOverrideDeletion(overrideId);
    } catch (error) {
      console.error('Failed to delete component override:', error);
      throw new Error(`Failed to delete component override: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get overrides for a component
   */
  async getOverrides(componentName: string): Promise<ComponentOverride[]> {
    try {
      const overrides = this.overrides.get(componentName) || [];
      
      // Sort by priority (higher priority first)
      return overrides.sort((a, b) => b.priority - a.priority);
    } catch (error) {
      console.error('Failed to get component overrides:', error);
      throw new Error(`Failed to get component overrides: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply overrides to component props
   */
  async applyOverrides(componentName: string, props: any): Promise<any> {
    try {
      const overrides = await this.getOverrides(componentName);
      let modifiedProps = { ...props };

      // Apply each override in priority order
      for (const override of overrides) {
        // Check if override conditions are met
        if (await this.checkOverrideConditions(override, props)) {
          modifiedProps = await this.applyOverride(override, modifiedProps);
        }
      }

      return modifiedProps;
    } catch (error) {
      console.error('Failed to apply component overrides:', error);
      throw new Error(`Failed to apply component overrides: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate component override
   */
  async validateOverride(override: ComponentOverride): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let healthcareCompliant = true;
    let accessibilityCompliant = true;

    // Validate required fields
    if (!override.id) {
      errors.push({
        field: 'id',
        message: 'Override ID is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide unique override ID'
      });
    }

    if (!override.component_name) {
      errors.push({
        field: 'component_name',
        message: 'Component name is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Specify target component name'
      });
    }

    if (!override.override_type) {
      errors.push({
        field: 'override_type',
        message: 'Override type is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Specify override type (css, js, tsx, template)'
      });
    }

    if (!override.override_content) {
      errors.push({
        field: 'override_content',
        message: 'Override content is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide override content'
      });
    }

    // Validate override type specific content
    if (override.override_type === 'css') {
      const cssValidation = await this.validateCSSOverride(override.override_content);
      errors.push(...cssValidation.errors);
      warnings.push(...cssValidation.warnings);
    } else if (override.override_type === 'js') {
      const jsValidation = await this.validateJSOverride(override.override_content);
      errors.push(...jsValidation.errors);
      warnings.push(...jsValidation.warnings);
    } else if (override.override_type === 'tsx') {
      const tsxValidation = await this.validateTSXOverride(override.override_content);
      errors.push(...tsxValidation.errors);
      warnings.push(...tsxValidation.warnings);
    }

    // Validate healthcare compliance
    if (!override.healthcare_compliant) {
      warnings.push({
        field: 'healthcare_compliant',
        message: 'Override should be healthcare compliant',
        recommendation: 'Ensure override follows healthcare data handling guidelines',
        healthcare_impact: true
      });
    }

    // Validate accessibility compliance
    if (!override.accessibility_compliant) {
      warnings.push({
        field: 'accessibility_compliant',
        message: 'Override should be accessibility compliant',
        recommendation: 'Ensure override follows WCAG guidelines',
        healthcare_impact: true
      });
    }

    // Validate priority
    if (override.priority < 0 || override.priority > 1000) {
      warnings.push({
        field: 'priority',
        message: 'Priority should be between 0 and 1000',
        recommendation: 'Use priority values between 0 and 1000',
        healthcare_impact: false
      });
    }

    // Validate conditions
    if (override.conditions && override.conditions.length > 0) {
      for (const condition of override.conditions) {
        const conditionValidation = await this.validateOverrideCondition(condition);
        errors.push(...conditionValidation.errors);
        warnings.push(...conditionValidation.warnings);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      healthcare_compliant: healthcareCompliant,
      accessibility_compliant: accessibilityCompliant
    };
  }

  /**
   * Get override templates
   */
  async getOverrideTemplates(): Promise<OverrideTemplate[]> {
    try {
      // Load templates if not already loaded
      if (this.templates.size === 0) {
        await this.loadOverrideTemplates();
      }

      return Array.from(this.templates.values());
    } catch (error) {
      console.error('Failed to get override templates:', error);
      throw new Error(`Failed to get override templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private async findOverrideById(overrideId: string): Promise<ComponentOverride | null> {
    for (const overrides of this.overrides.values()) {
      const override = overrides.find(o => o.id === overrideId);
      if (override) {
        return override;
      }
    }
    return null;
  }

  private async updateOverrideInStorage(overrideId: string, override: ComponentOverride): Promise<void> {
    for (const [componentName, overrides] of this.overrides.entries()) {
      const index = overrides.findIndex(o => o.id === overrideId);
      if (index !== -1) {
        overrides[index] = override;
        this.overrides.set(componentName, overrides);
        return;
      }
    }
  }

  private async removeOverrideFromStorage(overrideId: string): Promise<boolean> {
    for (const [componentName, overrides] of this.overrides.entries()) {
      const index = overrides.findIndex(o => o.id === overrideId);
      if (index !== -1) {
        overrides.splice(index, 1);
        this.overrides.set(componentName, overrides);
        return true;
      }
    }
    return false;
  }

  private async checkOverrideConditions(override: ComponentOverride, props: any): Promise<boolean> {
    if (!override.conditions || override.conditions.length === 0) {
      return true;
    }

    for (const condition of override.conditions) {
      if (!await this.evaluateCondition(condition, props)) {
        return false;
      }
    }

    return true;
  }

  private async evaluateCondition(condition: OverrideCondition, props: any): Promise<boolean> {
    const { type, value, operator } = condition;
    let targetValue: any;

    switch (type) {
      case 'user_role':
        targetValue = props.userRole;
        break;
      case 'organization':
        targetValue = props.organizationId;
        break;
      case 'theme':
        targetValue = props.themeId;
        break;
      case 'device':
        targetValue = props.deviceType;
        break;
      case 'custom':
        targetValue = props[value];
        break;
      default:
        return false;
    }

    switch (operator) {
      case 'equals':
        return targetValue === value;
      case 'not_equals':
        return targetValue !== value;
      case 'contains':
        return typeof targetValue === 'string' && targetValue.includes(value);
      case 'not_contains':
        return typeof targetValue === 'string' && !targetValue.includes(value);
      case 'regex':
        return new RegExp(value).test(targetValue);
      default:
        return false;
    }
  }

  private async applyOverride(override: ComponentOverride, props: any): Promise<any> {
    switch (override.override_type) {
      case 'css':
        return await this.applyCSSOverride(override, props);
      case 'js':
        return await this.applyJSOverride(override, props);
      case 'tsx':
        return await this.applyTSXOverride(override, props);
      case 'template':
        return await this.applyTemplateOverride(override, props);
      default:
        return props;
    }
  }

  private async applyCSSOverride(override: ComponentOverride, props: any): Promise<any> {
    // Apply CSS overrides to component props
    const cssOverrides = props.cssOverrides || {};
    cssOverrides[override.component_path] = override.override_content;
    
    return {
      ...props,
      cssOverrides
    };
  }

  private async applyJSOverride(override: ComponentOverride, props: any): Promise<any> {
    // Apply JavaScript overrides to component props
    try {
      const jsFunction = new Function('props', override.override_content);
      return jsFunction(props);
    } catch (error) {
      console.error('Failed to apply JS override:', error);
      return props;
    }
  }

  private async applyTSXOverride(override: ComponentOverride, props: any): Promise<any> {
    // Apply TSX overrides to component props
    // This would typically involve more complex component replacement logic
    return {
      ...props,
      tsxOverride: override.override_content
    };
  }

  private async applyTemplateOverride(override: ComponentOverride, props: any): Promise<any> {
    // Apply template overrides to component props
    return {
      ...props,
      templateOverride: override.override_content
    };
  }

  private async validateCSSOverride(content: string): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic CSS validation
    if (!content.trim()) {
      errors.push({
        field: 'override_content',
        message: 'CSS content cannot be empty',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide valid CSS content'
      });
    }

    // Check for potentially dangerous CSS
    const dangerousPatterns = [
      /javascript:/i,
      /expression\s*\(/i,
      /url\s*\(\s*javascript:/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        errors.push({
          field: 'override_content',
          message: 'CSS contains potentially dangerous content',
          severity: 'error',
          healthcare_impact: true,
          resolution: 'Remove JavaScript or expression content from CSS'
        });
      }
    }

    return { errors, warnings };
  }

  private async validateJSOverride(content: string): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic JavaScript validation
    if (!content.trim()) {
      errors.push({
        field: 'override_content',
        message: 'JavaScript content cannot be empty',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide valid JavaScript content'
      });
    }

    // Check for potentially dangerous JavaScript
    const dangerousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      /document\.write/i,
      /innerHTML\s*=/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        warnings.push({
          field: 'override_content',
          message: 'JavaScript contains potentially dangerous patterns',
          recommendation: 'Avoid using eval, Function constructor, or DOM manipulation',
          healthcare_impact: true
        });
      }
    }

    return { errors, warnings };
  }

  private async validateTSXOverride(content: string): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic TSX validation
    if (!content.trim()) {
      errors.push({
        field: 'override_content',
        message: 'TSX content cannot be empty',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Provide valid TSX content'
      });
    }

    // Check for React component structure
    if (!content.includes('return') && !content.includes('React')) {
      warnings.push({
        field: 'override_content',
        message: 'TSX content should return valid React elements',
        recommendation: 'Ensure TSX content returns JSX elements',
        healthcare_impact: false
      });
    }

    return { errors, warnings };
  }

  private async validateOverrideCondition(condition: OverrideCondition): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!condition.type) {
      errors.push({
        field: 'condition.type',
        message: 'Condition type is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Specify condition type'
      });
    }

    if (!condition.value) {
      errors.push({
        field: 'condition.value',
        message: 'Condition value is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Specify condition value'
      });
    }

    if (!condition.operator) {
      errors.push({
        field: 'condition.operator',
        message: 'Condition operator is required',
        severity: 'error',
        healthcare_impact: false,
        resolution: 'Specify condition operator'
      });
    }

    return { errors, warnings };
  }

  private async loadOverrideTemplates(): Promise<void> {
    // Load override templates from database or file system
    const templates: OverrideTemplate[] = [
      {
        id: 'css-styling',
        name: 'CSS Styling Override',
        description: 'Override component styling with custom CSS',
        component_name: 'any',
        override_type: 'css',
        template_content: '/* Custom CSS for component */\n.component-name {\n  /* Add your styles here */\n}',
        healthcare_optimized: true,
        accessibility_compliant: true,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'js-behavior',
        name: 'JavaScript Behavior Override',
        description: 'Override component behavior with custom JavaScript',
        component_name: 'any',
        override_type: 'js',
        template_content: '// Custom JavaScript for component\nreturn {\n  ...props,\n  // Add your modifications here\n};',
        healthcare_optimized: true,
        accessibility_compliant: true,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'tsx-component',
        name: 'TSX Component Override',
        description: 'Override component with custom TSX',
        component_name: 'any',
        override_type: 'tsx',
        template_content: '// Custom TSX component\nimport React from \'react\';\n\nexport const CustomComponent = (props) => {\n  return (\n    <div className="custom-component">\n      {/* Add your JSX here */}\n    </div>\n  );\n};',
        healthcare_optimized: true,
        accessibility_compliant: true,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const template of templates) {
      this.templates.set(template.id, template);
    }
  }

  private async logOverrideCreation(override: ComponentOverride): Promise<void> {
    // Implementation for logging override creation
  }

  private async logOverrideUpdate(overrideId: string, changes: Partial<ComponentOverride>): Promise<void> {
    // Implementation for logging override update
  }

  private async logOverrideDeletion(overrideId: string): Promise<void> {
    // Implementation for logging override deletion
  }
}
