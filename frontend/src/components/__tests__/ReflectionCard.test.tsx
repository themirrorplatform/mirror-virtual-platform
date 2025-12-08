/**
 * ReflectionCard Component Tests
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { ReflectionCard } from '@/components/ReflectionCard'

// Mock the API module
jest.mock('@/lib/api', () => ({
  mirrorbacks: {
    create: jest.fn()
  },
  signals: {
    create: jest.fn()
  }
}))

describe('ReflectionCard', () => {
  const mockItem = {
    reflection: {
      id: 1,
      author_id: 'user-123',
      body: 'This is a test reflection about identity and growth.',
      lens_key: 'identity',
      tone: 'raw',
      visibility: 'public',
      created_at: '2025-12-07T00:00:00Z',
      metadata: {}
    },
    author: {
      id: 'user-123',
      username: 'testuser',
      display_name: 'Test User',
      avatar_url: '/avatar.jpg'
    },
    mirrorback_count: 2,
    signal_counts: {
      view: 10,
      respond: 3,
      save: 1,
      skip: 0,
      mute: 0
    },
    user_signal: null
  }

  it('renders reflection content', () => {
    render(<ReflectionCard item={mockItem} />)
    
    expect(screen.getByText(/This is a test reflection/)).toBeInTheDocument()
  })

  it('displays author information', () => {
    render(<ReflectionCard reflection={mockReflection} />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('@testuser')).toBeInTheDocument()
  })

  it('shows tone indicator', () => {
    render(<ReflectionCard reflection={mockReflection} />)
    
    expect(screen.getByText(/raw/i)).toBeInTheDocument()
  })

  it('displays lens badge', () => {
    render(<ReflectionCard reflection={mockReflection} />)
    
    expect(screen.getByText(/identity/i)).toBeInTheDocument()
  })

  it('calls onReflect when interact button clicked', () => {
    const onReflect = jest.fn()
    render(<ReflectionCard reflection={mockReflection} onReflect={onReflect} />)
    
    const reflectButton = screen.getByRole('button', { name: /reflect/i })
    fireEvent.click(reflectButton)
    
    expect(onReflect).toHaveBeenCalledWith(mockReflection)
  })

  it('shows timestamp', () => {
    render(<ReflectionCard reflection={mockReflection} />)
    
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })

  it('handles long reflection text', () => {
    const longReflection = {
      ...mockReflection,
      body: 'A'.repeat(1000)
    }
    
    render(<ReflectionCard reflection={longReflection} />)
    
    expect(screen.getByText(/A+/)).toBeInTheDocument()
  })

  it('applies correct CSS class for visibility', () => {
    const { container } = render(<ReflectionCard reflection={mockReflection} />)
    
    expect(container.firstChild).toHaveClass('reflection-card')
  })
})
