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
<div style="max-width: 540px; margin: 0 auto; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  
  <!-- Header -->
  <div style="padding: 48px 32px 0; text-align: center;">
    <div style="width: 56px; height: 56px; background: #3b82f6; border-radius: 12px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="m22 21-3-3m0 0a5.05 5.05 0 0 0 0-7.07 5.05 5.05 0 0 0-7.07 0 5.05 5.05 0 0 0 0 7.07 5.05 5.05 0 0 0 7.07 0z"></path>
      </svg>
    </div>
    <h1 style="color: #111827; margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">
      Welcome aboard!
    </h1>
    <p style="color: #6b7280; margin: 0; font-size: 16px;">
      ${orgName ? `You've been invited to join ${orgName}` : "You've been invited to join our team"}
    </p>
  </div>

  <!-- Main Content -->
  <div style="padding: 40px 32px;">
    <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 3px solid #3b82f6;">
      <p style="color: #374151; margin: 0 0 16px; font-size: 15px;">
        Your HRMS account is ready to be activated. Click the button below to set up your password and access your dashboard.
      </p>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">
        This invitation expires in 7 days for security purposes.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${inviteUrl}" 
         style="display: inline-block; 
                background: #3b82f6; 
                color: white; 
                text-decoration: none; 
                padding: 14px 28px; 
                border-radius: 8px; 
                font-weight: 500; 
                font-size: 15px; 
                transition: background-color 0.2s ease;">
        Activate Account
      </a>
    </div>

    <!-- Features Grid -->
    <div style="margin: 40px 0 36px;">
      <p style="color: #334155; margin: 0 0 24px; font-size: 17px; font-weight: 600;">
        What you'll have access to:
      </p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; flex-shrink: 0;"></div>
          <span style="color: #64748b; font-size: 15px;">Employee dashboard</span>
        </div>
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; flex-shrink: 0;"></div>
          <span style="color: #64748b; font-size: 15px;">Time tracking</span>
        </div>
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; flex-shrink: 0;"></div>
          <span style="color: #64748b; font-size: 15px;">Leave management</span>
        </div>
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; flex-shrink: 0;"></div>
          <span style="color: #64748b; font-size: 15px;">Team collaboration</span>
        </div>
      </div>
    </div>

    <!-- Alternative Link -->
    <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 32px 0;">
      <p style="color: #64748b; margin: 0 0 10px; font-size: 14px; font-weight: 500;">
        Having trouble with the button? Copy this link:
      </p>
      <p style="color: #3b82f6; margin: 0; font-size: 13px; word-break: break-all; font-family: 'Monaco', 'Menlo', 'Consolas', monospace; background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
        ${inviteUrl}
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="padding: 24px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
      If you didn't request this invitation, please ignore this email.
    </p>
    <p style="color: #d1d5db; margin: 8px 0 0; font-size: 11px;">
      This is an automated message from your HRMS system.
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
