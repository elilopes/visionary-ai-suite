
import React, { useState, useRef, useEffect, useMemo } from 'react';

interface SelectorProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  searchPlaceholder: string;
}

const Selector: React.FC<SelectorProps> = ({ id, label, value, options, onChange, searchPlaceholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredOptions = useMemo(() =>
    options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    ), [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
        const activeItem = listRef.current.children[activeIndex] as HTMLLIElement;
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }
  }, [activeIndex, isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
    setActiveIndex(-1);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filteredOptions[activeIndex]) {
        handleSelect(filteredOptions[activeIndex]);
      } else if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="flex flex-col space-y-2" ref={wrapperRef}>
      <label htmlFor={id} className="text-sm font-bold text-[var(--text-muted)]">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--accent)] transition duration-150 ease-in-out p-3 text-base text-left flex justify-between items-center"
        >
          <span className="truncate">{value}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute z-20 mt-1 w-full bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-2 border-b border-[var(--border-main)] bg-[var(--bg-input)]">
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                className="w-full bg-[var(--bg-panel)] border border-[var(--border-main)] text-[var(--text-main)] rounded-md focus:ring-2 focus:ring-[var(--accent)] p-2 text-sm outline-none"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
            <ul ref={listRef} className="max-h-60 overflow-auto custom-scrollbar">
              {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
                <li
                  key={option}
                  className={`p-3 cursor-pointer text-sm font-medium transition-colors ${activeIndex === index ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-main)] hover:bg-[var(--bg-input)]'}`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {option}
                </li>
              )) : (
                <li className="p-3 text-sm text-[var(--text-muted)] italic">Nenhuma opção encontrada</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Selector;
