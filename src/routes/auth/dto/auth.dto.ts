import { GetAuthorizationUrlResSchema, GoogleAuthStateSchema, LogoutBodySchema } from './../auth.model'
import { createZodDto } from 'nestjs-zod'
import {
  DeviceSchema,
  LoginBodySchema,
  LoginResSchema,
  RefreshTokenBodySchema,
  RefreshTokenResSchema,
  RegisterBodySchema,
  RegisterResSchema,
  SendOTPBodySchema,
} from '../auth.model'
import { MessageResSchema } from 'src/shared/models/response.model'

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}

export class RegisterResDTO extends createZodDto(RegisterResSchema) {}

export class SendOTPBodyDTO extends createZodDto(SendOTPBodySchema) {}

export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}

export class LoginResDTO extends createZodDto(LoginResSchema) {}

export class RefreshTokenBodyDTO extends createZodDto(RefreshTokenBodySchema) {}

export class RefreshTokenResDTO extends createZodDto(RefreshTokenResSchema) {}

export class DeviceType extends createZodDto(DeviceSchema) {}

export class MessageResDTO extends createZodDto(MessageResSchema) {}

export class LogoutBodyDTO extends createZodDto(LogoutBodySchema) {}

export class GoogleAuthStateDTO extends createZodDto(GoogleAuthStateSchema) {}

export class GetAuthorizationUrlResDTO extends createZodDto(GetAuthorizationUrlResSchema) {}
