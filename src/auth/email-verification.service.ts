import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { MoreThan, Repository } from 'typeorm';

import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ResendConfirmEmailDto } from './dto/resend-confirm-email.dto';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { EmailService } from './email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationRepository: Repository<EmailVerificationToken>,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  async sendInitialVerification(email: string, fullName?: string): Promise<void> {
    await this.issueVerificationCode(email, fullName);
  }

  async resendVerificationCode(
    resendConfirmEmailDto: ResendConfirmEmailDto,
  ): Promise<void> {
    await this.issueVerificationCode(resendConfirmEmailDto.email);
  }

  async confirmEmail(confirmEmailDto: ConfirmEmailDto): Promise<void> {
    const email = this.normalizeEmail(confirmEmailDto.email);
    const code = confirmEmailDto.code.trim();

    const verificationToken = await this.emailVerificationRepository.findOne({
      where: {
        email,
        code,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!verificationToken || !verificationToken.user) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (!verificationToken.user.is_email_verified) {
      await this.usersService.update(verificationToken.user.id, {
        is_email_verified: true,
      });
    }

    verificationToken.isUsed = true;
    await this.emailVerificationRepository.save(verificationToken);
  }

  private async issueVerificationCode(
    email: string,
    fullName?: string,
  ): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmailOrUserName(normalizedEmail);

    if (!user || user.is_email_verified) {
      return;
    }

    await this.emailVerificationRepository.update(
      { email: normalizedEmail, isUsed: false },
      { isUsed: true },
    );

    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const verificationToken = this.emailVerificationRepository.create({
      email: normalizedEmail,
      code,
      expiresAt,
      user,
      userId: user.id,
      isUsed: false,
    });

    await this.emailVerificationRepository.save(verificationToken);
    await this.emailService.sendEmailConfirmationCode(
      user.email,
      code,
      fullName ?? user.name,
    );
  }

  private generateVerificationCode(): string {
    return crypto.randomInt(1000, 9999).toString();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
