# Admin Data Access Layer (DAL)

The Admin DAL provides a type-safe, healthcare-compliant data access layer for the HM Healthcare Partners admin system. Built on top of Supabase with TypeScript strict mode, Zod validation, and comprehensive audit logging.

## Architecture Overview

```
lib/dal/admin/
├── base.ts          # BaseDAL abstract class with common operations
├── types.ts         # TypeScript interfaces and Zod schemas
├── utils.ts         # Database utilities and healthcare validation
├── examples.ts      # Example implementations and usage patterns
├── index.ts         # Module exports
└── README.md        # This documentation
```

## Key Features

- **Type Safety**: Full TypeScript support with strict mode
- **Healthcare Compliance**: HIPAA-aware data handling and validation
- **Audit Logging**: Comprehensive audit trails for all operations
- **Transaction Support**: Atomic operations with retry mechanisms
- **Connection Pooling**: Optimized database connections
- **Healthcare Data Validation**: Specialized validation for healthcare content
- **Batch Operations**: Efficient bulk data operations
- **Health Monitoring**: Database health checks and statistics

## Quick Start

### 1. Basic Usage

```typescript
import { supabaseAdmin } from '@/lib/supabase-client'
import { BlogPostDAL } from '@/lib/dal/admin'
import { DataAccessContext, AdminRole } from '@/lib/dal/admin/types'

// Create DAL instance
const blogPostDAL = new BlogPostDAL(supabaseAdmin)

// Set access context
const context: DataAccessContext = {
  userId: 'user-123',
  role: AdminRole.ADMIN,
  permissions: ['content.*'],
  classification: DataClassification.PUBLIC,
  hipaaContext: {
    isHealthcareData: false,
    complianceLevel: 'basic',
    auditRequired: false,
    encryptionRequired: false
  },
  auditRequired: true
}

blogPostDAL.setContext(context)

// Create a blog post
const result = await blogPostDAL.create({
  title: "Healthcare Innovation Trends 2024",
  slug: "healthcare-innovation-2024",
  content: "The healthcare industry continues to evolve...",
  author_id: "author-123",
  status: ContentStatus.DRAFT
})
```

### 2. Custom DAL Implementation

```typescript
import { BaseDAL } from '@/lib/dal/admin/base'
import { PlatformCreateSchema, PlatformUpdateSchema } from '@/lib/dal/admin/types'

export class PlatformDAL extends BaseDAL<Platform, PlatformCreate, PlatformUpdate> {
  constructor(client: SupabaseClient) {
    super(
      client,
      'platforms',
      ['name', 'description', 'features'], // searchable columns
      true, // requires audit
      DataClassification.PUBLIC
    )
  }

  protected getCreateSchema() {
    return PlatformCreateSchema
  }

  protected getUpdateSchema() {
    return PlatformUpdateSchema
  }

  protected transformForSave(data: PlatformCreate | PlatformUpdate) {
    return {
      ...data,
      slug: data.slug || generateSlug(data.name || '')
    }
  }

  protected transformFromDatabase(data: Record<string, any>): Platform {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      detailed_description: data.detailed_description,
      features: data.features || [],
      technologies: data.technologies || [],
      status: data.status,
      featured_image: data.featured_image,
      gallery_images: data.gallery_images || [],
      demo_url: data.demo_url,
      documentation_url: data.documentation_url,
      display_order: data.display_order || 0,
      is_featured: data.is_featured || false,
      created_by: data.created_by,
      updated_by: data.updated_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  // Custom methods
  async getFeatured() {
    return this.getMany({
      filters: { is_featured: true, status: 'published' },
      sortBy: 'display_order',
      sortOrder: 'asc'
    })
  }
}
```

## Core Components

### BaseDAL Class

The abstract `BaseDAL` class provides common CRUD operations:

- `create(data)` - Create new entity
- `getById(id)` - Get entity by ID
- `getMany(options)` - Get multiple entities with pagination/filtering
- `update(id, data)` - Update entity
- `delete(id)` - Delete entity
- `createBatch(items)` - Batch create operations
- `executeInTransaction(operations)` - Execute operations atomically
- `healthCheck()` - Test database connection
- `getStats()` - Get table statistics

### Data Access Context

All operations require a `DataAccessContext` for security and audit purposes:

```typescript
interface DataAccessContext {
  userId: string              // Current user ID
  role: AdminRole            // User's admin role
  permissions: string[]       // User's permissions
  classification: DataClassification  // Data classification level
  hipaaContext: HIPAAContext // Healthcare compliance context
  auditRequired: boolean     // Whether to log audit trails
}
```

### Healthcare Compliance

The system includes healthcare-specific features:

- **HIPAA Context Detection**: Automatically detects healthcare data
- **Data Classification**: Public, Internal, Confidential, PHI levels
- **Access Validation**: Role-based access control for healthcare data
- **Audit Requirements**: Mandatory audit logging for healthcare operations
- **Data Sanitization**: Removes sensitive information from logs

## Database Tables

### Supported Entity Types

The admin DAL supports the following entity types:

1. **Admin Users** (`admin_users`)
   - User management and authentication
   - Role-based permissions
   - Security features (2FA, account locking)

2. **Pages** (`pages`)
   - Managed content pages
   - SEO configuration
   - Template support

3. **Blog Posts** (`blog_posts`)
   - Blog content management
   - Category and tag support
   - SEO optimization

4. **Team Members** (`team_members`)
   - Team profile management
   - Social media links
   - Expertise tracking

