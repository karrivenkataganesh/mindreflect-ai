import React from 'react';
import { User } from 'firebase/auth';
import { ShieldCheck, LogOut, Sparkles, CheckCircle2, RefreshCw, AlertCircle, Award } from 'lucide-react';
import { logOut } from '../lib/firebase';

interface NavbarProps {
  user: User | null;
  syncStatus: 'synced' | 'saving' | 'error';
  onOpenSecurityModal: () => void;
  onOpenEvaluationModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  syncStatus,
  onOpenSecurityModal,
  onOpenEvaluationModal,
}) => {
  return (
    <header className="w-full shrink-0 z-30 bg-slate-900/60 backdrop-blur-xl border-b border-white/10 text-slate-100 shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/25 text-slate-950 font-bold backdrop-blur-md">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold tracking-tight text-white drop-shadow-sm">MindReflect</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.08] backdrop-blur-md text-teal-300 border border-teal-500/30 font-medium shadow-sm">
                Gemini + Firestore
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Private AI Journaling & Cognitive Reflection
            </p>
          </div>
        </div>

        {/* Right Section Actions & User Status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Firestore Sync Indicator */}
          {user && (
            <div className="flex items-center text-xs font-medium px-2.5 py-1 rounded-xl bg-white/[0.05] backdrop-blur-md border border-white/10 shadow-sm">
              {syncStatus === 'synced' && (
                <span className="flex items-center text-emerald-400 space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Firestore Synced</span>
                </span>
              )}
              {syncStatus === 'saving' && (
                <span className="flex items-center text-amber-400 space-x-1.5 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </span>
              )}
              {syncStatus === 'error' && (
                <span className="flex items-center text-rose-400 space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sync Warning</span>
                </span>
              )}
            </div>
          )}

          {/* Evaluation Metrics Matrix Trigger */}
          <button
            id="navbar-eval-metrics-btn"
            onClick={onOpenEvaluationModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-xl bg-gradient-to-r from-amber-500/15 to-teal-500/15 hover:from-amber-500/25 hover:to-teal-500/25 backdrop-blur-md text-amber-200 hover:text-white border border-amber-500/30 hover:border-amber-400/50 transition cursor-pointer shadow-sm"
            title="View 4-Pillar Evaluation Metrics & System Health"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">Evaluation Metrics</span>
          </button>

          {/* Security & Threat Model Inspector Trigger */}
          <button
            onClick={onOpenSecurityModal}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-xl bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-md text-slate-200 hover:text-white border border-white/10 hover:border-white/20 transition cursor-pointer shadow-sm"
            title="View Security & Isolation Model"
          >
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="font-medium">Security</span>
          </button>

          {/* User Profile & Logout */}
          {user ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-white/10">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User Avatar'}
                  className="w-8 h-8 rounded-full ring-2 ring-teal-400/40 object-cover shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-medium text-xs shadow-sm">
                  {user.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{user.email}</p>
              </div>
              <button
                onClick={() => logOut()}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
