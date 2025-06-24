import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import appConfig from 'src/config/app.config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule, 
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: appConfig().jwt.secret,
      signOptions: { expiresIn: appConfig().jwt.expiry },
    }),
    PrismaModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, AuthService],
  exports: [AuthService, OrderService],
})
export class OrderModule {}
