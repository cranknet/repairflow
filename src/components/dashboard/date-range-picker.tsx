'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

export type DateRangeType = 'lastWeek' | 'lastTwoWeeks' | 'lastMonth' | 'custom';

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date, endDate: Date, rangeType: DateRangeType) => void;
  defaultRange?: DateRangeType;
}

export function DateRangePicker({ onDateRangeChange, defaultRange = 'lastWeek' }: DateRangePickerProps) {
  const { t } = useLanguage();
  const [selectedRange, setSelectedRange] = useState<DateRangeType>(defaultRange);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const calculateDateRange = useCallback((rangeType: DateRangeType): { start: Date; end: Date } => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (rangeType) {
      case 'lastWeek':
        start = startOfDay(subDays(now, 7));
        break;
      case 'lastTwoWeeks':
        start = startOfDay(subDays(now, 14));
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = startOfDay(new Date(customStartDate));
          end = endOfDay(new Date(customEndDate));
        } else {
          start = startOfDay(subDays(now, 7));
          end = endOfDay(now);
        }
        break;
      default:
        start = startOfDay(subDays(now, 7));
    }

    return { start, end };
  }, [customStartDate, customEndDate]);

  useEffect(() => {
    const { start, end } = calculateDateRange(selectedRange);
    onDateRangeChange(start, end, selectedRange);
  }, [selectedRange, customStartDate, customEndDate, calculateDateRange, onDateRangeChange]);

  const handleRangeSelect = (range: DateRangeType) => {
    setSelectedRange(range);
    if (range !== 'custom') {
      setShowCustomPicker(false);
    } else {
      setShowCustomPicker(true);
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      if (start <= end) {
        setSelectedRange('custom');
        setShowCustomPicker(false);
      }
    }
  };

  const getDateRangeLabel = (): string => {
    const { start, end } = calculateDateRange(selectedRange);
    return `${format(start, 'dd MMM')} to ${format(end, 'dd MMM')}`;
  };

  const periods = [
    { id: 'lastWeek' as DateRangeType, label: t('lastWeek').toUpperCase() },
    { id: 'lastTwoWeeks' as DateRangeType, label: t('lastTwoWeeks').toUpperCase() },
    { id: 'lastMonth' as DateRangeType, label: t('lastMonth').toUpperCase() },
    { id: 'custom' as DateRangeType, label: t('custom').toUpperCase() },
  ];

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedRange}
        onChange={(e) => handleRangeSelect(e.target.value as DateRangeType)}
        className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
      >
        {periods.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      {selectedRange !== 'custom' && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {getDateRangeLabel()}
        </span>
      )}

      {showCustomPicker && (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
          />
          <span className="text-xs text-gray-500">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleCustomDateApply}
            className="text-xs px-2 py-1 h-auto"
          >
            {t('apply')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowCustomPicker(false);
              setSelectedRange('lastWeek');
            }}
            className="text-xs px-2 py-1 h-auto"
          >
            {t('cancel')}
          </Button>
        </div>
      )}

      {selectedRange === 'custom' && !showCustomPicker && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {customStartDate && customEndDate ? getDateRangeLabel() : t('selectDateRange')}
        </span>
      )}
    </div>
  );
}

