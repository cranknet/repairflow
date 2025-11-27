'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TicketAssignmentProps {
  ticket: any;
  userRole: string;
}

interface User {
  id: string;
  name: string | null;
  username: string;
  role: string;
}

export function TicketAssignment({ ticket, userRole }: TicketAssignmentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/staff');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAssign = async (userId: string | null) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedToId: userId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update assignment');

      toast({
        title: 'Success',
        description: userId ? 'Ticket assigned successfully' : 'Ticket unassigned successfully',
      });

      setShowAssignForm(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update assignment',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Only show assignment for ADMIN and STAFF
  if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Assigned To</Label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {ticket.assignedTo
              ? ticket.assignedTo.name || ticket.assignedTo.username
              : 'Unassigned'}
          </p>
        </div>
        {!showAssignForm && (
          <Button
            onClick={() => setShowAssignForm(true)}
            variant="outlined"
            size="sm"
            disabled={isUpdating}
          >
            {ticket.assignedTo ? (
              <>
                <XMarkIcon className="h-4 w-4 mr-2" />
                Reassign
              </>
            ) : (
              <>
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Assign
              </>
            )}
          </Button>
        )}
      </div>

      {showAssignForm && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
          <div>
            <Label htmlFor="assign-select" className="text-sm mb-2 block">
              Select Staff Member
            </Label>
            <select
              id="assign-select"
              defaultValue={ticket.assignedToId || ''}
              disabled={isUpdating}
              className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.username} ({user.role})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const select = document.getElementById('assign-select') as HTMLSelectElement;
                if (select) {
                  handleAssign(select.value || null);
                }
              }}
              size="sm"
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={() => setShowAssignForm(false)}
              variant="outlined"
              size="sm"
              disabled={isUpdating}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

