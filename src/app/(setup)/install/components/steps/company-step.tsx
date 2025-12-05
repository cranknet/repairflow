'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
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
        <Card>
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <BuildingOfficeIcon className="h-16 w-16 text-primary" />
                </div>
                <CardTitle>{t('install.company.title') || 'Company Information'}</CardTitle>
                <CardDescription>
                    {t('install.company.description') || 'Enter your company details.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Company Name */}
                    <div className="space-y-2">
                        <Label htmlFor="company_name">
                            {t('install.company.nameLabel') || 'Company Name'} *
                        </Label>
                        <Input
                            id="company_name"
                            {...register('company_name')}
                            placeholder={t('install.company.namePlaceholder') || 'My Repair Shop'}
                        />
                        {errors.company_name && (
                            <p className="text-sm text-red-500">{errors.company_name.message}</p>
                        )}
                    </div>

                    {/* Company Email */}
                    <div className="space-y-2">
                        <Label htmlFor="company_email">
                            {t('install.company.emailLabel') || 'Company Email'} *
                        </Label>
                        <Input
                            id="company_email"
                            type="email"
                            {...register('company_email')}
                            placeholder={t('install.company.emailPlaceholder') || 'info@myrepairshop.com'}
                        />
                        {errors.company_email && (
                            <p className="text-sm text-red-500">{errors.company_email.message}</p>
                        )}
                    </div>

                    {/* Company Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="company_phone">
                            {t('install.company.phoneLabel') || 'Company Phone'} *
                        </Label>
                        <Input
                            id="company_phone"
                            {...register('company_phone')}
                            placeholder={t('install.company.phonePlaceholder') || '+1 (555) 123-4567'}
                        />
                        {errors.company_phone && (
                            <p className="text-sm text-red-500">{errors.company_phone.message}</p>
                        )}
                    </div>

                    {/* Company Address */}
                    <div className="space-y-2">
                        <Label htmlFor="company_address">
                            {t('install.company.addressLabel') || 'Company Address'}
                        </Label>
                        <Input
                            id="company_address"
                            {...register('company_address')}
                            placeholder={t('install.company.addressPlaceholder') || '123 Main St, City, State 12345'}
                        />
                    </div>

                    {/* Country, Language, Currency Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Country */}
                        <div className="space-y-2">
                            <Label htmlFor="country">
                                {t('install.company.countryLabel') || 'Country'} *
                            </Label>
                            <select
                                id="country"
                                {...register('country')}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
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
                            <Label htmlFor="language">
                                {t('install.company.languageLabel') || 'Default Language'} *
                            </Label>
                            <select
                                id="language"
                                {...register('language')}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
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
                            <Label htmlFor="currency">
                                {t('install.company.currencyLabel') || 'Default Currency'} *
                            </Label>
                            <select
                                id="currency"
                                {...register('currency')}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
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

                    {/* Navigation */}
                    <div className="flex justify-between pt-6">
                        <Button type="button" variant="outlined" onClick={onBack} disabled={isLoading}>
                            {t('install.nav.back') || 'Back'}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    {t('saving') || 'Saving...'}
                                </span>
                            ) : (
                                t('install.nav.next') || 'Next'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
