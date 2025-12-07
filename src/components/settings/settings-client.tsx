'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { PencilIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';

// Import all tab components
import { SettingsTabNav, SettingsTab, SETTINGS_ICONS } from './SettingsTabNav';
import { GeneralSettingsTab } from './GeneralSettingsTab';
import { BrandingSettingsTab } from './BrandingSettingsTab';
import { TicketSettingsTab } from './TicketSettingsTab';
import { WarrantySettingsTab } from './WarrantySettingsTab';
import { InventorySettingsTab } from './InventorySettingsTab';
import { FinanceSettingsTab } from './FinanceSettingsTab';
import { PrintSettingsTab } from './PrintSettingsTab';
import { TrackingSettingsTab } from './TrackingSettingsTab';
import { SecuritySettingsTab } from './SecuritySettingsTab';
import { DatabaseSettingsTab } from './DatabaseSettingsTab';
import { PermissionsSettingsTab } from './PermissionsSettingsTab';
import { SMSTemplatesManager } from './sms-templates-manager';
import { ThemeCustomizer } from './theme-customizer';
import { NotificationPreferences } from './notification-preferences';
import { EmailSettingsTab } from './email-settings-tab';

export function SettingsClient({
  initialSettings,
  initialUsers,
}: {
  initialSettings: Record<string, string>;
  initialUsers: any[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { refreshSettings } = useSettings();
  const { data: session } = useSession();

  // Define all tabs with Heroicons
  const TABS: SettingsTab[] = [
    { id: 'general', label: t('generalSettings'), icon: SETTINGS_ICONS.general },
    { id: 'branding', label: t('branding'), icon: SETTINGS_ICONS.branding },
    { id: 'tickets', label: t('tickets') || 'Tickets', icon: SETTINGS_ICONS.tickets },
    { id: 'warranty', label: t('settings.warranty') || 'Warranty & Returns', icon: SETTINGS_ICONS.warranty },
    { id: 'inventory', label: t('inventory') || 'Inventory', icon: SETTINGS_ICONS.inventory },
    { id: 'finance', label: t('finance') || 'Finance', icon: SETTINGS_ICONS.finance },
    { id: 'print', label: t('settings.print') || 'Print & Invoice', icon: SETTINGS_ICONS.print },
    { id: 'sms', label: t('smsTemplates'), icon: SETTINGS_ICONS.sms },
    { id: 'email', label: t('email') || 'Email', icon: SETTINGS_ICONS.email },
    { id: 'notifications', label: t('notifications') || 'Notifications', icon: SETTINGS_ICONS.notifications },
    { id: 'tracking', label: t('settings.tracking') || 'Public Tracking', icon: SETTINGS_ICONS.tracking },
    { id: 'security', label: t('settings.security') || 'Security', icon: SETTINGS_ICONS.security },
    { id: 'appearance', label: t('appearance'), icon: SETTINGS_ICONS.appearance },
    { id: 'permissions', label: t('settings.permissions') || 'Permissions', icon: SETTINGS_ICONS.permissions, adminOnly: true },
    { id: 'database', label: t('settings.database') || 'Database', icon: SETTINGS_ICONS.database, adminOnly: true },
    { id: 'users', label: t('userManagement'), icon: SETTINGS_ICONS.users, adminOnly: true },
  ];

  // State
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Record<string, string>>({
    ...initialSettings,
    auto_mark_tickets_as_paid: initialSettings.auto_mark_tickets_as_paid ?? 'false',
  });
  const [users, setUsers] = useState(initialUsers);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [isUploadingTrackImage, setIsUploadingTrackImage] = useState(false);

  // User management state
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF',
  });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserData, setEditUserData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF',
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteUserConfirmOpen, setDeleteUserConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showLoginLogs, setShowLoginLogs] = useState(false);
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<any>(null);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Reset dialog state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Handle URL parameters for tab selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const editUserId = params.get('editUser');

      if (tab && TABS.find(t => t.id === tab)) {
        setActiveTab(tab);
      }

      if (editUserId && users.length > 0) {
        const userToEdit = users.find(u => u.id === editUserId);
        if (userToEdit && !editingUser) {
          setEditingUser(userToEdit);
          setEditUserData({
            username: userToEdit.username,
            email: userToEdit.email || '',
            password: '',
            name: userToEdit.name || '',
            role: userToEdit.role,
          });
          window.history.replaceState({}, '', '/settings?tab=users');
        }
      }
    }
  }, [users.length]);

  // Setting change handler
  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Save settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast({
        title: t('success'),
        description: t('settingsSavedSuccessfully'),
      });

      if (settings.company_name || settings.company_logo) {
        await refreshSettings();
      }
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToSaveSettings'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Factory reset
  const handleFactoryReset = async () => {
    if (resetConfirmation !== 'RESET') {
      toast({ title: t('error'), description: t('typeResetToConfirm') });
      return;
    }
    setIsResetting(true);
    try {
      const response = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: resetConfirmation }),
      });
      if (!response.ok) throw new Error('Failed to reset system');
      toast({ title: t('success'), description: t('resetSuccessful') });
      setTimeout(() => { window.location.href = '/install'; }, 1500);
    } catch (error: any) {
      toast({ title: t('error'), description: error.message || t('resetFailed') });
      setIsResetting(false);
    } finally {
      setShowResetConfirm(false);
      setResetConfirmation('');
    }
  };

  // File upload handler
  const handleUpload = async (type: 'logo' | 'favicon' | 'background' | 'track_image', file: File) => {
    const setUploading = {
      logo: setIsUploadingLogo,
      favicon: setIsUploadingFavicon,
      background: setIsUploadingBackground,
      track_image: setIsUploadingTrackImage,
    }[type];

    const settingKey = {
      logo: 'company_logo',
      favicon: 'company_favicon',
      background: 'login_background_image',
      track_image: 'default_track_image',
    }[type];

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/settings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Failed to upload ${type}`);

      const data = await response.json();
      setSettings(prev => ({ ...prev, [settingKey]: data.url }));

      toast({
        title: t('success'),
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`,
      });

      if (type === 'logo' || type === 'favicon') {
        await refreshSettings();
      }
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: `Failed to upload ${type}`,
      });
    } finally {
      setUploading(false);
    }
  };

  // Remove file handler
  const handleRemove = async (type: 'logo' | 'favicon' | 'background' | 'track_image') => {
    const settingKey = {
      logo: 'company_logo',
      favicon: 'company_favicon',
      background: 'login_background_image',
      track_image: 'default_track_image',
    }[type];

    setSettings(prev => ({ ...prev, [settingKey]: '' }));

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, [settingKey]: '' }),
      });

      if (type === 'logo' || type === 'favicon') {
        await refreshSettings();
      }
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: `Failed to remove ${type}`,
      });
    }
  };

  // User management handlers
  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.details && Array.isArray(error.details)) {
          const errorMessages = error.details.map((err: any) =>
            err.path && err.message ? `${err.path.join('.')}: ${err.message}` : err.message || 'Validation error'
          ).join('\n');
          throw new Error(errorMessages);
        }
        throw new Error(error.error || 'Failed to create user');
      }

      const createdUser = await response.json();
      setUsers([...users, createdUser]);
      setShowNewUser(false);
      setNewUser({ username: '', email: '', password: '', name: '', role: 'STAFF' });
      toast({ title: t('success'), description: t('userCreatedSuccessfully') });
      router.refresh();
    } catch (error: any) {
      toast({ title: t('error'), description: error.message || t('failedToCreateUser') });
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserData({
      username: user.username,
      email: user.email || '',
      password: '',
      name: user.name || '',
      role: user.role,
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const updateData: any = {
        username: editUserData.username,
        email: editUserData.email,
        name: editUserData.name,
        role: editUserData.role,
      };

      if (editUserData.password.trim()) {
        updateData.password = editUserData.password;
      }

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.details && Array.isArray(error.details)) {
          const errorMessages = error.details.map((err: any) =>
            err.path && err.message ? `${err.path.join('.')}: ${err.message}` : err.message || 'Validation error'
          ).join('\n');
          throw new Error(errorMessages);
        }
        throw new Error(error.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setEditingUser(null);
      setEditUserData({ username: '', email: '', password: '', name: '', role: 'STAFF' });
      toast({ title: t('success'), description: t('userUpdatedSuccessfully') });

      if (session?.user?.id === updatedUser.id) {
        router.refresh();
        setTimeout(() => window.location.reload(), 500);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      toast({ title: t('error'), description: error.message || t('failedToUpdateUser') });
    }
  };

  const handleViewLoginLogs = async (user: any) => {
    setSelectedUserForLogs(user);
    setShowLoginLogs(true);
    setIsLoadingLogs(true);

    try {
      const response = await fetch(`/api/users/${user.id}/login-logs`);
      if (!response.ok) throw new Error('Failed to fetch login logs');
      const logs = await response.json();
      setLoginLogs(logs);
    } catch (error) {
      toast({ title: t('error'), description: t('failedToFetchLoginLogs') });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setDeleteUserConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(userToDelete);
    try {
      const response = await fetch(`/api/users/${userToDelete}`, { method: 'DELETE' });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      setUsers(users.filter(u => u.id !== userToDelete));
      toast({ title: t('success'), description: t('userDeletedSuccessfully') });
      router.refresh();
    } catch (error: any) {
      toast({ title: t('error'), description: error.message || t('failedToDeleteUser') });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <SettingsTabNav
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="flex-1 min-w-0">
        {/* General Settings */}
        {activeTab === 'general' && (
          <GeneralSettingsTab
            settings={settings}
            onSettingChange={handleSettingChange}
            onSave={handleSaveSettings}
            isSaving={isSaving}
            onShowResetConfirm={() => setShowResetConfirm(true)}
          />
        )}

        {/* Branding */}
        {activeTab === 'branding' && (
          <BrandingSettingsTab
            settings={settings}
            onSettingChange={handleSettingChange}
            onSave={handleSaveSettings}
            isSaving={isSaving}
            onUpload={handleUpload}
            onRemove={handleRemove}
            isUploading={{
              logo: isUploadingLogo,
              favicon: isUploadingFavicon,
              background: isUploadingBackground,
              track_image: isUploadingTrackImage,
            }}
          />
        )}

        {/* Tickets */}
        {activeTab === 'tickets' && (
          <TicketSettingsTab
            settings={settings}
            onSettingChange={handleSettingChange}
            onSave={handleSaveSettings}
            isSaving={isSaving}
          />
        )}

        {/* Warranty & Returns */}
        {activeTab === 'warranty' && (
          <WarrantySettingsTab
            settings={settings}
            onSettingChange={handleSettingChange}
            onSave={handleSaveSettings}
            isSaving={isSaving}
          />
        )}

        {/* Inventory */}
        {activeTab === 'inventory' && (
          <InventorySettingsTab
            settings={settings}
            onSettingChange={handleSettingChange}
            onSave={handleSaveSettings}
            isSaving={isSaving}
          />
        )}

        {/* Finance */}
        {activeTab === 'finance' && (
          <FinanceSettingsTab
            settings={settings}
            onSettingChange={handleSettingChange}
            onSave={handleSaveSettings}
            isSaving={isSaving}
          />
        )}

        {/* Print & Invoice */}
        {activeTab === 'print' && (
          <PrintSettingsTab
            settings={settings}
            onSettingChange={handleSettingChange}
            onSave={handleSaveSettings}
            isSaving={isSaving}
          />
        )}

        {/* SMS Templates */}
        {activeTab === 'sms' && <SMSTemplatesManager />}

        {/* Email */}
        {activeTab === 'email' && <EmailSettingsTab />}

        {/* Notifications */}
        {activeTab === 'notifications' && <NotificationPreferences />}

        {/* Public Tracking */}
        {activeTab === 'tracking' && (
          <TrackingSettingsTab
            settings={settings}
            onSettingChange={handleSettingChange}
            onSave={handleSaveSettings}
            isSaving={isSaving}
          />
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <SecuritySettingsTab
            settings={settings}
            onSettingChange={handleSettingChange}
            onSave={handleSaveSettings}
            isSaving={isSaving}
          />
        )}

        {/* Permissions */}
        {activeTab === 'permissions' && (
          <PermissionsSettingsTab
            settings={settings}
            onSettingChange={handleSettingChange}
            onSave={handleSaveSettings}
            isSaving={isSaving}
          />
        )}

        {/* Database */}
        {activeTab === 'database' && (
          <DatabaseSettingsTab
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        )}

        {/* Appearance */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <ThemeCustomizer />
          </div>
        )}

        {/* User Management */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('userManagement')}</CardTitle>
                  <CardDescription>{t('manageStaffAndAdmin')}</CardDescription>
                </div>
                <Button onClick={() => setShowNewUser(true)} variant="outline">
                  {t('addUser')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-soft transition-all gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name || user.username}</p>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${user.role === 'ADMIN'
                          ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 dark:from-blue-900 dark:to-purple-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                        {user.username} • {user.email || t('noEmail')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewLoginLogs(user)}
                        className="flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
                      >
                        <ClockIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('loginLogs')}</span>
                        <span className="sm:hidden">Logs</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
                      >
                        <PencilIcon className="h-4 w-4" />
                        {t('edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={isDeleting === user.id || user.id === session?.user?.id}
                        className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 flex-1 sm:flex-none justify-center"
                      >
                        <TrashIcon className="h-4 w-4" />
                        {isDeleting === user.id ? t('deleting') : t('delete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* New User Dialog */}
      <Dialog open={showNewUser} onOpenChange={(open) => !open && setShowNewUser(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('createNewUser')}</DialogTitle>
            <DialogDescription>{t('addNewStaffMember')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_username">{t('username')} *</Label>
              <Input
                id="new_username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="johndoe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_email">{t('customerEmail')}</Label>
              <Input
                id="new_email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">{t('password')} *</Label>
              <Input
                id="new_password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Minimum 10 characters"
                minLength={10}
              />
              <p className="text-xs text-gray-500">Password must be at least 10 characters long</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_name">{t('customerName')}</Label>
              <Input
                id="new_name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_role">{t('role')} *</Label>
              <select
                id="new_role"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'ADMIN' | 'STAFF' })}
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              >
                <option value="STAFF">{t('staff')}</option>
                <option value="ADMIN">{t('admin')}</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewUser(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreateUser} disabled={!newUser.username || !newUser.password}>
              {t('createUser') || 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editUser')}</DialogTitle>
            <DialogDescription>{t('updateUserInformation')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_username">{t('username')} *</Label>
              <Input
                id="edit_username"
                value={editUserData.username}
                onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">{t('customerEmail')}</Label>
              <Input
                id="edit_email"
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_password">{t('newPassword')}</Label>
              <Input
                id="edit_password"
                type="password"
                value={editUserData.password}
                onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                placeholder="Leave blank to keep current password"
                minLength={10}
              />
              <p className="text-xs text-gray-500">If changing, password must be at least 10 characters long</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_name">{t('customerName')}</Label>
              <Input
                id="edit_name"
                value={editUserData.name}
                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_role">{t('role')} *</Label>
              <select
                id="edit_role"
                value={editUserData.role}
                onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value as 'ADMIN' | 'STAFF' })}
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              >
                <option value="STAFF">{t('staff')}</option>
                <option value="ADMIN">{t('admin')}</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>{t('cancel')}</Button>
            <Button onClick={handleUpdateUser} disabled={!editUserData.username}>
              {t('updateUser') || 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        open={deleteUserConfirmOpen}
        onOpenChange={setDeleteUserConfirmOpen}
        title={t('deleteUser')}
        description={t('deleteUserConfirmation')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        variant="destructive"
        onConfirm={confirmDeleteUser}
      />

      {/* Login Logs Dialog */}
      <Dialog open={showLoginLogs} onOpenChange={(open) => !open && setShowLoginLogs(false)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('loginLogs')} - {selectedUserForLogs?.name || selectedUserForLogs?.username}
            </DialogTitle>
            <DialogDescription>{t('viewLoginHistory')}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {isLoadingLogs ? (
              <div className="text-center py-8 text-gray-500">{t('loading')}</div>
            ) : loginLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{t('noLoginLogsFound')}</div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 pb-2 border-b font-semibold text-sm text-gray-700 dark:text-gray-300">
                  <div>{t('dateAndTime')}</div>
                  <div>{t('status')}</div>
                  <div>{t('ipAddress')}</div>
                  <div>{t('userAgent')}</div>
                </div>
                {loginLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-4 gap-4 py-2 border-b text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="text-gray-700 dark:text-gray-300">
                      {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs rounded-full ${log.success
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                        {log.success ? t('success') : t('failed')}
                      </span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 font-mono text-xs">{log.ipAddress || 'N/A'}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs truncate" title={log.userAgent || 'N/A'}>
                      {log.userAgent || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowLoginLogs(false)} variant="outline">{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Factory Reset Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">{t('factoryReset')}</DialogTitle>
            <DialogDescription className="text-red-700 font-semibold">{t('resetWarning')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">{t('confirmReset')}</p>
            <div className="space-y-2">
              <Label htmlFor="reset-confirm">{t('typeResetToConfirm')}</Label>
              <Input
                id="reset-confirm"
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                placeholder="RESET"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowResetConfirm(false); setResetConfirmation(''); }}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleFactoryReset}
              disabled={isResetting || resetConfirmation !== 'RESET'}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isResetting ? t('resetInProgress') : t('resetSettings')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
