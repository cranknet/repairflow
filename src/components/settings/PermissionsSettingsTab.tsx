'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline';

interface PermissionsSettingsTabProps {
    settings: Record<string, string>;
    onSettingChange: (key: string, value: string) => void;
    onSave: () => void;
    isSaving: boolean;
}

// Define all app features and their permission options
const FEATURES = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        description: 'View dashboard and analytics',
        adminOnly: false
    },
    {
        id: 'tickets',
        name: 'Tickets',
        description: 'Manage repair tickets',
        permissions: ['view', 'create', 'edit', 'delete', 'change_status', 'change_price']
    },
    {
        id: 'customers',
        name: 'Customers',
        description: 'Manage customer records',
        permissions: ['view', 'create', 'edit', 'delete']
    },
    {
        id: 'inventory',
        name: 'Inventory',
        description: 'Manage parts and stock',
        permissions: ['view', 'create', 'edit', 'delete', 'adjust_stock']
    },
    {
        id: 'suppliers',
        name: 'Suppliers',
        description: 'Manage supplier information',
        permissions: ['view', 'create', 'edit', 'delete']
    },
    {
        id: 'finance',
        name: 'Finance',
        description: 'View financial reports and expenses',
        permissions: ['view', 'create_expense', 'view_reports']
    },
    {
        id: 'returns',
        name: 'Returns',
        description: 'Process returns and refunds',
        permissions: ['view', 'create', 'approve', 'reject']
    },
    {
        id: 'payments',
        name: 'Payments',
        description: 'Record and manage payments',
        permissions: ['view', 'create', 'refund']
    },
    {
        id: 'notifications',
        name: 'Notifications',
        description: 'View and manage notifications',
        adminOnly: false
    },
    {
        id: 'settings',
        name: 'Settings',
        description: 'Access system settings',
        adminOnly: true
    },
    {
        id: 'users',
        name: 'User Management',
        description: 'Manage user accounts',
        adminOnly: true
    },
];

const PERMISSION_LABELS: Record<string, string> = {
    view: 'View',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    change_status: 'Change Status',
    change_price: 'Change Price',
    adjust_stock: 'Adjust Stock',
    create_expense: 'Create Expense',
    view_reports: 'View Reports',
    approve: 'Approve',
    reject: 'Reject',
    refund: 'Process Refund',
};

