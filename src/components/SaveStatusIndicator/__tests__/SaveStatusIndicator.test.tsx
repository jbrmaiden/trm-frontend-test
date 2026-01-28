import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { useSanctionedStore } from '@/stores/sanctionedStore';
import SaveStatusIndicator from '../index';

describe('SaveStatusIndicator', () => {
  beforeEach(() => {
    useSanctionedStore.setState({ addresses: [], lastSaved: null });
  });

  it('does not render when there is no lastSaved timestamp', () => {
    render(<SaveStatusIndicator />);

    expect(screen.queryByText(/Saved/)).not.toBeInTheDocument();
  });

  it('shows a \"just now\" message for very recent saves', () => {
    useSanctionedStore.setState({ addresses: [], lastSaved: Date.now() - 30_000 });

    render(<SaveStatusIndicator />);

    expect(screen.getByText(/Saved just now/)).toBeInTheDocument();
  });

  it('shows minutes ago for older timestamps', () => {
    useSanctionedStore.setState({ addresses: [], lastSaved: Date.now() - 2 * 60 * 1000 });

    render(<SaveStatusIndicator />);

    expect(screen.getByText(/Saved \d+ minutes ago/)).toBeInTheDocument();
  });
});
