import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { RolesService } from './role.service'
import { AuthRepository } from './auth.repo'

@Module({
  controllers: [AuthController],
  providers: [AuthService, RolesService, AuthRepository],
})
export class AuthModule {}
