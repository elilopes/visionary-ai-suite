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
      <label htmlFor={id} className="text-sm font-medium text-gray-400">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              inputRef.current?.focus();
            }
          }}
          className="w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base text-left flex justify-between items-center"
        >
          <span className="truncate">{value}</span>
          <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg">
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                className="w-full bg-gray-900 border-gray-600 text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <ul ref={listRef} className="max-h-60 overflow-auto">
              {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
                <li
                  key={option}
                  className={`p-2 cursor-pointer text-sm ${activeIndex === index ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {option}
                </li>
              )) : (
                <li className="p-2 text-sm text-gray-500">No options found</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Selector;