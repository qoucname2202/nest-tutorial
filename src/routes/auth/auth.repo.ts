import { Injectable } from '@nestjs/common'
import { UserType } from 'src/shared/models/shared-user.model.'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RoleType, VerificationCodeType } from './auth.model'
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
}
