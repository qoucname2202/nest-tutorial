import { NestFactory } from '@nestjs/core'

import { Logger, Injectable } from '@nestjs/common'
import { HTTPMethod, RoleName } from 'src/shared/constants/role.constant'
import { PrismaService } from 'src/shared/services/prisma.service'
import { AppModule } from 'src/app.module'

// Configuration constants
const CONFIG = {
  PORT: 3010,
  BATCH_SIZE: 100, // Batch size for database operations
}

// Interface for route and permission objects
interface RoutePermission {
  path: string
  method: keyof typeof HTTPMethod
  name: string
  description: string
  module: string
}

@Injectable()
class PermissionSyncService {
  private readonly logger = new Logger(PermissionSyncService.name)
  private readonly prisma: PrismaService

  constructor() {
    this.prisma = new PrismaService()
  }

  /**
   * Extracts routes from the NestJS router
   */
  private getAvailableRoutes(app: any): RoutePermission[] {
    const server = app.getHttpAdapter().getInstance()
    return server.router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        method: layer.route.stack[0].method.toUpperCase() as keyof typeof HTTPMethod,
        name: `${layer.route.stack[0].method.toUpperCase()} ${layer.route.path}`,
        description: `Permission for ${layer.route.stack[0].method.toUpperCase()} ${layer.route.path}`,
        module: layer.route.path.split('/')[1] || 'root',
      }))
  }

  /**
   * Fetches existing permissions from database
   */
  private async getPermissionsFromDb(): Promise<any[]> {
    return this.prisma.permission.findMany({
      where: { deletedAt: null },
      select: { id: true, method: true, path: true },
    })
  }

  /**
   * Creates a map with method-path as key
   */
  private createMap<T>(items: T[], keyFn: (item: T) => string): Record<string, T> {
    return items.reduce(
      (acc, item) => {
        acc[keyFn(item)] = item
        return acc
      },
      {} as Record<string, T>,
    )
  }

  /**
   * Synchronizes permissions with available routes
   */
  async syncPermissions(app: any): Promise<void> {
    try {
      this.logger.log('Starting permission synchronization...')

      // Get routes and permissions concurrently
      const [availableRoutes, permissionsInDb] = await Promise.all([
        Promise.resolve(this.getAvailableRoutes(app)),
        this.getPermissionsFromDb(),
      ])

      // Create maps for efficient lookup
      const permissionInDbMap = this.createMap(permissionsInDb, (item) => `${item.method}-${item.path}`)
      const availableRoutesMap = this.createMap(availableRoutes, (item) => `${item.method}-${item.path}`)

      // Find permissions to delete
      const permissionsToDelete = permissionsInDb.filter((item) => !availableRoutesMap[`${item.method}-${item.path}`])

      // Find routes to add
      const routesToAdd = availableRoutes.filter((item) => !permissionInDbMap[`${item.method}-${item.path}`])

      // Execute database operations
      await this.prisma.$transaction([
        // Delete outdated permissions
        ...(permissionsToDelete.length > 0
          ? [
              this.prisma.permission.deleteMany({
                where: {
                  id: { in: permissionsToDelete.map((item) => item.id) },
                },
              }),
            ]
          : []),

        // Add new permissions
        ...(routesToAdd.length > 0
          ? [
              this.prisma.permission.createMany({
                data: routesToAdd,
                skipDuplicates: true,
              }),
            ]
          : []),
      ])

      this.logger.log(`Deleted ${permissionsToDelete.length} permissions`)
      this.logger.log(`Added ${routesToAdd.length} permissions`)

      // Update permission for admin routes
      const updatePermissionInDb = await this.prisma.permission.findMany({
        where: {
          deletedAt: null,
        },
      })

      const adminRole = await this.prisma.role.findFirstOrThrow({
        where: { name: RoleName.Admin, deletedAt: null },
      })

      await this.prisma.role.update({
        where: {
          id: adminRole.id,
        },
        data: {
          permissions: {
            set: updatePermissionInDb.map((permission) => ({ id: permission.id })),
          },
        },
      })

      await this.prisma.$disconnect()
    } catch (error) {
      this.logger.error('Permission synchronization failed', error)
      throw error
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const permissionSyncService = new PermissionSyncService()

  try {
    await app.listen(CONFIG.PORT)
    await permissionSyncService.syncPermissions(app)
    await app.close()
    process.exit(0)
  } catch (error) {
    console.error('Bootstrap failed:', error)
    process.exit(1)
  }
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error)
  process.exit(1)
})
