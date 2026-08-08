"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackgroundPattern from "@/components/BackgroundPattern";
import { Loader2, Shield, Plus, ChevronRight, Clock, CheckCircle2, XCircle, Search, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────
interface InsuranceClaim {
  _id: string;
  claimId: string;
  plotSnapshot: { name: string; state: string; city: string; area: number };
  calamityType: string;
  damagedPercentage: number;
  damagedAreaSqm: number;
  status: "pending" | "under_review" | "field_verification" | "approved" | "rejected" | "cancelled";
  aiAnalysis: {
    estimatedAmount?: number;
    interestRate?: number;
    netPayableAmount?: number;
    schemeName?: string;
    analysisCompletedAt?: string;
  };
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CALAMITY_LABELS: Record<string, string> = {
  flood: "🌊 Flood",
  drought: "🌵 Drought",
  pest_attack: "🐛 Pest Attack",
  fire: "🔥 Fire",
  hailstorm: "🌨️ Hailstorm",
  cyclone: "🌀 Cyclone",
  landslide: "⛰️ Landslide",
  frost: "❄️ Frost",
  crop_disease: "🍂 Crop Disease",
  unseasonal_rain: "🌧️ Unseasonal Rain",
  other: "⚠️ Other",
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    class: "bg-amber-50 text-amber-700 border-amber-300",
    dot: "bg-amber-400",
  },
  under_review: {
    label: "Under Review",
    icon: Search,
    class: "bg-blue-50 text-blue-700 border-blue-300",
    dot: "bg-blue-400",
  },
  field_verification: {
    label: "Field Verif.",
    icon: MapPin,
    class: "bg-purple-50 text-purple-700 border-purple-300",
    dot: "bg-purple-400",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    class: "bg-emerald-50 text-emerald-700 border-emerald-300",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    class: "bg-red-50 text-red-700 border-red-300",
    dot: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    class: "bg-slate-100 text-slate-600 border-slate-300",
    dot: "bg-slate-400",
  },
};

function StatusBadge({ status }: { status: InsuranceClaim["status"] }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
        config.class
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

export default function InsuranceDashboard() {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() { router.push("/auth"); },
  });
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") fetchClaims();
  }, [status]);

  const fetchClaims = async () => {
    try {
      const res = await fetch("/api/insurance");
      if (!res.ok) throw new Error("Failed");
      setClaims(await res.json());
    } catch {
      toast.error("Failed to load claims.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 flex flex-col items-center">
      <BackgroundPattern />
      <div className="w-full max-w-4xl z-10 relative">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-800">
              My{" "}
              <span className="bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Claims
              </span>
            </h1>
            <p className="text-slate-500 font-medium mt-2">Track your crop insurance claims</p>
          </div>
          <Link href="/insurance/create">
            <button className="flex items-center gap-2 rounded-xl px-5 py-3 font-bold bg-orange-500 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all whitespace-nowrap">
              <Plus size={18} /> New Claim
            </button>
          </Link>
        </div>

        {/* Stats Bar */}
        {claims.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8">
            {(["pending", "under_review", "field_verification", "approved", "rejected", "cancelled"] as const).map((s) => {
              const count = claims.filter((c) => c.status === s).length;
              const config = STATUS_CONFIG[s];
              return (
                <div
                  key={s}
                  className={cn(
                    "rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                    config.class.split(" ")[0]
                  )}
                >
                  <p className="text-2xl font-black text-slate-800">{count}</p>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">{config.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Claims List */}
        {claims.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-black rounded-3xl bg-white/60 backdrop-blur-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Shield size={48} className="text-slate-300 mb-4" />
            <h3 className="text-2xl font-bold text-slate-700 mb-2">No Claims Yet</h3>
            <p className="text-slate-500 max-w-sm mb-6 font-medium">
              You haven't filed any insurance claims. File a claim if your crops were damaged.
            </p>
            <Link href="/insurance/create">
              <button className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                File Your First Claim
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim, i) => (
              <motion.div
                key={claim._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/insurance/${claim._id}`}>
                  <div className="group rounded-2xl border-2 border-black bg-white/95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all overflow-hidden">
                    <div className="bg-linear-to-r from-amber-500 to-orange-600 h-1 w-full" />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="font-black text-slate-800 font-mono text-sm bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              {claim.claimId}
                            </span>
                            <StatusBadge status={claim.status} />
                          </div>
                          <p className="font-bold text-slate-800 text-lg">
                            {claim.plotSnapshot.name}
                          </p>
                          <p className="text-sm text-slate-500 font-medium">
                            {CALAMITY_LABELS[claim.calamityType]} ·{" "}
                            {claim.damagedPercentage}% damaged ·{" "}
                            {claim.plotSnapshot.city}, {claim.plotSnapshot.state}
                          </p>
                          <p className="text-xs text-slate-400 font-medium mt-1">
                            Filed {new Date(claim.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "long", year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {claim.aiAnalysis?.netPayableAmount ? (
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Est. Payout</p>
                              <p className="text-xl font-black text-emerald-600">
                                ₹{claim.aiAnalysis.netPayableAmount.toLocaleString("en-IN")}
                              </p>
                            </div>
                          ) : (
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400">AI Analysis</p>
                              <p className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                <Loader2 size={11} className="animate-spin" /> Processing…
                              </p>
                            </div>
                          )}
                          <ChevronRight
                            size={18}
                            className="text-slate-400 group-hover:text-orange-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
