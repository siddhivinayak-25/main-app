// Single source of truth for mock data. The `api/` layer reads from here.
// Candidates link back to their test via testId — that's what makes
// "Tests → candidates for this test" and "Pipeline → all candidates" the
// same underlying data, just filtered differently.

const defaultTestConfig = {
  instructions: 'Please read the requirements carefully. You will need to implement a solution that passes all the provided test cases. Ensure your code is clean, efficient, and handles errors gracefully.',
  testCases: [
    { id: 1, name: 'Basic functionality', input: 'input = "hello"', expectedOutput: '"hello world"' },
    { id: 2, name: 'Edge case handling', input: 'input = ""', expectedOutput: 'Error: invalid input' },
  ],
};

export const tests = [
  { id: 1, name: 'AI Engineer — LangGraph Challenge', role: 'AI Engineer', candidates: 4, progress: 82, status: 'Live', createdOn: 'May 29, 2026', testConfig: defaultTestConfig },
  { id: 2, name: 'Backend Engineer — System Design', role: 'Backend Engineer', candidates: 2, progress: 68, status: 'Live', createdOn: 'May 26, 2026', testConfig: defaultTestConfig },
  { id: 3, name: 'Data Scientist — ML Pipeline', role: 'Data Scientist', candidates: 1, progress: 54, status: 'Live', createdOn: 'May 24, 2026', testConfig: defaultTestConfig },
  { id: 4, name: 'Full Stack Developer — Take Home', role: 'Full Stack Developer', candidates: 1, progress: 40, status: 'Live', createdOn: 'May 22, 2026', testConfig: defaultTestConfig },
  { id: 5, name: 'DevOps Engineer — Infrastructure', role: 'DevOps Engineer', candidates: 0, progress: 22, status: 'Draft', createdOn: 'May 20, 2026', testConfig: defaultTestConfig },
  { id: 6, name: 'Frontend Developer — React', role: 'Frontend Developer', candidates: 0, progress: 8, status: 'Draft', createdOn: 'May 18, 2026', testConfig: defaultTestConfig },
  { id: 7, name: 'QA Engineer — Automation', role: 'QA Engineer', candidates: 0, progress: 4, status: 'Draft', createdOn: 'May 16, 2026', testConfig: defaultTestConfig },
];

export const CANDIDATE_STAGES = ['Invited', 'Started', 'In Progress', 'Completed', 'Shortlisted', 'Hired'];
export const REJECTED_STAGE = 'Rejected';

export const candidates = [
  {
    id: 1, testId: 1, name: 'Aarav Patel', role: 'AI Engineer', score: 92, status: 'Completed', lastActivity: '2h ago',
    testName: 'AI Engineer — LangGraph Challenge',
    scoreBreakdown: { promptQuality: 9, errorRecovery: 8, outputCorrectness: true, codeQuality: 9, executionEfficiency: 9 },
    testDetails: { testTaken: 'May 28, 2026, 10:30 AM', executionTime: '42m 18s', language: 'Python 3.11', environment: 'Ubuntu 22.04' },
    activityLog: [{ id: 'al-1', status: 'Completed', timestamp: '2026-05-28T12:30:00Z', note: 'Test completed' }],
  },
  {
    id: 2, testId: 1, name: 'Maya Chen', role: 'AI Engineer', score: 88, status: 'Completed', lastActivity: '3h ago',
    testName: 'AI Engineer — LangGraph Challenge',
    scoreBreakdown: { promptQuality: 8, errorRecovery: 9, outputCorrectness: true, codeQuality: 8, executionEfficiency: 8 },
    testDetails: { testTaken: 'May 28, 2026, 9:05 AM', executionTime: '38m 52s', language: 'Python 3.11', environment: 'Ubuntu 22.04' },
    activityLog: [{ id: 'al-2', status: 'Completed', timestamp: '2026-05-28T11:05:00Z', note: 'Test completed' }],
  },
  {
    id: 3, testId: 2, name: 'Jordan Lee', role: 'Backend Engineer', score: 85, status: 'In Progress', lastActivity: '1h ago',
    testName: 'Backend Engineer — System Design',
    scoreBreakdown: { promptQuality: 8, errorRecovery: 8, outputCorrectness: true, codeQuality: 9, executionEfficiency: 7 },
    testDetails: { testTaken: 'May 30, 2026, 11:15 AM', executionTime: '51m 03s', language: 'Go 1.22', environment: 'Ubuntu 22.04' },
    activityLog: [{ id: 'al-3', status: 'In Progress', timestamp: '2026-05-30T12:15:00Z', note: 'Test in progress' }],
  },
  {
    id: 4, testId: 3, name: 'Priya Sharma', role: 'Data Scientist', score: 82, status: 'Completed', lastActivity: '4h ago',
    testName: 'Data Scientist — ML Pipeline',
    scoreBreakdown: { promptQuality: 8, errorRecovery: 7, outputCorrectness: true, codeQuality: 8, executionEfficiency: 8 },
    testDetails: { testTaken: 'May 27, 2026, 2:40 PM', executionTime: '44m 27s', language: 'Python 3.11', environment: 'Ubuntu 22.04' },
    activityLog: [{ id: 'al-4', status: 'Completed', timestamp: '2026-05-27T16:40:00Z', note: 'Test completed' }],
  },
  {
    id: 5, testId: 1, name: 'Liam Johnson', role: 'AI Engineer', score: 79, status: 'Completed', lastActivity: '5h ago',
    testName: 'AI Engineer — LangGraph Challenge',
    scoreBreakdown: { promptQuality: 7, errorRecovery: 8, outputCorrectness: true, codeQuality: 7, executionEfficiency: 8 },
    testDetails: { testTaken: 'May 26, 2026, 4:12 PM', executionTime: '46m 40s', language: 'Python 3.11', environment: 'Ubuntu 22.04' },
    activityLog: [{ id: 'al-5', status: 'Completed', timestamp: '2026-05-26T18:12:00Z', note: 'Test completed' }],
  },
  {
    id: 6, testId: 2, name: 'Noah Kim', role: 'Backend Engineer', score: 74, status: 'In Progress', lastActivity: 'Just now',
    testName: 'Backend Engineer — System Design',
    scoreBreakdown: { promptQuality: 7, errorRecovery: 6, outputCorrectness: false, codeQuality: 7, executionEfficiency: 7 },
    testDetails: { testTaken: 'Jun 1, 2026, 8:02 AM', executionTime: '29m 11s', language: 'Go 1.22', environment: 'Ubuntu 22.04' },
    activityLog: [{ id: 'al-6', status: 'In Progress', timestamp: '2026-06-01T08:31:00Z', note: 'Test in progress' }],
  },
  {
    id: 7, testId: 1, name: 'Zara Ali', role: 'AI Engineer', score: 71, status: 'In Progress', lastActivity: '2m ago',
    testName: 'AI Engineer — LangGraph Challenge',
    scoreBreakdown: { promptQuality: 6, errorRecovery: 7, outputCorrectness: false, codeQuality: 7, executionEfficiency: 6 },
    testDetails: { testTaken: 'Jun 1, 2026, 7:48 AM', executionTime: '33m 05s', language: 'Python 3.11', environment: 'Ubuntu 22.04' },
    activityLog: [{ id: 'al-7', status: 'In Progress', timestamp: '2026-06-01T08:21:00Z', note: 'Test in progress' }],
  },
  {
    id: 8, testId: 4, name: 'Elena Ruiz', role: 'Full Stack Developer', score: 76, status: 'Completed', lastActivity: '6h ago',
    testName: 'Full Stack Developer — Take Home',
    scoreBreakdown: { promptQuality: 7, errorRecovery: 7, outputCorrectness: true, codeQuality: 8, executionEfficiency: 7 },
    testDetails: { testTaken: 'May 25, 2026, 3:20 PM', executionTime: '1h 12m', language: 'TypeScript', environment: 'Ubuntu 22.04' },
    activityLog: [{ id: 'al-8', status: 'Completed', timestamp: '2026-05-25T16:32:00Z', note: 'Test completed' }],
  },
];


