import { createZodDto } from 'nestjs-zod'
import {
  CreateRoleBodySchema,
  UpdateRoleBodySchema,
  RoleResponseSchema,
  RoleIdParamSchema,
  BulkDeleteRolesSchema,
  AssignPermissionsToRoleSchema,
  RoleStatsSchema,
  RoleNameValidationSchema,
  ToggleRoleStatusSchema,
  GetRolesResSchema,
  GetRoleQuerySchema,
  GetRoleListResSchema,
} from '../role.model'
import { MessageResSchema } from 'src/shared/models/response.model'

// === Request DTOs ===

/**
 * DTO for creating a new role
 * Contains role name, description, and active status validation
 */
export class CreateRoleBodyDTO extends createZodDto(CreateRoleBodySchema) {}

/**
 * DTO for updating an existing role
 * All fields are optional but at least one must be provided
 */
export class UpdateRoleBodyDTO extends createZodDto(UpdateRoleBodySchema) {}

/**
 * DTO for role query parameters
 * Supports pagination, search, active status filtering, and soft delete filtering
 */
export class GetRoleQueryDTO extends createZodDto(GetRoleQuerySchema) {}

/**
 * DTO for role ID path parameter
 * Validates and transforms the role ID to integer
 */
export class RoleIdParamDTO extends createZodDto(RoleIdParamSchema) {}

/**
 * DTO for bulk delete operations
 * Allows deletion of multiple roles at once
 */
export class BulkDeleteRolesDTO extends createZodDto(BulkDeleteRolesSchema) {}

/**
 * DTO for assigning permissions to a role
 * Contains array of permission IDs to assign
 */
export class AssignPermissionsToRoleDTO extends createZodDto(AssignPermissionsToRoleSchema) {}

/**
 * DTO for validating role name
 * Used for checking uniqueness before creation/update
 */
export class RoleNameValidationDTO extends createZodDto(RoleNameValidationSchema) {}

/**
 * DTO for toggling role active status
 * Contains boolean flag for active/inactive status
 */
export class ToggleRoleStatusDTO extends createZodDto(ToggleRoleStatusSchema) {}

// === Response DTOs ===

/**
 * DTO for single role response
 * Excludes sensitive fields like deletedAt and deletedById
 */
export class RoleResponseDTO extends createZodDto(RoleResponseSchema) {}

/**
 * DTO for paginated role list response
 * Includes pagination metadata
 */
export class GetRolesResDTO extends createZodDto(GetRolesResSchema) {}

/**
 * DTO for role list response
 * Includes total items count and role data
 */
export class GetRoleListResDTO extends createZodDto(GetRoleListResSchema) {}

/**
 * DTO for role statistics response
 * Contains counts and breakdowns of roles
 */
export class RoleStatsResponseDTO extends createZodDto(RoleStatsSchema) {}

/**
 * DTO for generic message responses
 * Used for success/error messages
 */
export class MessageResponseDTO extends createZodDto(MessageResSchema) {}
