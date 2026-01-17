'use client';

import { useState } from 'react';

interface HamburgerMenuProps {
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

/**
 * HamburgerMenu component - Always visible in header
 * Shows Login button when not logged in
 * Shows Logout button when logged in
 */
export function HamburgerMenu({ isLoggedIn, onLoginClick, onLogoutClick }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const handleLoginClick = () => {
    handleClose();
    onLoginClick();
  };

  const handleLogoutClick = () => {
    handleClose();
    onLogoutClick();
  };

  // Close menu when clicking outside
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <>
      {/* Hamburger icon */}
      <button
        onClick={handleOpen}
        className="hamburger-icon"
        title="Menu"
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Menu overlay */}
      {isOpen && (
        <div className="hamburger-overlay" onClick={handleOverlayClick}>
          <div className="hamburger-menu">
            <button
              className="hamburger-close"
              onClick={handleClose}
              aria-label="Close menu"
            >
              ✕
            </button>

            <div className="hamburger-content">
              {isLoggedIn ? (
                <>
                  <div className="hamburger-status">
                    👤 Logged in
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleLogoutClick}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleLoginClick}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
