/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { existsSync } from 'fs';
import { join } from 'path';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtStrategy } from './jwt.strategy';
import { PasswordResetService } from './password-reset.service';
import { RefreshTokenService } from './refresh-token.service';
import { GoogleAuthService } from './google-auth.service';
import { AppleAuthService } from './apple-auth.service';
import { UserLocationService } from 'src/user-location/user-location.service';
import { UserLocation } from 'src/user-location/entities/user-location.entity';

const resolveTemplatesDir = (): string => {
  const candidates = [
    join(process.cwd(), 'dist', 'src', 'auth', 'templates'),
    join(process.cwd(), 'dist', 'auth', 'templates'),
    join(__dirname, 'templates'),
    join(__dirname, '..', 'auth', 'templates'),
    join(process.cwd(), 'src', 'auth', 'templates'),
  ];

  return (
    candidates.find((candidate) => existsSync(candidate)) ??
    join(process.cwd(), 'src', 'auth', 'templates')
  );
};

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken, PasswordResetToken, UserLocation]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const templatesDir = resolveTemplatesDir();

        return {
          transport: {
            host: config.get('SMTP_HOST'),
            port: config.get('SMTP_PORT'),
            secure: config.get('SMTP_SECURE') === 'true', // true for 465, false for other ports
            auth: {
              user: config.get('SMTP_USER'),
              pass: config.get('SMTP_PASS'),
            },
          },
          defaults: {
            from: `"${config.get('FROM_NAME') || 'Solo Crest Team'}" <${config.get('FROM_EMAIL') || config.get('SMTP_USER')}>`,
          },
          template: {
            dir: templatesDir,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: false, // Set to false to prevent errors if template not found; allows fallback
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenService,
    PasswordResetService,
    EmailService,
    JwtStrategy,
    GoogleAuthService,
    AppleAuthService,
    UserLocationService
  ],
  exports: [AuthService, JwtModule, JwtStrategy, EmailService, GoogleAuthService, AppleAuthService],
})
export class AuthModule { }
