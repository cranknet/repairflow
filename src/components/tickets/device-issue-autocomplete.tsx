'use client';

import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/language-context';
import { DEVICE_ISSUES } from '@/lib/device-issues';
import { getAllIssues, addCustomIssue } from '@/lib/device-storage';

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
  const { t } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredIssues, setFilteredIssues] = useState<string[]>([]);
  const [showAddIssue, setShowAddIssue] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const shouldOpenDropdownRef = useRef(true);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInput = (inputValue: string) => {
    onChange(inputValue);

    if (inputValue.trim()) {
      const allIssues = getAllIssues(DEVICE_ISSUES);
      const filtered = allIssues.filter((issue) =>
        issue.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredIssues(filtered.slice(0, 10)); // Limit to 10 suggestions

      // Show "Add new" option if input doesn't exactly match any issue
      const exactMatch = allIssues.some(
        (issue) => issue.toLowerCase() === inputValue.toLowerCase()
      );
      setShowAddIssue(!exactMatch && inputValue.trim().length > 0);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setShowAddIssue(false);
    }
  };

  const selectIssue = (issue: string) => {
    onChange(issue);
    setShowDropdown(false);
    setShowAddIssue(false);

    // Prevent dropdown from reopening immediately due to focus
    shouldOpenDropdownRef.current = false;
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    // Reset after a short delay to allow onFocus to fire and be ignored
    setTimeout(() => {
      shouldOpenDropdownRef.current = true;
    }, 200);
  };

  const handleAddIssue = () => {
    const newIssue = value.trim();
    if (newIssue) {
      addCustomIssue(newIssue);
      selectIssue(newIssue);
    }
  };

  const handleFocus = () => {
    if (!shouldOpenDropdownRef.current) return;

    if (value.trim()) {
      handleInput(value);
    } else {
      const allIssues = getAllIssues(DEVICE_ISSUES);
      setFilteredIssues(allIssues.slice(0, 5));
      setShowDropdown(true);
    }
  };

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <Label htmlFor="deviceIssue">{t('deviceIssue')} *</Label>
      <div className="relative">
        <textarea
          id="deviceIssue"
          ref={textareaRef}
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={handleFocus}
          rows={3}
          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
          placeholder={t('deviceIssuePlaceholder')}
        />
        {showDropdown && (filteredIssues.length > 0 || showAddIssue) && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredIssues.map((issue) => (
              <button
                key={issue}
                type="button"
                onClick={() => selectIssue(issue)}
                onMouseDown={(e) => e.preventDefault()}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                {issue}
              </button>
            ))}
            {showAddIssue && (
              <button
                type="button"
                onClick={handleAddIssue}
                onMouseDown={(e) => e.preventDefault()}
                className="w-full text-left px-4 py-2 hover:bg-primary-100 dark:hover:bg-primary-900 text-sm text-primary-600 dark:text-primary-400 font-medium border-t border-gray-300 dark:border-gray-700 flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                {t('addAsCommonIssue', { value })}
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
