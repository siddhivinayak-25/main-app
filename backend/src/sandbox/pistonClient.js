/**
 * Piston API Client — Real Isolated Code Execution
 *
 * Piston is an open-source, multi-language code execution engine.
 * We use the public instance at https://emkc.org/api/v2/piston
 * No API key required. Supports 200+ languages.
 *
 * Language → Piston runtime mapping:
 *   python     → python (3.10)
 *   javascript → node (18)
 *   typescript → typescript (5)
 *   java       → java (15)
 *   go         → go (1.16)
 *   cpp        → c++ (10.2)
 *   rust       → rust (1.50)
 */

const PISTON_URL = 'https://emkc.org/api/v2/piston';

// Runtime versions — resolved at startup by querying Piston's /runtimes
let runtimeCache = null;

async function getRuntimes() {
  if (runtimeCache) return runtimeCache;
  try {
    const res = await fetch(`${PISTON_URL}/runtimes`);
    if (!res.ok) throw new Error(`Piston /runtimes: ${res.status}`);
    runtimeCache = await res.json();
    return runtimeCache;
  } catch (err) {
    console.warn('[Piston] Could not fetch runtimes:', err.message);
    return [];
  }
}

// Language aliases → Piston language name
const LANG_MAP = {
  python:     'python',
  python3:    'python',
  py:         'python',
  javascript: 'javascript',
  js:         'javascript',
  node:       'javascript',
  typescript: 'typescript',
  ts:         'typescript',
  java:       'java',
  go:         'go',
  golang:     'go',
  cpp:        'c++',
  'c++':      'c++',
  c:          'c',
  rust:       'rust',
  ruby:       'ruby',
  rb:         'ruby',
  php:        'php',
  bash:       'bash',
  sh:         'bash',
};

function resolveLang(raw = 'python') {
  return LANG_MAP[raw.toLowerCase()] || 'python';
}

/**
 * Execute code via Piston API.
 *
 * @param {object} opts
 * @param {string}  opts.language  - language name or alias
 * @param {string}  opts.code      - main file content
 * @param {string}  [opts.stdin]   - stdin to pass to the program
 * @param {Array}   [opts.files]   - additional { name, content } files
 * @param {number}  [opts.timeout] - ms, default 10 000
 * @returns {Promise<{ stdout, stderr, exitCode, time, memoryUsed, error }>}
 */
export async function executeCode({ language, code, stdin = '', files = [], timeout = 10000 }) {
  const lang = resolveLang(language);

  // File extension map
  const extMap = {
    python: 'py', javascript: 'js', typescript: 'ts',
    java: 'java', go: 'go', 'c++': 'cpp', c: 'c',
    rust: 'rs', ruby: 'rb', php: 'php', bash: 'sh',
  };
  const ext = extMap[lang] || 'txt';
  const mainFilename = `main.${ext}`;

  const body = {
    language: lang,
    version:  '*',   // latest available
    files: [
      { name: mainFilename, content: code },
      ...files.map(f => ({ name: f.name, content: f.content })),
    ],
    stdin,
    args:            [],
    compile_timeout: Math.min(timeout, 15000),
    run_timeout:     Math.min(timeout, 10000),
    compile_memory_limit: -1,
    run_memory_limit:     -1,
  };

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout + 5000);

    const res = await fetch(`${PISTON_URL}/execute`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      return {
        stdout: '', stderr: `Piston API error (${res.status}): ${errText}`,
        exitCode: -1, time: Date.now() - start, error: true,
      };
    }

    const data = await res.json();
    const run = data.run || {};
    const compile = data.compile || {};

    // Compile errors (for compiled languages)
    if (compile.stderr && compile.code !== 0) {
      return {
        stdout:      compile.stdout || '',
        stderr:      compile.stderr || '',
        exitCode:    compile.code ?? 1,
        time:        Date.now() - start,
        stage:       'compile',
        error:       true,
      };
    }

    return {
      stdout:      run.stdout || '',
      stderr:      run.stderr || '',
      exitCode:    run.code ?? 0,
      time:        Date.now() - start,
      memoryUsed:  run.memory ?? 0,
      stage:       'run',
      error:       (run.code !== 0),
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { stdout: '', stderr: `Execution timed out after ${timeout}ms`, exitCode: -1, time: timeout, error: true };
    }
    return { stdout: '', stderr: `Execution engine error: ${err.message}`, exitCode: -1, time: Date.now() - start, error: true };
  }
}

/**
 * Run all test cases for a session.
 * Returns array of { name, input, expectedOutput, actualOutput, passed, time }
 */
export async function runTestCases(code, language, testCases) {
  const results = await Promise.allSettled(
    testCases.map(async (tc) => {
      const result = await executeCode({ language, code, stdin: tc.input || '', timeout: 8000 });
      const actual = result.stdout.trim();
      const expected = (tc.expectedOutput || '').trim();
      return {
        name:           tc.name,
        input:          tc.input,
        expectedOutput: expected,
        actualOutput:   actual,
        stderr:         result.stderr,
        passed:         actual === expected,
        exitCode:       result.exitCode,
        time:           result.time,
      };
    })
  );
  return results.map(r => r.status === 'fulfilled' ? r.value : { passed: false, error: r.reason?.message });
}

// Warm up the runtime cache on module load
getRuntimes().then(rts => {
  const langs = [...new Set(rts.map(r => r.language))];
  console.log(`✓ Piston API ready — ${langs.length} languages available`);
}).catch(() => {});
