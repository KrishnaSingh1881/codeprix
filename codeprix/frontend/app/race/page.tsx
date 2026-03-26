'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import QuizRaceControl, { QuizQuestion } from '@/components/QuizRaceControl';
import { getScaledElapsedMs, START_LIGHT_COUNT, START_LIGHT_STEP_MS } from '@/lib/raceConfig';
import { formatDuration } from '@/lib/leaderboard';
import { getQuestionsFromStorage, flattenQuestions, getQuestionsForAttempt, saveQuestionsToStorage, clearQuestionsStorage } from '@/lib/questions';
import { getParticipant } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import { useLaunchAudio } from '@/lib/useLaunchAudio';
import { usePenalty } from '@/lib/usePenalty';
import LeaderboardOverlay from '@/components/LeaderboardOverlay';
import { useAudio } from '@/lib/useAudio';
import MuteButton from '@/components/MuteButton';
import CountdownOverlay from '@/components/CountdownOverlay';
import SectorOverlay from '@/components/SectorOverlay';
import { AnimatePresence, motion } from 'framer-motion';

const QUESTIONS_PER_SECTOR = 3;

interface Attempt {
  id: string;
  participant_id: string;
  event_id: number;
  status: 'pending' | 'in_progress' | 'completed';
  started_at: string | null;
  completed_at: string | null;
  total_time_seconds: number | null;
  score: number | null;
}

