import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { PermissionService } from './permission.service'
import {
  CreatePermissionBodyDTO,
  UpdatePermissionBodyDTO,
  PermissionResponseDTO,
  PermissionListResponseDTO,
  BulkDeletePermissionsDTO,
  AssignRolesToPermissionDTO,
  PermissionStatsResponseDTO,
  MessageResponseDTO,
  GetPermissionQueryDTO,
  GetPermissionIdParamDTO,
  GetPermissionsResDTO,
} from './dto/permission.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'

/**
 * Controller for Permission entity operations
 * Provides RESTful endpoints for permission management with role-based access control
 */
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * Retrieves list of permissions
   * @returns Promise resolving permission list
   *
   * @example
   * GET /permissions
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetPermissionsResDTO)
  async list() {
    return await this.permissionService.list()
  }

  /**
   * Creates a new permission
   *
   * @param createPermissionDto - The permission data to create
   * @param userId - ID of the authenticated user creating the permission
   * @returns Promise resolving to the created permission
   *
   * @example
   * POST /permissions
   * Body: { "name": "string", "description": "string", "path": "string", "method": "string" }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(PermissionResponseDTO)
  async create(@Body() createPermissionDto: CreatePermissionBodyDTO, @ActiveUser('userId') userId: number) {
    return await this.permissionService.create({ createPermissionDto, createdById: userId })
  }

  /**
   * Retrieves a paginated list of permissions with optional search and filtering
   *
   * @param queryParams - Query parameters for pagination, search, and filtering
   * @returns Promise resolving to paginated permission list
   *
   * @example
   * GET /permissions/pagination?page=1&limit=10&search=user&method=GET&includeDeleted=false
   */
  @Get('pagination')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(PermissionListResponseDTO)
  async findAll(@Query() queryParams: GetPermissionQueryDTO) {
    return await this.permissionService.findAll(queryParams)
  }

  /**
   * Retrieves a single permission by ID
   *
   * @param params - Path parameters containing the permission ID
   * @returns Promise resolving to the permission
   *
   * @example
   * GET /permissions/1
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(PermissionResponseDTO)
  async findById(@Param() params: GetPermissionIdParamDTO) {
    return await this.permissionService.findById(params.id)
  }

  /**
   * Retrieves a permission with all its related roles and user information
   *
   * @param params - Path parameters containing the permission ID
   * @returns Promise resolving to the permission with relations
   *
   * @example
   * GET /permissions/1/relations
   */
  @Get(':id/relations')
  @HttpCode(HttpStatus.OK)
  async findRelations(@Param() params: GetPermissionIdParamDTO) {
    return await this.permissionService.findRelations(params.id)
  }

  /**
   * Updates an existing permission
   *
   * @param params - Path parameters containing the permission ID
   * @param updatePermissionDto - The data to update
   * @param userId - ID of the authenticated user performing the update
   * @returns Promise resolving to the updated permission
   *
   * @example
   * PATCH /permissions/1
   * Body: { "name": "Read Users (Updated)" }
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(PermissionResponseDTO)
  async update(
    @Param() params: GetPermissionIdParamDTO,
    @Body() body: UpdatePermissionBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return await this.permissionService.update({ id: params.id, data: body, updatedById: userId })
  }

  /**
   * Soft deletes a permission
   *
   * @param params - Path parameters containing the permission ID
   * @param userId - ID of the authenticated user performing the deletion
   * @returns Promise resolving to success message
   *
   * @example
   * DELETE /permissions/1
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResponseDTO)
  async softDelete(@Param() params: GetPermissionIdParamDTO, @ActiveUser('userId') userId: number) {
    return await this.permissionService.softDelete({
      id: params.id,
      deletedById: userId,
    })
  }

  /**
   * Restores a soft-deleted permission
   *
   * @param params - Path parameters containing the permission ID
   * @param userId - ID of the authenticated user performing the restoration
   * @returns Promise resolving to the restored permission
   *
   * @example
   * PATCH /permissions/1/restore
   */
  @Patch(':id/restore')
  @ZodSerializerDto(PermissionResponseDTO)
  async restore(@Param() params: GetPermissionIdParamDTO, @ActiveUser('userId') userId: number) {
    return await this.permissionService.restore({ id: params.id, restoredById: userId })
  }

  /**
   * Permanently deletes a permission
   *
   * @param params - Path parameters containing the permission ID
   * @returns Promise resolving to success message
   *
   * @example
   * DELETE /permissions/1/permanent
   */
  @Delete(':id/permanent')
  @ZodSerializerDto(MessageResponseDTO)
  async hardDelete(@Param() params: GetPermissionIdParamDTO) {
    return await this.permissionService.hardDelete(params.id)
  }

  /**
   * Bulk soft deletes multiple permissions
   *
   * @body bulkDeleteDto - Object containing array of permission IDs to delete
   * @param userId - ID of the authenticated user performing the deletion
   * @returns Promise resolving to success message with count
   *
   * @example
   * DELETE /permissions/bulk
   * Body: { "ids": [1, 2, 3] }
   */
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResponseDTO)
  async bulkSoftDelete(@Body() body: BulkDeletePermissionsDTO, @ActiveUser('userId') userId: number) {
    return await this.permissionService.bulkSoftDelete({ data: body, deletedById: userId })
  }

  /**
   * Assigns roles to a permission
   *
   * @param params - Path parameters containing the permission ID
   * @body assignRolesDto - Object containing array of role IDs to assign
   * @returns Promise resolving to the permission with assigned roles
   *
   * @example
   * POST /permissions/1/roles
   * Body: { "roleIds": [1, 2, 3] }
   */
  @Post(':id/roles')
  @HttpCode(HttpStatus.OK)
  async assignRoles(@Param() params: GetPermissionIdParamDTO, @Body() body: AssignRolesToPermissionDTO) {
    return await this.permissionService.assignRoles({ permissionId: params.id, body })
  }

  /**
   * Gets permission statistics including counts by method
   *
   * @param query - Query parameters for filtering
   * @returns Promise resolving to permission statistics
   *
   * @example
   * GET /permissions/stats?includeDeleted=false
   */
  @Get('stats')
  @ZodSerializerDto(PermissionStatsResponseDTO)
  async getStats(@Query('includeDeleted') includeDeleted?: string) {
    const includeDeletedBool = includeDeleted === 'true'
    return await this.permissionService.getStats(includeDeletedBool)
  }

  /**
   * Gets the total count of permissions
   *
   * @param query - Query parameters for filtering
   * @returns Promise resolving to the total count
   *
   * @example
   * GET /permissions/count?includeDeleted=false
   */
  @Get('count')
  async getCount(@Query('includeDeleted') includeDeleted?: string) {
    const includeDeletedBool = includeDeleted === 'true'
    return await this.permissionService.getCount(includeDeletedBool)
  }
}
