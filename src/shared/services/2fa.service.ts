import { Injectable } from '@nestjs/common'
import * as OTPAuth from 'otpauth'
import { envConfig } from '../config'
@Injectable()
export class TwoFactorAuthService {
  private createTOTP(email: string, secret?: string) {
    return new OTPAuth.TOTP({
      issuer: envConfig.appName,
      label: email,
      algorithm: 'SHA1',
      digits: +envConfig.totpDigits,
      period: +envConfig.totpPeriod,
      secret: secret || new OTPAuth.Secret(),
    })
  }

  generateTOTPService(email: string) {
    const totp = this.createTOTP(email)
    return {
      secret: totp.secret.base32,
      uri: totp.toString(),
    }
  }

  verifyTOTP({ token, email, secret }: { token: string; email: string; secret: string }) {
    const totp = this.createTOTP(email, secret)
    // window số lượng khoảng thời gian được coi là hợp lệ
    const delta = totp.validate({ token, window: 1 })
    return delta !== null
  }
}
