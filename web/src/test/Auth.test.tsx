import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';

// Mock AuthContext
const mockLogin = vi.fn();
const mockSignup = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    signup: mockSignup,
    user: null,
    profile: null,
    settings: null,
    isLoading: false
  })
}));

describe('Auth Pages Validation & Error Handling', () => {
  it('displays "Please sign up first" on EMAIL_NOT_FOUND error in LoginPage', async () => {
    mockLogin.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          code: 'EMAIL_NOT_FOUND',
          error: 'Please sign up first'
        }
      }
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('alex@gmail.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'unknown@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Please sign up first');
      expect(screen.getByText(/Create an account with this email/i)).toBeInTheDocument();
    });
  });

  it('displays "This email is already registered. Please log in." on EMAIL_EXISTS error in SignupPage', async () => {
    mockSignup.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          code: 'EMAIL_EXISTS',
          error: 'This email is already registered. Please log in.'
        }
      }
    });

    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText('e.g. Alex Thomas');
    const emailInput = screen.getByPlaceholderText('alex@gmail.com');
    const passwordInput = screen.getByPlaceholderText('Minimum 8 characters');
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(nameInput, { target: { value: 'Alex Thomas' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('This email is already registered. Please log in.');
      expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    });
  });
});
