import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../components/search/FilterBar';
import { useFilterStore } from '../stores/filterStore';

describe('FilterBar', () => {
  it('renders title input, location combobox, and filter dropdowns', () => {
    useFilterStore.getState().resetFilters();
    render(<FilterBar />);

    expect(screen.getByPlaceholderText('Job title, skill or keywords...')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /location/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Work Mode')).toBeInTheDocument();
    expect(screen.getByLabelText('Experience level')).toBeInTheDocument();
    expect(screen.getByLabelText('Date posted')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
  });

  it('updates store when work mode is selected', () => {
    useFilterStore.getState().resetFilters();
    render(<FilterBar />);

    const select = screen.getByLabelText('Work Mode');
    fireEvent.change(select, { target: { value: 'remote' } });

    expect(useFilterStore.getState().workMode).toBe('remote');
    expect(useFilterStore.getState().page).toBe(1);
  });

  it('updates store when experience is selected', () => {
    useFilterStore.getState().resetFilters();
    render(<FilterBar />);

    const select = screen.getByLabelText('Experience level');
    fireEvent.change(select, { target: { value: 'fresher' } });

    expect(useFilterStore.getState().experience).toBe('fresher');
    expect(useFilterStore.getState().page).toBe(1);
  });
});
