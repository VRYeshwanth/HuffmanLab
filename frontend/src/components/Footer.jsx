import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950 mt-12 text-slate-500 text-xs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <p className="leading-relaxed text-slate-400">
          <strong className="text-slate-300">About Huffman Coding:</strong> Developed by David A. Huffman in 1952, Huffman coding is a greedy prefix-free algorithm that assigns shorter binary codes to more frequent characters. It guarantees mathematically optimal lossless compression for character-by-character coding without losing any information.
        </p>

        <div className="border-t border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>HuffmanLab — Lossless Compression Visualizer</span>
          <span>100% In-Browser Execution</span>
        </div>
      </div>
    </footer>
  );
}
