import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobCard } from '../components/jobs/JobCard';
import { JobDetail } from '../components/jobs/JobDetail';
import { Job } from '../types';

const mockJob: Job = {
  id: 'job-test-1',
  title: 'Backend Software Engineer',
  company: 'Razorpay',
  location: 'Bengaluru, Karnataka',
  salary: '₹14,00,000 - ₹20,00,000 a year',
  source: 'Greenhouse',
  apply_url: 'https://boards.greenhouse.io/razorpay/jobs/12345',
  description: 'Design and build resilient payment infrastructure using Python and PostgreSQL.',
  skills: ['Python', 'PostgreSQL', 'Docker', 'FastAPI'],
  match: {
    score: 85,
    matching_skills: ['Python', 'SQL'],
    learn_next: ['Kafka']
  }
};

describe('JobCard Component', () => {
  it('renders title, company, location, and match score correctly', () => {
    const handleSelect = vi.fn();
    render(<JobCard job={mockJob} onSelect={handleSelect} />);

    expect(screen.getByText('Backend Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Razorpay')).toBeInTheDocument();
    expect(screen.getByText('Bengaluru, Karnataka')).toBeInTheDocument();
    expect(screen.getByText('85% Match')).toBeInTheDocument();
    expect(screen.getByText('₹14,00,000 - ₹20,00,000 a year')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Backend Software Engineer'));
    expect(handleSelect).toHaveBeenCalledWith(mockJob);
  });
});

describe('JobDetail Component', () => {
  it('renders skill breakdown, copy kit button, and apply button', () => {
    const handleApply = vi.fn();
    render(<JobDetail job={mockJob} onApply={handleApply} />);

    expect(screen.getByText('Backend Software Engineer')).toBeInTheDocument();
    expect(screen.getByText(/Skill Alignment Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText('✓ Python')).toBeInTheDocument();
    expect(screen.getByText('+ Kafka')).toBeInTheDocument();
    expect(screen.getByText(/Apply on Greenhouse/i)).toBeInTheDocument();
    expect(screen.getByText(/Copy application kit/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Apply on Greenhouse/i));
    expect(handleApply).toHaveBeenCalledWith(mockJob);
  });
});

