'use client';

import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PhotoIcon, XMarkIcon, PaintBrushIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import type { InstallState } from '../../lib/validation';

interface BrandingStepProps {
    onNext: () => void;
    onBack: () => void;
    installState: InstallState;
    updateState: (updates: Partial<InstallState>) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

interface FilePreview {
    file: File;
    preview: string;
}

export function BrandingStep({
    onNext,
    onBack,
    installState,
    updateState,
    isLoading,
    setIsLoading
}: BrandingStepProps) {
    const { t } = useLanguage();
    const { toast } = useToast();

    const [logo, setLogo] = useState<FilePreview | null>(null);
    const [favicon, setFavicon] = useState<FilePreview | null>(null);
    const [loginBackground, setLoginBackground] = useState<FilePreview | null>(null);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const backgroundInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (
        event: React.ChangeEvent<HTMLInputElement>,
        setter: (file: FilePreview | null) => void
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            setter({ file, preview });
        }
    };

    const handleRemove = (setter: (file: FilePreview | null) => void) => {
        setter(null);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            // If no files selected, skip to next
            if (!logo && !favicon && !loginBackground) {
                onNext();
                return;
            }

            const formData = new FormData();
            if (logo) formData.append('logo', logo.file);
            if (favicon) formData.append('favicon', favicon.file);
            if (loginBackground) formData.append('loginBackground', loginBackground.file);

            const response = await fetch('/api/install/branding', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save branding');
            }

            const result = await response.json();
            updateState({
                branding: {
                    logo: result.files?.company_logo,
                    favicon: result.files?.company_favicon,
                    loginBackground: result.files?.login_background_image,
                }
            });
            onNext();
        } catch (error) {
            toast({
                title: t('error') || 'Error',
                description: error instanceof Error ? error.message : 'Failed to save branding',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const FileUploadBox = ({
        label,
        helpText,
        preview,
        onUpload,
        onRemove,
        inputRef,
        size = 'normal'
    }: {
        label: string;
        helpText: string;
        preview: FilePreview | null;
        onUpload: () => void;
        onRemove: () => void;
        inputRef: React.RefObject<HTMLInputElement | null>;
        size?: 'normal' | 'small';
    }) => (
        <div className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            <div
                className={`border-2 border-dashed rounded-xl transition-colors cursor-pointer hover:border-primary/50 bg-gray-50 dark:bg-slate-700/30 ${preview ? 'border-primary/30' : 'border-gray-200 dark:border-slate-600'} ${size === 'small' ? 'p-3' : 'p-6'}`}
                onClick={() => !preview && onUpload()}
            >
                {preview ? (
                    <div className="relative inline-flex items-center justify-center w-full">
                        <div className="relative">
                            <Image
                                src={preview.preview}
                                alt={label}
                                width={size === 'small' ? 80 : 120}
                                height={size === 'small' ? 80 : 120}
                                className="rounded-lg object-contain bg-white dark:bg-slate-800 shadow-sm"
                                unoptimized
                            />
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors"
                            >
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-600 flex items-center justify-center mb-3">
                            <ArrowUpTrayIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onUpload(); }}
                            className="mt-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            {t('install.branding.uploadImage') || 'Click to upload'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <PaintBrushIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t('install.branding.title') || 'Branding'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {t('install.branding.description') || "Customize your shop's appearance."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
                {/* Hidden file inputs */}
                <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, setLogo)}
                />
                <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, setFavicon)}
                />
                <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, setLoginBackground)}
                />

                {/* Uploads Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Logo Upload */}
                    <FileUploadBox
                        label={t('install.branding.logoLabel') || 'Company Logo'}
                        helpText={t('install.branding.logoHelp') || 'Recommended: 200x200px PNG or SVG'}
                        preview={logo}
                        onUpload={() => logoInputRef.current?.click()}
                        onRemove={() => handleRemove(setLogo)}
                        inputRef={logoInputRef}
                    />

                    {/* Favicon Upload */}
                    <FileUploadBox
                        label={t('install.branding.faviconLabel') || 'Favicon'}
                        helpText={t('install.branding.faviconHelp') || 'Recommended: 32x32px or 64x64px'}
                        preview={favicon}
                        onUpload={() => faviconInputRef.current?.click()}
                        onRemove={() => handleRemove(setFavicon)}
                        inputRef={faviconInputRef}
                    />
                </div>

                {/* Login Background Upload - Full Width */}
                <FileUploadBox
                    label={t('install.branding.backgroundLabel') || 'Login Background'}
                    helpText={t('install.branding.backgroundHelp') || 'Recommended: 1920x1080px for best results'}
                    preview={loginBackground}
                    onUpload={() => backgroundInputRef.current?.click()}
                    onRemove={() => handleRemove(setLoginBackground)}
                    inputRef={backgroundInputRef}
                />

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-slate-700">
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={onBack}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        {t('install.nav.back') || 'Back'}
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={onNext}
                            disabled={isLoading}
                            size="sm"
                            className="text-gray-500"
                        >
                            {t('install.branding.skipStep') || 'Skip'}
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="gap-2 min-w-[120px]"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                    {t('uploading') || 'Uploading...'}
                                </span>
                            ) : (
                                <>
                                    {t('install.nav.next') || 'Next'}
                                    <ArrowRightIcon className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