export default function RacePage() {
  const router = useRouter();
  const [participant, setParticipant] = useState<{ id: string; team_name: string } | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [team, setTeam] = useState('');
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [raceArmed, setRaceArmed] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [questionTimeMs, setQuestionTimeMs] = useState(0);
  const [overallTimeMs, setOverallTimeMs] = useState(0);
  const [rankedQuestionTimeMs, setRankedQuestionTimeMs] = useState(0);
  const [penaltyMs, setPenaltyMs] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [showSectorOverlay, setShowSectorOverlay] = useState(false);
  const [currentSectorNum, setCurrentSectorNum] = useState(1);
  const [penaltyNotification, setPenaltyNotification] = useState<string | null>(null);
  const [penaltyShaking, setPenaltyShaking] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [sequenceStep, setSequenceStep] = useState(-1);
  const [sequenceRunning, setSequenceRunning] = useState(false);
  const sequenceIntervalRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSaveRef = useRef<number>(0);

  const { unlockAudio, playTickSound, playGoSound } = useLaunchAudio();
  const { play, muted, toggleMute } = useAudio();

  // L key shortcut to open leaderboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') setShowLeaderboard(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);


  // Penalty system — active only while race is running
  usePenalty({
    attemptId: attempt?.id ?? null,
    isActive: raceArmed && !finished,
    onPenalty: (seconds) => {
      setPenaltyMs((prev) => prev + seconds * 1000);
      setPenaltyShaking(true);
      setTimeout(() => setPenaltyShaking(false), 600);
    },
    onNotification: (message) => {
      setPenaltyNotification(message);
      setTimeout(() => setPenaltyNotification(null), 2500);
    },
  });

  useEffect(() => {
    const stored = getParticipant();
    if (stored) {
      setParticipant(stored);
      setTeam(stored.team_name);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const loadAttemptAndQuestions = async () => {
      if (!participant) return;

      // 1. Get the ACTIVE race
      const { data: activeConfigs } = await supabase
        .from('event_config')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (!activeConfigs || activeConfigs.length === 0) {
        alert('No race is currently active. Returning to grid...');
        router.push('/dashboard');
        return;
      }
      const activeRaceId = activeConfigs[0].id;

      // 2. Load attempt FOR ACTIVE RACE from Supabase
      const { data: attempts, error: attemptError } = await supabase
        .from('attempts')
        .select('*')
        .eq('participant_id', participant.id)
        .eq('event_id', activeRaceId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!attemptError && attempts && attempts.length > 0) {
        const storedAttempt = attempts[0];
        setAttempt(storedAttempt);

        if (storedAttempt.status === 'completed') {
          setFinished(true);
          setRaceArmed(false);
          setStartedAt(storedAttempt.started_at ? new Date(storedAttempt.started_at).getTime() : null);
          setScore(storedAttempt.score || 0);
          setOverallTimeMs((storedAttempt.total_time_seconds || 0) * 1000);
          return;
        }

        if (storedAttempt.status === 'in_progress') {
          setRaceArmed(true);
          setStartedAt(storedAttempt.started_at ? new Date(storedAttempt.started_at).getTime() : Date.now());
          setScore(storedAttempt.score || 0);
          setOverallTimeMs((storedAttempt.total_time_seconds || 0) * 1000);
        }
      } else {
        // No attempt for active race? Go back to create it.
        router.push('/dashboard');
        return;
      }

      // 3. Load questions
      const storedQuestions = getQuestionsFromStorage();
      let rawQuestions: any[];
      const isStale = storedQuestions &&
        storedQuestions.length > 0 &&
        typeof (storedQuestions[0] as any).options?.[0] === 'object';

      if (storedQuestions && !isStale) {
        rawQuestions = storedQuestions as unknown as any[];
      } else {
        if (isStale) clearQuestionsStorage();
        const sectored = await getQuestionsForAttempt(QUESTIONS_PER_SECTOR);
        const flat = flattenQuestions(sectored);
        saveQuestionsToStorage(flat);
        rawQuestions = flat as unknown as any[];
      }

      const mapped = rawQuestions.map((q: any) => {
        const optsRaw: any[] = q.options ?? [];
        const optStrings: string[] = optsRaw.map((o: any) =>
          typeof o === 'string' ? o : o.text ?? String(o)
        );
        const correctLabel: string = q.correctLabel ?? 'A';
        const mappedCorrect = optStrings.findIndex((_, i) =>
          ['A', 'B', 'C', 'D'][i] === correctLabel
        );
        return {
          id: q.id,
          question: q.body ?? q.question ?? '',
          options: optStrings,
          answer: mappedCorrect >= 0 ? mappedCorrect : 0,
          mappedCorrect: q.mappedCorrect ?? mappedCorrect,
          sector: q.sector ?? '1',
        };
      });

      setQuestions(mapped);
      setCurrent(0);
    };

    loadAttemptAndQuestions();
  }, [participant, router]);

  // Timer effect
  useEffect(() => {
    if (!raceArmed || !startedAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = getScaledElapsedMs(startedAt, now);
      setQuestionTimeMs(elapsed);
      const totalSessionMs = elapsed + penaltyMs;
      setOverallTimeMs(totalSessionMs);
      setRankedQuestionTimeMs(totalSessionMs);

      if (now - lastSaveRef.current >= 5000 && attempt) {
        lastSaveRef.current = now;
        supabase
          .from('attempts')
          .update({
            total_time_seconds: Math.round(totalSessionMs / 1000),
            updated_at: new Date().toISOString(),
          })
          .eq('id', attempt.id)
          .then(({ error }) => {
            if (error) console.error('Error saving attempt:', error);
          });
      }
    }, 100);

    timerIntervalRef.current = interval;
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [raceArmed, startedAt, attempt, penaltyMs]);

  const startCountdown = useCallback(() => {
    if (sequenceRunning) return;
    unlockAudio();
    setSequenceRunning(true);
    setSequenceStep(0);
    playTickSound();
    play('countdown');

    let step = 0;
    sequenceIntervalRef.current = window.setInterval(() => {
      step += 1;
      if (step < START_LIGHT_COUNT) {
        setSequenceStep(step);
        playTickSound();
        play('countdown');
        return;
      }
      if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);
      playGoSound();
      play('launch');
      setSequenceStep(-1);
      setSequenceRunning(false);
      setRaceArmed(true);
      setStartedAt(Date.now());
    }, START_LIGHT_STEP_MS);
  }, [playGoSound, playTickSound, sequenceRunning, unlockAudio]);

  const handleAnswer = async (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);

    const currentQuestion = questions[current];
    const isCorrect = idx === (currentQuestion.mappedCorrect ?? currentQuestion.answer);
    if (isCorrect) setScore((prev) => prev + 10);

    const elapsed = getScaledElapsedMs(startedAt || 0);
    setRankedQuestionTimeMs(elapsed + penaltyMs);

    if (attempt) {
      const optionLabels = ['A', 'B', 'C', 'D'];
      const answerData = {
        attempt_id: attempt.id,
        question_id: currentQuestion.id,
        selected_option: optionLabels[idx],
        is_correct: isCorrect,
        sector: parseInt(currentQuestion.sector.toString()) || 1,
        question_started_at: new Date().toISOString(),
        question_answered_at: new Date().toISOString(),
      };
      await supabase.from('answers').insert(answerData);
    }

    setTimeout(() => {
      if (current < questions.length - 1) {
        const questionsPerSector = QUESTIONS_PER_SECTOR;
        const currentSector = Math.floor(current / questionsPerSector);
        const nextSector = Math.floor((current + 1) / questionsPerSector);
        if (nextSector > currentSector) {
          setShowSectorOverlay(true);
          setCurrentSectorNum(nextSector + 1);
          play('sector_complete');
          setTimeout(() => {
            setShowSectorOverlay(false);
            setCurrent((prev) => prev + 1);
            setSelected(null);
            setQuestionTimeMs(0);
          }, 2000);
        } else {
          setCurrent((prev) => prev + 1);
          setSelected(null);
          setQuestionTimeMs(0);
        }
      } else {
        finishRace();
      }
    }, 800);
  };

  const finishRace = async () => {
    setFinished(true);
    setRaceArmed(false);
    play('race_complete');
    if (attempt) {
      const totalTime = Math.round((getScaledElapsedMs(startedAt || 0) + penaltyMs) / 1000);
      await supabase.from('attempts').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_time_seconds: totalTime,
      }).eq('id', attempt.id);
    }
  };

  if (!participant) return null;

  return (
    <AuthGuard role="participant">
      <div onPointerDownCapture={unlockAudio} className="relative min-h-screen">
        <div className="fixed inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-20">
            <source src="/assets/vid.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/85" />
        </div>

        <div className="relative z-10">
          <MuteButton muted={muted} onToggle={toggleMute} />
          <QuizRaceControl
            team={team}
            current={current}
            total={questions.length}
            selected={selected}
            finished={finished}
            raceArmed={raceArmed}
            question={questions[current]}
            questionTimeMs={questionTimeMs}
            overallTimeMs={overallTimeMs}
            rankedQuestionTimeMs={rankedQuestionTimeMs}
            penaltyMs={penaltyMs}
            onAnswer={handleAnswer}
            onStartRace={() => startCountdown()}
            onQuitRace={() => router.push('/dashboard')}
            onFinishRace={() => router.push('/results')}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            penaltyShaking={penaltyShaking}
          />
          <CountdownOverlay sequenceStep={sequenceStep} sequenceRunning={sequenceRunning} />
          <SectorOverlay sector={currentSectorNum} visible={showSectorOverlay} />
          <LeaderboardOverlay isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
          <AnimatePresence>
            {penaltyNotification && (
              <motion.div key="penalty" initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }} className="pointer-events-none fixed top-6 left-1/2 z-50 -translate-x-1/2 w-full max-w-sm px-4">
                <div className="relative overflow-hidden rounded-[18px] border border-[#E10600]/70 bg-black/95 px-6 py-4 shadow-[0_0_40px_rgba(225,6,0,0.5)]">
                  <div className="relative flex items-center gap-3">
                    <span className="font-racing text-2xl text-[#E10600] animate-pulse">⚠</span>
                    <div className="flex-1">
                      <p className="font-racing text-[10px] uppercase tracking-[0.36em] text-[#E10600]/80">Race Control</p>
                      <div className="flex items-end justify-between text-white font-racing">
                        <p className="text-sm">TRACK DEVIATION</p>
                        <span className="text-xl text-[#E10600]">+30s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthGuard>
  );
}
