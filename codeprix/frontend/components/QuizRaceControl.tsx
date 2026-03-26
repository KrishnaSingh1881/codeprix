'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDuration, formatTimerClock } from '@/lib/leaderboard';
import { START_LIGHT_COUNT, START_LIGHT_STEP_MS } from '@/lib/raceConfig';
import { useLaunchAudio } from '@/lib/useLaunchAudio';

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: number;
  mappedCorrect?: number;
  sector?: string;
};

type QuizRaceControlProps = {
  team: string;
  current: number;
  total: number;
  selected: number | null;
  finished: boolean;
  raceArmed: boolean;
  question: QuizQuestion | null;
  questionTimeMs: number;
  overallTimeMs: number;
  rankedQuestionTimeMs: number;
  penaltyMs: number;
  onAnswer: (idx: number) => void;
  onStartRace: () => void;
  onQuitRace: () => void;
  onFinishRace: () => void;
  onOpenLeaderboard: () => void;
  penaltyShaking?: boolean;
  isDnf?: boolean;
};

type DashboardProps = {
  team: string;
  current: number;
  total: number;
  finished: boolean;
  questionTimeMs: number;
  overallTimeMs: number;
  rankedQuestionTimeMs: number;
  penaltyMs: number;
  penaltyShaking?: boolean;
  onQuitRace: () => void;
  onOpenLeaderboard: () => void;
};

type QuestionPanelProps = {
  question: QuizQuestion | null;
  selected: number | null;
  onAnswer: (idx: number) => void;
};

type LaunchPadProps = {
  team: string;
  sequenceStep: number;
  sequenceRunning: boolean;
  onStartSequence: () => void;
};

type FinishedPanelProps = {
  team: string;
  total: number;
  rankedQuestionTimeMs: number;
  onFinishRace: () => void;
  onOpenLeaderboard: () => void;
  isDnf?: boolean;
};

const optionLetters = ['A', 'B', 'C', 'D'];

const answerStateClasses = {
  idle: 'border-white/10 bg-white/[0.03] text-white hover:border-[#E10600]/50 hover:bg-white/[0.05]',
  correct: 'border-emerald-400/65 bg-emerald-500/14 text-white',
  incorrect: 'border-red-500/65 bg-red-500/14 text-white',
};

