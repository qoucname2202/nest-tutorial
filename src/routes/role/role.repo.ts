import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  RoleType,
  CreateRoleBodyType,
  UpdateRoleBodyType,
  RoleWithRelationsType,
  RoleStatsType,
  GetRoleQueryType,
  RoleWithPermissionsType,
} from './role.model'

@Injectable()
export class RoleRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new role record in the database
   *
   * @param roleData - The role data to create
   * @param createdById - ID of the user creating the role
   * @returns Promise resolving to the created role
   */
  async create({ data, createdById }: { data: CreateRoleBodyType; createdById: number | null }): Promise<RoleType> {
    return await this.prismaService.role.create({
      data: {
        ...data,
        createdById,
      },
    })
  }

  /**
   * Finds a unique role by ID, with optional soft delete filtering
   *
   * @param id - The role ID to search for
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the role or null if not found
   */
  async findOne(id: number): Promise<RoleWithPermissionsType | null> {
    return await this.prismaService.role.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        permissions: {
          where: { deletedAt: null },
        },
      },
    })
  }

  /**
   * Finds a role by name
   * Used for checking uniqueness constraint
   *
   * @param name - The role name
   * @param excludeId - Optional ID to exclude from search (for updates)
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the role or null if not found
   */
  async findByName(name: string, excludeId?: number, includeDeleted: boolean = false): Promise<RoleType | null> {
    const payload: any = {
      name,
    }

    if (excludeId) {
      payload.id = { not: excludeId }
    }

    if (!includeDeleted) {
      payload.deletedAt = null
    }

    return await this.prismaService.role.findFirst({
      where: payload,
    })
  }

  /**
   * Finds a role with all its related permissions and user information
   *
   * @param id - The role ID to search for
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the role with relations or null if not found
   */
  async findRoleWithRelations(id: number, includeDeleted: boolean = false): Promise<RoleWithRelationsType | null> {
    const whereClause: any = { id }

    if (!includeDeleted) {
      whereClause.deletedAt = null
    }

    return await this.prismaService.role.findUnique({
      where: whereClause,
      include: {
        permissions: {
          where: { deletedAt: null }, // Only include active permissions
          select: {
            id: true,
            name: true,
            description: true,
            path: true,
            method: true,
          },
        },
        users: {
          where: { status: 'ACTIVE' }, // Only include active users
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
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
        deletedBy: {
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
   * Retrieves list of roles with optional search and filtering
   * @returns Promise resolving role list with metadata
   */
  async list(): Promise<RoleType[]> {
    return await this.prismaService.role.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
    })
  }

  /**
   * Retrieves a paginated list of roles with optional search and filtering
   *
   * @param queryParams - Query parameters for pagination, search, and filtering
   * @returns Promise resolving to paginated role list with metadata
   */
  async findAll(queryParams: GetRoleQueryType): Promise<{
    data: RoleType[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const { page, limit, search, isActive, includeDeleted } = queryParams
    const skip = (page - 1) * limit

    // Build where clause for filtering
    const payload: any = {}

    // Exclude soft-deleted records unless explicitly requested
    if (!includeDeleted) {
      payload.deletedAt = null
    }

    // Add active status filtering
    if (isActive !== undefined) {
      payload.isActive = isActive
    }

    // Add search functionality for name and description
    if (search) {
      payload.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Execute queries in parallel for better performance
    const [roles, totalCount] = await Promise.all([
      this.prismaService.role.findMany({
        where: payload,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      }),
      this.prismaService.role.count({
        where: payload,
      }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      data: roles,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    }
  }

  /**
   * Updates an existing role record
   *
   * @param id - The role ID to update
   * @param data - The data to update
   * @param updatedById - ID of the user performing the update
   * @returns Promise resolving to the updated role
   */
  async update({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: UpdateRoleBodyType
    updatedById: number
  }): Promise<RoleType> {
    // Kiểm tra nếu bất cứ permissionId nào mà soft-delete thì không cho phép cập nhật
    if (data.permissionIds.length > 0) {
      const permissions = await this.prismaService.permission.findMany({
        where: {
          id: { in: data.permissionIds },
        },
      })
      const deletedPermission = permissions.filter((permission) => permission.deletedAt)
      if (deletedPermission.length > 0) {
        const deletedIds = deletedPermission.map((permission) => permission.id).join(', ')
        throw new Error(`Permission with id has been deleted: ${deletedIds}`)
      }
    }

    return await this.prismaService.role.update({
      where: { id, deletedAt: null },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        permissions: {
          set: data.permissionIds.map((id) => ({ id })),
        },
        updatedById,
      },
      include: {
        permissions: {
          where: { deletedAt: null },
        },
      },
    })
  }

  /**
   * Soft deletes a role by setting the deletedAt timestamp
   *
   * @param id - The role ID to soft delete
   * @param deletedById - ID of the user performing the deletion
   * @returns Promise resolving to the soft-deleted role
   */
  async softDeleteRole(id: number, deletedById?: number): Promise<RoleType> {
    return await this.prismaService.role.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById,
        updatedById: deletedById,
      },
    })
  }

  /**
   * Restores a soft-deleted role by clearing the deletedAt timestamp
   *
   * @param id - The role ID to restore
   * @param restoredById - ID of the user performing the restoration
   * @returns Promise resolving to the restored role
   */
  async restoreRole(id: number, restoredById?: number): Promise<RoleType> {
    return await this.prismaService.role.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: restoredById,
      },
    })
  }

  /**
   * Permanently deletes a role from the database
   *
   * @param id - The role ID to permanently delete
   * @returns Promise resolving to the deleted role
   */
  async hardDeleteRole(id: number): Promise<RoleType> {
    return await this.prismaService.role.delete({
      where: { id },
    })
  }

  /**
   * Bulk soft deletes multiple roles
   *
   * @param ids - Array of role IDs to soft delete
   * @param deletedById - ID of the user performing the deletion
   * @returns Promise resolving to the count of deleted roles
   */
  async bulkSoftDeleteRoles(ids: number[], deletedById?: number): Promise<number> {
    const result = await this.prismaService.role.updateMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        deletedById,
        updatedById: deletedById,
      },
    })

    return result.count
  }

  /**
   * Assigns permissions to a role
   *
   * @param roleId - The role ID
   * @param permissionIds - Array of permission IDs to assign
   * @returns Promise resolving to the updated role with permissions
   */
  async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<RoleWithRelationsType> {
    return await this.prismaService.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: permissionIds.map((permissionId) => ({ id: permissionId })),
        },
      },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            path: true,
            method: true,
          },
        },
      },
    })
  }

  /**
   * Removes permissions from a role
   *
   * @param roleId - The role ID
   * @param permissionIds - Array of permission IDs to remove
   * @returns Promise resolving to the updated role with permissions
   */
  async removePermissionsFromRole(roleId: number, permissionIds: number[]): Promise<RoleWithRelationsType> {
    return await this.prismaService.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          disconnect: permissionIds.map((permissionId) => ({ id: permissionId })),
        },
      },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            path: true,
            method: true,
          },
        },
      },
    })
  }

  /**
   * Toggles the active status of a role
   *
   * @param id - The role ID
   * @param isActive - The new active status
   * @param updatedById - ID of the user performing the update
   * @returns Promise resolving to the updated role
   */
  async toggleRoleStatus(id: number, isActive: boolean, updatedById?: number): Promise<RoleType> {
    return await this.prismaService.role.update({
      where: { id },
      data: {
        isActive,
        updatedById,
      },
    })
  }

  /**
   * Gets role statistics including counts by status
   *
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to role statistics
   */
  async getRoleStats(includeDeleted: boolean = false): Promise<RoleStatsType> {
    const whereClause: any = {}

    if (!includeDeleted) {
      whereClause.deletedAt = null
    }

    // Get counts in parallel
    const [totalRoles, activeRoles, inactiveRoles, deletedRoles, recentlyCreated, rolesByName] = await Promise.all([
      this.prismaService.role.count({ where: whereClause }),
      this.prismaService.role.count({ where: { ...whereClause, isActive: true } }),
      this.prismaService.role.count({ where: { ...whereClause, isActive: false } }),
      this.prismaService.role.count({ where: { deletedAt: { not: null } } }),
      this.prismaService.role.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      this.prismaService.role.groupBy({
        by: ['name'],
        where: whereClause,
        _count: { name: true },
      }),
    ])

    // Transform grouped results into a record
    const rolesByNameRecord: Record<string, number> = {}
    rolesByName.forEach((group) => {
      rolesByNameRecord[group.name] = group._count.name
    })

    return {
      totalRoles,
      activeRoles,
      inactiveRoles,
      deletedRoles,
      recentlyCreated,
      rolesByName: rolesByNameRecord,
    }
  }

  /**
   * Checks if a role exists by ID
   *
   * @param id - The role ID to check
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to boolean indicating existence
   */
  async roleExists(id: number, includeDeleted: boolean = false): Promise<boolean> {
    const whereClause: any = { id }

    if (!includeDeleted) {
      whereClause.deletedAt = null
    }

    const count = await this.prismaService.role.count({
      where: whereClause,
    })

    return count > 0
  }

  /**
   * Gets the total count of roles with optional filtering
   *
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the total count
   */
  async getRoleCount(includeDeleted: boolean = false): Promise<number> {
    const whereClause: any = {}

    if (!includeDeleted) {
      whereClause.deletedAt = null
    }

    return await this.prismaService.role.count({
      where: whereClause,
    })
  }

  /**
   * Checks if a role has active users assigned to it
   *
   * @param id - The role ID to check
   * @returns Promise resolving to boolean indicating if role has active users
   */
  async roleHasActiveUsers(id: number): Promise<boolean> {
    const count = await this.prismaService.user.count({
      where: {
        roleId: id,
        status: 'ACTIVE',
      },
    })

    return count > 0
  }
}
