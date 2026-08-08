"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import BackgroundPattern from "@/components/BackgroundPattern";
import {
  Loader2,
  RefreshCw,
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  MapPin,
  AlertTriangle,
  Percent,
  IndianRupee,
  TrendingDown,
  Info,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────
interface InsuranceClaim {
  _id: string;
  claimId: string;
  plotSnapshot: {
    name: string;
    state: string;
    city: string;
    area: number;
    landmark: { name: string; address: string; lat?: number; lng?: number };
  };
  calamityType: string;
  calamityDescription: string;
  damagedPercentage: number;
  damagedAreaSqm: number;
  images: {
    selfie: string;
    landDocument: string;
    affectedCrop: string;
    fullLandView: string;
    landmark: string;
  };
  status: "pending" | "under_review" | "field_verification" | "approved" | "rejected" | "cancelled";
  aiAnalysis: {
    analysisStatus?: "pending" | "completed" | "failed";
    estimatedAmount?: number;
    interestRate?: number;
    netPayableAmount?: number;
    schemeName?: string;
    eligibilityRemark?: string;
    breakdownSummary?: string;
    recommendation?: string;
    analysisCompletedAt?: string;
  };
  reanalysisCount?: number;
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
    label: "Pending Review",
    icon: Clock,
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  under_review: {
    label: "Under Review",
    icon: Search,
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
    dot: "bg-blue-400",
  },
  field_verification: {
    label: "Field Verification",
    icon: MapPin,
    bg: "bg-purple-50",
    border: "border-purple-300",
    text: "text-purple-700",
    dot: "bg-purple-400",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    bg: "bg-slate-100",
    border: "border-slate-300",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
};

const IMAGE_LABELS = [
  { key: "selfie", label: "Farmer Selfie" },
  { key: "landDocument", label: "Land Document" },
  { key: "affectedCrop", label: "Affected Crop" },
  { key: "fullLandView", label: "Full Land View" },
  { key: "landmark", label: "Landmark" },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-800 text-right max-w-[55%]">{value}</span>
    </div>
  );
}

export default function InsuranceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession({
    required: true,
    onUnauthenticated() { router.push("/auth"); },
  });
  const [claim, setClaim] = useState<InsuranceClaim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let intervalId: any = null;
    if (status === "authenticated" && params?.id) {
      fetchClaim(params.id as string);
      
      // Auto-poll claim status every 3 seconds if calculation is in progress
      intervalId = setInterval(() => {
        if (claim && claim.aiAnalysis?.analysisStatus === "pending") {
          fetchClaim(params.id as string);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, params?.id, claim?.aiAnalysis?.analysisStatus]);

  const fetchClaim = async (id: string) => {
    try {
      const res = await fetch(`/api/insurance/${id}`);
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error("Failed");
      setClaim(await res.json());
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryAI = async () => {
    if (!claim) return;
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/insurance/${claim._id}/retry`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Retry failed");
      toast.success("Reanalysis completed successfully!");
      setClaim(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to run reanalysis.");
    } finally {
      setIsRetrying(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (notFound || !claim) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-slate-700">Claim Not Found</h2>
        <Link href="/insurance">
          <button className="mt-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            Back to Claims
          </button>
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[claim.status];
  const StatusIcon = statusConfig.icon;
  const isCompleted = claim.aiAnalysis?.analysisStatus === "completed" || !!claim.aiAnalysis?.analysisCompletedAt;
  const isFailed = claim.aiAnalysis?.analysisStatus === "failed";
  const hasCoordinates = typeof claim.plotSnapshot.landmark?.lat === "number" && typeof claim.plotSnapshot.landmark?.lng === "number";

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 flex justify-center">
      <BackgroundPattern />
      <div className="w-[80vw] max-w-[80vw] z-10 relative space-y-5">

        {/* Back */}
        <Link href="/insurance" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} /> All Claims
        </Link>

        {/* Header Card */}
        <div className="rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-linear-to-r from-amber-500 to-orange-600 h-1.5" />
          <div className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Claim ID</p>
                <p className="text-2xl font-black text-slate-800 font-mono">{claim.claimId}</p>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Filed {new Date(claim.createdAt).toLocaleDateString("en-IN", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-sm",
                  statusConfig.bg, statusConfig.border, statusConfig.text
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", statusConfig.dot)} />
                <StatusIcon size={16} />
                {statusConfig.label}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Column: Details & Images */}
          <div className="space-y-5">
            {/* Claim Details */}
            <div className="rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="bg-linear-to-r from-amber-500 to-orange-600 h-1.5" />
              <div className="p-6 space-y-1">
                <h2 className="text-lg font-black text-slate-800 mb-4">Claim Details</h2>
                <InfoRow label="Plot Name" value={claim.plotSnapshot.name} />
                <InfoRow label="State" value={claim.plotSnapshot.state} />
                <InfoRow label="City" value={claim.plotSnapshot.city} />
                <InfoRow label="Total Area" value={`${claim.plotSnapshot.area} acres (${(claim.plotSnapshot.area * 4046.86).toLocaleString("en-IN", { maximumFractionDigits: 0 })} sq. m)`} />
                <InfoRow label="Landmark" value={claim.plotSnapshot.landmark?.name || "—"} />
                <InfoRow label="Calamity" value={CALAMITY_LABELS[claim.calamityType]} />
                <InfoRow label="Damage" value={`${claim.damagedPercentage}% (${claim.damagedAreaSqm.toLocaleString("en-IN", { maximumFractionDigits: 0 })} sq. m)`} />
                <div className="pt-2">
                  <p className="text-sm font-bold text-slate-500 mb-1">Description</p>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-200">
                    {claim.calamityDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence Photos */}
            <div className="rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="bg-linear-to-r from-amber-500 to-orange-600 h-1.5" />
              <div className="p-6">
                <h2 className="text-lg font-black text-slate-800 mb-4">Evidence Photos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {IMAGE_LABELS.map(({ key, label }) => {
                    const src = claim.images[key as keyof typeof claim.images];
                    return (
                      <a
                        key={key}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group space-y-1.5"
                      >
                        <div className="aspect-video rounded-xl overflow-hidden border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[3px_3px_0px_0px_rgba(234,88,12,1)] group-hover:border-orange-500 transition-all">
                          <img src={src} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <p className="text-[11px] font-bold text-slate-600 text-center">{label}</p>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Analysis & Map */}
          <div className="space-y-5">
            {/* AI Analysis Card */}
            <div className={cn(
              "rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden",
              isCompleted ? "bg-white" : isFailed ? "bg-red-50/30" : "bg-slate-50"
            )}>
              <div className={cn("h-1.5", isCompleted ? "bg-linear-to-r from-emerald-500 to-teal-600" : isFailed ? "bg-red-500" : "bg-slate-200")} />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={20} className={isCompleted ? "text-emerald-600" : isFailed ? "text-red-500" : "text-slate-400"} />
                  <h2 className="text-lg font-black text-slate-800">PMFBY Insurance Assessment</h2>
                  {!isCompleted && !isFailed && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      <Loader2 size={11} className="animate-spin" /> Processing
                    </span>
                  )}
                </div>

                {isCompleted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Scheme */}
                    {claim.aiAnalysis.schemeName && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                        <FileText size={13} /> {claim.aiAnalysis.schemeName}
                      </div>
                    )}

                    {/* Payout Amount Card */}
                    <div className="p-5 rounded-2xl border-2 border-black bg-emerald-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <IndianRupee size={18} className="shrink-0" />
                          <span className="text-xs font-black uppercase tracking-widest"> Expected compensation</span>
                        </div>
                        <p className="text-3xl font-black text-emerald-800 leading-none">
                          ₹{(claim.aiAnalysis.netPayableAmount || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {/* Eligibility */}
                    {claim.aiAnalysis.eligibilityRemark && (
                      <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Eligibility</p>
                        <p className="text-sm font-medium text-blue-800">{claim.aiAnalysis.eligibilityRemark}</p>
                      </div>
                    )}

                    {/* Breakdown */}
                    {claim.aiAnalysis.breakdownSummary && (
                      <div className="p-4 rounded-xl border-2 border-black bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-2 mb-2">
                          <Info size={14} className="text-slate-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">How We Calculated</p>
                        </div>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">{claim.aiAnalysis.breakdownSummary}</p>
                      </div>
                    )}

                    {/* Recommendation */}
                    {claim.aiAnalysis.recommendation && (
                      <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Next Steps</p>
                        <p className="text-sm font-medium text-emerald-800 leading-relaxed">{claim.aiAnalysis.recommendation}</p>
                      </div>
                    )}

                    {/* Reanalysis Action */}
                    <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 flex-wrap">
                      <div className="text-xs font-semibold text-slate-500">
                        <span>Reanalyses run: <strong className="text-slate-800">{claim.reanalysisCount ?? 0} / 2</strong></span>
                      </div>
                      <button
                        onClick={handleRetryAI}
                        disabled={isRetrying || (claim.reanalysisCount ?? 0) >= 2}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-800 font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRetrying ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <RefreshCw size={13} />
                        )}
                        Request Reanalysis
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium">
                      Analysis completed: {new Date(claim.aiAnalysis.analysisCompletedAt!).toLocaleString("en-IN")}
                    </p>
                  </motion.div>
                ) : isFailed ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-red-200">
                      <XCircle size={32} className="text-red-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">Calculation Failed</p>
                      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                        The AI surveyor was unable to generate an assessment for this claim.
                      </p>
                      <p className="text-xs font-bold text-slate-400 mt-2">
                        Reanalyses run: {claim.reanalysisCount ?? 0} / 2
                      </p>
                    </div>
                    <button
                      onClick={handleRetryAI}
                      disabled={isRetrying || (claim.reanalysisCount ?? 0) >= 2}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-800 font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRetrying ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      Retry Reanalysis
                    </button>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Loader2 size={32} className="animate-spin text-amber-500 mx-auto mb-3" />
                    <p className="font-bold text-slate-600">Calculating your claim…</p>
                    <p className="text-sm text-slate-400 mt-1">Applying mathematical model. This takes just a moment.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Plot Location Map */}
            <div className="rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="bg-slate-200 h-1.5" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={20} className="text-slate-500" />
                  <h2 className="text-lg font-black text-slate-800">Plot Location</h2>
                </div>

                {hasCoordinates ? (
                  <div className="w-full aspect-video rounded-xl overflow-hidden border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight={0} 
                      marginWidth={0} 
                      src={`https://maps.google.com/maps?q=${claim.plotSnapshot.landmark.lat},${claim.plotSnapshot.landmark.lng}&t=k&z=17&output=embed`}
                    ></iframe>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                    <MapPin size={32} className="text-slate-300 mb-2" />
                    <p className="font-bold text-slate-500">No Geolocation Data Provided</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
