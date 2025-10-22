/**
 * TagInput Component
 * 
 * Multi-select input with tag display, autocomplete, and keyboard navigation.
 */

import { useState, KeyboardEvent, ChangeEvent } from 'react';
import { X } from 'lucide-react';

export interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  maxTags?: number;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export function TagInput({
  label,
  value,
  onChange,
  suggestions = [],
  maxTags = 10,
  placeholder = 'Type and press Enter',
  error,
  required,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion)
  );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  const inputId = `tag-input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-text-dark dark:text-dark-text-primary mb-2"
      >
        {label}
        {required && <span className="text-warm-coral ml-1" aria-label="required">*</span>}
        {maxTags && (
          <span className="text-text-light dark:text-dark-text-tertiary text-xs ml-2">
            ({value.length}/{maxTags})
          </span>
        )}
      </label>

      <div
        className={`
          w-full min-h-[42px] px-3 py-2 rounded-lg border
          bg-white dark:bg-dark-bg-secondary
          transition-colors duration-200
          focus-within:ring-2 focus-within:ring-deep-amethyst dark:focus-within:ring-dark-accent-amethyst
          ${error 
            ? 'border-red-500 dark:border-red-400 focus-within:ring-red-500 dark:focus-within:ring-red-400' 
            : 'border-gray-300 dark:border-dark-border-default hover:border-gray-400 dark:hover:border-dark-border-emphasis'
          }
        `}
      >
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-deep-amethyst/10 dark:bg-dark-accent-amethyst/20 text-deep-amethyst dark:text-dark-accent-amethyst text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-deep-amethyst/20 dark:hover:bg-dark-accent-amethyst/30 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          
          {value.length < maxTags && (
            <input
              id={inputId}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(inputValue.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={value.length === 0 ? placeholder : ''}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-text-dark dark:text-dark-text-primary placeholder-text-light dark:placeholder-dark-text-muted"
            />
          )}
        </div>
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="mt-1 p-2 rounded-lg border border-gray-300 dark:border-dark-border-default bg-white dark:bg-dark-bg-secondary shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full text-left px-3 py-2 rounded hover:bg-deep-amethyst/10 dark:hover:bg-dark-accent-amethyst/20 text-text-dark dark:text-dark-text-primary transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
