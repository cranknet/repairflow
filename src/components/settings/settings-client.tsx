'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { PhotoIcon, XMarkIcon, SparklesIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SMSTemplatesManager } from './sms-templates-manager';
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

  const TABS = [
    { id: 'general', label: t('generalSettings') },
    { id: 'branding', label: t('branding') },
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
        title: 'Success',
        description: 'Settings saved successfully',
      });
      // Refresh in background to sync
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
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
        title: 'Success',
        description: 'Logo uploaded successfully',
      });
      // Refresh in background to sync
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
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
        title: 'Success',
        description: 'Background image uploaded successfully',
      });
      // Refresh in background to sync
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload background image',
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
        title: 'Success',
        description: 'Background image URL saved',
      });
      // Refresh in background to sync
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save background image URL',
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
        title: 'Success',
        description: 'User created successfully',
      });
      // Refresh in background to sync
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
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
        title: 'Success',
        description: 'User updated successfully',
      });
      // Refresh in background to sync
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
      });
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
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      // Update users list immediately
      setUsers(users.filter((u) => u.id !== userToDelete));
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      // Refresh in background to sync
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
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
                    <option value="USD">USD - US Dollar ($)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                    <option value="GBP">GBP - British Pound (£)</option>
                    <option value="JPY">JPY - Japanese Yen (¥)</option>
                    <option value="AUD">AUD - Australian Dollar (A$)</option>
                    <option value="CAD">CAD - Canadian Dollar (C$)</option>
                    <option value="CHF">CHF - Swiss Franc (Fr)</option>
                    <option value="CNY">CNY - Chinese Yuan (¥)</option>
                    <option value="INR">INR - Indian Rupee (₹)</option>
                    <option value="SAR">SAR - Saudi Riyal (ر.س)</option>
                    <option value="AED">AED - UAE Dirham (د.إ)</option>
                    <option value="EGP">EGP - Egyptian Pound (E£)</option>
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
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="IT">Italy</option>
                    <option value="ES">Spain</option>
                    <option value="NL">Netherlands</option>
                    <option value="BE">Belgium</option>
                    <option value="CH">Switzerland</option>
                    <option value="AT">Austria</option>
                    <option value="SE">Sweden</option>
                    <option value="NO">Norway</option>
                    <option value="DK">Denmark</option>
                    <option value="FI">Finland</option>
                    <option value="PL">Poland</option>
                    <option value="PT">Portugal</option>
                    <option value="GR">Greece</option>
                    <option value="IE">Ireland</option>
                    <option value="NZ">New Zealand</option>
                    <option value="JP">Japan</option>
                    <option value="CN">China</option>
                    <option value="IN">India</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">United Arab Emirates</option>
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
                      variant="outline"
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
                      variant="outline"
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
                      variant="outline"
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
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="flex items-center gap-1.5"
                      >
                        <PencilIcon className="h-4 w-4" />
                        {t('edit')}
                      </Button>
                      <Button
                        variant="outline"
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
                        placeholder="Minimum 6 characters"
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
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewUser(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      disabled={!newUser.username || !newUser.password}
                    >
                      Create User
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit User Dialog */}
              <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                      Update user information. Leave password blank to keep the current password.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_username">Username *</Label>
                      <Input
                        id="edit_username"
                        value={editUserData.username}
                        onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_email">Email</Label>
                      <Input
                        id="edit_email"
                        type="email"
                        value={editUserData.email}
                        onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_password">New Password (leave blank to keep current)</Label>
                      <Input
                        id="edit_password"
                        type="password"
                        value={editUserData.password}
                        onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_name">Name</Label>
                      <Input
                        id="edit_name"
                        value={editUserData.name}
                        onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_role">Role *</Label>
                      <select
                        id="edit_role"
                        value={editUserData.role}
                        onChange={(e) =>
                          setEditUserData({ ...editUserData, role: e.target.value as 'ADMIN' | 'STAFF' })
                        }
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingUser(null)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateUser}
                      disabled={!editUserData.username}
                    >
                      Update User
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
          title="Delete User"
          description="Are you sure you want to delete this user? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={confirmDeleteUser}
        />
      </div>
    </div>
  );
}

