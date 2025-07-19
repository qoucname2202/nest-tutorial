import { Injectable } from '@nestjs/common'
import { google } from 'googleapis'
import { envConfig } from 'src/shared/config'
import { GoogleAuthStateType } from './auth.model'
import { AuthRepository } from './auth.repo'
import { HashingService } from 'src/shared/services/hashing.service'
import { RolesService } from './role.service'
import { v4 as uuidv4 } from 'uuid'
import { AuthService } from './auth.service'

@Injectable()
export class GoogleService {
  private oauth2Client
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly rolesService: RolesService,
    private readonly authService: AuthService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      envConfig.googleClientId,
      envConfig.googleClientSecret,
      envConfig.googleRedirectUrl,
    )
  }

  async getAuthorizationUrl({ userAgent, ip }: GoogleAuthStateType) {
    const scope = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']
    // Chuyển đổi Object sang string base64 an toàn lên URL
    const stateString = Buffer.from(JSON.stringify({ userAgent, ip })).toString('base64')

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope,
      include_granted_scopes: true,
      state: stateString,
    })

    return { url }
  }

  async googleCallback({ code, state }: { code: string; state: string }) {
    try {
      let userAgent = 'Unknown'
      let ip = 'Unknown'
      // Lấy state từ url
      try {
        if (state) {
          const clientInfo = JSON.parse(Buffer.from(state, 'base64').toString('utf8')) as GoogleAuthStateType
          userAgent = clientInfo.userAgent
          ip = clientInfo.ip
        }
      } catch (error) {
        console.error('Error parsing state:', error)
      }
      // Lấy token từ code
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)

      // Lấy thông tin google user
      const oauth2 = google.oauth2({
        auth: this.oauth2Client,
        version: 'v2',
      })

      const { data } = await oauth2.userinfo.get()
      if (!data.email) {
        throw new Error('Failed to get user info from google')
      }
      let user = await this.authRepository.findUniqueUserIncludeRole({ email: data.email })
      // Trong trường hợp này email có thể null
      // Mà nếu không có user thì ta sẽ tiến hành tạo người dùng mới, không cần xác thực OTP vì người ta sử dụng email thì email đó đã tồn tại rồi
      if (!user) {
        const clientRoleId = await this.rolesService.getClientRoleId()
        // Tại vì người dùng sử dụng google login nên ta sẽ sinh ngẫu nhiên mật khẩu cho họ
        const randomPassword = uuidv4()
        const hashedPassword = await this.hashingService.hashPassword(randomPassword)
        user = await this.authRepository.createUserInCludeRole({
          email: data.email,
          password: hashedPassword,
          name: data.name ?? '',
          phoneNumber: '',
          roleId: clientRoleId,
          avatar: data.picture ?? '',
        })
      }
      const device = await this.authRepository.createDevice({
        userId: user.id,
        userAgent: userAgent,
        ip: ip,
      })

      const authTokens = await this.authService.generateAccessAndRefreshToken({
        userId: user.id,
        email: user.email,
        deviceId: device.id,
        roleId: user.roleId,
        roleName: user.role.name,
      })
      return authTokens
    } catch (error) {
      console.error('Error exchanging code for tokens:', error)
      throw error
    }
  }
}
