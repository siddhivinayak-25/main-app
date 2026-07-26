/**
 * SessionReplay — Recruiter view of a candidate's full test session.
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────┐
 * │  HEADER: candidate, test, score, duration, back btn     │
 * ├──────────────┬──────────────────────────┬───────────────┤
 * │  TIMELINE    │  CODE VIEWER (read-only) │  DETAIL PANEL │
 * │  (events)    │  Monaco / text           │  (event info) │
 * │  240px       │  flex-1                  │  300px        │
 * └──────────────┴──────────────────────────┴───────────────┘
 * │  SCRUBBER (timestamp slider + play/pause)               │
 * └─────────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward,
  AlertTriangle, Shield, Terminal, Code, Brain,
  CheckCircle, XCircle, Clock, ChevronRight,
  Loader2, AlertCircle, FileCode, Zap, Eye,
} from 'lucide-react';
import { getSessionReplay } from '../api/sessionsService.js';

// ── Event type metadata ────────────────────────────────────────────────────
const EVENT_META = {
  // Telemetry
  SESSION_STARTED:    { icon: Play,          color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Session Started' },
  SESSION_SUBMITTED:  { icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Submitted' },
  FILE_SAVED:         { icon: FileCode,      color: 'text-blue-400',    bg: 'bg-blue-500/10',    label: 'File Saved' },
  CODE_RUN:           { icon: Terminal,      color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    label: 'Code Run' },
  TEST_RUN:           { icon: Zap,           color: 'text-violet-400',  bg: 'bg-violet-500/10',  label: 'Tests Run' },
  AI_PROMPT:          { icon: Brain,         color: 'text-purple-400',  bg: 'bg-purple-500/10',  label: 'AI Prompt' },
  AI_ACCEPT:          { icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'AI Accepted' },
  AI_REJECT:          { icon: XCircle,       color: 'text-red-400',     bg: 'bg-red-500/10',     label: 'AI Rejected' },
  LANGUAGE_CHANGED:   { icon: Code,          color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Language Changed' },
  SNAPSHOT:           { icon: Eye,           color: 'text-slate-400',   bg: 'bg-slate-500/10',   label: 'Auto-save' },
  // Security
  TAB_SWITCH:         { icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Tab Switch' },
  WINDOW_BLUR:        { icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Focus Lost' },
  COPY_PASTE:         { icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Copy / Paste' },
  RIGHT_CLICK_BLOCKED:{ icon: Shield,        color: 'text-slate-400',   bg: 'bg-slate-500/10',   label: 'Right-click' },
  DEVTOOLS_OPEN:      { icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-500/10',     label: 'DevTools Opened' },
  FOCUS_LOST:         { icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Focus Lost' },
  SESSION_STARTED_SEC:{ icon: Shield,        color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Security Active' },
};

function getMeta(eventType) {
  return EVENT_META[eventType] || { icon: ChevronRight, color: 'text-slate-400', bg: 'bg-slate-500/10', label: eventType };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtMs(ms) {
  if (!ms || ms < 0) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtRelative(ts, startTs) {
  if (!startTs) return fmtTime(ts);
  const diff = ts - startTs;
  return `+${fmtMs(diff)}`;
}

function getCodeAtTime(timeline, snapshots, finalFiles, currentTs) {
  // Prefer a snapshot closest to or before currentTs
  const matching = snapshots.filter(s => s.snapshotAt <= currentTs);
  if (matching.length) return matching[matching.length - 1].files;

  // Fall back to code found in FILE_SAVED / AI_ACCEPT events
  const codeEvents = timeline.filter(
    e => ['FILE_SAVED', 'AI_ACCEPT', 'SESSION_SUBMITTED'].includes(e.eventType)
      && e.timestamp <= currentTs
      && e.payload?.content
  );
  if (codeEvents.length) {
    const ev = codeEvents[codeEvents.length - 1];
    return { [ev.payload.filename || 'main.py']: { content: ev.payload.content } };
  }

  // If past end, show final files
  if (finalFiles && Object.keys(finalFiles).length) return finalFiles;
  return {};
}

function getScoreColor(score) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

// ── Event row ──────────────────────────────────────────────────────────────
function EventRow({ event, isActive, onClick, startTs }) {
  const { icon: Icon, color, bg, label } = getMeta(event.eventType);
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all group
        ${isActive ? 'bg-brand-violet/20 ring-1 ring-brand-violet/40' : 'hover:bg-white/5'}`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>
        <Icon size={11} className={color} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-white/80'}`}>{label}</p>
        <p className="text-[10px] text-white/40 mt-0.5">{fmtRelative(event.timestamp, startTs)}</p>
      </div>
      {event.severity === 'critical' && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium shrink-0 mt-1">CRIT</span>
      )}
      {event.severity === 'warning' && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium shrink-0 mt-1">WARN</span>
      )}
    </button>
  );
}

// ── Code viewer ────────────────────────────────────────────────────────────
function CodeViewer({ files, language }) {
  const [activeFile, setActiveFile] = useState(null);
  const fileNames = Object.keys(files || {});

  useEffect(() => {
    if (fileNames.length && (!activeFile || !files[activeFile])) {
      setActiveFile(fileNames[0]);
    }
  }, [files]);

  const code = (activeFile && files[activeFile]?.content) || '';

  return (
    <div className="flex flex-col h-full bg-[#0d0d1a] overflow-hidden">
      {/* File tabs */}
      {fileNames.length > 0 && (
        <div className="flex gap-1 px-3 pt-2 pb-1 bg-[#0d0d1a] border-b border-white/5 overflow-x-auto shrink-0">
          {fileNames.map(name => (
            <button
              key={name}
              onClick={() => setActiveFile(name)}
              className={`px-3 py-1.5 text-xs rounded-t whitespace-nowrap transition-colors ${
                activeFile === name
                  ? 'bg-[#1a1a2e] text-white border-b-2 border-brand-violet'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {/* Code area */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs text-white/80 leading-relaxed">
        {code ? (
          <pre className="whitespace-pre-wrap break-words">{code}</pre>
        ) : (
          <div className="flex items-center justify-center h-full text-white/20">
            <div className="text-center space-y-2">
              <FileCode size={28} />
              <p>No code at this point in the session</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Detail panel ───────────────────────────────────────────────────────────
function DetailPanel({ event, evaluationResult, securityEvents, startTs }) {
  const SCORE_LABELS = {
    promptQuality: 'Prompt Quality',
    errorRecovery: 'Error Recovery',
    codeQuality: 'Code Quality',
    executionEfficiency: 'Execution Efficiency',
    outputCorrectness: 'Output Correctness',
  };

  if (!event) {
    return (
      <div className="h-full flex flex-col">
        {evaluationResult && Object.keys(evaluationResult).length > 0 && (
          <div className="p-4 border-b border-white/5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">AI Evaluation</p>
            <div className="space-y-3">
              {Object.entries(SCORE_LABELS).map(([key, label]) => {
                const val = evaluationResult[key];
                if (val == null) return null;
                const isBoolean = typeof val === 'boolean';
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/60">{label}</span>
                      {isBoolean ? (
                        <span className={`text-xs font-medium ${val ? 'text-emerald-400' : 'text-red-400'}`}>
                          {val ? 'Pass' : 'Fail'}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-white">{val}/10</span>
                      )}
                    </div>
                    {!isBoolean && (
                      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-brand-violet rounded-full" style={{ width: `${val * 10}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {securityEvents?.length > 0 && (
          <div className="p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Security Summary</p>
            <div className="space-y-2">
              {securityEvents.slice(0, 8).map(e => {
                const { icon: Icon, color, label } = getMeta(e.eventType);
                return (
                  <div key={e.id} className="flex items-center gap-2">
                    <Icon size={11} className={color} />
                    <span className="text-xs text-white/60">{label}</span>
                    <span className="ml-auto text-[10px] text-white/30">{fmtRelative(new Date(e.ts).getTime(), startTs)}</span>
                  </div>
                );
              })}
              {securityEvents.length > 8 && (
                <p className="text-[10px] text-white/30">+{securityEvents.length - 8} more events</p>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center text-white/20 text-xs p-6 text-center">
          Select an event on the timeline to see details
        </div>
      </div>
    );
  }

  const { icon: Icon, color, bg, label } = getMeta(event.eventType);

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Event header */}
      <div className={`flex items-center gap-3 p-3 rounded-xl ${bg}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bg}`}>
          <Icon size={16} className={color} />
        </div>
        <div>
          <p className={`text-sm font-semibold ${color}`}>{label}</p>
          <p className="text-xs text-white/40">{fmtTime(event.timestamp)}</p>
        </div>
        {event.severity && (
          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded font-medium uppercase
            ${event.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
              event.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-500/20 text-slate-400'}`}>
            {event.severity}
          </span>
        )}
      </div>

      {/* Payload details */}
      {event.payload && Object.keys(event.payload).length > 0 && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Event Data</p>
          <div className="space-y-2">
            {Object.entries(event.payload).map(([k, v]) => (
              <div key={k} className="bg-white/5 rounded-lg p-2">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{k}</p>
                <p className="text-xs text-white/70 break-words font-mono">
                  {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function SessionReplay() {
  const { candidateId } = useParams();
  const navigate = useNavigate();

  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  // Playback state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying]       = useState(false);
  const [speed, setSpeed]           = useState(1);
  const playRef = useRef(null);

  useEffect(() => {
    getSessionReplay(candidateId)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [candidateId]);

  // Playback engine — advances currentIdx at speed-adjusted intervals
  const advance = useCallback(() => {
    if (!data?.timeline?.length) return;
    setCurrentIdx(i => {
      if (i >= data.timeline.length - 1) { setPlaying(false); return i; }
      return i + 1;
    });
  }, [data]);

  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(advance, 800 / speed);
    } else {
      clearInterval(playRef.current);
    }
    return () => clearInterval(playRef.current);
  }, [playing, speed, advance]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/40">
        <Loader2 size={20} className="animate-spin" />
        Loading session replay…
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
      <div className="text-center space-y-3">
        <AlertCircle size={32} className="text-red-400 mx-auto" />
        <p className="text-white/60 text-sm">{error}</p>
        <button onClick={() => navigate(-1)} className="text-brand-violet text-sm hover:underline">Go back</button>
      </div>
    </div>
  );

  const { candidate, session, timeline, snapshots, securityEvents, evaluationResult, finalFiles } = data;
  const startTs = session?.startedAt ? new Date(session.startedAt).getTime() : timeline[0]?.timestamp;
  const currentEvent = timeline[currentIdx] || null;
  const currentFiles = getCodeAtTime(timeline, snapshots, finalFiles, currentEvent?.timestamp || Date.now());
  const totalEvents  = timeline.length;

  const criticalCount = securityEvents?.filter(e => e.severity === 'critical').length || 0;
  const warningCount  = securityEvents?.filter(e => e.severity === 'warning').length || 0;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a14] text-white overflow-hidden">

      {/* ── Header ── */}
      <header className="shrink-0 h-14 flex items-center gap-4 px-5 border-b border-white/5 bg-[#0d0d1a]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="h-5 w-px bg-white/10" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-white truncate">{candidate?.name}</p>
            <span className="text-white/20">·</span>
            <p className="text-sm text-white/40 truncate">{candidate?.testName}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Clock size={12} />
            {fmtMs(session?.durationMs)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Zap size={12} />
            {totalEvents} events
          </div>
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertTriangle size={12} />
              {criticalCount} critical
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle size={12} />
              {warningCount} warnings
            </div>
          )}
          {candidate?.score != null && (
            <div className={`text-lg font-bold font-display ${getScoreColor(candidate.score)}`}>
              {candidate.score}
              <span className="text-xs font-normal text-white/30">/100</span>
            </div>
          )}
        </div>
      </header>

      {/* ── 3-panel body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Event timeline */}
        <div className="w-60 shrink-0 flex flex-col border-r border-white/5 bg-[#0d0d1a]">
          <div className="px-3 py-2 border-b border-white/5 shrink-0">
            <p className="text-[10px] text-white/30 uppercase tracking-wider">
              {totalEvents} events
              {totalEvents === 0 && ' — session has no telemetry yet'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-1 space-y-0.5 px-1">
            {totalEvents === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20 text-xs text-center px-4 space-y-2">
                <Terminal size={24} />
                <p>No events recorded for this session yet.</p>
              </div>
            ) : (
              timeline.map((event, i) => (
                <EventRow
                  key={event.id}
                  event={event}
                  isActive={i === currentIdx}
                  startTs={startTs}
                  onClick={() => { setPlaying(false); setCurrentIdx(i); }}
                />
              ))
            )}
          </div>
        </div>

        {/* CENTER: Code viewer */}
        <div className="flex-1 overflow-hidden">
          <CodeViewer
            files={currentFiles}
            language={candidate?.language || 'python'}
          />
        </div>

        {/* RIGHT: Detail panel */}
        <div className="w-72 shrink-0 flex flex-col border-l border-white/5 bg-[#0d0d1a] overflow-y-auto">
          <div className="px-4 py-2 border-b border-white/5 shrink-0">
            <p className="text-[10px] text-white/30 uppercase tracking-wider">
              {currentEvent ? 'Event Details' : 'Session Overview'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DetailPanel
              event={currentEvent}
              evaluationResult={evaluationResult}
              securityEvents={securityEvents}
              startTs={startTs}
            />
          </div>
        </div>
      </div>

      {/* ── Scrubber / Playback controls ── */}
      <div className="shrink-0 border-t border-white/5 bg-[#0d0d1a] px-5 py-3">
        <div className="flex items-center gap-4">
          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCurrentIdx(0)}
              className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              title="Go to start"
            >
              <SkipBack size={15} />
            </button>
            <button
              onClick={() => setPlaying(p => !p)}
              disabled={totalEvents === 0}
              className="w-8 h-8 rounded-full bg-brand-violet hover:bg-brand-violet-dark flex items-center justify-center transition-colors disabled:opacity-30"
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause size={14} /> : <Play size={14} className="translate-x-px" />}
            </button>
            <button
              onClick={() => setCurrentIdx(Math.max(totalEvents - 1, 0))}
              className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              title="Go to end"
            >
              <SkipForward size={15} />
            </button>
          </div>

          {/* Slider */}
          <div className="flex-1 flex items-center gap-3">
            <span className="text-[10px] text-white/30 shrink-0 w-6 text-right">{currentIdx + 1}</span>
            <input
              type="range"
              min={0}
              max={Math.max(totalEvents - 1, 0)}
              value={currentIdx}
              onChange={e => { setPlaying(false); setCurrentIdx(Number(e.target.value)); }}
              className="flex-1 h-1 rounded-full bg-white/10 accent-brand-violet cursor-pointer"
            />
            <span className="text-[10px] text-white/30 shrink-0 w-6">{totalEvents}</span>
          </div>

          {/* Current timestamp */}
          <span className="text-[10px] text-white/30 shrink-0 font-mono">
            {currentEvent ? fmtRelative(currentEvent.timestamp, startTs) : '—'}
          </span>

          {/* Speed */}
          <div className="flex items-center gap-1 shrink-0">
            {[0.5, 1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  speed === s ? 'bg-brand-violet text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
