import { Prisma } from '@prisma/client'
import { randomInt } from 'crypto'
import { envConfig } from './config'

export function isUniqueConstraintPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export function isNotFoundPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

export function isValidationPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003'
}

export const generateOTP = (): string => {
  return String(randomInt(100000, 1000000))
}

export const stripPrefix = (path: string): string => {
  const PREFIX_URL = envConfig.prefixUrl
  if (path.startsWith(PREFIX_URL)) {
    return path.slice(PREFIX_URL.length)
  }
  return path
}
