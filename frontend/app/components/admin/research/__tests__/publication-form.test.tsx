/**
 * @jest-environment jsdom
 */

/**
 * Publication Form Component Test Suite
 * 
 * Comprehensive testing of the publication form component including form validation,
 * submission, author management, loading states, error handling, and user interactions.
 * 
 * @category Components
 * @subcategory Publications
 * @severity HIGH
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import { PublicationForm, PublicationFormData, Publication } from '@/components/admin/research/publication-form'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock useToast hook
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    if (formatStr === 'PPP') {
      return date.toDateString()
    }
    return date.toISOString().split('T')[0]
  }
}))

describe('PublicationForm Component', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn()
  }

  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  const mockExistingPublication: Publication = {
    id: 'pub-123',
    title: 'Existing Publication',
    abstract: 'This is an existing publication abstract.',
    authors: [
      {
        name: 'Dr. John Smith',
        email: 'john.smith@hmhcp.com',
        affiliation: 'HMHCP Research Institute'
      },
      {
        name: 'Dr. Jane Doe',
        email: 'jane.doe@hmhcp.com',
        affiliation: 'HMHCP Medical Center'
      }
    ],
    publication_date: new Date('2024-01-15'),
    status: 'published',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    isLoading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    mockOnSubmit.mockResolvedValue(undefined)
  })

  describe('Form Rendering', () => {
    test('should render create form correctly', () => {
      render(<PublicationForm {...defaultProps} />)

      expect(screen.getByText('Create New Publication')).toBeInTheDocument()
      expect(screen.getByText('Fill in the information below to create a new research publication.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Publication' })).toBeInTheDocument()
    })

    test('should render edit form correctly', () => {
      render(
        <PublicationForm 
          {...defaultProps} 
          publication={mockExistingPublication}
        />
      )

      expect(screen.getByText('Edit Publication')).toBeInTheDocument()
      expect(screen.getByText('Update the publication details below.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Update Publication' })).toBeInTheDocument()
    })

    test('should populate form with existing publication data', () => {
      render(
        <PublicationForm 
          {...defaultProps} 
          publication={mockExistingPublication}
        />
      )

      expect(screen.getByDisplayValue('Existing Publication')).toBeInTheDocument()
      expect(screen.getByDisplayValue('This is an existing publication abstract.')).toBeInTheDocument()
      expect(screen.getByText('Authors (2)')).toBeInTheDocument()
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument()
      expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument()
    })

    test('should render all form fields', () => {
      render(<PublicationForm {...defaultProps} />)

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/abstract/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/publication date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      expect(screen.getByText('Add New Author')).toBeInTheDocument()
    })

    test('should render back button', () => {
      render(<PublicationForm {...defaultProps} />)

      const backButton = screen.getByRole('button', { name: /back to publications/i })
      expect(backButton).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    test('should show validation error for empty title', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: 'Create Publication' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument()
      })
    })

    test('should show validation error for title too long', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const titleInput = screen.getByLabelText(/title/i)
      const longTitle = 'A'.repeat(501) // Over 500 character limit
      
      await user.type(titleInput, longTitle)
      await user.tab() // Trigger validation

      await waitFor(() => {
        expect(screen.getByText('Title must be less than 500 characters')).toBeInTheDocument()
      })
    })

    test('should show validation error when no authors', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Test Publication')

      const submitButton = screen.getByRole('button', { name: 'Create Publication' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('At least one author is required')).toBeInTheDocument()
      })
    })

    test('should validate author fields', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      // Fill in basic info
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Test Publication')

      // Try to add author with invalid data
      const nameInput = screen.getByPlaceholderText('Author name')
      const emailInput = screen.getByPlaceholderText('author@example.com')
      const affiliationInput = screen.getByPlaceholderText('Institution or organization')

      await user.type(emailInput, 'invalid-email')
      await user.type(affiliationInput, 'Test Institution')
      // Leave name empty

      const addAuthorButton = screen.getByRole('button', { name: 'Add Author' })
      expect(addAuthorButton).toBeDisabled()
    })

    test('should enable add author button when all fields are filled', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('Author name')
      const emailInput = screen.getByPlaceholderText('author@example.com')
      const affiliationInput = screen.getByPlaceholderText('Institution or organization')

      await user.type(nameInput, 'Dr. Test Author')
      await user.type(emailInput, 'test@example.com')
      await user.type(affiliationInput, 'Test Institution')

      const addAuthorButton = screen.getByRole('button', { name: 'Add Author' })
      expect(addAuthorButton).not.toBeDisabled()
    })

    test('should validate email format in author form', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      // Add author with invalid email and submit
      const nameInput = screen.getByPlaceholderText('Author name')
      const emailInput = screen.getByPlaceholderText('author@example.com')
      const affiliationInput = screen.getByPlaceholderText('Institution or organization')

      await user.type(nameInput, 'Dr. Test Author')
      await user.type(emailInput, 'test@example.com')
      await user.type(affiliationInput, 'Test Institution')

      const addAuthorButton = screen.getByRole('button', { name: 'Add Author' })
      await user.click(addAuthorButton)

      // Fill title and try to submit
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Test Publication')

      // Now modify author to have invalid email
      await user.clear(emailInput)
      await user.type(emailInput, 'invalid-email')

      const addAuthorButton2 = screen.getByRole('button', { name: 'Add Author' })
      expect(addAuthorButton2).toBeDisabled()
    })
  })

  describe('Author Management', () => {
    test('should add author when form is valid', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('Author name')
      const emailInput = screen.getByPlaceholderText('author@example.com')
      const affiliationInput = screen.getByPlaceholderText('Institution or organization')

      await user.type(nameInput, 'Dr. Test Author')
      await user.type(emailInput, 'test@example.com')
      await user.type(affiliationInput, 'Test Institution')

      const addAuthorButton = screen.getByRole('button', { name: 'Add Author' })
      await user.click(addAuthorButton)

      expect(screen.getByText('Authors (1)')).toBeInTheDocument()
      expect(screen.getByText('Dr. Test Author')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Test Institution')).toBeInTheDocument()

      // Form should be cleared
      expect(nameInput).toHaveValue('')
      expect(emailInput).toHaveValue('')
      expect(affiliationInput).toHaveValue('')
    })

    test('should remove author when delete button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <PublicationForm 
          {...defaultProps} 
          publication={mockExistingPublication}
        />
      )

      expect(screen.getByText('Authors (2)')).toBeInTheDocument()

      const removeButtons = screen.getAllByRole('button', { name: '' }) // X buttons
      const firstRemoveButton = removeButtons.find(btn => btn.querySelector('svg')) // Find button with X icon

      if (firstRemoveButton) {
        await user.click(firstRemoveButton)
        expect(screen.getByText('Authors (1)')).toBeInTheDocument()
      }
    })

    test('should display author index badges', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      // Add two authors
      const nameInput = screen.getByPlaceholderText('Author name')
      const emailInput = screen.getByPlaceholderText('author@example.com')
      const affiliationInput = screen.getByPlaceholderText('Institution or organization')

      // First author
      await user.type(nameInput, 'Dr. First Author')
      await user.type(emailInput, 'first@example.com')
      await user.type(affiliationInput, 'First Institution')
      await user.click(screen.getByRole('button', { name: 'Add Author' }))

      // Second author
      await user.type(nameInput, 'Dr. Second Author')
      await user.type(emailInput, 'second@example.com')
      await user.type(affiliationInput, 'Second Institution')
      await user.click(screen.getByRole('button', { name: 'Add Author' }))

      expect(screen.getByText('Author 1')).toBeInTheDocument()
      expect(screen.getByText('Author 2')).toBeInTheDocument()
    })

    test('should show empty authors message when no authors', () => {
      render(<PublicationForm {...defaultProps} />)

      expect(screen.getByText('Authors (0)')).toBeInTheDocument()
      expect(screen.getByText('No authors added yet. Please add at least one author above.')).toBeInTheDocument()
    })
  })

  describe('Date Handling', () => {
    test('should handle date picker selection', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const dateButton = screen.getByRole('button', { name: /pick a date/i })
      await user.click(dateButton)

      // Check if calendar popup opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    test('should display selected date', () => {
      render(
        <PublicationForm 
          {...defaultProps} 
          publication={mockExistingPublication}
        />
      )

      // Should show formatted date
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })

    test('should show placeholder when no date selected', () => {
      render(<PublicationForm {...defaultProps} />)

      expect(screen.getByText('Pick a date')).toBeInTheDocument()
    })
  })

  describe('Status Selection', () => {
    test('should render status dropdown with options', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const statusSelect = screen.getByRole('combobox', { name: /status/i })
      await user.click(statusSelect)

      expect(screen.getByText('Draft')).toBeInTheDocument()
      expect(screen.getByText('Published')).toBeInTheDocument()
      expect(screen.getByText('Archived')).toBeInTheDocument()
    })

    test('should show status indicators with colored dots', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const statusSelect = screen.getByRole('combobox', { name: /status/i })
      await user.click(statusSelect)

      const draftOption = screen.getByText('Draft').closest('[role="option"]')
      const publishedOption = screen.getByText('Published').closest('[role="option"]')
      const archivedOption = screen.getByText('Archived').closest('[role="option"]')

      expect(draftOption?.querySelector('.bg-gray-400')).toBeInTheDocument()
      expect(publishedOption?.querySelector('.bg-green-500')).toBeInTheDocument()
      expect(archivedOption?.querySelector('.bg-orange-500')).toBeInTheDocument()
    })

    test('should set default status to draft', () => {
      render(<PublicationForm {...defaultProps} />)

      // Should have draft as default in the form
      const statusSelect = screen.getByRole('combobox', { name: /status/i })
      expect(statusSelect).toHaveTextContent('Draft')
    })
  })

  describe('Form Submission', () => {
    test('should submit form with valid data', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      // Fill out form
      await user.type(screen.getByLabelText(/title/i), 'Test Publication')
      await user.type(screen.getByLabelText(/abstract/i), 'Test abstract content')

      // Add author
      await user.type(screen.getByPlaceholderText('Author name'), 'Dr. Test')
      await user.type(screen.getByPlaceholderText('author@example.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Institution or organization'), 'Test Inst')
      await user.click(screen.getByRole('button', { name: 'Add Author' }))

      // Submit
      await user.click(screen.getByRole('button', { name: 'Create Publication' }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Publication',
            abstract: 'Test abstract content',
            authors: [
              {
                name: 'Dr. Test',
                email: 'test@example.com',
                affiliation: 'Test Inst'
              }
            ],
            status: 'draft'
          })
        )
      })
    })

    test('should show success toast after successful submission', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      // Fill minimal required fields
      await user.type(screen.getByLabelText(/title/i), 'Test Publication')
      await user.type(screen.getByPlaceholderText('Author name'), 'Dr. Test')
      await user.type(screen.getByPlaceholderText('author@example.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Institution or organization'), 'Test Inst')
      await user.click(screen.getByRole('button', { name: 'Add Author' }))

      await user.click(screen.getByRole('button', { name: 'Create Publication' }))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Publication created',
          description: 'The publication has been created successfully.'
        })
      })
    })

    test('should navigate to publications list after successful submission', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), 'Test Publication')
      await user.type(screen.getByPlaceholderText('Author name'), 'Dr. Test')
      await user.type(screen.getByPlaceholderText('author@example.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Institution or organization'), 'Test Inst')
      await user.click(screen.getByRole('button', { name: 'Add Author' }))
      await user.click(screen.getByRole('button', { name: 'Create Publication' }))

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/admin/research/publications')
      })
    })

    test('should show error toast when submission fails', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'))

      render(<PublicationForm {...defaultProps} />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), 'Test Publication')
      await user.type(screen.getByPlaceholderText('Author name'), 'Dr. Test')
      await user.type(screen.getByPlaceholderText('author@example.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Institution or organization'), 'Test Inst')
      await user.click(screen.getByRole('button', { name: 'Add Author' }))
      await user.click(screen.getByRole('button', { name: 'Create Publication' }))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'There was an error saving the publication. Please try again.',
          variant: 'destructive'
        })
      })
    })

    test('should disable submit button during submission', async () => {
      const user = userEvent.setup()
      let resolveSubmit: () => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })
      mockOnSubmit.mockReturnValue(submitPromise)

      render(<PublicationForm {...defaultProps} />)

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test Publication')
      await user.type(screen.getByPlaceholderText('Author name'), 'Dr. Test')
      await user.type(screen.getByPlaceholderText('author@example.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Institution or organization'), 'Test Inst')
      await user.click(screen.getByRole('button', { name: 'Add Author' }))

      const submitButton = screen.getByRole('button', { name: 'Create Publication' })
      await user.click(submitButton)

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Create Publication')).toBeInTheDocument()

      // Resolve submission
      resolveSubmit!()
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })

    test('should show loading state during submission', async () => {
      const user = userEvent.setup()
      let resolveSubmit: () => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })
      mockOnSubmit.mockReturnValue(submitPromise)

      render(<PublicationForm {...defaultProps} />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), 'Test Publication')
      await user.type(screen.getByPlaceholderText('Author name'), 'Dr. Test')
      await user.type(screen.getByPlaceholderText('author@example.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Institution or organization'), 'Test Inst')
      await user.click(screen.getByRole('button', { name: 'Add Author' }))
      await user.click(screen.getByRole('button', { name: 'Create Publication' }))

      // Should show loading spinner
      expect(screen.getByTestId('loader')).toBeInTheDocument()

      resolveSubmit!()
    })

    test('should update publication when in edit mode', async () => {
      const user = userEvent.setup()

      render(
        <PublicationForm 
          {...defaultProps} 
          publication={mockExistingPublication}
        />
      )

      // Modify title
      const titleInput = screen.getByDisplayValue('Existing Publication')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Publication')

      await user.click(screen.getByRole('button', { name: 'Update Publication' }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Updated Publication'
          })
        )
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Publication updated',
        description: 'The publication has been updated successfully.'
      })
    })
  })

  describe('Navigation and Cancellation', () => {
    test('should navigate back when back button is clicked', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const backButton = screen.getByRole('button', { name: /back to publications/i })
      await user.click(backButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/research/publications')
    })

    test('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    test('should navigate to publications list when onCancel is not provided', async () => {
      const user = userEvent.setup()

      render(
        <PublicationForm 
          {...defaultProps} 
          onCancel={undefined}
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/research/publications')
    })

    test('should disable buttons when loading', () => {
      render(
        <PublicationForm 
          {...defaultProps} 
          isLoading={true}
        />
      )

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Create Publication' })).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    test('should have proper form labels', () => {
      render(<PublicationForm {...defaultProps} />)

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/abstract/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/publication date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
    })

    test('should show field descriptions', () => {
      render(<PublicationForm {...defaultProps} />)

      expect(screen.getByText('The full title of the research publication (max 500 characters)')).toBeInTheDocument()
      expect(screen.getByText('A brief summary or abstract of the publication (optional)')).toBeInTheDocument()
      expect(screen.getByText('The date when the publication was published')).toBeInTheDocument()
      expect(screen.getByText('The current status of the publication')).toBeInTheDocument()
    })

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const titleInput = screen.getByLabelText(/title/i)
      titleInput.focus()
      expect(document.activeElement).toBe(titleInput)

      await user.tab()
      expect(document.activeElement).toBe(screen.getByLabelText(/abstract/i))
    })

    test('should have accessible button labels', () => {
      render(<PublicationForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /back to publications/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Publication' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add Author' })).toBeInTheDocument()
    })

    test('should have proper ARIA attributes for required fields', () => {
      render(<PublicationForm {...defaultProps} />)

      const titleInput = screen.getByLabelText(/title/i)
      expect(titleInput).toHaveAttribute('aria-required', 'true')
    })
  })

  describe('Responsive Design', () => {
    test('should handle long text inputs gracefully', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const abstractTextarea = screen.getByLabelText(/abstract/i)
      const longAbstract = 'A'.repeat(2000)
      
      await user.type(abstractTextarea, longAbstract)
      expect(abstractTextarea).toHaveValue(longAbstract)
    })

    test('should display author cards in responsive layout', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      // Add multiple authors
      for (let i = 1; i <= 3; i++) {
        await user.type(screen.getByPlaceholderText('Author name'), `Dr. Author ${i}`)
        await user.type(screen.getByPlaceholderText('author@example.com'), `author${i}@example.com`)
        await user.type(screen.getByPlaceholderText('Institution or organization'), `Institution ${i}`)
        await user.click(screen.getByRole('button', { name: 'Add Author' }))
      }

      expect(screen.getByText('Authors (3)')).toBeInTheDocument()
      expect(screen.getByText('Dr. Author 1')).toBeInTheDocument()
      expect(screen.getByText('Dr. Author 2')).toBeInTheDocument()
      expect(screen.getByText('Dr. Author 3')).toBeInTheDocument()
    })
  })

  describe('Form State Management', () => {
    test('should preserve form data when adding authors', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      // Fill title and abstract
      await user.type(screen.getByLabelText(/title/i), 'Test Publication')
      await user.type(screen.getByLabelText(/abstract/i), 'Test abstract')

      // Add author
      await user.type(screen.getByPlaceholderText('Author name'), 'Dr. Test')
      await user.type(screen.getByPlaceholderText('author@example.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Institution or organization'), 'Test Institution')
      await user.click(screen.getByRole('button', { name: 'Add Author' }))

      // Title and abstract should still be there
      expect(screen.getByDisplayValue('Test Publication')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test abstract')).toBeInTheDocument()
    })

    test('should clear author form after adding', async () => {
      const user = userEvent.setup()

      render(<PublicationForm {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('Author name')
      const emailInput = screen.getByPlaceholderText('author@example.com')
      const affiliationInput = screen.getByPlaceholderText('Institution or organization')

      await user.type(nameInput, 'Dr. Test')
      await user.type(emailInput, 'test@example.com')
      await user.type(affiliationInput, 'Test Institution')
      await user.click(screen.getByRole('button', { name: 'Add Author' }))

      expect(nameInput).toHaveValue('')
      expect(emailInput).toHaveValue('')
      expect(affiliationInput).toHaveValue('')
    })

    test('should update author count correctly', async () => {
      const user = userEvent.setup()

      render(
        <PublicationForm 
          {...defaultProps} 
          publication={mockExistingPublication}
        />
      )

      expect(screen.getByText('Authors (2)')).toBeInTheDocument()

      // Remove one author
      const removeButtons = screen.getAllByRole('button', { name: '' })
      const firstRemoveButton = removeButtons.find(btn => btn.querySelector('svg'))
      
      if (firstRemoveButton) {
        await user.click(firstRemoveButton)
        expect(screen.getByText('Authors (1)')).toBeInTheDocument()
      }
    })
  })
})