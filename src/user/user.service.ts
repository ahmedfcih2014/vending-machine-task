import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from 'generated/prisma';
import { UserReqDto } from 'src/user/dto/user-req.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserResDto } from 'src/user/dto/user-res.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(dto: UserReqDto) {
    try {
      const hashedPassword = await this.hashPassword(dto.password);

      await this.prisma.user.create({
        data: {
          ...dto,
          password: hashedPassword,
        },
      });
      return 'user created successfully';
    } catch (error) {
      if (this.isUniqueConstraintError(error, 'username')) {
        throw new ConflictException('Username already exists');
      }
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        username: true,
        role: true,
        deposit: true,
      },
    });

    const total = await this.prisma.user.count();
    return {
      data: users.map((u: User) => UserResDto.from(u)),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return UserResDto.from(user);
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, dto: UserReqDto) {
    try {
      const data: Prisma.UserUpdateInput = { ...dto };

      if (dto.password) {
        data.password = await this.hashPassword(dto.password);
      }

      await this.prisma.user.update({
        where: { id },
        data,
      });

      return 'user updated successfully';
    } catch (error) {
      if (this.isUniqueConstraintError(error, 'username')) {
        throw new ConflictException('Username already exists');
      } else if (this.isNotFoundError(error)) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return 'user deleted successfully';
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private isUniqueConstraintError(error: any, field: string): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      (error.meta?.target as string[]).includes(field)
    );
  }

  private isNotFoundError(error: any): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }
}
