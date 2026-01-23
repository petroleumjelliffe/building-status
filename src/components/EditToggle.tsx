'use client';

interface EditToggleProps {
  isLoggedIn: boolean;
  editMode: boolean;
  onToggle: () => void;
}

/**
 * EditToggle component - Yellow button in header
 * Only visible when logged in
 * Shows "Edit" or "Done" and toggles edit mode
 */
export function EditToggle({ isLoggedIn, editMode, onToggle }: EditToggleProps) {
  if (!isLoggedIn) return null;

  return (
    <button
      onClick={onToggle}
      className={`edit-toggle ${editMode ? 'active' : ''}`}
      title={editMode ? 'Disable editing' : 'Enable editing'}
    >
      {editMode ? 'Done' : 'Edit'}
    </button>
  );
}
