import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CaptchaService } from './captcha.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginUserDto } from '../user/dto/login-user.dto';
export declare class AuthService {
    private userService;
    private jwtService;
    private captchaService;
    constructor(userService: UserService, jwtService: JwtService, captchaService: CaptchaService);
    register(createUserDto: CreateUserDto): Promise<{
        id: number;
        username: string;
        roles: import("../role/role.entity").Role[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(loginUserDto: LoginUserDto): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
        };
    }>;
    validateUser(userId: number): Promise<import("../user/user.entity").User>;
}
