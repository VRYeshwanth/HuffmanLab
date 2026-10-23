import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { decodeBitstream, verifyLossless } from '../algorithms/decode.js';
import { formatBytes } from '../utils/formatBytes.js';

export default function DecodingPanel({
  bitstream,
  root,
  originalText,
}) {
  const [copied, setCopied] = useState(false);

  // Perform genuine tree traversal decoding
  const decodeResult = useMemo(() => {
    if (!bitstream || !root) return null;
    return decodeBitstream(bitstream, root, originalText);
  }, [bitstream, root, originalText]);

  // Strict lossless verification
  const verification = useMemo(() => {
    if (!decodeResult || !originalText) return null;
    return verifyLossless(originalText, decodeResult.decodedText);
  }, [decodeResult, originalText]);

  const copyDecoded = () => {
    if (!decodeResult?.decodedText) return;
    navigator.clipboard.writeText(decodeResult.decodedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!decodeResult) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
        No decoded text available. Run "Analyze & Encode" first.
      </div>
    );
  }

  const isSuccess = verification?.exactMatch && !decodeResult.error;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <span>Lossless Tree Decoding & Verification</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Bitstream traversed through the generated Huffman tree to reconstruct original text
          </p>
        </div>

        <button
          type="button"
          onClick={copyDecoded}
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
              <span>Copy Decoded Text</span>
            </>
          )}
        </button>
      </div>

      {/* Prominent Verification Banner */}
      <div
        className={`rounded-xl p-4 border flex items-start space-x-3.5 transition-all ${
          isSuccess
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <div className="font-bold text-sm flex items-center space-x-2">
            <span>
              {isSuccess
                ? 'Lossless Verification Passed: 100% Exact Match'
                : 'Verification Mismatch Detected'}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {isSuccess
              ? 'Every character, whitespace, tab, newline, and Unicode code point was reconstructed with absolute bit-level fidelity through tree traversal.'
              : decodeResult.error || `Character mismatch found at index ${verification?.diffIndex}.`}
          </p>
        </div>
      </div>

      {/* Reconstructed Text Display Box */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Decoded Output:</span>
          <span className="font-mono">
            {decodeResult.totalDecodedSymbols.toLocaleString()} symbols reconstructed
          </span>
        </div>

        <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre-wrap select-all">
          {decodeResult.decodedText}
        </div>
      </div>

      {/* Verification Metrics Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
        <div>
          <span className="text-slate-400 block font-sans">Original Symbol Count</span>
          <span className="text-slate-200 font-bold">
            {verification?.originalLength || 0}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-sans">Decoded Symbol Count</span>
          <span className="text-slate-200 font-bold">
            {verification?.decodedLength || 0}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-sans">Original Byte Size</span>
          <span className="text-slate-200 font-bold">
            {formatBytes(verification?.originalByteSize || 0)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-sans">Decoded Byte Size</span>
          <span className="text-emerald-400 font-bold">
            {formatBytes(verification?.decodedByteSize || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

