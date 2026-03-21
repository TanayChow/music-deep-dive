'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LLMInsights } from '@/lib/types';
import { store } from '@/lib/store';
import { NowPlayingTrack } from '@/app/api/now-playing/route';

interface NowPlayingState {
  track: string | null;
  artist: string | null;
  album: string | null;
  isPlaying: boolean;
  llmInsights: LLMInsights | null;
  llmLoading: boolean;
}

export function useNowPlaying(): NowPlayingState {
  const [state, setState] = useState<NowPlayingState>({
    track: null,
    artist: null,
    album: null,
    isPlaying: false,
    llmInsights: null,
    llmLoading: false,
  });

  const prevArtistRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLLMInsights = useCallback(async (artist: string) => {
    const cacheKey = `artist_${artist}`;
    const cached = store.getLLMInsights(cacheKey);
    if (cached) {
      setState((s) => ({ ...s, llmInsights: cached, llmLoading: false }));
      return;
    }

    setState((s) => ({ ...s, llmLoading: true, llmInsights: null }));
    try {
      const res = await fetch(
        `/api/enrichment/llm?artist=${encodeURIComponent(artist)}&type=artist`
      );
      if (res.ok) {
        const data = (await res.json()) as LLMInsights;
        store.setLLMInsights(cacheKey, data);
        setState((s) => ({ ...s, llmInsights: data, llmLoading: false }));
      } else {
        setState((s) => ({ ...s, llmLoading: false }));
      }
    } catch {
      setState((s) => ({ ...s, llmLoading: false }));
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/now-playing');
      if (!res.ok) return;
      const data = (await res.json()) as NowPlayingTrack | null;

      if (!data || !data.isPlaying) {
        prevArtistRef.current = null;
        setState({
          track: null,
          artist: null,
          album: null,
          isPlaying: false,
          llmInsights: null,
          llmLoading: false,
        });
        return;
      }

      setState((s) => ({
        ...s,
        track: data.track,
        artist: data.artist,
        album: data.album,
        isPlaying: true,
      }));

      if (data.artist !== prevArtistRef.current) {
        prevArtistRef.current = data.artist;
        fetchLLMInsights(data.artist);
      }
    } catch {
      // Network error — silently skip
    }
  }, [fetchLLMInsights]);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  return state;
}
