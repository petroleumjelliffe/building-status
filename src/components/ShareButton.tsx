'use client';

import { useState } from 'react';

interface ShareButtonProps {
  url: string;
  title: string;
  text: string;
}

/**
 * ShareButton component with native Web Share API
 * Falls back to copy-to-clipboard if share not available
 */
export function ShareButton({ url, title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        alert('Failed to copy URL');
      }
    }
  };

  return (
    <button onClick={handleShare} className={`share-btn ${copied ? 'sharing' : ''}`} aria-label="Share">
      {copied ? (
        <>
          <span className="share-icon">✓</span> Copied!
        </>
      ) : (
        <>
          <span className="share-icon">↗</span> Share
        </>
      )}
    </button>
  );
}
