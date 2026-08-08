"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundPattern from "@/components/BackgroundPattern";
import { Loader2, Shield, Search, MapPin, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────
interface InsuranceClaim {
  _id: string;
  claimId: string;
  plotSnapshot: { name: string; state: string; city: string; area: number };
  calamityType: string;
  damagedPercentage: number;
  damagedAreaSqm: number;
  status: "pending" | "under_review" | "field_verification" | "approved" | "rejected" | "cancelled";
  createdAt: string;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, class: "bg-amber-50 text-amber-700 border-amber-300" },
  under_review: { label: "Under Review", icon: Search, class: "bg-blue-50 text-blue-700 border-blue-300" },
  field_verification: { label: "Field Verif.", icon: MapPin, class: "bg-purple-50 text-purple-700 border-purple-300" },
  approved: { label: "Approved", icon: CheckCircle2, class: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  rejected: { label: "Rejected", icon: XCircle, class: "bg-red-50 text-red-700 border-red-300" },
  cancelled: { label: "Cancelled", icon: XCircle, class: "bg-slate-100 text-slate-600 border-slate-300" },
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "field_verification", label: "Field Verification" },
  { value: "approved", label: "Approved" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminInsurancePanel() {
  const router = useRouter();
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const res = await fetch("/api/admin/insurance");
      if (!res.ok) throw new Error("Failed to fetch claims");
      setClaims(await res.json());
    } catch (err: any) {
      toast.error(err.message || "Failed to load claims.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/insurance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      toast.success("Claim status updated!");
      // Update local state
      setClaims((prev) =>
        prev.map((claim) => (claim._id === id ? { ...claim, status: newStatus as any } : claim))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update claim.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 flex flex-col items-center">
      <BackgroundPattern />
      <div className="w-full max-w-6xl z-10 relative">

        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 text-xs font-black uppercase tracking-widest border-2 border-red-200 rounded-lg mb-3">
            <AlertTriangle size={14} /> Admin Access Only
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-800">
            Claims{" "}
            <span className="bg-linear-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Control Panel
            </span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">Manage and update all insurance claims across the platform.</p>
        </div>

        {/* Claims Table */}
        <div className="rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-linear-to-r from-slate-800 to-black h-2 w-full" />
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-black">
                  <th className="p-4 font-black text-slate-800 text-sm">Claim ID</th>
                  <th className="p-4 font-black text-slate-800 text-sm">Location & Details</th>
                  <th className="p-4 font-black text-slate-800 text-sm">Damage</th>
                  <th className="p-4 font-black text-slate-800 text-sm text-center">Status</th>
                  <th className="p-4 font-black text-slate-800 text-sm text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <Shield size={48} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-lg font-bold text-slate-600">No claims found.</p>
                    </td>
                  </tr>
                ) : (
                  claims.map((claim) => {
                    const config = STATUS_CONFIG[claim.status];
                    const StatusIcon = config?.icon || Shield;

                    return (
                      <tr 
                        key={claim._id} 
                        onClick={() => router.push(`/admin/insurance/${claim._id}`)}
                        className="border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="p-4">
                          <span className="font-black text-slate-800 font-mono text-sm bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
                            {claim.claimId}
                          </span>
                          <p className="text-[10px] font-bold text-slate-400 mt-2">
                            {new Date(claim.createdAt).toLocaleDateString("en-IN")}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{claim.plotSnapshot.name}</p>
                          <p className="text-xs text-slate-500 font-medium">
                            {claim.plotSnapshot.city}, {claim.plotSnapshot.state}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800 capitalize">{claim.calamityType.replace("_", " ")}</p>
                          <p className="text-xs text-red-500 font-bold">{claim.damagedPercentage}% Damaged</p>
                        </td>
                        <td className="p-4 text-center">
                          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border", config?.class)}>
                            <StatusIcon size={12} />
                            {config?.label || claim.status}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <select
                              value={claim.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStatusChange(claim._id, e.target.value);
                              }}
                              disabled={updatingId === claim._id}
                              className="px-3 py-2 rounded-lg bg-white border-2 border-black font-bold text-xs text-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all disabled:opacity-50 appearance-none cursor-pointer"
                            >
                              {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            {updatingId === claim._id && <Loader2 size={16} className="animate-spin text-teal-600" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
