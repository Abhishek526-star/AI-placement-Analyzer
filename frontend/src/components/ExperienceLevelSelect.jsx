import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, GraduationCap, Award, Briefcase, Sparkles } from 'lucide-react';

export const EXPERIENCE_LEVEL_OPTIONS = [
  {
    value: 'Entry Level (0-2 years)',
    label: 'Entry Level (0-2 yrs)',
    badge: '0-2 yrs',
    description: 'Fresh graduates, entry-level engineers, early career',
    icon: GraduationCap
  },
  {
    value: 'Mid Level (2-5 years)',
    label: 'Mid Level (2-5 yrs)',
    badge: '2-5 yrs',
    description: 'Engineers with 2-5 years of industry experience',
    icon: Briefcase
  },
  {
    value: 'Senior Level (5+ years)',
    label: 'Senior Level (5+ yrs)',
    badge: '5+ yrs',
    description: 'Senior, staff, or lead engineers with 5+ years experience',
    icon: Award
  },
  {
    value: 'Internship / Campus Placement',
    label: 'Campus Placement',
    badge: 'Campus',
    description: 'College students, trainees, and summer/winter internships',
    icon: Sparkles
  }
];

export function ExperienceLevelSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const selectedOption =
    EXPERIENCE_LEVEL_OPTIONS.find((opt) => opt.value === value) ||
    EXPERIENCE_LEVEL_OPTIONS[0];

  const IconComponent = selectedOption.icon || GraduationCap;

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-foreground mb-1">
        Experience Level
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between pl-3 pr-2.5 py-2 text-sm rounded-lg border bg-card text-foreground transition-all duration-150 ${
          isOpen
            ? 'border-primary ring-2 ring-primary/20 shadow-md'
            : 'border-border hover:border-muted-foreground/40'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <IconComponent className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate text-sm font-medium">
            {selectedOption.label}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-72 top-full mt-1.5 z-50 rounded-xl border border-border bg-card shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 py-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40">
            Target Experience Tier
          </div>

          <div className="py-1">
            {EXPERIENCE_LEVEL_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              const ItemIcon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start justify-between px-3.5 py-2.5 text-left text-xs transition-colors group ${
                    isSelected
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <ItemIcon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                      }`}
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{opt.label}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                          {opt.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {opt.description}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
