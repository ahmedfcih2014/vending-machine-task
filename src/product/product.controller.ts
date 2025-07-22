import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from 'generated/prisma';
import { ProductReqDto } from 'src/product/dto/product-req.dto';
import { ProductService } from 'src/product/product.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { SellerGuard } from 'src/shared/guards/seller.guard';

@Controller({
  path: 'products',
  version: '1',
})
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(AuthGuard, SellerGuard)
  @Post()
  create(@Body() dto: ProductReqDto, @Req() req: Request) {
    dto.sellerId = (req['user'] as User).id;
    return this.productService.create(dto);
  }

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.productService.findAll(+page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @UseGuards(AuthGuard, SellerGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: ProductReqDto,
    @Req() req: Request,
  ) {
    dto.sellerId = (req['user'] as User).id;
    return this.productService.update(+id, dto);
  }

  @UseGuards(AuthGuard, SellerGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.productService.remove(+id, (req['user'] as User).id);
  }
}
