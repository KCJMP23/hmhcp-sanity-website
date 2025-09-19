'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertCircle, XCircle, Calendar } from 'lucide-react';
import { WidgetProps } from '@/types/admin/dashboard';
import { useDashboard } from '../dashboard-provider';

export function ComplianceWidget({ widget, isCustomizing }: WidgetProps) {
  const { state } = useDashboard();
  const { complianceStatus } = state.realTimeData;

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'violation':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'violation':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getComplianceText = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'Compliant';
      case 'warning':
        return 'Warning';
      case 'violation':
        return 'Violation';
      default:
        return 'Unknown';
    }
  };

  return (
    <motion.div
      layout
      className={`bg-white rounded-lg border border-gray-200 p-6 h-full ${
        isCustomizing ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Healthcare Compliance</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Shield className="w-4 h-4" />
          <span>Monitoring</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border-l-4 border-green-500 bg-green-50">
          <div className="flex items-center space-x-3">
            {getComplianceIcon(complianceStatus?.hipaa || 'unknown')}
            <div>
              <h4 className="font-medium text-gray-900">HIPAA Compliance</h4>
              <p className={`text-sm font-medium ${getComplianceColor(complianceStatus?.hipaa || 'unknown').split(' ')[0]}`}>
                {getComplianceText(complianceStatus?.hipaa || 'unknown')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border-l-4 border-green-500 bg-green-50">
          <div className="flex items-center space-x-3">
            {getComplianceIcon(complianceStatus?.fda || 'unknown')}
            <div>
              <h4 className="font-medium text-gray-900">FDA Compliance</h4>
              <p className={`text-sm font-medium ${getComplianceColor(complianceStatus?.fda || 'unknown').split(' ')[0]}`}>
                {getComplianceText(complianceStatus?.fda || 'unknown')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Audit Score</p>
            <p className="text-lg font-bold text-green-600">98%</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Risk Level</p>
            <p className="text-lg font-bold text-green-600">Low</p>
          </div>
        </div>
      </div>

      {complianceStatus?.lastAudit && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>
              Last audit: {new Date(complianceStatus.lastAudit).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
