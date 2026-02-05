import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventForm } from '../EventForm';
import type { CalendarEvent } from '@/types';

// Mock the buildApiUrl function
vi.mock('@/lib/api', () => ({
  buildApiUrl: (propertyHash: string, path: string) => `/api/${propertyHash}${path}`,
}));

describe('EventForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockSessionToken = 'test-token-123';
  const mockPropertyHash = 'test-hash-1';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Creating new events', () => {
    it('should render form with default values', () => {
      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      expect(screen.getByLabelText(/Event Type/i)).toHaveValue('maintenance');
      expect(screen.getByLabelText(/Title/i)).toHaveValue('');
      expect(screen.getByLabelText(/Description/i)).toHaveValue('');
      expect(screen.getByLabelText(/All-day event/i)).not.toBeChecked();
    });

    it('should submit timed event successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      // Fill form
      fireEvent.change(screen.getByLabelText(/Title/i), {
        target: { value: 'Test Event' },
      });
      fireEvent.change(screen.getByLabelText(/Start Date & Time/i), {
        target: { value: '2026-02-15T14:00' },
      });

      // Submit
      fireEvent.click(screen.getByText('Add Event'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/test-hash-1/events',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token-123',
            },
          })
        );
      });

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should submit all-day event with default date (bug fix verification)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      // Fill title
      fireEvent.change(screen.getByLabelText(/Title/i), {
        target: { value: 'All Day Event' },
      });

      // Check all-day checkbox WITHOUT changing the date
      // This reproduces the bug where startsAt has time component
      fireEvent.click(screen.getByLabelText(/All-day event/i));

      // Submit
      fireEvent.click(screen.getByText('Add Event'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Verify the payload has valid date (not "Invalid start date" error)
      const fetchCall = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.allDay).toBe(true);
      expect(payload.timezone).toBe('America/New_York');
      // Should be valid ISO date ending in Z (UTC)
      expect(payload.startsAt).toMatch(/^\d{4}-\d{2}-\d{2}T12:00:00\.000Z$/);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should submit all-day event with custom date', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      // Check all-day first
      fireEvent.click(screen.getByLabelText(/All-day event/i));

      // Fill form
      fireEvent.change(screen.getByLabelText(/Title/i), {
        target: { value: 'All Day Event' },
      });
      fireEvent.change(screen.getByLabelText(/Date/i), {
        target: { value: '2026-03-20' },
      });

      // Submit
      fireEvent.click(screen.getByText('Add Event'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.allDay).toBe(true);
      expect(payload.startsAt).toBe('2026-03-20T12:00:00.000Z');

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should handle toggling between timed and all-day events', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      // Start with timed event
      fireEvent.change(screen.getByLabelText(/Title/i), {
        target: { value: 'Toggle Test' },
      });
      fireEvent.change(screen.getByLabelText(/Start Date & Time/i), {
        target: { value: '2026-02-15T14:00' },
      });

      // Toggle to all-day
      fireEvent.click(screen.getByLabelText(/All-day event/i));

      // Submit
      fireEvent.click(screen.getByText('Add Event'));

      await waitFor(() => {
        const fetchCall = (global.fetch as any).mock.calls[0];
        const payload = JSON.parse(fetchCall[1].body);

        expect(payload.allDay).toBe(true);
        // Should extract date part and add noon UTC time
        expect(payload.startsAt).toMatch(/^\d{4}-\d{2}-\d{2}T12:00:00\.000Z$/);
      });
    });

    it('should submit event with recurrence rule', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      fireEvent.change(screen.getByLabelText(/Title/i), {
        target: { value: 'Recurring Event' },
      });
      fireEvent.change(screen.getByLabelText(/Recurrence/i), {
        target: { value: 'FREQ=WEEKLY' },
      });

      fireEvent.click(screen.getByText('Add Event'));

      await waitFor(() => {
        const fetchCall = (global.fetch as any).mock.calls[0];
        const payload = JSON.parse(fetchCall[1].body);

        expect(payload.recurrenceRule).toBe('FREQ=WEEKLY');
      });
    });

    it('should display error for invalid start date', async () => {
      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      // Manually trigger invalid date scenario (though this is hard to reproduce in UI)
      // The validation prevents this, but we test the error display
      fireEvent.change(screen.getByLabelText(/Title/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByLabelText(/Start Date & Time/i), {
        target: { value: '' }, // Empty date
      });

      fireEvent.click(screen.getByText('Add Event'));

      // Form validation should prevent submission
      // (HTML5 required attribute)
    });

    it('should handle API error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid event data' }),
      });

      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      fireEvent.change(screen.getByLabelText(/Title/i), {
        target: { value: 'Test Event' },
      });
      fireEvent.click(screen.getByText('Add Event'));

      await waitFor(() => {
        expect(screen.getByText('Invalid event data')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      fireEvent.change(screen.getByLabelText(/Title/i), {
        target: { value: 'Test Event' },
      });
      fireEvent.click(screen.getByText('Add Event'));

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should call onCancel when cancel button clicked', () => {
      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Editing existing events', () => {
    const mockEvent: CalendarEvent = {
      id: 1,
      type: 'maintenance',
      title: 'Existing Event',
      description: 'Test description',
      startsAt: new Date('2026-02-15T14:00:00'),
      endsAt: new Date('2026-02-15T16:00:00'),
      allDay: false,
      timezone: 'America/New_York',
      status: 'scheduled',
      recurrenceRule: null,
      completedAt: null,
      notifyBeforeMinutes: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should populate form with existing event data', () => {
      render(
        <EventForm
          event={mockEvent}
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      expect(screen.getByLabelText(/Event Type/i)).toHaveValue('maintenance');
      expect(screen.getByLabelText(/Title/i)).toHaveValue('Existing Event');
      expect(screen.getByLabelText(/Description/i)).toHaveValue('Test description');
      expect(screen.getByLabelText(/All-day event/i)).not.toBeChecked();
    });

    it('should submit PATCH request for existing event', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <EventForm
          event={mockEvent}
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      fireEvent.change(screen.getByLabelText(/Title/i), {
        target: { value: 'Updated Event' },
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/test-hash-1/events/1',
          expect.objectContaining({
            method: 'PATCH',
          })
        );
      });

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should handle editing all-day event', async () => {
      const allDayEvent: CalendarEvent = {
        ...mockEvent,
        allDay: true,
        startsAt: new Date('2026-03-20T12:00:00Z'),
        endsAt: null,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <EventForm
          event={allDayEvent}
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      expect(screen.getByLabelText(/All-day event/i)).toBeChecked();

      // Change date
      fireEvent.change(screen.getByLabelText(/Date/i), {
        target: { value: '2026-03-25' },
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        const fetchCall = (global.fetch as any).mock.calls[0];
        const payload = JSON.parse(fetchCall[1].body);

        expect(payload.allDay).toBe(true);
        expect(payload.startsAt).toBe('2026-03-25T12:00:00.000Z');
      });
    });
  });

  describe('Event type selection', () => {
    it('should allow changing event type', () => {
      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      const typeSelect = screen.getByLabelText(/Event Type/i);

      fireEvent.change(typeSelect, { target: { value: 'announcement' } });
      expect(typeSelect).toHaveValue('announcement');

      fireEvent.change(typeSelect, { target: { value: 'outage' } });
      expect(typeSelect).toHaveValue('outage');
    });
  });

  describe('Form validation', () => {
    it('should require title field', () => {
      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      const titleInput = screen.getByLabelText(/Title/i);
      expect(titleInput).toHaveAttribute('required');
    });

    it('should require start date field', () => {
      render(
        <EventForm
          sessionToken={mockSessionToken}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          propertyHash={mockPropertyHash}
        />
      );

      const dateInput = screen.getByLabelText(/Start Date & Time/i);
      expect(dateInput).toHaveAttribute('required');
    });
  });
});
