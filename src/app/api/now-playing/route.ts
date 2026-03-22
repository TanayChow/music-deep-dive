import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export interface NowPlayingTrack {
  track: string;
  artist: string;
  album: string;
  isPlaying: boolean;
}

const APPLESCRIPT = `
tell application "Music"
  if player state is playing then
    set t to current track
    return (name of t) & "|||" & (artist of t) & "|||" & (album of t)
  end if
  return "stopped"
end tell
`.trim();

export async function GET() {
  try {
    const output = execSync(`osascript -e '${APPLESCRIPT.replace(/'/g, "'\\''")}'`, {
      timeout: 5000,
      encoding: 'utf8',
    }).trim();

    if (output === 'stopped' || !output) {
      return NextResponse.json(null, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const parts = output.split('|||');
    if (parts.length < 3) {
      return NextResponse.json(null, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const track: NowPlayingTrack = {
      track: parts[0].trim(),
      artist: parts[1].trim(),
      album: parts[2].trim(),
      isPlaying: true,
    };

    return NextResponse.json(track, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(null, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
