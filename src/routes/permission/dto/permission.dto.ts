import { Get } from '@nestjs/common'
import { createZodDto } from 'nestjs-zod'
import {
  CreatePermissionBodySchema,
  UpdatePermissionBodySchema,
  PermissionResponseSchema,
  PermissionListResponseSchema,
  BulkDeletePermissionsSchema,
  AssignRolesToPermissionSchema,
  PermissionPathMethodSchema,
  PermissionStatsSchema,
  GetPermissionQuerySchema,
  GetPermissionIdParamSchema,
  GetPermissionsResponseSchema,
} from '../permission.model'
import { MessageResSchema } from 'src/shared/models/response.model'

// === Request DTOs ===

/**
 * DTO for creating a new permission
 * Contains permission name, description, path, and HTTP method validation
 */
export class CreatePermissionBodyDTO extends createZodDto(CreatePermissionBodySchema) {}

/**
 * DTO for updating an existing permission
 * All fields are optional but at least one must be provided
 */
export class UpdatePermissionBodyDTO extends createZodDto(UpdatePermissionBodySchema) {}

/**
 * DTO for get all permissions response
 * Includes total items count and permission data
 */

export class GetPermissionsResDTO extends createZodDto(GetPermissionsResponseSchema) {}

/**
 * DTO for permission query parameters
 * Supports pagination, search, method filtering, and soft delete filtering
 */
export class GetPermissionQueryDTO extends createZodDto(GetPermissionQuerySchema) {}

/**
 * DTO for permission ID path parameter
 * Validates and transforms the permission ID to integer
 */
export class GetPermissionIdParamDTO extends createZodDto(GetPermissionIdParamSchema) {}

/**
 * DTO for bulk delete operations
 * Allows deletion of multiple permissions at once
 */
export class BulkDeletePermissionsDTO extends createZodDto(BulkDeletePermissionsSchema) {}

/**
 * DTO for assigning roles to a permission
 * Contains array of role IDs to assign
 */
export class AssignRolesToPermissionDTO extends createZodDto(AssignRolesToPermissionSchema) {}

/**
 * DTO for validating permission path and method combination
 * Used for checking uniqueness before creation/update
 */
export class PermissionPathMethodDTO extends createZodDto(PermissionPathMethodSchema) {}

// === Response DTOs ===

/**
 * DTO for single permission response
 * Excludes sensitive fields like deletedAt and deletedById
 */
export class PermissionResponseDTO extends createZodDto(PermissionResponseSchema) {}

/**
 * DTO for paginated permission list response
 * Includes pagination metadata
 */
export class PermissionListResponseDTO extends createZodDto(PermissionListResponseSchema) {}

/**
 * DTO for permission statistics response
 * Contains counts and breakdowns of permissions
 */
export class PermissionStatsResponseDTO extends createZodDto(PermissionStatsSchema) {}

/**
 * DTO for generic message responses
 * Used for success/error messages
 */
export class MessageResponseDTO extends createZodDto(MessageResSchema) {}
