/**
 * components/GraphCanvas.jsx
 * ---------------------------------------------------------------------------
 * Wraps react-force-graph-2d with CryptoTrace-specific node and link rendering.
 *
 * Node rendering:
 *   - Source  (green) — moderate circle
 *   - Intermediary (slate) — smaller circle
 *   - Exchange (red) — large circle with animated pulsing glow
 *   - Context (dark slate) — small, semi-transparent
 *
 * Interactions:
 *   - Click node  → select it (communicated via onNodeSelect)
 *   - Click bg    → deselect
 *   - Hover node  → highlight with ring
 *   - Zoom-to-fit on new data
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { NODE_ROLES, ROLE_COLORS } from '../utils/constants.js';

/**
 * @param {object}   props
 * @param {object}   props.graphData         { nodes, links } from backend forceGraph payload.
 * @param {string|null} props.selectedNodeId Currently selected node id.
 * @param {(id: string|null) => void} props.onNodeSelect
 * @param {number}   props.width
 * @param {number}   props.height
 */
export default function GraphCanvas({
  graphData,
  selectedNodeId,
  onNodeSelect,
  width,
  height,
}) {
  const fgRef = useRef(null);
  const [hoverNode, setHoverNode] = useState(null);

  // Zoom to fit when data changes
  useEffect(() => {
    if (fgRef.current && graphData?.nodes?.length > 0) {
      // Small delay so the simulation has time to lay out
      const timer = setTimeout(() => {
        fgRef.current.zoomToFit(400, 60);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [graphData]);

  // Stable data reference so react-force-graph doesn't re-render on every parent render
  const data = useMemo(() => {
    if (!graphData || !graphData.nodes) return { nodes: [], links: [] };
    return {
      nodes: graphData.nodes.map((n) => ({ ...n })),
      links: graphData.links.map((l) => ({ ...l })),
    };
  }, [graphData]);

  // ----- Custom Node Painter ------------------------------------------------
  const paintNode = useCallback(
    (node, ctx, globalScale) => {
      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoverNode;
      const isExchange = node.role === NODE_ROLES.EXCHANGE;
      const isContext = node.role === NODE_ROLES.CONTEXT;

      const baseRadius = Math.sqrt(node.val ?? 4) * 2.5;
      const radius = baseRadius / Math.max(globalScale * 0.5, 0.5);

      let color = node.color ?? ROLE_COLORS[node.role] ?? '#94a3b8';

      // Override colors for Phase 1 tagged contracts & cross-case alerts
      if (node.crossCaseAlert) {
        color = '#E11D48'; // Crimson red for shared mule infrastructure
      } else if (node.contractTag) {
        if (node.contractTag.type === 'dex') color = '#8B5CF6';
        else if (node.contractTag.type === 'bridge') color = '#EA580C';
        else if (node.contractTag.type === 'mixer') color = '#E11D48';
      }

      // Check if there is an active trace in the graph
      const isTraceActive = data.nodes.some(n => n.onPath);
      const isOnPath = !!node.onPath;
      const isSource = node.role === NODE_ROLES.SOURCE;
      
      let alpha = 1;
      if (isTraceActive && !isOnPath && !isSource && !node.crossCaseAlert) {
        alpha = 0.2; // Dim non-critical nodes
      }

      // Pulsing glow ring for exchanges
      if (isExchange) {
        const t = (Date.now() % 2000) / 2000;
        const pulseScale = 1 + 0.3 * Math.sin(t * Math.PI * 2);
        const pulseAlpha = (0.15 + 0.15 * Math.sin(t * Math.PI * 2)) * alpha;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * pulseScale * 1.8, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(245, 158, 11, ${pulseAlpha})`; // Amber glow
        ctx.fill();
      }

      // Pulsing Crimson Glow Ring & Dashed Alert Halo for Cross-Case Nodes
      if (node.crossCaseAlert) {
        const t = (Date.now() % 1500) / 1500;
        const pulseScale = 1 + 0.35 * Math.sin(t * Math.PI * 2);
        const pulseAlpha = (0.2 + 0.2 * Math.sin(t * Math.PI * 2)) * alpha;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * pulseScale * 2.2, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(225, 29, 72, ${pulseAlpha})`; // Crimson glow
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5 / globalScale, 0, 2 * Math.PI);
        ctx.strokeStyle = '#E11D48';
        ctx.lineWidth = 2.5 / globalScale;
        ctx.setLineDash([4 / globalScale, 3 / globalScale]);
        ctx.stroke();
        ctx.restore();
      }

      // Selection / hover ring
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 3 / globalScale, 0, 2 * Math.PI);
        ctx.strokeStyle = isSelected ? '#F59E0B' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      // Main circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      
      if (isContext && !node.crossCaseAlert) {
        ctx.fillStyle = `rgba(51, 56, 69, ${alpha * 0.5})`;
      } else {
        // Hex to RGBA parsing helper to respect node opacity
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      ctx.fill();

      // Label (only when zoomed in enough)
      if (globalScale > 0.7 && (node.label || node.crossCaseAlert)) {
        const fontSize = Math.max(10 / globalScale, 3.5);
        ctx.font = `600 ${fontSize}px var(--font-mono)`; // Monospace Font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const labelText = node.crossCaseAlert 
          ? `⚠️ ${node.label ?? shortenAddress(node.addressDisplay ?? node.id)}`
          : (node.label ?? shortenAddress(node.addressDisplay ?? node.id));

        // Text shadow for high contrast legibility
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4 / globalScale;
        ctx.fillStyle = node.crossCaseAlert
          ? '#FCA5A5' // Soft red tint for cross-case labels
          : isContext
          ? `rgba(148, 163, 184, ${alpha * 0.75})`
          : `rgba(248, 250, 252, ${alpha * 0.9})`;

        ctx.fillText(labelText, node.x, node.y + radius + 3 / globalScale);
        ctx.restore();
      }

      // Draw mixer warning border instead of cartoonish emoji
      if (node.contractTag?.type === 'mixer' || node.riskBreakdown?.mixer) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 2 / globalScale, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(225, 29, 72, ${alpha})`;
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
      }
    },
    [selectedNodeId, hoverNode]
  );

  // ----- Custom Link Painter ------------------------------------------------
  const paintLink = useCallback(
    (link, ctx, globalScale) => {
      const isOnPath = !!link.onPath;
      const isTraceActive = data.nodes.some(n => n.onPath);
      
      let alpha = isOnPath ? 0.8 : 0.15;
      if (isTraceActive && !isOnPath) {
        alpha = 0.05; // Dim non-critical links heavily
      }
      
      const width = isOnPath 
        ? (link.width ?? 1.5) / Math.max(globalScale * 0.7, 0.5) * 1.5
        : (link.width ?? 1) / Math.max(globalScale * 0.7, 0.5);

      const source = link.source;
      const target = link.target;
      if (!source?.x || !target?.x) return;

      // Line
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      
      if (link.isBridge) {
        ctx.strokeStyle = `rgba(234, 88, 12, 0.95)`; // Bright orange for bridge links
        ctx.setLineDash([6 / globalScale, 4 / globalScale]); // Dashed line for bridge link
        ctx.lineWidth = Math.max(2.5 / globalScale, 1.5);
      } else {
        ctx.strokeStyle = isOnPath
          ? `rgba(245, 158, 11, ${alpha})` // Amber path links
          : `rgba(100, 116, 139, ${alpha})`; // Cool Slate fallback
        ctx.setLineDash([]);
        ctx.lineWidth = width;
      }
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash for arrow head and other drawings

      // Arrow head
      if (link.directed !== false) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) return;

        const nx = dx / len;
        const ny = dy / len;

        // Pull arrow back by target node radius
        const targetRadius = Math.sqrt((target.val ?? 4)) * 2.5 / Math.max(globalScale * 0.5, 0.5);
        const arrowX = target.x - nx * (targetRadius + 2 / globalScale);
        const arrowY = target.y - ny * (targetRadius + 2 / globalScale);

        const arrowLen = Math.max(6 / globalScale, 2);
        const arrowWidth = Math.max(3 / globalScale, 1.5);

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - nx * arrowLen + ny * arrowWidth,
          arrowY - ny * arrowLen - nx * arrowWidth
        );
        ctx.lineTo(
          arrowX - nx * arrowLen - ny * arrowWidth,
          arrowY - ny * arrowLen + nx * arrowWidth
        );
        ctx.closePath();
        ctx.fillStyle = link.isBridge
          ? `rgba(234, 88, 12, 0.95)`
          : isOnPath
          ? `rgba(245, 158, 11, ${alpha + 0.15})`
          : `rgba(100, 116, 139, ${alpha + 0.1})`;
        ctx.fill();
      }
    },
    [data.nodes]
  );

  // Force the graph to re-render for the exchange pulse animation
  useEffect(() => {
    if (!fgRef.current || !data.nodes.some((n) => n.role === NODE_ROLES.EXCHANGE)) return;
    const id = setInterval(() => {
      fgRef.current?.d3ReheatSimulation?.();
    }, 50);
    // Reheat is expensive; only run for 4 seconds after data loads
    const stop = setTimeout(() => clearInterval(id), 4000);
    return () => { clearInterval(id); clearTimeout(stop); };
  }, [data]);

  if (!data.nodes.length) return null;

  return (
    <ForceGraph2D
      ref={fgRef}
      width={width}
      height={height}
      graphData={data}
      nodeCanvasObject={paintNode}
      nodePointerAreaPaint={(node, color, ctx) => {
        const r = Math.sqrt(node.val ?? 4) * 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }}
      linkCanvasObject={paintLink}
      linkDirectionalParticles={(link) => (link.onPath ? 4 : 0)}
      linkDirectionalParticleWidth={(link) => (link.onPath ? 2.5 : 0)}
      linkDirectionalParticleColor={() => '#F59E0B'}
      linkDirectionalParticleSpeed={0.015}
      onNodeClick={(node) => onNodeSelect(node?.id ?? null)}
      onNodeHover={(node) => setHoverNode(node?.id ?? null)}
      onBackgroundClick={() => onNodeSelect(null)}
      backgroundColor="transparent"
      cooldownTicks={100}
      warmupTicks={50}
      d3AlphaDecay={0.03}
      d3VelocityDecay={0.3}
      enableNodeDrag={true}
      enableZoomInteraction={true}
      enablePanInteraction={true}
      minZoom={0.3}
      maxZoom={12}
    />
  );
}
