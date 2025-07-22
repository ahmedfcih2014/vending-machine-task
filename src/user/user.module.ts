import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DepositController } from './deposit.controller';
import { AuthModule } from 'src/auth/auth.module';
import { DepositService } from './deposit.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  providers: [UserService, DepositService],
  controllers: [UserController, DepositController],
  exports: [UserService],
})
export class UserModule {}
