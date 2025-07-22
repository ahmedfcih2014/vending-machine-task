import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from 'generated/prisma';

export class UserReqDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;
}
