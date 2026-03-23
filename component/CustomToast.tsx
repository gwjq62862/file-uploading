'use client'
import React, { useEffect } from "react";
import { X, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const CustomToast = ({ message, onClose }: ToastProps) => {
  // Auto-close after 4 seconds for better UX
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-[100] animate-in slide-in-from-right-5 fade-in duration-300">
      <div className="bg-white border-l-4 border-red-500 shadow-xl rounded-lg p-4 flex items-start gap-3 min-w-[300px] max-w-md">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Upload Error</p>
          <p className="text-xs text-gray-600 leading-relaxed mt-1">
            {message}
          </p>
        </div>

        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};