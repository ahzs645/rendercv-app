import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { PricingPage } from './pricing-page';

describe('PricingPage', () => {
  it('renders pricing cards', () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <PricingPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Choose Plus')).toBeInTheDocument();
    expect(screen.getByText('Choose Pro')).toBeInTheDocument();
  });
});
