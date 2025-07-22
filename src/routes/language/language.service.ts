import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common'
import { LanguageRepository } from './language.repo'
import {
  CreateLanguageBodyType,
  UpdateLanguageBodyType,
  LanguageQueryType,
  LanguageResponseType,
  LanguageListResponseType,
  BulkDeleteLanguagesType,
  LanguageWithRelationsType,
  GetLanguagesResType,
} from './language.model'
import { isUniqueConstraintPrismaError, isNotFoundPrismaError } from 'src/shared/helper'
import {
  AtLeastOneFieldMustBeProvidedException,
  InternalCountLanguageErrorException,
  InternalCreateLanguageErrorException,
  InternalDeleteLanguageErrorException,
  InternalDeleteLanguageListErrorException,
  InternalHardDeleteLanguageErrorException,
  InternalRestoreLanguageErrorException,
  InternalRetrieveLanguageErrorException,
  InternalRetrieveLanguageListErrorException,
  InternalUpdateLanguageErrorException,
  LanguageAlreadyExistsException,
  LanguageNotDeletedException,
  NoLanguageFoundToDeleteException,
  NotFoundLanguageException,
} from './language.error'

/**
 * Service class for Language entity business logic
 * Handles validation, error handling, and business rules for language operations
 */
@Injectable()
export class LanguageService {
  constructor(private readonly languageRepository: LanguageRepository) {}

  /**
   * Helper method to map language entity to response type
   * Removes sensitive fields like deletedAt from public responses
   *
   * @param language - The language entity to map
   * @returns The mapped response object
   */
  private mapToResponseType(language: any): LanguageResponseType {
    const { deletedAt, ...responseData } = language
    return responseData as LanguageResponseType
  }

  /**
   * Retrieves all languages
   * @returns Promise resolving to an array of languages
   */

  async getAllLanguage(): Promise<GetLanguagesResType> {
    try {
      const languages = await this.languageRepository.getAll()
      return {
        data: languages,
        totalItems: languages.length,
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw InternalRetrieveLanguageErrorException
    }
  }

  /**
   * Creates a new language with validation and error handling
   *
   * @param createLanguageDto - The language data to create
   * @param createdById - Optional ID of the user creating the language
   * @returns Promise resolving to the created language response
   *
   * @throws ConflictException if language ID already exists
   * @throws InternalServerErrorException for unexpected database errors
   */
  async createLanguage({
    data,
    createdById,
  }: {
    data: CreateLanguageBodyType
    createdById: number
  }): Promise<LanguageResponseType> {
    try {
      // Validate that the language ID doesn't already exist
      const existingLanguage = await this.languageRepository.languageExists(data.id, true)

      if (existingLanguage) {
        throw LanguageAlreadyExistsException
      }

      // Create the language
      const createdLanguage = await this.languageRepository.createLanguage(data, createdById)

      return this.mapToResponseType(createdLanguage)
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw LanguageAlreadyExistsException
      }
      if (error instanceof ConflictException) {
        throw error
      }
      throw InternalCreateLanguageErrorException
    }
  }

