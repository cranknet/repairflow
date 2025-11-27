'use client';

import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { PlusIcon } from '@heroicons/react/24/outline';

interface DeviceIssueAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function DeviceIssueAutocomplete({
  value,
  onChange,
  error,
}: DeviceIssueAutocompleteProps) {
  const [showUseText, setShowUseText] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show "Use this text" option when user is typing and text is not empty
    setShowUseText(value.trim().length > 0);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUseText(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUseText = () => {
    // The text is already in the value, just close the dropdown
    setShowUseText(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    if (value.trim().length > 0) {
      setShowUseText(true);
    }
  };

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <Label htmlFor="deviceIssue">Device Issue *</Label>
      <div className="relative">
        <textarea
          id="deviceIssue"
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          rows={3}
          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
          placeholder="Describe the device issue..."
        />
        {showUseText && value.trim().length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg">
            <button
              type="button"
              onClick={handleUseText}
              className="w-full text-left px-4 py-2 hover:bg-primary-100 dark:hover:bg-primary-900 text-sm text-primary-600 dark:text-primary-400 font-medium flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add &quot;{value.trim()}&quot; as Device Issue
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

