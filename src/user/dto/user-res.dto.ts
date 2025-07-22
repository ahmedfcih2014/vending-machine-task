import { User } from 'generated/prisma';

export class UserResDto {
  id: number;
  username: string;
  role: string;
  deposit: number;

  static from(user: User): UserResDto {
    const dto = new UserResDto();
    dto.id = user.id;
    dto.username = user.username;
    dto.role = user.role;
    dto.deposit = user.deposit;
    return dto;
  }
}
