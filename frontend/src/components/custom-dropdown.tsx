'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface CustomDropdownProps<T = string> {
  id?: string;
  label?: string;
  helperText?: string;
  placeholder?: string;
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'surface';
}

export function CustomDropdown<T extends string | number>({
  id: propId,
  label,
  helperText,
  placeholder = 'Pilih opsi...',
  options,
  value,
  onChange,
  disabled = false,
  className = '',
  menuClassName = '',
  size = 'md',
  variant = 'surface',
}: CustomDropdownProps<T>) {
  const generatedId = useId();
  const id = propId || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Sync highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, options, value]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      const target = items[highlightedIndex] as HTMLElement | undefined;
      if (target) {
        target.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option: DropdownOption<T>) => {
    if (option.disabled || disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < options.length && options[next].disabled) {
            next++;
          }
          return next < options.length ? next : prev;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && options[next].disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Size styling variants
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs',
    md: 'py-2.5 px-3.5 text-xs',
    lg: 'py-3 px-4 text-sm',
  }[size];

  // Background styling variants
  const bgClasses = {
    default: 'bg-tebu-50 border-warm-border text-warm-black',
    surface: 'bg-warm-surface border-warm-border text-warm-black',
  }[variant];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-warm-black mb-1.5">
          {label}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full rounded-lg border text-left transition-all flex items-center justify-between gap-2.5 shadow-natural outline-none ${sizeClasses} ${bgClasses} ${
          isOpen ? 'border-forest ring-1 ring-forest/20' : 'hover:border-warm-neutral'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-tebu-200' : 'cursor-pointer'}`}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-warm-muted">{selectedOption.icon}</span>
          )}
          {selectedOption ? (
            <span className="font-semibold text-warm-black truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-warm-stone">{placeholder}</span>
          )}
          {selectedOption?.badge && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-forest-subtle text-forest border border-forest/20 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-warm-stone shrink-0 transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-180 text-forest' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {helperText && (
        <p className="mt-1 text-[11px] text-warm-muted text-pretty">{helperText}</p>
      )}

      {/* Floating Dropdown Menu Popover */}
      {isOpen && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          tabIndex={-1}
          ref={listRef}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${id}-opt-${highlightedIndex}` : undefined
          }
          className={`absolute left-0 right-0 z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-warm-border bg-tebu-50 p-1.5 shadow-natural-lg custom-pill-scrollbar animate-toast ${menuClassName}`}
        >
          {options.map((option, idx) => {
            const isSelected = option.value === value;
            const isHighlighted = idx === highlightedIndex;

            return (
              <li
                key={String(option.value)}
                id={`${id}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => !option.disabled && setHighlightedIndex(idx)}
                className={`p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-2.5 cursor-pointer ${
                  option.disabled
                    ? 'opacity-40 cursor-not-allowed bg-transparent'
                    : isSelected
                    ? 'bg-forest-subtle text-forest font-semibold'
                    : isHighlighted
                    ? 'bg-tebu-100 text-warm-black'
                    : 'text-warm-black hover:bg-tebu-100/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {option.icon && (
                    <span
                      className={`shrink-0 ${
                        isSelected ? 'text-forest' : 'text-warm-stone'
                      }`}
                    >
                      {option.icon}
                    </span>
                  )}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{option.label}</span>
                      {option.badge && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-semibold shrink-0 ${
                            isSelected
                              ? 'bg-forest text-tebu-50'
                              : 'bg-warm-surface border border-warm-border text-warm-muted'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <p
                        className={`text-[10px] leading-tight truncate ${
                          isSelected ? 'text-forest/80' : 'text-warm-muted'
                        }`}
                      >
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-forest shrink-0 stroke-[2.5]" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
