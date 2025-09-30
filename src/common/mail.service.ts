import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT, 10)
      : undefined;
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
      this.logger.warn(
        'SMTP not configured (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS). Emails will be logged only.',
      );
    }
  }

  async sendAccountCredentials(params: {
    to: string;
    username: string;
    password: string;
    role?: string;
  }) {
    const from =
      process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const subject = 'Thông tin tài khoản đăng nhập';
    const getRoleDisplayName = (role?: string) => {
      switch (role) {
        case 'admin':
          return 'Quản trị viên';
        case 'staff':
          return 'Nhân viên';
        case 'family':
          return 'Gia đình người cao tuổi';
        default:
          return 'Người dùng';
      }
    };

    const roleDisplayName = getRoleDisplayName(params.role);

    const text = `Xin chào,

Thông tin đăng nhập tại viện dưỡng lão CareHome  
Email: ${params.to}
Tên đăng nhập: ${params.username}
Mật khẩu: ${params.password}
Loại tài khoản: ${roleDisplayName}

Bạn có thể đăng nhập tại: ${appUrl}/login

Trân trọng,`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827">
        <p>Xin chào,</p>
        <p>Thông tin đăng nhập tại viện dưỡng lão CareHome</p>
        <p><strong>Email:</strong> ${params.to}<br/>
        <strong>Tên đăng nhập:</strong> ${params.username}<br/>
        <strong>Mật khẩu:</strong> ${params.password}<br/>
        <strong>Loại tài khoản:</strong> ${roleDisplayName}</p>
        <p>Bạn có thể đăng nhập tại: <a href="${appUrl}/login" target="_blank">${appUrl}/login</a></p>
        <p>Trân trọng,</p>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(
        `[MAIL:DRY-RUN] To: ${params.to} | Subject: ${subject} | Username: ${params.username} | Password: ${params.password}`,
      );
      return { mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress || undefined,
        to: params.to,
        subject,
        text,
        html,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send credentials email', err);
      // Không chặn flow chính nếu gửi email lỗi
      return { error: true };
    }
  }

  async sendResetPasswordEmail(params: {
    to: string;
    username: string;
    newPassword: string;
  }) {
    const from =
      process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
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
      this.logger.log(
        `[MAIL:DRY-RUN] To: ${params.to} | Subject: ${subject} | Username: ${params.username} | New Password: ${params.newPassword}`,
      );
      return { mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress || undefined,
        to: params.to,
        subject,
        text,
        html,
      });
      this.logger.log(`Reset password email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send reset password email', err);
      // Không chặn flow chính nếu gửi email lỗi
      return { error: true };
    }
  }

  async sendAccountActivatedEmail(params: { to: string; username: string }) {
    const from =
      process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const subject = 'Tài khoản của bạn đã được kích hoạt';
    const text = `Xin chào ${params.username},\n\nTài khoản của bạn đã được admin phê duyệt và kích hoạt.\nBạn có thể đăng nhập tại: ${appUrl}/login\n\nTrân trọng,\nĐội ngũ CareHome`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Tài khoản đã được kích hoạt</h2>
          <p>Xin chào <strong>${params.username}</strong>,</p>
          <p>Tài khoản của bạn đã được admin phê duyệt và kích hoạt.</p>
          <p>Bạn có thể đăng nhập tại: <a href="${appUrl}/login" target="_blank" style="color: #3498db;">${appUrl}/login</a></p>
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
          <p style="color: #6c757d; font-size: 14px;">Trân trọng,<br>Đội ngũ CareHome</p>
        </div>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(
        `[MAIL:DRY-RUN] To: ${params.to} | Subject: ${subject} | Username: ${params.username}`,
      );
      return { mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress || undefined,
        to: params.to,
        subject,
        text,
        html,
      });
      this.logger.log(`Activation email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send activation email', err);
      return { error: true };
    }
  }

  async sendAccountRejectedEmail(params: { to: string; username: string; reason?: string }) {
    const from =
      process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const subject = 'Thông báo từ chối đăng ký tài khoản';
    const reasonText = params.reason ? `\n\nLý do từ chối: ${params.reason}` : '';
    const text = `Xin chào ${params.username},\n\nRất tiếc, đăng ký tài khoản của bạn đã bị từ chối.${reasonText}\n\nNếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi.\n\nTrân trọng,\nĐội ngũ CareHome`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #e74c3c; margin-bottom: 20px;">Đăng ký tài khoản bị từ chối</h2>
          <p>Xin chào <strong>${params.username}</strong>,</p>
          <p>Rất tiếc, đăng ký tài khoản của bạn đã bị từ chối.</p>
          ${params.reason ? `<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;"><strong>Lý do từ chối:</strong><br>${params.reason}</div>` : ''}
          <p>Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi.</p>
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
          <p style="color: #6c757d; font-size: 14px;">Trân trọng,<br>Đội ngũ CareHome</p>
        </div>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(
        `[MAIL:DRY-RUN] To: ${params.to} | Subject: ${subject} | Username: ${params.username} | Reason: ${params.reason || 'N/A'}`,
      );
      return { mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress || undefined,
        to: params.to,
        subject,
        text,
        html,
      });
      this.logger.log(`Rejection email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send rejection email', err);
      return { error: true };
    }
  }

  async sendResidentApprovedEmail(params: { to: string; residentName: string; familyMemberName: string }) {
    const from =
      process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const subject = 'Đơn đăng ký nhập viện đã được phê duyệt';
    const text = `Xin chào ${params.familyMemberName},\n\nĐơn đăng ký nhập viện cho ${params.residentName} đã được admin phê duyệt.\nBạn có thể xem thông tin chi tiết tại: ${appUrl}\n\nTrân trọng,\nĐội ngũ CareHome`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #27ae60; margin-bottom: 20px;">Đơn đăng ký nhập viện đã được phê duyệt</h2>
          <p>Xin chào <strong>${params.familyMemberName}</strong>,</p>
          <p>Đơn đăng ký nhập viện cho <strong>${params.residentName}</strong> đã được admin phê duyệt.</p>
          <p>Bạn có thể xem thông tin chi tiết tại: <a href="${appUrl}" target="_blank" style="color: #3498db;">${appUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
          <p style="color: #6c757d; font-size: 14px;">Trân trọng,<br>Đội ngũ CareHome</p>
        </div>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(
        `[MAIL:DRY-RUN] To: ${params.to} | Subject: ${subject} | Resident: ${params.residentName} | Family: ${params.familyMemberName}`,
      );
      return { mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress || undefined,
        to: params.to,
        subject,
        text,
        html,
      });
      this.logger.log(`Resident approval email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send resident approval email', err);
      return { error: true };
    }
  }

  async sendResidentRejectedEmail(params: { to: string; residentName: string; familyMemberName: string; reason?: string }) {
    const from =
      process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const subject = 'Đơn đăng ký nhập viện bị từ chối';
    const reasonText = params.reason ? `\n\nLý do từ chối: ${params.reason}` : '';
    const text = `Xin chào ${params.familyMemberName},\n\nRất tiếc, đơn đăng ký nhập viện cho ${params.residentName} đã bị từ chối.${reasonText}\n\nNếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi.\n\nTrân trọng,\nĐội ngũ CareHome`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #e74c3c; margin-bottom: 20px;">Đơn đăng ký nhập viện bị từ chối</h2>
          <p>Xin chào <strong>${params.familyMemberName}</strong>,</p>
          <p>Rất tiếc, đơn đăng ký nhập viện cho <strong>${params.residentName}</strong> đã bị từ chối.</p>
          ${params.reason ? `<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;"><strong>Lý do từ chối:</strong><br>${params.reason}</div>` : ''}
          <p>Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi.</p>
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
          <p style="color: #6c757d; font-size: 14px;">Trân trọng,<br>Đội ngũ CareHome</p>
        </div>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(
        `[MAIL:DRY-RUN] To: ${params.to} | Subject: ${subject} | Resident: ${params.residentName} | Family: ${params.familyMemberName} | Reason: ${params.reason || 'N/A'}`,
      );
      return { mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress || undefined,
        to: params.to,
        subject,
        text,
        html,
      });
      this.logger.log(`Resident rejection email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send resident rejection email', err);
      return { error: true };
    }
  }

  async sendRequestApprovalEmail(params: {
    to: string;
    familyName: string;
    residentName: string;
    requestType: string;
    note?: string;
  }) {
    const from =
      process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const subject = `Yêu cầu ${params.requestType} đã được duyệt - CareHome`;
    const text = `Yêu cầu ${params.requestType} cho cư dân ${params.residentName} đã được quản trị viên duyệt và thực hiện thành công.`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Yêu cầu đã được duyệt</h2>
          <p>Xin chào <strong>${params.familyName}</strong>,</p>
          <p>Yêu cầu <strong>${params.requestType}</strong> cho cư dân <strong>${params.residentName}</strong> đã được quản trị viên duyệt và thực hiện thành công.</p>
          ${params.note ? `<p><strong>Ghi chú:</strong> ${params.note}</p>` : ''}
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
          <p style="color: #6c757d; font-size: 14px;">Trân trọng,<br>Đội ngũ CareHome</p>
        </div>
      </div>
    `;
    if (!this.transporter) {
      this.logger.log(
        `[MAIL:DRY-RUN] To: ${params.to} | Subject: ${subject} | Family: ${params.familyName} | Resident: ${params.residentName}`,
      );
      return { mocked: true };
    }
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress || undefined,
        to: params.to,
        subject,
        text,
        html,
      });
      this.logger.log(`Request approval email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send request approval email', err);
      return { error: true };
    }
  }

  async sendStaffRoomAssignmentEmail(params: {
    to: string;
    staffName: string;
    roomNumber: string;
    roomType: string;
    responsibilities: string[];
    notes?: string;
  }) {
    const from =
      process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const subject = 'Phân công phòng chăm sóc mới - CareHome';
    const responsibilitiesText = params.responsibilities.length > 0 
      ? params.responsibilities.join(', ') 
      : 'Chăm sóc tổng quát';
    const notesText = params.notes ? `\n\nGhi chú: ${params.notes}` : '';
    
    const text = `Xin chào ${params.staffName},

Bạn đã được phân công chăm sóc phòng ${params.roomNumber} (${params.roomType}).

Trách nhiệm: ${responsibilitiesText}${notesText}

Bạn có thể xem thông tin chi tiết và danh sách cư dân tại: ${appUrl}

Trân trọng,
Đội ngũ CareHome`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Phân công phòng chăm sóc mới</h2>
          <p>Xin chào <strong>${params.staffName}</strong>,</p>
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Phòng được phân công:</strong> ${params.roomNumber}</p>
            <p style="margin: 5px 0 0 0;"><strong>Loại phòng:</strong> ${params.roomType}</p>
          </div>
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Trách nhiệm:</strong> ${responsibilitiesText}</p>
          </div>
          ${params.notes ? `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6c757d;"><p style="margin: 0;"><strong>Ghi chú:</strong> ${params.notes}</p></div>` : ''}
          <p>Bạn có thể xem thông tin chi tiết và danh sách cư dân tại: <a href="${appUrl}" target="_blank" style="color: #3498db;">${appUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
          <p style="color: #6c757d; font-size: 14px;">Trân trọng,<br>Đội ngũ CareHome</p>
        </div>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(
        `[MAIL:DRY-RUN] To: ${params.to} | Subject: ${subject} | Staff: ${params.staffName} | Room: ${params.roomNumber}`,
      );
      return { mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress || undefined,
        to: params.to,
        subject,
        text,
        html,
      });
      this.logger.log(`Staff room assignment email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send staff room assignment email', err);
      return { error: true };
    }
  }

  async sendMonthlyBillEmail(params: {
    to: string;
    familyName: string;
    residentName: string;
    month: string;
    amount: string;
    dueDate: string;
    billId: string;
  }) {
    const from =
      process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const subject = `Hóa đơn tháng ${params.month} - ${params.residentName} - CareHome`;
    
    const text = `Xin chào ${params.familyName},

Hóa đơn dịch vụ chăm sóc cho ${params.residentName} tháng ${params.month} đã được tạo.

Thông tin hóa đơn:
- Cư dân: ${params.residentName}
- Số tiền: ${params.amount} VNĐ
- Hạn thanh toán: ${params.dueDate}
- Mã hóa đơn: ${params.billId}

Bạn có thể đăng nhập vào hệ thống CareHome (web hoặc app) để xem chi tiết và thanh toán hóa đơn.

Trân trọng,
Đội ngũ CareHome`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Hóa đơn tháng ${params.month}</h2>
          <p>Xin chào <strong>${params.familyName}</strong>,</p>
          <p>Hóa đơn dịch vụ chăm sóc cho <strong>${params.residentName}</strong> tháng ${params.month} đã được tạo.</p>
          
          <div style="background-color: #e8f4fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Thông tin hóa đơn</h3>
            <p style="margin: 5px 0;"><strong>Cư dân:</strong> ${params.residentName}</p>
            <p style="margin: 5px 0;"><strong>Số tiền:</strong> <span style="color: #e74c3c; font-size: 18px;">${params.amount} VNĐ</span></p>
            <p style="margin: 5px 0;"><strong>Hạn thanh toán:</strong> ${params.dueDate}</p>
            <p style="margin: 5px 0;"><strong>Mã hóa đơn:</strong> ${params.billId}</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>Lưu ý:</strong> Vui lòng thanh toán trước hạn để tránh phí trễ hạn.</p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;"><strong>Hướng dẫn thanh toán:</strong> Bạn có thể đăng nhập vào hệ thống CareHome (web hoặc app) để xem chi tiết và thanh toán hóa đơn.</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
          <p style="color: #6c757d; font-size: 14px;">Trân trọng,<br>Đội ngũ CareHome</p>
        </div>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(
        `[MAIL:DRY-RUN] To: ${params.to} | Subject: ${subject} | Family: ${params.familyName} | Resident: ${params.residentName} | Amount: ${params.amount}`,
      );
      return { mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress || undefined,
        to: params.to,
        subject,
        text,
        html,
      });
      this.logger.log(`Monthly bill email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send monthly bill email', err);
      return { error: true };
    }
  }

  async sendDischargeNotificationEmail(params: {
    to: string;
    familyName: string;
    residentName: string;
    statusText: string;
    reason: string;
    dischargeDate: Date;
  }) {
    const from =
      process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const subject = `Thông báo ${params.statusText} - ${params.residentName}`;
    
    const dischargeDateFormatted = params.dischargeDate.toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const text = `
Thông báo ${params.statusText}

Xin chào ${params.familyName},

Chúng tôi thông báo rằng cư dân ${params.residentName} đã ${params.statusText} vào ngày ${dischargeDateFormatted}.

Lý do: ${params.reason}

Trân trọng,
Đội ngũ CareHome
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Thông báo ${params.statusText}</h1>
        </div>
        
        <div style="padding: 30px; background-color: white;">
          <p style="font-size: 16px; color: #2c3e50;">Xin chào <strong>${params.familyName}</strong>,</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #34495e;">
            Chúng tôi thông báo rằng cư dân <strong>${params.residentName}</strong> đã ${params.statusText} vào ngày <strong>${dischargeDateFormatted}</strong>.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #${params.statusText === 'xuất viện' ? '28a745' : 'dc3545'};">
            <h3 style="color: #2c3e50; margin-top: 0;">Lý do ${params.statusText}:</h3>
            <p style="margin: 5px 0; color: #34495e; font-style: italic;">"${params.reason}"</p>
          </div>
          
          ${params.statusText === 'xuất viện' ? `
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;"><strong>Lưu ý:</strong> Cư dân đã hoàn thành quá trình chăm sóc và có thể về nhà. Chúng tôi chúc gia đình sức khỏe và hạnh phúc.</p>
          </div>
          ` : `
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0; color: #721c24;"><strong>Lời chia buồn:</strong> Chúng tôi xin gửi lời chia buồn sâu sắc đến gia đình. Cư dân đã được chăm sóc tận tình trong thời gian qua.</p>
          </div>
          `}
          
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #2c3e50;"><strong>Thông tin liên hệ:</strong> Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua hệ thống CareHome hoặc hotline hỗ trợ.</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
          <p style="color: #6c757d; font-size: 14px;">Trân trọng,<br>Đội ngũ CareHome</p>
        </div>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(
        `[MAIL:DRY-RUN] To: ${params.to} | Subject: ${subject} | Family: ${params.familyName} | Resident: ${params.residentName} | Status: ${params.statusText}`,
      );
      return { mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress || undefined,
        to: params.to,
        subject,
        text,
        html,
      });
      this.logger.log(`Discharge notification email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send discharge notification email', err);
      return { error: true };
    }
  }
}
