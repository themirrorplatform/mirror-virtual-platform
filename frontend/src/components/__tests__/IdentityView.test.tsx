/**
 * IdentityView Component Tests
 */
import { render, screen, fireEvent } from '@testing-library/react'
import IdentityView from '@/components/IdentityView'

describe('IdentityView', () => {
  const mockIdentities = [
    { id: '1', label: 'primary', is_active: true },
    { id: '2', label: 'work-self', is_active: false },
    { id: '3', label: 'creative-self', is_active: false }
  ]

  const mockAxes = [
    {
      id: 1,
      key: 'introvert_extrovert',
      label: 'Introvert ↔ Extrovert',
      values: [{ value: 0.7, recorded_at: '2025-12-07T00:00:00Z' }]
    }
  ]

  it('renders all user identities', () => {
    render(<IdentityView identities={mockIdentities} axes={mockAxes} />)
    
    expect(screen.getByText('primary')).toBeInTheDocument()
    expect(screen.getByText('work-self')).toBeInTheDocument()
    expect(screen.getByText('creative-self')).toBeInTheDocument()
  })

  it('highlights active identity', () => {
    render(<IdentityView identities={mockIdentities} axes={mockAxes} />)
    
    const activeIdentity = screen.getByText('primary').closest('div')
    expect(activeIdentity).toHaveClass('active')
  })

  it('allows switching active identity', () => {
    const onSwitchIdentity = jest.fn()
    render(<IdentityView identities={mockIdentities} axes={mockAxes} onSwitchIdentity={onSwitchIdentity} />)
    
    const workIdentity = screen.getByText('work-self')
    fireEvent.click(workIdentity)
    
    expect(onSwitchIdentity).toHaveBeenCalledWith('2')
  })

  it('displays identity axes', () => {
    render(<IdentityView identities={mockIdentities} axes={mockAxes} />)
    
    expect(screen.getByText('Introvert ↔ Extrovert')).toBeInTheDocument()
  })

  it('shows axis values visually', () => {
    render(<IdentityView identities={mockIdentities} axes={mockAxes} />)
    
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('value', '0.7')
  })

  it('allows creating new identity', () => {
    const onCreateIdentity = jest.fn()
    render(<IdentityView identities={mockIdentities} axes={mockAxes} onCreateIdentity={onCreateIdentity} />)
    
    const createButton = screen.getByRole('button', { name: /create identity/i })
    fireEvent.click(createButton)
    
    expect(onCreateIdentity).toHaveBeenCalled()
  })

  it('displays identity graph visualization', () => {
    render(<IdentityView identities={mockIdentities} axes={mockAxes} />)
    
    expect(screen.getByTestId('identity-graph')).toBeInTheDocument()
  })
})
