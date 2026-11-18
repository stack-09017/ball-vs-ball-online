import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  Coins,
  Dices,
  Heart,
  Lock,
  MapPin,
  Play,
  RotateCcw,
  Search,
  User,
} from 'lucide-react';

export interface DraftBallOption {
  id: string;
  name: string;
  badge: string;
  description: string;
}

export interface DraftBallMeta {
  color: string;
  glowColor: string;
  emoji: string;
  speed: string;
  mass: string;
  libraryDescription: string;
}

export interface DraftScreenProps {
  balls: DraftBallOption[];
  visualMeta: Record<string, DraftBallMeta>;
  draftPoolIds: string[];
  unlockedBalls: string[];
  coins: number;
  isOnlineMode: boolean;
  playAgainstBot: boolean;
  onlineRoomId: string;
  onlineRole: 'Player 1' | 'Player 2' | null;
  username: string;
  p1Name: string;
  p2Name: string;
  onChangeP1Name: (name: string) => void;
  onChangeP2Name: (name: string) => void;
  p1Hearts: number;
  p2Hearts: number;
  p1Drafting: string | null;
  p2Drafting: string | null;
  p1Locked: boolean;
  p2Locked: boolean;
  isDraftLockedWaiting: boolean;
  opponentDraftLocked: boolean;
  selectedArenaChoice: string;
  onChangeArena: (arena: string) => void;
  startingHealth: number;
  onChangeStartingHealth: (hp: number) => void;
  rerollErrorFlash: boolean;
  onRerollDraft: () => void;
  onSelectPreview: (side: 'p1' | 'p2', ballId: string) => void;
  onLocalLockPlayer: (side: 'p1' | 'p2', ballId: string) => void;
  onResetLocalDraft: () => void;
  onEnterArena: () => void;
  onOnlineLockStarted: (ballId: string) => void;
  emitWsEvent: (type: string, payload?: unknown) => boolean;
  onBack: () => void;
  onOpenLibrary: () => void;
}

type DraftPoolFilter = 'all' | 'pool' | 'unlocked';

