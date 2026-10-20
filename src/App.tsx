import React, { useState, useCallback, useEffect } from 'react';
import { OpeningSplitScene } from './components/opening/OpeningSplitScene';
import { OpeningHandoffOverlay } from './components/wedding/OpeningHandoffOverlay';
import { GlobalPetalLayer } from './components/wedding/GlobalPetalLayer';
import { MusicControl } from './components/wedding/MusicControl';
import { WeddingExperience, InvitationState } from './components/wedding/WeddingExperience';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { weddingAudio } from './utils/audioManager';
import { apiClient } from './utils/apiClient';

// Personal guest invitation: /invite/:token
const INVITE_PATH = /^\/invite\/([^/]+)\/?$/;
// Admin-only preview of a guest's invitation: /admin/invitations/:id/preview
const PREVIEW_PATH = /^\/admin\/invitations\/([a-f0-9]{24})\/preview\/?$/i;

const matchInviteToken = (path: string): string | null => {
  const match = path.match(INVITE_PATH);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const matchPreviewId = (path: string): string | null => path.match(PREVIEW_PATH)?.[1] ?? null;

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [isOpeningFinished, setIsOpeningFinished] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [isFullyActive, setIsFullyActive] = useState(false);

  const inviteToken = matchInviteToken(currentPath);
  const previewId = matchPreviewId(currentPath);

  const [invitation, setInvitation] = useState<InvitationState>(() =>
    inviteToken || previewId ? { status: 'loading' } : { status: 'none' }
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  }, []);

  // Load the guest's permitted schedule while the opening animation plays.
  // The server returns only the events this invitation allows.
  useEffect(() => {
    if (!inviteToken && !previewId) {
      setInvitation({ status: 'none' });
      return;
    }

    let cancelled = false;
    setInvitation({ status: 'loading' });

    const load = inviteToken
      ? apiClient.getInvitation(inviteToken)
      : apiClient.previewInvitation(previewId as string);

    load.then((res) => {
      if (cancelled) return;

      if (res.success && Array.isArray(res.invitation?.schedule)) {
        setInvitation({ status: 'ready', schedule: res.invitation.schedule });
      } else if (previewId && res.status === 401) {
        navigateTo('/admin/login');
      } else if (res.status === 404) {
        setInvitation({ status: 'unavailable' });
      } else {
        setInvitation({ status: 'error' });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [inviteToken, previewId, navigateTo]);

  // 1. Approved Opening Animation completes (LOCKED - untouched)
  const handleOpenComplete = useCallback(() => {
    setIsOpeningFinished(true);
    weddingAudio.startMusic();
  }, []);

  // 2. Handoff veil reaches peak - reveal Real Wedding UI underneath
  const handleRevealContent = useCallback(() => {
    setIsContentVisible(true);
  }, []);

  // 3. Veil dissolves - activate global petals and music control
  const handleTransitionComplete = useCallback(() => {
    setIsFullyActive(true);
  }, []);

  // Isolated Admin Routes
  if (currentPath === '/admin/login') {
    return (
      <AdminLogin
        onLoginSuccess={() => navigateTo('/admin')}
        onNavigateHome={() => navigateTo('/')}
      />
    );
  }

  if (currentPath === '/admin') {
    return (
      <AdminDashboard
        onLogout={() => navigateTo('/admin/login')}
        onRequireLogin={() => navigateTo('/admin/login')}
        onNavigateHome={() => navigateTo('/')}
      />
    );
  }

  return (
    <div className="app-container">
      {/* 1. Locked Approved Two-Panel Opening Scene (100% UNTOUCHED) */}
      <OpeningSplitScene onOpenComplete={handleOpenComplete} />

      {/* 2. Ceremonial Champagne-Gold Glow + Soft Ivory Light Veil Handoff */}
      <OpeningHandoffOverlay
        isActive={isOpeningFinished}
        onRevealContent={handleRevealContent}
        onTransitionComplete={handleTransitionComplete}
      />

      {/* 3. Global Persistent Petal Layer (Active only after handoff veil dissolves) */}
      <GlobalPetalLayer isActive={isFullyActive} />

      {/* 4. Minimal Music Control (Active only after handoff veil dissolves) */}
      <MusicControl isActive={isFullyActive} />

      {/* 5. Real Wedding UI (Hero + Signature Golden Heart Scratch Date Section) */}
      <WeddingExperience isVisible={isContentVisible} invitation={invitation} />
    </div>
  );
};

export default App;
