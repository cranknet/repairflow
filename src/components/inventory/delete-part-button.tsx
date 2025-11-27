'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeletePartButtonProps {
  partId: string;
  partName: string;
}

export function DeletePartButton({ partId, partName }: DeletePartButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/inventory/${partId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete part');
      }

      toast({
        title: 'Success',
        description: 'Part deleted successfully',
      });

      router.push('/inventory');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete part',
      });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        onClick={() => setIsOpen(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <TrashIcon className="h-4 w-4 mr-2" />
        Delete
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Part</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{partName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outlined" onClick={() => setIsOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

