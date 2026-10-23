import React from 'react';
import { TrendingDown, TrendingUp, Info } from 'lucide-react';
import { formatBytes, formatPercent } from '../utils/formatBytes.js';

export default function CompressionStats({ stats }) {
  if (!stats) return null;

  const isPositiveReduction = stats.reductionPercent > 0;

  return (
    <div className="space-y-2">
      {/* 3 Compact Essential Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Original Size */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Original Size</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {formatBytes(stats.originalBytes)}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">
            {stats.originalBits.toLocaleString()} bits (UTF-8)
          </div>
        </div>

        {/* 2. Encoded Size */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Encoded Size</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {stats.encodedPayloadBits.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">bits</span>
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">
            ~{formatBytes(stats.encodedPayloadBytes)} packed
          </div>
        </div>

        {/* 3. Size Reduction */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Size Reduction</div>
          <div
            className={`text-xl font-bold font-mono mt-1 flex items-center space-x-1.5 ${
              isPositiveReduction
                ? 'text-emerald-400'
                : stats.reductionPercent < 0
                ? 'text-amber-400'
                : 'text-slate-300'
            }`}
          >
            {isPositiveReduction ? (
              <TrendingDown className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingUp className="w-5 h-5 text-amber-400" />
            )}
            <span>{formatPercent(stats.reductionPercent)}</span>
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">
            {stats.compressionRatio}:1 compression ratio
          </div>
        </div>
      </div>

      {/* Compact note with progressive disclosure */}
      <details className="text-xs text-slate-500 group cursor-pointer pt-1">
        <summary className="hover:text-slate-400 flex items-center space-x-1 select-none">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>How is size reduction calculated?</span>
        </summary>
        <p className="mt-1.5 pl-4 text-slate-400 leading-relaxed border-l border-slate-800">
          This theoretical comparison measures the raw input’s UTF-8 byte count against the bare Huffman-encoded bitstream payload. It does not include standalone file format metadata (e.g. tree/codebook headers), which are needed to decompress independent files.
        </p>
      </details>
    </div>
  );
}
