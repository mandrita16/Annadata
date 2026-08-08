"use client";

import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BackgroundPattern from "@/components/BackgroundPattern";
import AuthButton from "@/components/AuthButton";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const [countdown, setCountdown] = React.useState(10);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/profile");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, router]);

  if (status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <BackgroundPattern />
        <Card className="w-full max-w-[400px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white overflow-hidden relative">
          <div className="h-16 bg-linear-to-r from-emerald-600 to-teal-600 flex items-center justify-center px-6 border-b border-emerald-500/30">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold tracking-tight text-lg">
                Access Authorized
              </span>
            </div>
          </div>

          <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center">
            <div className="mb-6 rounded-full bg-emerald-50 p-5 border border-emerald-100/50 shadow-inner">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <p className="text-slate-600 font-medium mb-6 text-[15px] px-2 leading-relaxed">
              You are currently authenticated as <br/>
              <span className="bg-linear-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent font-bold">
                {session?.user?.name || "User"}
              </span>
              .
            </p>

            <div className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-5 mb-6 shadow-sm">
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-3">
                Automatic Redirection
              </p>
              <div className="flex items-baseline justify-center gap-1.5 mb-4">
                <span className="text-4xl font-extrabold bg-linear-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  {countdown}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(countdown / 10) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => router.push("/profile")}
              className="group w-full rounded-xl px-6 py-3 font-bold bg-linear-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/15 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
            >
              Go to Profile
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-12">
      <BackgroundPattern />
      
      <Card className="w-full max-w-[400px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 backdrop-blur-sm z-10 overflow-hidden">
        <div className="h-2 bg-linear-to-r from-amber-500 via-orange-500 to-emerald-600 w-full" />
        <CardHeader className="text-center pt-8 pb-6 px-8">
          <CardTitle className="text-2xl sm:text-3xl capitalize font-extrabold text-slate-800 tracking-tight">
            Welcome <span className="bg-linear-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Back</span>
          </CardTitle>
          <CardDescription className="text-[15px] font-medium text-slate-500 mt-2">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <AuthButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
