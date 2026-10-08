'use client';

import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  keywords?: string;
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
  searchable?: boolean;
  searchPlaceholder?: string;
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
  searchable = false,
  searchPlaceholder = 'Cari berdasarkan SKU, nama, atau kategori...',
}: CustomDropdownProps<T>) {
  const generatedId = useId();
  const id = propId || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!searchable || query.length === 0) return options;
    return options.filter((opt) => {
      const haystack = `${opt.label} ${opt.description || ''} ${opt.badge || ''} ${opt.keywords || ''}`.toLowerCase();
      return query.split(/\s+/).every((part) => haystack.includes(part));
    });
  }, [options, searchQuery, searchable]);

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
      setSearchQuery('');
      const idx = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
      if (searchable) {
        window.setTimeout(() => searchInputRef.current?.focus(), 30);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reset highlight saat kata kunci berubah
  useEffect(() => {
    if (isOpen && searchable) {
      setHighlightedIndex(0);
      listRef.current?.scrollTo?.({ top: 0 });
    }
  }, [searchQuery, isOpen, searchable]);

  // Scroll item highlight hanya di dalam menu, tanpa menggeser halaman.
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      const target = items[highlightedIndex] as HTMLElement | undefined;
      const list = listRef.current;
      if (target && list) {
        const targetTop = target.offsetTop;
        const targetBottom = targetTop + target.offsetHeight;
        if (targetTop < list.scrollTop) {
          list.scrollTop = Math.max(targetTop - 4, 0);
        } else if (targetBottom > list.scrollTop + list.clientHeight) {
          list.scrollTop = targetBottom - list.clientHeight + 4;
        }
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option: DropdownOption<T>) => {
    if (option.disabled || disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const moveHighlight = (direction: 1 | -1) => {
    setHighlightedIndex((prev) => {
      let next = prev + direction;
      while (next >= 0 && next < filteredOptions.length && filteredOptions[next].disabled) {
        next += direction;
      }
      if (next < 0 || next >= filteredOptions.length) return prev;
      return next;
    });
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
        moveHighlight(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveHighlight(-1);
        break;
      case 'Enter':
      case ' ':
        // Biarkan spasi mengetik di kolom cari. Hanya Enter memilih.
        if (e.key === ' ' && document.activeElement === searchInputRef.current) return;
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
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
        <div
          className={`absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-warm-border bg-tebu-50 shadow-natural-lg animate-toast ${menuClassName}`}
        >
          {searchable && (
            <div className="flex items-center gap-2 border-b border-warm-border/70 bg-tebu-50 px-3 py-2">
              <Search className="w-4 h-4 shrink-0 text-warm-stone" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full bg-transparent text-xs text-warm-black outline-none placeholder:text-warm-stone"
              />
              {searchQuery.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-warm-stone transition-colors hover:bg-tebu-100 hover:text-warm-black"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              ) : (
                <span className="shrink-0 font-mono text-[10px] text-warm-stone">
                  {filteredOptions.length}/{options.length}
                </span>
              )}
            </div>
          )}
          <ul
            id={`${id}-listbox`}
            role="listbox"
            tabIndex={-1}
            ref={listRef}
            aria-activedescendant={
              highlightedIndex >= 0 ? `${id}-opt-${highlightedIndex}` : undefined
            }
            className="max-h-64 overflow-y-auto p-1.5 custom-pill-scrollbar"
          >
            {searchable && searchQuery.trim().length > 0 && (
              <li aria-hidden="true" className="px-2.5 pb-1 pt-1 text-[10px] font-mono text-warm-stone">
                {filteredOptions.length} hasil untuk &quot;{searchQuery.trim()}&quot;
              </li>
            )}
            {filteredOptions.map((option, idx) => {
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
                  className={`rounded-lg p-2 text-xs transition-colors flex items-center justify-between gap-2.5 cursor-pointer ${
                    option.disabled
                      ? 'opacity-40 cursor-not-allowed bg-transparent'
                      : isSelected
                      ? 'bg-forest-subtle text-forest font-semibold'
                      : isHighlighted
                      ? 'bg-tebu-100 text-warm-black'
                      : 'text-warm-black hover:bg-tebu-100/70'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {option.icon && (
                      <span className="shrink-0 overflow-hidden rounded-[8px]">
                        {option.icon}
                      </span>
                    )}
                    <div className="min-w-0 flex-1 space-y-0.5 py-0.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold">{option.label}</span>
                        {option.badge && (
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                              isSelected
                                ? 'bg-forest text-tebu-50'
                                : 'border border-warm-border bg-warm-surface text-warm-muted'
                            }`}
                          >
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.description && (
                        <p
                          className={`truncate text-[10px] leading-tight ${
                            isSelected ? 'text-forest/80' : 'text-warm-muted'
                          }`}
                        >
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 shrink-0 text-forest stroke-[2.5]" aria-hidden="true" />
                  )}
                </li>
              );
            })}
            {filteredOptions.length === 0 && (
              <li className="space-y-1 px-3 py-6 text-center">
                <p className="text-xs font-semibold text-warm-black">Tidak ada menu yang cocok.</p>
                <p className="text-[11px] text-warm-muted">Coba kata kunci SKU, nama, atau kategori lain.</p>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
