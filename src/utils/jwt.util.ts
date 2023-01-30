import { JwtService } from '@nestjs/jwt';
import { UserModel } from '../modules/user/models/user.model';
import { TokenTypeEnum } from './token.type.enum';
import { Injectable } from '@nestjs/common';
import { BlockModel } from '../modules/block/models/block.model';
import mainConf from "../confs/main.conf";

@Injectable()
export class JwtUtil {
  constructor(private jwtService: JwtService) {}

  public verify(token: string) {
    return this.jwtService.verify(token, { secret: mainConf.jwtConstants.secret });
  }

  public signAdmin(user: UserModel): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        isAdmin: user.isAdmin,
        tokenType: TokenTypeEnum.ADMIN,
      },
      { expiresIn: '30d' },
    );
  }

  public signBlock(block: BlockModel, week: number): string {
    return this.jwtService.sign({
      tokenType: TokenTypeEnum.BLOCK,
      blockId: block.id,
      companyId: block.company_id,
      week,
    });
  }

  public signUserBlock(
    user: UserModel,
    week: number,
    block: BlockModel,
  ): string {
    return this.jwtService.sign({
      sub: user.id,
      tokenType: TokenTypeEnum.USER_BLOCK,
      blockId: block.id,
      companyId: block.company_id,
      week,
    });
  }

  public signUser(user: UserModel): string {
    return this.jwtService.sign({
      sub: user.id,
      tokenType: TokenTypeEnum.DASHBOARD,
    });
  }
}
