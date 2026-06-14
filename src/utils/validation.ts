import { z } from 'zod'

// Resource type validation
export const ResourceTypeSchema = z.enum(['paper', 'dataset', 'book', 'tutorial'])

// Discipline validation
export const DisciplineSchema = z.enum([
  'computer-science',
  'physics',
  'biology',
  'mathematics',
  'economics',
  'humanities'
])

// Citation format validation
export const CitationSchema = z.object({
  apa: z.string().min(1, 'APA citation is required'),
  mla: z.string().min(1, 'MLA citation is required'),
  gbt: z.string().min(1, 'GB/T citation is required'),
  bibtex: z.string().min(1, 'BibTeX citation is required')
})

// Resource validation schema
export const ResourceSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  type: ResourceTypeSchema,
  title: z.string().min(1, 'Title is required'),
  authors: z.array(z.string().min(1)).min(1, 'At least one author is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  venue: z.string().optional(),
  doi: z.string().optional(),
  discipline: DisciplineSchema,
  subdiscipline: z.string().optional(),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  abstract: z.string().min(10, 'Abstract must be at least 10 characters'),
  preview: z.string().min(10, 'Preview must be at least 10 characters'),
  downloadUrl: z.string().url().optional(),
  externalUrl: z.string().url().optional(),
  citation: CitationSchema,
  addedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  citations: z.number().int().min(0).optional()
})

// Array of resources validation
export const ResourcesArraySchema = z.array(ResourceSchema)

// Validation result type
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: Array<{
    path: string
    message: string
  }>
}

// Validate a single resource
export function validateResource(data: unknown): ValidationResult<z.infer<typeof ResourceSchema>> {
  try {
    const result = ResourceSchema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      }
    }
    return {
      success: false,
      errors: [{ path: '', message: 'Unknown validation error' }]
    }
  }
}

// Validate an array of resources
export function validateResources(data: unknown): ValidationResult<z.infer<typeof ResourcesArraySchema>> {
  try {
    const result = ResourcesArraySchema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      }
    }
    return {
      success: false,
      errors: [{ path: '', message: 'Unknown validation error' }]
    }
  }
}

// Validate and log errors (useful for development)
export function validateAndLog(data: unknown, label = 'Resource'): boolean {
  const result = validateResources(data)
  if (!result.success) {
    console.error(`❌ ${label} validation failed:`)
    result.errors?.forEach(err => {
      console.error(`  - ${err.path}: ${err.message}`)
    })
    return false
  }
  console.log(`✅ ${label} validation passed (${(data as unknown[]).length} items)`)
  return true
}
