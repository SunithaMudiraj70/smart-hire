import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ApplyConfirmModal } from '../components/modals/ApplyConfirmModal';

vi.mock('../lib/confetti', () => ({
  triggerConfetti: vi.fn(),
  triggerStageCelebration: vi.fn(),
}));

describe('ApplyConfirmModal Component', () => {
  it('renders modal dialog with company and position title', () => {
    const handleConfirm = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <ApplyConfirmModal
        jobTitle="Staff Software Engineer"
        companyName="Stripe"
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />
    );

    expect(screen.getByText(/Application Follow-up/i)).toBeInTheDocument();
    expect(screen.getByText(/Staff Software Engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/Stripe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yes, I applied!/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Not yet/i })).toBeInTheDocument();
  });

  it('calls onConfirm when candidate clicks "Yes, I applied!"', () => {
    const handleConfirm = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <ApplyConfirmModal
        jobTitle="Staff Software Engineer"
        companyName="Stripe"
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Yes, I applied!/i });
    fireEvent.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when candidate clicks "Not yet"', () => {
    const handleConfirm = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <ApplyConfirmModal
        jobTitle="Staff Software Engineer"
        companyName="Stripe"
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />
    );

    const notYetBtn = screen.getByRole('button', { name: /Not yet/i });
    fireEvent.click(notYetBtn);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
