import React from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck, Lock, Database, KeyRound, Cpu, CheckCircle2 } from 'lucide-react';

interface SecurityBadgeModalProps {
  onClose: () => void;
}

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-[0_16px_48px_0_rgba(0,0,0,0.5)] relative text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-400/30 text-teal-300 flex items-center justify-center backdrop-blur-md shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Security & Threat Modeling Specifications</h2>
            <p className="text-xs text-slate-300">OWASP Top 10 & Multi-Tier Cloud Isolation Standards</p>
          </div>
        </div>

        {/* Threat Model Matrix */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/10 shadow-inner">
            <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-teal-400" />
              <span>1. Cloud Firestore User-Data Isolation (OWASP A01)</span>
            </h3>
            <p className="text-xs text-slate-200 mb-2 leading-relaxed">
              Every document is strictly partitioned under <code className="text-teal-300 bg-white/[0.08] px-1.5 py-0.5 rounded border border-white/10">/users/{'{userId}'}/interactions/{'{interactionId}'}</code>.
              The deployed Firestore Security Rule strictly rejects any attempt to query or modify data belonging to another user.
            </p>
            <pre className="p-3 bg-slate-950/80 rounded-xl text-[11px] text-teal-300 font-mono overflow-x-auto border border-white/10">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
            </pre>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/10 shadow-inner">
            <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-teal-400" />
              <span>2. Zero-Password Google Federated Identity (OWASP A07)</span>
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              Application never accepts, handles, hashes, or stores raw user passwords. Authentication is delegated to Google Identity Services via Firebase Auth popups with verified cryptographic token exchange.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/10 shadow-inner">
            <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <KeyRound className="w-4 h-4 text-teal-400" />
              <span>3. Secret Management & Server-Side Proxy (OWASP A03 / LLM02)</span>
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              Gemini API keys are never bundled in client Javascript or exposed in browser network requests. The client communicates with the backend Express service (<code className="text-teal-300 bg-white/[0.08] px-1.5 py-0.5 rounded border border-white/10">/api/gemini/reflect</code>) which validates payloads and attaches the server-side environment secret.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/10 shadow-inner">
            <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-teal-400" />
              <span>4. Resilient Gemini Fallback Ladder</span>
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              Prevents service disruption through an automated fallback cascade:
              <br />
              <span className="text-emerald-300 font-mono text-[11px] mt-1 inline-block">gemini-3.6-flash → gemini-3.1-flash-lite → gemini-flash-latest → gemini-3.7-flash</span>
            </p>
          </div>
        </div>

        {/* Close action */}
        <div className="flex justify-end pt-4 mt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-lg shadow-teal-500/20"
          >
            Close Inspector
          </button>
        </div>
      </motion.div>
    </div>
  );
};
