import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Send verification code to email using professional template
   */
  async sendVerificationCode(email: string, code: string): Promise<void> {
    try {
      this.logger.log(`Sending verification code to ${email}: ${code}`);

      await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset Verification Code - Solo Crest',
        template: 'password-reset',
        context: {
          code,
        },
      });

      this.logger.log(`Verification code sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification code to ${email}`, error);

      // Fallback to console logging in development
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Fallback - Verification code for ${email}: ${code}`);
      } else {
        throw new Error('Failed to send verification email');
      }
    }
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

    return this.mailerService
      .sendMail({
        to: email,
        subject: 'Welcome to Rillo - Your Equestrian Journey Begins!',
        template: 'welcome',
        context: {
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
        subject: 'Solo Crest - Email Configuration Test',
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify that your email configuration is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
          <p>From: Solo Crest Backend</p>
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
      this.logger.log(`New Contact Form Submission – SoloClash to ${email} for ${fullName}`);

      await this.mailerService.sendMail({
        to: email,
        subject: 'New Contact Form Submission – SoloClash',
        template: 'contact_admin',
        context: {
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
      this.logger.log(`We Received Your Message – SoloClash Support to ${email} for ${fullName}`);

      await this.mailerService.sendMail({
        to: email,
        subject: 'We Received Your Message – SoloClash Support',
        template: 'contact_user',
        context: {
          name: fullName,
          email,
          number: account_number,
          message
        },
      });

      this.logger.log(`We Received Your Message – SoloClash Support email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send We Received Your Message – SoloClash Support email to ${email}`, error);

      // Don't throw error for welcome email to avoid blocking user registration
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(
          `Fallback - We Received Your Message – SoloClash Support email should have been sent to ${email} for ${fullName}`,
        );
      }
    }
  }
}
