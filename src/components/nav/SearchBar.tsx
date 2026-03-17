'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSearch } from '@/hooks/useSearch';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function SearchBar() {
  const router = useRouter();
  const { query, setQuery, results, isSearching } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(type: string, id: string) {
    setIsOpen(false);
    setQuery('');
    router.push(`/${type}/${id}`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search tracks, artists..."
          className="w-full bg-bg-card border border-border rounded-full py-2 pl-9 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-spotify focus:ring-1 focus:ring-accent-spotify transition-colors"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
          {results.map((result) => (
            <button
              key={`${result.type}:${result.id}`}
              onClick={() => handleSelect(result.type, result.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-md overflow-hidden bg-bg-secondary flex-shrink-0">
                {result.imageUrl ? (
                  <Image
                    src={result.imageUrl}
                    alt={result.title}
                    width={36}
                    height={36}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-100 truncate">{result.title}</p>
                {result.subtitle && (
                  <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                )}
              </div>
              <span className="text-xs text-gray-500 capitalize flex-shrink-0">{result.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
