'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { Input } from '@/components/ui/input';
import { ImageCropper } from './image-cropper';
import {
    DocumentMagnifyingGlassIcon,
    ExclamationCircleIcon,
    WifiIcon,
    CameraIcon,
    ArrowUpTrayIcon,
    BuildingStorefrontIcon,
    XMarkIcon,
    CheckCircleIcon,
    PlusCircleIcon,
    TrashIcon,
    ExclamationTriangleIcon,
    CubeIcon,
} from '@heroicons/react/24/outline';

interface ExtractedPart {
    name: string;
    quantity: number;
    unitPrice: number;
    sku?: string;
    matchedPartId: string | null;
    matchedPartName?: string;
    matchConfidence: number;
    matchType: 'exact' | 'sku' | 'fuzzy' | 'none';
}

interface ExtractedSupplier {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface ScanResult {
    extractedParts: ExtractedPart[];
    matched: ExtractedPart[];
    unmatched: ExtractedPart[];
    supplier?: ExtractedSupplier;
    invoiceNumber?: string;
    date?: string;
    total?: number;
    mode?: string;
}

interface ReceiptScannerProps {
    onComplete?: () => void;
}

type ScanMode = 'tesseract' | 'ocrspace' | 'vision';

export function ReceiptScanner({ onComplete }: ReceiptScannerProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [editableParts, setEditableParts] = useState<ExtractedPart[]>([]);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [scanMode, setScanMode] = useState<ScanMode>('tesseract');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [saveSupplier, setSaveSupplier] = useState(true);
    const [duplicateWarning, setDuplicateWarning] = useState<{
        show: boolean;
        message: string;
        type: 'invoice' | 'content';
        existingRecord?: { scannedAt: string; supplierName?: string; invoiceNumber?: string };
    } | null>(null);

    // Supplier selection
    const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
    const [showNewSupplier, setShowNewSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');

    // Load scan mode from settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await fetch('/api/settings/ai-vision');
                if (res.ok) {
                    const data = await res.json();
                    setScanMode(data.scanMode || 'tesseract');
                }
            } catch (error) {
                console.error('Failed to load scan mode');
            }
        };
        loadSettings();
    }, []);

    // Load suppliers when scan results appear (for manual selection)
    useEffect(() => {
        if (scanResult && suppliers.length === 0) {
            fetch('/api/suppliers')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setSuppliers(data.map((s: any) => ({ id: s.id, name: s.name })));
                    }
                })
                .catch(() => { });
        }
    }, [scanResult]);

    // Check online status with state to track changes
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Initial check
        setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

        // Listen for online/offline events
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Connect stream to video element when both are available
    useEffect(() => {
        if (stream && videoRef.current && showCamera) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
        }
    }, [stream, showCamera]);

    // For Tesseract mode, only need online for parsing (not for OCR or image capture)
    const requiresOnlineForStart = scanMode !== 'tesseract';

    // Start camera stream
    const startCamera = async () => {
        try {
            setError(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError({ message: t('receiptScanner.cameraNotSupported') || 'Camera not supported on this device', retryable: false });
                return;
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            setStream(mediaStream);
            setShowCamera(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err: any) {
            console.error('Camera error:', err);

            if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError({ message: t('receiptScanner.cameraNotFound') || 'No camera detected on this device', retryable: false });
            } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError({ message: t('receiptScanner.cameraPermissionDenied') || 'Camera access denied. Please allow camera access', retryable: true });
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setError({ message: t('receiptScanner.cameraInUse') || 'Camera is being used by another app', retryable: true });
            } else {
                setError({ message: t('receiptScanner.cameraError') || 'Failed to access camera', retryable: true });
            }
        }
    };

    // Stop camera stream
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    }, [stream]);

    // Capture photo from camera
    const capturePhoto = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);

        stopCamera();

        // Show cropper instead of directly processing
        setCapturedImage(imageData);
        setShowCropper(true);
    };

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target?.result as string;
            // Show cropper instead of directly processing
            setCapturedImage(imageData);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    };

    // Handle cropped image
    const handleCrop = (croppedImage: string) => {
        setShowCropper(false);
        setCapturedImage(null);
        processImage(croppedImage);
    };

    // Cancel cropping
    const handleCancelCrop = () => {
        setShowCropper(false);
        setCapturedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Perform Tesseract OCR in browser
    const performTesseractOCR = async (imageData: string): Promise<string> => {
        setLoadingMessage(t('receiptScanner.loadingOcr') || 'Loading OCR engine...');
        setOcrProgress(0);

        // Dynamic import of Tesseract.js
        const Tesseract = await import('tesseract.js');

        setLoadingMessage(t('receiptScanner.extractingText') || 'Extracting text from image...');

        const result = await Tesseract.recognize(
            imageData,
            'eng+ara+fra', // Support English, Arabic, French
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setOcrProgress(Math.round(m.progress * 100));
                    } else if (m.status === 'loading language traineddata') {
                        setLoadingMessage('Loading language data...');
                    }
                },
            }
        );

        return result.data.text;
    };

    // Process image through API
    const processImage = async (imageData: string) => {
        // Check if online is required (not for Tesseract OCR step, but for AI parsing)
        if (requiresOnlineForStart && !isOnline) {
            setError({ message: t('receiptScanner.noInternet') || 'Internet connection required', retryable: true });
            return;
        }

        setIsLoading(true);
        setError(null);
        setScanResult(null);
        setOcrProgress(0);

        try {
            let ocrText: string | undefined;

            // For Tesseract mode, do OCR in browser first
            if (scanMode === 'tesseract') {
                setLoadingMessage(t('receiptScanner.runningLocalOcr') || 'Running local OCR...');
                ocrText = await performTesseractOCR(imageData);

                if (!ocrText.trim()) {
                    setError({ message: t('receiptScanner.ocrFailed') || 'Could not extract text from image. Please try a clearer photo.', retryable: true });
                    setIsLoading(false);
                    return;
                }

                // Check if online for AI parsing
                if (!isOnline) {
                    setError({ message: t('receiptScanner.internetForParsing') || 'Internet required to parse extracted text', retryable: true });
                    setIsLoading(false);
                    return;
                }
            }

            setLoadingMessage(t('receiptScanner.analyzing') || 'Analyzing receipt with AI...');

            // Build request body
            const requestBody: any = {
                mode: scanMode,
            };

            if (scanMode === 'tesseract') {
                // For Tesseract, send pre-extracted text
                requestBody.ocrText = ocrText;
                requestBody.image = ''; // Not needed
            } else {
                // For other modes, send image
                requestBody.image = imageData;
            }

            const response = await fetch('/api/v2/receipt-scanner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (!response.ok) {
                setError({
                    message: data.error || t('receiptScanner.processFailed') || 'Failed to process receipt',
                    retryable: data.retryable ?? true
                });
                return;
            }

            setScanResult(data);
            setEditableParts(data.extractedParts);
        } catch (err) {
            console.error('Scan error:', err);
            setError({ message: t('receiptScanner.networkError') || 'Network error - check your connection', retryable: true });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
            setOcrProgress(0);
        }
    };

    // Update editable part
    const updatePart = (index: number, field: keyof ExtractedPart, value: any) => {
        setEditableParts(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Remove part from list
    const removePart = (index: number) => {
        setEditableParts(prev => prev.filter((_, i) => i !== index));
    };

    // Confirm and add parts to inventory
    const confirmParts = async () => {
        if (editableParts.length === 0) {
            toast({
                title: t('error'),
                description: t('receiptScanner.noPartsToAdd') || 'No parts to add',
                variant: 'destructive',
            });
            return;
        }

        setIsConfirming(true);

        try {
            // Determine supplier to use
            let supplierData = undefined;
            if (showNewSupplier && newSupplierName.trim()) {
                // User entered a new supplier name
                supplierData = { name: newSupplierName.trim() };
            } else if (selectedSupplierId) {
                // User selected an existing supplier - send the ID
                const selected = suppliers.find(s => s.id === selectedSupplierId);
                if (selected) {
                    supplierData = { name: selected.name, existingId: selectedSupplierId };
                }
            } else if (saveSupplier && scanResult?.supplier) {
                // Use extracted supplier
                supplierData = scanResult.supplier;
            }

            const confirmData = {
                action: 'confirm',
                parts: editableParts.map(p => ({
                    name: p.name,
                    quantity: p.quantity,
                    unitPrice: p.unitPrice,
                    sku: p.sku,
                    matchedPartId: p.matchedPartId,
                })),
                supplier: supplierData,
                invoiceNumber: scanResult?.invoiceNumber,
                date: scanResult?.date,
                total: scanResult?.total,
                forceAdd: duplicateWarning?.show ? true : false,
            };

            const response = await fetch('/api/v2/receipt-scanner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(confirmData),
            });

            const data = await response.json();

            // Handle duplicate detection
            if (response.status === 409 && data.duplicate) {
                setDuplicateWarning({
                    show: true,
                    message: data.message,
                    type: data.duplicateType,
                    existingRecord: data.existingRecord,
                });
                setIsConfirming(false);
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add parts');
            }

            toast({
                title: t('success'),
                description: t('receiptScanner.successMessage', { updated: data.updated, created: data.created }) || `${data.updated} parts updated, ${data.created} new parts created`,
            });

            // Reset state
            setScanResult(null);
            setEditableParts([]);
            setDuplicateWarning(null);
            onComplete?.();
        } catch (err: any) {
            toast({
                title: t('error'),
                description: err.message || t('receiptScanner.addFailed') || 'Failed to add parts to inventory',
                variant: 'destructive',
            });
        } finally {
            setIsConfirming(false);
        }
    };

    // Reset scanner
    const reset = () => {
        stopCamera();
        setScanResult(null);
        setEditableParts([]);
        setError(null);
        setOcrProgress(0);
        setLoadingMessage('');
        setShowCropper(false);
        setCapturedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getModeLabel = () => {
        switch (scanMode) {
            case 'tesseract': return t('receiptScanner.mode.tesseract') || '🆓 Free (Tesseract)';
            case 'ocrspace': return t('receiptScanner.mode.ocrspace') || '☁️ OCR.space';
            case 'vision': return t('receiptScanner.mode.vision') || '🔮 AI Vision';
            default: return scanMode;
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                        {t('receiptScanner.title') || 'Receipt Scanner'}
                    </div>
                    <span className="text-xs font-normal px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                        {getModeLabel()}
                    </span>
                </CardTitle>
                <CardDescription>
                    {t('receiptScanner.description') || 'Scan supplier invoices to automatically add parts to inventory'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ExclamationCircleIcon className="h-5 w-5" />
                            <span>{error.message}</span>
                        </div>
                        {error.retryable && (
                            <Button variant="outline" size="sm" onClick={reset}>
                                {t('retry') || 'Retry'}
                            </Button>
                        )}
                    </div>
                )}

                {/* Offline Warning (only if requires online for start) */}
                {!isOnline && requiresOnlineForStart && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-4 rounded-lg flex items-center gap-2">
                        <WifiIcon className="h-5 w-5" />
                        <span>{t('receiptScanner.noInternet') || 'Internet connection required'}</span>
                    </div>
                )}

                {/* Camera View */}
                {showCamera && (
                    <div className="relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full rounded-lg bg-black"
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                            <Button onClick={capturePhoto} size="lg">
                                <CameraIcon className="h-5 w-5 mr-2" />
                                {t('capture') || 'Capture'}
                            </Button>
                            <Button onClick={stopCamera} variant="outline" size="lg">
                                {t('cancel') || 'Cancel'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Image Cropper */}
                {showCropper && capturedImage && (
                    <ImageCropper
                        imageData={capturedImage}
                        onCrop={handleCrop}
                        onCancel={handleCancelCrop}
                    />
                )}

                {/* Input Options - always allow photo/upload, online check happens on process */}
                {!showCamera && !showCropper && !scanResult && !isLoading && (
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            onClick={startCamera}
                            className="flex-1"
                        >
                            <CameraIcon className="h-5 w-5 mr-2" />
                            {t('receiptScanner.takePhoto') || 'Take Photo'}
                        </Button>
                        <div className="relative flex-1">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <Button
                                variant="outline"
                                className="w-full"
                            >
                                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                                {t('receiptScanner.uploadImage') || 'Upload Image'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
                            {ocrProgress > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-medium">{ocrProgress}%</span>
                                </div>
                            )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            {loadingMessage || t('receiptScanner.processing') || 'Processing receipt...'}
                        </p>
                        {scanMode === 'tesseract' && ocrProgress > 0 && (
                            <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${ocrProgress}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Scan Results */}
                {scanResult && editableParts.length > 0 && (
                    <div className="space-y-4">
                        {/* Supplier & Invoice Info */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-3">
                            {/* Supplier Row */}
                            <div className="flex items-center gap-2">
                                <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />
                                {!showNewSupplier ? (
                                    <select
                                        value={selectedSupplierId || (scanResult.supplier?.name ? 'extracted' : '')}
                                        onChange={(e) => {
                                            if (e.target.value === 'new') {
                                                setShowNewSupplier(true);
                                                setSelectedSupplierId('');
                                            } else if (e.target.value === 'extracted') {
                                                setSelectedSupplierId('');
                                                setSaveSupplier(true);
                                            } else {
                                                setSelectedSupplierId(e.target.value);
                                                setSaveSupplier(false);
                                            }
                                        }}
                                        className="flex-1 text-sm px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                    >
                                        {scanResult.supplier?.name && (
                                            <option value="extracted">
                                                {scanResult.supplier.name} ({t('receiptScanner.detected') || 'detected'})
                                            </option>
                                        )}
                                        <option value="">{t('receiptScanner.noSupplier') || 'No supplier'}</option>
                                        {suppliers.length > 0 && (
                                            <optgroup label={t('receiptScanner.existingSuppliers') || 'Existing Suppliers'}>
                                                {suppliers.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                        <option value="new">{t('receiptScanner.addNewSupplier') || '+ Add new supplier...'}</option>
                                    </select>
                                ) : (
                                    <div className="flex-1 flex gap-2">
                                        <input
                                            type="text"
                                            value={newSupplierName}
                                            onChange={(e) => setNewSupplierName(e.target.value)}
                                            placeholder={t('receiptScanner.supplierNamePlaceholder') || 'Supplier name'}
                                            className="flex-1 text-sm px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => {
                                                setShowNewSupplier(false);
                                                setNewSupplierName('');
                                            }}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Invoice details row */}
                            {(scanResult.invoiceNumber || scanResult.date || scanResult.total) && (
                                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    {scanResult.invoiceNumber && <span>{t('receiptScanner.invoice') || 'Invoice'}: {scanResult.invoiceNumber}</span>}
                                    {scanResult.date && <span>{t('receiptScanner.date') || 'Date'}: {scanResult.date}</span>}
                                    {scanResult.total && <span>{t('receiptScanner.total') || 'Total'}: ${scanResult.total.toFixed(2)}</span>}
                                </div>
                            )}
                        </div>

                        {/* Parts Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-2 px-2">{t('name') || 'Name'}</th>
                                        <th className="text-center py-2 px-2">{t('quantity') || 'Qty'}</th>
                                        <th className="text-right py-2 px-2">{t('price') || 'Price'}</th>
                                        <th className="text-center py-2 px-2">{t('match') || 'Match'}</th>
                                        <th className="text-center py-2 px-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editableParts.map((part, index) => (
                                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                                            <td className="py-2 px-2">
                                                <Input
                                                    value={part.name}
                                                    onChange={(e) => updatePart(index, 'name', e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-2 w-20">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={part.quantity}
                                                    onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 1)}
                                                    className="h-8 text-sm text-center"
                                                />
                                            </td>
                                            <td className="py-2 px-2 w-24">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min={0}
                                                    value={part.unitPrice}
                                                    onChange={(e) => updatePart(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-sm text-right"
                                                />
                                            </td>
                                            <td className="py-2 px-2 text-center">
                                                {part.matchedPartId ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                        <span className="text-xs">{part.matchConfidence}%</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                                        <PlusCircleIcon className="h-4 w-4" />
                                                        <span className="text-xs">{t('new') || 'New'}</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-2 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removePart(index)}
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>
                                {scanResult.matched.length} {t('receiptScanner.matched') || 'matched'}, {scanResult.unmatched.length} {t('receiptScanner.newParts') || 'new parts'}
                            </span>
                            <span className="font-medium">
                                {t('receiptScanner.total') || 'Total'}: ${editableParts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0).toFixed(2)}
                            </span>
                        </div>

                        {/* Duplicate Warning */}
                        {duplicateWarning?.show && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                                    <div className="flex-1">
                                        <p className="font-medium text-amber-700 dark:text-amber-300">
                                            {duplicateWarning.type === 'invoice' ? (t('receiptScanner.duplicateInvoice') || 'Duplicate Invoice') : (t('receiptScanner.similarReceipt') || 'Similar Receipt Detected')}
                                        </p>
                                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                            {duplicateWarning.message}
                                        </p>
                                        {duplicateWarning.existingRecord && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                {duplicateWarning.existingRecord.supplierName && (
                                                    <span>Supplier: {duplicateWarning.existingRecord.supplierName} • </span>
                                                )}
                                                Scanned: {new Date(duplicateWarning.existingRecord.scannedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={confirmParts}
                                        disabled={isConfirming}
                                        className="flex-1"
                                    >
                                        {isConfirming ? (t('receiptScanner.adding') || 'Adding...') : (t('receiptScanner.addAnyway') || 'Add Anyway')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setDuplicateWarning(null)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {!duplicateWarning?.show && (
                            <div className="flex gap-3">
                                <Button
                                    onClick={confirmParts}
                                    disabled={isConfirming || editableParts.length === 0}
                                    className="flex-1"
                                >
                                    {isConfirming ? (
                                        <>
                                            <span className="animate-spin mr-2">⏳</span>
                                            {t('processing') || 'Processing...'}
                                        </>
                                    ) : (
                                        <>
                                            <CubeIcon className="h-5 w-5 mr-2" />
                                            {t('receiptScanner.addToInventory') || 'Add to Inventory'}
                                        </>
                                    )}
                                </Button>
                                <Button variant="outline" onClick={reset}>
                                    {t('cancel') || 'Cancel'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* No Parts Found */}
                {scanResult && editableParts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <CubeIcon className="h-10 w-10 mx-auto mb-2" />
                        <p>{t('receiptScanner.noPartsFound') || 'No parts found in this receipt'}</p>
                        <Button variant="outline" onClick={reset} className="mt-4">
                            {t('tryAgain') || 'Try Again'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
