/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { BaseResponseDto } from '../common/dto/base-response.dto';
import { StatusEnum } from '../common/enums/status.enum';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { PasswordResetService } from './password-reset.service';
import { RefreshTokenService } from './refresh-token.service';
import { EmailService } from './email.service';
// Import UserStatus enum (adjust the path as needed)

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private passwordResetService: PasswordResetService,
    private emailService: EmailService,
  ) { }

  private signAccessToken(user: { id: string; email: string; role: string }) {
    return this.jwtService.sign({
      email: user.email,
      sub: user.id,
      role: user.role,
    });
  }

  async register(createUserDto: CreateUserDto) {
    // UsersService.create already hashes the password.
    // Pass the DTO directly to avoid double-hashing.
    const existingUser = await this.usersService.findByEmailOrPhoneNumberOrUserName(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
    const existingUserByUserName = await this.usersService.findByEmailOrPhoneNumberOrUserName(createUserDto.user_name);
    if (existingUserByUserName) {
      throw new BadRequestException('Username already exists');
    }
    const existingUserByPhoneNo = await this.usersService.findByEmailOrPhoneNumberOrUserName(createUserDto.phone_no);
    if (existingUserByPhoneNo) {
      throw new BadRequestException('Phone number already exists');
    }
    const user = await this.usersService.create(createUserDto);
    const { password, ...result } = user;

    void this.emailService.sendWelcomeEmail(user.email, user.name).catch((error) => {
      this.logger.error(`Welcome email failed for user ${user.id}`, error);
    });

    return new BaseResponseDto(result, 'User registered successfully');
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailOrPhoneNumberOrUserName(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Import UserStatus enum from the appropriate location
    if (user.status !== StatusEnum.active) {
      throw new UnauthorizedException('User account is inactive');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.signAccessToken(user);
    const refreshToken =
      await this.refreshTokenService.generateRefreshToken(user);

    const { password: _, ...userWithoutPassword } = user;

    return new BaseResponseDto(
      {
        user: {
          ...userWithoutPassword,
        },
        access_token: accessToken,
        refresh_token: refreshToken.token,
      },
      'Login successful',
    );
  }

  async refreshToken(token: string) {
    if (!token)
      throw new UnauthorizedException('Token is required');

    const refreshToken =
      await this.refreshTokenService.validateRefreshToken(token);
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = refreshToken.user;
    const accessToken = this.signAccessToken(user);
    const newRefreshToken =
      await this.refreshTokenService.generateRefreshToken(user);

    // Revoke the old refresh token
    await this.refreshTokenService.revokeRefreshToken(token);

    const { password, ...userWithoutPassword } = user;
    return new BaseResponseDto(
      {
        user: userWithoutPassword,
        access_token: accessToken,
        refresh_token: newRefreshToken.token,
      },
      'Token refreshed successfully',
    );
  }

  async logout(token: string) {
    await this.refreshTokenService.revokeRefreshToken(token);
    return new BaseResponseDto(null, 'Logged out successfully');
  }

  /**
   * Step 1: Request password reset - send verification code to email
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    await this.passwordResetService.requestPasswordReset(forgotPasswordDto);
    return new BaseResponseDto(
      {
        expires_in_seconds: 15 * 60,
      },
      'If the email exists, a verification code has been sent',
    );
  }


  /**
   * Step 2: Verify the code sent to email
   */
  async verifyResetCode(verifyCodeDto: VerifyCodeDto) {
    await this.passwordResetService.verifyCode(verifyCodeDto);
    return new BaseResponseDto(
      null,
      'Verification code is valid. You can now reset your password',
    );
  }

  /**
   * Step 3: Reset password with verified code
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, code, newPassword, confirmPassword } = resetPasswordDto;

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }

    await this.passwordResetService.resetPassword(email, code, newPassword);
    return new BaseResponseDto(null, 'Password has been reset successfully');
  }


}
