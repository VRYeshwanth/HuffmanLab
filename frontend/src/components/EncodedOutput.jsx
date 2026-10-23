import React, { useState, useMemo } from 'react';
import { Copy, Check, Binary, ChevronDown, ChevronUp, Layers, Hash } from 'lucide-react';
import { formatBytes, formatBits } from '../utils/formatBytes.js';

export default function EncodedOutput({
  bitstream,
  bitLength,
  packedBytes,
  paddingBits,
  codeTable,
}) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayMode, setDisplayMode] = useState('bytes'); // 'bytes' (blocks of 8) | 'continuous'

  const copyToClipboard = () => {
    if (!bitstream) return;
    navigator.clipboard.writeText(bitstream);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format bitstream into blocks of 8 bits (1 byte) for high readability
  const formattedBitstream = useMemo(() => {
    if (!bitstream) return '';

    // If string is exceptionally long and not expanded, truncate preview
    const PREVIEW_LIMIT = 2000;
    const isTruncated = !isExpanded && bitstream.length > PREVIEW_LIMIT;
    const streamToFormat = isTruncated
      ? bitstream.slice(0, PREVIEW_LIMIT)
      : bitstream;

    if (displayMode === 'bytes') {
      const chunks = [];
      for (let i = 0; i < streamToFormat.length; i += 8) {
        chunks.push(streamToFormat.slice(i, i + 8));
      }
      return {
        text: chunks.join(' '),
        truncated: isTruncated,
      };
    }

    return {
      text: streamToFormat,
      truncated: isTruncated,
    };
  }, [bitstream, displayMode, isExpanded]);

  if (!bitstream) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
        No encoded output yet. Enter text and click "Analyze & Encode".
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <Binary className="w-5 h-5 text-cyan-400" />
            <span>Huffman Encoded Bitstream</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Concatenated prefix codes for all symbols in original order
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setDisplayMode('bytes')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                displayMode === 'bytes'
                  ? 'bg-cyan-950 text-cyan-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              8-bit Blocks
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('continuous')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                displayMode === 'continuous'
                  ? 'bg-cyan-950 text-cyan-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Continuous
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={copyToClipboard}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Bits</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bitstream Display Box */}
      <div className="relative">
        <div
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-300 leading-relaxed break-all select-all overflow-y-auto ${
            isExpanded ? 'max-h-[480px]' : 'max-h-[180px]'
          }`}
        >
          {formattedBitstream.text}
          {formattedBitstream.truncated && (
            <span className="text-slate-500 font-sans ml-2">
              ... [truncated preview for performance. Click Expand below to show all {bitLength} bits]
            </span>
          )}
        </div>

        {/* Expand / Collapse Button if bitstream is long */}
        {bitstream.length > 2000 && (
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors py-1 px-3 bg-slate-800/60 rounded-lg border border-slate-700/60"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Collapse Preview</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Expand All ({bitLength} bits)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bitstream Metadata Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
        <div>
          <span className="text-slate-400 block font-sans">Total Encoded Bits</span>
          <span className="text-slate-200 font-bold">{bitLength.toLocaleString()} bits</span>
        </div>
        <div>
          <span className="text-slate-400 block font-sans">Packed Payload Bytes</span>
          <span className="text-slate-200 font-bold">{packedBytes?.length || Math.ceil(bitLength / 8)} bytes</span>
        </div>
        <div>
          <span className="text-slate-400 block font-sans">Final Byte Padding</span>
          <span className="text-slate-200 font-bold">{paddingBits} bits</span>
        </div>
        <div>
          <span className="text-slate-400 block font-sans">Physical Size</span>
          <span className="text-cyan-400 font-bold">{formatBytes(packedBytes?.length || 0)}</span>
        </div>
      </div>
    </div>
  );
}

