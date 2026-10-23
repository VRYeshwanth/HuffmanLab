import React, { useState, useRef } from 'react';
import Header from './components/Header.jsx';
import TextInput from './components/TextInput.jsx';
import CompressionStats from './components/CompressionStats.jsx';
import EncodedOutput from './components/EncodedOutput.jsx';
import HuffmanTree from './components/HuffmanTree.jsx';
import FrequencyTable from './components/FrequencyTable.jsx';
import DecodingPanel from './components/DecodingPanel.jsx';
import FileCompressor from './components/FileCompressor.jsx';
import Footer from './components/Footer.jsx';

import { buildHuffmanTree } from './algorithms/huffman.js';
import { encodeText } from './algorithms/encode.js';
import { calculateCompressionStats } from './algorithms/compressionStats.js';
import { decodeBitstream, verifyLossless } from './algorithms/decode.js';

import { GitFork, TableProperties, CheckCircle, ChevronDown, HardDrive } from 'lucide-react';

export default function App() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'table' | 'decode'
  const [selectedSymbol, setSelectedSymbol] = useState(null);

  const resultsRef = useRef(null);

  // Checks if text in textarea differs from encoded results
  const isStale = Boolean(result && text !== result.originalText);

  const handleEncode = () => {
    if (!text || text.trim().length === 0) {
      setError('Please enter some text or click "Load Example" before encoding.');
      setResult(null);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // 1. Build Huffman tree deterministically
      const { root, codeTable, frequencyTable, steps, totalSymbols } =
        buildHuffmanTree(text);

      // 2. Encode text into bitstream
      const { bitstream, bitLength, packedBytes, paddingBits } = encodeText(
        text,
        codeTable
      );

      // 3. Calculate mathematically accurate stats
      const stats = calculateCompressionStats(
        text,
        bitstream,
        frequencyTable,
        codeTable
      );

      // 4. Verify lossless reconstruction
      const decodeResult = decodeBitstream(bitstream, root, text);
      const verification = verifyLossless(text, decodeResult.decodedText);

      setResult({
        root,
        codeTable,
        frequencyTable,
        steps,
        totalSymbols,
        bitstream,
        bitLength,
        packedBytes,
        paddingBits,
        stats,
        originalText: text,
        isExactMatch: verification.exactMatch && !decodeResult.error,
      });

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch (err) {
      setError(err.message || 'Error occurred while encoding text.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setError(null);
    setSelectedSymbol(null);
  };

  const handleTextChange = (newText) => {
    setText(newText);
    if (error) setError(null);
  };

  const detailTabs = [
    { id: 'tree', label: 'Huffman Tree', icon: GitFork },
    { id: 'table', label: 'Character Codes', icon: TableProperties },
    { id: 'decode', label: 'Decode & Verify', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Section B: Text Input */}
        <TextInput
          text={text}
          onChange={handleTextChange}
          onEncode={handleEncode}
          onClear={handleClear}
          isLoading={isLoading}
          error={error}
          isStale={isStale}
        />

        {/* Section C: Results Section (Rendered ONLY after encoding) */}
        {result && (
          <div ref={resultsRef} className="space-y-6 pt-2">
            {/* LEVEL 1: Essential Results */}
            <div className="space-y-4">
              {/* 3 Compact Metric Cards */}
              <CompressionStats stats={result.stats} />

              {/* Encoded Bitstream with Lossless Status & Copy Button */}
              <EncodedOutput
                bitstream={result.bitstream}
                bitLength={result.bitLength}
                isExactMatch={result.isExactMatch}
              />
            </div>

            {/* LEVEL 2: Additional Details Tabs */}
            <div className="space-y-3">
              {/* Tab Selector */}
              <div className="flex border-b border-slate-800 space-x-1">
                {detailTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                        isActive
                          ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content: Only render the selected tab */}
              {activeTab === 'tree' && (
                <HuffmanTree
                  root={result.root}
                  selectedSymbol={selectedSymbol}
                  onSelectSymbol={setSelectedSymbol}
                />
              )}

              {activeTab === 'table' && (
                <FrequencyTable
                  frequencyTable={result.frequencyTable}
                  selectedSymbol={selectedSymbol}
                  onSelectSymbol={(sym) => {
                    setSelectedSymbol(sym);
                    setActiveTab('tree');
                  }}
                />
              )}

              {activeTab === 'decode' && (
                <DecodingPanel
                  bitstream={result.bitstream}
                  root={result.root}
                  originalText={result.originalText}
                />
              )}
            </div>

            {/* Unobtrusive Advanced Section: Binary File Tool */}
            <details className="group border border-slate-800/80 rounded-xl bg-slate-900/40 overflow-hidden">
              <summary className="p-3.5 text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center justify-between cursor-pointer select-none">
                <span className="flex items-center space-x-2">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                  <span>Advanced: Standalone Binary File (.huff) Compressor & Decompressor</span>
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
                <FileCompressor />
              </div>
            </details>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
