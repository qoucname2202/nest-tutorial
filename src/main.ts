import { NestFactory, Reflector } from '@nestjs/core'
import { AppModule } from './app.module'
import { envConfig } from './shared/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('/api/v1')

  await app.listen(envConfig.port ?? 3000)
}
bootstrap()
