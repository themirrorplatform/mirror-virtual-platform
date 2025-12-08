/**
 * MirrorbackCard Component Tests
 */
import { render, screen, fireEvent } from '@testing-library/react'
import MirrorbackCard from '@/components/MirrorbackCard'

describe('MirrorbackCard', () => {
  const mockMirrorback = {
    id: 1,
    reflection_id: 100,
    author_id: 'ai-system',
    source: 'ai',
    body: 'What does growth mean to you in this moment?',
    tone: 'reflective',
    tensions: ['work-life balance', 'ambition vs rest'],
    metadata: {},
    created_at: '2025-12-07T00:00:00Z'
  }

  it('renders mirrorback content', () => {
    render(<MirrorbackCard mirrorback={mockMirrorback} />)
    
    expect(screen.getByText(/What does growth mean to you/)).toBeInTheDocument()
  })

  it('displays AI source indicator', () => {
    render(<MirrorbackCard mirrorback={mockMirrorback} />)
    
    expect(screen.getByText(/AI/i)).toBeInTheDocument()
  })

  it('shows identified tensions', () => {
    render(<MirrorbackCard mirrorback={mockMirrorback} />)
    
    expect(screen.getByText(/work-life balance/)).toBeInTheDocument()
    expect(screen.getByText(/ambition vs rest/)).toBeInTheDocument()
  })

  it('displays reflective questions with question marks', () => {
    render(<MirrorbackCard mirrorback={mockMirrorback} />)
    
    const body = screen.getByText(/What does growth mean/)
    expect(body.textContent).toContain('?')
  })

  it('differentiates human vs AI mirrorbacks', () => {
    const humanMirrorback = { ...mockMirrorback, source: 'human' }
    render(<MirrorbackCard mirrorback={humanMirrorback} />)
    
    expect(screen.queryByText(/AI/i)).not.toBeInTheDocument()
  })

  it('handles mirrorback with no tensions', () => {
    const noTensions = { ...mockMirrorback, tensions: [] }
    render(<MirrorbackCard mirrorback={noTensions} />)
    
    expect(screen.queryByText(/tensions/i)).not.toBeInTheDocument()
  })

  it('applies MirrorCore styling (no advice)', () => {
    const { container } = render(<MirrorbackCard mirrorback={mockMirrorback} />)
    
    // Should not contain prescriptive language
    expect(screen.queryByText(/you should/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/you must/i)).not.toBeInTheDocument()
  })

  it('shows tone indicator', () => {
    render(<MirrorbackCard mirrorback={mockMirrorback} />)
    
    expect(screen.getByText(/reflective/i)).toBeInTheDocument()
  })
})
