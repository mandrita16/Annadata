"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BackgroundPattern from "@/components/BackgroundPattern";
import {
  Loader2,
  ArrowLeft,
  Shield,
  MapPin,
  FileText,
  AlertTriangle,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Percent,
  TrendingDown,
  Info
} from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

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
  createdAt: string;
}

const CALAMITY_LABELS: Record<string, string> = {
  flood: "Flood",
  drought: "Drought",
  pest_attack: "Pest Attack",
  fire: "Fire",
  hailstorm: "Hailstorm",
  cyclone: "Cyclone",
  landslide: "Landslide",
  frost: "Frost",
  crop_disease: "Crop Disease",
  unseasonal_rain: "Unseasonal Rain",
  other: "Other",
};

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", dot: "bg-amber-400" },
  under_review: { label: "Under Review", icon: Search, bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", dot: "bg-blue-400" },
  field_verification: { label: "Field Verification", icon: MapPin, bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", dot: "bg-purple-400" },
  approved: { label: "Approved", icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", icon: XCircle, bg: "bg-red-50", border: "border-red-300", text: "text-red-700", dot: "bg-red-500" },
  cancelled: { label: "Cancelled", icon: XCircle, bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-600", dot: "bg-slate-400" },
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

export default function AdminInsuranceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [claim, setClaim] = useState<InsuranceClaim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchClaim(params.id as string);
    }
  }, [params?.id]);

  const fetchClaim = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/insurance/${id}`);
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error("Failed");
      setClaim(await res.json());
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!claim) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/insurance/${claim._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Status updated!");
      setClaim((prev) => prev ? { ...prev, status: newStatus as any } : null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update claim.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (notFound || !claim) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4">
        <Shield size={48} className="text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-700">Claim Not Found</h2>
        <Link href="/admin/insurance">
          <button className="mt-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            Back to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[claim.status];
  const StatusIcon = statusConfig.icon;
  const isCompleted = claim.aiAnalysis?.analysisStatus === "completed" || !!claim.aiAnalysis?.analysisCompletedAt;
  
  const hasCoordinates = typeof claim.plotSnapshot.landmark?.lat === "number" && typeof claim.plotSnapshot.landmark?.lng === "number";

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 flex justify-center">
      <BackgroundPattern />
      <div className="w-[80vw] max-w-[80vw] z-10 relative space-y-5">

        {/* Back */}
        <Link href="/admin/insurance" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} /> Admin Dashboard
        </Link>
        
        {/* Admin Header */}
        

        {/* Header Card */}
        <div className="rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-linear-to-r from-slate-800 to-black h-2" />
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Claim ID</p>
                <p className="text-3xl font-black text-slate-800 font-mono">{claim.claimId}</p>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Filed {new Date(claim.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Current Status</p>
                <div className="flex items-center gap-2">
                    <select
                        value={claim.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updatingStatus}
                        className={cn(
                            "px-4 py-2 rounded-xl border-2 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden appearance-none cursor-pointer",
                            statusConfig.bg, statusConfig.border, statusConfig.text
                        )}
                    >
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="field_verification">Field Verification</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    {updatingStatus && <Loader2 size={18} className="animate-spin text-slate-600" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Column: Details & Images */}
            <div className="space-y-5">
                {/* Claim Details */}
                <div className="rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-slate-200 h-1.5" />
                <div className="p-6 space-y-1">
                    <h2 className="text-lg font-black text-slate-800 mb-4">Plot & Claim Data</h2>
                    <InfoRow label="Plot Name" value={claim.plotSnapshot.name} />
                    <InfoRow label="State" value={claim.plotSnapshot.state} />
                    <InfoRow label="City" value={claim.plotSnapshot.city} />
                    <InfoRow label="Total Area" value={`${claim.plotSnapshot.area} acres (${(claim.plotSnapshot.area * 4046.86).toLocaleString("en-IN", { maximumFractionDigits: 0 })} sq. m)`} />
                    <InfoRow label="Landmark" value={claim.plotSnapshot.landmark?.name || "—"} />
                    <InfoRow label="Address" value={claim.plotSnapshot.landmark?.address || "—"} />
                    <InfoRow label="Calamity" value={CALAMITY_LABELS[claim.calamityType] || claim.calamityType} />
                    <InfoRow label="Damage" value={`${claim.damagedPercentage}% (${claim.damagedAreaSqm.toLocaleString("en-IN", { maximumFractionDigits: 0 })} sq. m)`} />
                    <div className="pt-2">
                    <p className="text-sm font-bold text-slate-500 mb-1">Calamity Description (Farmer)</p>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-200">
                        {claim.calamityDescription}
                    </p>
                    </div>
                </div>
                </div>

                {/* Evidence Photos */}
                <div className="rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-slate-200 h-1.5" />
                <div className="p-6">
                    <h2 className="text-lg font-black text-slate-800 mb-4">Evidence Gallery</h2>
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
                            <div className="aspect-video rounded-xl overflow-hidden border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[3px_3px_0px_0px_rgba(13,148,136,1)] group-hover:border-teal-600 transition-all">
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
                {/* AI / Math Analysis Card */}
                <div className={cn(
                    "rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white"
                )}>
                <div className="bg-linear-to-r from-emerald-500 to-teal-600 h-1.5" />
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                    <Shield size={20} className="text-emerald-600" />
                    <h2 className="text-lg font-black text-slate-800">Mathematical Assessment (PMFBY)</h2>
                    </div>

                    {isCompleted ? (
                    <div className="space-y-4">
                        {/* Scheme */}
                        {claim.aiAnalysis.schemeName && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                            <FileText size={13} /> {claim.aiAnalysis.schemeName}
                        </div>
                        )}

                        {/* Amount Cards */}
                        <div className="grid grid-cols-3 gap-3">
                        <div className="p-4 rounded-xl border-2 border-black bg-emerald-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-1 text-emerald-600 mb-1">
                            <IndianRupee size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wide">Gross Est.</span>
                            </div>
                            <p className="text-xl font-black text-emerald-800">
                            ₹{(claim.aiAnalysis.estimatedAmount || 0).toLocaleString("en-IN")}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border-2 border-black bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-1 text-amber-600 mb-1">
                            <Percent size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wide">Interest</span>
                            </div>
                            <p className="text-xl font-black text-amber-800">
                            {claim.aiAnalysis.interestRate}%
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border-2 border-black bg-teal-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-1 text-teal-600 mb-1">
                            <TrendingDown size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wide">Net Payout</span>
                            </div>
                            <p className="text-xl font-black text-teal-800">
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
                        
                    </div>
                    ) : (
                        <div className="py-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                            <p className="font-bold text-slate-500">Mathematical analysis not completed.</p>
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
