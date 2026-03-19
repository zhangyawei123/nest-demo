import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginUserDto } from '../user/dto/login-user.dto';
export declare class AuthController {
    private authService;
    private captchaService;
    constructor(authService: AuthService, captchaService: CaptchaService);
    getCaptcha(): {
        captchaId: string;
        svg: string;
    };
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
    getProfile(req: any): any;
}
