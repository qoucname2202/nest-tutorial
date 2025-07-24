import { ConflictException, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common'

export const LanguageAlreadyExistsException = new ConflictException([
  {
    message: 'Error.LanguageAlreadyExists',
    path: 'id',
  },
])

export const InternalRetrieveLanguageErrorException = new InternalServerErrorException({
  message: 'Error.InternalRetrieveLanguageError',
  path: 'languages',
})

export const InternalCreateLanguageErrorException = new InternalServerErrorException({
  message: 'Error.InternalCreateLanguageError',
  path: 'languages',
})

export const InternalUpdateLanguageErrorException = new InternalServerErrorException({
  message: 'Error.InternalUpdateLanguageError',
  path: 'languages',
})

export const InternalDeleteLanguageErrorException = new InternalServerErrorException({
  message: 'Error.InternalDeleteLanguageError',
  path: 'languages',
})

export const InternalHardDeleteLanguageErrorException = new InternalServerErrorException({
  message: 'Error.InternalHardDeleteLanguageError',
  path: 'languages',
})

export const InternalDeleteLanguageListErrorException = new InternalServerErrorException({
  message: 'Error.InternalDeleteLanguageListError',
  path: 'languages',
})

export const InternalRetrieveLanguageListErrorException = new InternalServerErrorException({
  message: 'Error.InternalRetrieveLanguageListError',
  path: 'languages',
})

export const InternalRestoreLanguageErrorException = new InternalServerErrorException({
  message: 'Error.InternalRestoreLanguageError',
  path: 'languages',
})

export const NotFoundLanguageException = new NotFoundException({
  message: 'Error.NotFoundLanguage',
  path: 'languages',
})

export const AtLeastOneFieldMustBeProvidedException = new BadRequestException({
  message: 'Error.AtLeastOneFieldMustBeProvided',
  path: 'languages',
})

export const LanguageNotDeletedException = new BadRequestException({
  message: 'Error.LanguageNotDeleted',
  path: 'languages',
})

export const InternalCountLanguageErrorException = new InternalServerErrorException({
  message: 'Error.InternalCountLanguageError',
  path: 'languages',
})

export const NoLanguageFoundToDeleteException = new NotFoundException({
  message: 'Error.NoLanguageFoundToDelete',
  path: 'languages',
})
