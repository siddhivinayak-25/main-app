import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import CandidateTestLayout from '../components/candidate/CandidateTestLayout';
import { useTestInvitation } from '../hooks/useTestInvitation';
import { AlertCircle, Terminal, FileText, CheckSquare, Play } from 'lucide-react';
import Badge from '../components/ui/Badge';

export default function CandidateTestPage() {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const { data, loading, error } = useTestInvitation(token);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 120 minutes in seconds for mock
  
  useEffect(() => {
    if (loading || error || !data) return;
    
    // Simple mock countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loading, error, data]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const handleSubmit = () => {
    alert("Test submitted successfully! (Mock Action)");
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-display font-semibold text-ink">Missing Invitation Token</h2>
          <p className="text-muted text-sm">You need a valid invitation link to access this test.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <CandidateTestLayout title="Loading Test Environment..." disableSubmit={true}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted">
            <div className="w-5 h-5 border-2 border-brand-violet/30 border-t-brand-violet rounded-full animate-spin" />
            Setting up your environment...
          </div>
        </div>
      </CandidateTestLayout>
    );
  }

  if (error || !data) {
    return (
      <CandidateTestLayout title="Access Denied" disableSubmit={true}>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-xl font-display font-semibold text-ink">Invalid or Expired Link</h2>
            <p className="text-muted text-sm">{error || "This invitation is no longer valid."}</p>
          </div>
        </div>
      </CandidateTestLayout>
    );
  }

  const { test, invitation } = data;
  const config = test.testConfig || {};

  return (
    <CandidateTestLayout 
      title={test.name}
      timerText={formatTime(timeLeft)}
      onSubmit={handleSubmit}
    >
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Tabs Bar */}
        <div className="bg-surface border-b border-surface-border flex items-center px-4 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'overview' 
                ? 'border-brand-violet text-brand-violet' 
                : 'border-transparent text-muted hover:text-ink hover:border-surface-border/50'
            }`}
          >
            <FileText size={16} />
            Test Overview
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'editor' 
                ? 'border-brand-violet text-brand-violet' 
                : 'border-transparent text-muted hover:text-ink hover:border-surface-border/50'
            }`}
          >
            <Terminal size={16} />
            Code Editor
          </button>
          <button
            onClick={() => setActiveTab('testcases')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'testcases' 
                ? 'border-brand-violet text-brand-violet' 
                : 'border-transparent text-muted hover:text-ink hover:border-surface-border/50'
            }`}
          >
            <CheckSquare size={16} />
            Test Cases
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto bg-surface-card p-6">
          <div className="max-w-4xl mx-auto h-full">
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-display font-semibold text-ink mb-2">Instructions</h2>
                  <p className="text-muted leading-relaxed">
                    {config.instructions || 'No instructions provided.'}
                  </p>
                </div>
                
                <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-4">
                  <h3 className="font-medium text-ink">Candidate Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted block mb-1">Name</span>
                      <span className="text-sm font-medium">{invitation.candidateName}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted block mb-1">Email</span>
                      <span className="text-sm font-medium">{invitation.candidateEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="h-full flex flex-col animate-fade-in border border-surface-border rounded-xl overflow-hidden bg-[#1e1e1e]">
                <div className="bg-[#2d2d2d] border-b border-[#404040] px-4 py-2 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <span className="text-xs font-mono text-gray-400">solution.py</span>
                </div>
                <div className="flex-1 p-4 font-mono text-sm text-gray-300">
                  <p className="text-gray-500 mb-2"># Write your solution here</p>
                  <p><span className="text-purple-400">def</span> <span className="text-blue-400">solve</span>(input_data):</p>
                  <p className="pl-4"><span className="text-purple-400">pass</span></p>
                  <div className="mt-8 text-center opacity-50 flex flex-col items-center">
                    <Terminal size={32} className="mb-2" />
                    <p>Monaco Editor / CodeMirror would be mounted here</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'testcases' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-ink">Provided Test Cases</h2>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-surface-border rounded hover:bg-surface-border/50 text-sm font-medium transition-colors">
                    <Play size={14} /> Run Tests
                  </button>
                </div>
                
                {config.testCases && config.testCases.length > 0 ? (
                  config.testCases.map((tc) => (
                    <div key={tc.id} className="border border-surface-border rounded-xl overflow-hidden">
                      <div className="bg-surface px-4 py-3 border-b border-surface-border">
                        <span className="font-medium text-sm text-ink">{tc.name}</span>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4 bg-surface-card text-sm font-mono">
                        <div>
                          <span className="text-xs font-sans text-muted block mb-2 uppercase tracking-wider">Input</span>
                          <div className="bg-surface border border-surface-border rounded p-3 text-ink">
                            {tc.input}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-sans text-muted block mb-2 uppercase tracking-wider">Expected Output</span>
                          <div className="bg-surface border border-surface-border rounded p-3 text-ink">
                            {tc.expectedOutput}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-sm">No test cases provided.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </CandidateTestLayout>
  );
}
