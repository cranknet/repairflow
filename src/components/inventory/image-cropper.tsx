'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

interface ImageCropperProps {
    imageData: string;
    onCrop: (croppedImage: string) => void;
    onCancel: () => void;
}

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function ImageCropper({ imageData, onCrop, onCancel }: ImageCropperProps) {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);
    const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState<'move' | 'resize' | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);
    const [showTips, setShowTips] = useState(false);

    // Initialize crop area when image loads
    const handleImageLoad = useCallback(() => {
        if (!imageRef.current || !containerRef.current) return;

        const img = imageRef.current;
        const container = containerRef.current;

        const containerWidth = container.clientWidth;
        const containerHeight = Math.min(450, window.innerHeight * 0.55);

        const scaleX = containerWidth / img.naturalWidth;
        const scaleY = containerHeight / img.naturalHeight;
        const newScale = Math.min(scaleX, scaleY, 1);

        const displayWidth = img.naturalWidth * newScale;
        const displayHeight = img.naturalHeight * newScale;

        setScale(newScale);
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        setContainerSize({ width: displayWidth, height: displayHeight });

        // Default crop to center 80% of image
        const padding = 0.1;
        setCropArea({
            x: displayWidth * padding,
            y: displayHeight * padding,
            width: displayWidth * (1 - padding * 2),
            height: displayHeight * (1 - padding * 2),
        });
    }, []);

    // Mouse/touch event handlers
    const getEventPosition = (e: React.MouseEvent | React.TouchEvent) => {
        const container = containerRef.current;
        if (!container) return { x: 0, y: 0 };

        const rect = container.getBoundingClientRect();

        if ('touches' in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent, type: 'move' | 'resize', handle?: string) => {
        e.preventDefault();
        e.stopPropagation();

        const pos = getEventPosition(e);
        setIsDragging(true);
        setDragType(type);
        setDragStart(pos);
        if (handle) setResizeHandle(handle);
    };

    const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging || !dragType) return;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const currentPos = {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };

        const deltaX = currentPos.x - dragStart.x;
        const deltaY = currentPos.y - dragStart.y;

        setCropArea(prev => {
            let newArea = { ...prev };

            if (dragType === 'move') {
                newArea.x = Math.max(0, Math.min(containerSize.width - prev.width, prev.x + deltaX));
                newArea.y = Math.max(0, Math.min(containerSize.height - prev.height, prev.y + deltaY));
            } else if (dragType === 'resize' && resizeHandle) {
                const minSize = 50;

                switch (resizeHandle) {
                    case 'nw':
                        newArea.width = Math.max(minSize, prev.width - deltaX);
                        newArea.height = Math.max(minSize, prev.height - deltaY);
                        newArea.x = prev.x + prev.width - newArea.width;
                        newArea.y = prev.y + prev.height - newArea.height;
                        break;
                    case 'ne':
                        newArea.width = Math.max(minSize, prev.width + deltaX);
                        newArea.height = Math.max(minSize, prev.height - deltaY);
                        newArea.y = prev.y + prev.height - newArea.height;
                        break;
                    case 'sw':
                        newArea.width = Math.max(minSize, prev.width - deltaX);
                        newArea.height = Math.max(minSize, prev.height + deltaY);
                        newArea.x = prev.x + prev.width - newArea.width;
                        break;
                    case 'se':
                        newArea.width = Math.max(minSize, prev.width + deltaX);
                        newArea.height = Math.max(minSize, prev.height + deltaY);
                        break;
                    case 'n':
                        newArea.height = Math.max(minSize, prev.height - deltaY);
                        newArea.y = prev.y + prev.height - newArea.height;
                        break;
                    case 's':
                        newArea.height = Math.max(minSize, prev.height + deltaY);
                        break;
                    case 'w':
                        newArea.width = Math.max(minSize, prev.width - deltaX);
                        newArea.x = prev.x + prev.width - newArea.width;
                        break;
                    case 'e':
                        newArea.width = Math.max(minSize, prev.width + deltaX);
                        break;
                }

                // Keep within bounds
                newArea.x = Math.max(0, newArea.x);
                newArea.y = Math.max(0, newArea.y);
                newArea.width = Math.min(containerSize.width - newArea.x, newArea.width);
                newArea.height = Math.min(containerSize.height - newArea.y, newArea.height);
            }

            return newArea;
        });

        setDragStart(currentPos);
    }, [isDragging, dragType, dragStart, resizeHandle, containerSize]);

    const handleEnd = useCallback(() => {
        setIsDragging(false);
        setDragType(null);
        setResizeHandle(null);
    }, []);

    // Add/remove event listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('touchend', handleEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, handleMove, handleEnd]);

    // Perform crop
    const performCrop = () => {
        if (!imageRef.current) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const x = cropArea.x / scale;
        const y = cropArea.y / scale;
        const width = cropArea.width / scale;
        const height = cropArea.height / scale;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(
            imageRef.current,
            x, y, width, height,
            0, 0, width, height
        );

        const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
        onCrop(croppedImage);
    };

    // Corner handle styles
    const cornerStyle = (position: string): React.CSSProperties => {
        const size = 16;
        const base: React.CSSProperties = {
            position: 'absolute',
            width: size,
            height: size,
            backgroundColor: '#3b82f6',
            borderRadius: 3,
            zIndex: 20,
            touchAction: 'none',
        };

        switch (position) {
            case 'nw': return { ...base, top: -size / 2, left: -size / 2, cursor: 'nw-resize' };
            case 'ne': return { ...base, top: -size / 2, right: -size / 2, cursor: 'ne-resize' };
            case 'sw': return { ...base, bottom: -size / 2, left: -size / 2, cursor: 'sw-resize' };
            case 'se': return { ...base, bottom: -size / 2, right: -size / 2, cursor: 'se-resize' };
            default: return base;
        }
    };

    return (
        <div className="space-y-3">
            {/* Minimal header with collapsible tips */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="material-symbols-outlined text-blue-500">crop</span>
                    <span>{t('receiptScanner.cropTitle') || 'Select parts area'}</span>
                </div>
                <button
                    onClick={() => setShowTips(!showTips)}
                    className="text-xs text-gray-500 hover:text-blue-500 flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-sm">help</span>
                    {showTips ? (t('hideTips') || 'Hide tips') : (t('tips') || 'Tips')}
                </button>
            </div>

            {/* Collapsible tips */}
            {showTips && (
                <div className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-gray-600 dark:text-gray-400 space-y-1">
                    <p>✓ <span className="text-green-600">{t('include') || 'Include'}:</span> {t('receiptScanner.cropInclude') || 'Part names, quantities, prices'}</p>
                    <p>✗ <span className="text-red-500">{t('exclude') || 'Exclude'}:</span> {t('receiptScanner.cropExclude') || 'Headers, footers, payment info'}</p>
                </div>
            )}

            {/* Image with crop overlay */}
            <div
                ref={containerRef}
                className="relative mx-auto bg-gray-900 rounded-lg overflow-hidden select-none"
                style={{
                    width: containerSize.width || '100%',
                    height: containerSize.height || 'auto',
                }}
            >
                {/* Original Image */}
                <img
                    ref={imageRef}
                    src={imageData}
                    alt="Receipt"
                    onLoad={handleImageLoad}
                    className="block"
                    style={{
                        width: containerSize.width || 'auto',
                        height: containerSize.height || 'auto',
                    }}
                    draggable={false}
                />

                {/* Dark overlay outside crop area */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `linear-gradient(to right, 
                            rgba(0,0,0,0.6) ${cropArea.x}px, 
                            transparent ${cropArea.x}px, 
                            transparent ${cropArea.x + cropArea.width}px, 
                            rgba(0,0,0,0.6) ${cropArea.x + cropArea.width}px
                        )`,
                    }}
                />
                <div
                    className="absolute pointer-events-none"
                    style={{
                        left: cropArea.x,
                        top: 0,
                        width: cropArea.width,
                        height: cropArea.y,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                    }}
                />
                <div
                    className="absolute pointer-events-none"
                    style={{
                        left: cropArea.x,
                        top: cropArea.y + cropArea.height,
                        width: cropArea.width,
                        height: containerSize.height - cropArea.y - cropArea.height,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                    }}
                />

                {/* Crop selection box */}
                <div
                    className="absolute border-2 border-blue-500 bg-transparent cursor-move"
                    style={{
                        left: cropArea.x,
                        top: cropArea.y,
                        width: cropArea.width,
                        height: cropArea.height,
                        touchAction: 'none',
                    }}
                    onMouseDown={(e) => handleStart(e, 'move')}
                    onTouchStart={(e) => handleStart(e, 'move')}
                >
                    {/* Grid lines */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                    </div>

                    {/* Only corner handles for cleaner look */}
                    {['nw', 'ne', 'sw', 'se'].map((handle) => (
                        <div
                            key={handle}
                            style={cornerStyle(handle)}
                            onMouseDown={(e) => handleStart(e, 'resize', handle)}
                            onTouchStart={(e) => handleStart(e, 'resize', handle)}
                        />
                    ))}
                </div>

                {/* Size indicator - bottom of image */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {Math.round(cropArea.width / scale)} × {Math.round(cropArea.height / scale)}
                </div>
            </div>

            {/* Action buttons - consistent styling */}
            <div className="flex gap-2">
                <Button onClick={performCrop} className="flex-1 h-10">
                    <span className="material-symbols-outlined text-lg mr-1.5">check</span>
                    {t('receiptScanner.cropAndScan') || 'Crop & Scan'}
                </Button>
                <Button variant="outline" onClick={() => onCrop(imageData)} className="h-10 px-4">
                    <span className="material-symbols-outlined text-lg">fullscreen</span>
                </Button>
                <Button variant="ghost" onClick={onCancel} className="h-10 px-4">
                    <span className="material-symbols-outlined text-lg">close</span>
                </Button>
            </div>
        </div>
    );
}