export const DraftScreen: React.FC<DraftScreenProps> = ({
  balls,
  visualMeta,
  draftPoolIds,
  unlockedBalls,
  coins,
  isOnlineMode,
  playAgainstBot,
  onlineRoomId,
  onlineRole,
  username,
  p1Name,
  p2Name,
  onChangeP1Name,
  onChangeP2Name,
  p1Hearts,
  p2Hearts,
  p1Drafting,
  p2Drafting,
  p1Locked,
  p2Locked,
  isDraftLockedWaiting,
  opponentDraftLocked,
  selectedArenaChoice,
  onChangeArena,
  startingHealth,
  onChangeStartingHealth,
  rerollErrorFlash,
  onRerollDraft,
  onSelectPreview,
  onLocalLockPlayer,
  onResetLocalDraft,
  onEnterArena,
  onOnlineLockStarted,
  emitWsEvent,
  onBack,
  onOpenLibrary,
}) => {
  const [filterMode, setFilterMode] = useState<DraftPoolFilter>(() =>
    isOnlineMode ? 'pool' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectedBallId, setInspectedBallId] = useState<string>(
    () =>
      (isOnlineMode
        ? p1Drafting && draftPoolIds.includes(p1Drafting)
          ? p1Drafting
          : draftPoolIds[0]
        : p1Drafting || draftPoolIds[0]) ||
      balls[0]?.id ||
      'standard'
  );

  // Enforce strict 3-option pool whenever entering or refreshing Online Mode
  useEffect(() => {
    if (isOnlineMode) {
      setFilterMode('pool');
      setSearchQuery('');
      if (p1Drafting && draftPoolIds.includes(p1Drafting)) {
        setInspectedBallId(p1Drafting);
      } else if (draftPoolIds[0]) {
        setInspectedBallId(draftPoolIds[0]);
      }
      return;
    }

    if (!p1Locked && p1Drafting) {
      setInspectedBallId(p1Drafting);
    } else if (p1Locked && !p2Locked && p2Drafting) {
      setInspectedBallId(p2Drafting);
    }
  }, [isOnlineMode, draftPoolIds, p1Drafting, p2Drafting, p1Locked, p2Locked]);

  const localSide: 'p1' | 'p2' = isOnlineMode
    ? onlineRole === 'Player 2'
      ? 'p2'
      : 'p1'
    : p1Locked && !p2Locked
    ? 'p2'
    : 'p1';

  const isBallLockedFromPlay = (ballId: string): boolean =>
    ballId === 'capedbaldy' && !unlockedBalls.includes('capedbaldy');

  const filteredBalls = useMemo(() => {
    if (isOnlineMode) {
      const poolSet = new Set(draftPoolIds);
      return balls.filter((b) => poolSet.has(b.id)).slice(0, 3);
    }

    let list = balls;
    if (filterMode === 'pool') {
      const poolSet = new Set(draftPoolIds);
      list = balls.filter((b) => poolSet.has(b.id));
    } else if (filterMode === 'unlocked') {
      const unlockedSet = new Set(unlockedBalls);
      list = balls.filter((b) => unlockedSet.has(b.id));
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.badge.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [isOnlineMode, balls, filterMode, draftPoolIds, unlockedBalls, searchQuery]);

  const inspectedBall = useMemo(() => {
    if (isOnlineMode) {
      return (
        filteredBalls.find((b) => b.id === inspectedBallId) ||
        filteredBalls[0] ||
        balls[0]
      );
    }
    return balls.find((b) => b.id === inspectedBallId) || balls[0];
  }, [isOnlineMode, filteredBalls, balls, inspectedBallId]);
  const inspectedMeta = inspectedBall ? visualMeta[inspectedBall.id] : undefined;
  const inspectedRequiresUnlock = inspectedBall ? isBallLockedFromPlay(inspectedBall.id) : false;

  const p1BallObj = balls.find((b) => b.id === p1Drafting) || null;
  const p2BallObj = balls.find((b) => b.id === p2Drafting) || null;

  const isLocalReadyToEnter = !isOnlineMode && p1Locked && p2Locked;
  const isArenaConfigEditable = !isOnlineMode || onlineRole !== 'Player 2';

  const handleCardSelect = (ballId: string) => {
    if (isDraftLockedWaiting) return;
    if (isOnlineMode && !draftPoolIds.includes(ballId)) return;
    setInspectedBallId(ballId);
    if (!isOnlineMode && isLocalReadyToEnter) {
      return;
    }
    if (isBallLockedFromPlay(ballId)) {
      return;
    }
    onSelectPreview(localSide, ballId);
  };

  const handleLockDraft = (overrideBallId?: string) => {
    if (isDraftLockedWaiting) return;
    const chosenBallId = overrideBallId || inspectedBall?.id;
    if (!chosenBallId) return;
    if (isBallLockedFromPlay(chosenBallId)) return;

    if (isOnlineMode) {
      if (!draftPoolIds.includes(chosenBallId)) return;
      const playerSide = onlineRole === 'Player 2' ? 'p2' : 'p1';
      const localDisplayName = (username.trim() || p1Name.trim() || 'Fighter').slice(0, 12);
      emitWsEvent('lock_draft', {
        roomId: onlineRoomId,
        playerSide,
        ballId: chosenBallId,
        username: localDisplayName,
        name: localDisplayName,
        arena: selectedArenaChoice || 'Default',
        startingHealth,
      });
      onOnlineLockStarted(chosenBallId);
      return;
    }

    if (!p1Locked) {
      onLocalLockPlayer('p1', chosenBallId);
    } else if (!p2Locked && !playAgainstBot) {
      onLocalLockPlayer('p2', chosenBallId);
    }
  };

  const handleRandomPick = () => {
    if (isOnlineMode || isDraftLockedWaiting) return;
    const eligible = (filteredBalls.length > 0 ? filteredBalls : balls).filter(
      (b) => !isBallLockedFromPlay(b.id)
    );
    if (eligible.length === 0) return;
    const randomBall = eligible[Math.floor(Math.random() * eligible.length)];
    handleCardSelect(randomBall.id);
  };

  const turnHeadline = isOnlineMode
    ? isDraftLockedWaiting
      ? 'Fighter Locked · Waiting for Opponent'
      : 'Draft Your Fighter'
    : !p1Locked
    ? 'Player 1 · Choose Your Fighter'
    : !p2Locked && !playAgainstBot
    ? 'Player 2 · Choose Your Fighter'
    : 'Both Fighters Locked · Ready to Launch';

  const lockButtonLabel = isOnlineMode
    ? isDraftLockedWaiting
      ? 'Waiting for Opponent...'
      : `Lock In ${inspectedBall?.name || 'Fighter'}`
    : !p1Locked
    ? `Lock In P1 · ${inspectedBall?.name || 'Fighter'}`
    : !p2Locked && !playAgainstBot
    ? `Lock In P2 · ${inspectedBall?.name || 'Fighter'}`
    : 'Enter Arena';

  return (
    <section
      id="draft-screen"
      aria-label="Fighter Draft Screen"
      className="fighting-backdrop w-full min-h-[calc(100vh-56px)] flex flex-col items-center justify-center p-3 sm:p-5 z-30"
    >
      <div className="fighting-glass-panel relative w-full max-w-6xl rounded-2xl p-4 sm:p-6 flex flex-col gap-4 border border-white/10 overflow-hidden">
        {/* Waiting Overlay for Online Match once lock_draft has been sent */}
        {isDraftLockedWaiting && (
          <div className="absolute inset-0 z-40 bg-slate-950/88 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-emerald-400/25 border-t-emerald-400 animate-spin" />
            <div className="space-y-1.5 max-w-md">
              <h3 className="fighting-header text-2xl sm:text-3xl text-emerald-300 tracking-wide">
                Waiting for Opponent...
              </h3>
              <p className="text-sm text-slate-200">
                Locked Fighter:{' '}
                <span className="font-bold text-white">
                  {p1BallObj?.name || inspectedBall?.name || 'Fighter'}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                The arena canvas opens automatically as soon as both players send their lock-in.
              </p>
            </div>
          </div>
        )}

        {/* Top Bar: Back · Series Hearts Matchup · Library */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isDraftLockedWaiting}
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-white/15 hover:border-sky-400 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="text-xs text-slate-300 font-medium">
              {isOnlineMode ? (
                <span>
                  Online Match
                  {onlineRoomId ? ` · Room ${onlineRoomId}` : ''}
                  {onlineRole ? ` · ${onlineRole}` : ''}
                </span>
              ) : playAgainstBot ? (
                <span>Bot Duel · Draft Phase</span>
              ) : (
                <span>Local 2P · Draft Phase</span>
              )}
            </div>
          </div>

          {/* 3-Heart Series Scoreboard */}
          <div className="flex items-center gap-3 sm:gap-5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sky-400 truncate max-w-[90px]">
                {p1Name || 'Player 1'}
              </span>
              <div className="flex items-center gap-1 tabular-nums" aria-label={`Player 1 Hearts: ${p1Hearts} of 3`}>
                {[0, 1, 2].map((idx) => (
                  <Heart
                    key={idx}
                    className={`w-3.5 h-3.5 ${
                      idx < p1Hearts ? 'text-red-500 fill-red-500' : 'text-slate-600 fill-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            <span className="text-slate-500 font-semibold">vs</span>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 tabular-nums" aria-label={`Player 2 Hearts: ${p2Hearts} of 3`}>
                {[0, 1, 2].map((idx) => (
                  <Heart
                    key={idx}
                    className={`w-3.5 h-3.5 ${
                      idx < p2Hearts ? 'text-red-500 fill-red-500' : 'text-slate-600 fill-transparent'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-orange-400 truncate max-w-[90px]">
                {p2Name || (playAgainstBot ? 'Bot Alpha' : 'Player 2')}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isDraftLockedWaiting}
            onClick={onOpenLibrary}
            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-sky-500/40 hover:border-sky-400 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Fighter Library</span>
          </button>
        </header>

        {/* Title & Compact Match Settings Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div>
            <h2 className="fighting-header text-2xl sm:text-3xl text-white tracking-wide">
              {turnHeadline}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isOnlineMode
                ? 'Choose from your 3 random draft options below, or spend 25 Coins to refresh them.'
                : 'Select a fighter from the grid below, review their physics and ability, then lock in for the round.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3 py-2 rounded-xl bg-slate-950/75 border border-sky-500/35 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <input
                id="p1-name-input"
                type="text"
                maxLength={18}
                disabled={isDraftLockedWaiting}
                value={p1Name}
                onChange={(e) => onChangeP1Name(e.target.value)}
                placeholder={isOnlineMode ? 'Your Name' : 'Player 1'}
                className="w-28 sm:w-32 bg-transparent text-xs font-semibold text-white focus:outline-none placeholder:text-slate-500"
              />
            </div>

            {!isOnlineMode && (
              <div className="px-3 py-2 rounded-xl bg-slate-950/75 border border-orange-500/35 flex items-center gap-2">
                {playAgainstBot ? (
                  <Bot className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                ) : (
                  <User className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                )}
                <input
                  id="p2-name-input"
                  type="text"
                  maxLength={18}
                  value={p2Name}
                  onChange={(e) => onChangeP2Name(e.target.value)}
                  placeholder={playAgainstBot ? 'Bot Alpha' : 'Player 2'}
                  className="w-28 sm:w-32 bg-transparent text-xs font-semibold text-white focus:outline-none placeholder:text-slate-500"
                />
              </div>
            )}

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/75 border border-white/10 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <label htmlFor="arena-select" className="sr-only">
                Arena Stage
              </label>
              <select
                id="arena-select"
                disabled={isDraftLockedWaiting || !isArenaConfigEditable}
                value={selectedArenaChoice}
                onChange={(e) => onChangeArena(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer disabled:opacity-60"
              >
                <option value="Default" className="bg-slate-900 text-white">Default Arena</option>
                <option value="Road" className="bg-slate-900 text-white">Road Arena</option>
                <option value="Ice" className="bg-slate-900 text-white">Ice Arena</option>
              </select>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/75 border border-white/10 flex items-center gap-2.5">
              <label htmlFor="starting-health-slider" className="text-[11px] font-semibold text-slate-300 whitespace-nowrap">
                HP
              </label>
              <input
                id="starting-health-slider"
                type="range"
                min="50"
                max="200"
                step="10"
                disabled={isDraftLockedWaiting || !isArenaConfigEditable}
                value={startingHealth}
                onChange={(e) => onChangeStartingHealth(Number(e.target.value))}
                className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 disabled:opacity-60"
              />
              <span className="font-mono tabular-nums text-xs font-bold text-sky-300 w-12 text-right">
                {startingHealth}
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Workspace: Draftable Balls Grid (Left) + Fighter Inspector & Lock Action (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: Filter Controls & Draftable Balls Grid */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            {isOnlineMode ? (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-950/80 border border-sky-500/30 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-white uppercase tracking-wider">
                    Online 3-Option Draft
                  </span>
                  <span className="text-slate-300">
                    Balance:{' '}
                    <strong className="font-mono tabular-nums text-amber-300">
                      {coins.toLocaleString()} Coins
                    </strong>
                    {rerollErrorFlash && (
                      <span className="ml-2 font-bold text-rose-400">
                        Not enough coins (25 required)
                      </span>
                    )}
                  </span>
                </div>
                <button
                  id="reroll-draft-btn"
                  type="button"
                  disabled={isDraftLockedWaiting}
                  onClick={onRerollDraft}
                  className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 border ${
                    rerollErrorFlash
                      ? 'bg-rose-600 border-rose-300 text-white'
                      : coins < 25
                      ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-rose-400/60'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50 text-amber-300'
                  } disabled:opacity-50`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Refresh Options (25 Coins)</span>
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  {/* Interactive Pool Filter Buttons (Local & vs Bot only) */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        filterMode === 'all'
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      All Fighters ({balls.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('pool')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        filterMode === 'pool'
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      3-Pick Draft ({draftPoolIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('unlocked')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        filterMode === 'unlocked'
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Unlocked ({unlockedBalls.length})
                    </button>
                  </div>

                  {/* Search & Utility Controls */}
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                    <div className="relative flex-1 sm:w-52">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search fighters..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 focus:border-sky-400 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isDraftLockedWaiting || isLocalReadyToEnter}
                      onClick={handleRandomPick}
                      title="Pick a random fighter from the current view"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 hover:border-sky-400 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                    >
                      <Dices className="w-3.5 h-3.5 text-sky-400" />
                      <span>Random</span>
                    </button>
                  </div>
                </div>

                {/* Re-roll Bar when viewing the 3-Pick Pool */}
                {filterMode === 'pool' && (
                  <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-xs">
                    <span className="text-slate-300">
                      3-Pick Pool · Balance: <strong className="font-mono tabular-nums text-amber-300">{coins.toLocaleString()} Coins</strong>
                    </span>
                    <button
                      id="reroll-draft-btn"
                      type="button"
                      disabled={isDraftLockedWaiting}
                      onClick={onRerollDraft}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 border ${
                        rerollErrorFlash
                          ? 'bg-rose-600 border-rose-300 text-white'
                          : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50 text-amber-300'
                      } disabled:opacity-50`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Refresh Options (25 Coins)</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Draftable Balls Grid */}
            <div
              role="grid"
              aria-label="Draftable Balls Grid"
              className={`grid gap-2.5 ${
                isOnlineMode
                  ? 'grid-cols-1 sm:grid-cols-3 py-2'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-h-[410px] overflow-y-auto pr-1'
              }`}
            >
              {filteredBalls.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-400 border border-white/10 rounded-xl bg-slate-950/50">
                  No fighters match your current filter.
                </div>
              ) : (
                filteredBalls.map((ball) => {
                  const meta = visualMeta[ball.id];
                  const isInspected = inspectedBall?.id === ball.id;
                  const isP1Picked = p1Drafting === ball.id;
                  const isP2Picked = !isOnlineMode && p2Drafting === ball.id;
                  const isUnlocked = unlockedBalls.includes(ball.id);
                  const isSaitamaLocked = isBallLockedFromPlay(ball.id);

                  let cardBorderClass =
                    'border-white/10 bg-slate-950/65 hover:border-sky-400/60 hover:bg-slate-900/90';
                  if (isSaitamaLocked) {
                    cardBorderClass = isInspected
                      ? 'border-amber-400/80 bg-slate-900/95'
                      : 'border-amber-500/25 bg-slate-950/70 opacity-85 hover:border-amber-400/60';
                  } else if (isP1Picked && isP2Picked) {
                    cardBorderClass = 'border-purple-400 bg-purple-950/45 ring-1 ring-purple-400/60';
                  } else if (isP1Picked) {
                    cardBorderClass = 'border-sky-400 bg-sky-950/45 ring-1 ring-sky-400/60';
                  } else if (isP2Picked) {
                    cardBorderClass = 'border-orange-400 bg-orange-950/45 ring-1 ring-orange-400/60';
                  } else if (isInspected) {
                    cardBorderClass = 'border-sky-300/80 bg-slate-900/95';
                  }

                  return (
                    <button
                      key={ball.id}
                      type="button"
                      disabled={isDraftLockedWaiting}
                      onClick={() => handleCardSelect(ball.id)}
                      onDoubleClick={() => handleLockDraft(ball.id)}
                      className={`group relative rounded-xl ${
                        isOnlineMode ? 'p-5' : 'p-3'
                      } border text-left flex flex-col items-center gap-2 transition-all duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-sky-400 ${cardBorderClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {/* Clean unboxed selection marker */}
                      {(isP1Picked || isP2Picked) && !isSaitamaLocked && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold tracking-tight text-slate-200">
                          {isOnlineMode
                            ? p1Locked
                              ? 'Locked'
                              : 'Selected'
                            : isP1Picked && isP2Picked
                            ? 'P1 · P2'
                            : isP1Picked
                            ? p1Locked
                              ? 'P1 Locked'
                              : 'P1'
                            : p2Locked
                            ? 'P2 Locked'
                            : 'P2'}
                        </span>
                      )}

                      <div
                        className={`${
                          isOnlineMode ? 'w-16 h-16 text-3xl' : 'w-12 h-12 text-2xl'
                        } rounded-full flex items-center justify-center border border-white/25 shrink-0 transition-transform duration-150 group-hover:scale-105`}
                        style={{
                          backgroundColor: meta?.color || '#38bdf8',
                          boxShadow: `0 0 16px ${meta?.color || '#38bdf8'}44`,
                        }}
                      >
                        <span className="leading-none select-none">{meta?.emoji || '⚔️'}</span>
                      </div>

                      <div className="w-full text-center min-w-0">
                        <span className="block text-sm font-bold text-white truncate">
                          {ball.name}
                        </span>
                        <span className="block text-[11px] text-slate-400 truncate mt-0.5">
                          {ball.badge.split('•').pop()?.trim() || ball.badge}
                        </span>
                        {isSaitamaLocked ? (
                          <span className="block text-[10px] text-amber-300 font-bold mt-0.5 tabular-nums">
                            Locked · 9,999 Coins
                          </span>
                        ) : isUnlocked ? (
                          <span className="block text-[10px] text-emerald-400 font-medium mt-0.5">
                            Unlocked
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Highlighted Fighter Details + Lock-In Control */}
          <aside className="lg:col-span-4 rounded-xl bg-slate-950/75 border border-white/10 p-5 flex flex-col justify-between gap-4">
            {inspectedBall && inspectedMeta ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 border-white/30 shrink-0"
                    style={{
                      backgroundColor: inspectedMeta.color,
                      boxShadow: `0 0 24px ${inspectedMeta.color}55`,
                    }}
                  >
                    <span className="leading-none select-none">{inspectedMeta.emoji}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="fighting-header text-2xl text-white truncate">
                      {inspectedBall.name}
                    </h3>
                    <p className="text-xs text-sky-300 font-medium truncate">
                      {inspectedBall.badge}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {unlockedBalls.includes(inspectedBall.id) ? 'Unlocked in Collection' : 'Available in Draft'}
                    </p>
                  </div>
                </div>

                {/* Unboxed Stats Row */}
                <div className="grid grid-cols-2 gap-3 py-2.5 border-y border-white/10 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Speed</span>
                    <span className="font-mono tabular-nums font-bold text-sky-300">
                      {inspectedMeta.speed}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mass</span>
                    <span className="font-mono tabular-nums font-bold text-amber-300">
                      {inspectedMeta.mass}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {inspectedBall.description}
                </p>
              </div>
            ) : null}

            {/* Current Round Lock-In Summary & Primary Action */}
            <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">
                    {isOnlineMode ? `Your Pick (${onlineRole || 'Player 1'})` : 'Player 1'}
                  </span>
                  <span className="font-bold text-sky-300 truncate">
                    {p1BallObj ? `${p1BallObj.name}${p1Locked ? ' · Locked' : ''}` : 'Selecting...'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">
                    {isOnlineMode ? 'Opponent' : playAgainstBot ? 'Bot Opponent' : 'Player 2'}
                  </span>
                  <span className="font-bold text-orange-300 truncate">
                    {isOnlineMode
                      ? opponentDraftLocked
                        ? 'Locked In'
                        : 'Drafting...'
                      : p2BallObj
                      ? `${p2BallObj.name}${p2Locked ? ' · Locked' : ''}`
                      : playAgainstBot
                      ? 'Auto-draft on P1 Lock'
                      : 'Waiting for P1'}
                  </span>
                </div>
              </div>

              {isLocalReadyToEnter ? (
                <div className="flex flex-col gap-2">
                  <button
                    id="confirm-btn"
                    type="button"
                    onClick={onEnterArena}
                    className="w-full py-3.5 px-5 rounded-xl font-black text-sm uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Enter Arena</span>
                  </button>
                  <button
                    type="button"
                    onClick={onResetLocalDraft}
                    className="w-full py-2 px-4 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Change Picks</span>
                  </button>
                </div>
              ) : inspectedRequiresUnlock ? (
                <button
                  type="button"
                  onClick={onOpenLibrary}
                  className="w-full py-3.5 px-5 rounded-xl font-black text-sm uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Lock className="w-4 h-4" />
                  <span>Unlock in Library (9,999 Coins)</span>
                </button>
              ) : (
                <button
                  id="confirm-btn"
                  type="button"
                  disabled={isDraftLockedWaiting || !inspectedBall}
                  onClick={() => handleLockDraft()}
                  className="w-full py-3.5 px-5 rounded-xl font-black text-sm uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDraftLockedWaiting ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{lockButtonLabel}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{lockButtonLabel}</span>
                    </>
                  )}
                </button>
              )}

              <p className="text-[11px] text-slate-400 text-center">
                {isOnlineMode
                  ? 'Tip: Double-click any ball card to lock in immediately.'
                  : 'Tip: Double-click any card to lock that player’s selection.'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default DraftScreen;
