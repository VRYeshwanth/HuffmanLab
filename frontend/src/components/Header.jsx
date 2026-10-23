import React from 'react';
import { Binary } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Binary className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">
              HuffmanLab
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore Huffman coding and lossless compression.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
