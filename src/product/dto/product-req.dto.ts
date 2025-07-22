import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class ProductReqDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsInt()
  @Min(0)
  amountAvailable: number;

  @IsInt()
  @Min(1)
  cost: number;

  @IsOptional()
  sellerId: number;
}
