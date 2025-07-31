import z from 'zod'
import { HTTPMethod } from '../constants/role.constant'

export const PermissionSchema = z.object({
  id: z.number().int().positive({ message: 'Permission ID must be a positive integer' }),
  name: z
    .string({ message: 'Permission name is required' })
    .min(1, { message: 'Permission name must not be empty' })
    .max(500, { message: 'Permission name must be at most 500 characters long' }),
  description: z
    .string({ message: 'Permission description is required' })
    .min(1, { message: 'Permission description must not be empty' }),
  path: z
    .string({ message: 'Permission path is required' })
    .min(1, { message: 'Permission path must not be empty' })
    .max(1000, { message: 'Permission path must be at most 1000 characters long' })
    .regex(/^\/.*/, { message: 'Permission path must start with a forward slash (/)' }),
  module: z
    .string({ message: 'Permission module is required' })
    .min(1, { message: 'Permission module must not be empty' })
    .max(500, { message: 'Permission module must be at most 500 characters long' }),
  method: z.enum([
    HTTPMethod.GET,
    HTTPMethod.POST,
    HTTPMethod.PUT,
    HTTPMethod.DELETE,
    HTTPMethod.PATCH,
    HTTPMethod.OPTIONS,
    HTTPMethod.HEAD,
  ]),
  createdById: z.number().int().positive().nullable(),
  updatedById: z.number().int().positive().nullable(),
  deletedById: z.number().int().positive().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
