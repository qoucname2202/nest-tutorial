import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { RoleService } from './role.service'
import {
  CreateRoleBodyDTO,
  UpdateRoleBodyDTO,
  RoleResponseDTO,
  GetRolesResDTO,
  RoleIdParamDTO,
  BulkDeleteRolesDTO,
  AssignPermissionsToRoleDTO,
  RoleStatsResponseDTO,
  ToggleRoleStatusDTO,
  MessageResponseDTO,
  GetRoleQueryDTO,
  GetRoleListResDTO,
} from './dto/role.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * Creates a new role
   *
   * @param createRoleDto - The role data to create
   * @param userId - ID of the authenticated user creating the role
   * @returns Promise resolving to the created role
   *
   * @example
   * POST /roles
   * Body: { "name": "Manager", "description": "Manager role with limited admin access", "isActive": true }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(RoleResponseDTO)
  async create(@Body() body: CreateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    return await this.roleService.create({ data: body, createdById: userId })
  }

  /**
   * Retrieves list of roles
   * @returns Promise resolving role list
   *
   * @example
   * GET /roles
   */
  @Get()
  @ZodSerializerDto(GetRoleListResDTO)
  async list() {
    return await this.roleService.list()
  }

  /**
   * Retrieves a paginated list of roles with optional search and filtering
   *
   * @param queryParams - Query parameters for pagination, search, and filtering
   * @returns Promise resolving to paginated role list
   *
   * @example
   * GET /roles?page=1&limit=10&search=admin&isActive=true&includeDeleted=false
   */
  @Get('pagination')
  @ZodSerializerDto(GetRolesResDTO)
  async findAll(@Query() queryParams: GetRoleQueryDTO) {
    return await this.roleService.findAll(queryParams)
  }

  /**
   * Retrieves a single role by ID
   *
   * @param params - Path parameters containing the role ID
   * @returns Promise resolving to the role
   *
   * @example
   * GET /roles/1
   */
  @Get(':roleId')
  @ZodSerializerDto(RoleResponseDTO)
  async findOne(@Param() params: RoleIdParamDTO) {
    return await this.roleService.findOne(params.roleId)
  }

  /**
   * Retrieves a role with all its related permissions and user information
   *
   * @param params - Path parameters containing the role ID
   * @returns Promise resolving to the role with relations
   *
   * @example
   * GET /roles/1/relations
   */
  @Get(':roleId/relations')
  async findRoleWithRelations(@Param() params: RoleIdParamDTO) {
    return await this.roleService.findRoleWithRelations(params.roleId)
  }

  /**
   * Updates an existing role
   *
   * @param params - Path parameters containing the role ID
   * @param updateRoleDto - The data to update
   * @param userId - ID of the authenticated user performing the update
   * @returns Promise resolving to the updated role
   *
   * @example
   * PATCH /roles/1
   * Body: { "name": "Manager (Updated)", "isActive": false, "permissionIds": [1, 2, 3] }
   */
  @Patch(':roleId')
  @ZodSerializerDto(RoleResponseDTO)
  async updateRole(
    @Param() params: RoleIdParamDTO,
    @Body() updateRoleDto: UpdateRoleBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return await this.roleService.updateRole({
      id: params.roleId,
      data: updateRoleDto,
      updatedById: userId,
    })
  }

  /**
   * Soft deletes a role
   *
   * @param params - Path parameters containing the role ID
   * @param userId - ID of the authenticated user performing the deletion
   * @returns Promise resolving to success message
   *
   * @example
   * DELETE /roles/1
   */
  @Delete(':roleId')
  @ZodSerializerDto(MessageResponseDTO)
  async softDeleteRole(@Param() params: RoleIdParamDTO, @ActiveUser('userId') userId: number) {
    return await this.roleService.softDeleteRole(params.roleId, userId)
  }

  /**
   * Restores a soft-deleted role
   *
   * @param params - Path parameters containing the role ID
   * @param userId - ID of the authenticated user performing the restoration
   * @returns Promise resolving to the restored role
   *
   * @example
   * PATCH /roles/1/restore
   */
  @Patch(':roleId/restore')
  @ZodSerializerDto(RoleResponseDTO)
  async restoreRole(@Param() params: RoleIdParamDTO, @ActiveUser('userId') userId: number) {
    return await this.roleService.restoreRole(params.roleId, userId)
  }

  /**
   * Permanently deletes a role
   * WARNING: This action cannot be undone
   *
   * @param params - Path parameters containing the role ID
   * @returns Promise resolving to success message
   *
   * @example
   * DELETE /roles/1/permanent
   */
  @Delete(':roleId/permanent')
  @ZodSerializerDto(MessageResponseDTO)
  async hardDeleteRole(@Param() params: RoleIdParamDTO) {
    return await this.roleService.hardDeleteRole(params.roleId)
  }

  /**
   * Bulk soft deletes multiple roles
   *
   * @param bulkDeleteDto - Object containing array of role IDs to delete
   * @param userId - ID of the authenticated user performing the deletion
   * @returns Promise resolving to success message with count
   *
   * @example
   * DELETE /roles/bulk
   * Body: { "ids": [1, 2, 3] }
   */
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResponseDTO)
  async bulkSoftDeleteRoles(@Body() bulkDeleteDto: BulkDeleteRolesDTO, @ActiveUser('userId') userId: number) {
    return await this.roleService.bulkSoftDeleteRoles(bulkDeleteDto, userId)
  }

  /**
   * Assigns permissions to a role
   *
   * @param params - Path parameters containing the role ID
   * @param assignPermissionsDto - Object containing array of permission IDs to assign
   * @returns Promise resolving to the role with assigned permissions
   *
   * @example
   * POST /roles/1/permissions
   * Body: { "permissionIds": [1, 2, 3] }
   */
  @Post(':roleId/permissions')
  @HttpCode(HttpStatus.OK)
  async assignPermissionsToRole(
    @Param() params: RoleIdParamDTO,
    @Body() assignPermissionsDto: AssignPermissionsToRoleDTO,
  ) {
    return await this.roleService.assignPermissionsToRole(params.roleId, assignPermissionsDto)
  }

  /**
   * Toggles the active status of a role
   *
   * @param params - Path parameters containing the role ID
   * @param toggleStatusDto - Object containing the new active status
   * @param userId - ID of the authenticated user performing the update
   * @returns Promise resolving to the updated role
   *
   * @example
   * PATCH /roles/1/toggle-status
   * Body: { "isActive": false }
   */
  @Patch(':roleId/toggle-status')
  @ZodSerializerDto(RoleResponseDTO)
  async toggleRoleStatus(
    @Param() params: RoleIdParamDTO,
    @Body() toggleStatusDto: ToggleRoleStatusDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return await this.roleService.toggleRoleStatus(params.roleId, toggleStatusDto, userId)
  }

  /**
   * Gets role statistics including counts by status
   *
   * @param query - Query parameters for filtering
   * @returns Promise resolving to role statistics
   *
   * @example
   * POST /roles/stats?includeDeleted=false
   */
  @Post('stats')
  @ZodSerializerDto(RoleStatsResponseDTO)
  async getRoleStats(@Query('includeDeleted') includeDeleted?: string) {
    const includeDeletedBool = includeDeleted === 'true'
    return await this.roleService.getRoleStats(includeDeletedBool)
  }

  /**
   * Gets the total count of roles
   *
   * @param query - Query parameters for filtering
   * @returns Promise resolving to the total count
   *
   * @example
   * POST /roles/count?includeDeleted=false
   */
  @Post('count')
  async getRoleCount(@Query('includeDeleted') includeDeleted?: string) {
    const includeDeletedBool = includeDeleted === 'true'
    return await this.roleService.getRoleCount(includeDeletedBool)
  }
}
