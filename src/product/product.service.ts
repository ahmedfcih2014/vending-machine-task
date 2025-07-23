import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Product } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductReqDto } from 'src/product/dto/product-req.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: ProductReqDto) {
    await this.prisma.product.create({
      data: createProductDto,
    });

    return 'Product created successfully';
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const products = await this.prisma.product.findMany({
      skip,
      take: limit,
      orderBy: { id: 'asc' },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    const total = await this.prisma.product.count();

    return {
      data: products,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    return product;
  }

  async findByIds(id: number[]): Promise<Product[]> {
    return await this.prisma.product.findMany({
      where: { id: { in: id } },
    });
  }

  async bulkDecrementAmountAvailableTx(
    tx: Prisma.TransactionClient,
    products: { id: number; decrementedAmt: number }[],
    productsData: Product[],
  ) {
    const decrementMap = products.reduce(
      (acc, curr) => {
        acc[curr.id] = curr.decrementedAmt;
        return acc;
      },
      {} as Record<number, number>,
    );

    if (products.length !== productsData.length) {
      throw new NotFoundException('Some products not found');
    }

    for (const p of productsData) {
      const requestedAmt = decrementMap[p.id];
      if (p.amountAvailable < requestedAmt) {
        throw new ForbiddenException(
          `Insufficient stock for product ID ${p.id}`,
        );
      }
    }

    await Promise.all(
      products.map((p) =>
        tx.product.update({
          where: { id: p.id },
          data: { amountAvailable: { decrement: p.decrementedAmt } },
        }),
      ),
    );
  }

  async update(id: number, dto: ProductReqDto) {
    // hint, here we can handle the sellerId in the select exists query first,
    // but for demonstration the authorization and product ownership
    const existing = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Product not found');

    if (existing.sellerId !== dto.sellerId) {
      throw new ForbiddenException('You are not allowed to edit this product');
    }

    await this.prisma.product.update({
      where: { id },
      data: dto,
    });

    return 'Product updated successfully';
  }

  async remove(id: number, sellerId: number) {
    // hint, here we can handle the sellerId in the select exists query first,
    // but for demonstration the authorization and product ownership
    const existing = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Product not found');

    if (existing.sellerId !== sellerId) {
      throw new ForbiddenException('You are not allowed to edit this product');
    }

    await this.prisma.product.delete({ where: { id } });

    return 'Product deleted successfully';
  }
}
