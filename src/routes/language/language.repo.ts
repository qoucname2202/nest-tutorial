import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  LanguageType,
  CreateLanguageBodyType,
  UpdateLanguageBodyType,
  LanguageQueryType,
  LanguageWithRelationsType,
} from './language.model'

@Injectable()
export class LanguageRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new language record in the database
   *
   * @param languageData - The language data to create
   * @param createdById - ID of the user creating the language
   * @returns Promise resolving to the created language
   */
  async createLanguage(languageData: CreateLanguageBodyType, createdById: number): Promise<LanguageType> {
    return await this.prismaService.language.create({
      data: {
        ...languageData,
        createdById,
      },
    })
  }

  /**
   * Finds a unique language by ID, with optional soft delete filtering
   *
   * @param id - The language ID to search for
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the language or null if not found
   */
  async findUniqueLanguage(id: string, includeDeleted: boolean = false): Promise<LanguageType | null> {
    const whereClause: any = { id }

    // Exclude soft-deleted records unless explicitly requested
    if (!includeDeleted) {
      whereClause.deletedAt = null
    }

    return await this.prismaService.language.findUnique({
      where: whereClause,
    })
  }

  /**
   * Finds a language with all its related translations and user information
   *
   * @param id - The language ID to search for
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the language with relations or null if not found
   */
  async findLanguageWithRelations(
    id: string,
    includeDeleted: boolean = false,
  ): Promise<LanguageWithRelationsType | null> {
    const whereClause: any = { id }

    if (!includeDeleted) {
      whereClause.deletedAt = null
    }

    return await this.prismaService.language.findUnique({
      where: whereClause,
      include: {
        userTranslations: true,
        productTranslations: true,
        categoryTranslations: true,
        brandTranslations: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * Retrieves a paginated list of languages with optional search and filtering
   *
   * @param queryParams - Query parameters for pagination, search, and filtering
   * @returns Promise resolving to paginated language list with metadata
   */
  async findManyLanguages(queryParams: LanguageQueryType): Promise<{
    data: LanguageType[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const { page, limit, search, includeDeleted } = queryParams
    const skip = (page - 1) * limit
    const whereClause: any = {}

    // Exclude soft-deleted records unless explicitly requested
    if (!includeDeleted) {
      whereClause.deletedAt = null
    }

    // Add search functionality for name and ID
    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          id: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Execute queries in parallel for better performance
    const [languages, totalCount] = await Promise.all([
      this.prismaService.language.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      }),
      this.prismaService.language.count({
        where: whereClause,
      }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      data: languages,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    }
  }

  /**
   * Gets all languages
   *
   * @returns Promise resolving to an array of languages
   */

  async getAll(): Promise<LanguageType[]> {
    return await this.prismaService.language.findMany({
      where: {
        deletedAt: null,
      },
    })
  }

  /**
   * Updates an existing language record
   *
   * @param id - The language ID to update
   * @param updateData - The data to update
   * @param updatedById - ID of the user performing the update
   * @returns Promise resolving to the updated language
   */
  async updateLanguage(id: string, updateData: UpdateLanguageBodyType, updatedById?: number): Promise<LanguageType> {
    return await this.prismaService.language.update({
      where: { id },
      data: {
        ...updateData,
        updatedById,
      },
    })
  }

  /**
   * Soft deletes a language by setting the deletedAt timestamp
   *
   * @param id - The language ID to soft delete
   * @param deletedById - ID of the user performing the deletion
   * @returns Promise resolving to the soft-deleted language
   */
  async softDeleteLanguage(id: string, deletedById?: number): Promise<LanguageType> {
    return await this.prismaService.language.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: deletedById,
      },
    })
  }

  /**
   * Restores a soft-deleted language by clearing the deletedAt timestamp
   *
   * @param id - The language ID to restore
   * @param restoredById - ID of the user performing the restoration
   * @returns Promise resolving to the restored language
   */
  async restoreLanguage(id: string, restoredById?: number): Promise<LanguageType> {
    return await this.prismaService.language.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedById: restoredById,
      },
    })
  }

  /**
   * Permanently deletes a language from the database
   * WARNING: This action cannot be undone
   *
   * @param id - The language ID to permanently delete
   * @returns Promise resolving to the deleted language
   */
  async hardDeleteLanguage(id: string): Promise<LanguageType> {
    return await this.prismaService.language.delete({
      where: { id },
    })
  }

  /**
   * Bulk soft deletes multiple languages
   *
   * @param ids - Array of language IDs to soft delete
   * @param deletedById - ID of the user performing the deletion
   * @returns Promise resolving to the count of deleted languages
   */
  async bulkSoftDeleteLanguages(ids: string[], deletedById?: number): Promise<number> {
    const result = await this.prismaService.language.updateMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        updatedById: deletedById,
      },
    })

    return result.count
  }

  /**
   * Checks if a language ID already exists in the database
   *
   * @param id - The language ID to check
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to boolean indicating existence
   */
  async languageExists(id: string, includeDeleted: boolean = false): Promise<boolean> {
    const whereClause: any = { id }

    if (!includeDeleted) {
      whereClause.deletedAt = null
    }

    const count = await this.prismaService.language.count({
      where: whereClause,
    })

    return count > 0
  }

  /**
   * Gets the total count of languages with optional filtering
   *
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the total count
   */
  async getLanguageCount(includeDeleted: boolean = false): Promise<any> {
    const whereClause: any = {}

    if (!includeDeleted) {
      whereClause.deletedAt = null
    }

    return await this.prismaService.language.count({
      where: whereClause,
    })
  }
}
