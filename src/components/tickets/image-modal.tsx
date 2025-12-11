'use client';

import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  title: string;
}

export function ImageModal({ isOpen, onClose, imageSrc, title }: ImageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="h-8 w-8" />
        </button>
        <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-contain"
            unoptimized
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg z-10">
            <p className="text-sm font-medium">{title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

