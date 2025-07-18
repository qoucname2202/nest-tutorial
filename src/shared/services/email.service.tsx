import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import { envConfig } from '../config'
import OTPEmail from 'emails/otp'
import * as React from 'react'

@Injectable()
export class EmailService {
  private resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.resendApiKey)
  }

  sendOTPEmail(payload: { email: string; code: string }) {
    const subject = 'Your OTP Code'
    return this.resend.emails.send({
      from: `Online Movie Platform <onboarding@resend.dev>`,
      to: 'duongquocnam224400@gmail.com',
      subject,
      react: <OTPEmail code={payload.code} title={subject} />,
    })
  }
}
