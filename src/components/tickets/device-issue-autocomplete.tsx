'use client';

import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { getIssueSuggestions } from '@/lib/device-issues';

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim()) {
      const filtered = getIssueSuggestions(value);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions(getIssueSuggestions(''));
      setShowSuggestions(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (issue: string) => {
    onChange(issue);
    setShowSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    if (value.trim() || suggestions.length > 0) {
      setShowSuggestions(true);
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
          placeholder="Describe the issue or select from suggestions..."
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              Suggestions
            </div>
            {suggestions.map((issue, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(issue)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                {issue}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

