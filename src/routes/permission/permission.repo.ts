import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  PermissionType,
  CreatePermissionBodyType,
  UpdatePermissionBodyType,
  PermissionWithRelationsType,
  PermissionStatsType,
  GetPermissionQueryType,
  HTTPMethodType,
} from './permission.model'

@Injectable()
export class PermissionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new permission record in the database
   *
   * @body data - The permission data to create
   * @header createdById - ID of the user creating the permission
   * @returns Promise resolving to the created permission
   */
  async create({
    data,
    createdById,
  }: {
    data: CreatePermissionBodyType
    createdById: number | null
  }): Promise<PermissionType> {
    return await this.prismaService.permission.create({
      data: {
        ...data,
        createdById,
      },
    })
  }

  /**
   * Finds a unique permission by ID, with optional soft delete filtering
   *
   * @param id - The permission ID to search for
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the permission or null if not found
   */
  async findById(id: number, includeDeleted: boolean = false): Promise<PermissionType | null> {
    const payload: any = { id }

    // Exclude soft-deleted records unless explicitly requested
    if (!includeDeleted) {
      payload.deletedAt = null
    }

    return await this.prismaService.permission.findUnique({
      where: payload,
    })
  }

  /**
   * Finds a permission by path and method combination
   * Used for checking uniqueness constraint
   *
   * @param path - The permission path
   * @param method - The HTTP method
   * @param excludeId - Optional ID to exclude from search (for updates)
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the permission or null if not found
   */
  async findByPathAndMethod(
    path: string,
    method: HTTPMethodType,
    excludeId?: number,
    includeDeleted: boolean = false,
  ): Promise<PermissionType | null> {
    const whereClause: any = {
      path,
      method,
    }

    if (excludeId) {
      whereClause.id = { not: excludeId }
    }

    if (!includeDeleted) {
      whereClause.deletedAt = null
    }

    return await this.prismaService.permission.findFirst({
      where: whereClause,
    })
  }

  /**
   * Finds a permission with all its related roles and user information
   *
   * @param id - The permission ID to search for
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the permission with relations or null if not found
   */
  async findRelations(id: number, includeDeleted: boolean = false): Promise<PermissionWithRelationsType | null> {
    const whereClause: any = { id }

    if (!includeDeleted) {
      whereClause.deletedAt = null
    }

    return await this.prismaService.permission.findUnique({
      where: whereClause,
      include: {
        roles: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
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
   * Retrieves a paginated list of permissions with optional search and filtering
   *
   * @param queryParams - Query parameters for pagination, search, and filtering
   * @returns Promise resolving to paginated permission list with metadata
   */
  async list(): Promise<PermissionType[]> {
    return await this.prismaService.permission.findMany({
      where: { deletedAt: null },
      orderBy: [
        { createdAt: 'desc' }, // Most recent first
        { name: 'asc' }, // Then alphabetically by name
      ],
    })
  }

  /**
   * Retrieves a paginated list of permissions with optional search and filtering
   *
   * @param queryParams - Query parameters for pagination, search, and filtering
   * @returns Promise resolving to paginated permission list with metadata
   */
  async findAll(queryParams: GetPermissionQueryType): Promise<{
    data: PermissionType[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const { page, limit, search, method, includeDeleted } = queryParams
    const skip = (page - 1) * limit

    // Build where clause for filtering
    const payload: any = {}

    // Exclude soft-deleted records unless explicitly requested
    if (!includeDeleted) {
      payload.deletedAt = null
    }

    // Add method filtering
    if (method) {
      payload.method = method
    }

    // Add search functionality for name, description, and path
    if (search) {
      payload.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          path: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Execute queries in parallel for better performance
    const [permissions, totalCount] = await Promise.all([
      this.prismaService.permission.findMany({
        where: payload,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      }),
      this.prismaService.permission.count({
        where: payload,
      }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      data: permissions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    }
  }

  /**
   * Updates an existing permission record
   *
   * @param id - The permission ID to update
   * @param data - The data to update
   * @param updatedById - ID of the user performing the update
   * @returns Promise resolving to the updated permission
   */
  async update({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: UpdatePermissionBodyType
    updatedById: number
  }): Promise<PermissionType> {
    return await this.prismaService.permission.update({
      where: { id },
      data: {
        ...data,
        updatedById,
      },
    })
  }

  /**
   * Soft deletes a permission by setting the deletedAt timestamp
   *
   * @param id - The permission ID to soft delete
   * @param deletedById - ID of the user performing the deletion
   * @returns Promise resolving to the soft-deleted permission
   */
  async softDelete({ id, deletedById }: { id: number; deletedById: number }): Promise<PermissionType> {
    return await this.prismaService.permission.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById,
        updatedById: deletedById,
      },
    })
  }

  /**
   * Restores a soft-deleted permission by clearing the deletedAt timestamp
   *
   * @param id - The permission ID to restore
   * @param restoredById - ID of the user performing the restoration
   * @returns Promise resolving to the restored permission
   */
  async restore({ id, restoredById }: { id: number; restoredById: number }): Promise<PermissionType> {
    return await this.prismaService.permission.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        updatedById: restoredById,
      },
    })
  }

  /**
   * Permanently deletes a permission from the database
   *
   * @param id - The permission ID to permanently delete
   * @returns Promise resolving to the deleted permission
   */
  async hardDelete(id: number): Promise<PermissionType> {
    return await this.prismaService.permission.delete({
      where: { id },
    })
  }

  /**
   * Bulk soft deletes multiple permissions
   *
   * @param ids - Array of permission IDs to soft delete
   * @param deletedById - ID of the user performing the deletion
   * @returns Promise resolving to the count of deleted permissions
   */
  async bulkSoftDelete({ ids, deletedById }: { ids: number[]; deletedById: number }): Promise<number> {
    const result = await this.prismaService.permission.updateMany({
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
   * Assigns roles to a permission
   *
   * @param permissionId - The permission ID
   * @param roleIds - Array of role IDs to assign
   * @returns Promise resolving to the updated permission with roles
   */
  async assignRoles({
    permissionId,
    roleIds,
  }: {
    permissionId: number
    roleIds: number[]
  }): Promise<PermissionWithRelationsType> {
    return await this.prismaService.permission.update({
      where: { id: permissionId },
      data: {
        roles: {
          set: roleIds.map((roleId) => ({ id: roleId })),
        },
      },
      include: {
        roles: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
      },
    })
  }

  /**
   * Removes roles from a permission
   *
   * @param permissionId - The permission ID
   * @param roleIds - Array of role IDs to remove
   * @returns Promise resolving to the updated permission with roles
   */
  async removeRolesFromPermission(permissionId: number, roleIds: number[]): Promise<PermissionWithRelationsType> {
    return await this.prismaService.permission.update({
      where: { id: permissionId },
      data: {
        roles: {
          disconnect: roleIds.map((roleId) => ({ id: roleId })),
        },
      },
      include: {
        roles: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
      },
    })
  }

  /**
   * Gets permission statistics including counts by method
   *
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to permission statistics
   */
  async getStats(includeDeleted: boolean = false): Promise<PermissionStatsType> {
    const payload: any = {}

    if (!includeDeleted) {
      payload.deletedAt = null
    }

    // Get total count and deleted count in parallel
    const [totalPermissions, deletedPermissions, permissionsByMethod, recentlyCreated] = await Promise.all([
      this.prismaService.permission.count({ where: payload }),
      this.prismaService.permission.count({ where: { deletedAt: { not: null } } }),
      this.prismaService.permission.groupBy({
        by: ['method'],
        where: payload,
        _count: { method: true },
      }),
      this.prismaService.permission.count({
        where: {
          ...payload,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    // Transform grouped results into a record
    const permissionsByMethodRecord: Record<string, number> = {}
    permissionsByMethod.forEach((group) => {
      permissionsByMethodRecord[group.method] = group._count.method
    })

    return {
      totalPermissions,
      permissionsByMethod: permissionsByMethodRecord,
      deletedPermissions,
      recentlyCreated,
    }
  }

  /**
   * Checks if a permission exists by ID
   *
   * @param id - The permission ID to check
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to boolean indicating existence
   */
  async permissionExists(id: number, includeDeleted: boolean = false): Promise<boolean> {
    return (
      (await this.prismaService.permission.count({
        where: { id, deletedAt: includeDeleted ? undefined : null },
      })) > 0
    )
  }

  /**
   * Gets the total count of permissions with optional filtering
   *
   * @param includeDeleted - Whether to include soft-deleted records (default: false)
   * @returns Promise resolving to the total count
   */
  async getCount(includeDeleted: boolean = false): Promise<number> {
    const payload: any = {}

    if (!includeDeleted) {
      payload.deletedAt = null
    }

    return await this.prismaService.permission.count({
      where: payload,
    })
  }
}
