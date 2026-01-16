'use client';

interface EditToggleProps {
  isLoggedIn: boolean;
  editMode: boolean;
  onToggle: () => void;
}

/**
 * EditToggle component - Yellow button in header
 * Only visible when logged in
 * Shows "Edit OFF" or "Edit ON" and toggles edit mode
 */
export function EditToggle({ isLoggedIn, editMode, onToggle }: EditToggleProps) {
  if (!isLoggedIn) return null;

  return (
    <button
      onClick={onToggle}
      className={`edit-toggle ${editMode ? 'active' : ''}`}
      title={editMode ? 'Disable editing' : 'Enable editing'}
    >
      Edit {editMode ? 'ON' : 'OFF'}
    </button>
  );
}
