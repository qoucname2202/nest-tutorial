import { ConflictException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helper'
import { RolesService } from './role.service'
import { LoginBodyType, RefreshTokenBodyType, RegisterBodyType, SendOTPBodyType } from './auth.model'
import { AuthRepository } from './auth.repo'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { addMilliseconds } from 'date-fns'
import ms from 'ms'
import { envConfig } from 'src/shared/config'
import { TypeVerifycationCode } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { AccessTokenDto } from 'src/shared/dto/jwt.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly shareUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
  ) {}

  async register(createAuthDto: RegisterBodyType) {
    try {
      // Checking verification code
      const verifycationCode = await this.authRepository.findVerificationCodeByEmailAndType({
        email: createAuthDto.email,
        code: createAuthDto.code,
        type: TypeVerifycationCode.REGISTER,
      })

      if (!verifycationCode) {
        throw new UnprocessableEntityException([
          {
            message: `Verification code for email ${createAuthDto.email} not found or invalid.`,
            path: 'code',
          },
        ])
      }

      if (verifycationCode.expiresAt < new Date()) {
        throw new UnprocessableEntityException([
          {
            message: `Verification code for email ${createAuthDto.email} has expired.`,
            path: 'code',
          },
        ])
      }
      const clientRoleId = await this.rolesService.getClientRoleId()
      const { email, password, name, phoneNumber } = createAuthDto
      const hashedPassword = await this.hashingService.hashPassword(password)
      return await this.authRepository.createUser({
        email,
        password: hashedPassword,
        name,
        phoneNumber,
        roleId: clientRoleId,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new UnprocessableEntityException({
          message: `User with email ${createAuthDto.email} already exists.`,
          path: 'email',
        })
      }
      throw error
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    try {
      const user = await this.shareUserRepository.findUnique({ email: body.email })
      if (user) {
        throw new UnprocessableEntityException({
          message: `User with email ${body.email} already exists.`,
          path: 'email',
        })
      }
      const code = generateOTP()
      const expiresAt = addMilliseconds(new Date(), ms(envConfig.otpExpiresIn)) // 5 minutes expiration time
      const verificationCode = await this.authRepository.createVerificationCode({
        email: body.email,
        code,
        type: body.type,
        expiresAt,
      })

      const { error } = await this.emailService.sendOTPEmail({
        email: body.email,
        code,
      })

      if (error) {
        throw new UnprocessableEntityException({
          message: `Failed to send OTP to ${body.email}. Please try again later.`,
          path: 'code',
        })
      }

      return verificationCode
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException(`User with email ${body.email} not exists in systems.`)
      }
      throw error
    }
  }

  async generateAccessAndRefreshToken({ userId, deviceId, roleId, roleName, email }: AccessTokenDto) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        email,
        deviceId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({
        userId,
        email,
      }),
    ])

    const decodeRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)

    await this.authRepository.createRefreshToken({
      userId,
      token: refreshToken,
      expiresAt: new Date(decodeRefreshToken.exp * 1000),
      deviceId,
    })

    return {
      accessToken,
      refreshToken,
    }
  }

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    try {
      const user = await this.authRepository.findUniqueUserIncludeRole({ email: body.email })

      if (!user) {
        throw new UnprocessableEntityException([
          {
            message: 'Email is not exist',
            path: 'email',
          },
        ])
      }

      const isPasswordValid = await this.hashingService.comparePassword(body.password, user.password)
      if (!isPasswordValid) {
        throw new UnprocessableEntityException([
          {
            message: 'Password is incorrect',
            field: 'password',
          },
        ])
      }

      const device = await this.authRepository.createDevice({
        userId: user.id,
        userAgent: body.userAgent,
        ip: body.ip,
      })

      const tokens = await this.generateAccessAndRefreshToken({
        userId: user.id,
        email: user.email,
        deviceId: device.id,
        roleId: user.roleId,
        roleName: user.role.name,
      })

      return tokens
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException(`User with email ${body.email} already exists.`)
      }
      throw error
    }
  }

  async refreshToken({ refreshToken, userAgent, ip }: RefreshTokenBodyType & { userAgent: string; ip: string }) {
    try {
      //1. Kiểm tra refresh-token có hợp lệ hay không
      const { userId, email } = await this.tokenService.verifyRefreshToken(refreshToken)

      //2. Kiểm tra token có tồn tại trong DB hay không
      const refreshTokenInDb = await this.authRepository.findUniqueRefreshTokenIncludeUserRole(refreshToken)
      if (!refreshTokenInDb) {
        throw new UnauthorizedException('Refresh token has been revoked or does not exist')
      }
      //3. Cập nhật lại thiết bị
      const {
        deviceId,
        user: {
          roleId,
          role: { name: roleName },
        },
      } = refreshTokenInDb
      const $updateDevice = this.authRepository.udpateDevice(deviceId, {
        userAgent,
        ip,
        lastActive: new Date(),
      })

      //4. Xoá refresh token cũ
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken(refreshToken)

      //5. Sinh accesstoken và refreshtoken mới
      const newTokens = this.generateAccessAndRefreshToken({
        userId: +userId,
        email,
        deviceId,
        roleId,
        roleName,
      })

      const [, , tokens] = await Promise.all([$updateDevice, $deleteRefreshToken, newTokens])
      return tokens
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new UnauthorizedException()
    }
  }

  async logout({ refreshToken }: RefreshTokenBodyType): Promise<{ message: string }> {
    try {
      //1. Kiểm tra refresh-token có hợp lệ hay không
      await this.tokenService.verifyRefreshToken(refreshToken)

      //2. Xoá refresh token cũ
      const $deleteRefreshToken = await this.authRepository.deleteRefreshToken(refreshToken)

      //3. Cập nhật lại trạng thái của thiết bị
      await this.authRepository.udpateDevice($deleteRefreshToken.deviceId, {
        isActive: false,
      })
      return { message: 'Logout successfuly' }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token has been revoked or does not exist')
      }
      throw new UnauthorizedException()
    }
  }
}
