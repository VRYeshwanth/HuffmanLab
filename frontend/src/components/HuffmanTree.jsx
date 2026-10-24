import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Navigation,
  Download,
  Image,
  FileCode,
  Check,
  ChevronDown,
} from 'lucide-react';
import { formatSymbol } from '../utils/formatSymbol.js';
import { getPathToSymbol } from '../algorithms/huffman.js';

/**
 * Calculates tidy binary tree coordinates.
 * Adapts horizontal and vertical spacing based on leaf count to prevent excessive width explosion.
 */
function layoutTree(root) {
  if (!root) return { nodes: [], edges: [], bounds: { minX: 0, maxX: 800, minY: 0, maxY: 600 }, leafCount: 0 };

  // Count leaves to choose optimal spacing
  let leafCount = 0;
  function countLeaves(n) {
    if (!n) return;
    if (n.isLeaf || (!n.left && !n.right)) {
      leafCount++;
    } else {
      countLeaves(n.left);
      countLeaves(n.right);
    }
  }
  countLeaves(root);

  // Dynamic spacing based on tree size:
  // Compact spacing for large alphabets keeps the tree readable without spreading thousands of pixels wide
  const SIBLING_GAP = leafCount > 35 ? 44 : leafCount > 18 ? 54 : 68;
  const LEVEL_HEIGHT = leafCount > 35 ? 74 : leafCount > 18 ? 82 : 90;

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
      minX: minX - 60,
      maxX: maxX + 60,
      minY: minY - 40,
      maxY: maxY + 60,
    },
    leafCount,
  };
}

