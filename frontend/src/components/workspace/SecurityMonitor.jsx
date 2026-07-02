/**
 * SecurityMonitor — Multi-layer integrity & biometric monitoring
 *
 * Layer 1: Camera feed (WebRTC getUserMedia)
 * Layer 2: Face detection (browser FaceDetector API + canvas fallback)
 * Layer 3: Tab / window focus monitoring (visibilitychange, blur)
 * Layer 4: Clipboard monitoring (paste events)
 * Layer 5: Keystroke biometrics (inter-key timing for rhythm analysis)
 * Layer 6: DevTools detection (window size heuristic)
 *
 * All events → WebSocket security channel → security_events table
 * Security score = 100 - cumulative penalty (bounded, see rubric.js)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Eye, EyeOff, AlertTriangle, ShieldCheck } from 'lucide-react';

const WS_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'ws://127.0.0.1:3001'
  : `wss://${window.location.hostname}`;

// Penalty weights per event type (mirrors rubric.js securityPenalties)
const PENALTIES = {
  TAB_SWITCH:        2,
  FACE_NOT_DETECTED: 3,
  MULTIPLE_FACES:    5,
  COPY_PASTE:        2,
  WINDOW_BLUR:       1,
  CAMERA_DISABLED:   10,
  BIOMETRIC_ANOMALY: 3,
  FOCUS_LOST:        1,
  DEVTOOLS_OPEN:     5,
};

export default function SecurityMonitor({ sessionId, candidateId, onScoreChange, minimized = false }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const wsRef       = useRef(null);
  const streamRef   = useRef(null);
  const detectorRef = useRef(null);
  const keystrokeTs = useRef([]);   // last N keystroke timestamps for biometric analysis
  const pendingEvents = useRef([]); // buffer if WS not yet connected

  const [cameraOn,  setCameraOn]  = useState(false);
  const [cameraErr, setCameraErr] = useState(null);
  const [score,     setScore]     = useState(100);
  const [incidents, setIncidents] = useState([]);
  const [faceOk,    setFaceOk]    = useState(true);
  const [expanded,  setExpanded]  = useState(false);

  // ── Emit security event ──────────────────────────────────────────────────
  const emit = useCallback((eventType, payload = {}) => {
    const event = { type: 'SECURITY_EVENT', payload: { eventType, candidateId, sessionId, ...payload, ts: Date.now() } };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    } else {
      pendingEvents.current.push(event);
    }

    // Update local score
    const penalty = PENALTIES[eventType] || 0;
    setScore(s => Math.max(0, s - penalty));
    setIncidents(arr => [...arr.slice(-19), { eventType, ts: Date.now() }]);
    onScoreChange?.(Math.max(0, score - penalty));
  }, [sessionId, candidateId, score, onScoreChange]);

  // ── WebSocket connection ──────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    function connect() {
      const ws = new WebSocket(
        `${WS_BASE}/ws?channel=security&sessionId=${sessionId}&candidateId=${candidateId}&token=`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        // Flush pending events
        const pending = pendingEvents.current.splice(0);
        pending.forEach(e => ws.send(JSON.stringify(e)));
        ws.send(JSON.stringify({ type: 'SECURITY_EVENT', payload: { eventType: 'SESSION_STARTED', sessionId, candidateId } }));
      };
      ws.onclose = () => setTimeout(connect, 5000);
      ws.onerror = () => {};
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'SECURITY_ALERT') {
            // Could show toast — handled by parent
          }
        } catch {}
      };
    }
    connect();
    return () => wsRef.current?.close();
  }, [sessionId, candidateId]);

  // ── Layer 1 + 2: Camera + Face Detection ─────────────────────────────────
  useEffect(() => {
    let faceCheckInterval;
    let stopped = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraOn(true);

        // Try native FaceDetector API (Chrome/Edge 2024+)
        if ('FaceDetector' in window) {
          detectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
        }

        // Face check every 3 seconds
        faceCheckInterval = setInterval(async () => {
          if (stopped || !videoRef.current || !canvasRef.current) return;
          try {
            if (detectorRef.current) {
              const faces = await detectorRef.current.detect(videoRef.current);
              if (faces.length === 0) {
                setFaceOk(false);
                emit('FACE_NOT_DETECTED', { faceCount: 0 });
              } else if (faces.length > 1) {
                emit('MULTIPLE_FACES', { faceCount: faces.length });
              } else {
                setFaceOk(true);
              }
            } else {
              // Canvas fallback: sample brightness variance as liveness proxy
              const ctx = canvasRef.current.getContext('2d');
              ctx.drawImage(videoRef.current, 0, 0, 80, 60);
              const d = ctx.getImageData(0, 0, 80, 60).data;
              let brightness = 0;
              for (let i = 0; i < d.length; i += 4) brightness += (d[i] + d[i+1] + d[i+2]) / 3;
              brightness /= (d.length / 4);
              // If image is very dark or very flat → no face visible
              setFaceOk(brightness > 15 && brightness < 240);
            }
          } catch { /* detector errors are non-fatal */ }
        }, 3000);

      } catch (err) {
        setCameraErr(err.message);
        emit('CAMERA_DISABLED', { error: err.message });
      }
    }

    startCamera();

    return () => {
      stopped = true;
      clearInterval(faceCheckInterval);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [emit]);

  // ── Layer 3: Tab / Window focus ───────────────────────────────────────────
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') emit('TAB_SWITCH');
    };
    const onBlur = () => emit('WINDOW_BLUR');
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [emit]);

  // ── Layer 4: Clipboard ────────────────────────────────────────────────────
  useEffect(() => {
    const onPaste = (e) => {
      const text = e.clipboardData?.getData('text') || '';
      if (text.length > 50) emit('COPY_PASTE', { chars: text.length });
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [emit]);

  // ── Layer 5: Keystroke biometrics ─────────────────────────────────────────
  useEffect(() => {
    let lastKey = 0;
    const intervals = [];

    const onKey = (e) => {
      const now = Date.now();
      if (lastKey) intervals.push(now - lastKey);
      lastKey = now;

      // Analyse last 20 intervals for rhythm anomaly
      if (intervals.length >= 20) {
        const recent = intervals.slice(-20);
        const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
        const variance = recent.reduce((s, v) => s + (v - mean) ** 2, 0) / recent.length;
        const stdDev = Math.sqrt(variance);

        // Very low variance = bot-like typing; very high = unusual pattern
        if (stdDev < 5 && mean < 50) {
          emit('BIOMETRIC_ANOMALY', { reason: 'unusually_uniform_typing', stdDev, mean });
        }
      }
    };

    document.addEventListener('keydown', onKey, { passive: true });
    return () => document.removeEventListener('keydown', onKey);
  }, [emit]);

  // ── Layer 6: DevTools detection ──────────────────────────────────────────
  useEffect(() => {
    let devToolsOpen = false;
    const check = () => {
      const threshold = 160;
      const open = window.outerWidth - window.innerWidth > threshold
                || window.outerHeight - window.innerHeight > threshold;
      if (open && !devToolsOpen) {
        devToolsOpen = true;
        emit('DEVTOOLS_OPEN');
      } else if (!open) {
        devToolsOpen = false;
      }
    };
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [emit]);

  // ── Update parent score ───────────────────────────────────────────────────
  useEffect(() => { onScoreChange?.(score); }, [score, onScoreChange]);

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 ${minimized ? 'pointer-events-none' : ''}`}>
      {/* Expandable incident log */}
      {expanded && incidents.length > 0 && (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl p-3 w-56 max-h-48 overflow-y-auto">
          <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-2">Security Events</p>
          {incidents.slice().reverse().map((inc, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                ['MULTIPLE_FACES','CAMERA_DISABLED','DEVTOOLS_OPEN'].includes(inc.eventType)
                  ? 'bg-red-400' : 'bg-yellow-400'
              }`} />
              <span className="text-white/50 text-[10px] truncate">{inc.eventType.replace(/_/g,' ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Camera feed + score badge */}
      <div
        className="relative cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
        title="Click to view security log"
      >
        {/* Camera preview */}
        <div className={`w-24 h-18 rounded-xl overflow-hidden border-2 shadow-2xl transition-colors ${
          !faceOk ? 'border-red-500' : score >= 90 ? 'border-emerald-500/50' : score >= 60 ? 'border-yellow-500/50' : 'border-red-500/50'
        }`} style={{ height: 72 }}>
          {cameraOn ? (
            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
          ) : (
            <div className="w-full h-full bg-[#1a1a2e] flex flex-col items-center justify-center gap-1">
              <CameraOff size={16} className="text-red-400" />
              {cameraErr && <p className="text-red-400 text-[8px] text-center px-1 leading-tight">{cameraErr.slice(0,30)}</p>}
            </div>
          )}
          {/* Hidden canvas for fallback face detection */}
          <canvas ref={canvasRef} width={80} height={60} className="hidden" />
        </div>

        {/* Score pill */}
        <div className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-lg ${
          score >= 90 ? 'bg-emerald-500 text-white'
          : score >= 60 ? 'bg-yellow-500 text-black'
          : 'bg-red-500 text-white'
        }`}>
          {score}%
        </div>

        {/* Face warning */}
        {!faceOk && (
          <div className="absolute -top-2 -left-2 bg-red-500 rounded-full p-0.5">
            <AlertTriangle size={10} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
