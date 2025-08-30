import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.fromAddress = process.env.MAIL_FROM || user || null;

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, 
        auth: { user, pass },
      });
      this.logger.log(`Mail transporter initialized for host ${host}:${port}`);
    } else {
      this.logger.warn('SMTP not configured (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS). Emails will be logged only.');
    }
  }

  async sendAccountCredentials(params: { to: string; username: string; password: string; role?: string }) {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const subject = 'Thông tin tài khoản đăng nhập';
    const text = `Xin chào,

Thông tin đăng nhập tại viện dưỡng lão CareHome  
Tên đăng nhập: ${params.username}
Mật khẩu: ${params.password}

Bạn có thể đăng nhập tại: ${appUrl}/login

Trân trọng,`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827">
        <p>Xin chào,</p>
        <p>Thông tin đăng nhập tại viện dưỡng lão CareHome</p>
        <p><strong>Tên đăng nhập:</strong> ${params.username}<br/>
        <strong>Mật khẩu:</strong> ${params.password}</p>
        <p>Bạn có thể đăng nhập tại: <a href="${appUrl}/login" target="_blank">${appUrl}/login</a></p>
        <p>Trân trọng,</p>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(`[MAIL:DRY-RUN] To: ${params.to} | Subject: ${subject} | Username: ${params.username} | Password: ${params.password}`);
      return { mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({ from: this.fromAddress || undefined, to: params.to, subject, text, html });
      this.logger.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send credentials email', err as any);
      // Không chặn flow chính nếu gửi email lỗi
      return { error: true };
    }
  }

  async sendResetPasswordEmail(params: { to: string; username: string; newPassword: string }) {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const subject = 'Đặt lại mật khẩu - Viện dưỡng lão CareHome';
    const text = `Xin chào ${params.username},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

Mật khẩu mới của bạn là: ${params.newPassword}

Bạn có thể đăng nhập tại: ${appUrl}/login

Vui lòng đổi mật khẩu sau khi đăng nhập để bảo mật tài khoản.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ với chúng tôi ngay lập tức.

Trân trọng,
Đội ngũ CareHome`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Đặt lại mật khẩu</h2>
          <p>Xin chào <strong>${params.username}</strong>,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Mật khẩu mới của bạn:</strong> <span style="font-family: monospace; font-size: 16px; color: #e74c3c;">${params.newPassword}</span></p>
          </div>
          <p>Bạn có thể đăng nhập tại: <a href="${appUrl}/login" target="_blank" style="color: #3498db;">${appUrl}/login</a></p>
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>Lưu ý:</strong> Vui lòng đổi mật khẩu sau khi đăng nhập để bảo mật tài khoản.</p>
          </div>
          <p style="color: #6c757d; font-size: 14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
          <p style="color: #6c757d; font-size: 14px;">Trân trọng,<br>Đội ngũ CareHome</p>
        </div>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(`[MAIL:DRY-RUN] To: ${params.to} | Subject: ${subject} | Username: ${params.username} | New Password: ${params.newPassword}`);
      return { mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({ from: this.fromAddress || undefined, to: params.to, subject, text, html });
      this.logger.log(`Reset password email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send reset password email', err as any);
      // Không chặn flow chính nếu gửi email lỗi
      return { error: true };
    }
  }
}


