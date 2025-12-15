/**
 * Calendar Picker - Month/Year Navigation
 * 
 * Constitutional Principles:
 * - Quick navigation without tedious clicking
 * - "Go to first reflection" option
 * - Clean, simple interface
 * - No pressure to browse all time
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface CalendarPickerProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  firstReflectionDate?: Date;
  lastReflectionDate?: Date;
}

export function CalendarPicker({
  currentDate,
  onDateSelect,
  firstReflectionDate,
  lastReflectionDate,
}: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const startYear = firstReflectionDate?.getFullYear() || currentYear - 5;
  const endYear = lastReflectionDate?.getFullYear() || currentYear;
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  ).reverse();

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    const newDate = new Date(selectedYear, monthIndex, 1);
    onDateSelect(newDate);
    setIsOpen(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setViewMode('month');
  };

  const handleGoToFirst = () => {
    if (firstReflectionDate) {
      onDateSelect(firstReflectionDate);
      setIsOpen(false);
    }
  };

  const handleGoToLast = () => {
    if (lastReflectionDate) {
      onDateSelect(lastReflectionDate);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <Calendar size={16} />
        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={viewMode === 'month' ? `Select Month - ${selectedYear}` : 'Select Year'}
      >
        <div className="space-y-4">
          {/* View toggle */}
          <div className="flex items-center justify-between">
            {viewMode === 'month' && (
              <button
                onClick={() => setViewMode('year')}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Change year
              </button>
            )}
            {viewMode === 'year' && (
              <button
                onClick={() => setViewMode('month')}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                ← Back to months
              </button>
            )}
          </div>

          {/* Month selector */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, index) => {
                const isCurrentMonth = index === currentDate.getMonth() && 
                                      selectedYear === currentDate.getFullYear();
                
                return (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    className={`
                      p-3 rounded-lg text-sm transition-colors
                      ${isCurrentMonth 
                        ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-text-primary)]' 
                        : 'hover:bg-[var(--color-surface-hover)]'
                      }
                    `}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          )}

          {/* Year selector */}
          {viewMode === 'year' && (
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {years.map((year) => {
                const isCurrentYear = year === currentDate.getFullYear();
                
                return (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={`
                      p-3 rounded-lg text-sm transition-colors
                      ${isCurrentYear 
                        ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-text-primary)]' 
                        : 'hover:bg-[var(--color-surface-hover)]'
                      }
                    `}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick navigation */}
          <div className="flex items-center gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
            {firstReflectionDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoToFirst}
              >
                First reflection
              </Button>
            )}
            
            {lastReflectionDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoToLast}
              >
                Most recent
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

/**
 * Inline month navigation (for Archive view)
 */
export function MonthNavigator({
  currentDate,
  onDateChange,
}: {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}) {
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return currentDate.getMonth() === now.getMonth() &&
           currentDate.getFullYear() === now.getFullYear();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrevMonth}
      >
        <ChevronLeft size={16} />
      </Button>

      <span className="min-w-[140px] text-center">
        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleNextMonth}
        disabled={isCurrentMonth()}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
