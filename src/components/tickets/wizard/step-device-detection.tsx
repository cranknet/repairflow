'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { DeviceData } from '../new-ticket-wizard';
import { DEVICE_BRANDS, DEVICE_MODELS } from '@/lib/device-brands';
import { getAllBrands, getAllModels, addCustomBrand, addCustomModel } from '@/lib/device-storage';
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

  // Trigger AI detection when both images are available
  useEffect(() => {
    if (data.frontImage && data.backImage && isOnline && aiConfigured && detectionStatus === 'idle') {
      runAIDetection();
    }
  }, [data.frontImage, data.backImage, isOnline, aiConfigured]);

  const runAIDetection = async () => {
    if (!data.frontImage && !data.backImage) return;
    
    setDetectionStatus('detecting');
    setDetectionError('');

    try {
      const images = [data.frontImage, data.backImage].filter(Boolean);
      
      const response = await fetch('/api/ai/detect-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
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
  };

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
    // Reset detection status to allow re-detection
    if (detectionStatus !== 'idle') {
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
    setDetectionStatus('idle');
  };

  // Camera handling
  const startCamera = async (type: 'front' | 'back') => {
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setShowCamera(type);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (error) {
      console.error('Camera error:', error);
      // Fallback to file input
      if (type === 'front') {
        frontCameraRef.current?.click();
      } else {
        backCameraRef.current?.click();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(null);
  };

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
    <div className="space-y-6">
      {/* Offline/No AI Warning */}
      {!isOnline && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <WifiIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {t('offlineMode')} - {t('manualEntryOnly')}
          </p>
        </div>
      )}

      {isOnline && aiConfigured === false && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t('aiNotConfigured')} - {t('manualEntryOnly')}
          </p>
        </div>
      )}

      {/* Photo Upload Section */}
      <div>
        <Label className="text-base font-medium mb-4 block">
          {t('devicePhotos')}
          {showAIFeatures && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({t('uploadBothForAI')})
            </span>
          )}
        </Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Front Photo */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">{t('deviceFrontPhoto')}</p>
              
              {data.frontImage ? (
                <div className="relative">
                  <img
                    src={data.frontImage}
                    alt={t('deviceFront')}
                    className="w-full h-48 object-contain rounded border bg-gray-50 dark:bg-gray-800"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage('front')}
                    className="absolute top-2 right-2 bg-white/80 dark:bg-gray-900/80"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800/50">
                  <CameraIcon className="w-10 h-10 text-gray-400" />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startCamera('front')}
                    >
                      <CameraIcon className="h-4 w-4 mr-2" />
                      {t('takePhoto')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => frontInputRef.current?.click()}
                    >
                      <PhotoIcon className="h-4 w-4 mr-2" />
                      {t('uploadFile')}
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

          {/* Back Photo */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">{t('deviceBackPhoto')}</p>
              
              {data.backImage ? (
                <div className="relative">
                  <img
                    src={data.backImage}
                    alt={t('deviceBack')}
                    className="w-full h-48 object-contain rounded border bg-gray-50 dark:bg-gray-800"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage('back')}
                    className="absolute top-2 right-2 bg-white/80 dark:bg-gray-900/80"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800/50">
                  <CameraIcon className="w-10 h-10 text-gray-400" />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startCamera('back')}
                    >
                      <CameraIcon className="h-4 w-4 mr-2" />
                      {t('takePhoto')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => backInputRef.current?.click()}
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
      </div>

      {/* AI Detection Status */}
      {showAIFeatures && (data.frontImage || data.backImage) && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {detectionStatus === 'detecting' && (
            <>
              <ArrowPathIcon className="w-5 h-5 text-primary-600 animate-spin" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('detectingDevice')}...
              </span>
            </>
          )}
          
          {detectionStatus === 'success' && (
            <>
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">
                {t('deviceDetected')} ({confidence}% {t('confidence')})
              </span>
            </>
          )}
          
          {detectionStatus === 'error' && (
            <>
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-400">
                {detectionError}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={runAIDetection}
                className="ml-auto"
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                {t('retryDetection')}
              </Button>
            </>
          )}
          
          {detectionStatus === 'idle' && (data.frontImage && data.backImage) && (
            <>
              <SparklesIcon className="w-5 h-5 text-primary-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('readyToDetect')}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={runAIDetection}
                className="ml-auto"
              >
                <SparklesIcon className="w-4 h-4 mr-1" />
                {t('detectDevice')}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Device Info Form */}
      <div ref={dropdownRef} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Brand */}
        <div className="relative">
          <Label htmlFor="deviceBrand">{t('deviceBrand')} *</Label>
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
          />
          {showBrandDropdown && (filteredBrands.length > 0 || showAddBrand) && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredBrands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => selectBrand(b)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  {b}
                </button>
              ))}
              {showAddBrand && (
                <button
                  type="button"
                  onClick={handleAddBrand}
                  className="w-full text-left px-4 py-2 hover:bg-primary-100 dark:hover:bg-primary-900 text-sm text-primary-600 dark:text-primary-400 font-medium border-t border-gray-300 dark:border-gray-700 flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  {t('addAsNewBrand', { brand: data.brand })}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Model */}
        <div className="relative">
          <Label htmlFor="deviceModel">{t('deviceModel')} *</Label>
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
          />
          {showModelDropdown && (filteredModels.length > 0 || showAddModel) && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredModels.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectModel(m)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  {m}
                </button>
              ))}
              {showAddModel && (
                <button
                  type="button"
                  onClick={handleAddModel}
                  className="w-full text-left px-4 py-2 hover:bg-primary-100 dark:hover:bg-primary-900 text-sm text-primary-600 dark:text-primary-400 font-medium border-t border-gray-300 dark:border-gray-700 flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  {t('addAsNewModel', { model: data.model })}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Color */}
        <div>
          <Label htmlFor="deviceColor">{t('deviceColor')}</Label>
          <Input
            id="deviceColor"
            value={data.color}
            onChange={(e) => onChange({ ...data, color: e.target.value })}
            placeholder={t('deviceColorPlaceholder')}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Skip AI Detection Link */}
      {showAIFeatures && detectionStatus === 'idle' && !data.brand && !data.model && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t('skipAiDetection')}{' '}
          <button
            type="button"
            onClick={() => {/* User can just fill in the fields manually */}}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            {t('enterManually')}
          </button>
        </p>
      )}

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

