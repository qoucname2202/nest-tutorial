import { Controller, Post, Body, Ip, HttpCode, HttpStatus, Get, Query, Res } from '@nestjs/common'
import { AuthService } from './auth.service'
import {
  ForgotPasswordBodyDTO,
  GetAuthorizationUrlResDTO,
  LoginBodyDTO,
  LoginResDTO,
  LogoutBodyDTO,
  MessageResDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  SendOTPBodyDTO,
  TwoFactorSetupResDTO,
} from './dto/auth.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { UserAgent } from 'src/shared/decorator/user-agent.decorator'
import { IsPublic } from 'src/shared/decorator/auth.decorator'
import { GoogleService } from './google.service'
import { Response } from 'express'
import { envConfig } from 'src/shared/config'
import { EmptyBodyDTO } from 'src/shared/dto/request.dto'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  @Post('register')
  @IsPublic()
  @ZodSerializerDto(RegisterResDTO)
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body)
  }

  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    return await this.authService.sendOTP(body)
  }

  @Post('login')
  @IsPublic()
  @ZodSerializerDto(LoginResDTO)
  async login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.login({
      ...body,
      userAgent,
      ip,
    })
  }

  @Post('refresh-token')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(RefreshTokenResDTO)
  async refreshToken(@Body() body: RefreshTokenBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.refreshToken({
      ...body,
      userAgent,
      ip,
    })
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  async logout(@Body() body: LogoutBodyDTO) {
    return await this.authService.logout(body)
  }

  @Get('google-link')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetAuthorizationUrlResDTO)
  async getAuthorizationUrl(@UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.googleService.getAuthorizationUrl({ userAgent, ip })
  }

  @Get('google/callback')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    try {
      const { accessToken, refreshToken } = await this.googleService.googleCallback({ code, state })
      return res.redirect(
        `${envConfig.googleClientRedirectUri}?accessToken=${accessToken}&refreshToken=${refreshToken}`,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An error occurred while logging in with Google, Please try again with another method'
      return res.redirect(`${envConfig.googleClientRedirectUri}?errorMessage=${message}`)
    }
  }

  @Post('forgot-password')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  async forgotPassword(@Body() body: ForgotPasswordBodyDTO) {
    return await this.authService.forgotPassword(body)
  }

  // Sử dụng POST mà không sử dụng GET
  // Vì POST mang ý nghĩa là tạo ra cái gì đó và POST cũng bảo mật hơn GET
  // Vì GET có thể được kích hoạt thông qua một URL trên trình duyệt còn POST thì nó đảm bảo tính bảo mật cao hơn
  @Post('2fa/setup')
  @ZodSerializerDto(TwoFactorSetupResDTO)
  async setupTwoFactorAuth(@Body() _: EmptyBodyDTO, @ActiveUser('userId') userId: number) {
    return await this.authService.setupTwoFactorAuth(userId)
  }
}
