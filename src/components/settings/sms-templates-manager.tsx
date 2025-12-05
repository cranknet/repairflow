'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TEMPLATE_IDS } from '@/lib/sms-templates';
import { useLanguage } from '@/contexts/language-context';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface SMSTemplate {
  id: string;
  name: string;
  templateId: string;
  language: string;
  message: string;
  variables: string[];
  isActive: boolean;
}

const TEMPLATE_NAMES: Record<string, string> = {
  ticket_created: 'Ticket Created',
  ticket_in_progress: 'Repair In Progress',
  ticket_waiting_parts: 'Waiting for Parts',
  ticket_repaired: 'Device Repaired',
  ticket_completed: 'Ticket Completed',
  payment_reminder: 'Payment Reminder',
};

const AVAILABLE_VARIABLES = ['customerName', 'ticketNumber', 'trackingCode', 'finalPrice'];

export function SMSTemplatesManager() {
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    language: 'en',
    message: '',
    variables: [] as string[],
    isActive: true,
  });

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sms/templates?language=${selectedLanguage}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.map((t: any) => ({
          ...t,
          variables: typeof t.variables === 'string' ? JSON.parse(t.variables) : t.variables,
        })));
      }
    } catch (error) {
      toast({
        title: t('error') || 'Error',
        description: t('failedToFetchTemplates'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLanguage, t, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      templateId: TEMPLATE_IDS[0],
      language: selectedLanguage,
      message: '',
      variables: [],
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      templateId: template.templateId,
      language: template.language,
      message: template.message,
      variables: template.variables,
      isActive: template.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.message || !formData.templateId) {
      toast({
        title: t('error') || 'Error',
        description: t('pleaseFillRequiredFields'),
      });
      return;
    }

    try {
      const url = editingTemplate
        ? `/api/sms/templates/${editingTemplate.id}`
        : '/api/sms/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      toast({
        title: t('success') || 'Success',
        description: editingTemplate ? t('templateUpdated') : t('templateCreated'),
      });

      setEditingTemplate(null);
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: t('error') || 'Error',
        description: error.message || t('failedToSaveTemplate'),
      });
    }
  };

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    setIsDeleting(templateToDelete);
    try {
      const response = await fetch(`/api/sms/templates/${templateToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      toast({
        title: t('success') || 'Success',
        description: t('templateDeleted'),
      });

      fetchTemplates();
    } catch (error: any) {
      toast({
        title: t('error') || 'Error',
        description: error.message || t('failedToDeleteTemplate'),
      });
    } finally {
      setIsDeleting(null);
      setTemplateToDelete(null);
    }
  };

  const toggleVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.includes(variable)
        ? prev.variables.filter((v) => v !== variable)
        : [...prev.variables, variable],
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('smsTemplates')}</CardTitle>
              <CardDescription>{t('manageSmsTemplates')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
              </select>
              <Button onClick={handleCreate} variant="outline">
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('newTemplate')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">{t('loadingTemplates')}</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('noTemplatesFound')} {selectedLanguage}. {t('createOneToGetStarted')}.
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-soft transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-gray-900">{template.name}</p>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {TEMPLATE_NAMES[template.templateId] || template.templateId}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {template.language.toUpperCase()}
                      </span>
                      {!template.isActive && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          {t('inactive')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.message}</p>
                    {template.variables.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t('variables')}: {template.variables.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="flex items-center gap-1.5"
                    >
                      <PencilIcon className="h-4 w-4" />
                      {t('edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      disabled={isDeleting === template.id}
                      className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                      {isDeleting === template.id ? t('deleting') : t('delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingTemplate(null);
          setFormData({
            name: '',
            templateId: '',
            language: selectedLanguage,
            message: '',
            variables: [],
            isActive: true,
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? t('editSmsTemplate') : t('createSmsTemplate')}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? t('updateSmsTemplate') : t('createCustomSmsTemplate')} {selectedLanguage}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">{t('templateName')} *</Label>
              <Input
                id="template-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Ticket Created Notification"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-id">{t('templateType')} *</Label>
              <select
                id="template-id"
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                disabled={!!editingTemplate}
              >
                <option value="">{t('selectTemplateType')}</option>
                {TEMPLATE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {TEMPLATE_NAMES[id] || id}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-language">{t('language')} *</Label>
              <select
                id="template-language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-message">{t('message')} *</Label>
              <textarea
                id="template-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                placeholder={t('enterMessageTemplate')}
              />
              <p className="text-xs text-gray-500">
                {t('useVariableName')} {AVAILABLE_VARIABLES.join(', ')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t('variables')}</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_VARIABLES.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => toggleVariable(variable)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${formData.variables.includes(variable)
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {'{'}{variable}{'}'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="template-active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="template-active" className="cursor-pointer">
                {t('activeTemplateAvailable')}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingTemplate(null);
                setFormData({
                  name: '',
                  templateId: '',
                  language: selectedLanguage,
                  message: '',
                  variables: [],
                  isActive: true,
                });
              }}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleSave}>{t('saveTemplate')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

