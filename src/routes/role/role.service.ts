import { BadRequestException, Injectable } from '@nestjs/common'
import { RoleRepository } from './role.repo'
import {
  CreateRoleBodyType,
  UpdateRoleBodyType,
  RoleResponseType,
  BulkDeleteRolesType,
  RoleWithRelationsType,
  AssignPermissionsToRoleType,
  RoleStatsType,
  ToggleRoleStatusType,
  GetRolesResType,
  GetRoleQueryType,
  GetRoleListResType,
} from './role.model'
import { RoleName } from 'src/shared/constants/role.constant'
import { isUniqueConstraintPrismaError, isNotFoundPrismaError } from 'src/shared/helper'
import {
  RoleAlreadyExistsException,
  RoleNotFoundException,
  AtLeastOneFieldMustBeProvidedForRoleUpdateException,
  AtLeastOneRoleIdMustBeProvidedException,
  RoleIsNotDeletedException,
  CannotDeleteSystemRoleException,
  CannotModifySystemRoleException,
  RoleHasActiveUsersException,
  InternalCreateRoleErrorException,
  InternalRetrieveRoleErrorException,
  InternalRetrieveRolesErrorException,
  InternalUpdateRoleErrorException,
  InternalDeleteRoleErrorException,
  InternalRestoreRoleErrorException,
  InternalBulkDeleteRolesErrorException,
  InternalAssignPermissionsToRoleErrorException,
  InternalCountRoleErrorException,
  InternalRoleStatsErrorException,
  InternalToggleRoleStatusErrorException,
  ProhibitedActionOnBaseRoleException,
} from './role.error'
import { NotFoundRecordException } from 'src/shared/error'

@Injectable()
export class RoleService {
  // System roles that cannot be deleted or modified
  private readonly systemRoles = [RoleName.Admin, RoleName.Client, RoleName.Seller]

  constructor(private readonly roleRepository: RoleRepository) {}

