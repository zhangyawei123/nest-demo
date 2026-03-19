"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const user_service_1 = require("../user/user.service");
const captcha_service_1 = require("./captcha.service");
let AuthService = class AuthService {
    userService;
    jwtService;
    captchaService;
    constructor(userService, jwtService, captchaService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.captchaService = captchaService;
    }
    async register(createUserDto) {
        const user = await this.userService.create(createUserDto);
        const { password, ...result } = user;
        return result;
    }
    async login(loginUserDto) {
        const isCaptchaValid = this.captchaService.verify(loginUserDto.captchaId, loginUserDto.captchaCode);
        if (!isCaptchaValid) {
            throw new common_1.UnauthorizedException('验证码错误或已过期，请重新获取');
        }
        const user = await this.userService.findByUsername(loginUserDto.username);
        if (!user) {
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        const isPasswordValid = await this.userService.validatePassword(loginUserDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        const payload = { sub: user.id, username: user.username };
        const access_token = await this.jwtService.signAsync(payload);
        return {
            access_token,
            user: {
                id: user.id,
                username: user.username,
            },
        };
    }
    async validateUser(userId) {
        return this.userService.findById(userId);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService,
        captcha_service_1.CaptchaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map