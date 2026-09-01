/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChanged } from './lib/firebase';
import {
  subscribeToUserInteractions,
  saveUserInteraction,
  deleteUserInteraction,
} from './lib/firestoreService';
import { JournalInteraction, EntrySummary, ReflectionMood } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { HistorySidebar } from './components/HistorySidebar';
import { ReflectionWorkspace } from './components/ReflectionWorkspace';
import { SummaryModal } from './components/SummaryModal';
import { SecurityBadgeModal } from './components/SecurityBadgeModal';
import { EvaluationMetricsModal } from './components/EvaluationMetricsModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [summaryModalData, setSummaryModalData] = useState<{
    summary: EntrySummary;
    title: string;
  } | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user's isolated Firestore interactions collection
  useEffect(() => {
    if (!user) {
      setInteractions([]);
      setActiveInteractionId(null);
      return;
    }

    const unsubscribe = subscribeToUserInteractions(
      user.uid,
      (items) => {
        setInteractions(items);
        setSyncStatus('synced');
        setSyncError(null);

        // Auto-select latest if none selected or previous active was deleted
        if (items.length > 0) {
          setActiveInteractionId((prev) => {
            if (!prev || !items.some((it) => it.id === prev)) {
              return items[0].id;
            }
            return prev;
          });
        }
      },
      (err) => {
        console.error('Firestore sync error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Permission denied or Firestore sync issue');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Create a brand new reflection session
  const handleNewReflection = useCallback(async () => {
    if (!user) return;

    const newId = 'entry_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const newEntry: JournalInteraction = {
      id: newId,
      userId: user.uid,
      title: 'New Reflection',
      mood: 'Reflective',
      turns: [],
      tags: ['reflection'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
    };

    setSyncStatus('saving');
    try {
      await saveUserInteraction(user.uid, newEntry);
      setActiveInteractionId(newId);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Error creating new reflection:', err);
      setSyncStatus('error');
      setSyncError(err.message || 'Could not save new entry');
    }
  }, [user]);

  // Save/Update interaction with retry and defensive hygiene
  const handleSaveInteraction = useCallback(
    async (interaction: JournalInteraction) => {
      if (!user) return;

      setSyncStatus('saving');
      setSyncError(null);

      // Optimistically update in state
      setInteractions((prev) => {
        const index = prev.findIndex((i) => i.id === interaction.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = interaction;
          return updated;
        }
        return [interaction, ...prev];
      });

      try {
        await saveUserInteraction(user.uid, interaction);
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Failed to persist to Firestore:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to persist interaction to Firestore.');
        throw err;
      }
    },
    [user]
  );

  // Delete reflection from Firestore
  const handleDeleteInteraction = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        setSyncStatus('saving');
        await deleteUserInteraction(user.uid, id);
        setSyncStatus('synced');

        if (activeInteractionId === id) {
          const remaining = interactions.filter((i) => i.id !== id);
          setActiveInteractionId(remaining.length > 0 ? remaining[0].id : null);
        }
      } catch (err: any) {
        console.error('Error deleting entry:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Could not delete entry');
      }
    },
    [user, activeInteractionId, interactions]
  );

  // Toggle Pinned
  const handleTogglePin = useCallback(
    async (interaction: JournalInteraction) => {
      await handleSaveInteraction({
        ...interaction,
        pinned: !interaction.pinned,
      });
    },
    [handleSaveInteraction]
  );

  const activeInteraction =
    interactions.find((i) => i.id === activeInteractionId) ||
    (interactions.length > 0 ? interactions[0] : null);

  // Initial Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-3 border-teal-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide">Initializing Secure Firebase Session...</p>
      </div>
    );
  }

  return (
    <div className={`${!user ? 'min-h-screen' : 'h-screen max-h-screen overflow-hidden'} flex flex-col bg-slate-950 text-slate-100 font-sans`}>
      <Navbar
        user={user}
        syncStatus={syncStatus}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenEvaluationModal={() => setIsEvaluationModalOpen(true)}
      />

      {!user ? (
        <LandingPage
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onOpenEvaluationModal={() => setIsEvaluationModalOpen(true)}
        />
      ) : (
        <main className="flex-1 min-h-0 flex overflow-hidden relative w-full">
          {/* Sidebar / History Drawer */}
          <HistorySidebar
            interactions={interactions}
            activeId={activeInteraction?.id || null}
            onSelect={(item) => setActiveInteractionId(item.id)}
            onNew={handleNewReflection}
            onDelete={handleDeleteInteraction}
            onTogglePin={handleTogglePin}
            isOpen={isSidebarOpen}
            onCloseMobile={() => setIsSidebarOpen(false)}
          />

          {/* Active Workspace */}
          <ReflectionWorkspace
            interaction={activeInteraction}
            onSaveInteraction={handleSaveInteraction}
            onDeleteInteraction={handleDeleteInteraction}
            onOpenSummaryModal={(summary) =>
              setSummaryModalData({
                summary,
                title: activeInteraction?.title || 'Reflection',
              })
            }
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            isSidebarOpen={isSidebarOpen}
            syncError={syncError}
            onRetrySave={() => {
              if (activeInteraction) {
                handleSaveInteraction(activeInteraction);
              }
            }}
          />
        </main>
      )}

      {/* Summary Modal */}
      {summaryModalData && (
        <SummaryModal
          summary={summaryModalData.summary}
          entryTitle={summaryModalData.title}
          onClose={() => setSummaryModalData(null)}
        />
      )}

      {/* Security Specifications Modal */}
      {isSecurityModalOpen && (
        <SecurityBadgeModal onClose={() => setIsSecurityModalOpen(false)} />
      )}

      {/* Evaluation Metrics Matrix Modal */}
      {isEvaluationModalOpen && (
        <EvaluationMetricsModal onClose={() => setIsEvaluationModalOpen(false)} />
      )}
    </div>
  );
}
