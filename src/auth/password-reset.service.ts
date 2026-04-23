import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { LessThan, MoreThan, Repository } from 'typeorm';

import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { EmailService } from './email.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private passwordResetRepository: Repository<PasswordResetToken>,
    private usersService: UsersService,
    private emailService: EmailService,
  ) { }

  /**
   * Step 1: Generate and send verification code to email
   */
  async requestPasswordReset(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    const { email } = forgotPasswordDto;

    // Check if user exists
    const user = await this.usersService.findByEmailOrPhoneNumberOrUserName(email);
    if (!user) {
      // For security, don't reveal if email exists or not
      // Just return success to prevent email enumeration

      throw new NotFoundException('Email address not found in our system');
    }

    // Generate 6-digit verification code
    const code = this.generateVerificationCode();

    // Set expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Invalidate any existing unused tokens for this email
    await this.passwordResetRepository.update(
      { email, isUsed: false },
      { isUsed: true },
    );

    // Create new password reset token
    const resetToken = this.passwordResetRepository.create({
      email,
      code,
      expiresAt,
      user,
      userId: user.id,
      isUsed: false,
    });

    await this.passwordResetRepository.save(resetToken);

    // Send verification code via email
    await this.emailService.sendVerificationCode(email, code);
  }

  /**
   * Step 2: Verify the submitted code
   */
  async verifyCode(verifyCodeDto: VerifyCodeDto): Promise<void> {
    const { email, code } = verifyCodeDto;

    const resetToken = await this.passwordResetRepository.findOne({
      where: {
        email,
        code,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Code is valid, but we don't mark it as used yet
    // It will be marked as used when the password is actually reset
  }

  /**
   * Step 3: Reset password using valid code
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    const resetToken = await this.passwordResetRepository.findOne({
      where: {
        email,
        code,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (!resetToken.user) {
      throw new NotFoundException('User not found');
    }

    // Update user password
    await this.usersService.updatePassword(resetToken.user.id, newPassword);

    // Mark token as used
    resetToken.isUsed = true;
    await this.passwordResetRepository.save(resetToken);
  }

  /**
   * Generate a 6-digit verification code
   */
  private generateVerificationCode(): string {
    return crypto.randomInt(1000, 9999).toString();
  }

  /**
   * Clean up expired tokens (can be called via cron job)
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.passwordResetRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