export default function HuffmanTree({
  root,
  selectedSymbol,
  onSelectSymbol,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fullscreen and download state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Calculate layout
  const { nodes, edges, bounds, leafCount } = useMemo(() => {
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

  // Fit & Center View
  const fitToView = useCallback(
    (forceFitAll = false) => {
      if (!containerRef.current || nodes.length === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width || 800;
      const height = rect.height || 500;

      const treeW = bounds.maxX - bounds.minX;
      const treeH = bounds.maxY - bounds.minY;

      if (treeW <= 0 || treeH <= 0) return;

      const scaleX = (width - 60) / treeW;
      const scaleY = (height - 60) / treeH;
      const fullFitScale = Math.min(scaleX, scaleY);

      if (forceFitAll) {
        const newScale = Math.min(Math.max(fullFitScale, 0.12), 1.5);
        const midX = (bounds.minX + bounds.maxX) / 2;
        const midY = (bounds.minY + bounds.maxY) / 2;
        setScale(newScale);
        setPan({
          x: width / 2 - midX * newScale,
          y: height / 2 - midY * newScale,
        });
        return;
      }

      // Default intelligent view:
      // If the full fit scale is too tiny (< 0.45), default to a readable zoom centered at the root!
      if (fullFitScale < 0.45) {
        const readableScale = isFullscreen ? 0.75 : 0.65;
        setScale(readableScale);
        setPan({
          x: width / 2 - (root?.x || 0) * readableScale,
          y: 45,
        });
      } else {
        const newScale = Math.min(Math.max(fullFitScale, 0.25), 1.3);
        const midX = (bounds.minX + bounds.maxX) / 2;
        const midY = (bounds.minY + bounds.maxY) / 2;
        setScale(newScale);
        setPan({
          x: width / 2 - midX * newScale,
          y: height / 2 - midY * newScale,
        });
      }
    },
    [bounds, nodes.length, root, isFullscreen]
  );

  // Auto-fit on initial mount or root change
  useEffect(() => {
    fitToView(false);
  }, [fitToView]);

  // Refit when toggling fullscreen
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToView(false);
    }, 60);
    return () => clearTimeout(timer);
  }, [isFullscreen, fitToView]);

  // ESC key exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Close download menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#download-menu-container')) {
        setShowDownloadMenu(false);
      }
    };
    if (showDownloadMenu) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [showDownloadMenu]);

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
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

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 3.0);
    setScale(newScale);
  };

  const resetToRoot = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const readableScale = 0.8;
    setScale(readableScale);
    setPan({
      x: rect.width / 2 - (root?.x || 0) * readableScale,
      y: 50,
    });
  };

  // Download high-resolution image (PNG or SVG)
  const handleDownload = (format = 'png') => {
    setShowDownloadMenu(false);
    if (!svgRef.current || nodes.length === 0) return;

    try {
      const treeW = bounds.maxX - bounds.minX;
      const treeH = bounds.maxY - bounds.minY;

      const serializer = new XMLSerializer();
      const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      exportSvg.setAttribute('viewBox', `${bounds.minX} ${bounds.minY} ${treeW} ${treeH}`);
      exportSvg.setAttribute('width', `${treeW}`);
      exportSvg.setAttribute('height', `${treeH}`);
      exportSvg.style.backgroundColor = '#0b0f19';

      const defs = svgRef.current.querySelector('defs')?.cloneNode(true);
      if (defs) exportSvg.appendChild(defs);

      const treeGroup = svgRef.current.querySelector('g[data-tree-group]')?.cloneNode(true);
      if (treeGroup) {
        treeGroup.removeAttribute('transform');
        exportSvg.appendChild(treeGroup);
      }

      const svgString = serializer.serializeToString(exportSvg);

      if (format === 'svg') {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'huffman-tree.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        triggerSuccessFeedback();
        return;
      }

      // PNG Export via Canvas (2x scale for sharp high-res rendering)
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new window.Image();

      img.onload = () => {
        const scaleFactor = Math.min(2.5, 7000 / Math.max(treeW, treeH));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(treeW * scaleFactor);
        canvas.height = Math.round(treeH * scaleFactor);

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return;
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = 'huffman-tree.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(pngUrl);
          triggerSuccessFeedback();
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const triggerSuccessFeedback = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2200);
  };

  if (!root) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        No Huffman tree constructed yet. Enter text and click "Encode Text".
      </div>
    );
  }

  // Adaptive node sizes for compact mode when there are many nodes
  const isCompact = leafCount > 30;
  const leafCardW = isCompact ? 56 : 74;
  const leafCardH = isCompact ? 38 : 46;
  const internalR = isCompact ? 16 : 19;
  const bitR = isCompact ? 8.5 : 10;

  return (
    <div
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#0b0f19] flex flex-col p-4 w-screen h-screen'
          : 'bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col relative'
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-4 border-b border-slate-800/80 bg-slate-950/70 z-10">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
            <span>Huffman Tree</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {nodes.length} nodes
            </span>
          </h3>
          {scale < 0.45 && !isFullscreen && (
            <span className="text-[11px] text-cyan-400/90 hidden sm:inline">
              (Use Fullscreen or Zoom In to inspect subtrees)
            </span>
          )}
        </div>

        {/* View Controls & Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/70 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(s * 1.25, 3.0))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-300 min-w-10.5 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(s * 0.8, 0.1))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fit Whole Tree */}
          <button
            type="button"
            onClick={() => fitToView(true)}
            className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="Fit Entire Tree"
          >
            Fit All
          </button>

          {/* Focus Root */}
          <button
            type="button"
            onClick={resetToRoot}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="Center on Root"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Root</span>
          </button>

          {/* Download Image Dropdown */}
          <div id="download-menu-container" className="relative">
            <button
              type="button"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/70 text-cyan-300 hover:text-cyan-200 rounded-lg text-xs font-medium transition-colors"
              title="Download Tree Diagram"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>

            {showDownloadMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-30 text-xs">
                <button
                  type="button"
                  onClick={() => handleDownload('png')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center space-x-2 text-slate-200"
                >
                  <Image className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold">Download PNG</div>
                    <div className="text-[10px] text-slate-400">High-resolution image</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('svg')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center space-x-2 text-slate-200 border-t border-slate-800"
                >
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-semibold">Download SVG</div>
                    <div className="text-[10px] text-slate-400">Scalable vector graphic</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enlarge to Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selected Symbol Path Badge / HUD */}
      {selectedSymbol && (
        <div className="absolute top-16 left-4 z-20 flex items-center space-x-2 bg-slate-950/90 border border-cyan-500/40 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg">
          <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <div className="text-xs">
            <span className="text-slate-400">Traced: </span>
            <span className="font-bold text-white">
              {formatSymbol(selectedSymbol).display}
            </span>
            <span className="text-slate-400 ml-2">Code: </span>
            <span className="font-mono font-bold text-cyan-300 bg-cyan-950 px-1 py-0.5 rounded border border-cyan-800/60">
              {tracedCode || '0'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectSymbol(null)}
            className="text-slate-500 hover:text-slate-300 text-xs ml-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full ${
          isFullscreen ? 'flex-1' : 'h-125'
        } bg-slate-950/80 cursor-${
          isDragging ? 'grabbing' : 'grab'
        } select-none relative overflow-hidden`}
      >
        <svg ref={svgRef} className="w-full h-full overflow-visible">
          <defs>
            <filter id="path-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Interactive Transform Group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            {/* Raw Tree Geometry Group (clean for PNG/SVG export) */}
            <g data-tree-group="true">
              {/* Edges */}
              {edges.map((edge) => {
                const isPath = pathEdgeIds.has(edge.id);
                const x1 = edge.from.x;
                const y1 = edge.from.y;
                const x2 = edge.to.x;
                const y2 = edge.to.y;

                const midY = (y1 + y2) / 2;
                const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

                const labelX = (x1 + x2) / 2;
                const labelY = (y1 + y2) / 2;

                return (
                  <g key={edge.id}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isPath ? '#22d3ee' : '#334155'}
                      strokeWidth={isPath ? 3.5 : 1.5}
                      strokeDasharray={isPath ? '6,3' : 'none'}
                      filter={isPath ? 'url(#path-glow)' : 'none'}
                    />

                    {/* Bit badge (0: Cyan, 1: Amber) */}
                    <g transform={`translate(${labelX}, ${labelY})`}>
                      <circle
                        r={bitR}
                        fill={edge.bit === '0' ? '#083344' : '#451a03'}
                        stroke={edge.bit === '0' ? '#06b6d4' : '#f59e0b'}
                        strokeWidth={isPath ? '2' : '1'}
                      />
                      <text
                        textAnchor="middle"
                        dy="3.5"
                        fill={edge.bit === '0' ? '#67e8f9' : '#fcd34d'}
                        fontSize={isCompact ? '9' : '10'}
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
                      <rect
                        x={-leafCardW / 2}
                        y={-leafCardH / 2}
                        width={leafCardW}
                        height={leafCardH}
                        rx="8"
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

                      <text
                        textAnchor="middle"
                        y={isCompact ? '-2' : '-3'}
                        fill="#ffffff"
                        fontSize={formatted.isSpecial ? (isCompact ? '8.5' : '10') : (isCompact ? '11' : '13')}
                        fontWeight="bold"
                        fontFamily="ui-monospace, monospace"
                      >
                        {formatted.display}
                      </text>

                      <text
                        textAnchor="middle"
                        y={isCompact ? '11' : '13'}
                        fill="#94a3b8"
                        fontSize={isCompact ? '8' : '9'}
                        fontFamily="monospace"
                      >
                        {node.freq}
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
                      r={internalR}
                      fill={isPath ? '#164e63' : '#1e293b'}
                      stroke={isPath ? '#06b6d4' : '#475569'}
                      strokeWidth={isPath ? '2.5' : '1.5'}
                      filter={isPath ? 'url(#path-glow)' : 'none'}
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill={isPath ? '#a5f3fc' : '#cbd5e1'}
                      fontSize={isCompact ? '10' : '11'}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {node.freq}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2.5 right-2.5 z-10 hidden sm:flex items-center space-x-3 bg-slate-950/80 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-slate-400 font-mono">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-600 inline-block" />
            <span>Leaf</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600 inline-block" />
            <span>Internal</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span>0</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span>1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
