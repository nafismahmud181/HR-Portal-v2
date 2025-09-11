"use client";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAuthErrorMessage } from "@/lib/auth-errors";

function ResetPasswordPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const oobCode = params.get("oobCode");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "verifying" | "ready" | "submitting" | "done" | "error">("verifying");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    async function verify() {
      if (!oobCode) {
        setStatus("error");
        setMessage("Invalid or missing reset code.");
        return;
      }
      try {
        const mail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(mail);
        setStatus("ready");
      } catch (err: unknown) {
        setStatus("error");
        setMessage(getAuthErrorMessage(err));
      }
    }
    verify();
  }, [oobCode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!oobCode) return;
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setMessage("");
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("done");
      setMessage("Password updated. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(getAuthErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#ffffff] text-[#1a1a1a]">
      <div className="w-full max-w-[420px]">
        <Link href="/login" className="text-[14px] text-[#f97316]">← Back to login</Link>
        <h1 className="mt-4 text-[24px] font-semibold">Reset password</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">{email ? `for ${email}` : "Verifying link..."}</p>

        {status === "verifying" ? (
          <p className="mt-8 text-[14px] text-[#6b7280]">Verifying reset link…</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="password" className="block mb-1 text-[14px] font-medium text-[#374151]">New password</label>
              <input
                id="password"
                type="password"
                required
                className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block mb-1 text-[14px] font-medium text-[#374151]">Confirm new password</label>
              <input
                id="confirm"
                type="password"
                required
                className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-md bg-[#1f2937] text-white px-4 py-3 text-[16px] font-medium hover:bg-[#111827] disabled:opacity-60"
            >
              {status === "submitting" ? "Updating…" : "Update password"}
            </button>
            {message ? (
              <p className={`text-[14px] ${status === "error" ? "text-[#ef4444]" : "text-[#10b981]"}`}>{message}</p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center px-6" aria-busy="true" />}> 
      <ResetPasswordPageInner />
    </Suspense>
  );
}


