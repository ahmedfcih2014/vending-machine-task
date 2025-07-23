import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { ProductModule } from 'src/product/product.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [UserModule, AuthModule, ProductModule, PrismaModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
