'use client';

import { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface BrandingSettingsTabProps {
    settings: Record<string, string>;
    onSettingChange: (key: string, value: string) => void;
    onSave: () => void;
    isSaving: boolean;
    onUpload: (type: 'logo' | 'favicon' | 'background' | 'track_image', file: File) => Promise<void>;
    onRemove: (type: 'logo' | 'favicon' | 'background' | 'track_image') => void;
    isUploading: Record<string, boolean>;
}

export function BrandingSettingsTab({
    settings,
    onSettingChange,
    onSave,
    isSaving,
    onUpload,
    onRemove,
    isUploading,
}: BrandingSettingsTabProps) {
    const { t } = useLanguage();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const backgroundInputRef = useRef<HTMLInputElement>(null);
    const trackImageInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (type: 'logo' | 'favicon' | 'background' | 'track_image', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await onUpload(type, file);
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Company Logo */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('companyLogo')}</CardTitle>
                    <CardDescription>{t('uploadYourCompanyLogo')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        {settings.company_logo ? (
                            <div className="relative">
                                <img
                                    src={settings.company_logo}
                                    alt="Company Logo"
                                    className="h-20 w-20 object-contain border border-gray-300 dark:border-gray-600 rounded"
                                />
                                <button
                                    onClick={() => onRemove('logo')}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="h-20 w-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                                <PhotoIcon className="h-8 w-8 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange('logo', e)}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={isUploading.logo}
                            >
                                {isUploading.logo ? t('uploading') : settings.company_logo ? t('changeLogo') : t('uploadLogo')}
                            </Button>
                            <p className="text-xs text-gray-500 mt-1">Max 5MB. Recommended: 200x200px</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Favicon */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('companyFavicon') || 'Favicon'}</CardTitle>
                    <CardDescription>{t('uploadYourCompanyFavicon') || 'Browser tab icon'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        {settings.company_favicon ? (
                            <div className="relative">
                                <img
                                    src={settings.company_favicon}
                                    alt="Favicon"
                                    className="h-16 w-16 object-contain border border-gray-300 dark:border-gray-600 rounded"
                                />
                                <button
                                    onClick={() => onRemove('favicon')}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="h-16 w-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                                <PhotoIcon className="h-6 w-6 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <input
                                ref={faviconInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange('favicon', e)}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => faviconInputRef.current?.click()}
                                disabled={isUploading.favicon}
                            >
                                {isUploading.favicon ? t('uploading') : settings.company_favicon ? t('changeFavicon') : t('uploadFavicon')}
                            </Button>
                            <p className="text-xs text-gray-500 mt-1">Recommended: 32x32px or 64x64px</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Login Background */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('loginPageBackground')}</CardTitle>
                    <CardDescription>{t('customizeLoginBackground')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        {settings.login_background_image ? (
                            <div className="relative">
                                <img
                                    src={settings.login_background_image}
                                    alt="Background"
                                    className="h-32 w-48 object-cover border border-gray-300 dark:border-gray-600 rounded"
                                />
                                <button
                                    onClick={() => onRemove('background')}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="h-32 w-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                                <PhotoIcon className="h-8 w-8 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <input
                                ref={backgroundInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange('background', e)}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => backgroundInputRef.current?.click()}
                                disabled={isUploading.background}
                            >
                                {isUploading.background ? t('uploading') : t('uploadImage')}
                            </Button>
                            <p className="text-xs text-gray-500 mt-1">Recommended: 1920x1080px</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Track Page Background */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.branding.defaultTrackImage')}</CardTitle>
                    <CardDescription>Upload a background image for the public tracking page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        {settings.default_track_image ? (
                            <div className="relative">
                                <img
                                    src={settings.default_track_image}
                                    alt="Track Background"
                                    className="h-32 w-48 object-cover border border-gray-300 dark:border-gray-600 rounded"
                                />
                                <button
                                    onClick={() => onRemove('track_image')}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="h-32 w-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                                <PhotoIcon className="h-8 w-8 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <input
                                ref={trackImageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange('track_image', e)}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => trackImageInputRef.current?.click()}
                                disabled={isUploading.track_image}
                            >
                                {isUploading.track_image ? t('uploading') : settings.default_track_image ? t('changeImage') : t('uploadImage')}
                            </Button>
                            <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Brand Colors */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.brandColors') || 'Brand Colors'}</CardTitle>
                    <CardDescription>{t('settings.brandColorsDescription') || 'Customize your brand colors'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="primary_color">{t('settings.primaryColor') || 'Primary Color'}</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    id="primary_color"
                                    value={settings.primary_color || '#3B82F6'}
                                    onChange={(e) => onSettingChange('primary_color', e.target.value)}
                                    className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                                />
                                <Input
                                    value={settings.primary_color || '#3B82F6'}
                                    onChange={(e) => onSettingChange('primary_color', e.target.value)}
                                    placeholder="#3B82F6"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="secondary_color">{t('settings.secondaryColor') || 'Secondary Color'}</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    id="secondary_color"
                                    value={settings.secondary_color || '#1E40AF'}
                                    onChange={(e) => onSettingChange('secondary_color', e.target.value)}
                                    className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                                />
                                <Input
                                    value={settings.secondary_color || '#1E40AF'}
                                    onChange={(e) => onSettingChange('secondary_color', e.target.value)}
                                    placeholder="#1E40AF"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? t('loading') : t('saveSettings')}
            </Button>
        </div>
    );
}
