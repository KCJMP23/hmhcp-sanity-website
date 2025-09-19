// components/admin/ui/loading/AdminSpinner.tsx
import React from 'react';

interface AdminSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AdminSpinner: React.FC<AdminSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default AdminSpinner;
export { AdminSpinner };