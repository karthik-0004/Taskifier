import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly baseUrl: string;
  private readonly logoUrl = 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/task.svg';

  constructor() {
    const host = process.env.SMTP_HOST;
    this.baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
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

  private style = `
    <style>
      body { margin: 0; padding: 0; background: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
      .card { background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
      .logo { text-align: center; margin-bottom: 24px; }
      .logo img { width: 48px; height: 48px; }
      .logo-text { font-size: 20px; font-weight: 700; color: #6366f1; margin-top: 8px; }
      h1 { font-size: 22px; color: #1a1a2e; margin: 0 0 8px; }
      p { font-size: 15px; color: #4a4a6a; line-height: 1.6; margin: 0 0 16px; }
      .summary-card { background: #f8f9fc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e8eaf0; }
      .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8eaf0; font-size: 14px; }
      .summary-row:last-child { border-bottom: none; }
      .summary-label { color: #6b7280; }
      .summary-value { font-weight: 600; color: #1a1a2e; text-align: right; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      .badge-success { background: #d1fae5; color: #065f46; }
      .badge-warning { background: #fef3c7; color: #92400e; }
      .badge-danger { background: #fee2e2; color: #991b1b; }
      .badge-default { background: #e5e7eb; color: #374151; }
      .badge-accent { background: #e0e7ff; color: #3730a3; }
      .btn { display: inline-block; background: #6366f1; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0; text-align: center; }
      .btn:hover { background: #4f46e5; }
      .team-list { list-style: none; padding: 0; margin: 8px 0; }
      .team-list li { padding: 4px 0; font-size: 14px; color: #4a4a6a; }
      .team-list li::before { content: "👤 "; }
      .footer { text-align: center; padding: 24px 0 0; color: #9ca3af; font-size: 13px; }
      .footer a { color: #6366f1; text-decoration: none; }
      hr { border: none; border-top: 1px solid #e8eaf0; margin: 20px 0; }
      @media (max-width: 480px) {
        .card { padding: 20px; }
        .summary-row { flex-direction: column; gap: 2px; }
        .summary-value { text-align: left; }
      }
    </style>
  `;

  private badge(status: string): string {
    const map: Record<string, string> = {
      PLANNING: 'badge-accent', NOT_STARTED: 'badge-default', IN_PROGRESS: 'badge-success',
      ON_HOLD: 'badge-warning', COMPLETED: 'badge-default', CANCELLED: 'badge-danger',
      LOW: 'badge-success', MEDIUM: 'badge-warning', HIGH: 'badge-danger', CRITICAL: 'badge-danger',
    };
    return map[status] ?? 'badge-default';
  }

  private header(logoText = 'Taskifier'): string {
    return `
      <div class="logo">
        <img src="${this.logoUrl}" alt="Taskifier Logo" />
        <div class="logo-text">${logoText}</div>
      </div>`;
  }

  private footer(): string {
    return `
      <div class="footer">
        <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#4a4a6a;">— Taskifier Team</p>
        <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">Engineering Management Platform</p>
        <p style="margin:0;font-size:12px;color:#b0b7c3;">
          <a href="${this.baseUrl}">${this.baseUrl}</a> &nbsp;·&nbsp; 
          If you believe this assignment was made in error, please contact your Project Manager.
        </p>
      </div>`;
  }

  async sendWelcomeEmail(email: string, name: string, tempPassword: string) {
    const loginUrl = `${this.baseUrl}/login`;
    await this.send({
      to: email,
      subject: 'Welcome to Taskifier – Your Account Has Been Created',
      html: `
        <html>${this.style}<body>
          <div class="wrapper">
            <div class="card">
              ${this.header()}
              <h1>Welcome to Taskifier</h1>
              <p>Hi <strong>${name}</strong>,</p>
              <p>Your employee account has been created by your manager. You can now log in to the Taskifier portal using the credentials below:</p>
              <div class="summary-card">
                <div class="summary-row"><span class="summary-label">Email</span><span class="summary-value">${email}</span></div>
                <div class="summary-row"><span class="summary-label">Temporary Password</span><span class="summary-value" style="font-family:monospace;">${tempPassword}</span></div>
              </div>
              <div style="text-align:center;">
                <a href="${loginUrl}" class="btn">Login to Taskifier</a>
              </div>
              <p style="color:#9ca3af;font-size:13px;margin-top:16px;">For security, please change your password after your first login.</p>
            </div>
            ${this.footer()}
          </div>
        </body></html>
      `,
    });
  }

  async sendPasswordChangedEmail(email: string, name: string) {
    await this.send({
      to: email,
      subject: 'Your Taskifier Password Has Been Changed',
      html: `
        <html>${this.style}<body>
          <div class="wrapper">
            <div class="card">
              ${this.header()}
              <h1>Password Changed</h1>
              <p>Hi <strong>${name}</strong>,</p>
              <p>Your Taskifier account password was successfully changed.</p>
              <p style="color:#9ca3af;font-size:13px;">If you did not make this change, please contact your manager immediately.</p>
            </div>
            ${this.footer()}
          </div>
        </body></html>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, resetToken: string) {
    const resetUrl = `${this.baseUrl}/reset-password?token=${resetToken}`;
    await this.send({
      to: email,
      subject: 'Reset Your Taskifier Password',
      html: `
        <html>${this.style}<body>
          <div class="wrapper">
            <div class="card">
              ${this.header()}
              <h1>Reset Your Password</h1>
              <p>Hi <strong>${name}</strong>,</p>
              <p>We received a request to reset your Taskifier account password. Click the button below to set a new password:</p>
              <div style="text-align:center;">
                <a href="${resetUrl}" class="btn">Reset Password</a>
              </div>
              <p style="color:#9ca3af;font-size:13px;margin-top:16px;">This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
            </div>
            ${this.footer()}
          </div>
        </body></html>
      `,
    });
  }

  async sendProjectAssignmentEmail(params: {
    user: { name: string; email: string };
    project: {
      name: string;
      code?: string;
      description?: string | null;
      role: string;
      startDate?: string | null;
      expectedEndDate?: string | null;
      status?: string;
      priority?: string | null;
      managerName?: string;
      teamMembers: Array<{ name: string; role: string }>;
    };
  }) {
    const { user, project } = params;
    const projectUrl = `${this.baseUrl}/employee/my-projects`;

    const teamRows = project.teamMembers
      .map((m) => `<li>${m.name} — ${m.role.replace(/_/g, ' ')}</li>`)
      .join('');

    const statusLabel = (project.status ?? 'NOT_STARTED').replace(/_/g, ' ');

    await this.send({
      to: user.email,
      subject: `🎉 You've Been Assigned to a New Project – ${project.name}`,
      html: `
        <html>${this.style}<body>
          <div class="wrapper">
            <div class="card">
              ${this.header()}
              <h1>You've Been Assigned to a New Project</h1>
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>We're excited to let you know that you have been assigned to a new project within Taskifier. Below are your assignment details:</p>

              <hr />

              <div class="summary-card">
                <div class="summary-row">
                  <span class="summary-label">📌 Project Name</span>
                  <span class="summary-value">${project.name}${project.code ? ` (${project.code})` : ''}</span>
                </div>
                ${project.description ? `
                <div class="summary-row">
                  <span class="summary-label">📝 Description</span>
                  <span class="summary-value" style="font-weight:400;">${project.description}</span>
                </div>` : ''}
                <div class="summary-row">
                  <span class="summary-label">👨‍💻 Your Role</span>
                  <span class="summary-value">${project.role.replace(/_/g, ' ')}</span>
                </div>
                ${project.startDate ? `
                <div class="summary-row">
                  <span class="summary-label">📅 Start Date</span>
                  <span class="summary-value">${new Date(project.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>` : ''}
                ${project.expectedEndDate ? `
                <div class="summary-row">
                  <span class="summary-label">🏁 Expected End Date</span>
                  <span class="summary-value">${new Date(project.expectedEndDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>` : ''}
                <div class="summary-row">
                  <span class="summary-label">📊 Status</span>
                  <span class="summary-value"><span class="badge ${this.badge(project.status ?? 'NOT_STARTED')}">${statusLabel}</span></span>
                </div>
                ${project.priority ? `
                <div class="summary-row">
                  <span class="summary-label">⚡ Priority</span>
                  <span class="summary-value"><span class="badge ${this.badge(project.priority)}">${project.priority}</span></span>
                </div>` : ''}
                ${project.managerName ? `
                <div class="summary-row">
                  <span class="summary-label">👥 Project Manager</span>
                  <span class="summary-value">${project.managerName}</span>
                </div>` : ''}
              </div>

              ${project.teamMembers.length > 1 ? `
              <h2 style="font-size:16px;color:#1a1a2e;margin:20px 0 8px;">🤝 Your Team Members</h2>
              <ul class="team-list">${teamRows}</ul>` : ''}

              <hr />

              <h2 style="font-size:16px;color:#1a1a2e;margin:0 0 8px;">What's Next?</h2>
              <p>Please log in to the <strong>Employee Portal</strong> to:</p>
              <ul style="color:#4a4a6a;font-size:14px;line-height:1.8;padding-left:20px;">
                <li>View complete project details</li>
                <li>Check your assigned responsibilities</li>
                <li>Track project progress</li>
                <li>View your teammates</li>
                <li>Receive project updates</li>
                <li>Submit daily work summaries</li>
              </ul>

              <div style="text-align:center;margin:24px 0;">
                <a href="${projectUrl}" class="btn">View Project</a>
              </div>

              <p style="color:#9ca3af;font-size:13px;">If you believe this assignment was made in error or have any questions regarding the project, please contact your Project Manager.</p>
              <p>We wish you all the best on your new project!</p>
              <p style="font-size:15px;margin:0;">Happy Coding 🚀</p>
            </div>
            ${this.footer()}
          </div>
        </body></html>
      `,
    });
  }

  async sendProjectUpdateEmail(params: {
    user: { name: string; email: string };
    project: {
      name: string;
      code?: string;
      changes: string[];
      managerName?: string;
    };
  }) {
    const { user, project } = params;
    const projectUrl = `${this.baseUrl}/employee/my-projects`;

    const changeItems = project.changes
 .map((c) => `<li style="padding:4px 0;font-size:14px;color:#4a4a6a;">${c}</li>`)
 .join('');

    await this.send({
      to: user.email,
      subject: `📋 Project Updated – ${project.name}`,
      html: `
        <html>${this.style}<body>
          <div class="wrapper">
            <div class="card">
              ${this.header()}
              <h1>Project Details Updated</h1>
              <p>Hi <strong>${user.name}</strong>,</p>
              <p>The following changes have been made to <strong>${project.name}${project.code ? ` (${project.code})` : ''}</strong>:</p>
              <div class="summary-card">
                <ul style="margin:0;padding-left:20px;">${changeItems}</ul>
              </div>
              <div style="text-align:center;margin:24px 0;">
                <a href="${projectUrl}" class="btn">View Updated Project</a>
              </div>
              <p style="color:#9ca3af;font-size:13px;">Please review the changes and reach out to your project manager if you have any questions.</p>
            </div>
            ${this.footer()}
          </div>
        </body></html>
      `,
    });
  }

  async sendProjectRemovalEmail(params: {
    user: { name: string; email: string };
    project: { name: string; code?: string };
    reason?: string;
  }) {
    const { user, project } = params;
    const dashboardUrl = `${this.baseUrl}/employee/dashboard`;

    await this.send({
      to: user.email,
      subject: `ℹ️ You've Been Removed from ${project.name}`,
      html: `
        <html>${this.style}<body>
          <div class="wrapper">
            <div class="card">
              ${this.header()}
              <h1>Project Assignment Updated</h1>
              <p>Hi <strong>${user.name}</strong>,</p>
              <p>You are no longer assigned to <strong>${project.name}${project.code ? ` (${project.code})` : ''}</strong>.</p>
              ${params.reason ? `<p><strong>Reason:</strong> ${params.reason}</p>` : ''}
              <p>You can continue to access your other projects and tasks through the Employee Portal.</p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${dashboardUrl}" class="btn">Go to Dashboard</a>
              </div>
              <p style="color:#9ca3af;font-size:13px;">If you believe this change was made in error, please contact your manager.</p>
            </div>
            ${this.footer()}
          </div>
        </body></html>
      `,
    });
  }
}
