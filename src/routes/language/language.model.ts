import { z } from 'zod'

// === Base Language Schema ===
export const LanguageSchema = z.object({
  id: z
    .string({ message: 'Language ID is required' })
    .min(1, { message: 'Language ID must not be empty' })
    .max(10, { message: 'Language ID must be at most 10 characters long' })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: 'Language ID can only contain letters, numbers, hyphens, and underscores' }),
  name: z
    .string({ message: 'Language name is required' })
    .min(1, { message: 'Language name must not be empty' })
    .max(500, { message: 'Language name must be at most 500 characters long' }),
  createdById: z.number({ message: 'Created by ID must be a number' }).nullable(),
  updatedById: z.number({ message: 'Updated by ID must be a number' }).nullable(),
  deletedAt: z.date({ message: 'Deleted at must be a valid date' }).nullable(),
  createdAt: z.date({ message: 'Created at must be a valid date' }),
  updatedAt: z.date({ message: 'Updated at must be a valid date' }),
})

export const GetLanguagesResSchema = z.object({
  data: z.array(
    LanguageSchema.omit({
      deletedAt: true,
    }),
  ),
  totalItems: z.number(),
})

// === Create Language Schema ===
export const CreateLanguageBodySchema = LanguageSchema.pick({
  id: true,
  name: true,
}).strict()

// === Update Language Schema ===
export const UpdateLanguageBodySchema = LanguageSchema.pick({
  name: true,
})
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

// === Language Response Schema ===
export const LanguageResponseSchema = LanguageSchema.omit({
  deletedAt: true, // Hide soft delete field from public responses
})

// === Language List Response Schema ===
export const LanguageListResponseSchema = z.object({
  data: z.array(LanguageResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

// === Language Query Parameters Schema ===
export const LanguageQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: 'Page must be a positive number' }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' }),
  search: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : undefined))
    .refine((val) => !val || val.length >= 2, { message: 'Search term must be at least 2 characters long' }),
  includeDeleted: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default('false'),
})

// === Language ID Parameter Schema ===
export const LanguageIdParamSchema = z.object({
  id: z
    .string({ message: 'Language ID is required' })
    .min(1, { message: 'Language ID must not be empty' })
    .max(10, { message: 'Language ID must be at most 10 characters long' }),
})

// === Bulk Delete Schema ===
export const BulkDeleteLanguagesSchema = z.object({
  ids: z
    .array(z.string().min(1).max(10))
    .min(1, { message: 'At least one language ID must be provided' })
    .max(50, { message: 'Cannot delete more than 50 languages at once' }),
})

// === Language with Relations Schema ===
export const LanguageWithRelationsSchema = LanguageSchema.extend({
  userTranslations: z.array(z.any()).optional(),
  productTranslations: z.array(z.any()).optional(),
  categoryTranslations: z.array(z.any()).optional(),
  brandTranslations: z.array(z.any()).optional(),
  createdBy: z.any().nullable().optional(),
  updatedBy: z.any().nullable().optional(),
})

// === Type Exports ===
export type LanguageType = z.infer<typeof LanguageSchema>
export type CreateLanguageBodyType = z.infer<typeof CreateLanguageBodySchema>
export type UpdateLanguageBodyType = z.infer<typeof UpdateLanguageBodySchema>
export type LanguageResponseType = z.infer<typeof LanguageResponseSchema>
export type LanguageListResponseType = z.infer<typeof LanguageListResponseSchema>
export type LanguageQueryType = z.infer<typeof LanguageQuerySchema>
export type LanguageIdParamType = z.infer<typeof LanguageIdParamSchema>
export type BulkDeleteLanguagesType = z.infer<typeof BulkDeleteLanguagesSchema>
export type LanguageWithRelationsType = z.infer<typeof LanguageWithRelationsSchema>
export type GetLanguagesResType = z.infer<typeof GetLanguagesResSchema>
