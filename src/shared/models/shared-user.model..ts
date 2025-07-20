import { z } from 'zod'
import { UserStatus } from '../constants/auth.constant'

// === User schema ===
export const UserSchema = z.object({
  id: z.number(),
  email: z.string({ message: 'Error.InvalidEmail' }).email({ message: 'Error.InvalidEmail' }),
  name: z
    .string({ message: 'Error.InvalidName' })
    .min(1, { message: 'Error.InvalidNameMinLength' })
    .max(100, { message: 'Error.InvalidNameMaxLength' }),
  password: z
    .string({ message: 'Error.InvalidPassword' })
    .min(6, 'Error.InvalidPasswordMinLength')
    .max(100, 'Error.InvalidPasswordMaxLength'),
  phoneNumber: z
    .string({ message: 'Error.InvalidPhoneNumber' })
    .min(10, { message: 'Error.InvalidPhoneNumberMinLength' })
    .max(15, { message: 'Error.InvalidPhoneNumberMaxLength' }),
  avatar: z.string({ message: 'Error.InvalidAvatar' }).nullable(),
  totpSecret: z.string({ message: 'Error.InvalidTOTPSecret' }).nullable(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BLOCKED]),
  roleId: z.number({ message: 'Error.InvalidRoleId' }).positive(),
  createdById: z.number({ message: 'Error.InvalidCreatedById' }).nullable(),
  updatedById: z.number({ message: 'Error.InvalidUpdatedById' }).nullable(),
  deletedAt: z.date({ message: 'Error.InvalidDeletedAt' }).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type UserType = z.infer<typeof UserSchema>
