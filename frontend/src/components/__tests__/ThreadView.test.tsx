/**
 * ThreadView Component Tests
 */
import { render, screen, fireEvent } from '@testing-library/react'
import ThreadView from '@/components/ThreadView'

describe('ThreadView', () => {
  const mockThread = {
    id: 'thread-123',
    creator_id: 'user-123',
    title: 'Identity Exploration Thread',
    visibility: 'public',
    created_at: '2025-12-07T00:00:00Z',
    reflections: [
      {
        id: 1,
        body: 'First reflection in thread',
        author: { username: 'user1', display_name: 'User One' }
      },
      {
        id: 2,
        body: 'Second reflection in thread',
        author: { username: 'user2', display_name: 'User Two' }
      }
    ]
  }

  it('renders thread title', () => {
    render(<ThreadView thread={mockThread} />)
    
    expect(screen.getByText('Identity Exploration Thread')).toBeInTheDocument()
  })

  it('displays all reflections in order', () => {
    render(<ThreadView thread={mockThread} />)
    
    expect(screen.getByText('First reflection in thread')).toBeInTheDocument()
    expect(screen.getByText('Second reflection in thread')).toBeInTheDocument()
  })

  it('shows timeline view', () => {
    render(<ThreadView thread={mockThread} />)
    
    const timeline = screen.getByRole('list')
    expect(timeline).toBeInTheDocument()
  })

  it('allows adding reflection to thread', () => {
    const onAddReflection = jest.fn()
    render(<ThreadView thread={mockThread} onAddReflection={onAddReflection} />)
    
    const addButton = screen.getByRole('button', { name: /add to thread/i })
    fireEvent.click(addButton)
    
    expect(onAddReflection).toHaveBeenCalled()
  })

  it('shows thread metadata', () => {
    render(<ThreadView thread={mockThread} />)
    
    expect(screen.getByText(/public/i)).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })

  it('handles empty thread', () => {
    const emptyThread = { ...mockThread, reflections: [] }
    render(<ThreadView thread={emptyThread} />)
    
    expect(screen.getByText(/no reflections yet/i)).toBeInTheDocument()
  })

  it('allows reordering reflections if owner', () => {
    const onReorder = jest.fn()
    render(<ThreadView thread={mockThread} isOwner={true} onReorder={onReorder} />)
    
    expect(screen.getByRole('button', { name: /reorder/i })).toBeInTheDocument()
  })
})
