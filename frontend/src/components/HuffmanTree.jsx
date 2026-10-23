import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sparkles,
  Info,
  Navigation,
} from 'lucide-react';
import { formatSymbol } from '../utils/formatSymbol.js';
import { getPathToSymbol } from '../algorithms/huffman.js';

/**
 * Calculates tidy binary tree coordinates.
 * Computes horizontal spanning widths recursively to ensure no node overlap.
 */
function layoutTree(root) {
  if (!root) return { nodes: [], edges: [], bounds: { minX: 0, maxX: 800, minY: 0, maxY: 600 } };

  const LEVEL_HEIGHT = 90;
  const SIBLING_GAP = 70;

  // Step 1: Assign subtree width in units
  function computeSubtreeWidth(node) {
    if (!node) return 0;
    if (node.isLeaf || (!node.left && !node.right)) {
      node._subWidth = SIBLING_GAP;
      return SIBLING_GAP;
    }

    const leftW = computeSubtreeWidth(node.left);
    const rightW = computeSubtreeWidth(node.right);
    node._subWidth = Math.max(SIBLING_GAP, leftW + rightW);
    return node._subWidth;
  }

  computeSubtreeWidth(root);

  const flatNodes = [];
  const flatEdges = [];

  // Step 2: Assign x, y positions
  function assignCoordinates(node, depth, leftBoundary) {
    if (!node) return;

    node.y = depth * LEVEL_HEIGHT + 50;

    if (node.isLeaf || (!node.left && !node.right)) {
      node.x = leftBoundary + node._subWidth / 2;
    } else if (node.left && node.right) {
      assignCoordinates(node.left, depth + 1, leftBoundary);
      assignCoordinates(node.right, depth + 1, leftBoundary + node.left._subWidth);
      node.x = (node.left.x + node.right.x) / 2;
    } else if (node.left) {
      assignCoordinates(node.left, depth + 1, leftBoundary);
      node.x = node.left.x;
    } else if (node.right) {
      assignCoordinates(node.right, depth + 1, leftBoundary);
      node.x = node.right.x;
    }

    flatNodes.push(node);

    if (node.left) {
      flatEdges.push({
        from: node,
        to: node.left,
        bit: '0',
        id: `${node.id}->${node.left.id}`,
      });
    }
    if (node.right) {
      flatEdges.push({
        from: node,
        to: node.right,
        bit: '1',
        id: `${node.id}->${node.right.id}`,
      });
    }
  }

  assignCoordinates(root, 0, 50);

  // Compute bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  flatNodes.forEach((n) => {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  });

  return {
    nodes: flatNodes,
    edges: flatEdges,
    bounds: {
      minX: minX - 80,
      maxX: maxX + 80,
      minY: minY - 50,
      maxY: maxY + 80,
    },
  };
}

