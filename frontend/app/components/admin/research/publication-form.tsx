'use client'

/**
 * Publication Form Component
 * 
 * This form component requires the following API endpoints:
 * 
 * POST /api/admin/publications
 * - Creates a new publication
 * - Expects PublicationFormData in request body
 * - Returns created publication with id
 * 
 * PUT /api/admin/publications/[id]
 * - Updates an existing publication
 * - Expects PublicationFormData in request body
 * - Returns updated publication
 * 
 * GET /api/admin/publications/[id]
 * - Retrieves a single publication for editing
 * - Returns publication data with matching interface
 * 
 * Expected API response format should match the Publication interface
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, Plus, X, Loader2, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Author interface for structured author data
export interface Author {
  name: string
  email: string
  affiliation: string
}

// Form validation schema
const publicationFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters'),
  abstract: z.string().optional(),
  authors: z.array(z.object({
    name: z.string().min(1, 'Author name is required'),
    email: z.string().email('Please enter a valid email'),
    affiliation: z.string().min(1, 'Affiliation is required')
  })).min(1, 'At least one author is required'),
  publication_date: z.date().optional(),
  status: z.enum(['draft', 'published', 'archived'])
})

export type PublicationFormData = z.infer<typeof publicationFormSchema>

export interface Publication extends PublicationFormData {
  id?: string
  created_at?: string
  updated_at?: string
}

interface PublicationFormProps {
  publication?: Publication
  onSubmit: (data: PublicationFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  className?: string
}

export function PublicationForm({
  publication,
  onSubmit,
  onCancel,
  isLoading = false,
  className
}: PublicationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [newAuthor, setNewAuthor] = useState<Author>({ name: '', email: '', affiliation: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PublicationFormData>({
    resolver: zodResolver(publicationFormSchema),
    defaultValues: {
      title: publication?.title || '',
      abstract: publication?.abstract || '',
      authors: publication?.authors || [],
      publication_date: publication?.publication_date ? new Date(publication.publication_date) : undefined,
      status: publication?.status || 'draft'
    }
  })

  const { watch, setValue, getValues } = form
  const authors = watch('authors')

  const handleSubmit = async (data: PublicationFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      
      toast({
        title: publication ? 'Publication updated' : 'Publication created',
        description: publication 
          ? 'The publication has been updated successfully.' 
          : 'The publication has been created successfully.',
      })

      // Navigate back to publications list
      router.push('/admin/research/publications')
    } catch (error) {
      console.error('Error submitting publication:', error)
      toast({
        title: 'Error',
        description: 'There was an error saving the publication. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.push('/admin/research/publications')
    }
  }

  const addAuthor = () => {
    if (newAuthor.name && newAuthor.email && newAuthor.affiliation) {
      const currentAuthors = getValues('authors')
      setValue('authors', [...currentAuthors, newAuthor])
      setNewAuthor({ name: '', email: '', affiliation: '' })
    }
  }

  const removeAuthor = (index: number) => {
    const currentAuthors = getValues('authors')
    setValue('authors', currentAuthors.filter((_, i) => i !== index))
  }

  const canAddAuthor = newAuthor.name && newAuthor.email && newAuthor.affiliation

  return (
    <div className={cn('max-w-4xl mx-auto p-6', className)}>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Publications
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {publication ? 'Edit Publication' : 'Create New Publication'}
          </h1>
          <p className="text-gray-600 mt-2">
            {publication 
              ? 'Update the publication details below.' 
              : 'Fill in the information below to create a new research publication.'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic publication details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter publication title"
                        className="text-base"
                      />
                    </FormControl>
                    <FormDescription>
                      The full title of the research publication (max 500 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="abstract"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abstract</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter publication abstract or summary"
                        rows={6}
                        className="text-base resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      A brief summary or abstract of the publication (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="publication_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publication Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        The date when the publication was published
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              Draft
                            </div>
                          </SelectItem>
                          <SelectItem value="published">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Published
                            </div>
                          </SelectItem>
                          <SelectItem value="archived">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              Archived
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The current status of the publication
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Authors Section */}
          <Card>
            <CardHeader>
              <CardTitle>Authors</CardTitle>
              <CardDescription>
                Add the authors of this publication. At least one author is required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Author Form */}
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900">Add New Author</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name *</label>
                    <Input
                      value={newAuthor.name}
                      onChange={(e) => setNewAuthor(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Author name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email *</label>
                    <Input
                      type="email"
                      value={newAuthor.email}
                      onChange={(e) => setNewAuthor(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="author@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Affiliation *</label>
                    <Input
                      value={newAuthor.affiliation}
                      onChange={(e) => setNewAuthor(prev => ({ ...prev, affiliation: e.target.value }))}
                      placeholder="Institution or organization"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addAuthor}
                  disabled={!canAddAuthor}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Author
                </Button>
              </div>

              {/* Authors List */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Authors ({authors.length})</h4>
                {authors.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                    No authors added yet. Please add at least one author above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {authors.map((author, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg bg-white"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Author {index + 1}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Name:</span>
                              <p className="text-gray-900">{author.name}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Email:</span>
                              <p className="text-gray-900">{author.email}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Affiliation:</span>
                              <p className="text-gray-900">{author.affiliation}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAuthor(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="authors"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="min-w-[120px]"
            >
              {(isSubmitting || isLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {publication ? 'Update Publication' : 'Create Publication'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}