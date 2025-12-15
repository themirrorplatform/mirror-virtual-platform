import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@test/utils/render';
import MirrorBackDisplay from '../MirrorBackDisplay';
import { mockMirrorback } from '@test/mocks/reflectionData';

describe('MirrorBackDisplay', () => {
  beforeEach(() => {
    // Reset clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  });

  it('renders mirrorback content correctly', () => {
    render(<MirrorBackDisplay mirrorback={mockMirrorback} />);
    
    expect(screen.getByText(mockMirrorback.content)).toBeInTheDocument();
  });

  it('displays source indicator for AI', () => {
    render(<MirrorBackDisplay mirrorback={mockMirrorback} />);
    
    expect(screen.getByText('AI Generated')).toBeInTheDocument();
    expect(screen.getByText(/claude-3-5-sonnet/i)).toBeInTheDocument();
  });

  it('displays source indicator for human', () => {
    const humanMirrorback = {
      ...mockMirrorback,
      source: 'human' as const
    };
    
    render(<MirrorBackDisplay mirrorback={humanMirrorback} />);
    
    expect(screen.getByText('Human Response')).toBeInTheDocument();
  });

  it('shows tone badge correctly', () => {
    render(<MirrorBackDisplay mirrorback={mockMirrorback} />);
    
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('displays metadata in detailed variant', () => {
    render(<MirrorBackDisplay mirrorback={mockMirrorback} variant="detailed" />);
    
    expect(screen.getByText(/1250ms/i)).toBeInTheDocument();
    expect(screen.getByText(/87%/i)).toBeInTheDocument(); // confidence
  });

  it('shows patterns surfaced', () => {
    render(<MirrorBackDisplay mirrorback={mockMirrorback} variant="detailed" />);
    
    expect(screen.getByText('identity_tension')).toBeInTheDocument();
    expect(screen.getByText('authenticity_exploration')).toBeInTheDocument();
  });

  it('handles helpful feedback', async () => {
    const onFeedback = vi.fn();
    render(
      <MirrorBackDisplay mirrorback={mockMirrorback} onFeedback={onFeedback} />
    );
    
    const helpfulButton = screen.getByRole('button', { name: /helpful/i });
    fireEvent.click(helpfulButton);
    
    // Feedback form should appear
    await waitFor(() => {
      expect(screen.getByText(/What made this response helpful?/i)).toBeInTheDocument();
    });
  });

  it('handles unhelpful feedback', async () => {
    const onFeedback = vi.fn();
    render(
      <MirrorBackDisplay mirrorback={mockMirrorback} onFeedback={onFeedback} />
    );
    
    const unhelpfulButton = screen.getByRole('button', { name: /not helpful/i });
    fireEvent.click(unhelpfulButton);
    
    await waitFor(() => {
      expect(screen.getByText(/How could this response be improved?/i)).toBeInTheDocument();
    });
  });

  it('submits feedback with comment', async () => {
    const onFeedback = vi.fn();
    render(
      <MirrorBackDisplay mirrorback={mockMirrorback} onFeedback={onFeedback} />
    );
    
    // Click helpful
    fireEvent.click(screen.getByRole('button', { name: /helpful/i }));
    
    // Wait for form
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/share your thoughts/i)).toBeInTheDocument();
    });
    
    // Type comment
    const textarea = screen.getByPlaceholderText(/share your thoughts/i);
    fireEvent.change(textarea, { target: { value: 'Very insightful response' } });
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(onFeedback).toHaveBeenCalledWith({
      mirrorbackId: mockMirrorback.id,
      type: 'helpful',
      comment: 'Very insightful response'
    });
  });

  it('copies content to clipboard', async () => {
    render(<MirrorBackDisplay mirrorback={mockMirrorback} />);
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockMirrorback.content);
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('renders compact variant correctly', () => {
    render(<MirrorBackDisplay mirrorback={mockMirrorback} variant="compact" />);
    
    // Compact variant should have line-clamp
    const content = screen.getByText(mockMirrorback.content);
    expect(content.className).toContain('line-clamp-3');
  });

  it('hides actions when showActions is false', () => {
    render(<MirrorBackDisplay mirrorback={mockMirrorback} showActions={false} />);
    
    expect(screen.queryByRole('button', { name: /helpful/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
  });

  it('displays constitutional transparency note', () => {
    render(<MirrorBackDisplay mirrorback={mockMirrorback} />);
    
    expect(screen.getByText(/Constitutional Commitment/i)).toBeInTheDocument();
  });
});
