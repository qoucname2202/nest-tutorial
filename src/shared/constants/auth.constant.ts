export const REQUEST_USER_KEY = 'user'
export const AUTH_HEADER = 'authorization'
export const BEARER_PREFIX = 'Bearer '
export const ALGORITHMS = 'HS512'
export const API_KEY_HEADER = 'x-api-key'
export const AUTH_TYPE_KEY = 'authType'

export const AuthTypes = {
  BEARER: 'Bearer',
  APIKey: 'ApiKey',
  NONE: 'None',
} as const

export type AuthTypeType = (typeof AuthTypes)[keyof typeof AuthTypes]

export const ConditionGuard = {
  AND: 'and',
  OR: 'or',
} as const

export type ConditionGuardType = (typeof ConditionGuard)[keyof typeof ConditionGuard]

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BLOCKED: 'BLOCKED',
} as const

export const TypeVerifycationCode = {
  REGISTER: 'REGISTER',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  LOGIN: 'LOGIN',
  DISABLE_2FA: 'DISABLE_2FA',
} as const

export type TypeVerifycationCodeType = (typeof TypeVerifycationCode)[keyof typeof TypeVerifycationCode]
