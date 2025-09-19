# Bulk Operations System

A comprehensive bulk operations interface for Story 1.4 Task 6 that provides advanced content management capabilities across all content types.

## Overview

The bulk operations system consists of several integrated components that work together to provide a complete solution for managing large amounts of content efficiently and safely.

### Core Components

#### 1. **BulkOperationsToolbar** (`BulkOperationsToolbar.tsx`)
- Main interface for bulk operations
- Provides quick actions (publish, unpublish, archive, delete)
- Advanced operations dropdown (duplicate, move, tag, SEO update)
- Import/Export functionality
- Selection management controls
- Operation progress indicators

#### 2. **BulkSelectionManager** (`BulkSelectionManager.tsx`)
- React Context-based selection state management
- Supports keyboard-enhanced selection (Shift+Click, Ctrl+Click)
- Configurable selection limits and persistence
- Range selection and inversion utilities
- Hook-based API for easy integration

#### 3. **BulkImportModal** (`BulkImportModal.tsx`)
- Multi-format import support (CSV, JSON, XML)
- Real-time validation with error preview
- Duplicate detection and handling
- Import preview with statistics
- Customizable import options

#### 4. **BulkExportModal** (`BulkExportModal.tsx`)
- Multiple export formats (CSV, Excel, JSON, XML)
- Flexible field selection
- Advanced filtering options
- Export scope control (selected/filtered/all)
- Format-specific optimization

#### 5. **Universal Bulk API** (`/api/admin/bulk/route.ts`)
- Handles all bulk operations uniformly
- Transaction-based processing for data integrity
- Comprehensive error handling and recovery
- Audit logging and security validation
- Support for all content types

## Features

### ✅ Selection Management
- **Multi-select with checkboxes**: Individual item selection
- **Select all/none**: Bulk selection controls
- **Keyboard shortcuts**: Shift+Click for range, Ctrl+Click for individual
- **Selection persistence**: Optional cross-session selection memory
- **Selection limits**: Configurable maximum selection counts

### ✅ Quick Operations
- **Publish/Unpublish**: Change content visibility status
- **Archive**: Move items to archived status
- **Delete**: Permanent removal with confirmation dialogs
- **Status updates**: Batch status changes with proper timestamps

### ✅ Advanced Operations
- **Duplicate**: Create copies with automatic slug generation
- **Move to Category**: Bulk category reassignment
- **Bulk Tagging**: Add, remove, or replace tags across items
- **SEO Updates**: Batch metadata updates (title, description, keywords)

### ✅ Import System
- **Multi-format support**: CSV, JSON, XML file uploads
- **Template generation**: Download format-specific templates
- **Validation engine**: Real-time error detection and warnings
- **Preview system**: Review data before import
- **Duplicate handling**: Skip or update existing records
- **Error recovery**: Detailed error reporting with row-level precision

### ✅ Export System
- **Format options**: CSV, Excel (XLSX), JSON, XML
- **Field selection**: Choose specific data fields to export
- **Filtering**: Date ranges, status, category, author filters
- **Scope control**: Selected items, filtered results, or all data
- **Large dataset handling**: Optimized for performance with size limits

### ✅ Security & Compliance
- **Authentication required**: All operations require valid sessions
- **Audit logging**: Complete operation history tracking
- **Input validation**: Comprehensive data sanitization
- **Transaction safety**: Database integrity protection
- **Healthcare compliance**: HIPAA-conscious data handling

## Integration Guide

### Basic Usage

```typescript
import { BulkOperationsExample } from '@/components/admin/content/BulkOperationsExample'

// Simple integration
<BulkOperationsExample
  contentType="posts"
  data={contentData}
  loading={loading}
/>
```

### Advanced Integration

```typescript
import { BulkSelectionProvider, BulkOperationsToolbar } from '@/components/admin/content'
import { AdminDataTable } from '@/components/admin/ui/tables/AdminDataTable'

function MyContentManager() {
  return (
    <BulkSelectionProvider
      config={{
        maxSelection: 1000,
        persistSelection: true,
        storageKey: 'my-content-selection',
        onSelectionChange: (state) => {
          console.log(`${state.selectedCount} items selected`)
        }
      }}
    >
      <BulkOperationsToolbar
        contentType="posts"
        selectedCount={selectedCount}
        totalCount={totalCount}
        onBulkOperation={handleBulkOperation}
        // ... other props
      />
      
      <AdminDataTable
        data={data}
        columns={columns}
        selectable={true}
        // ... other props
      />
    </BulkSelectionProvider>
  )
}
```

### Custom Bulk Operation Handler

```typescript
const handleBulkOperation = async (operation: BulkOperation): Promise<BulkOperationResult> => {
  try {
    const response = await fetch('/api/admin/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(operation)
    })

    const result = await response.json()
    
    if (result.success) {
      // Handle success
      showSuccessNotification(`${result.successCount} items processed`)
      refreshData()
    } else {
      // Handle errors
      showErrorNotification(`${result.errorCount} items failed`)
    }

    return result
  } catch (error) {
    // Handle request failure
    return {
      success: false,
      successCount: 0,
      errorCount: 1,
      processedIds: [],
      failedIds: [],
      errors: [{ id: 'general', error: error.message }],
      warnings: []
    }
  }
}
```

