import React from 'react';
import { Package } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  message,
  icon,
  actionText,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-400 flex items-center justify-center mb-3">
        {icon || <Package className="w-6 h-6" />}
      </div>
      {title && <h4 className="text-base font-semibold text-slate-700 font-display mb-1">{title}</h4>}
      <p className="text-sm text-slate-500 max-w-sm mb-4 leading-relaxed">{message}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