  /**
   * Creates a new role with validation and error handling
   *
   * @param createRoleDto - The role data to create
   * @param createdById - Optional ID of the user creating the role
   * @returns Promise resolving to the created role response
   *
   * @throws RoleAlreadyExistsException if role name already exists
   * @throws InternalCreateRoleErrorException for unexpected database errors
   */
  async create({ data, createdById }: { data: CreateRoleBodyType; createdById: number }): Promise<RoleResponseType> {
    try {
      // Validate that the role name doesn't already exist
      const existingRole = await this.roleRepository.findByName(data.name, undefined, true)

      if (existingRole) {
        throw RoleAlreadyExistsException
      }

      // Create the role
      const createdRole = await this.roleRepository.create({ data, createdById })

      // Return response without sensitive fields
      return this.mapToResponseType(createdRole)
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw RoleAlreadyExistsException
      }
      if (error === RoleAlreadyExistsException) {
        throw error
      }
      throw InternalCreateRoleErrorException
    }
  }

  /**
   * Retrieves list of roles with optional search and filtering
   * @returns Promise resolving role list with metadata
   */
  async list(): Promise<GetRoleListResType> {
    try {
      const result = await this.roleRepository.list()
      return {
        data: result,
        totalItems: result.length,
      }
    } catch (error) {
      throw InternalRetrieveRolesErrorException
    }
  }

  /**
   * Retrieves a paginated list of roles with optional search and filtering
   *
   * @param queryParams - Query parameters for pagination, search, and filtering
   * @returns Promise resolving to paginated role list with metadata
   */
  async findAll(queryParams: GetRoleQueryType): Promise<GetRolesResType> {
    try {
      const result = await this.roleRepository.findAll(queryParams)

      return {
        data: result.data.map((role) => this.mapToResponseType(role)),
        pagination: result.pagination,
      }
    } catch (error) {
      throw InternalRetrieveRolesErrorException
    }
  }

  /**
   * Retrieves a single role by ID
   *
   * @param id - The role ID to retrieve
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the role response
   *
   * @throws RoleNotFoundException if role is not found
   */
  async findOne(id: number) {
    try {
      const role = await this.roleRepository.findOne(id)

      if (!role) {
        throw RoleNotFoundException
      }

      return role
    } catch (error) {
      if (error === RoleNotFoundException) {
        throw error
      }
      throw InternalRetrieveRoleErrorException
    }
  }

  /**
   * Retrieves a role with all its related permissions and user information
   *
   * @param id - The role ID to retrieve
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the role with relations
   *
   * @throws RoleNotFoundException if role is not found
   */
  async findRoleWithRelations(id: number, includeDeleted: boolean = false): Promise<RoleWithRelationsType> {
    try {
      const role = await this.roleRepository.findRoleWithRelations(id, includeDeleted)

      if (!role) {
        throw RoleNotFoundException
      }

      return role
    } catch (error) {
      if (error === RoleNotFoundException) {
        throw error
      }
      throw InternalRetrieveRoleErrorException
    }
  }

  private async verifyRole(roleId: number) {
    const role = await this.roleRepository.findOne(roleId)
    if (!role) {
      throw NotFoundRecordException
    }
    const baseRoles: string[] = [RoleName.Admin, RoleName.Client, RoleName.Seller]

    if (baseRoles.includes(role.name)) {
      throw ProhibitedActionOnBaseRoleException
    }
  }

  /**
   * Updates an existing role with validation and error handling
   *
   * @param id - The role ID to update
   * @param updateRoleDto - The data to update
   * @param updatedById - Optional ID of the user performing the update
   * @returns Promise resolving to the updated role response
   *
   * @throws RoleNotFoundException if role is not found
   * @throws CannotModifySystemRoleException if trying to modify system role
   * @throws RoleAlreadyExistsException if name already exists
   * @throws AtLeastOneFieldMustBeProvidedForRoleUpdateException if no update data is provided
   */
  async update({ id, data, updatedById }: { id: number; data: UpdateRoleBodyType; updatedById: number }) {
    try {
      // Validate that update data is provided
      if (Object.keys(data).length === 0) {
        throw AtLeastOneFieldMustBeProvidedForRoleUpdateException
      }
      const existingRole = await this.roleRepository.findOne(id)
      await this.verifyRole(id)

      // If name is being updated, check for conflicts
      if (data.name && data.name !== existingRole?.name) {
        const conflictingRole = await this.roleRepository.findByName(data.name, id)

        if (conflictingRole) {
          throw RoleAlreadyExistsException
        }
      }
      //Update the role
      const updatedRole = await this.roleRepository.update({ id, data, updatedById })

      return updatedRole
    } catch (error) {
      // Handle Prisma not found errors
      if (isNotFoundPrismaError(error)) {
        throw RoleNotFoundException
      }

      // Handle Prisma unique constraint violations
      if (isUniqueConstraintPrismaError(error)) {
        throw RoleAlreadyExistsException
      }

      // Re-throw known exceptions
      if (error instanceof Error) {
        throw new BadRequestException(error.message)
      }
      throw InternalUpdateRoleErrorException
    }
  }

  /**
   * Soft deletes a role by setting the deletedAt timestamp
   *
   * @param id - The role ID to soft delete
   * @param deletedById - Optional ID of the user performing the deletion
   * @returns Promise resolving to success message
   *
   * @throws RoleNotFoundException if role is not found
   * @throws CannotDeleteSystemRoleException if trying to delete system role
   * @throws RoleHasActiveUsersException if role has active users
   */
  async softDelete({ id, deletedById }: { id: number; deletedById: number }): Promise<{ message: string }> {
    try {
      // Check if role exists and is not already deleted
      const existingRole = await this.roleRepository.findOne(id)
      await this.verifyRole(id)

      // Check if role has active users
      const hasActiveUsers = await this.roleRepository.roleHasActiveUsers(id)
      if (hasActiveUsers) {
        throw RoleHasActiveUsersException
      }

      // Soft delete the role
      await this.roleRepository.softDelete(id, deletedById)

      return {
        message: `Role '${existingRole?.name}' has been successfully deleted.`,
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw RoleNotFoundException
      }

      if (error instanceof Error) {
        throw error
      }
      throw InternalDeleteRoleErrorException
    }
  }

  /**
   * Helper method to check if a role is a system role
   *
   * @param roleName - The role name to check
   * @returns Boolean indicating if the role is a system role
   */
  private isSystemRole(roleName: string): boolean {
    return this.systemRoles.includes(roleName as any)
  }

  /**
   * Helper method to map role entity to response type
   * Removes sensitive fields like deletedAt and deletedById from public responses
   *
   * @param role - The role entity to map
   * @returns The mapped response object
   *
   * @private
   */
  private mapToResponseType(role: any): RoleResponseType {
    const { deletedAt, deletedById, ...responseData } = role
    return responseData as RoleResponseType
  }

  /**
   * Restores a soft-deleted role
   *
   * @param id - The role ID to restore
   * @param restoredById - Optional ID of the user performing the restoration
   * @returns Promise resolving to the restored role response
   *
   * @throws RoleNotFoundException if role is not found
   * @throws RoleIsNotDeletedException if role is not deleted
   */
  async restoreRole(id: number, restoredById?: number): Promise<RoleResponseType> {
    try {
      // Check if role exists (including deleted ones)
      const existingRole = await this.roleRepository.findOne(id)
      if (!existingRole) {
        throw RoleNotFoundException
      }

      // Check if role is actually deleted
      if (!existingRole.deletedAt) {
        throw RoleIsNotDeletedException
      }

      // Check for name conflicts before restoring
      const conflictingRole = await this.roleRepository.findByName(existingRole.name, id)

      if (conflictingRole) {
        throw RoleAlreadyExistsException
      }

      // Restore the role
      const restoredRole = await this.roleRepository.restoreRole(id, restoredById)

      return this.mapToResponseType(restoredRole)
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw RoleNotFoundException
      }

      if (
        error === RoleNotFoundException ||
        error === RoleIsNotDeletedException ||
        error === RoleAlreadyExistsException
      ) {
        throw error
      }
      throw InternalRestoreRoleErrorException
    }
  }

  /**
   * Permanently deletes a role from the database
   *
   * @param id - The role ID to permanently delete
   * @returns Promise resolving to success message
   *
   * @throws RoleNotFoundException if role is not found
   * @throws CannotDeleteSystemRoleException if trying to delete system role
   * @throws RoleHasActiveUsersException if role has active users
   */
  async hardDeleteRole(id: number): Promise<{ message: string }> {
    try {
      // Check if role exists
      const existingRole = await this.roleRepository.findOne(id)
      await this.verifyRole(id)

      // Check if role has active users
      const hasActiveUsers = await this.roleRepository.roleHasActiveUsers(id)
      if (hasActiveUsers) {
        throw RoleHasActiveUsersException
      }

      // Permanently delete the role
      await this.roleRepository.hardDeleteRole(id)

      return {
        message: `Role '${existingRole?.name}' has been permanently deleted.`,
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw RoleNotFoundException
      }

      if (
        error === RoleNotFoundException ||
        error === CannotDeleteSystemRoleException ||
        error === RoleHasActiveUsersException
      ) {
        throw error
      }
      throw InternalDeleteRoleErrorException
    }
  }

  /**
   * Bulk soft deletes multiple roles
   *
   * @param bulkDeleteDto - Object containing array of role IDs to delete
   * @param deletedById - Optional ID of the user performing the deletion
   * @returns Promise resolving to success message with count
   *
   * @throws AtLeastOneRoleIdMustBeProvidedException if no valid role IDs are provided
   */
  async bulkSoftDeleteRoles(
    bulkDeleteDto: BulkDeleteRolesType,
    deletedById?: number,
  ): Promise<{ message: string; deletedCount: number }> {
    try {
      const { ids } = bulkDeleteDto

      // Validate that IDs are provided
      if (!ids || ids.length === 0) {
        throw AtLeastOneRoleIdMustBeProvidedException
      }

      // Filter out system roles and roles with active users
      const validIds: number[] = []
      for (const id of ids) {
        const role = await this.roleRepository.findOne(id)
        if (role && !this.isSystemRole(role.name)) {
          const hasActiveUsers = await this.roleRepository.roleHasActiveUsers(id)
          if (!hasActiveUsers) {
            validIds.push(id)
          }
        }
      }

      if (validIds.length === 0) {
        throw RoleNotFoundException
      }

      // Perform bulk soft delete
      const deletedCount = await this.roleRepository.bulkSoftDeleteRoles(validIds, deletedById)

      return {
        message: `Successfully deleted ${deletedCount} role(s).`,
        deletedCount,
      }
    } catch (error) {
      if (error === AtLeastOneRoleIdMustBeProvidedException || error === RoleNotFoundException) {
        throw error
      }
      throw InternalBulkDeleteRolesErrorException
    }
  }

  /**
   * Assigns permissions to a role
   *
   * @param roleId - The role ID
   * @param assignPermissionsDto - Object containing array of permission IDs to assign
   * @returns Promise resolving to the role with assigned permissions
   *
   * @throws RoleNotFoundException if role is not found
   */
  async assignPermissionsToRole(
    roleId: number,
    assignPermissionsDto: AssignPermissionsToRoleType,
  ): Promise<RoleWithRelationsType> {
    try {
      // Check if role exists
      const existingRole = await this.roleRepository.findOne(roleId)
      if (!existingRole) {
        throw RoleNotFoundException
      }

      // Assign permissions to role
      const roleWithPermissions = await this.roleRepository.assignPermissionsToRole(
        roleId,
        assignPermissionsDto.permissionIds,
      )

      return roleWithPermissions
    } catch (error) {
      if (error === RoleNotFoundException) {
        throw error
      }
      throw InternalAssignPermissionsToRoleErrorException
    }
  }

  /**
   * Toggles the active status of a role
   *
   * @param id - The role ID
   * @param toggleStatusDto - Object containing the new active status
   * @param updatedById - Optional ID of the user performing the update
   * @returns Promise resolving to the updated role response
   *
   * @throws RoleNotFoundException if role is not found
   * @throws CannotModifySystemRoleException if trying to modify system role
   */
  async toggleRoleStatus(
    id: number,
    toggleStatusDto: ToggleRoleStatusType,
    updatedById?: number,
  ): Promise<RoleResponseType> {
    try {
      // Check if role exists
      const existingRole = await this.roleRepository.findOne(id)
      if (!existingRole) {
        throw RoleNotFoundException
      }

      // Prevent modification of system roles
      if (this.isSystemRole(existingRole.name)) {
        throw CannotModifySystemRoleException
      }

      // Toggle role status
      const updatedRole = await this.roleRepository.toggleRoleStatus(id, toggleStatusDto.isActive, updatedById)

      return this.mapToResponseType(updatedRole)
    } catch (error) {
      if (error === RoleNotFoundException || error === CannotModifySystemRoleException) {
        throw error
      }
      throw InternalToggleRoleStatusErrorException
    }
  }

  /**
   * Gets role statistics including counts by status
   *
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to role statistics
   */
  async getRoleStats(includeDeleted: boolean = false): Promise<RoleStatsType> {
    try {
      const stats = await this.roleRepository.getRoleStats(includeDeleted)
      return stats
    } catch (error) {
      throw InternalRoleStatsErrorException
    }
  }

  /**
   * Gets the total count of roles with optional filtering
   *
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the total count
   */
  async getRoleCount(includeDeleted: boolean = false): Promise<{ count: number }> {
    try {
      const count = await this.roleRepository.getRoleCount(includeDeleted)
      return { count }
    } catch (error) {
      throw InternalCountRoleErrorException
    }
  }
}
