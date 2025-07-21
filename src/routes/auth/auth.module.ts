import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { RolesService } from './role.service'
import { AuthRepository } from './auth.repo'
import { GoogleService } from './google.service'
import { TwoFactorAuthService } from 'src/shared/services/2fa.service'

@Module({
  controllers: [AuthController],
  providers: [AuthService, RolesService, AuthRepository, GoogleService, TwoFactorAuthService],
})
export class AuthModule {}
