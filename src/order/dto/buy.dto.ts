import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { User } from 'generated/prisma';

export class BuyProductDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsInt()
  @IsNotEmpty()
  amount: number;
}

export class BuyDto {
  @IsNotEmpty()
  @IsArray({ each: true })
  @ValidateNested({ each: true })
  items: BuyProductDto[];

  @IsOptional()
  buyer: User;
}
