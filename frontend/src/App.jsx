import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import TextInput from './components/TextInput.jsx';
import CompressionStats from './components/CompressionStats.jsx';
import FrequencyTable from './components/FrequencyTable.jsx';
import HuffmanTree from './components/HuffmanTree.jsx';
import TreeStepper from './components/TreeStepper.jsx';
import EncodedOutput from './components/EncodedOutput.jsx';
import DecodingPanel from './components/DecodingPanel.jsx';
import FileCompressor from './components/FileCompressor.jsx';
import Footer from './components/Footer.jsx';

import { buildHuffmanTree } from './algorithms/huffman.js';
import { encodeText } from './algorithms/encode.js';
import { calculateCompressionStats } from './algorithms/compressionStats.js';
import { decodeBitstream, verifyLossless } from './algorithms/decode.js';

import {
  BarChart3,
  GitFork,
  Cpu,
  TableProperties,
  Binary,
  CheckCircle,
  HardDrive,
  Sparkles,
} from 'lucide-react';

const INITIAL_TEXT = 'Huffman coding is an optimal prefix code algorithm used for lossless data compression. 🚀';

export default function App() {
  const [text, setText] = useState(INITIAL_TEXT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tree' | 'stepper' | 'table' | 'bitstream' | 'decode' | 'file'
  const [selectedSymbol, setSelectedSymbol] = useState(null);

  // Analysis state
  const [result, setResult] = useState(null);

  // Analysis function
  const runAnalysis = useCallback((inputTextToAnalyze) => {
    const rawText = inputTextToAnalyze !== undefined ? inputTextToAnalyze : text;

    if (!rawText || rawText.trim().length === 0) {
      setError('Please enter some text or load a sample before analyzing.');
      setResult(null);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // 1. Build Huffman tree deterministically
      const { root, codeTable, frequencyTable, steps, totalSymbols } =
        buildHuffmanTree(rawText);

      // 2. Encode text
      const { bitstream, bitLength, packedBytes, paddingBits } = encodeText(
        rawText,
        codeTable
      );

      // 3. Calculate mathematically accurate stats
      const stats = calculateCompressionStats(
        rawText,
        bitstream,
        frequencyTable,
        codeTable
      );

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
        originalText: rawText,
      });
    } catch (err) {
      setError(err.message || 'Error occurred while analyzing text.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  // Run on mount with initial text
  useEffect(() => {
    runAnalysis(INITIAL_TEXT);
  }, []);

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

  const tabs = [
    { id: 'overview', label: 'Overview & Stats', icon: BarChart3 },
    { id: 'tree', label: 'Huffman Tree', icon: GitFork, badge: result?.frequencyTable?.length },
    { id: 'stepper', label: 'Construction Steps', icon: Cpu, badge: result?.steps?.length },
    { id: 'table', label: 'Frequency & Codes', icon: TableProperties },
    { id: 'bitstream', label: 'Encoded Bits', icon: Binary },
    { id: 'decode', label: 'Lossless Decoder', icon: CheckCircle },
    { id: 'file', label: 'Binary File (.huff)', icon: HardDrive },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Input Section */}
        <TextInput
          text={text}
          onChange={handleTextChange}
          onAnalyze={() => runAnalysis(text)}
          onClear={handleClear}
          isLoading={isLoading}
          error={error}
        />

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Nav Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-lg shadow-cyan-950/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <CompressionStats stats={result.stats} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">Frequency Distribution Preview</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('table')}
                        className="text-cyan-400 hover:underline"
                      >
                        View Full Table →
                      </button>
                    </div>
                    <FrequencyTable
                      frequencyTable={result.frequencyTable.slice(0, 6)}
                      selectedSymbol={selectedSymbol}
                      onSelectSymbol={(sym) => {
                        setSelectedSymbol(sym);
                        setActiveTab('tree');
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">Tree Preview</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('tree')}
                        className="text-cyan-400 hover:underline"
                      >
                        Interactive Canvas →
                      </button>
                    </div>
                    <HuffmanTree
                      root={result.root}
                      selectedSymbol={selectedSymbol}
                      onSelectSymbol={setSelectedSymbol}
                    />
                  </div>
                </div>

                <DecodingPanel
                  bitstream={result.bitstream}
                  root={result.root}
                  originalText={result.originalText}
                />
              </div>
            )}

            {activeTab === 'tree' && (
              <HuffmanTree
                root={result.root}
                selectedSymbol={selectedSymbol}
                onSelectSymbol={setSelectedSymbol}
              />
            )}

            {activeTab === 'stepper' && (
              <TreeStepper steps={result.steps} />
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

            {activeTab === 'bitstream' && (
              <EncodedOutput
                bitstream={result.bitstream}
                bitLength={result.bitLength}
                packedBytes={result.packedBytes}
                paddingBits={result.paddingBits}
                codeTable={result.codeTable}
              />
            )}

            {activeTab === 'decode' && (
              <DecodingPanel
                bitstream={result.bitstream}
                root={result.root}
                originalText={result.originalText}
              />
            )}

            {activeTab === 'file' && (
              <FileCompressor />
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
