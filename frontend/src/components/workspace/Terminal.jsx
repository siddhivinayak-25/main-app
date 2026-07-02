import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { TerminalIcon, Wifi, WifiOff } from 'lucide-react';

const WS_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'ws://127.0.0.1:3001'
  : `wss://${window.location.hostname}`;

const Terminal = forwardRef(function Terminal({ sessionId, token, candidateId, language, onTestResults }, ref) {
  const containerRef = useRef(null);
  const termRef      = useRef(null);
  const fitRef       = useRef(null);
  const wsRef        = useRef(null);
  const inputRef     = useRef('');
  const [connected, setConnected]   = useState(false);
  const [connecting, setConnecting] = useState(true);

  // Expose syncFile to parent
  useImperativeHandle(ref, () => ({
    syncFile(filename, content) {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'FILE_UPDATE', payload: { filename, content } }));
      }
    },
    runCommand(cmd) {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'COMMAND', payload: { command: cmd } }));
      }
    },
  }));

  useEffect(() => {
    if (!containerRef.current || !sessionId) return;

    // Init xterm
    const term = new XTerm({
      theme: {
        background:  '#0a0a18',
        foreground:  '#e2e2f0',
        cursor:      '#bd93f9',
        black:       '#1a1a2e', brightBlack:   '#3a3a5c',
        red:         '#ff5555', brightRed:     '#ff6e6e',
        green:       '#50fa7b', brightGreen:   '#69ff94',
        yellow:      '#f1fa8c', brightYellow:  '#ffffa5',
        blue:        '#6272a4', brightBlue:    '#92b2ff',
        magenta:     '#bd93f9', brightMagenta: '#d6acff',
        cyan:        '#8be9fd', brightCyan:    '#a4ffff',
        white:       '#c8c8d4', brightWhite:   '#ffffff',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
      fontSize:   13,
      cursorBlink: true,
      scrollback:  2000,
      allowTransparency: true,
    });

    const fit  = new FitAddon();
    const links = new WebLinksAddon();
    term.loadAddon(fit);
    term.loadAddon(links);
    term.open(containerRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current  = fit;

    // Resize observer
    const ro = new ResizeObserver(() => fit.fit());
    ro.observe(containerRef.current);

    // WebSocket connection
    function connect() {
      const ws = new WebSocket(
        `${WS_BASE}/ws?channel=terminal&sessionId=${sessionId}&token=${token}&candidateId=${candidateId}`
      );
      wsRef.current = ws;

      ws.onopen = () => { setConnected(true); setConnecting(false); };
      ws.onclose = () => {
        setConnected(false);
        term.writeln('\r\n\x1b[33m[disconnected — reconnecting in 3s…]\x1b[0m');
        setTimeout(connect, 3000);
      };
      ws.onerror = () => {};
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          switch (msg.type) {
            case 'OUTPUT':
              term.write(msg.payload.text || '');
              break;
            case 'CLEAR':
              term.clear();
              break;
            case 'PROMPT':
              term.write('\r\n\x1b[36m$\x1b[0m ');
              inputRef.current = '';
              break;
            case 'TEST_RESULTS':
              onTestResults?.(msg.payload);
              break;
            case 'EXECUTION_DONE':
              // no-op, output already written
              break;
            case 'PONG':
              break;
          }
        } catch {}
      };
    }

    connect();

    // Handle keyboard input
    term.onKey(({ key, domEvent }) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      if (domEvent.key === 'Enter') {
        const cmd = inputRef.current;
        term.write('\r\n');
        ws.send(JSON.stringify({ type: 'COMMAND', payload: { command: cmd } }));
        inputRef.current = '';
      } else if (domEvent.key === 'Backspace') {
        if (inputRef.current.length > 0) {
          inputRef.current = inputRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (!domEvent.ctrlKey && !domEvent.metaKey && !domEvent.altKey) {
        inputRef.current += key;
        term.write(key);
      } else if (domEvent.ctrlKey && domEvent.key === 'c') {
        inputRef.current = '';
        term.write('^C\r\n\x1b[36m$\x1b[0m ');
      } else if (domEvent.ctrlKey && domEvent.key === 'l') {
        term.clear();
      }
    });

    // Ping keepalive
    const ping = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 25000);

    return () => {
      clearInterval(ping);
      ro.disconnect();
      wsRef.current?.close();
      term.dispose();
    };
  }, [sessionId, token]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a18]">
      {/* Terminal toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-[#0d0d1e] shrink-0">
        <div className="flex items-center gap-2 text-white/40 text-xs">
          <TerminalIcon size={11} />
          <span className="font-mono">terminal</span>
          <span className="text-white/20">·</span>
          <span className="text-white/25">{language}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] ${connected ? 'text-emerald-400' : 'text-yellow-400'}`}>
          {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
          {connected ? 'connected' : connecting ? 'connecting…' : 'disconnected'}
        </div>
      </div>

      {/* xterm container */}
      <div ref={containerRef} className="flex-1 p-1 overflow-hidden" />
    </div>
  );
});

export default Terminal;
