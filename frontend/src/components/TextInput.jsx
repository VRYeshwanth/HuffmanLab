import React, { useMemo } from 'react';
import { ArrowRight, Trash2, FileText, AlertCircle, RefreshCw } from 'lucide-react';

const SAMPLE_TEXT =
  'Huffman coding is an optimal prefix code algorithm used for lossless data compression. Frequent characters get shorter codes!';

export default function TextInput({
  text,
  onChange,
  onEncode,
  onClear,
  isLoading,
  error,
  isStale,
}) {
  const charCount = useMemo(() => {
    if (!text) return 0;
    return Array.from(text).length;
  }, [text]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onEncode();
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
      {/* Header bar of Input */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="huffman-input"
          className="text-sm font-semibold text-slate-200 flex items-center space-x-2"
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Enter Text to Compress</span>
        </label>

        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={() => onChange(SAMPLE_TEXT)}
            className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-colors"
          >
            Load Example
          </button>
          {text && (
            <button
              type="button"
              onClick={onClear}
              className="px-2.5 py-1 text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-rose-950/30 rounded-lg border border-slate-700/70 hover:border-rose-900/50 transition-colors flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          id="huffman-input"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={5}
          placeholder="Enter or paste your text here..."
          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-4 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all resize-y min-h-30"
        />

        {error && (
          <div className="absolute bottom-3 left-3 flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-950/90 border border-rose-800/80 px-2.5 py-1 rounded-md">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Stale notice */}
      {isStale && (
        <div className="flex items-center space-x-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 px-3 py-1.5 rounded-lg">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Input modified — click <strong>"Encode Text"</strong> to update results.</span>
        </div>
      )}

      {/* Bottom Bar: Count & Primary Button */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-slate-400 font-mono">
          <span>{charCount.toLocaleString()} {charCount === 1 ? 'character' : 'characters'}</span>
        </div>

        <button
          type="button"
          onClick={onEncode}
          disabled={isLoading || !text.trim()}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          )}
          <span>Encode Text</span>
        </button>
      </div>
    </div>
  );
}
