import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'

// === Role Conflict Exceptions ===
export const RoleAlreadyExistsException = new ConflictException([
  {
    message: 'Error.RoleAlreadyExists',
    path: 'name',
  },
])

export const RoleNameAlreadyExistsException = new ConflictException([
  {
    message: 'Error.RoleNameAlreadyExists',
    path: 'name',
  },
])

// === Role Not Found Exceptions ===
export const RoleNotFoundException = new NotFoundException([
  {
    message: 'Error.RoleNotFound',
    path: 'id',
  },
])

export const RoleNotFoundByIdException = new NotFoundException([
  {
    message: 'Error.RoleNotFoundById',
    path: 'id',
  },
])

export const RoleNotFoundByNameException = new NotFoundException([
  {
    message: 'Error.RoleNotFoundByName',
    path: 'name',
  },
])

// === Role Validation Exceptions ===
export const AtLeastOneFieldMustBeProvidedForRoleUpdateException = new BadRequestException([
  {
    message: 'Error.AtLeastOneFieldMustBeProvidedForUpdate',
    path: 'body',
  },
])

export const AtLeastOneRoleIdMustBeProvidedException = new BadRequestException([
  {
    message: 'Error.AtLeastOneRoleIdMustBeProvided',
    path: 'ids',
  },
])

export const RoleIsNotDeletedException = new BadRequestException([
  {
    message: 'Error.RoleIsNotDeleted',
    path: 'id',
  },
])

export const CannotDeleteSystemRoleException = new UnprocessableEntityException([
  {
    message: 'Error.CannotDeleteSystemRole',
    path: 'id',
  },
])

export const CannotModifySystemRoleException = new UnprocessableEntityException([
  {
    message: 'Error.CannotModifySystemRole',
    path: 'id',
  },
])

export const RoleHasActiveUsersException = new UnprocessableEntityException([
  {
    message: 'Error.RoleHasActiveUsers',
    path: 'id',
  },
])

// === Role Internal Server Exceptions ===
export const InternalCreateRoleErrorException = new InternalServerErrorException({
  message: 'Error.InternalCreateRoleError',
  path: 'roles',
})

export const InternalRetrieveRoleErrorException = new InternalServerErrorException({
  message: 'Error.InternalRetrieveRoleError',
  path: 'roles',
})

export const InternalRetrieveRolesErrorException = new InternalServerErrorException({
  message: 'Error.InternalRetrieveRolesError',
  path: 'roles',
})

export const InternalUpdateRoleErrorException = new InternalServerErrorException({
  message: 'Error.InternalUpdateRoleError',
  path: 'roles',
})

export const InternalDeleteRoleErrorException = new InternalServerErrorException({
  message: 'Error.InternalDeleteRoleError',
  path: 'roles',
})

export const InternalRestoreRoleErrorException = new InternalServerErrorException({
  message: 'Error.InternalRestoreRoleError',
  path: 'roles',
})

export const InternalBulkDeleteRolesErrorException = new InternalServerErrorException({
  message: 'Error.InternalBulkDeleteRolesError',
  path: 'roles',
})

export const InternalAssignPermissionsToRoleErrorException = new InternalServerErrorException({
  message: 'Error.InternalAssignPermissionsToRoleError',
  path: 'roles',
})

export const InternalCountRoleErrorException = new InternalServerErrorException({
  message: 'Error.InternalCountRoleError',
  path: 'roles',
})

export const InternalRoleStatsErrorException = new InternalServerErrorException({
  message: 'Error.InternalRoleStatsError',
  path: 'roles',
})

export const InternalToggleRoleStatusErrorException = new InternalServerErrorException({
  message: 'Error.InternalToggleRoleStatusError',
  path: 'roles',
})
