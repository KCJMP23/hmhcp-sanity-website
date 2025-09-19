/**
 * @jest-environment jsdom
 */

/**
 * Publications List Component Test Suite
 * 
 * Comprehensive testing of the publications list component including filtering,
 * pagination, search functionality, loading states, error handling, and user interactions.
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
import PublicationsList from '@/components/admin/research/publications-list'
import { Publication, PublicationsFilters, PaginationInfo } from '@/types/publications'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock window methods
if (typeof window !== 'undefined') {
  Object.assign(window, {
    open: jest.fn(),
    location: {
      reload: jest.fn()
    }
  })
}

describe('PublicationsList Component', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn()
  }

  const mockPublications: Publication[] = [
    {
      id: 'pub-1',
      title: 'Advanced Healthcare AI Research',
      authors: ['Dr. John Smith', 'Dr. Jane Doe'],
      journal: 'Journal of Medical AI',
      year: 2024,
      volume: '15',
      issue: '3',
      pages: '45-62',
      doi: '10.1234/jmai.2024.001',
      pmid: '12345678',
      abstract: 'This study explores the application of artificial intelligence in healthcare diagnostics...',
      keywords: ['AI', 'healthcare', 'diagnostics'],
      publicationType: 'Research Article',
      impactFactor: 5.2,
      citations: 45,
      pdfUrl: 'https://example.com/paper1.pdf',
      status: 'published',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      publishedAt: '2024-01-15T00:00:00Z'
    },
    {
      id: 'pub-2',
      title: 'Machine Learning in Clinical Decision Support',
      authors: ['Dr. Alice Johnson'],
      journal: 'Clinical Computing Review',
      year: 2024,
      volume: '8',
      issue: '1',
      pages: '12-28',
      doi: '10.5678/ccr.2024.002',
      abstract: 'A comprehensive review of machine learning applications in clinical settings...',
      keywords: ['machine learning', 'clinical', 'decision support'],
      publicationType: 'Review',
      impactFactor: 3.8,
      citations: 23,
      status: 'published',
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-10T00:00:00Z',
      publishedAt: '2024-02-10T00:00:00Z'
    },
    {
      id: 'pub-3',
      title: 'Draft: Future of Telemedicine',
      authors: ['Dr. Bob Wilson', 'Dr. Carol Brown'],
      journal: 'Telemedicine Today',
      year: 2024,
      abstract: 'Exploring the future trends in telemedicine and remote patient care...',
      keywords: ['telemedicine', 'remote care', 'digital health'],
      publicationType: 'Editorial',
      status: 'draft',
      createdAt: '2024-03-01T00:00:00Z',
      updatedAt: '2024-03-05T00:00:00Z'
    }
  ]

  const mockPagination: PaginationInfo = {
    currentPage: 1,
    totalPages: 2,
    totalItems: 25,
    itemsPerPage: 10
  }

  const mockFilters: PublicationsFilters = {
    search: '',
    status: 'all',
    publicationType: '',
    year: ''
  }

  const defaultProps = {
    publications: mockPublications,
    loading: false,
    error: null,
    pagination: mockPagination,
    filters: mockFilters,
    onFiltersChange: jest.fn(),
    onPageChange: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Rendering and Basic Functionality', () => {
    test('should render publications list correctly', () => {
      render(<PublicationsList {...defaultProps} />)

      expect(screen.getByText('Publications (25)')).toBeInTheDocument()
      expect(screen.getByText('Manage research publications and academic papers')).toBeInTheDocument()
      
      // Check if publications are displayed
      expect(screen.getByText('Advanced Healthcare AI Research')).toBeInTheDocument()
      expect(screen.getByText('Machine Learning in Clinical Decision Support')).toBeInTheDocument()
      expect(screen.getByText('Draft: Future of Telemedicine')).toBeInTheDocument()
    })

    test('should display publication details correctly', () => {
      render(<PublicationsList {...defaultProps} />)

      const firstPublication = screen.getByText('Advanced Healthcare AI Research')
      const row = firstPublication.closest('tr')!
      
      // Check authors
      expect(within(row).getByText('Dr. John Smith, Dr. Jane Doe')).toBeInTheDocument()
      
      // Check journal
      expect(within(row).getByText('Journal of Medical AI')).toBeInTheDocument()
      
      // Check year
      expect(within(row).getByText('2024')).toBeInTheDocument()
      
      // Check status badge
      expect(within(row).getByText('Published')).toBeInTheDocument()
      
      // Check publication type
      expect(within(row).getByText('Research Article')).toBeInTheDocument()
      
      // Check impact factor and citations
      expect(within(row).getByText('IF: 5.2')).toBeInTheDocument()
      expect(within(row).getByText('Citations: 45')).toBeInTheDocument()
    })

    test('should render status badges with correct styling', () => {
      render(<PublicationsList {...defaultProps} />)

      const publishedBadge = screen.getAllByText('Published')[0]
      expect(publishedBadge).toHaveClass('bg-green-100', 'text-green-800')

      const draftBadge = screen.getByText('Draft')
      expect(draftBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
    })

    test('should render publication type badges with correct colors', () => {
      render(<PublicationsList {...defaultProps} />)

      const researchArticle = screen.getByText('Research Article')
      expect(researchArticle).toHaveClass('bg-blue-100', 'text-blue-800')

      const review = screen.getByText('Review')
      expect(review).toHaveClass('bg-green-100', 'text-green-800')

      const editorial = screen.getByText('Editorial')
      expect(editorial).toHaveClass('bg-orange-100', 'text-orange-800')
    })

    test('should render add publication button', () => {
      render(<PublicationsList {...defaultProps} />)

      const addButton = screen.getByRole('button', { name: /add publication/i })
      expect(addButton).toBeInTheDocument()
      
      fireEvent.click(addButton)
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/research/publications/new')
    })
  })

  describe('Search and Filtering', () => {
    test('should render search input', () => {
      render(<PublicationsList {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search by title or author...')
      expect(searchInput).toBeInTheDocument()
    })

    test('should call onFiltersChange when search input changes', async () => {
      const user = userEvent.setup()
      const onFiltersChange = jest.fn()

      render(
        <PublicationsList 
          {...defaultProps} 
          onFiltersChange={onFiltersChange}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search by title or author...')
      await user.type(searchInput, 'AI Research')

      expect(onFiltersChange).toHaveBeenCalledWith({ search: 'AI Research' })
    })

    test('should render status filter dropdown', () => {
      render(<PublicationsList {...defaultProps} />)

      const statusFilter = screen.getByRole('combobox')
      expect(statusFilter).toBeInTheDocument()
      
      fireEvent.click(statusFilter)
      expect(screen.getByText('All Status')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
      expect(screen.getByText('Published')).toBeInTheDocument()
      expect(screen.getByText('Archived')).toBeInTheDocument()
    })

    test('should call onFiltersChange when status filter changes', async () => {
      const user = userEvent.setup()
      const onFiltersChange = jest.fn()

      render(
        <PublicationsList 
          {...defaultProps} 
          onFiltersChange={onFiltersChange}
        />
      )

      const statusFilter = screen.getByRole('combobox')
      await user.click(statusFilter)
      
      const publishedOption = screen.getByText('Published')
      await user.click(publishedOption)

      expect(onFiltersChange).toHaveBeenCalledWith({ status: 'published' })
    })

    test('should show current filter values', () => {
      const filtersWithValues = {
        ...mockFilters,
        search: 'AI Research',
        status: 'published' as const
      }

      render(
        <PublicationsList 
          {...defaultProps} 
          filters={filtersWithValues}
        />
      )

      const searchInput = screen.getByDisplayValue('AI Research')
      expect(searchInput).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    test('should render pagination when there are multiple pages', () => {
      render(<PublicationsList {...defaultProps} />)

      expect(screen.getByText('Showing 1 to 10 of 25 publications')).toBeInTheDocument()
      
      // Check for pagination controls
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    test('should call onPageChange when pagination is used', async () => {
      const user = userEvent.setup()
      const onPageChange = jest.fn()

      render(
        <PublicationsList 
          {...defaultProps} 
          onPageChange={onPageChange}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      expect(onPageChange).toHaveBeenCalledWith(2)
    })

    test('should disable previous button on first page', () => {
      render(<PublicationsList {...defaultProps} />)

      const previousButton = screen.getByRole('button', { name: /previous/i })
      expect(previousButton).toHaveClass('pointer-events-none', 'opacity-50')
    })

    test('should disable next button on last page', () => {
      const lastPagePagination = {
        ...mockPagination,
        currentPage: 2,
        totalPages: 2
      }

      render(
        <PublicationsList 
          {...defaultProps} 
          pagination={lastPagePagination}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toHaveClass('pointer-events-none', 'opacity-50')
    })

    test('should not render pagination for single page', () => {
      const singlePagePagination = {
        ...mockPagination,
        totalPages: 1
      }

      render(
        <PublicationsList 
          {...defaultProps} 
          pagination={singlePagePagination}
        />
      )

      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    test('should render edit and delete buttons for each publication', () => {
      render(<PublicationsList {...defaultProps} />)

      const editButtons = screen.getAllByTitle('Edit publication')
      const deleteButtons = screen.getAllByTitle('Delete publication')

      expect(editButtons).toHaveLength(3)
      expect(deleteButtons).toHaveLength(3)
    })

    test('should navigate to edit page when edit button is clicked', async () => {
      const user = userEvent.setup()

      render(<PublicationsList {...defaultProps} />)

      const firstEditButton = screen.getAllByTitle('Edit publication')[0]
      await user.click(firstEditButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/research/publications/pub-1/edit')
    })

    test('should show delete confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()

      render(<PublicationsList {...defaultProps} />)

      const firstDeleteButton = screen.getAllByTitle('Delete publication')[0]
      await user.click(firstDeleteButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Delete Publication')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete "Advanced Healthcare AI Research"/)).toBeInTheDocument()
    })

    test('should call onDelete when delete is confirmed', async () => {
      const user = userEvent.setup()
      const onDelete = jest.fn()

      render(
        <PublicationsList 
          {...defaultProps} 
          onDelete={onDelete}
        />
      )

      const firstDeleteButton = screen.getAllByTitle('Delete publication')[0]
      await user.click(firstDeleteButton)

      const confirmButton = screen.getByRole('button', { name: 'Delete' })
      await user.click(confirmButton)

      expect(onDelete).toHaveBeenCalledWith('pub-1')
    })

    test('should close delete dialog when cancelled', async () => {
      const user = userEvent.setup()

      render(<PublicationsList {...defaultProps} />)

      const firstDeleteButton = screen.getAllByTitle('Delete publication')[0]
      await user.click(firstDeleteButton)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    test('should render DOI link when available', async () => {
      const user = userEvent.setup()

      render(<PublicationsList {...defaultProps} />)

      const doiButtons = screen.getAllByTitle('View DOI')
      expect(doiButtons).toHaveLength(2) // Only first two publications have DOI

      await user.click(doiButtons[0])
      expect(window.open).toHaveBeenCalledWith('https://doi.org/10.1234/jmai.2024.001', '_blank')
    })

    test('should not render DOI link when not available', () => {
      render(<PublicationsList {...defaultProps} />)

      // Third publication doesn't have DOI, so should have only 2 DOI buttons total
      const doiButtons = screen.getAllByTitle('View DOI')
      expect(doiButtons).toHaveLength(2)
    })
  })

  describe('Loading States', () => {
    test('should render loading skeleton when loading', () => {
      render(
        <PublicationsList 
          {...defaultProps} 
          loading={true}
          publications={[]}
        />
      )

      // Should show skeleton loaders
      expect(screen.queryByText('Publications')).not.toBeInTheDocument()
      expect(screen.queryByText('Advanced Healthcare AI Research')).not.toBeInTheDocument()
      
      // Should show multiple skeleton elements
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    test('should not render table when loading', () => {
      render(
        <PublicationsList 
          {...defaultProps} 
          loading={true}
          publications={[]}
        />
      )

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    test('should render error message when there is an error', () => {
      render(
        <PublicationsList 
          {...defaultProps} 
          error="Failed to load publications"
          publications={[]}
        />
      )

      expect(screen.getByText('Error loading publications')).toBeInTheDocument()
      expect(screen.getByText('Failed to load publications')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    })

    test('should reload page when try again is clicked', async () => {
      const user = userEvent.setup()

      render(
        <PublicationsList 
          {...defaultProps} 
          error="Failed to load publications"
          publications={[]}
        />
      )

      const tryAgainButton = screen.getByRole('button', { name: 'Try Again' })
      await user.click(tryAgainButton)

      expect(window.location.reload).toHaveBeenCalled()
    })

    test('should not render table when there is an error', () => {
      render(
        <PublicationsList 
          {...defaultProps} 
          error="Failed to load publications"
          publications={[]}
        />
      )

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    test('should render empty state when no publications and no filters', () => {
      render(
        <PublicationsList 
          {...defaultProps} 
          publications={[]}
          pagination={{...mockPagination, totalItems: 0}}
        />
      )

      expect(screen.getByText('No publications found')).toBeInTheDocument()
      expect(screen.getByText('Get started by adding your first publication.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add First Publication' })).toBeInTheDocument()
    })

    test('should render filtered empty state when no publications with filters', () => {
      const filtersWithSearch = {
        ...mockFilters,
        search: 'nonexistent'
      }

      render(
        <PublicationsList 
          {...defaultProps} 
          publications={[]}
          filters={filtersWithSearch}
          pagination={{...mockPagination, totalItems: 0}}
        />
      )

      expect(screen.getByText('No publications found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument()
    })

    test('should show search input in empty state', () => {
      render(
        <PublicationsList 
          {...defaultProps} 
          publications={[]}
          pagination={{...mockPagination, totalItems: 0}}
        />
      )

      expect(screen.getByPlaceholderText('Search publications...')).toBeInTheDocument()
    })

    test('should navigate to new publication when add first publication is clicked', async () => {
      const user = userEvent.setup()

      render(
        <PublicationsList 
          {...defaultProps} 
          publications={[]}
          pagination={{...mockPagination, totalItems: 0}}
        />
      )

      const addButton = screen.getByRole('button', { name: 'Add First Publication' })
      await user.click(addButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/research/publications/new')
    })
  })

  describe('Author Display', () => {
    test('should show first two authors with count when more than two', () => {
      render(<PublicationsList {...defaultProps} />)

      const firstRow = screen.getByText('Advanced Healthcare AI Research').closest('tr')!
      expect(within(firstRow).getByText('Dr. John Smith, Dr. Jane Doe')).toBeInTheDocument()
      expect(within(firstRow).queryByText('+1 more')).not.toBeInTheDocument() // Only 2 authors
    })

    test('should show +N more when more than two authors', () => {
      const publicationWithManyAuthors = {
        ...mockPublications[0],
        authors: ['Dr. John Smith', 'Dr. Jane Doe', 'Dr. Bob Wilson', 'Dr. Alice Johnson']
      }

      render(
        <PublicationsList 
          {...defaultProps} 
          publications={[publicationWithManyAuthors]}
        />
      )

      expect(screen.getByText('Dr. John Smith, Dr. Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('+2 more')).toBeInTheDocument()
    })

    test('should handle single author', () => {
      render(<PublicationsList {...defaultProps} />)

      const secondRow = screen.getByText('Machine Learning in Clinical Decision Support').closest('tr')!
      expect(within(secondRow).getByText('Dr. Alice Johnson')).toBeInTheDocument()
      expect(within(secondRow).queryByText('+')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<PublicationsList {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Authors' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Journal' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Year' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()
    })

    test('should have accessible buttons', () => {
      render(<PublicationsList {...defaultProps} />)

      const editButtons = screen.getAllByTitle('Edit publication')
      const deleteButtons = screen.getAllByTitle('Delete publication')

      editButtons.forEach(button => {
        expect(button).toHaveAttribute('title')
      })

      deleteButtons.forEach(button => {
        expect(button).toHaveAttribute('title')
      })
    })

    test('should support keyboard navigation on action buttons', () => {
      render(<PublicationsList {...defaultProps} />)

      const editButtons = screen.getAllByTitle('Edit publication')
      const deleteButtons = screen.getAllByTitle('Delete publication')

      editButtons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', '0')
      })

      deleteButtons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', '0')
      })
    })

    test('should have accessible alert dialog', async () => {
      const user = userEvent.setup()

      render(<PublicationsList {...defaultProps} />)

      const firstDeleteButton = screen.getAllByTitle('Delete publication')[0]
      await user.click(firstDeleteButton)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-describedby')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })
  })

  describe('Responsive Behavior', () => {
    test('should handle long publication titles', () => {
      const publicationWithLongTitle = {
        ...mockPublications[0],
        title: 'This is a very long publication title that should be handled gracefully in the table layout without breaking the design or causing overflow issues'
      }

      render(
        <PublicationsList 
          {...defaultProps} 
          publications={[publicationWithLongTitle]}
        />
      )

      const titleCell = screen.getByText(/This is a very long publication title/)
      expect(titleCell).toBeInTheDocument()
    })

    test('should truncate journal names appropriately', () => {
      const publicationWithLongJournal = {
        ...mockPublications[0],
        journal: 'International Journal of Advanced Healthcare Computing and Medical Artificial Intelligence Research'
      }

      render(
        <PublicationsList 
          {...defaultProps} 
          publications={[publicationWithLongJournal]}
        />
      )

      const journalCell = screen.getByText(/International Journal of Advanced Healthcare/)
      expect(journalCell).toHaveClass('truncate', 'max-w-32')
    })
  })

  describe('Data Edge Cases', () => {
    test('should handle publications with missing optional fields', () => {
      const minimalPublication = {
        id: 'pub-minimal',
        title: 'Minimal Publication',
        authors: ['Dr. Minimal'],
        journal: 'Test Journal',
        year: 2024,
        abstract: 'Minimal abstract',
        keywords: [],
        publicationType: 'Article',
        status: 'draft' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      render(
        <PublicationsList 
          {...defaultProps} 
          publications={[minimalPublication]}
        />
      )

      expect(screen.getByText('Minimal Publication')).toBeInTheDocument()
      expect(screen.getByText('Dr. Minimal')).toBeInTheDocument()
      expect(screen.queryByText('IF:')).not.toBeInTheDocument()
      expect(screen.queryByText('Citations:')).not.toBeInTheDocument()
    })

    test('should handle zero impact factor and citations', () => {
      const zeroStatsPublication = {
        ...mockPublications[0],
        impactFactor: 0,
        citations: 0
      }

      render(
        <PublicationsList 
          {...defaultProps} 
          publications={[zeroStatsPublication]}
        />
      )

      expect(screen.getByText('IF: 0')).toBeInTheDocument()
      expect(screen.getByText('Citations: 0')).toBeInTheDocument()
    })

    test('should handle archived status', () => {
      const archivedPublication = {
        ...mockPublications[0],
        status: 'archived' as const
      }

      render(
        <PublicationsList 
          {...defaultProps} 
          publications={[archivedPublication]}
        />
      )

      const archivedBadge = screen.getByText('Archived')
      expect(archivedBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    })
  })
})