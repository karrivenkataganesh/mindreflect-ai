import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  Sparkles,
  Database,
  ShieldCheck,
  Brain,
  MessageSquareQuote,
  CheckCircle,
  ArrowRight,
  Cpu,
  KeyRound,
  FileCheck,
  Award,
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface LandingPageProps {
  onSignInSuccess?: () => void;
  onOpenSecurityModal: () => void;
  onOpenEvaluationModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenSecurityModal,
  onOpenEvaluationModal,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      // Helpful error messages
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google Sign-In popup was closed before completing.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Authentication request was cancelled.');
      } else {
        setError(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-transparent text-slate-100">
      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col items-center text-center">
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/15 text-teal-300 text-xs font-medium mb-8 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          <span>Google Auth Federated Identity • Zero-Exposure Cloud Firestore</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-3xl leading-tight drop-shadow-md"
        >
          Deep Reflections with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300">
            Gemini
          </span>
          , Secured by Firestore.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed"
        >
          A private, multi-turn AI journaling companion. Reflect on challenges, brainstorm solutions,
          and receive empathetic Socratic insights—stored exclusively in your user-isolated Firestore container.
        </motion.p>

        {/* Error Alert if any */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-rose-950/70 backdrop-blur-xl border border-rose-500/40 rounded-2xl text-rose-200 text-sm max-w-md text-left flex items-start space-x-3 shadow-xl"
          >
            <div className="text-rose-400 font-bold">!</div>
            <div>
              <p className="font-semibold">Sign-In Notice</p>
              <p className="text-xs text-rose-300 mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-base shadow-xl shadow-teal-500/25 transition duration-200 flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loading ? 'Authenticating...' : 'Sign In with Google'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <button
            id="landing-eval-metrics-btn"
            onClick={onOpenEvaluationModal}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-teal-500/15 to-emerald-500/15 hover:from-amber-500/25 hover:to-teal-500/25 backdrop-blur-md text-amber-200 hover:text-white font-semibold text-sm border border-amber-500/30 transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Evaluation Metrics</span>
          </button>

          <button
            onClick={onOpenSecurityModal}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-md text-slate-200 font-semibold text-sm border border-white/15 transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Review Security Spec</span>
          </button>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left"
        >
          {/* Feature 1 */}
          <div className="p-6 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-400/30 text-teal-300 flex items-center justify-center mb-4 backdrop-blur-md shadow-sm">
              <Brain className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Multi-Turn AI Reflections</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Converse with Gemini across multiple reflection turns. Toggle between reflective counseling,
              tactical brainstorming, or Socratic inquiry.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center mb-4 backdrop-blur-md shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">User-Isolated Firestore</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every interaction is bound to <code className="text-xs bg-white/[0.08] px-1.5 py-0.5 rounded-md text-teal-300 border border-white/10">/users/{'{uid}'}/interactions</code> with strict Firebase Security Rules preventing cross-account access.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center justify-center mb-4 backdrop-blur-md shadow-sm">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Resilient Model Ladder</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Backed by server-side Gemini 3.6 Flash with automated fallback to Gemini 3.1 Flash-Lite, Gemini Flash-Latest, and Gemini 3.7 Flash.
            </p>
          </div>
        </motion.div>

        {/* Security & Threat Countermeasures Pill Banner */}
        <div className="mt-12 w-full p-6 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-300 shadow-lg">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
            <span>
              <strong className="text-white">Zero Password Footprint:</strong> Federated Google Identity means passwords are never handled or stored on the server.
            </span>
          </div>
          <div className="flex items-center space-x-6 shrink-0">
            <span className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200">OWASP Top 10 Aligned</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <KeyRound className="w-4 h-4 text-teal-400" />
              <span className="text-slate-200">GCP Secret Manager Ready</span>
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-400 backdrop-blur-md">
        <p>MindReflect • Powered by Gemini 3.6 Flash & Cloud Firestore • Isolated Identity Architecture</p>
      </footer>
    </div>
  );
};
