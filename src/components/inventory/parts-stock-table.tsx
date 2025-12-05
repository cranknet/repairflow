'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/use-toast';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PartFormModal } from '@/components/finance/PartFormModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Part {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  supplierId: string | null;
  supplier: {
    id: string;
    name: string;
  } | null;
}

interface PartsStockTableProps {
  parts: Part[];
  userRole: string;
}

export function PartsStockTable({ parts, userRole }: PartsStockTableProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [viewingPart, setViewingPart] = useState<Part | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity <= 0) {
      return { label: t('outOfStock'), variant: 'warning' as const, icon: 'error' };
    } else if (quantity <= reorderLevel) {
      return { label: t('inventory.lowStock'), variant: 'warning' as const, icon: 'warning' };
    } else {
      return { label: t('inventory.inStock'), variant: 'default' as const, icon: 'check_circle' };
    }
  };

  const handleView = (part: Part) => {
    setViewingPart(part);
    setIsViewModalOpen(true);
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setIsEditModalOpen(true);
  };

  const handleDelete = (part: Part) => {
    setPartToDelete(part);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!partToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/parts/${partToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete part');
      }

      toast({
        title: t('success'),
        description: t('partDeleted') || 'Part deleted successfully',
      });
      router.refresh();
      setPartToDelete(null);
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('partDeleteFailed') || 'Failed to delete part',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleEditSuccess = () => {
    router.refresh();
    setIsEditModalOpen(false);
    setEditingPart(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('partName')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('sku')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('supplier')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('quantity')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('reorderLevel')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('unitPrice')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('status')}
            </th>
            {userRole === 'ADMIN' && (
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                {t('actions') || 'Actions'}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => {
            const stockStatus = getStockStatus(part.quantity, part.reorderLevel);
            return (
              <tr
                key={part.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="py-3 px-4 font-medium">{part.name}</td>
                <td className="py-3 px-4 font-mono text-sm">{part.sku}</td>
                <td className="py-3 px-4">{part.supplier?.name || '-'}</td>
                <td className="py-3 px-4">{part.quantity}</td>
                <td className="py-3 px-4">{part.reorderLevel}</td>
                <td className="py-3 px-4">
                  {part.unitPrice > 0 ? `$${part.unitPrice.toFixed(2)}` : '-'}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={stockStatus.variant} className="flex items-center gap-1 w-fit">
                    <span className="material-symbols-outlined text-sm">
                      {stockStatus.icon}
                    </span>
                    {stockStatus.label}
                  </Badge>
                </td>
                {userRole === 'ADMIN' && (
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(part)}
                        icon={<EyeIcon className="h-4 w-4" />}
                        className="text-blue-600 hover:text-blue-700 p-2"
                        aria-label={`${t('view')} ${part.name}`}
                        title={t('view')}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(part)}
                        icon={<PencilIcon className="h-4 w-4" />}
                        className="text-blue-600 hover:text-blue-700 p-2"
                        aria-label={`${t('edit')} ${part.name}`}
                        title={t('edit')}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(part);
                        }}
                        icon={<TrashIcon className="h-4 w-4" />}
                        className="text-red-600 hover:text-red-700 p-2"
                        aria-label={`${t('delete')} ${part.name}`}
                        title={t('delete')}
                      />
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* View Modal */}
      {viewingPart && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewingPart.name}</DialogTitle>
              <DialogDescription>{t('partDetails') || 'Part Details'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('partName')}</label>
                  <p className="text-sm font-medium">{viewingPart.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('sku')}</label>
                  <p className="text-sm font-mono">{viewingPart.sku}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('supplier')}</label>
                  <p className="text-sm">{viewingPart.supplier?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('quantity')}</label>
                  <p className="text-sm">{viewingPart.quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('reorderLevel')}</label>
                  <p className="text-sm">{viewingPart.reorderLevel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('unitPrice')}</label>
                  <p className="text-sm">
                    {viewingPart.unitPrice > 0 ? `$${viewingPart.unitPrice.toFixed(2)}` : '-'}
                  </p>
                </div>
              </div>
              {viewingPart.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('finance.partForm.description')}</label>
                  <p className="text-sm mt-1">{viewingPart.description}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingPart && (
        <PartFormModal
          part={editingPart}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPart(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {partToDelete && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t('deletePart') || 'Delete Part'}
          description={t('deletePartConfirm')?.replace('{name}', partToDelete.name) || `Are you sure you want to delete "${partToDelete.name}"? This action cannot be undone.`}
          confirmText={t('delete')}
          cancelText={t('cancel')}
          variant="destructive"
          onConfirm={handleDeleteConfirm}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

