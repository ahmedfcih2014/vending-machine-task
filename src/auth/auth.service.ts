import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UserResDto } from 'src/user/dto/user-res.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.userService.findByUsername(username);
    const validPass = await bcrypt.compare(pass, user.password);
    if (!validPass) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async getUserFromToken(token: string): Promise<UserResDto> {
    try {
      const payload: { sub: number; username: string } =
        await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>('JWT_SECRET_KEY'),
        });
      return this.userService.findOne(payload.sub);
    } catch {
      throw new UnauthorizedException();
    }
  }
}
