import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValidationStatusIndicator } from '../validation-status-indicator';
import { RealTimeValidationResult } from '@/lib/workflows/real-time-validator';

// Mock the UI components
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={`card ${className}`}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={`card-content ${className}`}>{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={`card-header ${className}`}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={`card-title ${className}`}>{children}</h3>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div className={`alert ${variant}`}>{children}</div>
  ),
  AlertDescription: ({ children }: any) => (
    <div className="alert-description">{children}</div>
  ),
  AlertTitle: ({ children }: any) => (
    <div className="alert-title">{children}</div>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={`progress ${className}`} data-value={value} />
  ),
}));

jest.mock('lucide-react', () => ({
  CheckCircle: () => <div data-testid="check-circle" />,
  XCircle: () => <div data-testid="x-circle" />,
  AlertTriangle: () => <div data-testid="alert-triangle" />,
  Info: () => <div data-testid="info" />,
  Clock: () => <div data-testid="clock" />,
  Zap: () => <div data-testid="zap" />,
  Shield: () => <div data-testid="shield" />,
  TrendingUp: () => <div data-testid="trending-up" />,
  Wrench: () => <div data-testid="wrench" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
  ChevronUp: () => <div data-testid="chevron-up" />,
}));

describe('ValidationStatusIndicator', () => {
  const mockValidationResult: RealTimeValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    complianceReport: {
      overallStatus: 'compliant',
      violations: [],
      recommendations: [],
    },
    performanceMetrics: {
      estimatedExecutionTimeMs: 1500,
      estimatedCostUnits: 0.05,
      optimizationPotential: 25,
    },
    timestamp: new Date(),
    validationTimeMs: 100,
    autoFixAvailable: false,
    severity: 'low',
  };

  const mockOnAutoFix = jest.fn();
  const mockOnViewDetails = jest.fn();
  const mockOnToggleDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render valid status correctly', () => {
    render(
      <ValidationStatusIndicator
        validationResult={mockValidationResult}
        onAutoFix={mockOnAutoFix}
        onViewDetails={mockOnViewDetails}
        showDetails={false}
        onToggleDetails={mockOnToggleDetails}
      />
    );

    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('0 errors, 0 warnings')).toBeInTheDocument();
    expect(screen.getByTestId('check-circle')).toBeInTheDocument();
  });

  it('should render invalid status with errors', () => {
    const invalidResult: RealTimeValidationResult = {
      ...mockValidationResult,
      isValid: false,
      errors: [
        {
          id: 'error1',
          type: 'structure',
          severity: 'error',
          message: 'Missing start node',
        },
      ],
      severity: 'critical',
    };

    render(
      <ValidationStatusIndicator
        validationResult={invalidResult}
        onAutoFix={mockOnAutoFix}
        onViewDetails={mockOnViewDetails}
        showDetails={false}
        onToggleDetails={mockOnToggleDetails}
      />
    );

    expect(screen.getByText('Critical Issues')).toBeInTheDocument();
    expect(screen.getByText('1 errors, 0 warnings')).toBeInTheDocument();
    expect(screen.getByTestId('x-circle')).toBeInTheDocument();
  });

  it('should render warnings correctly', () => {
    const warningResult: RealTimeValidationResult = {
      ...mockValidationResult,
      isValid: false,
      warnings: [
        {
          id: 'warning1',
          type: 'performance',
          severity: 'warning',
          message: 'Slow execution detected',
        },
      ],
      severity: 'medium',
    };

    render(
      <ValidationStatusIndicator
        validationResult={warningResult}
        onAutoFix={mockOnAutoFix}
        onViewDetails={mockOnViewDetails}
        showDetails={false}
        onToggleDetails={mockOnToggleDetails}
      />
    );

    expect(screen.getByText('Medium Priority Issues')).toBeInTheDocument();
    expect(screen.getByText('0 errors, 1 warnings')).toBeInTheDocument();
    expect(screen.getByTestId('alert-triangle')).toBeInTheDocument();
  });

  it('should display performance metrics', () => {
    render(
      <ValidationStatusIndicator
        validationResult={mockValidationResult}
        onAutoFix={mockOnAutoFix}
        onViewDetails={mockOnViewDetails}
        showDetails={false}
        onToggleDetails={mockOnToggleDetails}
      />
    );

    expect(screen.getByText('1500ms')).toBeInTheDocument();
    expect(screen.getByText('Compliant')).toBeInTheDocument();
    expect(screen.getByText('25% potential')).toBeInTheDocument();
  });

  it('should show validation time', () => {
    render(
      <ValidationStatusIndicator
        validationResult={mockValidationResult}
        onAutoFix={mockOnAutoFix}
        onViewDetails={mockOnViewDetails}
        showDetails={false}
        onToggleDetails={mockOnToggleDetails}
      />
    );

    expect(screen.getByText('100ms')).toBeInTheDocument();
  });

  it('should call onToggleDetails when toggle button is clicked', () => {
    render(
      <ValidationStatusIndicator
        validationResult={mockValidationResult}
        onAutoFix={mockOnAutoFix}
        onViewDetails={mockOnViewDetails}
        showDetails={false}
        onToggleDetails={mockOnToggleDetails}
      />
    );

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    expect(mockOnToggleDetails).toHaveBeenCalledTimes(1);
  });

  it('should show detailed information when showDetails is true', () => {
    const resultWithIssues: RealTimeValidationResult = {
      ...mockValidationResult,
      isValid: false,
      errors: [
        {
          id: 'error1',
          type: 'structure',
          severity: 'error',
          message: 'Missing start node',
          nodeId: 'node1',
        },
      ],
      warnings: [
        {
          id: 'warning1',
          type: 'performance',
          severity: 'warning',
          message: 'Slow execution detected',
          nodeId: 'node2',
        },
      ],
      suggestions: [
        {
          id: 'suggestion1',
          type: 'structure',
          message: 'Add a start node',
          details: 'Workflows must have at least one start node',
        },
      ],
      autoFixAvailable: true,
    };

    render(
      <ValidationStatusIndicator
        validationResult={resultWithIssues}
        onAutoFix={mockOnAutoFix}
        onViewDetails={mockOnViewDetails}
        showDetails={true}
        onToggleDetails={mockOnToggleDetails}
      />
    );

    expect(screen.getByText('Errors (1)')).toBeInTheDocument();
    expect(screen.getByText('Warnings (1)')).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Auto-fix Suggestions')).toBeInTheDocument();
  });

  it('should call onAutoFix when auto-fix button is clicked', () => {
    const resultWithAutoFix: RealTimeValidationResult = {
      ...mockValidationResult,
      suggestions: [
        {
          id: 'suggestion1',
          type: 'structure',
          message: 'Add a start node',
          details: 'Workflows must have at least one start node',
          autoFix: () => mockValidationResult,
        },
      ],
      autoFixAvailable: true,
    };

    render(
      <ValidationStatusIndicator
        validationResult={resultWithAutoFix}
        onAutoFix={mockOnAutoFix}
        onViewDetails={mockOnViewDetails}
        showDetails={true}
        onToggleDetails={mockOnToggleDetails}
      />
    );

    const autoFixButton = screen.getByText('Apply Auto-fix');
    fireEvent.click(autoFixButton);

    expect(mockOnAutoFix).toHaveBeenCalledWith('suggestion1');
  });

  it('should call onViewDetails when view details button is clicked', () => {
    const resultWithIssues: RealTimeValidationResult = {
      ...mockValidationResult,
      isValid: false,
      errors: [
        {
          id: 'error1',
          type: 'structure',
          severity: 'error',
          message: 'Missing start node',
        },
      ],
    };

    render(
      <ValidationStatusIndicator
        validationResult={resultWithIssues}
        onAutoFix={mockOnAutoFix}
        onViewDetails={mockOnViewDetails}
        showDetails={true}
        onToggleDetails={mockOnToggleDetails}
      />
    );

    const viewDetailsButton = screen.getByText('View Full Details');
    fireEvent.click(viewDetailsButton);

    expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
  });

  it('should display compliance status correctly', () => {
    const nonCompliantResult: RealTimeValidationResult = {
      ...mockValidationResult,
      complianceReport: {
        overallStatus: 'non-compliant',
        violations: [
          {
            rule: 'HIPAA-DATA-HANDLING',
            description: 'Node does not meet HIPAA requirements',
            severity: 'critical',
            nodeId: 'node1',
          },
        ],
        recommendations: [],
      },
    };

    render(
      <ValidationStatusIndicator
        validationResult={nonCompliantResult}
        onAutoFix={mockOnAutoFix}
        onViewDetails={mockOnViewDetails}
        showDetails={true}
        onToggleDetails={mockOnToggleDetails}
      />
    );

    expect(screen.getByText('Non-Compliant')).toBeInTheDocument();
    expect(screen.getByText('Compliance Issues')).toBeInTheDocument();
  });

  it('should handle performance warnings correctly', () => {
    const slowResult: RealTimeValidationResult = {
      ...mockValidationResult,
      performanceMetrics: {
        estimatedExecutionTimeMs: 15000,
        estimatedCostUnits: 0.1,
        optimizationPotential: 50,
      },
    };

    render(
      <ValidationStatusIndicator
        validationResult={slowResult}
        onAutoFix={mockOnAutoFix}
        onViewDetails={mockOnViewDetails}
        showDetails={true}
        onToggleDetails={mockOnToggleDetails}
      />
    );

    expect(screen.getAllByText('15000ms')).toHaveLength(2);
    expect(screen.getByText('50% potential')).toBeInTheDocument();
  });

  it('should show correct severity levels', () => {
    const testCases = [
      { severity: 'low' as const, expectedText: 'Valid' },
      { severity: 'medium' as const, expectedText: 'Medium Priority Issues' },
      { severity: 'high' as const, expectedText: 'High Priority Issues' },
      { severity: 'critical' as const, expectedText: 'Critical Issues' },
    ];

    testCases.forEach(({ severity, expectedText }) => {
      const result: RealTimeValidationResult = {
        ...mockValidationResult,
        isValid: severity === 'low',
        severity,
      };

      const { unmount } = render(
        <ValidationStatusIndicator
          validationResult={result}
          onAutoFix={mockOnAutoFix}
          onViewDetails={mockOnViewDetails}
          showDetails={false}
          onToggleDetails={mockOnToggleDetails}
        />
      );

      expect(screen.getByText(expectedText)).toBeInTheDocument();
      unmount();
    });
  });
});
