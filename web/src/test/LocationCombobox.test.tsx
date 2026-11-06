import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationCombobox } from '../components/search/LocationCombobox';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('LocationCombobox', () => {
  it('renders input with combobox aria role and placeholder', () => {
    render(<LocationCombobox value="" onChange={vi.fn()} placeholder="Test Location..." />);
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('placeholder', 'Test Location...');
  });

  it('triggers autocomplete fetch on typing and displays options', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { type: 'city', name: 'Bengaluru', state: 'Karnataka', label: 'Bengaluru, Karnataka', value: 'Bengaluru' },
        { type: 'state', name: 'Karnataka', state: null, label: 'Karnataka (State)', value: 'Karnataka' },
      ],
    });

    const handleChange = vi.fn();
    render(<LocationCombobox value="" onChange={handleChange} />);
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'Beng' } });

    await waitFor(() => {
      expect(screen.getByText('Bengaluru, Karnataka')).toBeInTheDocument();
      expect(screen.getByText('Karnataka (State)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Bengaluru, Karnataka'));
    expect(handleChange).toHaveBeenCalledWith('Bengaluru');
  });

  it('clears selection when clear button is clicked', () => {
    const handleChange = vi.fn();
    render(<LocationCombobox value="Hyderabad" onChange={handleChange} />);
    const clearBtn = screen.getByLabelText('Clear location');
    fireEvent.click(clearBtn);
    expect(handleChange).toHaveBeenCalledWith('');
  });
});

