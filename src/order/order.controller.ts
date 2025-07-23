import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { User } from 'generated/prisma';
import { BuyDto } from 'src/order/dto/buy.dto';
import { OrderService } from 'src/order/order.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { BuyerGuard } from 'src/shared/guards/buyer.guard';

@UseGuards(AuthGuard, BuyerGuard)
@Controller({
  path: 'order',
  version: '1',
})
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('buy')
  async buy(@Body() dto: BuyDto, @Req() req: Request) {
    dto.buyer = req['user'] as User;
    return this.orderService.buy(dto);
  }
}
