import { ConflictException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'

export const InvalidOTPException = new UnprocessableEntityException([
  {
    message: 'Error.InvalidOTP',
    path: 'code',
  },
])

export const InvalidOTPExpiredExcepton = new UnprocessableEntityException([
  {
    message: 'Error.InvalidOTPExpired',
    path: 'code',
  },
])

export const EmailAlreadyExistsException = new ConflictException({
  message: 'Error.EmailAlreadyExists',
  path: 'email',
})

export const FailedToSendOTPException = new UnprocessableEntityException({
  message: 'Error.FailedToSendOTP',
  path: 'email',
})

export const EmailNotExistsException = new UnprocessableEntityException({
  message: 'Error.EmailNotExists',
  path: 'email',
})

export const PasswordIncorrectException = new UnprocessableEntityException({
  message: 'Error.PasswordIncorrect',
  path: 'password',
})

export const RefreshTokenRevokedException = new UnauthorizedException({
  message: 'Error.RefreshTokenRevoked',
  path: 'refreshToken',
})

// Auth token related errors
export const RefreshTokenAlreadyUsedException = new UnauthorizedException('Error.RefreshTokenAlreadyUsed')
export const UnauthorizedAccessException = new UnauthorizedException('Error.UnauthorizedAccess')
