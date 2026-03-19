"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaptchaService = void 0;
const common_1 = require("@nestjs/common");
const svgCaptcha = __importStar(require("svg-captcha"));
let CaptchaService = class CaptchaService {
    store = new Map();
    TTL = 5 * 60 * 1000;
    generate() {
        const captcha = svgCaptcha.create({
            size: 4,
            noise: 0,
            color: true,
            background: '#f0f0f0',
            width: 120,
            height: 40,
            fontSize: 40,
            ignoreChars: '0oO1lIi',
        });
        const captchaId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        this.store.set(captchaId, {
            text: captcha.text.toLowerCase(),
            expireAt: Date.now() + this.TTL,
        });
        setTimeout(() => this.store.delete(captchaId), this.TTL + 1000);
        return { captchaId, svg: captcha.data };
    }
    verify(captchaId, inputCode) {
        const record = this.store.get(captchaId);
        if (!record || Date.now() > record.expireAt) {
            this.store.delete(captchaId);
            return false;
        }
        this.store.delete(captchaId);
        return record.text === inputCode.toLowerCase();
    }
};
exports.CaptchaService = CaptchaService;
exports.CaptchaService = CaptchaService = __decorate([
    (0, common_1.Injectable)()
], CaptchaService);
//# sourceMappingURL=captcha.service.js.map