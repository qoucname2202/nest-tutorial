import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'
import { PermissionRepository } from './permission.repo'
import {
  CreatePermissionBodyType,
  UpdatePermissionBodyType,
  PermissionResponseType,
  PermissionListResponseType,
  BulkDeletePermissionsType,
  PermissionWithRelationsType,
  AssignRolesToPermissionType,
  PermissionStatsType,
  GetPermissionQueryType,
  GetPermissionsResponseType,
} from './permission.model'
import { isUniqueConstraintPrismaError, isNotFoundPrismaError } from 'src/shared/helper'
import {
  AtLeastOneFieldMustBeProvidedException,
  AtLeastOnePermissionIdMustBeProvidedException,
  InternalAssignRolesToPermissionErrorException,
  InternalCountPermissionErrorException,
  InternalCreatePermissionErrorException,
  InternalDeletePermissionErrorException,
  InternalDeletePermissionListErrorException,
  InternalRestorePermissionErrorException,
  InternalRetrievePermissionByIdErrorException,
  InternalRetrievePermissionsErrorException,
  InternalRetrievePermissionUsingPaginationErrorException,
  InternalReviewPermissionWithRelationsErrorException,
  InternalStatisticsErrorException,
  InternalUpdatePermissionErrorException,
  NoPermissionFoundToDeleteException,
  PermissionAlreadyExistsException,
  PermissionCouldNotRestoreException,
  PermissionNotDeletedException,
  PermissionNotFoundException,
} from './permission.error'
import { MessageResponseDTO } from './dto/permission.dto'

/**
 * Service class for Permission entity business logic
 * Handles validation, error handling, and business rules for permission operations
 */
