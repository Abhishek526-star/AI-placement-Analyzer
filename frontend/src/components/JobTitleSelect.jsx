import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, ChevronDown, Search, Check, Plus, X, Sparkles } from 'lucide-react';
import { POPULAR_JOB_CATEGORIES } from '../constants/jobRoles.js';

export function JobTitleSelect({
  selectedRole,
  onRoleChange,
  customTitle,
  onCustomTitleChange,
  onLoadSampleJd,
  sampleLoaded
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter categories and roles based on search query
  const filteredCategories = POPULAR_JOB_CATEGORIES.map((cat) => {
    const matchingRoles = cat.roles.filter(
      (r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...cat,
      roles: matchingRoles
    };
  }).filter((cat) => cat.roles.length > 0);

  const handleSelectRole = (title) => {
    onRoleChange(title);
    setIsOpen(false);
  };

  const handleSelectCustom = () => {
    onRoleChange('custom');
    setIsOpen(false);
  };

  const displayTitle = selectedRole === 'custom' 
    ? (customTitle.trim() || 'Custom Job Title (click to edit)') 
    : selectedRole;

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      {/* Label & Sample JD Action */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-foreground">
          Job Title <span className="text-rose-500">*</span>
        </label>
        {selectedRole !== 'custom' && onLoadSampleJd && (
          <button
            type="button"
            onClick={onLoadSampleJd}
            className="flex items-center gap-1 text-[11px] text-primary hover:text-primary-hover font-medium transition-colors"
            title="Auto-populate a comprehensive sample Job Description for this role"
          >
            <Sparkles className="w-3 h-3" />
            <span>{sampleLoaded ? 'Sample JD Loaded!' : 'Load Sample JD for this Role'}</span>
          </button>
        )}
      </div>

      {/* Custom Dropdown Trigger */}
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
          <Briefcase className="w-4 h-4 text-primary shrink-0" />
          <span className={`truncate text-sm font-medium ${selectedRole === 'custom' && !customTitle ? 'text-muted-foreground italic' : 'text-foreground'}`}>
            {displayTitle}
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
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-card shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2.5 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search standard roles (e.g. React, SDE, Python)..."
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

          {/* Roles Scrollable List */}
          <div className="max-h-72 overflow-y-auto py-1 scrollbar-thin">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <div key={cat.category} className="mb-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-y border-border/40">
                    {cat.category}
                  </div>
                  <div className="py-0.5">
                    {cat.roles.map((r) => {
                      const isSelected = selectedRole === r.title;
                      return (
                        <button
                          key={r.title}
                          type="button"
                          onClick={() => handleSelectRole(r.title)}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors group ${
                            isSelected
                              ? 'bg-primary/15 text-primary font-semibold'
                              : 'text-foreground hover:bg-muted/60'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="truncate">{r.title}</span>
                            {r.experience && (
                              <span className="text-[10px] text-muted-foreground/80 group-hover:text-muted-foreground">
                                {r.experience}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No matching standard roles found.
              </div>
            )}

            {/* Custom Role Option (always pinned at the bottom) */}
            <div className="border-t border-border pt-1 mt-1 bg-muted/10">
              <button
                type="button"
                onClick={handleSelectCustom}
                className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
                  selectedRole === 'custom'
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-primary hover:bg-muted/60'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Type Custom Job Title (Other)...</span>
                {selectedRole === 'custom' && (
                  <Check className="w-4 h-4 text-primary shrink-0 ml-auto" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Title Input field (shown when custom is selected) */}
      {selectedRole === 'custom' && (
        <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <input
            type="text"
            required
            autoFocus
            value={customTitle}
            onChange={(e) => onCustomTitleChange(e.target.value)}
            placeholder="Type custom job title (e.g. Lead Platform Engineer)..."
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
