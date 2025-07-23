import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product, User } from 'generated/prisma';
import { BuyDto } from 'src/order/dto/buy.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductService } from 'src/product/product.service';
import { DepositService } from 'src/user/deposit.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly depositService: DepositService,
    private readonly productService: ProductService,
  ) {}

  async buy(dto: BuyDto) {
    const buyer: User = dto.buyer;

    const itemIds = dto.items.map((i) => i.id);
    const products = await this.productService.findByIds(itemIds);

    // Build a map for quick access
    const productMap = new Map<number, Product>();
    products.forEach((p) => productMap.set(p.id, p));

    // Calculate total cost
    const totalSpent = dto.items.reduce((sum, item) => {
      const product = productMap.get(item.id);
      if (!product)
        throw new NotFoundException(`Product ID ${item.id} not found`);
      return sum + product.cost * item.amount;
    }, 0);

    if (buyer.deposit < totalSpent) {
      throw new BadRequestException('Insufficient buyer deposit (cents)');
    }

    const decrementedItems = dto.items.map((i) => ({
      id: i.id,
      decrementedAmt: i.amount,
    }));

    await this.prisma.$transaction(async (tx) => {
      await this.depositService.withdrawTx(tx, buyer.id, totalSpent);
      await this.productService.bulkDecrementAmountAvailableTx(
        tx,
        decrementedItems,
        products,
      );
    });

    // Build item summary for return
    const purchasedItems = dto.items.map((item) => {
      const product = productMap.get(item.id)!;
      return {
        id: product.id,
        productName: product.productName,
        quantityBought: item.amount,
      };
    });

    return {
      totalSpent,
      items: purchasedItems,
      remainingDeposit: buyer.deposit - totalSpent,
    };
  }
}
