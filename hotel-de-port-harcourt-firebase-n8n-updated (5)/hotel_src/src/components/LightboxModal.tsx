// src/components/LightboxModal.tsx
// Interactive photo gallery lightbox

import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  url: string;
  description: string;
}

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryItem[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  items,
  currentIndex,
  onSelectIndex
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onSelectIndex((currentIndex + 1) % items.length);
      if (e.key === 'ArrowLeft') onSelectIndex((currentIndex - 1 + items.length) % items.length);
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentIndex, items.length, onClose, onSelectIndex]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A24B]"
        aria-label="Close photo viewer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev button */}
      <button
        onClick={() => onSelectIndex((currentIndex - 1 + items.length) % items.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 text-white hover:bg-[#C9A24B] hover:text-[#0A1A2F] transition-all focus:outline-none"
        aria-label="Previous photo"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Next button */}
      <button
        onClick={() => onSelectIndex((currentIndex + 1) % items.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 text-white hover:bg-[#C9A24B] hover:text-[#0A1A2F] transition-all focus:outline-none"
        aria-label="Next photo"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main Image & Caption */}
      <div className="max-w-5xl w-full flex flex-col items-center">
        <div className="relative max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded-xl shadow-2xl">
          <img
            src={currentItem.url}
            alt={currentItem.title}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl select-none"
          />
        </div>

        <div className="mt-4 text-center max-w-xl text-white">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest text-[#C9A24B] font-semibold">
              {currentItem.category}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">
              {currentIndex + 1} of {items.length}
            </span>
          </div>
          <h3 className="font-serif text-xl font-bold text-white">
            {currentItem.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {currentItem.description}
          </p>
        </div>
      </div>
    </div>
  );
};
