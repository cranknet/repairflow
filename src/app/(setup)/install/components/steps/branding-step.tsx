'use client';

import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PhotoIcon, XMarkIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
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
    }: {
        label: string;
        helpText: string;
        preview: FilePreview | null;
        onUpload: () => void;
        onRemove: () => void;
        inputRef: React.RefObject<HTMLInputElement | null>;
    }) => (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                {preview ? (
                    <div className="relative inline-block">
                        <Image
                            src={preview.preview}
                            alt={label}
                            width={120}
                            height={120}
                            className="rounded-lg object-contain"
                            unoptimized
                        />
                        <button
                            type="button"
                            onClick={onRemove}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="py-4">
                        <PhotoIcon className="h-10 w-10 mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">{helpText}</p>
                        <Button
                            type="button"
                            variant="outlined"
                            size="sm"
                            onClick={onUpload}
                            className="mt-2"
                        >
                            {t('install.branding.uploadImage') || 'Upload Image'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <Card>
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <PaintBrushIcon className="h-16 w-16 text-primary" />
                </div>
                <CardTitle>{t('install.branding.title') || 'Branding'}</CardTitle>
                <CardDescription>
                    {t('install.branding.description') || "Customize your shop's appearance."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

                {/* Login Background Upload */}
                <FileUploadBox
                    label={t('install.branding.backgroundLabel') || 'Login Background'}
                    helpText={t('install.branding.backgroundHelp') || 'Recommended: 1920x1080px'}
                    preview={loginBackground}
                    onUpload={() => backgroundInputRef.current?.click()}
                    onRemove={() => handleRemove(setLoginBackground)}
                    inputRef={backgroundInputRef}
                />

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                    <Button type="button" variant="outlined" onClick={onBack} disabled={isLoading}>
                        {t('install.nav.back') || 'Back'}
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={onNext}
                            disabled={isLoading}
                        >
                            {t('install.branding.skipStep') || 'Skip (use defaults)'}
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    {t('uploading') || 'Uploading...'}
                                </span>
                            ) : (
                                t('install.nav.next') || 'Next'
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