5. **Platforms** (`platforms`)
   - Technology platform information
   - Feature listings
   - Demo and documentation links

6. **Services** (`services`)
   - Service offerings
   - Pricing models
   - Category organization

7. **Categories** (`categories`)
   - Content categorization
   - Hierarchical structure
   - Multiple content types

8. **Testimonials** (`testimonials`)
   - Client testimonials
   - Rating system
   - Service/platform associations

9. **Audit Logs** (`audit_logs`)
   - Comprehensive audit trails
   - Security compliance
   - Change tracking

## Validation and Schemas

All entities use Zod schemas for validation:

```typescript
// Example: Blog Post validation
const BlogPostCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  content: z.string().min(1, 'Content is required'),
  author_id: z.string().uuid('Valid author ID required'),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  // ... more fields
})
```

## Error Handling

The DAL provides comprehensive error handling:

```typescript
const result = await blogPostDAL.create(data)

if (result.error) {
  console.error('Operation failed:', result.error)
  return
}

// result.data contains the created entity
console.log('Created:', result.data)
```

## Audit Logging

Audit logs are automatically created for:
- All healthcare data operations
- Destructive operations (DELETE)
- Permission changes
- Sensitive resource access

```typescript
// Audit logs are created automatically
const auditLog = {
  user_id: 'user-123',
  action: 'CREATE',
  resource_type: 'blog_posts',
  resource_id: 'post-456',
  details: { /* sanitized operation details */ },
  created_at: '2024-01-01T12:00:00Z'
}
```

## Transaction Support

Execute multiple operations atomically:

```typescript
const result = await teamMemberDAL.executeInTransaction(async (dal) => {
  const member1 = await dal.create(memberData1)
  const member2 = await dal.create(memberData2)
  
  if (member1.error || member2.error) {
    throw new Error('Transaction failed')
  }
  
  return [member1.data, member2.data]
})
```

## Batch Operations

Efficiently process multiple items:

```typescript
const blogPosts = [
  { title: "Post 1", content: "Content 1", author_id: "author-1" },
  { title: "Post 2", content: "Content 2", author_id: "author-2" },
  { title: "Post 3", content: "Content 3", author_id: "author-3" }
]

const result = await blogPostDAL.createBatch(blogPosts)
// All posts created atomically
```

## Health Monitoring

Monitor database health and performance:

```typescript
// Check connection health
const health = await blogPostDAL.healthCheck()
console.log('Healthy:', health.healthy)
console.log('Response time:', health.responseTime, 'ms')

// Get table statistics
const stats = await blogPostDAL.getStats()
console.log('Total records:', stats.totalRecords)
console.log('Recent activity:', stats.recentActivity)
```

## Best Practices

### 1. Always Set Context

```typescript
// Required for all operations
dal.setContext({
  userId: currentUser.id,
  role: currentUser.role,
  permissions: currentUser.permissions,
  // ... other context
})
```

### 2. Handle Errors Properly

```typescript
const result = await dal.create(data)

if (result.error) {
  logger.error('Create failed', { error: result.error })
  throw new Error(result.error)
}

return result.data
```

### 3. Use Transactions for Related Operations

```typescript
// Good: Use transaction for related operations
await dal.executeInTransaction(async (dal) => {
  await dal.create(parentData)
  await dal.create(childData)
})

// Bad: Separate operations without transaction
await dal.create(parentData)
await dal.create(childData) // Could fail, leaving inconsistent state
```

### 4. Validate Healthcare Data

```typescript
const hipaaContext = determineHIPAAContext(data)

if (hipaaContext.isHealthcareData) {
  // Additional validation required
  const hasAccess = validateHealthcareAccess(
    userRole,
    DataClassification.CONFIDENTIAL,
    hipaaContext
  )
  
  if (!hasAccess) {
    throw new Error('Insufficient permissions for healthcare data')
  }
}
```

### 5. Use Batch Operations for Multiple Items

```typescript
// Good: Batch operation
await dal.createBatch(items)

// Bad: Multiple individual operations
for (const item of items) {
  await dal.create(item)
}
```

## Security Considerations

1. **Access Control**: Always validate user permissions before operations
2. **Data Sanitization**: Input data is automatically sanitized
3. **Audit Logging**: All sensitive operations are logged
4. **Healthcare Compliance**: HIPAA-aware data handling
5. **Error Context**: Sensitive data is removed from error messages

## Performance Optimization

1. **Connection Pooling**: Efficient database connection management
2. **Query Building**: Optimized query construction
3. **Batch Operations**: Bulk processing for multiple items
4. **Retry Logic**: Automatic retry with exponential backoff
5. **Health Monitoring**: Proactive database health checks

## Migration and Deployment

When deploying the admin DAL system:

1. Ensure all required database tables exist
2. Configure proper environment variables
3. Set up audit logging tables
4. Verify healthcare compliance settings
5. Test connection health and permissions

## Contributing

When extending the admin DAL:

1. Follow the BaseDAL pattern for new entities
2. Include comprehensive Zod validation schemas
3. Implement healthcare compliance where applicable
4. Add audit logging for sensitive operations
5. Include comprehensive JSDoc documentation
6. Write unit tests for all operations
7. Follow TypeScript strict mode requirements

## Support

For questions or issues with the admin DAL system, please refer to:

- Project documentation
- Code examples in `examples.ts`
- TypeScript interfaces in `types.ts`
- Utility functions in `utils.ts`