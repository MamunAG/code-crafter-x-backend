import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) { }

  private getBrandContext() {
    const port = this.configService.get<string>('PORT') || '3050';
    const publicBaseUrl = (
      this.configService.get<string>('BACKEND_PUBLIC_URL') ||
      this.configService.get<string>('PUBLIC_APP_URL') ||
      this.configService.get<string>('APP_URL') ||
      `http://localhost:${port}`
    ).replace(/\/$/, '');
    const appName = this.configService.get<string>('APP_NAME') || 'Code Crafter X';
    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') ||
      this.configService.get<string>('FROM_EMAIL') ||
      this.configService.get<string>('SMTP_USER') ||
      'support@codecrafterx.com';

    return {
      appName,
      supportEmail,
      logoUrl: `${publicBaseUrl}/assets/brand/code_crafter_x_logo.png`,
      iconUrl: `${publicBaseUrl}/assets/brand/code_crafter_x_icon.png`,
      publicBaseUrl,
    };
  }

  private getBrandAssetPath(filename: string): string {
    const candidates = [
      join(process.cwd(), 'public', 'brand', filename),
      join(process.cwd(), 'dist', 'public', 'brand', filename),
      join(__dirname, '..', '..', 'public', 'brand', filename),
    ];

    return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
  }

  private getBrandAttachments() {
    return [
      {
        filename: 'code_crafter_x_logo.png',
        path: this.getBrandAssetPath('code_crafter_x_logo.png'),
        cid: 'code-crafter-logo',
      },
      {
        filename: 'code_crafter_x_icon.png',
        path: this.getBrandAssetPath('code_crafter_x_icon.png'),
        cid: 'code-crafter-icon',
      },
    ];
  }

  private getInlineBrandContext() {
    return {
      ...this.getBrandContext(),
      logoUrl: 'cid:code-crafter-logo',
      iconUrl: 'cid:code-crafter-icon',
    };
  }

  private async sendCodeEmail({
    email,
    subject,
    template,
    context,
    fallbackMessage,
  }: {
    email: string;
    subject: string;
    template: string;
    context: Record<string, unknown>;
    fallbackMessage: string;
  }): Promise<void> {
    try {
      const brand = this.getBrandContext();

      await this.mailerService.sendMail({
        to: email,
        subject,
        template,
        attachments: this.getBrandAttachments(),
        context: {
          ...this.getInlineBrandContext(),
          ...context,
        },
      });

      this.logger.log(fallbackMessage);
    } catch (error) {
      this.logger.error(fallbackMessage, error);

      if (this.configService.get<string>('NODE_ENV') === 'development') {
        return;
      }

      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send verification code to email using professional template
   */
  async sendVerificationCode(email: string, code: string): Promise<void> {
    this.logger.log(`Sending verification code to ${email}: ${code}`);
    await this.sendCodeEmail({
      email,
      subject: `${this.getBrandContext().appName} password reset code`,
      template: 'password-reset',
      context: { code },
      fallbackMessage: `Verification code sent successfully to ${email}`,
    });
  }

  async sendEmailConfirmationCode(
    email: string,
    code: string,
    fullName?: string,
  ): Promise<void> {
    this.logger.log(`Sending email confirmation code to ${email}: ${code}`);
    await this.sendCodeEmail({
      email,
      subject: `${this.getBrandContext().appName} email verification code`,
      template: 'confirm-email',
      context: {
        code,
        fullName,
      },
      fallbackMessage: `Email confirmation code sent successfully to ${email}`,
    });
  }

  /**
   * Send welcome email to new users with professional template
   */
  sendWelcomeEmail(email: string, fullName: string): Promise<void> {
    if (!email) {
      this.logger.warn(
        'Skipping welcome email because no recipient email was provided',
      );
      return Promise.resolve();
    }

    this.logger.log(`Queueing welcome email to ${email} for ${fullName}`);
    const brand = this.getBrandContext();

    return this.mailerService
      .sendMail({
        to: email,
        subject: `Welcome to ${brand.appName}`,
        template: 'welcome',
        attachments: this.getBrandAttachments(),
        context: {
          ...this.getInlineBrandContext(),
          fullName,
        },
      })
      .then(() => {
        this.logger.log(`Welcome email sent successfully to ${email}`);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.stack ?? error.message : String(error);

        this.logger.error(
          `Welcome email failed for ${email}. Registration will continue without email delivery.`,
          message,
        );
      });
  }

  /**
   * Test email configuration using NestJS mailer
   */
  async testEmailConnection(): Promise<boolean> {
    try {
      // Send a test email to verify configuration
      const testEmail = this.configService.get<string>('SMTP_USER');
      if (!testEmail) {
        this.logger.warn(
          'No SMTP_USER configured for testing email connection',
        );
        return false;
      }

      await this.mailerService.sendMail({
        to: testEmail,
        subject: `${this.getBrandContext().appName} email configuration test`,
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify that your email configuration is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
          <p>From: ${this.getBrandContext().appName} Backend</p>
        `,
      });

      this.logger.log('Email connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Email connection test failed', error);
      return false;
    }
  }

  async sendContactEmailToAdmin(email: string, fullName: string, account_number: string, message: string): Promise<void> {
    try {
      const brand = this.getBrandContext();
      this.logger.log(`New contact form submission to ${email} for ${fullName}`);

      await this.mailerService.sendMail({
        to: email,
        subject: `New contact request - ${brand.appName}`,
        template: 'contact_admin',
        attachments: this.getBrandAttachments(),
        context: {
          ...this.getInlineBrandContext(),
          name: fullName,
          email,
          number: account_number,
          message
        },
      });

      this.logger.log(`New Contact Form Submission email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send New Contact Form Submission email to ${email}`, error);

      // Don't throw error for welcome email to avoid blocking user registration
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(
          `Fallback - New Contact Form Submission email should have been sent to ${email} for ${fullName}`,
        );
      }
    }
  }

  async sendContactEmailToUser(email: string, fullName: string, account_number: string, message: string): Promise<void> {
    try {
      const brand = this.getBrandContext();
      this.logger.log(`Contact confirmation email to ${email} for ${fullName}`);

      await this.mailerService.sendMail({
        to: email,
        subject: `We received your message - ${brand.appName} Support`,
        template: 'contact_user',
        attachments: this.getBrandAttachments(),
        context: {
          ...this.getInlineBrandContext(),
          name: fullName,
          email,
          number: account_number,
          message
        },
      });

      this.logger.log(`Contact confirmation email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send contact confirmation email to ${email}`, error);

      // Don't throw error for welcome email to avoid blocking user registration
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(
          `Fallback - Contact confirmation email should have been sent to ${email} for ${fullName}`,
        );
      }
    }
  }
}