// ── Progress Component (Abu Dhabi Circuit) ──────────────────────────────────
const ProgressTrack = memo(function ProgressTrack({
  current,
  total,
  questionTimeMs,
}: { current: number; total: number; questionTimeMs: number; }) {
  // Estimated 30s per question for visual car movement within the lap
  const lapProgress = Math.min(questionTimeMs / 30000, 0.98); 
  const progressPercent = total > 0 ? ((current + lapProgress) / total) * 100 : 0;
  const circuitPath = "M 175,138 L 78,138 C 68,138 60,133 55,126 L 48,112 C 40,98 34,82 32,66 C 30,48 36,34 48,26 L 62,20 C 72,16 82,18 88,26 C 92,32 92,40 88,48 L 82,60 C 78,68 80,76 88,80 L 100,84 C 108,86 112,82 114,74 L 118,62 C 120,54 128,52 134,58 L 144,70 C 154,82 164,100 172,120 C 178,132 178,138 175,138 Z";
  
  const currentSector = (current / total) < 0.33 ? 1 : (current / total) < 0.66 ? 2 : 3;

  return (
    <div className="flex gap-4 items-stretch h-40 w-full max-w-[450px]">
      {/* Big Rectangle: Circuit Progress */}
      <div className="flex-1 relative bg-white/[0.03] rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center p-6">
        <svg viewBox="0 0 210 160" className="h-full w-full">
          <path d={circuitPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
          <motion.path
            d={circuitPath}
            fill="none"
            stroke="#E10600"
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progressPercent / 100 }}
            transition={{ type: 'tween', ease: 'linear' }}
          />
          <motion.g
            animate={{ offsetDistance: `${progressPercent}%` }}
            style={{ offsetPath: `path('${circuitPath}')` }}
            transition={{ type: 'tween', ease: 'linear' }}
          >
             <circle r="8" fill="#fff" className="shadow-[0_0_20px_white]" />
             <circle r="4" fill="#E10600" />
          </motion.g>
        </svg>
      </div>

      {/* Side Rectangles: Sectors */}
      <div className="flex flex-col gap-2 w-20">
        {[1, 2, 3].map(s => (
          <div 
            key={s} 
            className={`flex-1 rounded-2xl border flex flex-col items-center justify-center transition-all duration-500 bg-[#0d0d0d] ${
              currentSector === s 
                ? 'border-[#ffca28] shadow-[0_0_20px_rgba(255,202,40,0.15)] bg-white/[0.05]' 
                : 'border-white/5 opacity-50'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full mb-1.5 ${currentSector === s ? 'bg-[#ffca28] shadow-[0_0_8px_#ffca28]' : 'bg-white/20'}`} />
            <span className={`font-racing text-[10px] tracking-[0.2em] ${currentSector === s ? 'text-[#ffca28]' : 'text-white/40'}`}>S{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

const Dashboard = memo(function Dashboard({
  team,
  current,
  total,
  finished,
  questionTimeMs,
  overallTimeMs,
  rankedQuestionTimeMs,
  penaltyMs,
  penaltyShaking,
  onQuitRace,
  onOpenLeaderboard,
}: DashboardProps) {
  const hasPenalty = penaltyMs > 0;
  const penaltySecs = Math.round(penaltyMs / 1000);

  return (
    <header className="flex items-start justify-between p-6 rounded-[28px] border border-white/10 bg-[#0d0d0d]/90 backdrop-blur-md shadow-2xl">
      {/* Left: Lap + Team + Timer */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-[#E10600]/40 bg-[#1a0807] px-4 py-2">
            <p className="font-racing text-[8px] uppercase tracking-[0.3em] text-[#E10600]">Current Lap</p>
            <div className="flex items-end gap-1">
              <span className="font-racing text-2xl text-white">{current + 1}</span>
              <span className="font-racing text-xs text-white/30 mb-0.5">/{total}</span>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="flex flex-col">
            <p className="font-racing text-[8px] uppercase tracking-[0.3em] text-white/30">Team</p>
            <p className="font-racing text-sm text-white uppercase tracking-tight">{team}</p>
          </div>
        </div>

        <div className="relative">
          <div className={`font-racing text-5xl sm:text-7xl tracking-[0.08em] text-white ${penaltyShaking ? 'penalty-shake' : ''}`}>
            {formatTimerClock(questionTimeMs)}
          </div>
          {hasPenalty && (
            <span className="absolute -top-2 -right-14 rounded-md bg-[#E10600] px-2 py-0.5 font-racing text-sm text-white shadow-[0_0_12px_rgba(225,6,0,0.4)]">
              +{penaltySecs}s
            </span>
          )}
        </div>
      </div>

      {/* Right: Circuit */}
      <div className="flex flex-col items-end h-full">
        <ProgressTrack current={current} total={total} questionTimeMs={questionTimeMs} />
      </div>
    </header>
  );
});

const QuestionPanel = memo(function QuestionPanel({
  question,
  selected,
  onAnswer,
}: QuestionPanelProps) {
  if (!question) return null;
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-8 w-full max-w-6xl mx-auto"
    >
      {/* 1 & 2. The Question inside a Box */}
      <div className="w-full max-w-5xl rounded-[32px] border border-white/10 bg-[#0d0d0d]/40 p-10 sm:p-14 text-center backdrop-blur-md shadow-2xl">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
          {question.question}
        </h2>
      </div>

      {/* 3. Options (2x2 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-4">
        {question.options.map((opt, idx) => {
          const isChosen = selected === idx;
          const isCorrect = idx === (question.mappedCorrect ?? question.answer);
          const showResult = selected !== null;
          
          return (
            <button
              key={`${question.id}-${opt}`}
              onClick={() => onAnswer(idx)}
              disabled={selected !== null}
              className={`group relative overflow-hidden rounded-[24px] border px-6 py-7 text-left transition-all duration-300 active:scale-[0.98] ${
                isChosen 
                  ? 'border-white/40 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-lg font-bold transition-colors ${
                  isChosen ? 'bg-white text-black border-transparent' : 'bg-white/5 border-white/10 text-white/40'
                }`}>
                  {optionLetters[idx]}
                </div>
                <div className="flex-1 font-semibold text-xl text-white">{opt}</div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
});

// Reuse original components but with updated styles if needed
const LaunchPad = memo(function LaunchPad({ team, sequenceStep, sequenceRunning, onStartSequence }: LaunchPadProps) {
  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-[#0d0d0d] p-12 text-center shadow-2xl">
        <p className="font-racing text-xs uppercase tracking-[0.4em] text-[#E10600]">GRID POSITION SECURED</p>
        <h1 className="mt-6 font-racing text-5xl sm:text-7xl tracking-[0.06em] text-white">CODEPRIX 1.0</h1>
        <p className="mt-8 text-xl text-white/60">Welcome, <span className="text-white font-bold">{team}</span>. Pre-race checks complete.</p>

        <div className="mt-12 flex justify-center gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex h-32 w-20 flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-black">
              <span className={`h-8 w-8 rounded-full border-2 transition-all ${sequenceStep >= idx ? 'bg-[#E10600] border-[#ff5f58] shadow-[0_0_20px_#E10600]' : 'bg-transparent border-white/10'}`} />
              <span className={`h-8 w-8 rounded-full border-2 transition-all ${sequenceStep > idx ? 'bg-[#E10600] border-[#ff5f58] shadow-[0_0_20px_#E10600]' : 'bg-transparent border-white/10'}`} />
            </div>
          ))}
        </div>

        <div className="mt-12">
          <button
            onClick={onStartSequence}
            disabled={sequenceRunning}
            className="rounded-2xl bg-[#E10600] px-12 py-5 font-racing text-xl uppercase tracking-[0.2em] text-white transition-all hover:bg-[#ff1a0e] shadow-[0_0_40px_rgba(225,6,0,0.4)] disabled:opacity-50"
          >
            {sequenceRunning ? 'LAUNCHING...' : 'START RACE'}
          </button>
        </div>
      </div>
    </main>
  );
});

const FinishedPanel = memo(function FinishedPanel({ team, total, rankedQuestionTimeMs, onFinishRace, onOpenLeaderboard, isDnf }: FinishedPanelProps) {
  // L key shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') onOpenLeaderboard();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpenLeaderboard]);

  return (
    <div className="w-full rounded-[26px] border border-white/12 bg-black/75 px-6 py-9 text-center shadow-[0_28px_70px_rgba(0,0,0,0.5)] sm:px-12 sm:py-12">
      <p className="font-racing text-xs uppercase tracking-[0.4em] text-[#E10600]">{isDnf ? 'DISQUALIFIED' : 'SESSION COMPLETE'}</p>
      <h2 className="mt-6 font-racing text-4xl sm:text-6xl tracking-[0.06em] text-white uppercase">{isDnf ? 'DNF - DID NOT FINISH' : 'RACE FINISHED'}</h2>
      <p className="mt-6 text-xl text-white/70">
        Team <span className="text-white font-bold">{team}</span> {isDnf ? 'has been disqualified due to multiple track deviations.' : `completed ${total} laps.`}
      </p>
      <div className="mt-4 font-racing text-3xl text-[#E10600] mb-10">
        {isDnf ? 'POSITION: LAST' : `FINAL TIME: ${formatDuration(rankedQuestionTimeMs)}`}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {/* Leaderboard button */}
        <button
          onClick={onOpenLeaderboard}
          className="flex items-center justify-center gap-3 rounded-2xl border border-[#00c853]/50 bg-[#00c853]/10 px-10 py-5 font-racing text-lg uppercase tracking-[0.2em] text-[#00c853] hover:bg-[#00c853]/20 transition-all shadow-[0_0_30px_rgba(0,200,83,0.15)] active:scale-[0.98]"
        >
          <span>📊 Leaderboard</span>
          <span className="rounded-lg border border-[#00c853]/30 px-2 py-0.5 text-[10px] tracking-widest opacity-50">L</span>
        </button>

        {/* Exit button */}
        <button
          onClick={onFinishRace}
          className="rounded-2xl bg-[#E10600] px-10 py-5 font-racing text-lg uppercase tracking-[0.2em] text-white transition-all hover:bg-[#ff1a0e] shadow-[0_0_30px_rgba(225,6,0,0.3)] active:scale-[0.98]"
        >
          Exit to Dashboard
        </button>
      </div>
    </div>
  );
});

export default function QuizRaceControl({
  team, current, total, selected, finished, raceArmed, question,
  questionTimeMs, overallTimeMs, rankedQuestionTimeMs, penaltyMs, 
  onAnswer, onStartRace, onQuitRace, onFinishRace, onOpenLeaderboard, penaltyShaking, isDnf
}: QuizRaceControlProps) {
  const [sequenceStep, setSequenceStep] = useState(-1);
  const [sequenceRunning, setSequenceRunning] = useState(false);
  const { unlockAudio, playTickSound, playGoSound } = useLaunchAudio();

  const startLaunchSequence = useCallback(() => {
    if (sequenceRunning) return;
    unlockAudio();
    setSequenceRunning(true);
    setSequenceStep(0);
    playTickSound();
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < 5) {
        setSequenceStep(step);
        playTickSound();
      } else {
        clearInterval(interval);
        playGoSound();
        setSequenceStep(-1);
        setSequenceRunning(false);
        onStartRace();
      }
    }, 800);
  }, [onStartRace, playGoSound, playTickSound, sequenceRunning, unlockAudio]);

  if (!raceArmed && !finished) {
    return <LaunchPad team={team} sequenceStep={sequenceStep} sequenceRunning={sequenceRunning} onStartSequence={startLaunchSequence} />;
  }

  return (
    <div className={`min-h-screen text-white p-4 sm:p-8 flex flex-col ${finished ? 'items-center justify-center' : 'gap-8'}`}>
      {!finished && (
        <Dashboard
          team={team} current={current} total={total} finished={finished}
          questionTimeMs={questionTimeMs} overallTimeMs={overallTimeMs}
          rankedQuestionTimeMs={rankedQuestionTimeMs}
          penaltyMs={penaltyMs}
          penaltyShaking={penaltyShaking}
          onQuitRace={onQuitRace}
          onOpenLeaderboard={onOpenLeaderboard}
        />
      )}
      
      <main className={`${finished ? 'w-full max-w-4xl' : 'flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full'}`}>
        <AnimatePresence mode="wait">
          {finished ? (
            <FinishedPanel
              team={team} total={total}
              rankedQuestionTimeMs={rankedQuestionTimeMs}
              onFinishRace={onFinishRace}
              onOpenLeaderboard={onOpenLeaderboard}
              isDnf={isDnf}
            />
          ) : (
            <QuestionPanel
              question={question} selected={selected} onAnswer={onAnswer}
            />
          )}
        </AnimatePresence>
      </main>

      {!finished && raceArmed && (
        <div className="fixed bottom-8 right-8 z-50">
          <button 
            onClick={onQuitRace}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 font-racing text-[10px] uppercase tracking-[0.3em] text-white/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all backdrop-blur-sm"
          >
            RETIRE SESSION
          </button>
        </div>
      )}
    </div>
  );
}
