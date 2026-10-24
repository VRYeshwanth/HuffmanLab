import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatSymbol } from '../utils/formatSymbol.js';

export default function TreeStepper({ steps }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1200); // ms per step
  const timerRef = useRef(null);

  const totalSteps = steps?.length || 0;
  const currentStep = steps?.[currentStepIndex];

  // Reset step index if steps change
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [steps]);

  // Handle Play/Pause auto-advance
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalSteps, playbackSpeed]);

  if (!steps || steps.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
        No step history available. Run "Analyze & Encode" first.
      </div>
    );
  }

  const goToStep = (index) => {
    setCurrentStepIndex(Math.max(0, Math.min(index, totalSteps - 1)));
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top Header & Step Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span>Step-by-Step Min-Heap Construction</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-800/60 text-indigo-300 font-mono">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Watch how the greedy algorithm repeatedly extracts the two lowest-frequency nodes and merges them.
          </p>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Speed:</span>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value={2000}>0.5x (Slow)</option>
            <option value={1200}>1.0x (Normal)</option>
            <option value={600}>2.0x (Fast)</option>
          </select>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center space-x-2">
          {/* Reset */}
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              goToStep(0);
            }}
            disabled={currentStepIndex === 0}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-40"
            title="Reset to beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              goToStep(currentStepIndex - 1);
            }}
            disabled={currentStepIndex === 0}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-40"
            title="Previous step"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={() => {
              if (currentStepIndex >= totalSteps - 1) {
                goToStep(0);
                setIsPlaying(true);
              } else {
                setIsPlaying(!isPlaying);
              }
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-md shadow-indigo-600/30"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{currentStepIndex >= totalSteps - 1 ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              goToStep(currentStepIndex + 1);
            }}
            disabled={currentStepIndex >= totalSteps - 1}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-40"
            title="Next step"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Jump to End */}
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              goToStep(totalSteps - 1);
            }}
            disabled={currentStepIndex >= totalSteps - 1}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-40"
            title="Jump to final tree"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Step Slider */}
        <div className="flex-1 max-w-xs flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max={totalSteps - 1}
            value={currentStepIndex}
            onChange={(e) => {
              setIsPlaying(false);
              goToStep(Number(e.target.value));
            }}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Step Description Card */}
      <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-4 text-xs">
        <div className="flex items-center space-x-2 text-indigo-400 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Algorithm Event:</span>
        </div>
        <p className="text-slate-200 text-sm leading-relaxed font-sans">
          {currentStep?.description}
        </p>
      </div>

      {/* Active Merge Focus (if this step merged two nodes) */}
      {currentStep?.extractedLeft && currentStep?.createdParent && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Node Merge Operation (Step {currentStepIndex}):</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
            {/* Left Node */}
            <div className="flex flex-col items-center bg-cyan-950/60 border border-cyan-800/80 rounded-xl p-3 min-w-30">
              <span className="text-[10px] text-cyan-400 font-sans uppercase mb-1">
                Left Child (Branch '0')
              </span>
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-cyan-700 flex items-center justify-center text-sm font-bold text-white mb-1">
                {currentStep.extractedLeft.isLeaf
                  ? formatSymbol(currentStep.extractedLeft.symbol).display
                  : `#${currentStep.extractedLeft.id}`}
              </div>
              <span className="text-slate-300">
                freq: {currentStep.extractedLeft.freq}
              </span>
            </div>

            <span className="text-slate-500 text-lg font-bold">+</span>

            {/* Right Node (if exists) */}
            {currentStep.extractedRight ? (
              <div className="flex flex-col items-center bg-amber-950/60 border border-amber-800/80 rounded-xl p-3 min-w-30">
                <span className="text-[10px] text-amber-400 font-sans uppercase mb-1">
                  Right Child (Branch '1')
                </span>
                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-amber-700 flex items-center justify-center text-sm font-bold text-white mb-1">
                  {currentStep.extractedRight.isLeaf
                    ? formatSymbol(currentStep.extractedRight.symbol).display
                    : `#${currentStep.extractedRight.id}`}
                </div>
                <span className="text-slate-300">
                  freq: {currentStep.extractedRight.freq}
                </span>
              </div>
            ) : (
              <span className="text-slate-500 text-xs">(Single symbol)</span>
            )}

            <ArrowRight className="w-5 h-5 text-indigo-400" />

            {/* Created Parent Node */}
            <div className="flex flex-col items-center bg-indigo-950/70 border border-indigo-700 rounded-xl p-3 min-w-32.5 shadow-lg shadow-indigo-950/50">
              <span className="text-[10px] text-indigo-300 font-sans uppercase mb-1">
                New Parent Node
              </span>
              <div className="w-10 h-10 rounded-full bg-indigo-900 border border-indigo-500 flex items-center justify-center text-sm font-bold text-white mb-1">
                {currentStep.createdParent.freq}
              </div>
              <span className="text-indigo-200">
                combined: {currentStep.createdParent.freq}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Heap State at this step */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            Current Min-Heap Items ({currentStep?.heapNodes?.length || 0}):
          </span>
          <span>Ordered by priority</span>
        </div>

        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-3 bg-slate-950 border border-slate-800 rounded-xl">
          {currentStep?.heapNodes?.map((node, i) => {
            const formatted = node.isLeaf ? formatSymbol(node.symbol) : null;
            return (
              <div
                key={i}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
              >
                <span className="text-indigo-400 font-bold">
                  {node.isLeaf ? formatted.display : `Node#${node.id}`}
                </span>
                <span className="text-slate-500">:</span>
                <span className="text-slate-300 font-semibold">{node.freq}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

