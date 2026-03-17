'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ForceGraphData, ForceGraphNode } from '@/lib/types';

// Must use dynamic import with ssr: false for react-force-graph-2d
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface SimilarArtistsGraphProps {
  graphData: ForceGraphData;
  centerArtistId: string;
}

export function SimilarArtistsGraph({ graphData, centerArtistId }: SimilarArtistsGraphProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = useCallback(
    (node: ForceGraphNode) => {
      if (node.id && node.id !== centerArtistId) {
        router.push(`/artist/${node.id}`);
      }
    },
    [router, centerArtistId]
  );

  const nodeCanvasObject = useCallback(
    (node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = Math.max(10, 12 / globalScale);
      const radius = node.isCenter ? 20 : 12;
      const x = node.x ?? 0;
      const y = node.y ?? 0;

      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.isCenter ? '#1DB954' : node.color;
      ctx.fill();

      if (node.isCenter) {
        ctx.strokeStyle = 'rgba(29, 185, 84, 0.4)';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Draw label
      ctx.font = `${node.isCenter ? 'bold ' : ''}${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x, y + radius + fontSize);
    },
    []
  );

  if (!graphData.nodes.length) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-gray-400 text-sm">No similar artists data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-white">Similar Artists</h3>
        <p className="text-xs text-gray-500 mt-0.5">Click a node to navigate to that artist</p>
      </div>
      <div ref={containerRef} className="w-full h-80 relative">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ForceGraph2D
          graphData={graphData as any}
          backgroundColor="#1a1a24"
          nodeCanvasObject={nodeCanvasObject as any}
          onNodeClick={handleNodeClick as any}
          nodeRelSize={6}
          linkColor={() => 'rgba(255,255,255,0.15)'}
          linkWidth={1}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      </div>
    </div>
  );
}
