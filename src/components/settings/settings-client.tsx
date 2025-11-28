'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { PhotoIcon, XMarkIcon, SparklesIcon, PencilIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { SMSTemplatesManager } from './sms-templates-manager';
import { ThemeCustomizer } from './theme-customizer';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AppVersion } from '@/components/layout/app-version';
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
import { CURRENCIES } from '@/lib/currencies';
import { COUNTRIES } from '@/lib/countries';

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

  const TABS = [
    { id: 'general', label: t('generalSettings') },
    { id: 'appearance', label: t('appearance') },
    { id: 'branding', label: t('branding') },
    { id: 'social', label: t('socialMedia') },
    { id: 'sms', label: t('smsTemplates') },
    { id: 'users', label: t('userManagement') },
  ];
  const [settings, setSettings] = useState(initialSettings);
  const [users, setUsers] = useState(initialUsers);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewUser, setShowNewUser] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(settings.login_background_image_url || '');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
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
  const { data: session } = useSession();

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
      // Refresh settings context if company name or logo changed
      if (settings.company_name || settings.company_logo) {
        await refreshSettings();
      }
      // Refresh in background to sync
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const response = await fetch('/api/settings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload logo');

      const data = await response.json();
      // Update settings immediately
      const updatedSettings = { ...settings, company_logo: data.url };
      setSettings(updatedSettings);
      
      // Save to database in background
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      toast({
        title: t('success'),
        description: t('logoUploadedSuccessfully'),
      });
      // Refresh settings context to update sidebar immediately
      await refreshSettings();
      // Refresh in background to sync
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToUploadLogo'),
      });
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBackground(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'background');

      const response = await fetch('/api/settings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload background');

      const data = await response.json();
      // Update settings immediately
      const updatedSettings = { ...settings, login_background_image: data.url };
      setSettings(updatedSettings);
      setBackgroundImageUrl(data.url);
      
      // Save to database in background
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      toast({
        title: t('success'),
        description: t('backgroundImageUploadedSuccessfully'),
      });
      // Refresh in background to sync
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToUploadBackgroundImage'),
      });
    } finally {
      setIsUploadingBackground(false);
      if (backgroundInputRef.current) backgroundInputRef.current.value = '';
    }
  };

  const handleBackgroundUrlChange = async () => {
    if (!backgroundImageUrl.trim()) return;

    setIsSaving(true);
    try {
      // Update settings immediately
      const updatedSettings = { ...settings, login_background_image_url: backgroundImageUrl };
      setSettings(updatedSettings);
      
      // Save to database
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast({
        title: t('success'),
        description: t('backgroundImageUrlSaved'),
      });
      // Refresh in background to sync
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToSaveBackgroundImageUrl'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveLogo = async () => {
    setSettings({ ...settings, company_logo: '' });
    await handleSaveSettings();
  };

  const handleRemoveBackground = async () => {
    setSettings({ ...settings, login_background_image: '', login_background_image_url: '' });
    setBackgroundImageUrl('');
    await handleSaveSettings();
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      const createdUser = await response.json();
      // Update users list immediately
      setUsers([...users, createdUser]);
      setShowNewUser(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        name: '',
        role: 'STAFF',
      });
      toast({
        title: t('success'),
        description: t('userCreatedSuccessfully'),
      });
      // Refresh in background to sync
      router.refresh();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToCreateUser'),
      });
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

      // Only include password if it's provided
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
        throw new Error(error.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      // Update users list immediately
      setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      setEditingUser(null);
      setEditUserData({
        username: '',
        email: '',
        password: '',
        name: '',
        role: 'STAFF',
      });
      toast({
        title: t('success'),
        description: t('userUpdatedSuccessfully'),
      });
      // Refresh in background to sync
      router.refresh();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToUpdateUser'),
      });
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
      toast({
        title: t('error'),
        description: t('failedToFetchLoginLogs'),
      });
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
      const response = await fetch(`/api/users/${userToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      // Update users list immediately
      setUsers(users.filter((u) => u.id !== userToDelete));
      toast({
        title: t('success'),
        description: t('userDeletedSuccessfully'),
      });
      // Refresh in background to sync
      router.refresh();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToDeleteUser'),
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('generalSettings')}</CardTitle>
              <CardDescription>{t('companyInformation')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">{t('companyName')}</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, company_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_email">{t('companyEmail')}</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={settings.company_email || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, company_email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_phone">{t('companyPhone')}</Label>
                  <Input
                    id="company_phone"
                    value={settings.company_phone || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, company_phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_address">{t('companyAddress')}</Label>
                  <Input
                    id="company_address"
                    value={settings.company_address || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, company_address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('currency')}</Label>
                  <select
                    id="currency"
                    value={settings.currency || 'USD'}
                    onChange={(e) =>
                      setSettings({ ...settings, currency: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.flag} {currency.code} - {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t('country')}</Label>
                  <select
                    id="country"
                    value={settings.country || 'US'}
                    onChange={(e) =>
                      setSettings({ ...settings, country: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                    <option value="EG">Egypt</option>
                    <option value="ZA">South Africa</option>
                    <option value="BR">Brazil</option>
                    <option value="MX">Mexico</option>
                    <option value="AR">Argentina</option>
                    <option value="CL">Chile</option>
                    <option value="CO">Colombia</option>
                    <option value="PE">Peru</option>
                    <option value="VE">Venezuela</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <AppVersion />
              </div>
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? t('loading') : t('saveSettings')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <ThemeCustomizer />
          </div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
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
                        className="h-20 w-20 object-contain border border-gray-300 rounded"
                      />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? t('uploading') : settings.company_logo ? t('changeLogo') : t('uploadLogo')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('loginPageBackground')}</CardTitle>
                <CardDescription>{t('customizeLoginBackground')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload from file */}
                <div className="flex items-center gap-4">
                  {settings.login_background_image ? (
                    <div className="relative">
                      <img
                        src={settings.login_background_image}
                        alt="Background"
                        className="h-32 w-48 object-cover border border-gray-300 rounded"
                      />
                      <button
                        onClick={handleRemoveBackground}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 w-48 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={backgroundInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                      id="background-upload"
                    />
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => backgroundInputRef.current?.click()}
                      disabled={isUploadingBackground}
                    >
                      {isUploadingBackground ? t('uploading') : t('uploadImage')}
                    </Button>
                  </div>
                </div>

                {/* Or use free API */}
                <div className="space-y-2">
                  <Label htmlFor="background-url">{t('orUseFreeImageUrl')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background-url"
                      type="url"
                      placeholder="https://source.unsplash.com/1920x1080/?technology"
                      value={backgroundImageUrl}
                      onChange={(e) => setBackgroundImageUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={handleBackgroundUrlChange}
                      disabled={isSaving || !backgroundImageUrl.trim()}
                    >
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      {t('useUrl')}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Example: https://source.unsplash.com/1920x1080/?technology,repair,workshop
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('socialMedia')}</CardTitle>
              <CardDescription>{t('socialMediaDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook_url">{t('facebookUrl')}</Label>
                <Input
                  id="facebook_url"
                  type="url"
                  placeholder="https://facebook.com/yourpage"
                  value={settings.facebook_url || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, facebook_url: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube_url">{t('youtubeUrl')}</Label>
                <Input
                  id="youtube_url"
                  type="url"
                  placeholder="https://youtube.com/@yourchannel"
                  value={settings.youtube_url || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, youtube_url: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram_url">{t('instagramUrl')}</Label>
                <Input
                  id="instagram_url"
                  type="url"
                  placeholder="https://instagram.com/yourprofile"
                  value={settings.instagram_url || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, instagram_url: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* SMS Templates Tab */}
        {activeTab === 'sms' && (
          <SMSTemplatesManager />
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('userManagement')}</CardTitle>
                  <CardDescription>{t('manageStaffAndAdmin')}</CardDescription>
                </div>
                <Button onClick={() => setShowNewUser(true)} variant="outlined">
                  {t('addUser')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-soft transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900">{user.name || user.username}</p>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'ADMIN' 
                            ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {user.username} • {user.email || t('noEmail')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => handleViewLoginLogs(user)}
                        className="flex items-center gap-1.5"
                      >
                        <ClockIcon className="h-4 w-4" />
                        {t('loginLogs')}
                      </Button>
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="flex items-center gap-1.5"
                      >
                        <PencilIcon className="h-4 w-4" />
                        {t('edit')}
                      </Button>
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={isDeleting === user.id || user.id === session?.user?.id}
                        className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                        {isDeleting === user.id ? t('deleting') : t('delete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* New User Dialog */}
              <Dialog open={showNewUser} onOpenChange={(open) => !open && setShowNewUser(false)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t('createNewUser')}</DialogTitle>
                    <DialogDescription>
                      {t('addNewStaffMember')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
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
                        placeholder={t('minimumCharacters')}
                      />
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
                        onChange={(e) =>
                          setNewUser({ ...newUser, role: e.target.value as 'ADMIN' | 'STAFF' })
                        }
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <option value="STAFF">{t('staff')}</option>
                        <option value="ADMIN">{t('admin')}</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outlined" onClick={() => setShowNewUser(false)}>
                      {t('cancel')}
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      disabled={!newUser.username || !newUser.password}
                    >
                      {t('createUser')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit User Dialog */}
              <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t('editUser')}</DialogTitle>
                    <DialogDescription>
                      {t('updateUserInformation')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
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
                        placeholder={t('enterNewPassword')}
                      />
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
                        onChange={(e) =>
                          setEditUserData({ ...editUserData, role: e.target.value as 'ADMIN' | 'STAFF' })
                        }
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <option value="STAFF">{t('staff')}</option>
                        <option value="ADMIN">{t('admin')}</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outlined" onClick={() => setEditingUser(null)}>
                      {t('cancel')}
                    </Button>
                    <Button
                      onClick={handleUpdateUser}
                      disabled={!editUserData.username}
                    >
                      {t('updateUser')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Delete User Confirmation Dialog */}
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
              <DialogDescription>
                {t('viewLoginHistory')}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {isLoadingLogs ? (
                <div className="text-center py-8 text-gray-500">{t('loading')}</div>
              ) : loginLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">{t('noLoginLogsFound')}</div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-4 pb-2 border-b font-semibold text-sm text-gray-700 dark:text-gray-300">
                    <div>{t('dateAndTime')}</div>
                    <div>{t('status')}</div>
                    <div>{t('ipAddress')}</div>
                    <div>{t('userAgent')}</div>
                    <div>{t('success')}</div>
                  </div>
                  {loginLogs.map((log) => (
                    <div
                      key={log.id}
                      className="grid grid-cols-5 gap-4 py-2 border-b text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="text-gray-700 dark:text-gray-300">
                        {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            log.success
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {log.success ? t('success') : t('failed')}
                        </span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                        {log.ipAddress || 'N/A'}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs truncate" title={log.userAgent || 'N/A'}>
                        {log.userAgent || 'N/A'}
                      </div>
                      <div>
                        {log.success ? (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">✗</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowLoginLogs(false)} variant="outlined">
                {t('close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

