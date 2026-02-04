'use client';

import { useState } from 'react';
import { useTrackEvent } from '@/lib/analytics-client';

interface ShareButtonProps {
  url: string;
  title: string;
  text: string;
}

/**
 * ShareButton component with native Web Share API
 * Shares dynamic status image based on current system status
 */
export function ShareButton({ url, title, text }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const trackEvent = useTrackEvent();

  // Generate status image URL based on current page status
  const getStatusImageUrl = () => {
    const heat = document.querySelector('[data-system="heat"]')?.getAttribute('data-count') || '3/3';
    const water = document.querySelector('[data-system="water"]')?.getAttribute('data-count') || '3/3';
    const laundry = document.querySelector('[data-system="laundry"]')?.getAttribute('data-count') || '3/3';

    // Extract just the numerator (e.g., "3/3" -> "3")
    const h = heat.split('/')[0];
    const w = water.split('/')[0];
    const l = laundry.split('/')[0];

    return `https://petroleumjelliffe--d762e03aeb5911f09ff942dde27851f2.web.val.run/h${h}w${w}l${l}.png`;
  };

  const handleShare = async () => {
    setIsSharing(true);
    trackEvent('Share Clicked', {});

    try {
      const imageUrl = getStatusImageUrl();
      console.log('[ShareButton] Image URL:', imageUrl);

      const response = await fetch(imageUrl);
      console.log('[ShareButton] Fetch response:', response.status, response.statusText);

      const blob = await response.blob();
      console.log('[ShareButton] Blob type:', blob.type, 'size:', blob.size);

      const file = new File([blob], 'building-status.png', { type: 'image/png' });
      console.log('[ShareButton] File created:', file.name, file.type, file.size);

      // Check if sharing files is supported
      const canShareFiles = navigator.canShare?.({ files: [file] });
      console.log('[ShareButton] navigator.canShare with files:', canShareFiles);

      if (canShareFiles) {
        console.log('[ShareButton] Attempting to share with file...');
        await navigator.share({
          files: [file],
          title,
          text,
        });
        trackEvent('Share Completed', { method: 'native_file' });
        console.log('[ShareButton] Share with file succeeded');
      } else if (navigator.share) {
        // Fallback: share URL only
        console.log('[ShareButton] File sharing not supported, sharing URL only...');
        await navigator.share({
          title,
          text,
          url,
        });
        trackEvent('Share Completed', { method: 'native_url' });
        console.log('[ShareButton] Share URL succeeded');
      } else {
        // No share API - copy to clipboard
        console.log('[ShareButton] Web Share API not available, copying to clipboard');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          trackEvent('Share Completed', { method: 'clipboard' });
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          // Legacy clipboard fallback
          const input = document.createElement('input');
          input.value = url;
          input.style.position = 'fixed';
          input.style.opacity = '0';
          document.body.appendChild(input);
          input.select();
          const success = document.execCommand('copy');
          document.body.removeChild(input);

          if (success) {
            trackEvent('Share Completed', { method: 'clipboard_legacy' });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } else {
            alert(`Copy this URL:\n\n${url}`);
          }
        }
      }
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name === 'AbortError') {
        // User cancelled, just return
        console.log('[ShareButton] User cancelled share');
        return;
      }

      console.error('[ShareButton] Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`share-btn ${copied ? 'sharing' : ''}`}
      aria-label="Share"
      disabled={isSharing}
    >
      {isSharing ? (
        <>
          <span className="share-icon">⏳</span> Sharing...
        </>
      ) : copied ? (
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
