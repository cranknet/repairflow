'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { DeviceData } from '../new-ticket-wizard';
import { DEVICE_BRANDS, DEVICE_MODELS } from '@/lib/device-brands';
import { getAllBrands, getAllModels, addCustomBrand, addCustomModel } from '@/lib/device-storage';
import { useCamera } from '@/lib/hooks/use-camera';
import ImageCrop from '../image-crop';
import {
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  WifiIcon,
  DevicePhoneMobileIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  VideoCameraSlashIcon,
} from '@heroicons/react/24/outline';

interface StepDeviceDetectionProps {
  data: DeviceData;
  onChange: (data: DeviceData) => void;
}

type DetectionStatus = 'idle' | 'detecting' | 'success' | 'error';

export function StepDeviceDetection({ data, onChange }: StepDeviceDetectionProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>('idle');
  const [detectionError, setDetectionError] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [showFrontPhoto, setShowFrontPhoto] = useState(false);

  // Image capture state
  const [showCrop, setShowCrop] = useState<'front' | 'back' | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState<'front' | 'back' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const frontCameraRef = useRef<HTMLInputElement>(null);
  const backCameraRef = useRef<HTMLInputElement>(null);

  // Autocomplete state
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [filteredBrands, setFilteredBrands] = useState<string[]>([]);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check online status and AI configuration
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check AI configuration
    fetch('/api/ai/detect-device')
      .then(res => res.json())
      .then(data => setAiConfigured(data.configured))
      .catch(() => setAiConfigured(false));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize brands
  useEffect(() => {
    setFilteredBrands(getAllBrands(DEVICE_BRANDS));
  }, []);

  // Update models when brand changes
  useEffect(() => {
    if (data.brand) {
      const defaultModels = DEVICE_MODELS[data.brand] || [];
      setFilteredModels(getAllModels(data.brand, defaultModels));
    } else {
      setFilteredModels([]);
    }
  }, [data.brand]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBrandDropdown(false);
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runAIDetection = useCallback(async () => {
    if (!data.backImage) return;

    setDetectionStatus('detecting');
    setDetectionError('');

    try {
      // Only send the back image for AI detection
      const images = [data.backImage];

      const response = await fetch('/api/ai/detect-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          brandHint: data.brand || undefined, // Send brand as hint if already selected
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Detection failed');
      }

      if (result.brand && result.model) {
        onChange({
          ...data,
          brand: result.brand,
          model: result.model,
          color: result.color || data.color,
        });
        setConfidence(result.confidence || 0);
        setDetectionStatus('success');
        toast({
          title: t('deviceDetected'),
          description: `${result.brand} ${result.model}${result.color ? ` (${result.color})` : ''}`,
        });
      } else if (result.brand || result.model) {
        // Partial detection
        onChange({
          ...data,
          brand: result.brand || data.brand,
          model: result.model || data.model,
          color: result.color || data.color,
        });
        setConfidence(result.confidence || 0);
        setDetectionStatus('success');
        toast({
          title: t('partialDetection') || 'Partial Detection',
          description: t('completeManually') || 'Please complete missing fields manually',
        });
      } else {
        setDetectionStatus('error');
        const errorMsg = t('detectionFailed');
        setDetectionError(errorMsg);
        toast({
          title: t('detectionFailed'),
          description: t('enterManually'),
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('AI detection error:', error);
      setDetectionStatus('error');
      const errorMsg = error.message || t('detectionFailed');
      setDetectionError(errorMsg);
      toast({
        title: t('detectionFailed'),
        description: errorMsg + '. ' + t('enterManually'),
        variant: 'destructive',
      });
    }
  }, [data, onChange, toast, t]);

  // Trigger AI detection when back image is available
  useEffect(() => {
    if (data.backImage && isOnline && aiConfigured && detectionStatus === 'idle') {
      runAIDetection();
    }
  }, [data.backImage, isOnline, aiConfigured, detectionStatus, runAIDetection]);

  // File/Camera handlers
  const handleFileSelect = (type: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCrop(type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    if (showCrop === 'front') {
      onChange({ ...data, frontImage: croppedImage });
    } else if (showCrop === 'back') {
      onChange({ ...data, backImage: croppedImage });
    }
    setShowCrop(null);
    setImageSrc(null);
    // Reset detection status to allow re-detection when back photo changes
    if (showCrop === 'back' && detectionStatus !== 'idle') {
      setDetectionStatus('idle');
    }
  };

  const handleCropCancel = () => {
    setShowCrop(null);
    setImageSrc(null);
  };

  const removeImage = (type: 'front' | 'back') => {
    if (type === 'front') {
      onChange({ ...data, frontImage: '' });
    } else {
      onChange({ ...data, backImage: '' });
    }
    if (type === 'back') {
      setDetectionStatus('idle');
    }
  };

  // Camera hook for platform detection and availability checking
  const { state: cameraState, isMobileDevice, requestAccess, stopStream: stopCameraStream } = useCamera();

  /**
   * Handle "Take Photo" button click based on platform:
   * - Mobile: Use native camera app via file input with capture attribute
   * - Desktop with camera: Show embedded camera modal
   * - Desktop without camera: Button is disabled (handled in UI)
   */
  const handleTakePhoto = (type: 'front' | 'back') => {
    if (isMobileDevice) {
      // On mobile, trigger native camera app
      if (type === 'front') {
        frontCameraRef.current?.click();
      } else {
        backCameraRef.current?.click();
      }
    } else {
      // On desktop, show embedded camera modal
      startCamera(type);
    }
  };

  // Camera handling for desktop embedded modal
  const startCamera = async (type: 'front' | 'back') => {
    const stream = await requestAccess('environment');

    if (stream) {
      streamRef.current = stream;
      setShowCamera(type);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } else if (cameraState.error) {
      // Show error toast on camera failure
      toast({
        title: t('camera.error') || 'Camera Error',
        description: cameraState.errorMessage || t('camera.accessFailed') || 'Failed to access camera',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    stopCameraStream();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(null);
  };

  // Determine if camera button should be disabled on desktop
  const isCameraDisabled = !isMobileDevice && cameraState.isAvailable === false;
  const cameraDisabledReason = isCameraDisabled
    ? (cameraState.errorMessage || t('camera.notAvailable') || 'No camera detected')
    : undefined;

  const capturePhoto = () => {
    if (videoRef.current && showCamera) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        setImageSrc(imageData);
        setShowCrop(showCamera);
        stopCamera();
      }
    }
  };

  // Brand/Model autocomplete handlers
  const handleBrandInput = (value: string) => {
    onChange({ ...data, brand: value, model: '' });
    if (value) {
      const allBrands = getAllBrands(DEVICE_BRANDS);
      const filtered = allBrands.filter((b) =>
        b.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredBrands(filtered);
      const exactMatch = allBrands.some((b) => b.toLowerCase() === value.toLowerCase());
      setShowAddBrand(!exactMatch && value.trim().length > 0);
      setShowBrandDropdown(true);
    } else {
      setFilteredBrands(getAllBrands(DEVICE_BRANDS));
      setShowAddBrand(false);
      setShowBrandDropdown(false);
    }
  };

  const handleModelInput = (value: string) => {
    onChange({ ...data, model: value });
    if (value && data.brand) {
      const defaultModels = DEVICE_MODELS[data.brand] || [];
      const allModels = getAllModels(data.brand, defaultModels);
      const filtered = allModels.filter((m) =>
        m.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredModels(filtered);
      const exactMatch = allModels.some((m) => m.toLowerCase() === value.toLowerCase());
      setShowAddModel(!exactMatch && value.trim().length > 0);
      setShowModelDropdown(true);
    } else {
      setShowModelDropdown(false);
      setShowAddModel(false);
    }
  };

  const selectBrand = (selectedBrand: string) => {
    onChange({ ...data, brand: selectedBrand, model: '' });
    setShowBrandDropdown(false);
    setShowAddBrand(false);
  };

  const selectModel = (selectedModel: string) => {
    onChange({ ...data, model: selectedModel });
    setShowModelDropdown(false);
    setShowAddModel(false);
  };

  const handleAddBrand = () => {
    const newBrand = data.brand.trim();
    if (newBrand) {
      addCustomBrand(newBrand);
      selectBrand(newBrand);
      setFilteredBrands(getAllBrands(DEVICE_BRANDS));
    }
  };

  const handleAddModel = () => {
    const newModel = data.model.trim();
    if (newModel && data.brand) {
      addCustomModel(data.brand, newModel);
      selectModel(newModel);
      const defaultModels = DEVICE_MODELS[data.brand] || [];
      setFilteredModels(getAllModels(data.brand, defaultModels));
    }
  };

  const showAIFeatures = isOnline && aiConfigured;

  return (
    <div className="space-y-5">
      {/* Offline/No AI Warning */}
      {!isOnline && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <WifiIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {t('offlineMode')} - {t('manualEntryOnly')}
          </p>
        </div>
      )}

      {isOnline && aiConfigured === false && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t('aiNotConfigured')} - {t('manualEntryOnly')}
          </p>
        </div>
      )}

      {/* Brand Selection - First for better AI detection */}
      {showAIFeatures && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <DevicePhoneMobileIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">{t('knowTheBrand') || 'Know the brand?'}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('brandHintHelps') || 'Selecting the brand first helps AI identify the exact model more accurately'}
                </p>
                <div className="relative" ref={dropdownRef}>
                  <Input
                    id="brandHint"
                    value={data.brand}
                    onChange={(e) => handleBrandInput(e.target.value)}
                    onFocus={() => {
                      if (data.brand) {
                        handleBrandInput(data.brand);
                      } else {
                        setShowBrandDropdown(true);
                      }
                    }}
                    placeholder={t('selectBrandOptional') || 'Select brand (optional)'}
                    autoComplete="off"
                    className="text-sm"
                  />
                  {showBrandDropdown && (filteredBrands.length > 0 || showAddBrand) && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-auto">
                      {filteredBrands.slice(0, 10).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => selectBrand(b)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                        >
                          {b}
                        </button>
                      ))}
                      {showAddBrand && (
                        <button
                          type="button"
                          onClick={handleAddBrand}
                          className="w-full text-left px-3 py-2 hover:bg-primary-100 dark:hover:bg-primary-900 text-sm text-primary-600 dark:text-primary-400 font-medium border-t border-gray-300 dark:border-gray-700 flex items-center gap-2"
                        >
                          <PlusIcon className="h-4 w-4" />
                          {t('addAsNewBrand', { brand: data.brand })}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back Photo - Primary for AI Detection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
            {t('deviceBackPhoto')}
            {showAIFeatures && (
              <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {t('forAIDetection') || 'For AI'}
              </span>
            )}
          </Label>
        </div>

        <Card className="overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
          <CardContent className="p-3 sm:p-4">
            {data.backImage ? (
              <div className="relative h-40 sm:h-52">
                <Image
                  src={data.backImage}
                  alt={t('deviceBack')}
                  fill
                  className="object-contain rounded border bg-gray-50 dark:bg-gray-800"
                  unoptimized
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage('back')}
                  className="absolute top-2 right-2 bg-white/80 dark:bg-gray-900/80 h-8 w-8 p-0 z-10"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="h-40 sm:h-52 rounded-lg flex flex-col items-center justify-center gap-3 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CameraIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-center text-muted-foreground px-4">
                  {t('captureBackPhoto') || 'Take a photo of the device back for AI detection'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    onClick={() => handleTakePhoto('back')}
                    disabled={isCameraDisabled}
                    title={cameraDisabledReason}
                    className="text-sm"
                  >
                    {isCameraDisabled ? (
                      <VideoCameraSlashIcon className="h-4 w-4 mr-2" />
                    ) : (
                      <CameraIcon className="h-4 w-4 mr-2" />
                    )}
                    {isCameraDisabled
                      ? (t('camera.notAvailable') || 'No camera')
                      : t('takePhoto')}
                  </Button>
                  <Button
                    type="button"
                    variant={isCameraDisabled ? 'default' : 'outline'}
                    onClick={() => backInputRef.current?.click()}
                    className="text-sm"
                  >
                    <PhotoIcon className="h-4 w-4 mr-2" />
                    {t('uploadFile')}
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={backInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect('back')}
              className="hidden"
            />
            <input
              ref={backCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect('back')}
              className="hidden"
            />
          </CardContent>
        </Card>
      </div>

      {/* AI Detection Status */}
      {showAIFeatures && data.backImage && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {detectionStatus === 'detecting' && (
            <>
              <ArrowPathIcon className="w-5 h-5 text-primary-600 animate-spin shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('detectingDevice')}...
              </span>
            </>
          )}

          {detectionStatus === 'success' && (
            <>
              <CheckCircleIcon className="w-5 h-5 text-green-600 shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-400 flex-1">
                {t('deviceDetected')} ({confidence}% {t('confidence')})
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setDetectionStatus('idle'); runAIDetection(); }}
                className="h-8"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </Button>
            </>
          )}

          {detectionStatus === 'error' && (
            <>
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-sm text-amber-700 dark:text-amber-400 flex-1 line-clamp-1">
                {detectionError}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setDetectionStatus('idle'); runAIDetection(); }}
                className="h-8"
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">{t('retry') || 'Retry'}</span>
              </Button>
            </>
          )}
        </div>
      )}

      {/* Front Photo - Optional for Documentation */}
      <div>
        <button
          type="button"
          onClick={() => setShowFrontPhoto(!showFrontPhoto)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          {showFrontPhoto ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
          <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs flex items-center justify-center font-medium">2</span>
          {t('deviceFrontPhoto')}
          <span className="text-xs opacity-60">({t('optional')})</span>
          {data.frontImage && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
        </button>

        {showFrontPhoto && (
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground mb-3">
                {t('frontPhotoForDocs') || 'Front photo is for condition records only, not used for AI detection'}
              </p>

              {data.frontImage ? (
                <div className="relative h-32 sm:h-40">
                  <Image
                    src={data.frontImage}
                    alt={t('deviceFront')}
                    fill
                    className="object-contain rounded border bg-gray-50 dark:bg-gray-800"
                    unoptimized
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage('front')}
                    className="absolute top-2 right-2 bg-white/80 dark:bg-gray-900/80 h-8 w-8 p-0 z-10"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="h-28 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center gap-2 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTakePhoto('front')}
                      disabled={isCameraDisabled}
                      title={cameraDisabledReason}
                      className="text-xs"
                    >
                      {isCameraDisabled ? (
                        <VideoCameraSlashIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <CameraIcon className="h-4 w-4 mr-1" />
                      )}
                      {isCameraDisabled
                        ? (t('camera.notAvailable') || 'No camera')
                        : t('takePhoto')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => frontInputRef.current?.click()}
                      className="text-xs"
                    >
                      <PhotoIcon className="h-4 w-4 mr-1" />
                      {t('upload') || 'Upload'}
                    </Button>
                  </div>
                </div>
              )}

              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect('front')}
                className="hidden"
              />
              <input
                ref={frontCameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect('front')}
                className="hidden"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Device Info Form */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Brand */}
        <div className="relative">
          <Label htmlFor="deviceBrand" className="text-sm">{t('deviceBrand')} *</Label>
          <Input
            id="deviceBrand"
            value={data.brand}
            onChange={(e) => handleBrandInput(e.target.value)}
            onFocus={() => {
              if (data.brand) {
                handleBrandInput(data.brand);
              } else {
                setShowBrandDropdown(true);
              }
            }}
            placeholder={t('deviceBrandPlaceholder')}
            autoComplete="off"
            className="text-sm"
          />
          {showBrandDropdown && (filteredBrands.length > 0 || showAddBrand) && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-auto">
              {filteredBrands.slice(0, 8).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => selectBrand(b)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  {b}
                </button>
              ))}
              {showAddBrand && (
                <button
                  type="button"
                  onClick={handleAddBrand}
                  className="w-full text-left px-3 py-2 hover:bg-primary-100 dark:hover:bg-primary-900 text-sm text-primary-600 dark:text-primary-400 font-medium border-t border-gray-300 dark:border-gray-700 flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  {t('add') || 'Add'} &quot;{data.brand}&quot;
                </button>
              )}
            </div>
          )}
        </div>

        {/* Model */}
        <div className="relative">
          <Label htmlFor="deviceModel" className="text-sm">{t('deviceModel')} *</Label>
          <Input
            id="deviceModel"
            value={data.model}
            onChange={(e) => handleModelInput(e.target.value)}
            onFocus={() => {
              if (data.brand && data.model) {
                handleModelInput(data.model);
              }
            }}
            placeholder={t('deviceModelPlaceholder')}
            disabled={!data.brand}
            autoComplete="off"
            className="text-sm"
          />
          {showModelDropdown && (filteredModels.length > 0 || showAddModel) && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-auto">
              {filteredModels.slice(0, 8).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectModel(m)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  {m}
                </button>
              ))}
              {showAddModel && (
                <button
                  type="button"
                  onClick={handleAddModel}
                  className="w-full text-left px-3 py-2 hover:bg-primary-100 dark:hover:bg-primary-900 text-sm text-primary-600 dark:text-primary-400 font-medium border-t border-gray-300 dark:border-gray-700 flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  {t('add') || 'Add'} &quot;{data.model}&quot;
                </button>
              )}
            </div>
          )}
        </div>

        {/* Color */}
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="deviceColor" className="text-sm">{t('deviceColor')}</Label>
          <Input
            id="deviceColor"
            value={data.color}
            onChange={(e) => onChange({ ...data, color: e.target.value })}
            placeholder={t('deviceColorPlaceholder')}
            autoComplete="off"
            className="text-sm"
          />
        </div>
      </div>

      {/* Camera Modal */}
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

      {/* Image Crop Modal */}
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
