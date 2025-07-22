import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DepositDto } from 'src/user/dto/deposit.dto';

@Injectable()
export class DepositService {
  constructor(private readonly prisma: PrismaService) {}

  async deposit(buyerId: number, dto: DepositDto) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: buyerId },
        data: { deposit: { increment: dto.cents } },
      }),
    ]);

    return `Deposit ${dto.cents} successful`;
  }

  async reset(buyerId: number) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: buyerId },
        data: { deposit: 0 },
      }),
    ]);

    return `Your deposit reseted to 0 successful`;
  }
}
