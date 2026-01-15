'use client';

import { useState } from 'react';

interface EditModeToggleProps {
  onEditModeChange: (enabled: boolean, password: string) => void;
}

/**
 * EditModeToggle component - handles password authentication and edit mode
 */
export function EditModeToggle({ onEditModeChange }: EditModeToggleProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleToggle = () => {
    if (isEditMode) {
      // Exit edit mode
      setIsEditMode(false);
      setPassword('');
      onEditModeChange(false, '');
    } else {
      // Enter edit mode - show password prompt
      setShowPasswordPrompt(true);
      setError('');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success && data.valid) {
        // Password is valid
        setIsEditMode(true);
        setShowPasswordPrompt(false);
        onEditModeChange(true, password);
      } else {
        // Invalid password
        setError('Invalid password');
        setPassword('');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setError('Error verifying password');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setShowPasswordPrompt(false);
    setPassword('');
    setError('');
  };

  return (
    <>
      {/* Edit mode badge */}
      {isEditMode && (
        <div className="edit-mode-badge">
          ✏️ Edit Mode Active
        </div>
      )}

      {/* Edit button */}
      <button onClick={handleToggle} className="edit-toggle-button">
        {isEditMode ? '🔒 Exit Edit Mode' : '✏️ Edit'}
      </button>

      {/* Password prompt modal */}
      {showPasswordPrompt && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Enter Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="password-input"
                autoFocus
                disabled={isVerifying}
              />
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isVerifying || password.length === 0}
                >
                  {isVerifying ? 'Verifying...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                  disabled={isVerifying}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