export const dashboardStats = [
  { label: 'Active Tests', value: 24, delta: '+12%' },
  { label: 'Candidates', value: 342, delta: '+18%' },
  { label: 'Hires', value: 19, delta: '+5%' },
  { label: 'Avg. Agentic Score', value: 78, delta: '+7%' },
];

export const hiringFunnel = [
  { stage: 'Invited', count: 1248 },
  { stage: 'Started', count: 842 },
  { stage: 'In Progress', count: 512 },
  { stage: 'Completed', count: 342 },
  { stage: 'Shortlisted', count: 65 },
  { stage: 'Hired', count: 19 },
];

export const recentActiveTests = [
  { id: 1, name: 'AI Engineer — LangGraph Challenge', completed: 128 },
  { id: 2, name: 'Backend Engineer — System Design', completed: 96 },
  { id: 3, name: 'Data Scientist — ML Pipeline', completed: 64 },
  { id: 4, name: 'Full Stack Developer — Take Home', completed: 54 },
];

export const topCandidates = [
  { id: 1, name: 'Aarav Patel', score: 92 },
  { id: 2, name: 'Maya Chen', score: 88 },
  { id: 3, name: 'Jordan Lee', score: 85 },
  { id: 4, name: 'Priya Sharma', score: 82 },
  { id: 5, name: 'Liam Johnson', score: 79 },
];

export const pipelineStats = [
  { key: 'invited', label: 'Invited', count: 1248 },
  { key: 'started', label: 'Started', count: 842 },
  { key: 'inProgress', label: 'In Progress', count: 512 },
  { key: 'completed', label: 'Completed', count: 342 },
  { key: 'shortlisted', label: 'Shortlisted', count: 65 },
  { key: 'hired', label: 'Hired', count: 19 },
];

export const mockUser = {
  id: 1,
  name: 'Alex Parker',
  email: 'alex@company.com',
  password: 'password123',
  role: 'Recruiter',
  avatarInitials: 'AP',
  phone: '+1 (555) 234-5678',
  jobTitle: 'Senior Technical Recruiter',
  department: 'Talent Acquisition',
  timezone: 'America/New_York',
  bio: 'Passionate about connecting top engineering talent with impactful roles. 8+ years in technical recruiting across startups and enterprise.',
  joinedOn: 'January 15, 2025',
  avatarUrl: null,
};

export const testInvitations = [
  {
    id: 'inv-1',
    testId: 1,
    candidateEmail: 'john.doe@gmail.com',
    candidateName: 'John Doe',
    invitedAt: '2026-06-01T10:30Z',
    status: 'pending', // pending, started, submitted
    submittedAt: null,
    invitationToken: 'abcd1234efgh5678',
    expiresAt: '2026-07-08T10:30Z', // arbitrarily in the future
  },
];

