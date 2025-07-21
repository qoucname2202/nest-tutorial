import { Injectable, UnauthorizedException } from '@nestjs/common'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helper'
import { RolesService } from './role.service'
import {
  ForgotPasswordBodyType,
  LoginBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOTPBodyType,
} from './auth.model'
import { AuthRepository } from './auth.repo'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { addMilliseconds } from 'date-fns'
import ms from 'ms'
import { envConfig } from 'src/shared/config'
import { TypeVerifycationCode, TypeVerifycationCodeType } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { AccessTokenDto } from 'src/shared/dto/jwt.dto'
import {
  EmailAlreadyExistsException,
  EmailNotExistsException,
  FailedToSendOTPException,
  InvalidOTPException,
  InvalidOTPExpiredExcepton,
  InvalidTOTPAndCodeException,
  InvalidTOTPException,
  PasswordIncorrectException,
  RefreshTokenRevokedException,
  TOTPAlreadyEnabledException,
} from './error.model'
import { TwoFactorAuthService } from 'src/shared/services/2fa.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly shareUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  async validateVerificationCode({
    email,
    code,
    type,
  }: {
    email: string
    code: string
    type: TypeVerifycationCodeType
  }) {
    const verifycationCode = await this.authRepository.findVerificationCodeByEmailAndType({
      email_code_type: {
        email,
        code,
        type,
      },
    })

    if (!verifycationCode) {
      throw InvalidOTPException
    }

    if (verifycationCode.expiresAt < new Date()) {
      throw InvalidOTPExpiredExcepton
    }
    return verifycationCode
  }

  async register(body: RegisterBodyType) {
    try {
      await this.validateVerificationCode({
        email: body.email,
        code: body.code,
        type: TypeVerifycationCode.REGISTER,
      })
      const clientRoleId = await this.rolesService.getClientRoleId()
      const { email, password, name, phoneNumber } = body
      const hashedPassword = await this.hashingService.hashPassword(password)
      const [user] = await Promise.all([
        this.authRepository.createUser({
          email,
          password: hashedPassword,
          name,
          phoneNumber,
          roleId: clientRoleId,
        }),
        this.authRepository.deleteVerificationCode({
          email_code_type: {
            email: body.email,
            code: body.code,
            type: TypeVerifycationCode.REGISTER,
          },
        }),
      ])
      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw EmailAlreadyExistsException
      }
      throw error
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    try {
      const user = await this.shareUserRepository.findUnique({ email: body.email })
      if (body.type === TypeVerifycationCode.REGISTER && user) {
        throw EmailAlreadyExistsException
      }

      if (body.type === TypeVerifycationCode.FORGOT_PASSWORD && !user) {
        throw EmailNotExistsException
      }

      const code = generateOTP()
      const expiresAt = addMilliseconds(new Date(), ms(envConfig.otpExpiresIn))
      await this.authRepository.createVerificationCode({
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
        throw FailedToSendOTPException
      }

      return {
        message: 'Send OTP successfully',
      }
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw EmailAlreadyExistsException
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
      // 1. Kiểm tra người dùng có tồn tại trong hệ thống hay không
      const user = await this.authRepository.findUniqueUserIncludeRole({ email: body.email })

      if (!user) {
        throw EmailNotExistsException
      }

      const isPasswordValid = await this.hashingService.comparePassword(body.password, user.password)
      if (!isPasswordValid) {
        throw PasswordIncorrectException
      }

      // 2. Trường hợp người dùng đã bật mã 2FA mà không truyền TOTPCode hoặc OTPCode
      if (user.totpSecret) {
        if (!body.code && !body.totpCode) {
          throw InvalidTOTPAndCodeException
        }
        // Kiểm tra TOTP có hợp lệ không
        if (body.totpCode) {
          const isTOTPValid = this.twoFactorAuthService.verifyTOTP({
            token: body.totpCode,
            email: user.email,
            secret: user.totpSecret,
          })
          if (!isTOTPValid) {
            throw InvalidTOTPException
          }
        } else if (body.code) {
          // Kiểm tra OTP có hợp lệ không
          await this.validateVerificationCode({
            email: body.email,
            code: body.code,
            type: TypeVerifycationCode.LOGIN,
          })
        }
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
        throw EmailAlreadyExistsException
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
        throw RefreshTokenRevokedException
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
        throw RefreshTokenRevokedException
      }
      throw new UnauthorizedException()
    }
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    try {
      // 1. Kiểm tra email có tồn tại trong hệ thống hay không
      const user = await this.shareUserRepository.findUnique({ email: body.email })
      if (!user) {
        throw EmailNotExistsException
      }

      //2. Kiểm tra OTP có hợp lệ hay không
      await this.validateVerificationCode({
        email: body.email,
        code: body.code,
        type: TypeVerifycationCode.FORGOT_PASSWORD,
      })

      //3. Cập nhật lại mật khẩu
      const hashedPassword = await this.hashingService.hashPassword(body.newPassword)

      await Promise.all([
        this.authRepository.updateUser(
          { email: body.email },
          {
            password: hashedPassword,
          },
        ),
        this.authRepository.deleteVerificationCode({
          email_code_type: {
            email: body.email,
            code: body.code,
            type: TypeVerifycationCode.FORGOT_PASSWORD,
          },
        }),
      ])
      return { message: 'Change password successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw EmailNotExistsException
      }
      throw error
    }
  }

  async setupTwoFactorAuth(userId: number) {
    // 1. Kiểm tra user có tồn tại hay không
    const user = await this.shareUserRepository.findUnique({ id: userId })
    if (!user) {
      throw EmailNotExistsException
    }
    if (user.totpSecret) {
      throw TOTPAlreadyEnabledException
    }
    // 2. Tạo secret key và uri
    const { secret, uri } = this.twoFactorAuthService.generateTOTPService(user.email)

    // 3. Cập nhật mã totp vào thông tin user
    await this.authRepository.updateUser(
      { id: userId },
      {
        totpSecret: secret,
      },
    )
    // 4. Trả về secret key và url
    return { secret, uri }
  }
}