## API Endpoints

### POST `/api/admin/bulk`
Execute bulk operations on content.

**Request Body:**
```typescript
{
  action: 'delete' | 'publish' | 'unpublish' | 'archive' | 'duplicate' | 'move' | 'bulk-tag' | 'seo-update' | 'import',
  type: 'pages' | 'posts' | 'services' | 'platforms' | 'team-members' | 'testimonials',
  selectedIds: string[],
  options?: {
    // Action-specific options
  }
}
```

**Response:**
```typescript
{
  success: boolean,
  successCount: number,
  errorCount: number,
  processedIds: string[],
  failedIds: string[],
  errors: Array<{ id: string, error: string }>,
  warnings: string[]
}
```

### GET `/api/admin/bulk/export`
Export content data in various formats.

**Query Parameters:**
- `format`: csv, xlsx, json, xml
- `scope`: selected, filtered, all
- `contentType`: content type to export
- `fields`: comma-separated field list
- `selectedIds`: comma-separated IDs (for selected scope)
- Various filter parameters

## Content Type Support

The system supports all major content types in the HMHCP website:

- **Pages**: Static pages and landing pages
- **Posts**: Blog posts and articles
- **Services**: Service offerings and descriptions
- **Platforms**: Technology platforms and tools
- **Team Members**: Staff and team information
- **Testimonials**: Customer testimonials and reviews

Each content type has its own field schema and validation rules defined in the type system.

## Error Handling

### Validation Errors
- **Field-level validation**: Real-time validation with specific error messages
- **Row-level tracking**: Import errors tracked by row number and field
- **Severity levels**: Distinguish between errors (blocking) and warnings (informational)

### Operation Errors
- **Partial failures**: Operations continue even if individual items fail
- **Error aggregation**: Detailed error reporting with failed item IDs
- **Recovery suggestions**: Actionable error messages where possible

### Transaction Safety
- **Database transactions**: All operations wrapped in transactions
- **Rollback capability**: Automatic rollback on critical failures
- **Audit trail**: Complete operation history for compliance

## Performance Considerations

### Large Dataset Handling
- **Batch processing**: Operations processed in manageable chunks
- **Memory optimization**: Streaming for large exports
- **Progress indicators**: Real-time progress feedback
- **Format limits**: Size limits based on export format capabilities

### Caching Strategy
- **Selection persistence**: Optional client-side selection caching
- **Template caching**: Import templates cached for reuse
- **Query optimization**: Efficient database queries with proper indexing

## Security Features

### Authentication & Authorization
- **Session validation**: All operations require valid user sessions
- **Role-based access**: Future extensibility for role-based permissions
- **Rate limiting**: Protection against abuse through API rate limits

### Data Protection
- **Input sanitization**: All user input properly validated and sanitized
- **SQL injection protection**: Parameterized queries and ORM usage
- **XSS prevention**: Output encoding and CSP headers
- **CSRF protection**: Token-based CSRF protection

### Audit & Compliance
- **Operation logging**: Complete audit trail of all bulk operations
- **User tracking**: Operations tracked by user ID and timestamp
- **Data retention**: Audit logs retained according to compliance requirements
- **HIPAA considerations**: Healthcare data handling best practices

## Testing

### Unit Tests
Run individual component tests:
```bash
pnpm test components/admin/content/BulkOperationsToolbar.test.tsx
pnpm test components/admin/content/BulkSelectionManager.test.tsx
```

### Integration Tests
Test the complete bulk operations flow:
```bash
pnpm test:e2e bulk-operations.spec.ts
```

### API Tests
Test bulk operations API endpoints:
```bash
pnpm test:api bulk-operations.test.ts
```

## Troubleshooting

### Common Issues

1. **Import validation errors**
   - Check file format matches selected type
   - Verify required fields are present
   - Ensure data types match schema expectations

2. **Selection not persisting**
   - Enable `persistSelection` in BulkSelectionProvider config
   - Check localStorage permissions
   - Verify `storageKey` is unique

3. **Export format errors**
   - Check dataset size against format limits
   - Verify field selection includes required fields
   - Ensure proper authentication headers

4. **Operation timeouts**
   - Reduce batch size for large operations
   - Check database connection stability
   - Monitor server resource usage

### Debug Mode
Enable detailed logging:
```typescript
// In your bulk operation handler
console.log('Bulk operation debug:', {
  operation,
  selectedIds,
  timestamp: new Date().toISOString()
})
```

## Future Enhancements

### Planned Features
- **Scheduled operations**: Queue bulk operations for later execution
- **Operation templates**: Save and reuse common operation configurations
- **Advanced validation**: Custom validation rules per content type
- **Batch API optimization**: Further performance improvements for large datasets
- **Real-time progress**: WebSocket-based progress updates for long operations

### Extension Points
- **Custom operations**: Plugin system for custom bulk operations
- **Format plugins**: Support for additional import/export formats
- **Validation plugins**: Custom validation rule extensions
- **UI themes**: Customizable UI components and styling

---

This bulk operations system provides a comprehensive, secure, and user-friendly solution for managing large amounts of content in the HMHCP website. It integrates seamlessly with the existing admin interface while providing powerful new capabilities for efficient content management.