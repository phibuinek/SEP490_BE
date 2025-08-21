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
}


