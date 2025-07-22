import { createZodDto } from 'nestjs-zod'
import {
  CreateLanguageBodySchema,
  UpdateLanguageBodySchema,
  LanguageResponseSchema,
  LanguageListResponseSchema,
  LanguageQuerySchema,
  LanguageIdParamSchema,
  BulkDeleteLanguagesSchema,
  GetLanguagesResSchema,
} from '../language.model'
import { MessageResSchema } from 'src/shared/models/response.model'

// === Request DTOs ===

/**
 * DTO for creating a new language
 * Contains language ID and name validation
 */
export class CreateLanguageBodyDTO extends createZodDto(CreateLanguageBodySchema) {}

/**
 * DTO for updating an existing language
 * All fields are optional but at least one must be provided
 */
export class UpdateLanguageBodyDTO extends createZodDto(UpdateLanguageBodySchema) {}

/**
 * DTO for language query parameters
 * Supports pagination, search, and soft delete filtering
 */
export class LanguageQueryDTO extends createZodDto(LanguageQuerySchema) {}

/**
 * DTO for language ID path parameter
 * Validates the language ID format
 */
export class LanguageIdParamDTO extends createZodDto(LanguageIdParamSchema) {}

/**
 * DTO for bulk delete operations
 * Allows deletion of multiple languages at once
 */
export class BulkDeleteLanguagesDTO extends createZodDto(BulkDeleteLanguagesSchema) {}

// === Response DTOs ===

/**
 * DTO for single language response
 * Excludes sensitive fields like deletedAt
 */
export class LanguageResponseDTO extends createZodDto(LanguageResponseSchema) {}

/**
 * DTO for paginated language list response
 * Includes pagination metadata
 */
export class LanguageListResponseDTO extends createZodDto(LanguageListResponseSchema) {}

/**
 * DTO for generic message responses
 * Used for success/error messages
 */
export class MessageResponseDTO extends createZodDto(MessageResSchema) {}

/**
 * DTO for get all languages response
 * Includes total items count and language data
 */
export class GetAllLanguageResponseDTO extends createZodDto(GetLanguagesResSchema) {}
