import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import '../../styles/admin.css';
import {
  apiClient,
  CelebrationDay,
  InvitationPreset,
  InvitationRecord,
} from '../../utils/apiClient';

interface InvitationManagerProps {
  onRequireLogin: () => void;
}

interface FormState {
  editingId: string | null;
  guestName: string;
  selected: string[];
  notes: string;
}

const MAX_GUEST_NAME_LENGTH = 100;
const MAX_NOTES_LENGTH = 500;

const emptyForm = (): FormState => ({
  editingId: null,
  guestName: '',
  selected: [],
  notes: '',
});

const getInvitationUrl = (token: string): string =>
  `${window.location.origin}/invite/${encodeURIComponent(token)}`;

const getShareText = (url: string): string =>
  `You are warmly invited to celebrate the wedding of Manya & Sarthak. Please open your personal invitation: ${url}`;

// Clipboard API with a fallback for browsers or contexts without it
const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy approach
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
};

const formatDate = (isoString?: string | null) => {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

export const InvitationManager: React.FC<InvitationManagerProps> = ({ onRequireLogin }) => {
  const [days, setDays] = useState<CelebrationDay[]>([]);
  const [presets, setPresets] = useState<InvitationPreset[]>([]);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const allEventIds = useMemo(
    () => days.flatMap((day) => day.events.map((event) => event.id)),
    [days]
  );

  const eventTitles = useMemo(() => {
    const titles: Record<string, string> = {};
    days.forEach((day) =>
      day.events.forEach((event) => {
        titles[event.id] = event.title;
      })
    );
    return titles;
  }, [days]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [eventsRes, invitationsRes] = await Promise.all([
      apiClient.getAdminEvents(),
      apiClient.getAdminInvitations(),
    ]);

    if (eventsRes.status === 401 || invitationsRes.status === 401) {
      onRequireLogin();
      return;
    }

    if (eventsRes.success && Array.isArray(eventsRes.days) && invitationsRes.success) {
      setDays(eventsRes.days);
      setPresets(Array.isArray(eventsRes.presets) ? eventsRes.presets : []);
      setInvitations(Array.isArray(invitationsRes.invitations) ? invitationsRes.invitations : []);
    } else {
      setError(eventsRes.message || invitationsRes.message || 'Failed to load invitations.');
    }
    setLoading(false);
  }, [onRequireLogin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bring the form into view when it opens (the dashboard scrolls inside its own container)
  useEffect(() => {
    if (isFormOpen) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isFormOpen, form.editingId]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3000);
  };

  const replaceInvitation = (updated: InvitationRecord) => {
    setInvitations((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  // ---------------------------------------------------------------------------
  // Form handling
  // ---------------------------------------------------------------------------
  const openCreateForm = () => {
    setForm(emptyForm());
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (invitation: InvitationRecord) => {
    setForm({
      editingId: invitation.id,
      guestName: invitation.guestName,
      selected: [...invitation.allowedEventIds],
      notes: invitation.notes || '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setForm(emptyForm());
    setFormError(null);
  };

  const toggleEvent = (eventId: string) => {
    setForm((prev) => ({
      ...prev,
      selected: prev.selected.includes(eventId)
        ? prev.selected.filter((id) => id !== eventId)
        : [...prev.selected, eventId],
    }));
    setFormError(null);
  };

  const setSelection = (eventIds: string[]) => {
    setForm((prev) => ({ ...prev, selected: [...eventIds] }));
    setFormError(null);
  };

  const isPresetActive = (preset: InvitationPreset) =>
    preset.eventIds.length === form.selected.length &&
    preset.eventIds.every((id) => form.selected.includes(id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const guestName = form.guestName.trim();
    if (!guestName) {
      setFormError("Please enter the guest's name.");
      return;
    }
    if (form.selected.length === 0) {
      setFormError('Please select at least one event.');
      return;
    }

    // Keep the catalog order regardless of the click order
    const input = {
      guestName,
      allowedEventIds: allEventIds.filter((id) => form.selected.includes(id)),
      notes: form.notes.trim(),
    };

    setSaving(true);
    setFormError(null);

    const res = form.editingId
      ? await apiClient.updateInvitation(form.editingId, input)
      : await apiClient.createInvitation(input);

    setSaving(false);

    if (res.status === 401) {
      onRequireLogin();
      return;
    }

    if (!res.success || !res.invitation) {
      setFormError(res.message || 'Unable to save the invitation.');
      return;
    }

    if (form.editingId) {
      replaceInvitation(res.invitation);
      showNotice(`Invitation for ${res.invitation.guestName} updated.`);
    } else {
      setInvitations((prev) => [res.invitation, ...prev]);
      showNotice(`Invitation for ${res.invitation.guestName} created.`);
    }
    closeForm();
  };

  // ---------------------------------------------------------------------------
  // Link actions
  // ---------------------------------------------------------------------------
  const handleCopy = async (invitation: InvitationRecord) => {
    const copied = await copyText(getInvitationUrl(invitation.token));
    if (copied) {
      setCopiedId(invitation.id);
      window.setTimeout(() => setCopiedId((current) => (current === invitation.id ? null : current)), 2000);
    } else {
      showNotice('Could not copy automatically. Please select the link and copy it.');
    }
  };

  const handleWhatsApp = (invitation: InvitationRecord) => {
    const text = getShareText(getInvitationUrl(invitation.token));
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async (invitation: InvitationRecord) => {
    const url = getInvitationUrl(invitation.token);
    try {
      await navigator.share({
        title: 'Wedding Invitation — Manya & Sarthak',
        text: 'You are warmly invited to celebrate the wedding of Manya & Sarthak.',
        url,
      });
    } catch {
      // Share sheet dismissed
    }
  };

  const handlePreview = (invitation: InvitationRecord) => {
    window.open(
      `/admin/invitations/${encodeURIComponent(invitation.id)}/preview`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleRevoke = async (invitation: InvitationRecord) => {
    const confirmed = window.confirm(
      `Revoke the invitation for ${invitation.guestName}? The link will stop working immediately.`
    );
    if (!confirmed) return;

    setBusyId(invitation.id);
    const res = await apiClient.revokeInvitation(invitation.id);
    setBusyId(null);

    if (res.status === 401) {
      onRequireLogin();
      return;
    }
    if (res.success && res.invitation) {
      replaceInvitation(res.invitation);
      showNotice(`Invitation for ${invitation.guestName} revoked.`);
    } else {
      showNotice(res.message || 'Unable to revoke the invitation.');
    }
  };

  const handleRegenerate = async (invitation: InvitationRecord) => {
    const confirmed = window.confirm(
      invitation.isActive
        ? `Generate a new link for ${invitation.guestName}? The current link will stop working immediately.`
        : `Restore the invitation for ${invitation.guestName} with a new link? The old link will stay disabled.`
    );
    if (!confirmed) return;

    setBusyId(invitation.id);
    const res = await apiClient.regenerateInvitation(invitation.id);
    setBusyId(null);

    if (res.status === 401) {
      onRequireLogin();
      return;
    }
    if (res.success && res.invitation) {
      replaceInvitation(res.invitation);
      showNotice(`A new link for ${invitation.guestName} is ready to share.`);
    } else {
      showNotice(res.message || 'Unable to generate a new link.');
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="admin-loading-container" role="status">
        <div className="admin-spinner" />
        <p style={{ color: '#775a19', fontSize: 13, fontFamily: 'Cinzel, serif' }}>
          Loading invitations...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card" style={{ textAlign: 'center', padding: '32px' }}>
        <p style={{ color: '#9a3b4d', marginBottom: 16 }}>{error}</p>
        <button
          type="button"
          className="admin-submit-btn"
          style={{ display: 'inline-flex', margin: '0 auto' }}
          onClick={loadData}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="invite-manager">
      {/* Toolbar */}
      <div className="invite-toolbar">
        <span className="admin-badge" aria-label="Total invitations">
          {invitations.length} {invitations.length === 1 ? 'Invitation' : 'Invitations'}
        </span>
        {!isFormOpen && (
          <button type="button" className="invite-primary-btn" onClick={openCreateForm}>
            + New Invitation
          </button>
        )}
      </div>

      {notice && (
        <div className="invite-notice" role="status" aria-live="polite">
          {notice}
        </div>
      )}

      {/* Create / Edit Form */}
      {isFormOpen && (
        <form
          ref={formRef}
          className="admin-card invite-form-card"
          onSubmit={handleSubmit}
          noValidate
        >
          <h2 className="invite-form-title">
            {form.editingId ? 'Edit Invitation' : 'New Invitation'}
          </h2>

          <div className="admin-form">
            <div className="admin-field">
              <label htmlFor="invite-guest-name" className="admin-label">
                Guest Name
              </label>
              <input
                id="invite-guest-name"
                type="text"
                className="admin-input"
                placeholder="e.g. The Sharma Family"
                maxLength={MAX_GUEST_NAME_LENGTH}
                value={form.guestName}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, guestName: e.target.value }));
                  setFormError(null);
                }}
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <span className="admin-label">Events This Guest Can See</span>

              {presets.length > 0 && (
                <div className="invite-chip-row" role="group" aria-label="Guest group presets">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`invite-preset-btn ${isPresetActive(preset) ? 'is-active' : ''}`}
                      onClick={() => setSelection(preset.eventIds)}
                      disabled={saving}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="invite-select-actions">
                <button
                  type="button"
                  className="invite-link-btn"
                  onClick={() => setSelection(allEventIds)}
                  disabled={saving}
                >
                  Select all
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  className="invite-link-btn"
                  onClick={() => setSelection([])}
                  disabled={saving}
                >
                  Clear all
                </button>
                <span className="invite-selected-count">
                  {form.selected.length} of {allEventIds.length} selected
                </span>
              </div>

              <div className="invite-days">
                {days.map((day) => (
                  <fieldset key={day.isoDate} className="invite-day-group">
                    <legend className="invite-day-legend">
                      {day.date} · {day.dayOfWeek}
                    </legend>
                    {day.events.map((event) => (
                      <label key={event.id} className="invite-event-option">
                        <input
                          type="checkbox"
                          checked={form.selected.includes(event.id)}
                          onChange={() => toggleEvent(event.id)}
                          disabled={saving}
                        />
                        <span className="invite-event-time">{event.time}</span>
                        <span className="invite-event-title">{event.title}</span>
                      </label>
                    ))}
                  </fieldset>
                ))}
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="invite-notes" className="admin-label">
                Private Notes (optional)
              </label>
              <textarea
                id="invite-notes"
                className="admin-input invite-notes-input"
                rows={3}
                maxLength={MAX_NOTES_LENGTH}
                placeholder="Only visible to the family in this dashboard"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                disabled={saving}
              />
            </div>

            {formError && (
              <div className="admin-error-box" role="alert">
                {formError}
              </div>
            )}

            <div className="invite-form-actions">
              <button type="button" className="admin-logout-btn" onClick={closeForm} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="invite-primary-btn" disabled={saving}>
                {saving ? 'Saving...' : form.editingId ? 'Save Changes' : 'Create Invitation'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Invitation List */}
      {invitations.length === 0 ? (
        !isFormOpen && (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">💌</div>
            <h2 className="admin-empty-title">No Invitations Yet</h2>
            <p className="admin-empty-subtitle">
              Create a personal invitation for each guest and choose which celebrations they see.
            </p>
          </div>
        )
      ) : (
        <div className="wishes-list" aria-label="Guest Invitations">
          {invitations.map((invitation) => {
            const url = getInvitationUrl(invitation.token);
            const isBusy = busyId === invitation.id;
            return (
              <article key={invitation.id} className="wish-item-card invite-card">
                <div className="wish-item-top">
                  <span className="wish-guest-name">
                    <span className="wish-guest-heart">♥</span>
                    {invitation.guestName}
                  </span>
                  <span
                    className={`invite-status-pill ${invitation.isActive ? 'is-active' : 'is-revoked'}`}
                  >
                    {invitation.isActive ? 'Active' : 'Revoked'}
                  </span>
                </div>

                <div className="invite-event-chips" aria-label="Permitted events">
                  {invitation.allowedEventIds.map((id) => (
                    <span key={id} className="invite-event-chip">
                      {eventTitles[id] || id}
                    </span>
                  ))}
                </div>

                {invitation.notes && <p className="invite-card-notes">{invitation.notes}</p>}

                {invitation.isActive && (
                  <input
                    type="text"
                    className="admin-input invite-url-input"
                    value={url}
                    readOnly
                    aria-label={`Invitation link for ${invitation.guestName}`}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                )}

                <div className="invite-card-meta">
                  <span>Created {formatDate(invitation.createdAt)}</span>
                  <span>
                    Opened {invitation.viewCount} {invitation.viewCount === 1 ? 'time' : 'times'}
                    {invitation.lastViewedAt ? ` · last ${formatDate(invitation.lastViewedAt)}` : ''}
                  </span>
                </div>

                <div className="invite-card-actions">
                  {invitation.isActive && (
                    <>
                      <button
                        type="button"
                        className="invite-action-btn is-primary"
                        onClick={() => handleCopy(invitation)}
                        disabled={isBusy}
                      >
                        {copiedId === invitation.id ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button
                        type="button"
                        className="invite-action-btn"
                        onClick={() => handleWhatsApp(invitation)}
                        disabled={isBusy}
                      >
                        WhatsApp
                      </button>
                      {canNativeShare && (
                        <button
                          type="button"
                          className="invite-action-btn"
                          onClick={() => handleNativeShare(invitation)}
                          disabled={isBusy}
                        >
                          Share
                        </button>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    className="invite-action-btn"
                    onClick={() => handlePreview(invitation)}
                    disabled={isBusy}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="invite-action-btn"
                    onClick={() => openEditForm(invitation)}
                    disabled={isBusy}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="invite-action-btn"
                    onClick={() => handleRegenerate(invitation)}
                    disabled={isBusy}
                  >
                    {invitation.isActive ? 'New Link' : 'Restore with New Link'}
                  </button>
                  {invitation.isActive && (
                    <button
                      type="button"
                      className="invite-action-btn is-danger"
                      onClick={() => handleRevoke(invitation)}
                      disabled={isBusy}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
