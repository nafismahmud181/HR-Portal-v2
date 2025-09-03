"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/admin");
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsub();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("sent");
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof FirebaseError ? err.message : "Unable to send reset email.");
    }
  }

  if (checkingAuth) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#ffffff] text-[#1a1a1a]">
      <div className="w-full max-w-[420px]">
        <Link href="/login" className="text-[14px] text-[#f97316]">← Back to login</Link>
        <h1 className="mt-4 text-[24px] font-semibold">Forgot password</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Enter your email and we’ll send you a reset link.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block mb-1 text-[14px] font-medium text-[#374151]">Email</label>
            <input
              id="email"
              type="email"
              required
              className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-md bg-[#1f2937] text-white px-4 py-3 text-[16px] font-medium hover:bg-[#111827] disabled:opacity-60"
          >
            {status === "loading" ? "Sending..." : "Send reset link"}
          </button>

          {message ? (
            <p className={`text-[14px] ${status === "error" ? "text-[#ef4444]" : "text-[#10b981]"}`}>{message}</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}


