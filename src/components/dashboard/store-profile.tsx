'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StoreProfileProps {
  companyName?: string;
  companyLogo?: string;
}

export function StoreProfile({ companyName, companyLogo }: StoreProfileProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {companyLogo && (
            <Image src={companyLogo} alt="Company Logo" width={40} height={40} className="object-contain rounded-lg" unoptimized />
          )}
          <CardTitle className="text-base font-semibold text-gray-900">Store Profile</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {companyName && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Company Name</p>
              <p className="text-base font-semibold text-gray-900">{companyName}</p>
            </div>
          )}
          <a
            href="/settings"
            className="inline-block text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Manage Settings →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

