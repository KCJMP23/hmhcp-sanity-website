// Publications Validation Schemas
// Story 3.7a: Basic Publications CRUD - QA Improvements
// Created: 2025-01-06

import { z } from 'zod';

// Author validation schema
export const authorSchema = z.object({
  name: z.string().min(1, 'Author name is required').max(255, 'Author name too long'),
  email: z.string().email('Invalid email format').optional(),
  affiliation: z.string().max(255, 'Affiliation too long').optional(),
  orcid: z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{4}$/, 'Invalid ORCID format').optional()
});

// Publication validation schema
export const publicationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  abstract: z.string().max(5000, 'Abstract too long').optional(),
  authors: z.array(authorSchema).min(1, 'At least one author is required'),
  publication_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  journal: z.string().max(255, 'Journal name too long').optional(),
  volume: z.string().max(50, 'Volume too long').optional(),
  issue: z.string().max(50, 'Issue too long').optional(),
  pages: z.string().max(50, 'Pages too long').optional(),
  doi: z.string().url('Invalid DOI format').optional(),
  pubmed_id: z.string().max(50, 'PubMed ID too long').optional(),
  publication_type: z.enum(['peer-reviewed', 'white-paper', 'case-study', 'review', 'editorial', 'conference-paper']),
  keywords: z.array(z.string()).max(20, 'Too many keywords').optional(),
  full_text_url: z.string().url('Invalid URL format').optional(),
  status: z.enum(['draft', 'under-review', 'published', 'archived']).default('draft'),
  featured: z.boolean().default(false)
});

// Create publication request schema
export const createPublicationSchema = publicationSchema;

// Update publication request schema (all fields optional except id)
export const updatePublicationSchema = publicationSchema.partial().extend({
  id: z.string().uuid('Invalid publication ID')
});

// Publication filters schema
export const publicationFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['draft', 'under-review', 'published', 'archived']).optional(),
  publication_type: z.enum(['peer-reviewed', 'white-paper', 'case-study', 'review', 'editorial', 'conference-paper']).optional(),
  featured: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  total: z.number().int().min(0).default(0),
  totalPages: z.number().int().min(0).default(0)
});

// API response schemas
export const publicationResponseSchema = z.object({
  success: z.boolean(),
  data: publicationSchema.optional(),
  error: z.string().optional(),
  pagination: paginationSchema.optional()
});

export const publicationsListResponseSchema = z.object({
  publications: z.array(publicationSchema),
  pagination: paginationSchema
});

// Validation helper functions
export function validatePublication(data: unknown) {
  return publicationSchema.safeParse(data);
}

export function validateCreatePublication(data: unknown) {
  return createPublicationSchema.safeParse(data);
}

export function validateUpdatePublication(data: unknown) {
  return updatePublicationSchema.safeParse(data);
}

export function validatePublicationFilters(data: unknown) {
  return publicationFiltersSchema.safeParse(data);
}

// Type exports
export type Author = z.infer<typeof authorSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type CreatePublicationRequest = z.infer<typeof createPublicationSchema>;
export type UpdatePublicationRequest = z.infer<typeof updatePublicationSchema>;
export type PublicationFilters = z.infer<typeof publicationFiltersSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type PublicationResponse = z.infer<typeof publicationResponseSchema>;
export type PublicationsListResponse = z.infer<typeof publicationsListResponseSchema>;
