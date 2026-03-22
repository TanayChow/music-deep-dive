import { NextRequest, NextResponse } from 'next/server';
import { LLMInsights } from '@/lib/types';

const ALBUM_PROMPT = (artist: string, album: string) => `You are an expert in music history, recording studio craft, gear, and mixing/production techniques — writing for a fellow musician who geeks out on the technical side of record-making.

For the album "${album}" by "${artist}", return the following as valid JSON with exactly these two keys:

- productionProcess: A detailed narrative covering:
  • Studio(s) used and their significance (console type, room acoustics, any notable house gear)
  • Signal chain specifics: microphones, preamps, compressors, outboard gear, and why they matter to the sound
  • Instruments used — any non-standard tunings, rare or signature gear, custom modifications
  • Recording approach: live vs. overdub, tape vs. digital, tracking order, isolation techniques
  • Mixing philosophy and key processing choices (e.g. parallel compression, tape saturation, reverb choices)
  • Role of each band member in shaping the sound, including any production contributions
  • Anything unique or iconic about how this record was made that a studio-savvy listener would want to know
  • If detailed recording info is sparse, describe the techniques and philosophies the producers/engineers are generally known for, and connect that to what you can hear on the record
  • Philosophical and artistic influences that shaped the sonic direction of the album

- producers: An array of objects, one per producer or engineer, each containing:
  • Their name and role on this album
  • A short bio (2–3 sentences) covering their background, signature approach, and most prominent works beyond this album
  • Any notable gear, studios, or techniques they are especially associated with

Return only valid JSON with exactly those two keys, no markdown, no extra text.`;

const ARTIST_PROMPT = (artist: string) => `You are an expert in music history, recording studio craft, gear, and production techniques — writing for a fellow musician who researches studios, signal chains, and artist production tips.

For the artist "${artist}", return the following as valid JSON with exactly these two keys:

- productionProcess: A detailed narrative covering:
  • Their typical studio setup and preferred recording environments
  • Signature instruments, gear, and any custom or rare equipment central to their sound
  • Recording and production philosophy — live vs. layered, analog vs. digital preferences, self-production vs. collaboration
  • Mixing and sonic signature: key processing choices, recurring production techniques, use of space/dynamics
  • How their approach has evolved across different eras of their career
  • Philosophical, musical, and cultural influences that have shaped how they make records

- producers: An array of objects, one per key producer or engineer they have worked with, each containing:
  • Name and the albums or era they worked on together
  • A short bio covering their background, signature techniques, and most prominent works beyond this artist
  • Any studios or gear they are especially associated with

Return only valid JSON with exactly those two keys, no markdown, no extra text.`;


function buildCacheKey(type: string, artist: string, album?: string): string {
  if (type === 'album' && album) {
    return `album_${artist}---${album}`;
  }
  return `artist_${artist}`;
}

async function callClaude(prompt: string): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}

async function callOpenAI(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`);
  const json = await res.json() as { choices: { message: { content: string } }[] };
  return json.choices[0]?.message?.content ?? '';
}

function stripMarkdown(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function parseAndValidate(raw: string): {
  productionProcess: Record<string, string> | string;
  producers: (Record<string, string> | string)[];
} {
  const parsed = JSON.parse(stripMarkdown(raw));
  if (parsed.productionProcess == null || !Array.isArray(parsed.producers)) {
    console.error('[LLM] unexpected shape:', JSON.stringify(parsed).slice(0, 500));
    throw new Error('LLM response missing required fields');
  }
  return {
    productionProcess: parsed.productionProcess,
    producers: parsed.producers,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  const album = searchParams.get('album') ?? undefined;
  const type = (searchParams.get('type') ?? 'album') as 'album' | 'artist';

  if (!artist) {
    return NextResponse.json({ error: 'artist is required' }, { status: 400 });
  }
  if (type === 'album' && !album) {
    return NextResponse.json({ error: 'album is required for type=album' }, { status: 400 });
  }

  const prompt = type === 'album' && album
    ? ALBUM_PROMPT(artist, album)
    : ARTIST_PROMPT(artist);

  const provider = process.env.LLM_PROVIDER ?? 'claude';

  try {
    const raw = provider === 'openai' ? await callOpenAI(prompt) : await callClaude(prompt);
    const fields = parseAndValidate(raw);

    const insights: LLMInsights = {
      subject: type === 'album' && album ? album : artist,
      type,
      ...fields,
    };

    return NextResponse.json(insights, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('LLM enrichment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'LLM request failed' },
      { status: 500 }
    );
  }
}
