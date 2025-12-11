'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageModal } from './image-modal';
import { useLanguage } from '@/contexts/language-context';

interface DevicePhotosProps {
  frontImage?: string | null;
  backImage?: string | null;
}

export function DevicePhotos({ frontImage, backImage }: DevicePhotosProps) {
  const { t } = useLanguage();
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
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('devicePhotos')}</p>
        <div className="grid grid-cols-2 gap-4">
          {frontImage && (
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('front')}</p>
              <button
                type="button"
                onClick={() => openModal(frontImage, t('deviceFront'))}
                className="w-full cursor-pointer hover:opacity-90 transition-opacity relative h-48"
              >
                <Image
                  src={frontImage}
                  alt={t('deviceFront')}
                  fill
                  className="object-contain border rounded bg-gray-50 dark:bg-gray-800 hover:border-primary-500 transition-colors"
                  unoptimized
                />
              </button>
            </div>
          )}
          {backImage && (
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('back')}</p>
              <button
                type="button"
                onClick={() => openModal(backImage, t('deviceBack'))}
                className="w-full cursor-pointer hover:opacity-90 transition-opacity relative h-48"
              >
                <Image
                  src={backImage}
                  alt={t('deviceBack')}
                  fill
                  className="object-contain border rounded bg-gray-50 dark:bg-gray-800 hover:border-primary-500 transition-colors"
                  unoptimized
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

