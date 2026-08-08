"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth");
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full rounded-xl px-4 py-3 font-bold bg-linear-to-r from-rose-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/15 border-none transition-all cursor-pointer shadow-sm text-sm"
    >
      Sign Out
    </button>
  );
}
