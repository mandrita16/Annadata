"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import BackgroundPattern from "@/components/BackgroundPattern";
import OTPInput from "@/components/OTPInput";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  User as UserIcon,
  Lock,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [hash, setHash] = useState(""); // Store hash from backend

  // Handlers
  const handleVerify = async () => {
    if (!name || !email) {
      toast.error("Please enter both name and email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setHash(data.hash);
      toast.success("Verification code sent to your email");
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 14) {
      toast.error("Password must be 8-14 characters long");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, hash, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.success("Password reset successfully! Can login now.");
      router.push("/auth");
    } catch (error: any) {
      toast.error(error.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-12">
      <BackgroundPattern />

      <Card className="w-full max-w-[400px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 backdrop-blur-sm z-10 overflow-hidden ">
        <div className="h-2 bg-linear-to-r from-amber-500 via-orange-500 to-emerald-600 w-full" />
        <CardHeader className="text-center pt-8 pb-4 px-8">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            {step === 1 ? (
              <>
                Forgot{" "}
                <span className="bg-linear-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  Password
                </span>
              </>
            ) : (
              <>
                Reset{" "}
                <span className="bg-linear-to-r from-emerald-600 to-teal-650 bg-clip-text text-transparent">
                  Password
                </span>
              </>
            )}
          </CardTitle>
          <CardDescription className="text-[14px] font-medium text-slate-450 mt-2 leading-relaxed">
            {step === 1
              ? "Enter your details to verify your identity"
              : "Enter the code sent to your email and set a new password"}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8 px-8 space-y-5">
          {step === 1 ? (
            <>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-bold flex items-center gap-2 text-xs">
                  <UserIcon className="w-4 h-4 text-amber-500" /> Name
                </Label>
                <Input
                  placeholder="Enter your full name"
                  className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 h-[42px] text-sm font-medium text-slate-800 transition-all duration-200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-bold flex items-center gap-2 text-xs">
                  <Mail className="w-4 h-4 text-emerald-600" /> Email
                </Label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 h-[42px] text-sm font-medium text-slate-800 transition-all duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full rounded-xl px-4 py-3 font-bold bg-linear-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/15 border-none transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-sm text-sm"
              >
                {loading ? "Verifying..." : "Verify & Send Code"}
              </button>

              <div className="text-center pt-2">
                <button
                  onClick={() => router.push("/auth")}
                  className="text-sm font-bold text-slate-450 hover:text-orange-500 transition-colors flex items-center justify-center gap-1.5 mx-auto border-none bg-transparent cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: OTP & New Password */}
              <div className="text-center space-y-2">
                <div className="rounded-full bg-emerald-50 p-4 border border-emerald-100/50 shadow-inner w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-500">
                  Code sent to{" "}
                  <span className="font-bold text-slate-800">{email}</span>
                </p>
              </div>

              <div className="flex justify-center py-2">
                <OTPInput length={6} onComplete={(code) => setOtp(code)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700 font-bold flex items-center gap-2 text-xs">
                  <Lock className="w-4 h-4 text-emerald-600" /> New Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 h-[42px] text-sm font-medium text-slate-800 transition-all duration-200 pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 bg-transparent border-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full rounded-xl px-4 py-3 font-bold bg-linear-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/15 border-none transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-sm text-sm mt-2"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="text-center pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 hover:underline bg-transparent border-none cursor-pointer"
                >
                  Change Email/Name
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