export function PermissionsSettingsTab({
    settings,
    onSettingChange,
    onSave,
    isSaving,
}: PermissionsSettingsTabProps) {
    const { t } = useLanguage();
    const { toast } = useToast();

    // Parse permissions from settings
    const getPermissions = (role: 'STAFF' | 'ADMIN'): Record<string, string[]> => {
        const key = `permissions_${role.toLowerCase()}`;
        try {
            return JSON.parse(settings[key] || '{}');
        } catch {
            return {};
        }
    };

    const [staffPermissions, setStaffPermissions] = useState<Record<string, string[]>>(
        getPermissions('STAFF')
    );

    // Update settings when permissions change
    useEffect(() => {
        onSettingChange('permissions_staff', JSON.stringify(staffPermissions));
    }, [staffPermissions]);

    const togglePermission = (featureId: string, permission: string) => {
        setStaffPermissions(prev => {
            const current = prev[featureId] || [];
            const updated = current.includes(permission)
                ? current.filter(p => p !== permission)
                : [...current, permission];
            return { ...prev, [featureId]: updated };
        });
    };

    const toggleAllPermissions = (featureId: string, permissions: string[]) => {
        setStaffPermissions(prev => {
            const current = prev[featureId] || [];
            const allSelected = permissions.every(p => current.includes(p));
            return {
                ...prev,
                [featureId]: allSelected ? [] : [...permissions]
            };
        });
    };

    const hasPermission = (featureId: string, permission: string): boolean => {
        return (staffPermissions[featureId] || []).includes(permission);
    };

    const hasAllPermissions = (featureId: string, permissions: string[]): boolean => {
        const current = staffPermissions[featureId] || [];
        return permissions.every(p => current.includes(p));
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="overflow-hidden border-0 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-pink-500/10">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25">
                            <ShieldCheckIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">{t('settings.permissions.title') || 'Role Permissions'}</CardTitle>
                            <CardDescription>
                                {t('settings.permissions.description') || 'Configure what Staff users can access. Admins have full access to all features.'}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheckIcon className="h-5 w-5" />
                        {t('settings.permissions.title') || 'Role Permissions'}
                    </CardTitle>
                    <CardDescription>
                        {t('settings.permissions.description') || 'Configure what Staff users can access. Admins have full access to all features.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Admin</strong> users always have full access to all features. Configure permissions below for <strong>Staff</strong> users.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Staff Permissions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5" />
                        {t('settings.permissions.staffPermissions') || 'Staff Permissions'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.id}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="font-medium">{feature.name}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
                                </div>
                                {feature.adminOnly && (
                                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded">
                                        Admin Only
                                    </span>
                                )}
                            </div>

                            {feature.adminOnly ? (
                                <p className="text-sm text-gray-500 italic">
                                    This feature is restricted to Admins only
                                </p>
                            ) : feature.permissions ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleAllPermissions(feature.id, feature.permissions!)}
                                            className={`px-2 py-1 text-xs rounded transition-colors ${hasAllPermissions(feature.id, feature.permissions!)
                                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            {hasAllPermissions(feature.id, feature.permissions!)
                                                ? 'Deselect All'
                                                : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {feature.permissions.map((permission) => (
                                            <button
                                                key={permission}
                                                type="button"
                                                onClick={() => togglePermission(feature.id, permission)}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${hasPermission(feature.id, permission)
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {PERMISSION_LABELS[permission] || permission}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => togglePermission(feature.id, 'access')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${hasPermission(feature.id, 'access')
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {hasPermission(feature.id, 'access') ? 'Access Granted' : 'No Access'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Quick Presets */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.permissions.presets') || 'Permission Presets'}</CardTitle>
                    <CardDescription>
                        {t('settings.permissions.presetsDescription') || 'Quick permission templates'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                // Minimal: view only
                                const minimal: Record<string, string[]> = {
                                    dashboard: ['access'],
                                    tickets: ['view'],
                                    customers: ['view'],
                                    inventory: ['view'],
                                    notifications: ['access'],
                                };
                                setStaffPermissions(minimal);
                                toast({ title: t('success'), description: 'Applied Minimal (View Only) preset' });
                            }}
                        >
                            Minimal (View Only)
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                // Standard: view + create + edit
                                const standard: Record<string, string[]> = {
                                    dashboard: ['access'],
                                    tickets: ['view', 'create', 'edit', 'change_status'],
                                    customers: ['view', 'create', 'edit'],
                                    inventory: ['view'],
                                    suppliers: ['view'],
                                    notifications: ['access'],
                                    payments: ['view', 'create'],
                                };
                                setStaffPermissions(standard);
                                toast({ title: t('success'), description: 'Applied Standard preset' });
                            }}
                        >
                            Standard
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                // Full Staff: everything except admin-only
                                const full: Record<string, string[]> = {
                                    dashboard: ['access'],
                                    tickets: ['view', 'create', 'edit', 'delete', 'change_status', 'change_price'],
                                    customers: ['view', 'create', 'edit', 'delete'],
                                    inventory: ['view', 'create', 'edit', 'delete', 'adjust_stock'],
                                    suppliers: ['view', 'create', 'edit', 'delete'],
                                    finance: ['view', 'create_expense', 'view_reports'],
                                    returns: ['view', 'create', 'approve', 'reject'],
                                    payments: ['view', 'create', 'refund'],
                                    notifications: ['access'],
                                };
                                setStaffPermissions(full);
                                toast({ title: t('success'), description: 'Applied Full Access preset' });
                            }}
                        >
                            Full Access
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? t('loading') : t('saveSettings')}
            </Button>
        </div>
    );
}
