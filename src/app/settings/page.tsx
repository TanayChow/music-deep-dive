'use client';

import { useState, useEffect } from 'react';
import { store } from '@/lib/store';

export default function SettingsPage() {
  const [storageStats, setStorageStats] = useState({ cacheEntries: 0, estimatedKB: 0 });

  useEffect(() => {
    setStorageStats(store.getStorageStats());
  }, []);

  function handleClearCache() {
    store.clearCache();
    setStorageStats(store.getStorageStats());
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage cached data and learn about the APIs powering this app.</p>
      </div>

      {/* Cache management */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Cache &amp; Storage
        </h2>
        <div className="bg-bg-card border border-border rounded-xl p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{storageStats.cacheEntries}</p>
              <p className="text-xs text-gray-500 mt-0.5">Cached items</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{storageStats.estimatedKB} KB</p>
              <p className="text-xs text-gray-500 mt-0.5">Storage used</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Artist bios, audio features, production credits, and trivia results are cached locally
            in your browser so repeat lookups are instant. The cache expires automatically.
          </p>

          <div className="pt-4 border-t border-border">
            <button
              onClick={handleClearCache}
              className="px-3 py-1.5 border border-border rounded-lg text-xs text-gray-400 hover:text-white hover:border-border-light transition-colors"
            >
              Clear cache
            </button>
          </div>
        </div>
      </div>

      {/* API credits */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Powered By
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed mb-4">
          Music Deep Dive enriches every search result with data from several public APIs.
          No account sign-in is required.
        </p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-green-400 text-xs font-medium w-28 flex-shrink-0">Last.fm</span>
            <span className="text-xs text-gray-400">Artist bios, similar artists, search, and track tags</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-orange-400 text-xs font-medium w-28 flex-shrink-0">MusicBrainz</span>
            <span className="text-xs text-gray-400">Production credits, mixing &amp; mastering engineers, studio info</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-yellow-400 text-xs font-medium w-28 flex-shrink-0">Genius</span>
            <span className="text-xs text-gray-400">Song trivia, annotations, and background facts</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 text-xs font-medium w-28 flex-shrink-0">Spotify API</span>
            <span className="text-xs text-gray-400">Audio features (BPM, energy, danceability, key) via client credentials — no login needed</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
