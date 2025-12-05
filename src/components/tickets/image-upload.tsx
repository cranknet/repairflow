'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CameraIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ImageCrop from './image-crop';
import { ImageModal } from './image-modal';
import { useLanguage } from '@/contexts/language-context';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (base64: string) => void;
  onRemove: () => void;
  onCropComplete?: () => void;
}

export function ImageUpload({ label, value, onChange, onRemove, onCropComplete }: ImageUploadProps) {
  const { t } = useLanguage();
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    // Ensure the cropped image is properly saved
    if (croppedImage && croppedImage.length > 0) {
      onChange(croppedImage);
      setShowCrop(false);
      setImageSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      // Call optional callback after crop is complete
      if (onCropComplete) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          onCropComplete();
        }, 100);
      }
    }
  };

  const handleCropCancel = () => {
    setShowCrop(false);
    setImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const startCamera = async () => {
    try {
      let stream: MediaStream;
      try {
        // First try to get the environment camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
      } catch (err) {
        // If that fails (e.g. no environment camera), try any available video device
        console.log('Environment camera not found or access denied, trying fallback to any video device...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      streamRef.current = stream;
      setShowCamera(true);
      // Wait for next tick to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.error('Error playing video:', err);
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback to file input with capture attribute
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        setImageSrc(imageData);
        setShowCrop(true);
        stopCamera();
      }
    }
  };

  const handleMainClick = () => {
    // Try to use MediaDevices API first (works on both mobile and desktop)
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      startCamera();
    } else {
      // Fallback to file input with capture attribute
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={`file-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
          id={`camera-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleMainClick}
        >
          <CameraIcon className="h-4 w-4 mr-2" />
          {t('takePhoto')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <PhotoIcon className="h-4 w-4 mr-2" />
          {t('uploadFile')}
        </Button>
      </div>

      {value && (
        <Card>
          <CardContent className="pt-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="w-full cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img
                  src={value}
                  alt={label}
                  className="w-full h-48 object-contain rounded border"
                />
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="absolute top-2 right-2"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showImageModal && value && (
        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imageSrc={value}
          title={label}
        />
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl mx-4">
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-[70vh] object-contain"
                style={{ display: 'block' }}
              />
              <div className="flex gap-2 p-4 justify-center bg-gray-900">
                <Button
                  type="button"
                  onClick={capturePhoto}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                  size="lg"
                >
                  <CameraIcon className="h-5 w-5 mr-2" />
                  {t('capturePhoto')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={stopCamera}
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCrop && imageSrc && (
        <ImageCrop
          imageSrc={imageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

