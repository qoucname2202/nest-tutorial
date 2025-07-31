import { HTTPMethod } from 'src/shared/constants/role.constant'
import { PermissionSchema } from 'src/shared/models/shared-permission.model'
import { z } from 'zod'

const HTTPMethodSchema = z.enum([
  HTTPMethod.GET,
  HTTPMethod.POST,
  HTTPMethod.PUT,
  HTTPMethod.DELETE,
  HTTPMethod.PATCH,
  HTTPMethod.OPTIONS,
  HTTPMethod.HEAD,
])

// === Create Permission Schema ===
export const CreatePermissionBodySchema = PermissionSchema.pick({
  name: true,
  description: true,
  path: true,
  method: true,
  module: true,
}).strict()

// === Update Permission Schema ===
export const UpdatePermissionBodySchema = PermissionSchema.pick({
  name: true,
  description: true,
  path: true,
  method: true,
  module: true,
})
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

// === Permission Response Schema ===
export const PermissionResponseSchema = PermissionSchema.omit({
  deletedAt: true,
  deletedById: true,
})

// === Permission List Response Schema ===
export const GetPermissionsResponseSchema = z.object({
  data: z.array(PermissionResponseSchema),
  totalItems: z.number().int().nonnegative(),
})

export const PermissionListResponseSchema = z.object({
  data: z.array(PermissionResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

// === Permission Query Parameters Schema ===
export const GetPermissionQuerySchema = z
  .object({
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
    method: HTTPMethodSchema.optional(),
    includeDeleted: z
      .string()
      .optional()
      .transform((val) => val === 'true')
      .default('false'),
  })
  .strict()

// === Permission ID Parameter Schema ===
export const GetPermissionIdParamSchema = z
  .object({
    id: z
      .string({ message: 'Permission ID is required' })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Permission ID must be a positive integer' }),
  })
  .strict()

// === Bulk Delete Schema ===
export const BulkDeletePermissionsSchema = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1, { message: 'At least one permission ID must be provided' })
    .max(50, { message: 'Cannot delete more than 50 permissions at once' }),
})

// === Permission with Relations Schema ===
export const PermissionWithRelationsSchema = PermissionSchema.extend({
  roles: z.array(z.any()).optional(),
  createdBy: z.any().nullable().optional(),
  updatedBy: z.any().nullable().optional(),
  deletedBy: z.any().nullable().optional(),
})

// === Role Assignment Schema ===
export const AssignRolesToPermissionSchema = z.object({
  roleIds: z
    .array(z.number().int().positive())
    .min(1, { message: 'At least one role ID must be provided' })
    .max(20, { message: 'Cannot assign more than 20 roles at once' }),
})

// === Permission Path and Method Validation Schema ===
export const PermissionPathMethodSchema = z.object({
  path: PermissionSchema.shape.path,
  method: PermissionSchema.shape.method,
})

// === Permission Statistics Schema ===
export const PermissionStatsSchema = z.object({
  totalPermissions: z.number().int().nonnegative(),
  permissionsByMethod: z.record(
    z.enum([
      HTTPMethod.GET,
      HTTPMethod.POST,
      HTTPMethod.PUT,
      HTTPMethod.DELETE,
      HTTPMethod.PATCH,
      HTTPMethod.OPTIONS,
      HTTPMethod.HEAD,
    ]),
    z.number().int().nonnegative(),
  ),
  deletedPermissions: z.number().int().nonnegative(),
  recentlyCreated: z.number().int().nonnegative(),
})

// === Type Exports ===
export type HTTPMethodType = (typeof HTTPMethod)[keyof typeof HTTPMethod]
export type PermissionType = z.infer<typeof PermissionSchema>
export type CreatePermissionBodyType = z.infer<typeof CreatePermissionBodySchema>
export type UpdatePermissionBodyType = z.infer<typeof UpdatePermissionBodySchema>
export type PermissionResponseType = z.infer<typeof PermissionResponseSchema>
export type PermissionListResponseType = z.infer<typeof PermissionListResponseSchema>
export type GetPermissionQueryType = z.infer<typeof GetPermissionQuerySchema>
export type GetPermissionIdParamType = z.infer<typeof GetPermissionIdParamSchema>
export type BulkDeletePermissionsType = z.infer<typeof BulkDeletePermissionsSchema>
export type PermissionWithRelationsType = z.infer<typeof PermissionWithRelationsSchema>
export type AssignRolesToPermissionType = z.infer<typeof AssignRolesToPermissionSchema>
export type PermissionPathMethodType = z.infer<typeof PermissionPathMethodSchema>
export type PermissionStatsType = z.infer<typeof PermissionStatsSchema>
export type GetPermissionsResponseType = z.infer<typeof GetPermissionsResponseSchema>
