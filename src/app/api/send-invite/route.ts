import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, inviteUrl, orgName } = body as { to?: string; inviteUrl?: string; orgName?: string };

    if (!to || !inviteUrl) {
      return NextResponse.json({ error: "Missing 'to' or 'inviteUrl'" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !fromEmail) {
      return NextResponse.json({ error: "Server missing RESEND_API_KEY or RESEND_FROM_EMAIL" }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const subject = `You're invited to ${orgName ?? "our HRMS"}`;
    const html = `
      <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">You're invited${orgName ? ` to ${orgName}` : ""}!</h2>
        <p>Click the link below to set your password and join:</p>
        <p><a href="${inviteUrl}" target="_blank">${inviteUrl}</a></p>
        <p style="font-size: 12px; color: #6b7280;">If you didn't expect this, you can ignore this email.</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message ?? "Failed to send" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}


