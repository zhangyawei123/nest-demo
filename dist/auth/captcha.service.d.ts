export declare class CaptchaService {
    private readonly store;
    private readonly TTL;
    generate(): {
        captchaId: string;
        svg: string;
    };
    verify(captchaId: string, inputCode: string): boolean;
}
