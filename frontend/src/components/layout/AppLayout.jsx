import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import TopographicBackground from '../visual/TopographicBackground';
import GradientMesh from '../visual/GradientMesh';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-surface relative">
      {/* Ambient background */}
      <TopographicBackground className="fixed inset-0 z-0 opacity-70" density="default" />
      <GradientMesh className="fixed inset-0 z-0" intensity="low" />

      <div className="relative z-10 flex w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <TopBar />
          <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
