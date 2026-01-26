'use client';

export function PrintControls() {
  return (
    <div className="no-print print-controls">
      <button onClick={() => window.print()} className="print-button">
        🖨️ Print Sign
      </button>
      <button onClick={() => window.close()} className="close-button">
        Close
      </button>
    </div>
  );
}
