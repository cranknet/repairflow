'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BuildingOfficeIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { companySchema, type CompanyFormData, type InstallState } from '../../lib/validation';
import { COUNTRIES } from '@/lib/countries';
import { CURRENCIES } from '@/lib/currencies';
import { languages } from '@/lib/i18n';

interface CompanyStepProps {
    onNext: () => void;
    onBack: () => void;
    installState: InstallState;
    updateState: (updates: Partial<InstallState>) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export function CompanyStep({
    onNext,
    onBack,
    installState,
    updateState,
    isLoading,
    setIsLoading
}: CompanyStepProps) {
    const { t } = useLanguage();
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
        defaultValues: installState.company || {
            company_name: '',
            company_email: '',
            company_phone: '',
            company_address: '',
            country: 'US',
            language: 'en',
            currency: 'USD',
        },
    });

    const onSubmit = async (data: CompanyFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/install/company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save company information');
            }

            updateState({ company: data });
            onNext();
        } catch (error) {
            toast({
                title: t('error') || 'Error',
                description: error instanceof Error ? error.message : 'Failed to save company information',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t('install.company.title') || 'Company Information'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {t('install.company.description') || 'Enter your company details.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
                {/* Two column layout for name and email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Company Name */}
                    <div className="space-y-2">
                        <Label htmlFor="company_name" className="text-sm font-medium">
                            {t('install.company.nameLabel') || 'Company Name'} *
                        </Label>
                        <Input
                            id="company_name"
                            {...register('company_name')}
                            placeholder={t('install.company.namePlaceholder') || 'My Repair Shop'}
                            className="h-11"
                            aria-invalid={!!errors.company_name}
                        />
                        {errors.company_name && (
                            <p className="text-sm text-red-500 flex items-center gap-1" role="alert">
                                <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                                {errors.company_name.message}
                            </p>
                        )}
                    </div>

                    {/* Company Email */}
                    <div className="space-y-2">
                        <Label htmlFor="company_email" className="text-sm font-medium">
                            {t('install.company.emailLabel') || 'Company Email'} *
                        </Label>
                        <Input
                            id="company_email"
                            type="email"
                            {...register('company_email')}
                            placeholder={t('install.company.emailPlaceholder') || 'info@myrepairshop.com'}
                            className="h-11"
                            aria-invalid={!!errors.company_email}
                        />
                        {errors.company_email && (
                            <p className="text-sm text-red-500 flex items-center gap-1" role="alert">
                                <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                                {errors.company_email.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Two column layout for phone and address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Company Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="company_phone" className="text-sm font-medium">
                            {t('install.company.phoneLabel') || 'Company Phone'} *
                        </Label>
                        <Input
                            id="company_phone"
                            {...register('company_phone')}
                            placeholder={t('install.company.phonePlaceholder') || '+1 (555) 123-4567'}
                            className="h-11"
                            aria-invalid={!!errors.company_phone}
                        />
                        {errors.company_phone && (
                            <p className="text-sm text-red-500 flex items-center gap-1" role="alert">
                                <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                                {errors.company_phone.message}
                            </p>
                        )}
                    </div>

                    {/* Company Address */}
                    <div className="space-y-2">
                        <Label htmlFor="company_address" className="text-sm font-medium">
                            {t('install.company.addressLabel') || 'Company Address'}
                        </Label>
                        <Input
                            id="company_address"
                            {...register('company_address')}
                            placeholder={t('install.company.addressPlaceholder') || '123 Main St, City, State 12345'}
                            className="h-11"
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        {t('install.company.localeSettings') || 'Regional Settings'}
                    </h3>

                    {/* Country, Language, Currency Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Country */}
                        <div className="space-y-2">
                            <Label htmlFor="country" className="text-sm font-medium">
                                {t('install.company.countryLabel') || 'Country'} *
                            </Label>
                            <select
                                id="country"
                                {...register('country')}
                                className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            >
                                {COUNTRIES.map((country) => (
                                    <option key={country.code} value={country.code}>
                                        {country.name}
                                    </option>
                                ))}
                            </select>
                            {errors.country && (
                                <p className="text-sm text-red-500">{errors.country.message}</p>
                            )}
                        </div>

                        {/* Language */}
                        <div className="space-y-2">
                            <Label htmlFor="language" className="text-sm font-medium">
                                {t('install.company.languageLabel') || 'Default Language'} *
                            </Label>
                            <select
                                id="language"
                                {...register('language')}
                                className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            >
                                {languages.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                    </option>
                                ))}
                            </select>
                            {errors.language && (
                                <p className="text-sm text-red-500">{errors.language.message}</p>
                            )}
                        </div>

                        {/* Currency */}
                        <div className="space-y-2">
                            <Label htmlFor="currency" className="text-sm font-medium">
                                {t('install.company.currencyLabel') || 'Default Currency'} *
                            </Label>
                            <select
                                id="currency"
                                {...register('currency')}
                                className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            >
                                {CURRENCIES.map((curr) => (
                                    <option key={curr.code} value={curr.code}>
                                        {curr.symbol} {curr.code} - {curr.name}
                                    </option>
                                ))}
                            </select>
                            {errors.currency && (
                                <p className="text-sm text-red-500">{errors.currency.message}</p>
                            )}
                        </div>
                    </div>
                </div>

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
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="gap-2 min-w-[120px]"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                {t('saving') || 'Saving...'}
                            </span>
                        ) : (
                            <>
                                {t('install.nav.next') || 'Next'}
                                <ArrowRightIcon className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

