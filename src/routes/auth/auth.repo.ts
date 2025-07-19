import { Injectable } from '@nestjs/common'
import { UserType } from 'src/shared/models/shared-user.model.'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RoleType, VerificationCodeType, RefreshTokenType } from './auth.model'
import { TypeVerifycationCodeType } from 'src/shared/constants/auth.constant'
import { DeviceType } from './dto/auth.dto'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(
    user: Pick<UserType, 'email' | 'name' | 'password' | 'phoneNumber' | 'roleId'>,
  ): Promise<Omit<UserType, 'password' | 'totpSecret'>> {
    return await this.prismaService.user.create({
      data: user,
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }

  async createUserInCludeRole(
    user: Pick<UserType, 'email' | 'name' | 'password' | 'phoneNumber' | 'roleId' | 'avatar'>,
  ): Promise<UserType & { role: RoleType }> {
    return await this.prismaService.user.create({
      data: user,
      include: {
        role: true,
      },
    })
  }

  async createVerificationCode(
    payload: Pick<VerificationCodeType, 'email' | 'code' | 'type' | 'expiresAt'>,
  ): Promise<VerificationCodeType> {
    // Nếu chưa có thì tạo mới, nếu đã có thì cập nhật
    return await this.prismaService.verificationCode.upsert({
      where: {
        email: payload.email,
      },
      create: payload,
      update: {
        code: payload.code,
        expiresAt: payload.expiresAt,
      },
    })
  }

  findVerificationCodeByEmailAndType(
    uniqueValue: { email: string } | { id: number } | { email: string; code: string; type: TypeVerifycationCodeType },
  ): Promise<VerificationCodeType | null> {
    return this.prismaService.verificationCode.findFirst({
      where: uniqueValue,
    })
  }

  async createRefreshToken(data: { userId: number; token: string; expiresAt: Date; deviceId: number }) {
    await this.prismaService.refreshToken.create({
      data,
    })
  }

  createDevice(
    data: Pick<DeviceType, 'userId' | 'userAgent' | 'ip'> & Partial<Pick<DeviceType, 'lastActive' | 'isActive'>>,
  ) {
    return this.prismaService.device.create({
      data,
    })
  }

  async findUniqueUserIncludeRole(
    uniqueObject: { email: string } | { id: number },
  ): Promise<(UserType & { role: RoleType }) | null> {
    return this.prismaService.user.findUnique({
      where: uniqueObject,
      include: {
        role: true,
      },
    })
  }

  /**
   * Finds a unique refresh token by token string and includes the associated user's role information.
   * This function is essential for token validation and authorization processes.
   *
   * @param token - The refresh token string to search for
   * @returns Promise resolving to refresh token with user and role data, or null if not found
   */
  async findUniqueRefreshTokenIncludeUserRole(token: string): Promise<
    | (RefreshTokenType & {
        user: UserType & {
          role: RoleType
        }
      })
    | null
  > {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('Token parameter must be a non-empty string')
    }

    return await this.prismaService.refreshToken.findUnique({
      where: {
        token: token.trim(),
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    })
  }

  /**
   * Finds a unique refresh token by token string with additional validation for expiration.
   * This is a more comprehensive version that also checks if the token is still valid.
   *
   * @param token - The refresh token string to search for
   * @param validateExpiration - Whether to validate if the token is not expired (default: true)
   * @returns Promise resolving to refresh token with user and role data, or null if not found/expired
   */
  async findValidRefreshTokenIncludeUserRole(
    token: string,
    validateExpiration: boolean = true,
  ): Promise<
    | (RefreshTokenType & {
        user: UserType & {
          role: RoleType
        }
      })
    | null
  > {
    // Validate input parameter
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('Token parameter must be a non-empty string')
    }

    try {
      const currentTime = new Date()

      // Build the where clause conditionally based on expiration validation
      const whereClause: any = {
        token: token.trim(),
      }

      // Add expiration validation if requested
      if (validateExpiration) {
        whereClause.expiresAt = {
          gt: currentTime,
        }
      }

      // Query the refresh token with nested user and role information
      const refreshTokenWithUserRole = await this.prismaService.refreshToken.findFirst({
        where: whereClause,
        include: {
          user: {
            include: {
              role: true,
            },
          },
        },
      })

      return refreshTokenWithUserRole
    } catch (error) {
      console.error('Error finding valid refresh token with user role:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenLength: token.length,
        validateExpiration,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Finds all refresh tokens for a specific user including role information.
   * Useful for managing user sessions and security auditing.
   *
   * @param userId - The ID of the user whose tokens to retrieve
   * @param includeExpired - Whether to include expired tokens (default: false)
   * @returns Promise resolving to array of refresh tokens with user and role data
   */
  async findUserRefreshTokensIncludeRole(
    userId: number,
    includeExpired: boolean = false,
  ): Promise<
    (RefreshTokenType & {
      user: UserType & {
        role: RoleType
      }
    })[]
  > {
    // Validate input parameter
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      throw new Error('User ID must be a positive number')
    }

    const currentTime = new Date()

    // Build the where clause conditionally based on expiration inclusion
    const whereClause: any = {
      userId,
    }

    // Exclude expired tokens if not requested
    if (!includeExpired) {
      whereClause.expiresAt = {
        gt: currentTime,
      }
    }

    // Query all refresh tokens for the user with nested user and role information
    const refreshTokensWithUserRole = await this.prismaService.refreshToken.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return refreshTokensWithUserRole
  }

  /**
   * Deletes a specific refresh token by token string.
   * Used for logout functionality and token cleanup.
   *
   * @param token - The refresh token string to delete
   * @returns Promise resolving to the deleted token data, or null if not found
   */
  async deleteRefreshToken(token: string): Promise<RefreshTokenType> {
    // Validate input parameter
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('Token parameter must be a non-empty string')
    }

    // Delete the token
    const deletedToken = await this.prismaService.refreshToken.delete({
      where: {
        token: token.trim(),
      },
    })

    return deletedToken
  }

  /**
   * Deletes all refresh tokens for a specific user.
   * Used for logout from all devices functionality.
   *
   * @param userId - The ID of the user whose tokens to delete
   * @returns Promise resolving to the count of deleted tokens
   */
  async deleteAllUserRefreshTokens(userId: number): Promise<number> {
    // Validate input parameter
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      throw new Error('User ID must be a positive number')
    }

    // Delete all tokens for the user
    const deleteResult = await this.prismaService.refreshToken.deleteMany({
      where: {
        userId,
      },
    })

    return deleteResult.count
  }

  /**
   * Updates a specific device record.
   *
   * @param deviceId - The ID of the device to update
   * @param data - The data to update the device with
   * @returns Promise resolving to the updated device data
   */
  async udpateDevice(deviceId: number, data: Partial<DeviceType>) {
    return await this.prismaService.device.update({
      where: {
        id: deviceId,
      },
      data,
    })
  }
}
