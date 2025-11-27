'use client';

import { useState } from 'react';
import { ImageModal } from './image-modal';

interface DevicePhotosProps {
  frontImage?: string | null;
  backImage?: string | null;
}

export function DevicePhotos({ frontImage, backImage }: DevicePhotosProps) {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');

  const openModal = (imageSrc: string, title: string) => {
    setModalImage(imageSrc);
    setModalTitle(title);
  };

  const closeModal = () => {
    setModalImage(null);
    setModalTitle('');
  };

  if (!frontImage && !backImage) {
    return null;
  }

  return (
    <>
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Device Photos</p>
        <div className="grid grid-cols-2 gap-4">
          {frontImage && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Front</p>
              <button
                type="button"
                onClick={() => openModal(frontImage, 'Device Front')}
                className="w-full cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img
                  src={frontImage}
                  alt="Device Front"
                  className="w-full h-48 object-contain border rounded bg-gray-50 dark:bg-gray-800 hover:border-primary-500 transition-colors"
                />
              </button>
            </div>
          )}
          {backImage && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Back</p>
              <button
                type="button"
                onClick={() => openModal(backImage, 'Device Back')}
                className="w-full cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img
                  src={backImage}
                  alt="Device Back"
                  className="w-full h-48 object-contain border rounded bg-gray-50 dark:bg-gray-800 hover:border-primary-500 transition-colors"
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {modalImage && (
        <ImageModal
          isOpen={!!modalImage}
          onClose={closeModal}
          imageSrc={modalImage}
          title={modalTitle}
        />
      )}
    </>
  );
}

