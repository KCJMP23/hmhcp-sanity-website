/**
 * Admin Data Access Layer (DAL) Index
 * Exports all DAL classes and utilities for healthcare platform admin system
 */

// Base DAL class
export { BaseDAL, createDALInstance } from './base'

// Specific DAL implementations
export { default as PagesDAL } from './pages'
export { default as BlogPostsDAL } from './blog-posts'
export { default as TeamMembersDAL } from './team-members'
export { default as PlatformsDAL } from './platforms'
export { default as ServicesDAL } from './services'
export { default as CategoriesDAL } from './categories'
export { default as TestimonialsDAL } from './testimonials'

// Types and interfaces
export * from './types'

// Utility functions
export * from './utils'

// ================================
// Factory Functions
// ================================

import { SupabaseClient } from '@supabase/supabase-js'
import PagesDAL from './pages'
import BlogPostsDAL from './blog-posts'
import TeamMembersDAL from './team-members'
import PlatformsDAL from './platforms'
import ServicesDAL from './services'
import CategoriesDAL from './categories'
import TestimonialsDAL from './testimonials'

/**
 * Factory function to create all DAL instances with a single Supabase client
 */
export function createAllDALs(client: SupabaseClient) {
  return {
    pages: new PagesDAL(client),
    blogPosts: new BlogPostsDAL(client),
    teamMembers: new TeamMembersDAL(client),
    platforms: new PlatformsDAL(client),
    services: new ServicesDAL(client),
    categories: new CategoriesDAL(client),
    testimonials: new TestimonialsDAL(client)
  }
}

/**
 * Type for the complete DAL collection
 */
export type AdminDALCollection = ReturnType<typeof createAllDALs>

/**
 * Individual DAL factory functions
 */
export const createPagesDAL = (client: SupabaseClient) => new PagesDAL(client)
export const createBlogPostsDAL = (client: SupabaseClient) => new BlogPostsDAL(client)
export const createTeamMembersDAL = (client: SupabaseClient) => new TeamMembersDAL(client)
export const createPlatformsDAL = (client: SupabaseClient) => new PlatformsDAL(client)
export const createServicesDAL = (client: SupabaseClient) => new ServicesDAL(client)
export const createCategoriesDAL = (client: SupabaseClient) => new CategoriesDAL(client)
export const createTestimonialsDAL = (client: SupabaseClient) => new TestimonialsDAL(client)

// ================================
// Healthcare-Specific Exports
// ================================

/**
 * Healthcare compliance utilities
 */
export {
  validateHealthcareContent,
  extractMedicalTerminology,
  validateMedicalAccuracy,
  validateProfessionalCredentials,
  validateClientInformation,
  validateTestimonialContent,
  sanitizeHealthcareDataForLogging,
  determineHIPAAContext,
  validateHealthcareAccess,
  validateHIPAACompliance
} from './utils'

/**
 * Data classification and HIPAA context types
 */
export {
  DataClassification,
  HIPAAContext,
  DataAccessContext,
  AdminRole,
  ContentStatus,
  CategoryType,
  AuditAction
} from './types'

/**
 * Common constants
 */
export {
  TABLE_NAMES,
  QUERY_LIMITS,
  COMPLIANCE_LEVELS
} from './utils'