import { z } from 'zod'
import { RoleName } from 'src/shared/constants/role.constant'
import { RoleSchema } from 'src/shared/models/shared-role.model'
import { PermissionSchema } from 'src/shared/models/shared-permission.model'

// === Role Name Enum Schema ===
export const RoleNameSchema = z.enum([RoleName.Admin, RoleName.Client, RoleName.Seller] as const)

// === Role With Permissions Schema ===
export const RoleWithPermissionsSchema = RoleSchema.extend({
  permissions: z.array(PermissionSchema),
})

// === Create Role Schema ===
export const CreateRoleBodySchema = RoleSchema.pick({
  name: true,
  description: true,
  isActive: true,
}).strict()

// === Update Role Schema ===
export const UpdateRoleBodySchema = RoleSchema.pick({
  name: true,
  description: true,
  isActive: true,
})
  .extend({
    permissionIds: z.array(z.number()),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

// === Role Response Schema ===
export const RoleResponseSchema = RoleSchema.omit({
  deletedAt: true, // Hide soft delete field from public responses
  deletedById: true, // Hide deleted by field from public responses
})

// === Role List Using Pagination Response Schema ===
export const GetRolesResSchema = z.object({
  data: z.array(RoleResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

// === Role List Response Schema ===
export const GetRoleListResSchema = z.object({
  data: z.array(RoleResponseSchema),
  totalItems: z.number().int().nonnegative(),
})

// === Role Query Parameters Schema ===
export const GetRoleQuerySchema = z.object({
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
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  includeDeleted: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default('false'),
})

// === Role ID Parameter Schema ===
export const RoleIdParamSchema = z.object({
  roleId: z
    .string({ message: 'Role ID is required' })
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, { message: 'Role ID must be a positive integer' }),
})

// === Bulk Delete Schema ===
export const BulkDeleteRolesSchema = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1, { message: 'At least one role ID must be provided' })
    .max(50, { message: 'Cannot delete more than 50 roles at once' }),
})

// === Role with Relations Schema ===
export const RoleWithRelationsSchema = RoleSchema.extend({
  permissions: z.array(z.any()).optional(),
  users: z.array(z.any()).optional(),
  createdBy: z.any().nullable().optional(),
  updatedBy: z.any().nullable().optional(),
  deletedBy: z.any().nullable().optional(),
})

// === Permission Assignment Schema ===
export const AssignPermissionsToRoleSchema = z.object({
  permissionIds: z
    .array(z.number().int().positive())
    .min(1, { message: 'At least one permission ID must be provided' })
    .max(50, { message: 'Cannot assign more than 50 permissions at once' }),
})

// === Role Statistics Schema ===
export const RoleStatsSchema = z.object({
  totalRoles: z.number().int().nonnegative(),
  activeRoles: z.number().int().nonnegative(),
  inactiveRoles: z.number().int().nonnegative(),
  deletedRoles: z.number().int().nonnegative(),
  recentlyCreated: z.number().int().nonnegative(),
  rolesByName: z.record(z.string(), z.number().int().nonnegative()),
})

// === Role Name Validation Schema ===
export const RoleNameValidationSchema = z.object({
  name: RoleSchema.shape.name,
})

// === Role Status Toggle Schema ===
export const ToggleRoleStatusSchema = z.object({
  isActive: z.boolean({ message: 'Active status must be a boolean' }),
})

// === Type Exports ===
export type RoleNameType = z.infer<typeof RoleNameSchema>
export type RoleType = z.infer<typeof RoleSchema>
export type CreateRoleBodyType = z.infer<typeof CreateRoleBodySchema>
export type UpdateRoleBodyType = z.infer<typeof UpdateRoleBodySchema>
export type RoleResponseType = z.infer<typeof RoleResponseSchema>
export type GetRolesResType = z.infer<typeof GetRolesResSchema>
export type GetRoleQueryType = z.infer<typeof GetRoleQuerySchema>
export type RoleIdParamType = z.infer<typeof RoleIdParamSchema>
export type BulkDeleteRolesType = z.infer<typeof BulkDeleteRolesSchema>
export type RoleWithRelationsType = z.infer<typeof RoleWithRelationsSchema>
export type AssignPermissionsToRoleType = z.infer<typeof AssignPermissionsToRoleSchema>
export type RoleStatsType = z.infer<typeof RoleStatsSchema>
export type RoleNameValidationType = z.infer<typeof RoleNameValidationSchema>
export type ToggleRoleStatusType = z.infer<typeof ToggleRoleStatusSchema>
export type GetRoleListResType = z.infer<typeof GetRoleListResSchema>
export type RoleWithPermissionsType = z.infer<typeof RoleWithPermissionsSchema>