@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  /**
   * Creates a new permission with validation and error handling
   *
   * @body    createPermissionDto - The permission data to create
   * @header  createdById - Optional ID of the user creating the permission
   * @returns Promise resolving to the created permission response
   *
   * @throws  ConflictException if permission path+method combination already exists
   * @throws  InternalServerErrorException for unexpected database errors
   */
  async create({
    createPermissionDto,
    createdById,
  }: {
    createPermissionDto: CreatePermissionBodyType
    createdById: number
  }): Promise<PermissionResponseType> {
    try {
      // Validate that the path+method combination doesn't already exist
      const existingPermission = await this.permissionRepository.findByPathAndMethod(
        createPermissionDto.path,
        createPermissionDto.method,
        undefined,
        true, // Include deleted permissions to prevent path+method reuse
      )

      if (existingPermission) {
        throw PermissionAlreadyExistsException
      }

      // Create the permission
      const createdPermission = await this.permissionRepository.create({ data: createPermissionDto, createdById })

      // Return response without sensitive fields
      return this.mapToResponseType(createdPermission)
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw PermissionAlreadyExistsException
      }
      if (error instanceof ConflictException) {
        throw error
      }
      throw InternalCreatePermissionErrorException
    }
  }

  /**
   * Retrieves a paginated list of permissions with optional search and filtering
   *
   * @param queryParams - Query parameters for pagination, search, and filtering
   * @returns Promise resolving to paginated permission list with metadata
   */
  async list(): Promise<GetPermissionsResponseType | null> {
    try {
      const result = await this.permissionRepository.list()

      return {
        data: result,
        totalItems: result.length,
      }
    } catch (error) {
      throw InternalRetrievePermissionsErrorException
    }
  }

  /**
   * Retrieves a paginated list of permissions with optional search and filtering
   *
   * @param queryParams - Query parameters for pagination, search, and filtering
   * @returns Promise resolving to paginated permission list with metadata
   */
  async findAll(queryParams: GetPermissionQueryType): Promise<PermissionListResponseType> {
    try {
      const result = await this.permissionRepository.findAll(queryParams)

      return {
        data: result.data.map((permission) => this.mapToResponseType(permission)),
        pagination: result.pagination,
      }
    } catch (error) {
      throw InternalRetrievePermissionUsingPaginationErrorException
    }
  }

  /**
   * Retrieves a single permission by ID
   *
   * @param id - The permission ID to retrieve
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the permission response
   *
   * @throws NotFoundException if permission is not found
   */
  async findById(id: number, includeDeleted: boolean = false): Promise<PermissionResponseType> {
    try {
      const permission = await this.permissionRepository.findById(id, includeDeleted)

      if (!permission) {
        throw PermissionNotFoundException
      }

      return this.mapToResponseType(permission)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw InternalRetrievePermissionByIdErrorException
    }
  }

  /**
   * Retrieves a permission with all its related roles and user information
   *
   * @param id - The permission ID to retrieve
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the permission with relations
   *
   * @throws NotFoundException if permission is not found
   */
  async findRelations(id: number, includeDeleted: boolean = false): Promise<PermissionWithRelationsType> {
    try {
      const permission = await this.permissionRepository.findRelations(id, includeDeleted)

      if (!permission) {
        throw PermissionNotFoundException
      }

      return permission
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw InternalReviewPermissionWithRelationsErrorException
    }
  }

  /**
   * Updates an existing permission with validation and error handling
   *
   * @param id - The permission ID to update
   * @param updatePermissionDto - The data to update
   * @param updatedById - Optional ID of the user performing the update
   * @returns Promise resolving to the updated permission response
   *
   * @throws NotFoundException if permission is not found
   * @throws ConflictException if path+method combination already exists
   * @throws BadRequestException if no update data is provided
   */
  async update({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: UpdatePermissionBodyType
    updatedById: number
  }): Promise<PermissionResponseType> {
    try {
      const { path, method } = data

      // Validate that update data is provided
      if (Object.keys(data).length === 0) {
        throw AtLeastOneFieldMustBeProvidedException
      }

      // Check if permission exists
      const existingPermission = await this.permissionRepository.findById(id)
      if (!existingPermission) {
        throw PermissionNotFoundException
      }

      // If path or method is being updated, check for conflicts
      if (path || method) {
        const pathToCheck = path || existingPermission.path
        const methodToCheck = method || existingPermission.method

        const conflictingPermission = await this.permissionRepository.findByPathAndMethod(
          pathToCheck,
          methodToCheck,
          id, // Exclude current permission from check
        )

        if (conflictingPermission) {
          throw PermissionAlreadyExistsException
        }
      }

      // Update the permission
      const updatedPermission = await this.permissionRepository.update({ id, data, updatedById })

      return this.mapToResponseType(updatedPermission)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw PermissionNotFoundException
      }
      if (isUniqueConstraintPrismaError(error)) {
        throw PermissionAlreadyExistsException
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error
      }
      throw InternalUpdatePermissionErrorException
    }
  }

  /**
   * Soft deletes a permission by setting the deletedAt timestamp
   *
   * @param id - The permission ID to soft delete
   * @param deletedById - Optional ID of the user performing the deletion
   * @returns Promise resolving to success message
   *
   * @throws NotFoundException if permission is not found
   */
  async softDelete({ id, deletedById }: { id: number; deletedById: number }): Promise<MessageResponseDTO> {
    try {
      // Check if permission exists and is not already deleted
      const existingPermission = await this.permissionRepository.findById(id)
      if (!existingPermission) {
        throw PermissionNotFoundException
      }

      // Soft delete the permission
      await this.permissionRepository.softDelete({ id, deletedById })

      return {
        message: `Permission '${existingPermission.name}' has been successfully deleted.`,
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw PermissionNotFoundException
      }
      if (error instanceof NotFoundException) {
        throw error
      }
      throw InternalDeletePermissionErrorException
    }
  }

  /**
   * Restores a soft-deleted permission
   *
   * @param id - The permission ID to restore
   * @param restoredById - Optional ID of the user performing the restoration
   * @returns Promise resolving to the restored permission response
   *
   * @throws NotFoundException if permission is not found
   * @throws BadRequestException if permission is not deleted
   */
  async restore({ id, restoredById }: { id: number; restoredById: number }): Promise<PermissionResponseType> {
    try {
      // Check if permission exists (including deleted ones)
      const existingPermission = await this.permissionRepository.findById(id, true)
      if (!existingPermission) {
        throw PermissionNotFoundException
      }

      // Check if permission is actually deleted
      if (!existingPermission.deletedAt) {
        throw PermissionNotDeletedException
      }

      // Check for path+method conflicts before restoring
      const conflictingPermission = await this.permissionRepository.findByPathAndMethod(
        existingPermission.path,
        existingPermission.method,
        id,
      )

      if (conflictingPermission) {
        throw PermissionCouldNotRestoreException
      }

      // Restore the permission
      const restoredPermission = await this.permissionRepository.restore({ id, restoredById })

      return this.mapToResponseType(restoredPermission)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw PermissionNotFoundException
      }

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error
      }
      throw InternalRestorePermissionErrorException
    }
  }

  /**
   * Permanently deletes a permission from the database
   * WARNING: This action cannot be undone and will remove all role associations
   *
   * @param id - The permission ID to permanently delete
   * @returns Promise resolving to success message
   *
   * @throws NotFoundException if permission is not found
   */
  async hardDelete(id: number): Promise<{ message: string }> {
    try {
      // Check if permission exists
      const existingPermission = await this.permissionRepository.findById(id, true)
      if (!existingPermission) {
        throw PermissionNotFoundException
      }

      // Permanently delete the permission
      await this.permissionRepository.hardDelete(id)

      return {
        message: `Permission '${existingPermission.name}' has been permanently deleted.`,
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw PermissionNotFoundException
      }

      if (error instanceof NotFoundException) {
        throw error
      }
      throw InternalDeletePermissionListErrorException
    }
  }

  /**
   * Bulk soft deletes multiple permissions
   *
   * @param data - Object containing array of permission IDs to delete
   * @param deletedById - Optional ID of the user performing the deletion
   * @returns Promise resolving to success message with count
   *
   * @throws BadRequestException if no valid permission IDs are provided
   */
  async bulkSoftDelete({
    data,
    deletedById,
  }: {
    data: BulkDeletePermissionsType
    deletedById: number
  }): Promise<{ message: string; deletedCount: number }> {
    try {
      const { ids } = data

      // Validate that IDs are provided
      if (!ids || ids.length === 0) {
        throw AtLeastOnePermissionIdMustBeProvidedException
      }

      // Perform bulk soft delete
      const deletedCount = await this.permissionRepository.bulkSoftDelete({ ids, deletedById })

      if (deletedCount === 0) {
        throw NoPermissionFoundToDeleteException
      }

      return {
        message: `Successfully deleted ${deletedCount} permission.`,
        deletedCount,
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error
      }
      throw InternalDeletePermissionListErrorException
    }
  }

  /**
   * Assigns roles to a permission
   *
   * @param permissionId - The permission ID
   * @body assignRolesDto - Object containing array of role IDs to assign
   * @returns Promise resolving to the permission with assigned roles
   *
   * @throws NotFoundException if permission is not found
   */
  async assignRoles({
    permissionId,
    body,
  }: {
    permissionId: number
    body: AssignRolesToPermissionType
  }): Promise<PermissionWithRelationsType> {
    try {
      // Check if permission exists
      const existingPermission = await this.permissionRepository.findById(permissionId)
      if (!existingPermission) {
        throw PermissionNotFoundException
      }

      // Assign roles to permission
      const permissionWithRoles = await this.permissionRepository.assignRoles({ permissionId, roleIds: body.roleIds })

      return permissionWithRoles
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw InternalAssignRolesToPermissionErrorException
    }
  }

  /**
   * Gets permission statistics including counts by method
   *
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to permission statistics
   */
  async getStats(includeDeleted: boolean = false): Promise<PermissionStatsType> {
    try {
      return await this.permissionRepository.getStats(includeDeleted)
    } catch (error) {
      throw InternalStatisticsErrorException
    }
  }

  /**
   * Gets the total count of permissions with optional filtering
   *
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the total count
   */
  async getCount(includeDeleted: boolean = false): Promise<{ count: number }> {
    try {
      const count = await this.permissionRepository.getCount(includeDeleted)
      return { count }
    } catch (error) {
      throw InternalCountPermissionErrorException
    }
  }

  /**
   * Helper method to map permission entity to response type
   * Removes sensitive fields like deletedAt and deletedById from public responses
   *
   * @param permission - The permission entity to map
   * @returns The mapped response object
   *
   * @private
   */
  private mapToResponseType(permission: any): PermissionResponseType {
    const { deletedAt, deletedById, ...responseData } = permission
    return responseData as PermissionResponseType
  }
}
