import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { TokenService } from '../services/token.service'
import { REQUEST_USER_KEY } from '../constants/auth.constant'
import { AccessTokenPayload } from '../@types/jwt.type'
import { PrismaService } from '../services/prisma.service'
import { stripPrefix } from '../helper'
import { HTTPMethod } from '../constants/role.constant'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    // Extract and validate the access token
    const decodedAccessToken = await this.extractAndValidateToken(request)

    // Checking user permission
    await this.validateUserPermission(decodedAccessToken, request)
    return true
  }

  private async validateUserPermission(decodedAccessToken: AccessTokenPayload, request: any): Promise<void> {
    const { roleId } = decodedAccessToken
    const path = stripPrefix(request.route.path)
    const method = request.method as keyof typeof HTTPMethod
    const role = await this.prismaService.role
      .findUniqueOrThrow({
        where: { id: roleId, deletedAt: null },
        include: {
          permissions: {
            where: { deletedAt: null, path, method },
          },
        },
      })
      .catch(() => {
        throw new ForbiddenException('Unauthorized')
      })
    const canAccess = role.permissions.length > 0
    if (!canAccess) {
      throw new ForbiddenException('Unauthorized')
    }
  }

  private async extractAndValidateToken(request: any): Promise<AccessTokenPayload> {
    const token = this.extractTokenFromHeader(request)
    try {
      const decodedAccessToken = await this.tokenService.verifyAccessToken(token)
      request[REQUEST_USER_KEY] = decodedAccessToken
      return decodedAccessToken
    } catch (error) {
      throw new UnauthorizedException('Invalid access token')
    }
  }

  private extractTokenFromHeader(request: any): string {
    const accessToken = request.headers.authorization?.split(' ')[1]
    if (!accessToken) {
      throw new UnauthorizedException('Access token is missing or malformed')
    }
    return accessToken
  }
}
