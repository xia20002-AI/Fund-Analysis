import React from 'react';
import { X } from 'lucide-react';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ message, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
      <span>{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-red-100 rounded">
        <X size={16} />
      </button>
    </div>
  );
};