export default function HuffmanTree({
  root,
  selectedSymbol,
  onSelectSymbol,
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate layout
  const { nodes, edges, bounds } = useMemo(() => {
    return layoutTree(root);
  }, [root]);

  // Compute active path to selected symbol
  const { pathNodeIds, pathEdgeIds, tracedCode } = useMemo(() => {
    if (!root || !selectedSymbol) {
      return { pathNodeIds: new Set(), pathEdgeIds: new Set(), tracedCode: '' };
    }

    const path = getPathToSymbol(root, selectedSymbol);
    const nIds = new Set();
    const eIds = new Set();
    let codeStr = '';

    for (let i = 0; i < path.length; i++) {
      nIds.add(path[i].node.id);
      if (path[i].branch !== null) {
        codeStr += path[i].branch;
      }
      if (i > 0) {
        eIds.add(`${path[i - 1].node.id}->${path[i].node.id}`);
      }
    }

    return { pathNodeIds: nIds, pathEdgeIds: eIds, tracedCode: codeStr };
  }, [root, selectedSymbol]);

  // Center & Fit View to Screen
  const fitToView = useCallback(() => {
    if (!containerRef.current || nodes.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const treeW = bounds.maxX - bounds.minX;
    const treeH = bounds.maxY - bounds.minY;

    if (treeW <= 0 || treeH <= 0) return;

    const scaleX = (width - 80) / treeW;
    const scaleY = (height - 80) / treeH;
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.6);

    const midX = (bounds.minX + bounds.maxX) / 2;
    const midY = (bounds.minY + bounds.maxY) / 2;

    setScale(newScale);
    setPan({
      x: width / 2 - midX * newScale,
      y: height / 2 - midY * newScale,
    });
  }, [bounds, nodes.length]);

  // Auto-fit on initial load or root change
  useEffect(() => {
    fitToView();
  }, [fitToView]);

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.2), 3.0);
    setScale(newScale);
  };

  const resetView = () => {
    setScale(1);
    fitToView();
  };

  if (!root) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
        No Huffman tree constructed yet. Enter text and click "Analyze & Encode".
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col relative">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800/80 bg-slate-950/60 z-10">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
            <span>Interactive Huffman Tree</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
              {nodes.length} nodes
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Drag to pan • Scroll to zoom • Click any leaf node to trace its branch path
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700/70 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(s * 1.2, 3.0))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(s * 0.8, 0.2))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fit & Reset */}
          <button
            type="button"
            onClick={fitToView}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="Fit Tree to Viewport"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fit</span>
          </button>

          <button
            type="button"
            onClick={resetView}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Selected Symbol Path Badge / HUD */}
      {selectedSymbol && (
        <div className="absolute top-18 left-4 z-20 flex items-center space-x-2.5 bg-slate-950/90 border border-cyan-500/40 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg shadow-cyan-950/40">
          <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div className="text-xs">
            <span className="text-slate-400">Traced: </span>
            <span className="font-bold text-white">
              {formatSymbol(selectedSymbol).display}
            </span>
            <span className="text-slate-400 ml-2">Code: </span>
            <span className="font-mono font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/60">
              {tracedCode || '0'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectSymbol(null)}
            className="text-slate-500 hover:text-slate-300 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-[540px] bg-slate-950/80 cursor-${
          isDragging ? 'grabbing' : 'grab'
        } select-none relative overflow-hidden`}
      >
        <svg className="w-full h-full overflow-visible">
          <defs>
            {/* Glow filter for highlighted path */}
            <filter id="path-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            {/* Edges */}
            {edges.map((edge) => {
              const isPath = pathEdgeIds.has(edge.id);
              const x1 = edge.from.x;
              const y1 = edge.from.y;
              const x2 = edge.to.x;
              const y2 = edge.to.y;

              // Cubic bezier curve path for smooth connection
              const midY = (y1 + y2) / 2;
              const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

              // Midpoint for bit label
              const labelX = (x1 + x2) / 2;
              const labelY = (y1 + y2) / 2;

              return (
                <g key={edge.id}>
                  {/* Background shadow line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isPath ? '#22d3ee' : '#334155'}
                    strokeWidth={isPath ? 3.5 : 1.5}
                    strokeDasharray={isPath ? '6,3' : 'none'}
                    filter={isPath ? 'url(#path-glow)' : 'none'}
                    className={isPath ? 'transition-all duration-300' : ''}
                  />

                  {/* Edge bit badge (0: Cyan, 1: Amber) */}
                  <g transform={`translate(${labelX}, ${labelY})`}>
                    <circle
                      r="10"
                      fill={edge.bit === '0' ? '#083344' : '#451a03'}
                      stroke={edge.bit === '0' ? '#06b6d4' : '#f59e0b'}
                      strokeWidth={isPath ? '2' : '1'}
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill={edge.bit === '0' ? '#67e8f9' : '#fcd34d'}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {edge.bit}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isPath = pathNodeIds.has(node.id);
              const isLeaf = node.isLeaf;
              const isSelected = isLeaf && node.symbol === selectedSymbol;

              if (isLeaf) {
                const formatted = formatSymbol(node.symbol);
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSymbol(isSelected ? null : node.symbol);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Leaf Card Shape */}
                    <rect
                      x="-38"
                      y="-22"
                      width="76"
                      height="46"
                      rx="10"
                      fill={isSelected ? '#0c4a6e' : '#0f172a'}
                      stroke={
                        isSelected
                          ? '#38bdf8'
                          : isPath
                          ? '#22d3ee'
                          : '#1e293b'
                      }
                      strokeWidth={isSelected || isPath ? '2.5' : '1.5'}
                      filter={isSelected || isPath ? 'url(#path-glow)' : 'none'}
                      className="transition-all duration-200 group-hover:stroke-cyan-400"
                    />

                    {/* Symbol Display */}
                    <text
                      textAnchor="middle"
                      y="-2"
                      fill="#ffffff"
                      fontSize={formatted.isSpecial ? '10' : '13'}
                      fontWeight="bold"
                      fontFamily="ui-monospace, monospace"
                    >
                      {formatted.display}
                    </text>

                    {/* Frequency Badge */}
                    <text
                      textAnchor="middle"
                      y="14"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      freq: {node.freq}
                    </text>
                  </g>
                );
              }

              // Internal Node
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-default"
                >
                  <circle
                    r="19"
                    fill={isPath ? '#164e63' : '#1e293b'}
                    stroke={isPath ? '#06b6d4' : '#475569'}
                    strokeWidth={isPath ? '2.5' : '1.5'}
                    filter={isPath ? 'url(#path-glow)' : 'none'}
                  />
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill={isPath ? '#a5f3fc' : '#cbd5e1'}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {node.freq}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center space-x-3 bg-slate-950/80 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] text-slate-400 font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-600 inline-block" />
            <span>Leaf (Symbol)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600 inline-block" />
            <span>Internal Node (Sum)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-900 border border-cyan-400 inline-block" />
            <span>Bit 0 (Left)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-900 border border-amber-400 inline-block" />
            <span>Bit 1 (Right)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

