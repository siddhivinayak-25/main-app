import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import PublicLayout from './pages/PublicLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CommandCenter from './pages/CommandCenter';
import ActiveTests from './pages/ActiveTests';
import CreateTest from './pages/CreateTest';
import TestDetail from './pages/TestDetail';
import CandidatePipeline from './pages/CandidatePipeline';
import ComingSoon from './pages/ComingSoon';
import Profile from './pages/Profile';
import CandidateWorkspace from './pages/CandidateWorkspace';
import InvitationsDashboard from './pages/InvitationsDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Candidate Test Workspace (public, invite-token gated) ── */}
        <Route path="/test/:testId" element={<CandidateWorkspace />} />

        {/* ── Public ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* ── Protected recruiter dashboard ── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<AppLayout />}>
            <Route index element={<CommandCenter />} />
            <Route path="pipeline" element={<CandidatePipeline />} />
            <Route path="tests" element={<ActiveTests />} />
            <Route path="tests/new" element={<CreateTest />} />
            <Route path="tests/:testId" element={<TestDetail />} />
            <Route path="invitations" element={<InvitationsDashboard />} />
            <Route path="candidates" element={<ComingSoon title="Candidates" />} />
            <Route path="analytics" element={<ComingSoon title="Analytics" />} />
            <Route path="settings" element={<ComingSoon title="Settings" />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
