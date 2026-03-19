# NestJS Demo - 简单的登录注册系统

这是一个简单的 NestJS 后端项目，包含数据库连接和用户认证功能（登录、注册）。

## 📚 项目结构

```
nest-demo/
├── src/
│   ├── auth/                    # 认证模块
│   │   ├── auth.controller.ts   # 认证控制器（登录、注册接口）
│   │   ├── auth.service.ts      # 认证服务（业务逻辑）
│   │   ├── auth.module.ts       # 认证模块定义
│   │   ├── jwt.strategy.ts      # JWT 认证策略
│   │   └── jwt-auth.guard.ts    # JWT 认证守卫
│   ├── user/                    # 用户模块
│   │   ├── user.entity.ts       # 用户实体（数据库表）
│   │   ├── user.service.ts      # 用户服务
│   │   ├── user.module.ts       # 用户模块定义
│   │   └── dto/                 # 数据传输对象
│   │       ├── create-user.dto.ts  # 注册参数
│   │       └── login-user.dto.ts   # 登录参数
│   ├── app.module.ts            # 根模块
│   └── main.ts                  # 应用入口
├── .env                         # 环境变量配置
└── package.json                 # 项目配置
```

## 🚀 快速开始

### 1. 环境要求
- Node.js 20+
- MySQL 数据库（已通过 Docker 启动）
- pnpm 包管理器

### 2. 数据库配置
数据库已自动创建：`nest_demo`
- 主机：127.0.0.1
- 端口：13307
- 用户名：root
- 密码：root

### 3. 启动项目
```bash
# 开发模式（已启动）
pnpm run start:dev

# 生产模式
pnpm run build
pnpm run start:prod
```

## 📡 API 接口

### 基础 URL
```
http://localhost:3000
```

### 1. 用户注册
```http
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "123456",
  "email": "test@example.com"
}
```

**响应示例：**
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "createdAt": "2026-03-14T08:14:32.000Z",
  "updatedAt": "2026-03-14T08:14:32.000Z"
}
```

### 2. 用户登录
```http
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "123456"
}
```

**响应示例：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

### 3. 获取当前用户信息（需要登录）
```http
GET /auth/profile
Authorization: Bearer <access_token>
```

**响应示例：**
```json
{
  "userId": 1,
  "username": "testuser",
  "email": "test@example.com"
}
```

## 🧪 测试接口

### 使用 curl 测试

**1. 注册用户**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456",
    "email": "test@example.com"
  }'
```

**2. 登录**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456"
  }'
```

**3. 获取用户信息（需要替换 TOKEN）**
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔑 核心概念讲解

### 1. Controller（控制器）
处理 HTTP 请求，定义路由和接口。

```typescript
@Controller('auth')  // 路由前缀：/auth
export class AuthController {
  @Post('login')     // POST /auth/login
  async login(@Body() dto: LoginUserDto) {
    return this.authService.login(dto);
  }
}
```

### 2. Service（服务）
处理业务逻辑，与数据库交互。

```typescript
@Injectable()
export class AuthService {
  async login(loginUserDto: LoginUserDto) {
    // 验证用户、生成 token
  }
}
```

### 3. DTO（数据传输对象）
定义接口参数和验证规则。

```typescript
export class LoginUserDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
```

### 4. Entity（实体）
定义数据库表结构。

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;
}
```

### 5. JWT 认证流程
1. 用户登录 → 验证密码 → 生成 JWT token
2. 前端保存 token
3. 访问受保护接口时，在请求头携带 token
4. 后端验证 token → 返回用户信息

## 🛠️ 技术栈

- **NestJS** - Node.js 后端框架
- **TypeORM** - ORM 框架（操作数据库）
- **MySQL** - 关系型数据库
- **JWT** - 身份认证
- **bcrypt** - 密码加密
- **class-validator** - 数据验证

## 📝 数据库表结构

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键，自增 |
| username | varchar(50) | 用户名，唯一 |
| password | varchar(255) | 密码（加密） |
| email | varchar(100) | 邮箱，唯一 |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |

## 🔒 安全特性

1. **密码加密**：使用 bcrypt 加密存储
2. **JWT 认证**：无状态的身份验证
3. **数据验证**：使用 class-validator 验证输入
4. **CORS 支持**：允许跨域请求

## 📖 学习建议

### 前端开发者学习路径
1. ✅ 理解 Controller（类似前端路由）
2. ✅ 理解 DTO（接口参数定义）
3. ✅ 理解 JWT 认证流程
4. ⭐ 理解 Service（业务逻辑层）
5. ⭐ 理解 Module（模块化）
6. 📚 了解 TypeORM（数据库操作）

### 推荐阅读顺序
```
main.ts → app.module.ts → auth.controller.ts → auth.service.ts → user.entity.ts
```

## 🐛 常见问题

### 1. 数据库连接失败
检查 `.env` 文件中的数据库配置是否正确。

### 2. Token 验证失败
确保请求头格式正确：`Authorization: Bearer <token>`

### 3. 参数验证失败
检查请求参数是否符合 DTO 定义的规则。

## 📚 相关文档

- [NestJS 官方文档](https://docs.nestjs.com/)
- [TypeORM 文档](https://typeorm.io/)
- [JWT 介绍](https://jwt.io/)

---

**项目已成功运行在：http://localhost:3000** 🎉
