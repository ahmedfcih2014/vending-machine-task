import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { User } from 'generated/prisma';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { BuyerGuard } from 'src/shared/guards/buyer.guard';
import { DepositService } from 'src/user/deposit.service';
import { DepositDto } from 'src/user/dto/deposit.dto';

@UseGuards(AuthGuard, BuyerGuard)
@Controller({
  path: 'deposit',
  version: '1',
})
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Post()
  async deposit(@Body() dto: DepositDto, @Req() req: Request) {
    const buyerId = (req['user'] as User).id;
    return this.depositService.deposit(buyerId, dto);
  }

  @Post('reset')
  async reset(@Req() req: Request) {
    const buyerId = (req['user'] as User).id;
    return this.depositService.reset(buyerId);
  }
}
