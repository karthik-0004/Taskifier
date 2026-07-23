import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { JwtStrategy } from './jwt.strategy';
import { GithubOauthController } from './github-oauth.controller';
import { GithubOauthService } from './github-oauth.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '15m' },
      }),
    }),
    EmailModule,
  ],
  controllers: [AuthController, GithubOauthController],
  providers: [AuthService, PasswordService, JwtStrategy, GithubOauthService],
  exports: [AuthService, PasswordService, JwtModule, PassportModule],
})
export class AuthModule {}
