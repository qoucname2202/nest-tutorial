import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'

export const PermissionAlreadyExistsException = new ConflictException([
  {
    message: 'Error.PermissionAlreadyExists',
    path: 'path',
  },
  {
    message: 'Error.PermissionAlreadyExists',
    path: 'method',
  },
])

export const MethodAndPathAlreadyExistsException = new UnprocessableEntityException([
  {
    message: 'Error.PermissionAlreadyExists',
    path: 'path',
  },
  {
    message: 'Error.PermissionAlreadyExists',
    path: 'method',
  },
])

export const InternalCreatePermissionErrorException = new InternalServerErrorException({
  message: 'Error.InternalCreatePermissionError',
  path: 'permissions',
})

export const InternalUpdatePermissionErrorException = new InternalServerErrorException({
  message: 'Error.InternalUpdatePermissionError',
  path: 'permissions',
})

export const InternalDeletePermissionErrorException = new InternalServerErrorException({
  message: 'Error.InternalDeletePermissionError',
  path: 'permissions',
})

export const InternalHardDeletePermissionErrorException = new InternalServerErrorException({
  message: 'Error.InternalHardDeletePermissionError',
  path: 'permissions',
})

export const InternalDeletePermissionListErrorException = new InternalServerErrorException({
  message: 'Error.InternalDeletePermissionListError',
  path: 'permissions',
})

export const InternalRetrievePermissionsErrorException = new InternalServerErrorException({
  message: 'Error.InternalRetrievePermissionsError',
  path: 'permissions',
})

export const InternalReviewPermissionWithRelationsErrorException = new InternalServerErrorException({
  message: 'Error.InternalReviewPermissionWithRelationsError',
  path: 'permissions',
})

export const InternalRetrievePermissionByIdErrorException = new InternalServerErrorException({
  message: 'Error.InternalRetrievePermissionByIdError',
  path: 'permissions',
})

export const InternalRetrievePermissionUsingPaginationErrorException = new InternalServerErrorException({
  message: 'Error.InternalRetrievePermissionUsingPaginationError',
  path: 'permissions',
})

export const InternalRestorePermissionErrorException = new InternalServerErrorException({
  message: 'Error.InternalRestorePermissionError',
  path: 'permissions',
})

export const PermissionNotFoundException = new NotFoundException({
  message: 'Error.PermissionNotFound',
  path: 'permissions',
})

export const AtLeastOneFieldMustBeProvidedException = new BadRequestException({
  message: 'Error.AtLeastOneFieldMustBeProvided',
  path: 'permissions',
})

export const PermissionNotDeletedException = new BadRequestException({
  message: 'Error.PermissionNotDeleted',
  path: 'permissions',
})

export const PermissionCouldNotRestoreException = new BadRequestException({
  message: 'Error.PermissionCouldNotRestore',
  path: 'permissions',
})

export const AtLeastOnePermissionIdMustBeProvidedException = new BadRequestException({
  message: 'Error.AtLeastOnePermissionIdMustBeProvided',
  path: 'permissions',
})

export const NoPermissionFoundToDeleteException = new NotFoundException({
  message: 'Error.NoPermissionFoundToDelete',
  path: 'permissions',
})

export const InternalAssignRolesToPermissionErrorException = new InternalServerErrorException({
  message: 'Error.InternalAssignRolesToPermissionError',
  path: 'permissions',
})

export const InternalCountPermissionErrorException = new InternalServerErrorException({
  message: 'Error.InternalCountPermissionError',
  path: 'permissions',
})

export const InternalStatisticsErrorException = new InternalServerErrorException({
  message: 'Error.InternalStatisticsError',
  path: 'permissions',
})
