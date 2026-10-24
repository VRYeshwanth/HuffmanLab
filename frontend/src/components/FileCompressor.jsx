import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileArchive,
  FileText,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Info,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  compressToBinaryFile,
  decompressBinaryFile,
} from '../algorithms/binaryFile.js';
import { buildHuffmanTree } from '../algorithms/huffman.js';
import { encodeText } from '../algorithms/encode.js';
import { formatBytes, formatPercent } from '../utils/formatBytes.js';

export default function FileCompressor() {
  const [mode, setMode] = useState('compress'); // 'compress' | 'decompress'

  // Compress state
  const [compressFile, setCompressFile] = useState(null);
  const [compressResult, setCompressResult] = useState(null);
  const [compressError, setCompressError] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Decompress state
  const [decompressFile, setDecompressFile] = useState(null);
  const [decompressResult, setDecompressResult] = useState(null);
  const [decompressError, setDecompressError] = useState(null);
  const [isDecompressing, setIsDecompressing] = useState(false);

  const compressInputRef = useRef(null);
  const decompressInputRef = useRef(null);

  // Handle .txt file upload for compression
  const handleCompressFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressFile(file);
    setCompressError(null);
    setCompressResult(null);
    setIsCompressing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        if (!text || text.length === 0) {
          throw new Error('The selected text file is empty.');
        }

        const { codeTable, frequencyTable } = buildHuffmanTree(text);
        const { bitstream } = encodeText(text, codeTable);
        const binaryData = compressToBinaryFile(text, frequencyTable, bitstream);

        const origSize = new TextEncoder().encode(text).length;
        const totalCompressedSize = binaryData.totalSize;

        const actualReduction =
          origSize > 0
            ? Number((((origSize - totalCompressedSize) / origSize) * 100).toFixed(2))
            : 0;

        const actualRatio =
          totalCompressedSize > 0
            ? Number((origSize / totalCompressedSize).toFixed(3))
            : 0;

        setCompressResult({
          fileName: file.name.replace(/\.[^/.]+$/, '') + '.huff',
          originalSize: origSize,
          headerSize: binaryData.headerSize,
          metadataSize: binaryData.metadataSize,
          payloadSize: binaryData.payloadSize,
          totalCompressedSize,
          paddingBits: binaryData.paddingBits,
          actualReduction,
          actualRatio,
          buffer: binaryData.fileBuffer,
        });
      } catch (err) {
        setCompressError(err.message || 'Failed to compress file.');
      } finally {
        setIsCompressing(false);
      }
    };

    reader.onerror = () => {
      setCompressError('Failed to read the input file.');
      setIsCompressing(false);
    };

    reader.readAsText(file);
  };

  // Download compressed .huff file
  const downloadCompressedFile = () => {
    if (!compressResult?.buffer) return;
    const blob = new Blob([compressResult.buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = compressResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle .huff file upload for decompression
  const handleDecompressFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDecompressFile(file);
    setDecompressError(null);
    setDecompressResult(null);
    setIsDecompressing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);

        const result = decompressBinaryFile(uint8Array);

        setDecompressResult({
          originalFileName: file.name.replace(/\.[^/.]+$/, '') + '_decompressed.txt',
          text: result.text,
          byteLength: result.originalByteLength,
          symbolCount: result.symbolCount,
          paddingBits: result.paddingBits,
        });
      } catch (err) {
        setDecompressError(err.message || 'Decompression failed.');
      } finally {
        setIsDecompressing(false);
      }
    };

    reader.onerror = () => {
      setDecompressError('Failed to read binary file.');
      setIsDecompressing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Download restored .txt file
  const downloadDecompressedFile = () => {
    if (!decompressResult?.text) return;
    const blob = new Blob([decompressResult.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = decompressResult.originalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Tab Switcher: Compress vs Decompress */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <span>Standalone Binary File Tool (.huff)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real byte-packed compression: encodes raw text into self-contained .huff binaries & restores them
          </p>
        </div>

        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('compress')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              mode === 'compress'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Compress (.txt → .huff)
          </button>
          <button
            type="button"
            onClick={() => setMode('decompress')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              mode === 'decompress'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Decompress (.huff → .txt)
          </button>
        </div>
      </div>

      {/* COMPRESS MODE */}
      {mode === 'compress' && (
        <div className="space-y-4">
          {/* Upload Zone */}
          <div
            onClick={() => compressInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700/80 hover:border-indigo-500/80 bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition-colors"
          >
            <input
              ref={compressInputRef}
              type="file"
              accept=".txt"
              onChange={handleCompressFileUpload}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-200">
              {compressFile ? compressFile.name : 'Select or drop a .txt file to compress'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supports ASCII, UTF-8, source code, and Unicode text files
            </p>
          </div>

          {compressError && (
            <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-950/60 border border-rose-800/60 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{compressError}</span>
            </div>
          )}

          {/* Compress Result Details */}
          {compressResult && (
            <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <FileArchive className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-200 font-bold">{compressResult.fileName}</span>
                </div>

                <button
                  type="button"
                  onClick={downloadCompressedFile}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .huff File</span>
                </button>
              </div>

              {/* Physical File Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg">
                  <span className="text-slate-400 block font-sans text-[11px]">Original Size</span>
                  <span className="text-slate-200 font-bold">
                    {formatBytes(compressResult.originalSize)}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg">
                  <span className="text-slate-400 block font-sans text-[11px]">Total .huff File</span>
                  <span className="text-cyan-400 font-bold">
                    {formatBytes(compressResult.totalCompressedSize)}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg">
                  <span className="text-slate-400 block font-sans text-[11px]">Actual Reduction</span>
                  <span
                    className={`font-bold ${
                      compressResult.actualReduction > 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {formatPercent(compressResult.actualReduction)}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg">
                  <span className="text-slate-400 block font-sans text-[11px]">Actual File Ratio</span>
                  <span className="text-indigo-300 font-bold">
                    {compressResult.actualRatio}:1
                  </span>
                </div>
              </div>

              {/* Exact Byte Layout breakdown */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-300 block">
                  Self-Contained File Structure Breakdown:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
                  <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-lg">
                    <span className="text-slate-200 font-semibold block">1. Header (12 B)</span>
                    Magic 'HUFF' + ver + padding + original length
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-lg">
                    <span className="text-slate-200 font-semibold block">
                      2. Codebook ({formatBytes(compressResult.metadataSize)})
                    </span>
                    Serialized symbols & frequencies
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-lg">
                    <span className="text-cyan-300 font-semibold block">
                      3. Payload ({formatBytes(compressResult.payloadSize)})
                    </span>
                    Packed Huffman bitstream
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DECOMPRESS MODE */}
      {mode === 'decompress' && (
        <div className="space-y-4">
          <div
            onClick={() => decompressInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/80 bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition-colors"
          >
            <input
              ref={decompressInputRef}
              type="file"
              accept=".huff"
              onChange={handleDecompressFileUpload}
              className="hidden"
            />
            <FileArchive className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-200">
              {decompressFile ? decompressFile.name : 'Select or drop a .huff file to decompress'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Validates header integrity and restores exact original content
            </p>
          </div>

          {decompressError && (
            <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-950/60 border border-rose-800/60 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{decompressError}</span>
            </div>
          )}

          {decompressResult && (
            <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Decompression Succeeded ({formatBytes(decompressResult.byteLength)})</span>
                </div>

                <button
                  type="button"
                  onClick={downloadDecompressedFile}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/25 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Restored .txt</span>
                </button>
              </div>

              {/* Preview */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">Restored Text Preview:</span>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 max-h-45 overflow-y-auto whitespace-pre-wrap select-all">
                  {decompressResult.text}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

