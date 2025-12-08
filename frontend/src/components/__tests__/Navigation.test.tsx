/**
 * Navigation Component Tests
 */
import { render, screen, fireEvent } from '@testing-library/react'
import Navigation from '@/components/Navigation'

describe('Navigation', () => {
  it('renders navigation links', () => {
    render(<Navigation />)
    
    expect(screen.getByText(/Feed/i)).toBeInTheDocument()
    expect(screen.getByText(/Reflect/i)).toBeInTheDocument()
    expect(screen.getByText(/Identity/i)).toBeInTheDocument()
  })

  it('highlights active route', () => {
    render(<Navigation currentPath="/feed" />)
    
    const feedLink = screen.getByText(/Feed/i).closest('a')
    expect(feedLink).toHaveClass('active')
  })

  it('shows user profile when authenticated', () => {
    const user = { username: 'testuser', avatar_url: '/avatar.jpg' }
    render(<Navigation user={user} />)
    
    expect(screen.getByText('@testuser')).toBeInTheDocument()
  })

  it('shows login button when not authenticated', () => {
    render(<Navigation user={null} />)
    
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument()
  })

  it('handles logout click', () => {
    const onLogout = jest.fn()
    const user = { username: 'testuser' }
    render(<Navigation user={user} onLogout={onLogout} />)
    
    const logoutButton = screen.getByText(/Logout/i)
    fireEvent.click(logoutButton)
    
    expect(onLogout).toHaveBeenCalled()
  })

  it('shows MirrorX assistant toggle', () => {
    render(<Navigation />)
    
    expect(screen.getByLabelText(/MirrorX Assistant/i)).toBeInTheDocument()
  })

  it('is responsive on mobile', () => {
    const { container } = render(<Navigation />)
    
    expect(container.querySelector('.mobile-menu')).toBeInTheDocument()
  })
})
