import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) {
      throw new ForbiddenException('无管理员权限');
    }

    const user = await this.userService.findById(Number(userId));
    const isAdmin =
      user.username?.trim().toLowerCase() === 'admin' ||
      (user.roles || []).some((role) => role.name === 'admin');

    if (!isAdmin) {
      throw new ForbiddenException('无管理员权限');
    }

    return true;
  }
}
