import React, { useState, useMemo } from 'react';
import { Play, Trash2, BookOpen, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { formatBytes } from '../utils/formatBytes.js';

const SAMPLE_TEXTS = [
  {
    label: 'English Prose (Varied)',
    text: 'Lossless data compression algorithms reduce the size of data without losing any information. Huffman coding is a greedy algorithm that builds an optimal prefix code based on symbol probabilities.',
  },
  {
    label: 'High Redundancy (High Compression)',
    text: 'AAAAABBBBBCCCCCDDDDDDEEEEEEEFFFFFFGGGGGGGHHHHHHHHHIIIIIIIIIIJJJJJJJJJJJJ',
  },
  {
    label: 'Programming Code',
    text: `function huffman(frequencies) {
  const heap = new MinHeap();
  for (const [sym, freq] of frequencies) {
    heap.insert({ sym, freq });
  }
  return heap;
}`,
  },
  {
    label: 'Unicode & Emoji',
    text: 'Data compression is amazing! 🚀 Huffman coding saves bandwidth 💾✨ across the globe 🌍.',
  },
  {
    label: 'Single Symbol Edge Case',
    text: 'AAAAAAAAAAAAAAAAAAAA',
  },
];

export default function TextInput({
  text,
  onChange,
  onAnalyze,
  onClear,
  isLoading,
  error,
}) {
  const [selectedSample, setSelectedSample] = useState('');

  // Calculate live UTF-8 byte count efficiently
  const byteCount = useMemo(() => {
    if (!text) return 0;
    return new TextEncoder().encode(text).length;
  }, [text]);

  const charCount = useMemo(() => {
    if (!text) return 0;
    return Array.from(text).length;
  }, [text]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onAnalyze();
    }
  };

  const loadSample = (sampleText) => {
    onChange(sampleText);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Top Bar with actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-slate-100">Input Text</h2>
          <span className="text-xs text-slate-400">
            (Paste, type, or pick a sample)
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Sample Selector */}
          <div className="relative inline-block">
            <select
              value={selectedSample}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSample(val);
                const found = SAMPLE_TEXTS.find((s) => s.label === val);
                if (found) loadSample(found.text);
              }}
              className="bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer transition-colors"
            >
              <option value="" disabled>
                Load Sample Text...
              </option>
              {SAMPLE_TEXTS.map((sample) => (
                <option key={sample.label} value={sample.label}>
                  {sample.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear button */}
          <button
            type="button"
            onClick={onClear}
            disabled={!text}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Clear text and results"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={6}
          placeholder="Type or paste any text here (paragraphs, code, punctuation, newlines, tabs, and Unicode emojis are fully supported)..."
          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/80 rounded-xl p-4 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-y min-h-[140px]"
        />

        {error && (
          <div className="absolute bottom-4 left-4 flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-950/80 border border-rose-800/60 px-2.5 py-1 rounded-md">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Bottom Bar: Live Counts & Encode Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-800/60">
        <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
          <div>
            Symbols: <span className="text-cyan-400 font-semibold">{charCount.toLocaleString()}</span>
          </div>
          <div>
            UTF-8 Size: <span className="text-cyan-400 font-semibold">{formatBytes(byteCount)}</span> ({byteCount * 8} bits)
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300">Enter</kbd>
          </span>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={isLoading || !text.trim()}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>Analyze & Encode</span>
          </button>
        </div>
      </div>
    </div>
  );
}

