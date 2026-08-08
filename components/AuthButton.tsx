"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import { FcGoogle } from "react-icons/fc";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  callbackUrl?: string;
}

export default function AuthButton({
  callbackUrl = "/profile",
  className = "",
  onClick,
  ...props
}: AuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("google", { callbackUrl, redirect: true });
      if (result?.error) {
        toast.error(result.error || "Failed to sign in with Google");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading || props.disabled}
      className={`
        group relative flex items-center justify-center
        w-full rounded-xl px-4 py-3 gap-3
        border border-slate-200 shadow-sm bg-white
        text-slate-800 font-bold text-sm tracking-tight
        hover:bg-slate-50 hover:border-orange-200 hover:shadow-md
        focus:outline-none focus:ring-4 focus:ring-orange-500/10
        transition-all duration-200 select-none
        disabled:opacity-75 disabled:cursor-not-allowed disabled:pointer-events-none
        ${className}
      `}
      type="button"
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        <FcGoogle
          size={22}
          className="shrink-0 transition-transform duration-300 group-hover:scale-110"
        />
      )}

      <span className="text-slate-800 font-bold  tracking-tight truncate">
        {loading ? "Connecting to Google..." : "Continue with Google"}
      </span>
    </button>
  );
}
