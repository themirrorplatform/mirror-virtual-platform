/**
 * ReflectionComposer Component Tests
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReflectionComposer from '@/components/ReflectionComposer'

describe('ReflectionComposer', () => {
  it('renders text area for reflection input', () => {
    render(<ReflectionComposer />)
    
    const textarea = screen.getByPlaceholderText(/what are you reflecting/i)
    expect(textarea).toBeInTheDocument()
  })

  it('shows Reflect button (MirrorCore compliant)', () => {
    render(<ReflectionComposer />)
    
    const button = screen.getByRole('button', { name: /reflect/i })
    expect(button).toBeInTheDocument()
    
    // Should NOT say "Share" or "Post"
    expect(screen.queryByText(/share reflection/i)).not.toBeInTheDocument()
  })

  it('enables submit button when text is entered', async () => {
    const user = userEvent.setup()
    render(<ReflectionComposer />)
    
    const textarea = screen.getByPlaceholderText(/what are you reflecting/i)
    const button = screen.getByRole('button', { name: /reflect/i })
    
    expect(button).toBeDisabled()
    
    await user.type(textarea, 'This is my reflection about growth')
    
    expect(button).not.toBeDisabled()
  })

  it('calls onSubmit with reflection data', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    render(<ReflectionComposer onSubmit={onSubmit} />)
    
    const textarea = screen.getByPlaceholderText(/what are you reflecting/i)
    await user.type(textarea, 'My reflection text')
    
    const button = screen.getByRole('button', { name: /reflect/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'My reflection text'
        })
      )
    })
  })

  it('shows lens selector', () => {
    render(<ReflectionComposer />)
    
    expect(screen.getByLabelText(/lens/i)).toBeInTheDocument()
  })

  it('allows selecting different lenses', async () => {
    const user = userEvent.setup()
    render(<ReflectionComposer />)
    
    const lensSelect = screen.getByLabelText(/lens/i)
    await user.selectOptions(lensSelect, 'identity')
    
    expect(lensSelect).toHaveValue('identity')
  })

  it('shows character count', async () => {
    const user = userEvent.setup()
    render(<ReflectionComposer />)
    
    const textarea = screen.getByPlaceholderText(/what are you reflecting/i)
    await user.type(textarea, 'Test')
    
    expect(screen.getByText(/4/)).toBeInTheDocument()
  })

  it('clears form after submission', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn().mockResolvedValue({})
    render(<ReflectionComposer onSubmit={onSubmit} />)
    
    const textarea = screen.getByPlaceholderText(/what are you reflecting/i)
    await user.type(textarea, 'Test reflection')
    
    const button = screen.getByRole('button', { name: /reflect/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(textarea).toHaveValue('')
    })
  })

  it('shows error state on failed submission', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('Network error'))
    render(<ReflectionComposer onSubmit={onSubmit} />)
    
    const textarea = screen.getByPlaceholderText(/what are you reflecting/i)
    await userEvent.type(textarea, 'Test')
    
    const button = screen.getByRole('button', { name: /reflect/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
