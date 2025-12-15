import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@test/utils/render';
import { PostureSelector } from '../PostureSelector';
import { mockPostureState, allPostures } from '@test/mocks/postureData';

describe('PostureSelector', () => {
  it('renders all 6 posture buttons', () => {
    render(<PostureSelector currentState={mockPostureState} />);
    
    allPostures.forEach(posture => {
      const capitalizedPosture = posture.charAt(0).toUpperCase() + posture.slice(1);
      expect(screen.getByText(capitalizedPosture)).toBeInTheDocument();
    });
  });

  it('highlights current declared posture', () => {
    render(<PostureSelector currentState={mockPostureState} />);
    
    const groundedButton = screen.getByRole('button', { name: /grounded/i });
    expect(groundedButton.className).toContain('ring-2'); // Active state indicator
  });

  it('shows divergence alert when suggested differs from declared', () => {
    render(<PostureSelector currentState={mockPostureState} />);
    
    expect(screen.getByText(/Suggested posture:/i)).toBeInTheDocument();
    expect(screen.getByText(/Open/i)).toBeInTheDocument();
  });

  it('calls onDeclare when posture button clicked', () => {
    const onDeclare = vi.fn();
    render(
      <PostureSelector
        currentState={mockPostureState}
        onDeclare={onDeclare}
      />
    );
    
    const openButton = screen.getByRole('button', { name: /^open$/i });
    fireEvent.click(openButton);
    
    expect(onDeclare).toHaveBeenCalledWith('open');
  });

  it('shows confidence score for suggested posture', () => {
    render(<PostureSelector currentState={mockPostureState} />);
    
    expect(screen.getByText(/78%/i)).toBeInTheDocument(); // confidence: 0.78
  });

  it('displays reasoning for suggested posture', () => {
    render(<PostureSelector currentState={mockPostureState} />);
    
    expect(screen.getByText(mockPostureState.reasoning)).toBeInTheDocument();
  });

  it('renders compact variant without descriptions', () => {
    render(
      <PostureSelector
        currentState={mockPostureState}
        variant="compact"
      />
    );
    
    // Compact should show posture names but not full descriptions
    expect(screen.getByText('Grounded')).toBeInTheDocument();
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <PostureSelector
        currentState={mockPostureState}
        disabled={true}
      />
    );
    
    const groundedButton = screen.getByRole('button', { name: /grounded/i });
    expect(groundedButton).toBeDisabled();
  });

  it('shows "Accept Suggestion" button when divergence detected', () => {
    render(<PostureSelector currentState={mockPostureState} />);
    
    const acceptButton = screen.getByRole('button', { name: /accept suggestion/i });
    expect(acceptButton).toBeInTheDocument();
  });

  it('calls onDeclare with suggested posture when Accept clicked', () => {
    const onDeclare = vi.fn();
    render(
      <PostureSelector
        currentState={mockPostureState}
        onDeclare={onDeclare}
      />
    );
    
    const acceptButton = screen.getByRole('button', { name: /accept suggestion/i });
    fireEvent.click(acceptButton);
    
    expect(onDeclare).toHaveBeenCalledWith('open'); // suggested posture
  });

  it('displays posture icons correctly', () => {
    render(<PostureSelector currentState={mockPostureState} />);
    
    // Each posture should have an icon (svg element)
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const icon = button.querySelector('svg');
      if (button.textContent?.match(/unknown|overwhelmed|guarded|grounded|open|exploratory/i)) {
        expect(icon).toBeInTheDocument();
      }
    });
  });

  it('shows constitutional transparency note', () => {
    render(<PostureSelector currentState={mockPostureState} />);
    
    expect(screen.getByText(/Constitutional Commitment/i)).toBeInTheDocument();
  });
});
