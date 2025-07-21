import { TypeVerifycationCode } from 'src/shared/constants/auth.constant'
import { UserSchema } from 'src/shared/models/shared-user.model.'
import { z } from 'zod'

// === Register schema ===
export const RegisterBodySchema = UserSchema.pick({
  email: true,
  name: true,
  password: true,
  phoneNumber: true,
})
  .extend({
    confirmPassword: z
      .string()
      .min(6, 'Confirm password must be at least 6 characters long')
      .max(100, 'Confirm password must be at most 100 characters long'),
    code: z.string().length(6, 'OTP code must be exactly 6 digits'),
  })
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Confirm password does not match password',
        path: ['confirmPassword'],
      })
    }
  })

// === Register Response Schema ===
export const RegisterResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
})

// === OTP Schema ===
export const VerificationCodeSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  code: z.string().length(6, 'OTP code must be exactly 6 digits'),
  type: z.enum([
    TypeVerifycationCode.REGISTER,
    TypeVerifycationCode.FORGOT_PASSWORD,
    TypeVerifycationCode.LOGIN,
    TypeVerifycationCode.DISABLE_2FA,
  ]),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const SendOTPBodySchema = VerificationCodeSchema.pick({
  email: true,
  type: true,
}).strict()

// === Login schema ===
export const LoginBodySchema = UserSchema.pick({
  email: true,
  password: true,
})
  .extend({
    totpCode: z.string().length(6, 'TOTP code must be exactly 6 digits').optional(), // 2FA code
    code: z.string().length(6, 'OTP code must be exactly 6 digits').optional(), // Email OTP code
  })
  .strict()
  .superRefine(({ totpCode, code }, ctx) => {
    if (totpCode !== undefined && code !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TOTP code or OTP code is required. Not provided both',
        path: ['totpCode'],
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TOTP code or OTP code is required. Not provided both',
        path: ['code'],
      })
    }
  })

export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

// === RefreshToken schema ===
export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z.string(),
  })
  .strict()

export const RefreshTokenResSchema = LoginResSchema

// === Forgot password schema ===
export const ForgotPasswordBodySchema = z
  .object({
    email: z.string().email(),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(100, 'Password must be at most 100 characters long'),
    confirmNewPassword: z
      .string()
      .min(6, 'Confirm password must be at least 6 characters long')
      .max(100, 'Confirm password must be at most 100 characters long'),
    code: z.string().length(6, 'OTP code must be exactly 6 digits'),
  })
  .strict()
  .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Confirm password does not match password',
        path: ['confirmPassword'],
      })
    }
  })

// === Device schema ===
export const DeviceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  userAgent: z.string(),
  ip: z.string(),
  lastActive: z.date(),
  createdAt: z.date(),
  isActive: z.boolean(),
})

// === Role schema ===
export const RoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// === RefreshToken schema ===
export const RefreshTokenSchema = z.object({
  token: z.string(),
  userId: z.number().positive(),
  deviceId: z.number().positive(),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const LogoutBodySchema = RefreshTokenBodySchema

// === Google Authentication State schema ===
export const GoogleAuthStateSchema = DeviceSchema.pick({
  userAgent: true,
  ip: true,
}).strict()

export const GetAuthorizationUrlResSchema = z.object({
  url: z.string().url(),
})

export const DisiableTwoFactorBodySchema = z
  .object({
    totpCode: z.string().length(6, 'OTP code must be exactly 6 digits').optional(),
    code: z.string().length(6, 'OTP code must be exactly 6 digits').optional(),
  })
  .strict()
  .superRefine(({ totpCode, code }, ctx) => {
    if ((totpCode !== undefined) === (code !== undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TOTP code or OTP code is required. Not provided both',
        path: ['totpCode'],
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TOTP code or OTP code is required. Not provided both',
        path: ['code'],
      })
    }
  })
export const TwoFactorSetupResSchema = z.object({
  secret: z.string(),
  uri: z.string(),
})

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>
export type RegisterResType = z.infer<typeof RegisterResSchema>
export type VerificationCodeType = z.infer<typeof VerificationCodeSchema>
export type SendOTPBodyType = z.infer<typeof SendOTPBodySchema>
export type LoginBodyType = z.infer<typeof LoginBodySchema>
export type LoginResType = z.infer<typeof LoginResSchema>
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>
export type RefreshTokenResType = LoginResType
export type DeviceType = z.infer<typeof DeviceSchema>
export type RoleType = z.infer<typeof RoleSchema>
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>
export type LogoutBodyType = RefreshTokenBodyType
export type GoogleAuthStateType = z.infer<typeof GoogleAuthStateSchema>
export type GetAuthorizationUrlResType = z.infer<typeof GetAuthorizationUrlResSchema>
export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>
export type DisiabkeTwoFactorBodyType = z.infer<typeof DisiableTwoFactorBodySchema>
export type TwoFactorSetupResType = z.infer<typeof TwoFactorSetupResSchema>
