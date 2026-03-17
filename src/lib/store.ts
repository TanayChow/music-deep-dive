'use client';

import { AudioFeatures, ProductionCredit, Artist } from './types';

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const CACHE_PREFIX = 'mdd_cache_';

function safeLocalStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export const store = {
  getCache<T>(key: string): T | null {
    const ls = safeLocalStorage();
    if (!ls) return null;
    try {
      const raw = ls.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw) as CacheEntry;
      if (Date.now() > entry.expiresAt) {
        ls.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return entry.data as T;
    } catch {
      return null;
    }
  },

  setCache(key: string, data: unknown, ttlMinutes: number = 60): void {
    const ls = safeLocalStorage();
    if (!ls) return;
    try {
      const entry: CacheEntry = {
        data,
        expiresAt: Date.now() + ttlMinutes * 60 * 1000,
      };
      ls.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Storage might be full — silently skip
    }
  },

  clearCache(): void {
    const ls = safeLocalStorage();
    if (!ls) return;
    const keys = Object.keys(ls).filter((k) => k.startsWith(CACHE_PREFIX));
    keys.forEach((k) => ls.removeItem(k));
  },

  getAudioFeatures(trackId: string): AudioFeatures | null {
    return this.getCache<AudioFeatures>(`audio_features_${trackId}`);
  },

  setAudioFeatures(trackId: string, features: AudioFeatures): void {
    this.setCache(`audio_features_${trackId}`, features, 60 * 24 * 7); // 7 days
  },

  getProductionCredits(trackId: string): ProductionCredit | null {
    return this.getCache<ProductionCredit>(`production_${trackId}`);
  },

  setProductionCredits(trackId: string, credits: ProductionCredit): void {
    this.setCache(`production_${trackId}`, credits, 60 * 24 * 30); // 30 days
  },

  getArtist(artistId: string): Artist | null {
    return this.getCache<Artist>(`artist_${artistId}`);
  },

  setArtist(artistId: string, artist: Artist): void {
    this.setCache(`artist_${artistId}`, artist, 60 * 24 * 7); // 7 days
  },

  getStorageStats(): { cacheEntries: number; estimatedKB: number } {
    const ls = safeLocalStorage();
    if (!ls) return { cacheEntries: 0, estimatedKB: 0 };
    const cacheEntries = Object.keys(ls).filter((k) => k.startsWith(CACHE_PREFIX)).length;
    let totalBytes = 0;
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      if (key?.startsWith('mdd_')) {
        totalBytes += (ls.getItem(key) ?? '').length * 2;
      }
    }
    return {
      cacheEntries,
      estimatedKB: Math.round(totalBytes / 1024),
    };
  },
};