  /**
   * Retrieves a paginated list of languages with optional search and filtering
   *
   * @param queryParams - Query parameters for pagination, search, and filtering
   * @returns Promise resolving to paginated language list with metadata
   */
  async findAllLanguages(queryParams: LanguageQueryType): Promise<LanguageListResponseType> {
    try {
      const result = await this.languageRepository.findManyLanguages(queryParams)

      return {
        data: result.data.map((language) => this.mapToResponseType(language)),
        pagination: result.pagination,
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw InternalRetrieveLanguageListErrorException
    }
  }

  /**
   * Retrieves a single language by ID
   *
   * @param id - The language ID to retrieve
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the language response
   *
   * @throws NotFoundException if language is not found
   */
  async findOneLanguage(id: string, includeDeleted: boolean = false): Promise<LanguageResponseType> {
    try {
      const language = await this.languageRepository.findUniqueLanguage(id, includeDeleted)

      if (!language) {
        throw NotFoundLanguageException
      }

      return this.mapToResponseType(language)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw InternalRetrieveLanguageErrorException
    }
  }

  /**
   * Retrieves a language with all its related translations and user information
   *
   * @param id - The language ID to retrieve
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the language with relations
   *
   * @throws NotFoundException if language is not found
   */
  async findLanguageWithRelations(id: string, includeDeleted: boolean = false): Promise<LanguageWithRelationsType> {
    try {
      const language = await this.languageRepository.findLanguageWithRelations(id, includeDeleted)

      if (!language) {
        throw NotFoundLanguageException
      }

      return language
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw InternalRetrieveLanguageErrorException
    }
  }

  /**
   * Updates an existing language with validation and error handling
   *
   * @param id - The language ID to update
   * @param updateLanguageDto - The data to update
   * @param updatedById - Optional ID of the user performing the update
   * @returns Promise resolving to the updated language response
   *
   * @throws NotFoundException if language is not found
   * @throws BadRequestException if no update data is provided
   */
  async updateLanguage({
    id,
    updateLanguageDto,
    updatedById,
  }: {
    id: string
    updateLanguageDto: UpdateLanguageBodyType
    updatedById: number
  }): Promise<LanguageResponseType> {
    try {
      // Validate that update data is provided
      if (Object.keys(updateLanguageDto).length === 0) {
        throw AtLeastOneFieldMustBeProvidedException
      }

      // Check if language exists
      const existingLanguage = await this.languageRepository.findUniqueLanguage(id)
      if (!existingLanguage) {
        throw NotFoundLanguageException
      }

      // Update the language
      const updatedLanguage = await this.languageRepository.updateLanguage(id, updateLanguageDto, updatedById)

      return this.mapToResponseType(updatedLanguage)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundLanguageException
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw InternalUpdateLanguageErrorException
    }
  }

  /**
   * Soft deletes a language by setting the deletedAt timestamp
   *
   * @param id - The language ID to soft delete
   * @param deletedById - Optional ID of the user performing the deletion
   * @returns Promise resolving to success message
   *
   * @throws NotFoundException if language is not found
   */
  async softDeleteLanguage(id: string, deletedById?: number): Promise<{ message: string }> {
    try {
      // Check if language exists and is not already deleted
      const existingLanguage = await this.languageRepository.findUniqueLanguage(id)
      if (!existingLanguage) {
        throw NotFoundLanguageException
      }

      // Soft delete the language
      await this.languageRepository.softDeleteLanguage(id, deletedById)

      return {
        message: `Language '${existingLanguage.name}' has been successfully deleted.`,
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundLanguageException
      }
      if (error instanceof NotFoundException) {
        throw error
      }
      throw InternalDeleteLanguageErrorException
    }
  }

  /**
   * Restores a soft-deleted language
   *
   * @param id - The language ID to restore
   * @param restoredById - Optional ID of the user performing the restoration
   * @returns Promise resolving to the restored language response
   *
   * @throws NotFoundException if language is not found
   */
  async restoreLanguage(id: string, restoredById?: number): Promise<LanguageResponseType> {
    try {
      // Check if language exists (including deleted ones)
      const existingLanguage = await this.languageRepository.findUniqueLanguage(id, true)
      if (!existingLanguage) {
        throw NotFoundLanguageException
      }

      // Check if language is actually deleted
      if (!existingLanguage.deletedAt) {
        throw LanguageNotDeletedException
      }

      // Restore the language
      const restoredLanguage = await this.languageRepository.restoreLanguage(id, restoredById)

      return this.mapToResponseType(restoredLanguage)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundLanguageException
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw InternalRestoreLanguageErrorException
    }
  }

  /**
   * Permanently deletes a language from the database
   * WARNING: This action cannot be undone and will cascade delete all related translations
   *
   * @param id - The language ID to permanently delete
   * @returns Promise resolving to success message
   *
   * @throws NotFoundException if language is not found
   */
  async hardDeleteLanguage(id: string): Promise<{ message: string }> {
    try {
      // Check if language exists
      const existingLanguage = await this.languageRepository.findUniqueLanguage(id, true)
      if (!existingLanguage) {
        throw NotFoundLanguageException
      }

      // Permanently delete the language
      await this.languageRepository.hardDeleteLanguage(id)

      return {
        message: `Language '${existingLanguage.name}' has been permanently deleted.`,
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundLanguageException
      }
      if (error instanceof NotFoundException) {
        throw error
      }
      throw InternalHardDeleteLanguageErrorException
    }
  }

  /**
   * Bulk soft deletes multiple languages
   *
   * @param bulkDeleteDto - Object containing array of language IDs to delete
   * @param deletedById - Optional ID of the user performing the deletion
   * @returns Promise resolving to success message with count
   *
   * @throws BadRequestException if no valid language IDs are provided
   */
  async bulkSoftDeleteLanguages(
    bulkDeleteDto: BulkDeleteLanguagesType,
    deletedById?: number,
  ): Promise<{ message: string; deletedCount: number }> {
    try {
      const { ids } = bulkDeleteDto

      // Validate that IDs are provided
      if (!ids || ids.length === 0) {
        throw AtLeastOneFieldMustBeProvidedException
      }

      // Perform bulk soft delete
      const deletedCount = await this.languageRepository.bulkSoftDeleteLanguages(ids, deletedById)

      if (deletedCount === 0) {
        throw NoLanguageFoundToDeleteException
      }

      return {
        message: `Successfully deleted ${deletedCount} language(s).`,
        deletedCount,
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error
      }
      throw InternalDeleteLanguageListErrorException
    }
  }

  /**
   * Gets the total count of languages with optional filtering
   *
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the total count
   */
  async getLanguageCount(includeDeleted: boolean = false): Promise<{ count: number }> {
    try {
      const count = await this.languageRepository.getLanguageCount(includeDeleted)
      return { count }
    } catch (error) {
      throw InternalCountLanguageErrorException
    }
  }
}
