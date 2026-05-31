import { AlertTriangle } from 'lucide-react';

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 border border-red-200 bg-red-50 text-red-700 rounded-lg p-3">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
