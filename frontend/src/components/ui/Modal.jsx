import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop with a slightly distinct dark glassmorphism */}
      <div 
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose} 
      />
      
      {/* Modal Card - Dark/modern themed to stand out against the light UI */}
      <div className="relative w-full max-w-md bg-[#1a1a1e] border border-surface-border/20 rounded-2xl shadow-2xl overflow-hidden animate-slide-up transform transition-all p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-display font-semibold text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="text-surface-raised">
          {children}
        </div>
      </div>
    </div>
  );
}
