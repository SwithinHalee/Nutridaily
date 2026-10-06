import React from 'react';

export interface BrandLogoProps {
  className?: string;
  variant?: 'color' | 'dark' | 'mono';
  ariaLabel?: string;
}

/**
 * Komponen resmi logo murni NutriDaily Indonesia (Konsep 02: Tri-Macro Plate Emblem).
 * Menerapkan prinsip artisan vector tanpa gradien generik, rasio proporsional,
 * dan dukungan tampilan warna fisik resmi (terakota hangat & hijau alpukat).
 */
export function BrandLogo({
  className = 'w-8 h-8',
  variant = 'color',
  ariaLabel = 'NutriDaily Indonesia',
}: BrandLogoProps) {
  if (variant === 'dark') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label={ariaLabel}
      >
        <circle cx="50" cy="50" r="43" stroke="#FDFBF7" strokeWidth="4.5" />
        <path d="M22 53 C 22 71, 34 81, 50 81 C 66 81, 78 71, 78 53 Z" fill="#FDFBF7" />
        <path d="M50 47 C 43 37, 37 25, 50 15 C 58 25, 54 37, 50 47 Z" fill="#EDE8DE" />
        <path d="M52 47 C 58 39, 68 31, 66 17 C 54 21, 52 37, 52 47 Z" fill="#D96B43" />
      </svg>
    );
  }

  if (variant === 'mono') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label={ariaLabel}
      >
        <circle cx="50" cy="50" r="43" stroke="currentColor" strokeWidth="4.5" />
        <path d="M22 53 C 22 71, 34 81, 50 81 C 66 81, 78 71, 78 53 Z" fill="currentColor" />
        <path d="M50 47 C 43 37, 37 25, 50 15 C 58 25, 54 37, 50 47 Z" fill="currentColor" />
        <path d="M52 47 C 58 39, 68 31, 66 17 C 54 21, 52 37, 52 47 Z" fill="currentColor" />
      </svg>
    );
  }

  // Default color variant
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <circle cx="50" cy="50" r="43" stroke="#2C4A3E" strokeWidth="4.5" />
      <path d="M22 52 C 22 71, 34 81, 50 81 C 66 81, 78 71, 78 52 Z" fill="#2C4A3E" />
      <line x1="26" y1="50" x2="74" y2="50" stroke="#FDFBF7" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 48 C 43 38, 37 26, 50 16 C 58 26, 54 38, 50 48 Z" fill="#2C4A3E" />
      <path d="M52 48 C 58 40, 68 32, 66 18 C 54 22, 52 38, 52 48 Z" fill="#D96B43" />
    </svg>
  );
}
