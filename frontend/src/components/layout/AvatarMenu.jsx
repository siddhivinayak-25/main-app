import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import { User, Settings, LogOut } from 'lucide-react';

export default function AvatarMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center focus:outline-none cursor-pointer focus:ring-2 focus:ring-brand-violet/20 rounded-full"
      >
        <Avatar name={user.name} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface-raised border border-surface-border rounded-xl shadow-lg py-1 z-50 animate-fade-in">
          {/* User info header */}
          <div className="px-4 py-2 border-b border-surface-border">
            <p className="text-xs font-semibold text-ink truncate">{user.name}</p>
            <p className="text-[11px] text-muted truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/dashboard/profile');
            }}
            className="w-full text-left px-4 py-2 text-xs text-ink hover:bg-surface-hover flex items-center gap-2 transition-colors cursor-pointer"
          >
            <User size={14} className="text-muted" />
            Profile
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/dashboard/settings');
            }}
            className="w-full text-left px-4 py-2 text-xs text-ink hover:bg-surface-hover flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Settings size={14} className="text-muted" />
            Settings
          </button>

          <div className="border-t border-surface-border my-1"></div>

          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut size={14} className="text-red-500" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
