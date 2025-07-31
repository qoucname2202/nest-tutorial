import { Logger } from '@nestjs/common'
import { config as loadDotenv } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

// Load .env file
const ENV_PATH = path.resolve('.env')
if (!fs.existsSync(ENV_PATH)) {
  Logger.error(`Configuration file "${ENV_PATH}" not found.`)
  process.exit(1)
}
loadDotenv({ path: ENV_PATH })

// Define allowed environments (for future use if needed)
export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
}

// Define the environment schema using Zod for validation
const EnvSchema = z.object({
  NODE_ENV: z.enum([Environment.Development, Environment.Production, Environment.Test, Environment.Provision]),
  PORT: z
    .string()
    .transform(Number)
    .refine((val) => !isNaN(val), {
      message: 'PORT must be a number',
    }),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),
  ACCESS_TOKEN_SECRET: z.string().min(10),
  REFRESH_TOKEN_SECRET: z.string().min(10),
  ACCESS_TOKEN_EXPIRATION: z.string(),
  REFRESH_TOKEN_EXPIRATION: z.string(),
  SALT_ROUNDS: z
    .string()
    .transform(Number)
    .refine((val) => !isNaN(val), {
      message: 'SALT_ROUNDS must be a number',
    }),
  SECRET_API_KEY: z.string().min(10),
  ADMIN_PASSWORD: z.string().min(8, { message: 'ADMIN_PASSWORD must be at least 8 characters long' }),
  ADMIN_EMAIL: z.string().email({ message: 'ADMIN_EMAIL must be a valid email address' }),
  ADMIN_NAME: z.string().min(1, { message: 'ADMIN_NAME must not be empty' }),
  ADMIN_PHONE: z.string().min(10, { message: 'ADMIN_PHONE must be at least 10 characters long' }),
  OTP_EXPIRES_IN: z.string().default('5m'),
  RESEND_API_KEY: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  GOOGLE_CLIENT_REDIRECT_URI: z.string(),
  APP_NAME: z.string(),
  TOTP_DIGITS: z.string().default('6'),
  TOTP_PERIOD: z.string().default('30'),
  PREFIX_URL: z.string().default('/api/v1'),
})

// Parse and validate process.env
const parsedEnv = EnvSchema.safeParse(process.env)

if (!parsedEnv.success) {
  Logger.error('❌ Invalid environment variables:', parsedEnv.error.format())
  process.exit(1)
}

// Convert the parsed and transformed environment variables into an exportable object
export const envConfig = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  accessTokenSecret: parsedEnv.data.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: parsedEnv.data.REFRESH_TOKEN_SECRET,
  accessTokenExpiration: parsedEnv.data.ACCESS_TOKEN_EXPIRATION,
  refreshTokenExpiration: parsedEnv.data.REFRESH_TOKEN_EXPIRATION,
  saltRounds: parsedEnv.data.SALT_ROUNDS,
  secretApiKey: parsedEnv.data.SECRET_API_KEY,
  adminPassword: parsedEnv.data.ADMIN_PASSWORD,
  adminEmail: parsedEnv.data.ADMIN_EMAIL,
  adminName: parsedEnv.data.ADMIN_NAME,
  adminPhone: parsedEnv.data.ADMIN_PHONE,
  otpExpiresIn: parsedEnv.data.OTP_EXPIRES_IN,
  resendApiKey: parsedEnv.data.RESEND_API_KEY,
  googleClientId: parsedEnv.data.GOOGLE_CLIENT_ID,
  googleClientSecret: parsedEnv.data.GOOGLE_CLIENT_SECRET,
  googleRedirectUrl: parsedEnv.data.GOOGLE_REDIRECT_URI,
  googleClientRedirectUri: parsedEnv.data.GOOGLE_CLIENT_REDIRECT_URI,
  appName: parsedEnv.data.APP_NAME,
  totpDigits: parsedEnv.data.TOTP_DIGITS,
  totpPeriod: parsedEnv.data.TOTP_PERIOD,
  prefixUrl: parsedEnv.data.PREFIX_URL,
}
