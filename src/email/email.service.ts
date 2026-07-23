import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT ?? '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      this.logger.warn('SMTP not configured — emails will be logged to console only');
    }
  }

  private async send(options: { to: string; subject: string; html: string }) {
    if (this.transporter) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'noreply@taskifier.dev',
        ...options,
      });
    }
    this.logger.log(`[EMAIL TO: ${options.to}] Subject: ${options.subject}`);
    this.logger.log(`[EMAIL BODY]:\n${options.html}`);
  }

  async sendWelcomeEmail(email: string, name: string, tempPassword: string) {
    const loginUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3001'}/login`;
    await this.send({
      to: email,
      subject: 'Welcome to Taskifier – Your Account Has Been Created',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Taskifier</h1>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your employee account has been created by your manager. You can now log in to the Taskifier portal using the credentials below:</p>
          <table style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0; width: 100%;">
            <tr><td style="padding: 4px 0; color: #666;">Email:</td><td style="padding: 4px 0; font-weight: 600;">${email}</td></tr>
            <tr><td style="padding: 4px 0; color: #666;">Temporary Password:</td><td style="padding: 4px 0; font-weight: 600;">${tempPassword}</td></tr>
          </table>
          <a href="${loginUrl}" style="display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 8px 0;">Login to Taskifier</a>
          <p style="color: #888; font-size: 13px; margin-top: 16px;">For security, please change your password after your first login.</p>
        </div>
      `,
    });
  }

  async sendPasswordChangedEmail(email: string, name: string) {
    await this.send({
      to: email,
      subject: 'Your Taskifier Password Has Been Changed',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="color: #333;">Password Changed</h1>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your Taskifier account password was successfully changed.</p>
          <p style="color: #888; font-size: 13px;">If you did not make this change, please contact your manager immediately.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3001'}/reset-password?token=${resetToken}`;
    await this.send({
      to: email,
      subject: 'Reset Your Taskifier Password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="color: #333;">Reset Your Password</h1>
          <p>Hi <strong>${name}</strong>,</p>
          <p>We received a request to reset your Taskifier account password. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 8px 0;">Reset Password</a>
          <p style="color: #888; font-size: 13px; margin-top: 16px;">This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    });
  }
}
