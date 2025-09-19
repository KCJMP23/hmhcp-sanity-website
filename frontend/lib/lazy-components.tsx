import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

// Lazy load heavy components
export const LazyDialog = dynamic(
  () => import('@/components/ui/dialog').then(mod => ({ default: mod.Dialog })),
  { loading: LoadingSpinner, ssr: false }
);

export const LazyDropdownMenu = dynamic(
  () => import('@/components/ui/dropdown-menu').then(mod => ({ default: mod.DropdownMenu })),
  { loading: LoadingSpinner, ssr: false }
);

export const LazySelect = dynamic(
  () => import('@/components/ui/select').then(mod => ({ default: mod.Select })),
  { loading: LoadingSpinner, ssr: false }
);

export const LazyToast = dynamic(
  () => import('@/components/ui/toast').then(mod => ({ default: mod.Toast })),
  { loading: LoadingSpinner, ssr: false }
);

export const LazySheet = dynamic(
  () => import('@/components/ui/sheet').then(mod => ({ default: mod.Sheet })),
  { loading: LoadingSpinner, ssr: false }
);

export const LazyCommand = dynamic(
  () => import('@/components/ui/command').then(mod => ({ default: mod.Command })),
  { loading: LoadingSpinner, ssr: false }
);

export const LazyDataTable = dynamic(
  () => import('@/components/ui/data-table').then(mod => ({ default: mod.DataTable })),
  { loading: LoadingSpinner, ssr: false }
);

// Create lazy wrapper for any component
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading || LoadingSpinner,
    ssr: options?.ssr ?? false,
  });
}

// Preload components for better UX
export function preloadComponent(componentName: string) {
  switch (componentName) {
    case 'Dialog':
      import('@/components/ui/dialog');
      break;
    case 'DropdownMenu':
      import('@/components/ui/dropdown-menu');
      break;
    case 'Select':
      import('@/components/ui/select');
      break;
    case 'Toast':
      import('@/components/ui/toast');
      break;
    case 'Sheet':
      import('@/components/ui/sheet');
      break;
    case 'Command':
      import('@/components/ui/command');
      break;
    default:
      break;
  }
}
