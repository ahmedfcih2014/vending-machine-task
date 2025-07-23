import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
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

  async withdrawTx(
    tx: Prisma.TransactionClient,
    buyerId: number,
    cents: number,
  ) {
    const user = await tx.user.findUnique({ where: { id: buyerId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.deposit < cents) {
      throw new BadRequestException('Insufficient deposit');
    }

    await tx.user.update({
      where: { id: buyerId },
      data: {
        deposit: { decrement: cents },
      },
    });
  }
}
