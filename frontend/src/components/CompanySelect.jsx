import React, { useState, useRef, useEffect } from 'react';
import { Building, ChevronDown, Search, Check, Plus, X } from 'lucide-react';
import { POPULAR_COMPANY_CATEGORIES } from '../constants/companies.js';

export function CompanySelect({
  value,
  onChange,
  customCompany,
  onCustomCompanyChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on click outside
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

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter categories and companies
  const filteredCategories = POPULAR_COMPANY_CATEGORIES.map((cat) => {
    const matchingCompanies = cat.companies.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...cat,
      companies: matchingCompanies
    };
  }).filter((cat) => cat.companies.length > 0);

  const handleSelectCompany = (companyName) => {
    onChange(companyName);
    setIsOpen(false);
  };

  const handleSelectCustom = () => {
    onChange('custom');
    setIsOpen(false);
  };

  const isCustom = value === 'custom' || (!POPULAR_COMPANY_CATEGORIES.some(cat => cat.companies.some(c => c.name === value)) && Boolean(value));
  const displayCompany = value === 'custom'
    ? (customCompany.trim() || 'Custom Company (click to edit)')
    : (value || 'Select Company...');

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-foreground mb-1">Company</label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between pl-3.5 pr-3 py-2 text-sm rounded-lg border bg-card text-foreground transition-all duration-150 ${
          isOpen
            ? 'border-primary ring-2 ring-primary/20 shadow-md'
            : 'border-border hover:border-muted-foreground/40'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <Building className="w-4 h-4 text-primary shrink-0" />
          <span
            className={`truncate text-sm font-medium ${
              value === 'custom' && !customCompany
                ? 'text-muted-foreground italic'
                : !value
                ? 'text-muted-foreground'
                : 'text-foreground'
            }`}
          >
            {displayCompany}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-80 top-full mt-1.5 z-50 rounded-xl border border-border bg-card shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2.5 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies (e.g. Google, TCS, BEL)..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Companies Scrollable List */}
          <div className="max-h-72 overflow-y-auto py-1 scrollbar-thin">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <div key={cat.category} className="mb-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-y border-border/40">
                    {cat.category}
                  </div>
                  <div className="py-0.5">
                    {cat.companies.map((c) => {
                      const isSelected = value === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleSelectCompany(c.name)}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors group ${
                            isSelected
                              ? 'bg-primary/15 text-primary font-semibold'
                              : 'text-foreground hover:bg-muted/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="truncate">{c.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border shrink-0">
                              {c.tag}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary shrink-0 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No matching companies found.
              </div>
            )}

            {/* Custom Company Option (pinned at bottom) */}
            <div className="border-t border-border pt-1 mt-1 bg-muted/10">
              <button
                type="button"
                onClick={handleSelectCustom}
                className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
                  value === 'custom'
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-primary hover:bg-muted/60'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Type Custom Company Name (Other)...</span>
                {value === 'custom' && (
                  <Check className="w-4 h-4 text-primary shrink-0 ml-auto" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Company Input (shown when custom is selected) */}
      {value === 'custom' && (
        <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <input
            type="text"
            required
            autoFocus
            value={customCompany}
            onChange={(e) => onCustomCompanyChange(e.target.value)}
            placeholder="Type custom company name (e.g. Acme Labs)..."
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
