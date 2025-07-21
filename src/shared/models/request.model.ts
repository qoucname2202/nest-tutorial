import z from 'zod'

export const emptyBodySchema = z.object({})

export type EmptyBodyType = z.infer<typeof emptyBodySchema>
