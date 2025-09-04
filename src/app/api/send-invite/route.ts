import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, inviteUrl, orgName } = body as {
      to?: string;
      inviteUrl?: string;
      orgName?: string;
    };

    if (!to || !inviteUrl) {
      return NextResponse.json(
        { error: "Missing 'to' or 'inviteUrl'" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !fromEmail) {
      return NextResponse.json(
        { error: "Server missing RESEND_API_KEY or RESEND_FROM_EMAIL" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const subject = `You're invited to ${orgName ?? "our HRMS"}`;
    const html = `
    <div style="max-width: 600px; margin: 0 auto; background: white; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
      <!-- Header with gradient -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 32px; text-align: center;">
        <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 16px; padding: 24px; display: inline-block;">
          <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
            🎉
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            You're invited${orgName ? ` to ${orgName}` : ""}!
          </h1>
        </div>
      </div>
    
      <!-- Main content -->
      <div style="padding: 40px 32px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="color: #64748b; margin: 0; font-size: 16px; line-height: 1.6;">
            We're excited to have you on board! Click the button below to set your password and get started.
          </p>
        </div>
    
        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
            Set Password & Join
          </a>
        </div>
    
        <!-- Alternative link -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #667eea;">
          <p style="color: #475569; margin: 0 0 8px; font-size: 14px; font-weight: 500;">
            Can't click the button? Copy and paste this link:
          </p>
          <p style="color: #667eea; margin: 0; font-size: 14px; word-break: break-all; font-family: Monaco, Menlo, Consolas, monospace; background: white; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
            ${inviteUrl}
          </p>
        </div>
    
        <!-- Features -->
        <div style="margin: 32px 0;">
          <h3 style="color: #1e293b; margin: 0 0 16px; font-size: 18px; font-weight: 600;">
            What's waiting for you:
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                🚀
              </div>
              <span style="color: #475569; font-size: 14px;">Quick setup process</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                🤝
              </div>
              <span style="color: #475569; font-size: 14px;">Join your team</span>
            </div>
          </div>
        </div>
      </div>
    
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #94a3b8; margin: 0; font-size: 12px; line-height: 1.5;">
          If you didn't expect this invitation, you can safely ignore this email.<br>
          This invitation will expire in 7 days.
        </p>
      </div>
    </div>
    `;

    const { error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Failed to send" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
