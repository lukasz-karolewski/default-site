// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SiteCrud from '../SiteCrud';

const SITES = [
  { id: '1', host: 'alpha.com', upstream: 'localhost:3001' },
  { id: '2', host: 'beta.com', upstream: 'localhost:3002' },
];

function mockFetch(overrides: Record<string, unknown> = {}) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => SITES,
    ...overrides,
  } as unknown as Response);
}

const hostPlaceholder = 'Host (e.g. example.com)';
const upstreamPlaceholder = 'Upstream (e.g. localhost:3000)';

describe('SiteCrud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch();
  });

  it('renders the manage sites heading', async () => {
    render(<SiteCrud />);
    expect(screen.getByText('Manage Sites')).toBeInTheDocument();
  });

  it('loads and displays sites on mount', async () => {
    render(<SiteCrud />);
    await waitFor(() => {
      expect(screen.getByText('alpha.com')).toBeInTheDocument();
      expect(screen.getByText('beta.com')).toBeInTheDocument();
    });
  });

  it('renders host and upstream inputs and a submit button', async () => {
    render(<SiteCrud />);
    // Wait for initial fetch to settle before asserting
    await waitFor(() => screen.getByText('alpha.com'));
    expect(screen.getByPlaceholderText(hostPlaceholder)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(upstreamPlaceholder)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add site/i })).toBeInTheDocument();
  });

  it('calls POST and refreshes the list when the add form is submitted', async () => {
    const user = userEvent.setup();
    render(<SiteCrud />);
    await waitFor(() => screen.getByText('alpha.com'));

    await user.type(screen.getByPlaceholderText(hostPlaceholder), 'new.com');
    await user.type(screen.getByPlaceholderText(upstreamPlaceholder), 'localhost:9000');
    await user.click(screen.getByRole('button', { name: /add site/i }));

    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const postCall = calls.find(([, opts]) => opts?.method === 'POST');
      expect(postCall).toBeDefined();
      expect(JSON.parse(postCall![1].body)).toMatchObject({
        host: 'new.com',
        upstream: 'localhost:9000',
      });
    });
  });

  it('populates the form for editing when Edit is clicked', async () => {
    const user = userEvent.setup();
    render(<SiteCrud />);
    await waitFor(() => screen.getByText('alpha.com'));

    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]);

    expect(screen.getByDisplayValue('alpha.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('localhost:3001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update site/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('clears the form and hides Cancel when Cancel is clicked during edit', async () => {
    const user = userEvent.setup();
    render(<SiteCrud />);
    await waitFor(() => screen.getByText('alpha.com'));

    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]);
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByPlaceholderText(hostPlaceholder)).toHaveValue('');
    expect(screen.getByPlaceholderText(upstreamPlaceholder)).toHaveValue('');
    expect(screen.getByRole('button', { name: /add site/i })).toBeInTheDocument();
  });

  it('calls DELETE and refreshes the list when Delete is clicked', async () => {
    const user = userEvent.setup();
    render(<SiteCrud />);
    await waitFor(() => screen.getByText('alpha.com'));

    await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const deleteCall = calls.find(([, opts]) => opts?.method === 'DELETE');
      expect(deleteCall).toBeDefined();
      expect(JSON.parse(deleteCall![1].body)).toMatchObject({ id: '1' });
    });
  });
});
