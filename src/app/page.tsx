'use client';

import { useState, useCallback, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SearchResult } from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(value), 350);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(query);
  }

  function handleResultClick(result: SearchResult) {
    router.push(`/${result.type}/${result.id}`);
  }

  const artists = results.filter((r) => r.type === 'artist');
  const albums = results.filter((r) => r.type === 'album');

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-start pt-16 sm:pt-24 px-4">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-accent-spotify flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Music Deep Dive</h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto">
          Explore production credits, audio features, artist bios, and trivia for any song or artist.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
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
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search for an artist or track…"
            autoFocus
            className="w-full bg-bg-card border border-border rounded-2xl py-3.5 pl-12 pr-28 text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent-spotify focus:ring-1 focus:ring-accent-spotify transition-colors"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-accent-spotify text-black text-sm font-semibold rounded-xl hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? <LoadingSpinner size="sm" /> : 'Search'}
          </button>
        </div>
      </form>

      {/* Results */}
      {hasSearched && !isSearching && (
        <div className="w-full max-w-xl mt-6 space-y-6">
          {results.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              No results found for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <>
              {artists.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Artists
                  </h2>
                  <div className="bg-bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                    {artists.map((result) => (
                      <button
                        key={`artist:${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0 ring-1 ring-border">
                          {result.imageUrl ? (
                            <Image
                              src={result.imageUrl}
                              alt={result.title}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-100 truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {albums.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Albums
                  </h2>
                  <div className="bg-bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                    {albums.map((result) => (
                      <button
                        key={`album:${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-bg-secondary flex-shrink-0 ring-1 ring-border">
                          {result.imageUrl ? (
                            <Image
                              src={result.imageUrl}
                              alt={result.title}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H11V3.5zM6 20V4h3v7h9v9H6z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-100 truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
