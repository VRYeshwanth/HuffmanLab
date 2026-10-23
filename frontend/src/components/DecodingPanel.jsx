import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { decodeBitstream, verifyLossless } from '../algorithms/decode.js';

export default function DecodingPanel({
  bitstream,
  root,
  originalText,
}) {
  const [copied, setCopied] = useState(false);

  const decodeResult = useMemo(() => {
    if (!bitstream || !root) return null;
    return decodeBitstream(bitstream, root, originalText);
  }, [bitstream, root, originalText]);

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

  if (!decodeResult) return null;

  const isSuccess = verification?.exactMatch && !decodeResult.error;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Decoded Text & Verification</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Decoded by traversing the generated Huffman tree bit-by-bit.
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

      {/* Verification Status */}
      <div
        className={`rounded-lg p-3 border flex items-center space-x-2.5 text-xs ${
          isSuccess
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
        )}
        <span>
          {isSuccess
            ? 'Lossless verification passed: Decoded text exactly matches original input character-for-character.'
            : decodeResult.error || `Character mismatch found at index ${verification?.diffIndex}.`}
        </span>
      </div>

      {/* Reconstructed Text Container */}
      <div className="space-y-1">
        <div className="w-full bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 font-mono text-xs text-slate-200 leading-relaxed max-h-[200px] overflow-y-auto whitespace-pre-wrap select-all">
          {decodeResult.decodedText}
        </div>
      </div>
    </div>
  );
}
