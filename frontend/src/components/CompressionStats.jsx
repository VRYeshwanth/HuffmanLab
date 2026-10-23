import React from 'react';
import {
  FileText,
  Binary,
  Percent,
  Layers,
  Gauge,
  TrendingDown,
  TrendingUp,
  Info,
  Scale,
} from 'lucide-react';
import { formatBytes, formatBits, formatPercent } from '../utils/formatBytes.js';

export default function CompressionStats({ stats }) {
  if (!stats) return null;

  const isPositiveReduction = stats.reductionPercent > 0;
  const isZero = stats.originalBytes === 0;

  return (
    <div className="space-y-4">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Original Size */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Original UTF-8</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatBytes(stats.originalBytes)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {formatBits(stats.originalBits)}
          </div>
        </div>

        {/* 2. Huffman Payload Bits */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-cyan-400 mb-1.5">
            <span className="text-xs font-medium">Huffman Payload</span>
            <Binary className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {stats.encodedPayloadBits.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">bits</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            ~{formatBytes(stats.encodedPayloadBytes)} (packed)
          </div>
        </div>

        {/* 3. Size Reduction (%) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400">Payload Reduction</span>
            {isPositiveReduction ? (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingUp className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              isPositiveReduction
                ? 'text-emerald-400'
                : stats.reductionPercent < 0
                ? 'text-amber-400'
                : 'text-slate-300'
            }`}
          >
            {formatPercent(stats.reductionPercent)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {isPositiveReduction ? 'Savings vs UTF-8' : 'Expansion / Overhead'}
          </div>
        </div>

        {/* 4. Compression Ratio */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-indigo-400 mb-1.5">
            <span className="text-xs font-medium">Compression Ratio</span>
            <Scale className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300">
            {stats.compressionRatio}:1
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Orig bits / Enc bits
          </div>
        </div>

        {/* 5. Average Code Length */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-purple-400 mb-1.5">
            <span className="text-xs font-medium">Avg Code Length</span>
            <Gauge className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-300">
            {stats.avgCodeLength}{' '}
            <span className="text-xs font-normal text-slate-400">b/sym</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Entropy: {stats.shannonEntropy} b/sym
          </div>
        </div>

        {/* 6. Distinct Alphabet */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <span className="text-xs font-medium">Distinct Symbols</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {stats.distinctSymbols}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {stats.totalSymbols.toLocaleString()} total symbols
          </div>
        </div>
      </div>

      {/* Visual Compression Ratio Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
          <span>Bit Comparison (Original UTF-8 vs Huffman Payload)</span>
          <span className="font-mono text-cyan-400">
            {stats.encodedPayloadBits} / {stats.originalBits} bits (
            {stats.originalBits > 0
              ? ((stats.encodedPayloadBits / stats.originalBits) * 100).toFixed(1)
              : 0}
            %)
          </span>
        </div>

        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 ${
              isPositiveReduction ? 'bg-gradient-to-r from-cyan-500 to-emerald-400' : 'bg-amber-500'
            }`}
            style={{
              width: `${Math.min(
                100,
                stats.originalBits > 0
                  ? (stats.encodedPayloadBits / stats.originalBits) * 100
                  : 0
              )}%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
          <span>0 bits</span>
          <span className="flex items-center space-x-1">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />
            <span>Huffman Payload</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-600" />
            <span>Original Baseline ({stats.originalBits} bits)</span>
          </span>
        </div>
      </div>

      {/* Important Disclaimer Note as specified in requirements */}
      <div className="flex items-start space-x-3 bg-slate-900/40 border border-slate-800/60 rounded-xl p-3.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Theoretical vs. Actual Compression:</strong> The figures above compare the raw input’s UTF-8 byte representation against the bare Huffman-encoded payload. In practical binary storage, a standalone compressed file must also embed a serialized tree/codebook metadata header and byte-boundary padding. Switch to the <strong className="text-cyan-300">Binary File (.huff)</strong> tab to inspect end-to-end physical file packaging!
        </p>
      </div>
    </div>
  );
}

