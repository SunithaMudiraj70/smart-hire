import React, { useState, useEffect, useRef, useId } from 'react';
import { MapPin, X, Globe, Check, Loader2, ChevronDown } from 'lucide-react';
import axios from 'axios';

export interface LocationItem {
  type: 'city' | 'state' | 'remote';
  name: string;
  state?: string | null;
  label: string;
  value: string;
}

interface LocationComboboxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const LocationCombobox: React.FC<LocationComboboxProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'City, State, or Remote...',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Sync external value changes to local input state
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced fetch of matching locations from API
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get<LocationItem[]>('/api/locations', {
          params: { q: inputValue.trim() },
        });
        if (active) {
          setOptions(res.data || []);
          setHighlightedIndex(0);
        }
      } catch {
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [inputValue]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // If user left without picking an option, restore current selected value
        setInputValue(value);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const selectOption = (opt: LocationItem) => {
    setInputValue(opt.value);
    onChange(opt.value);
    setIsOpen(false);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue('');
    onChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
        selectOption(options[highlightedIndex]);
      } else if (inputValue.trim()) {
        // Fallback: pick typed text
        onChange(inputValue.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue(value);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <MapPin
          size={16}
          className="absolute left-3.5 text-slate-400 pointer-events-none shrink-0"
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Location"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0 && options[highlightedIndex]
              ? `${listboxId}-opt-${highlightedIndex}`
              : undefined
          }
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-12 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {loading && <Loader2 size={13} className="animate-spin text-slate-400" />}
          {inputValue && (
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Clear location"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle location options"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <ChevronDown size={13} />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 text-xs sm:text-sm"
        >
          {options.length === 0 ? (
            <li className="px-3.5 py-2.5 text-xs text-slate-400 text-center">
              {loading ? 'Searching locations...' : 'No matching locations found'}
            </li>
          ) : (
            options.map((opt, idx) => {
              const isSelected = value.toLowerCase() === opt.value.toLowerCase();
              const isHighlighted = idx === highlightedIndex;

              return (
                <li
                  key={`${opt.type}-${opt.name}-${idx}`}
                  id={`${listboxId}-opt-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => selectOption(opt)}
                  className={`px-3.5 py-2 flex items-center justify-between cursor-pointer transition ${
                    isHighlighted
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.type === 'remote' ? (
                      <Globe size={14} className="text-brand-600 shrink-0" />
                    ) : (
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-brand-600 shrink-0 ml-2" />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};
