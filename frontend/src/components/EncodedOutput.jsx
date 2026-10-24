import React, { useState, useMemo } from 'react';
import { Copy, Check, Binary, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function EncodedOutput({
  bitstream,
  bitLength,
  isExactMatch,
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (!bitstream) return;
    navigator.clipboard.writeText(bitstream);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group into 8-bit bytes for readable display
  const formattedBits = useMemo(() => {
    if (!bitstream) return '';
    const chunks = [];
    const maxLen = 3000;
    const isTruncated = bitstream.length > maxLen;
    const str = isTruncated ? bitstream.slice(0, maxLen) : bitstream;

    for (let i = 0; i < str.length; i += 8) {
      chunks.push(str.slice(i, i + 8));
    }

    return {
      text: chunks.join(' '),
      isTruncated,
    };
  }, [bitstream]);

  if (!bitstream) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
      {/* Header with Title, Lossless Badge, and Copy Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Binary className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Encoded Bitstream
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            ({bitLength.toLocaleString()} bits)
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Concise Lossless status badge */}
          {isExactMatch !== undefined && (
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isExactMatch
                  ? 'bg-emerald-950/70 border border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/70 border border-rose-800/60 text-rose-300'
              }`}
            >
              {isExactMatch ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>{isExactMatch ? 'Lossless Verified' : 'Decode Mismatch'}</span>
            </div>
          )}

          <button
            type="button"
            onClick={copyToClipboard}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
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

      {/* Bitstream Scrollable Box */}
      <div className="w-full bg-slate-950 border border-slate-800/80 rounded-lg p-3 font-mono text-xs text-cyan-300/90 leading-relaxed break-all select-all max-h-35 overflow-y-auto">
        {formattedBits.text}
        {formattedBits.isTruncated && (
          <span className="text-slate-500 font-sans ml-2 text-[11px]">
            ... [+{bitLength - 3000} more bits. Use "Copy Bits" to copy the full bitstream]
          </span>
        )}
      </div>
    </div>
  );
}
