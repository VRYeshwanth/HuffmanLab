import React from 'react';
import { Cpu, ShieldCheck, HelpCircle, Code2, BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Section 1 */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>How Huffman Coding Works</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Developed by David A. Huffman in 1952, Huffman coding is a greedy algorithm that creates optimal prefix codes. Characters that occur frequently receive shorter binary codes, while rare characters receive longer codes, minimizing total bit consumption.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Lossless & Prefix-Free</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Huffman codes are strictly prefix-free: no character's code is a prefix of another code. This ensures unambiguous, lossless decoding by traversing a single binary tree without requiring delimiters.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Algorithmic Complexity</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Using a binary min-heap priority queue, tree construction runs in <strong className="font-mono text-purple-300">O(K log K)</strong> time, where <span className="font-mono">K</span> is the number of distinct symbols. Encoding and decoding scale linearly with text length <strong className="font-mono text-purple-300">O(N)</strong>.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
          <div>
            HuffmanLab • Interactive Lossless Compression Visualizer
          </div>
          <div className="flex items-center space-x-4">
            <span>React 19 + Vite</span>
            <span>Tailwind CSS</span>
            <span>Deterministic Min-Heap</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

