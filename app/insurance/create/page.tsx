"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import BackgroundPattern from "@/components/BackgroundPattern";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useFaceDetector } from "@/hooks/useFaceDetector";
import {
  MapPin,
  Loader2,
  CheckCircle2,
  Camera,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Maximize2,
  RefreshCw,
  User,
  FileText,
  Leaf,
  Landmark,
  Image as ImageIcon,
  CloudUpload,
  Shield,
  Sparkles,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Plot {
  _id: string;
  name: string;
  state: string;
  city: string;
  area: number;
  pincode: string;
  landmark: { name: string; address: string; lat: number; lng: number };
}

interface CapturedImages {
  selfie: string | null;
  landDocument: string | null;
  affectedCrop: string | null;
  fullLandView: string | null;
  landmark: string | null;
}

// ─── Calamity Options ───────────────────────────────────────────────────────
const CALAMITY_OPTIONS = [
  { id: "flood", label: "Flood", emoji: "🌊" },
  { id: "drought", label: "Drought", emoji: "🌵" },
  { id: "pest_attack", label: "Pest Attack", emoji: "🐛" },
  { id: "fire", label: "Fire", emoji: "🔥" },
  { id: "hailstorm", label: "Hailstorm", emoji: "🌨️" },
  { id: "cyclone", label: "Cyclone", emoji: "🌀" },
  { id: "landslide", label: "Landslide", emoji: "⛰️" },
  { id: "frost", label: "Frost", emoji: "❄️" },
  { id: "crop_disease", label: "Crop Disease", emoji: "🍂" },
  { id: "unseasonal_rain", label: "Unseasonal Rain", emoji: "🌧️" },
  { id: "other", label: "Other", emoji: "⚠️" },
];

// ─── Photo Slots ────────────────────────────────────────────────────────────
const PHOTO_SLOTS = [
  {
    key: "selfie" as const,
    label: "Farmer Selfie",
    description: "Front-facing photo of you clearly showing your face",
    icon: User,
    camera: "user",
    hint: "Use front camera • Face clearly visible",
  },
  {
    key: "landDocument" as const,
    label: "Land Document",
    description: "First page of land deed, title, or ownership document",
    icon: FileText,
    camera: "environment",
    hint: "Use rear camera • Full page visible",
  },
  {
    key: "affectedCrop" as const,
    label: "Affected Crop",
    description: "Close-up of a crop plant that has been damaged",
    icon: Leaf,
    camera: "environment",
    hint: "Use rear camera • Clear close-up shot",
  },
  {
    key: "fullLandView" as const,
    label: "Full Land View",
    description: "Wide landscape photo showing the entire affected land",
    icon: Maximize2,
    camera: "environment",
    hint: "Use rear camera • Landscape orientation",
  },
  {
    key: "landmark" as const,
    label: "Landmark Photo",
    description: "Photo of the landmark you registered during plot creation",
    icon: Landmark,
    camera: "environment",
    hint: "Use rear camera • Match your registered landmark",
  },
];

// ─── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ step, total }: { step: number; total: number }) {
  const steps = ["Plot", "Calamity", "Photos", "Review"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const isActive = idx === step;
        const isDone = idx < step;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border-2 border-black transition-all",
                  isActive
                    ? "bg-orange-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-slate-400"
                )}
              >
                {isDone ? <CheckCircle2 size={16} /> : idx}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wide",
                  isActive ? "text-orange-500" : isDone ? "text-emerald-600" : "text-slate-400"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-10 h-0.5 mb-5 rounded",
                  isDone ? "bg-emerald-500" : "bg-slate-200"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Camera Capture Component ───────────────────────────────────────────────
function CameraCapture({
  slot,
  onCapture,
  captured,
}: {
  slot: (typeof PHOTO_SLOTS)[0];
  onCapture: (key: string, url: string) => void;
  captured: string | null;
}) {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(captured);
  const Icon = slot.icon;

  const { isLoading, validateSelfie, validateSelfieVideoFrame, initDetector } = useFaceDetector();
  const [isValidating, setIsValidating] = useState(false);
  const [realTimeStatus, setRealTimeStatus] = useState<{ isValid: boolean; message: string } | null>(null);

  const openCamera = () => {
    setIsCameraOpen(true);
    if (slot.key === "selfie") {
      initDetector();
    }
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
  };

  // Real-time loop hook
  useEffect(() => {
    if (!isCameraOpen || slot.key !== "selfie") {
      setRealTimeStatus(null);
      return;
    }

    let active = true;
    let timerId: any = null;

    const runValidation = () => {
      if (!active) return;
      const video = webcamRef.current?.video;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const result = validateSelfieVideoFrame(video);
        setRealTimeStatus(result);
      }
      timerId = setTimeout(runValidation, 250);
    };

    // Delay loop start to allow video canvas mapping to boot up
    timerId = setTimeout(runValidation, 800);

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, [isCameraOpen, slot.key]);

  const capture = async () => {
    if (!webcamRef.current) return;
    const dataUrl = webcamRef.current.getScreenshot();
    if (!dataUrl) return;

    if (slot.key === "selfie") {
      setIsValidating(true);
      const validation = await validateSelfie(dataUrl);
      setIsValidating(false);

      if (!validation.isValid) {
        toast.error(validation.message);
        return; // keeps the camera active and prevents saving the image
      }
      toast.success("Selfie verified successfully!");
    }
    
    setLocalPreview(dataUrl);
    closeCamera();
    onCapture(slot.key, dataUrl);
  };

  const videoConstraints = {
    facingMode: slot.camera === "user" ? "user" : "environment",
  };

  const isCaptureDisabled = isLoading || isValidating || (slot.key === "selfie" && (!realTimeStatus || !realTimeStatus.isValid));

  return (
    <div className="rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b-2 border-black flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center">
          <Icon size={16} className="text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm">{slot.label}</p>
          <p className="text-[10px] text-slate-500 font-medium truncate">{slot.hint}</p>
        </div>
        {localPreview && (
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {isCameraOpen ? (
          <div className="space-y-3">
            <div className="relative rounded-xl border-2 border-black overflow-hidden bg-slate-900 flex items-center justify-center">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-auto object-contain"
                onUserMediaError={() => {
                  toast.error("Camera access denied or device not found.");
                  setIsCameraOpen(false);
                }}
              />
              {/* Centered Guide Overlay for Selfie */}
              {slot.key === "selfie" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[60%] h-[75%] rounded-[50%] border-2 border-dashed border-white/50 bg-black/10" />
                </div>
              )}
            </div>

            {slot.key === "selfie" && realTimeStatus && (
              <div className={cn(
                "flex items-center gap-2 text-xs font-black rounded-xl p-3 border-2 border-black justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all",
                realTimeStatus.isValid 
                  ? "bg-emerald-50 text-emerald-800" 
                  : "bg-amber-50 text-amber-800"
              )}>
                {realTimeStatus.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{realTimeStatus.message}</span>
              </div>
            )}

            {slot.key === "selfie" && !realTimeStatus && (isLoading || isValidating) && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 border border-dashed border-black rounded-lg p-2.5 justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                {isLoading ? "Downloading face recognition model..." : "Analyzing selfie frame..."}
              </div>
            )}

            <div className="flex gap-2">
              <button
                disabled={isCaptureDisabled}
                onClick={capture}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 text-white font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Preparing...
                  </>
                ) : isValidating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <Camera size={16} /> Capture
                  </>
                )}
              </button>
              <button
                disabled={isValidating}
                onClick={closeCamera}
                className="px-4 py-2.5 rounded-xl bg-white text-slate-700 font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : localPreview ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border-2 border-black">
              <img src={localPreview} alt={slot.label} className="w-full h-auto object-contain" />
            </div>
            <button
                onClick={openCamera}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white text-slate-600 font-bold border-2 border-black text-xs hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={13} /> Retake
              </button>
          </div>
        ) : (
          <button
            onClick={openCamera}
            className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50/50 transition-all group"
          >
            <Camera size={22} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
            <span className="text-xs font-bold text-slate-500 group-hover:text-orange-600">{slot.hint}</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function InsuranceCreatePage() {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const [step, setStep] = useState(1);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [calamityType, setCalamityType] = useState("");
  const [calamityDescription, setCalamityDescription] = useState("");
  const [damagedPercentage, setDamagedPercentage] = useState(50);
  const [capturedImages, setCapturedImages] = useState<CapturedImages>({
    selfie: null,
    landDocument: null,
    affectedCrop: null,
    fullLandView: null,
    landmark: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBrushingUp, setIsBrushingUp] = useState(false);
  const [loadingPlots, setLoadingPlots] = useState(true);

  useEffect(() => {
    if (status === "authenticated") fetchPlots();
  }, [status]);

  const fetchPlots = async () => {
    try {
      const res = await fetch("/api/plots");
      const data = await res.json();
      setPlots(data);
    } catch {
      toast.error("Could not load plots.");
    } finally {
      setLoadingPlots(false);
    }
  };

  const handleCapture = useCallback((key: string, url: string) => {
    setCapturedImages((prev) => ({ ...prev, [key]: url }));
  }, []);

  const allPhotosCaptured = PHOTO_SLOTS.every((s) => capturedImages[s.key]);

  const damagedAreaSqm = selectedPlot
    ? ((selectedPlot.area * 4046.86 * damagedPercentage) / 100)
    : 0;

  const handleBrushUp = async () => {
    if (!calamityDescription.trim()) return;
    setIsBrushingUp(true);
    try {
      const res = await fetch("/api/insurance/brush-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: calamityDescription, calamityType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCalamityDescription(data.enhancedText);
      toast.success("Description enhanced by AI!");
    } catch (err: any) {
      toast.error(err.message || "Failed to enhance text.");
    } finally {
      setIsBrushingUp(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlot || !calamityType || !calamityDescription || !allPhotosCaptured) {
      toast.error("Please complete all steps.");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Upload all 5 base64 images concurrently
      const uploadPromises = Object.entries(capturedImages).map(async ([key, dataUrl]) => {
        if (!dataUrl) throw new Error("Missing image");
        const blob = await (await fetch(dataUrl)).blob();
        const form = new FormData();
        form.append("file", blob, `insurance_${key}.jpg`);
        const uploadRes = await fetch("/api/upload-image", { method: "POST", body: form });
        if (!uploadRes.ok) throw new Error(`Upload failed for ${key}`);
        const { secure_url } = await uploadRes.json();
        return { key, url: secure_url };
      });

      const uploadedResults = await Promise.all(uploadPromises);
      const finalImageUrls: Record<string, string> = {};
      for (const res of uploadedResults) {
        finalImageUrls[res.key] = res.url;
      }

      // 2. Submit form with Cloudinary URLs
      const res = await fetch("/api/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plotId: selectedPlot._id,
          calamityType,
          calamityDescription,
          damagedPercentage,
          images: finalImageUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit");
      toast.success(`Claim ${data.claimId} submitted! AI analysis is running.`);
      router.push("/insurance");
    } catch (err: any) {
      toast.error(err.message || "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || loadingPlots) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 flex justify-center">
      <BackgroundPattern />
      <div className="w-full max-w-2xl z-10 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-800">
            File{" "}
            <span className="bg-linear-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Insurance
            </span>{" "}
            Claim
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-sm">
            PMFBY-aligned crop damage claim
          </p>
        </div>

        <StepIndicator step={step} total={4} />

        <AnimatePresence mode="wait">
          {/* ──── STEP 1: SELECT PLOT ──── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                <div className="bg-linear-to-r from-amber-500 to-orange-600 h-1.5 w-full" />
                <div className="p-6 space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Select Your Plot</h2>
                    <p className="text-slate-500 text-sm font-medium">Choose the affected agricultural plot</p>
                  </div>

                  {plots.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                      <MapPin size={32} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-bold">No plots registered</p>
                      <p className="text-slate-400 text-sm mt-1">Register a plot first to file a claim.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {plots.map((plot) => (
                        <button
                          key={plot._id}
                          onClick={() => setSelectedPlot(plot)}
                          className={cn(
                            "w-full text-left p-4 rounded-xl border-2 transition-all",
                            selectedPlot?._id === plot._id
                              ? "border-orange-500 bg-orange-50 shadow-[2px_2px_0px_0px_rgba(234,88,12,1)]"
                              : "border-black bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-800">{plot.name}</p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {plot.city}, {plot.state} · {plot.area} acres
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{plot.landmark.address}</p>
                            </div>
                            {selectedPlot?._id === plot._id && (
                              <CheckCircle2 size={20} className="text-orange-500 shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedPlot && (
                    <div className="p-4 rounded-xl border-2 border-black bg-slate-50 space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">Plot Info</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="font-bold text-slate-600">State:</span> <span className="text-slate-800">{selectedPlot.state}</span></div>
                        <div><span className="font-bold text-slate-600">City:</span> <span className="text-slate-800">{selectedPlot.city}</span></div>
                        <div><span className="font-bold text-slate-600">Area:</span> <span className="text-slate-800">{selectedPlot.area} acres</span></div>
                        <div><span className="font-bold text-slate-600">Pincode:</span> <span className="text-slate-800">{selectedPlot.pincode}</span></div>
                        <div className="col-span-2"><span className="font-bold text-slate-600">Landmark:</span> <span className="text-slate-800">{selectedPlot.landmark.name}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedPlot}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ──── STEP 2: CALAMITY DETAILS ──── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                <div className="bg-linear-to-r from-amber-500 to-orange-600 h-1.5 w-full" />
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Calamity Details</h2>
                    <p className="text-slate-500 text-sm font-medium">Describe the damage to your crops</p>
                  </div>

                  {/* Calamity Type */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">Type of Calamity</label>
                    <div className="flex flex-wrap gap-2">
                      {CALAMITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setCalamityType(opt.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all",
                            calamityType === opt.id
                              ? "border-orange-500 bg-orange-500 text-white shadow-[2px_2px_0px_0px_rgba(234,88,12,1)]"
                              : "border-black bg-white text-slate-700 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          )}
                        >
                          <span>{opt.emoji}</span> {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-700">Describe the Damage</label>
                      <button
                        onClick={handleBrushUp}
                        disabled={isBrushingUp || !calamityDescription.trim() || !calamityType}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg shadow-[1px_1px_0px_0px_rgba(59,130,246,0.3)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isBrushingUp ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        AI Brush Up
                      </button>
                    </div>
                    <textarea
                      value={calamityDescription}
                      onChange={(e) => setCalamityDescription(e.target.value)}
                      placeholder="Describe what happened — when it occurred, how the crop was damaged, current state of the field..."
                      rows={4}
                      className="w-full border-2 border-black rounded-xl p-3 bg-slate-50 text-sm font-medium text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition-all resize-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>

                  {/* Damaged % Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-700">Estimated Land Damaged</label>
                      <span className="text-2xl font-black text-orange-500">{damagedPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={damagedPercentage}
                      onChange={(e) => setDamagedPercentage(Number(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-400 font-bold">
                      <span>1%</span><span>50%</span><span>100%</span>
                    </div>
                    {selectedPlot && (
                      <div className="p-3 rounded-xl border-2 border-emerald-400 bg-emerald-50 shadow-[2px_2px_0px_0px_rgba(52,211,153,1)]">
                        <p className="text-sm font-black text-emerald-700">
                          Damaged Area:{" "}
                          <span className="text-emerald-800">
                            {damagedAreaSqm.toLocaleString("en-IN", { maximumFractionDigits: 0 })} sq. m
                          </span>
                          <span className="text-emerald-600 font-medium">
                            {" "}({(damagedAreaSqm / 4046.86).toFixed(2)} acres)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-700 font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!calamityType || calamityDescription.trim().length < 20}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ──── STEP 3: PHOTOS ──── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden mb-4">
                <div className="bg-linear-to-r from-amber-500 to-orange-600 h-1.5 w-full" />
                <div className="p-6 pb-4">
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Photo Evidence</h2>
                  <p className="text-slate-500 text-sm font-medium">
                    Capture all 5 required photos in real-time using your camera
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={13} />
                    All 5 photos are mandatory. Photos will be uploaded when you submit the final form.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {PHOTO_SLOTS.map((slot) => (
                  <CameraCapture
                    key={slot.key}
                    slot={slot}
                    onCapture={handleCapture}
                    captured={capturedImages[slot.key]}
                  />
                ))}
              </div>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-700 font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!allPhotosCaptured}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Review <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ──── STEP 4: REVIEW & SUBMIT ──── */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                <div className="bg-linear-to-r from-amber-500 to-orange-600 h-1.5 w-full" />
                <div className="p-6 space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Review Your Claim</h2>
                    <p className="text-slate-500 text-sm font-medium">Verify all details before submission</p>
                  </div>

                  {/* Plot Info */}
                  <div className="p-4 rounded-xl border-2 border-black bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Plot</p>
                    <p className="font-bold text-slate-800">{selectedPlot?.name}</p>
                    <p className="text-sm text-slate-600">{selectedPlot?.city}, {selectedPlot?.state} · {selectedPlot?.area} acres</p>
                  </div>

                  {/* Calamity Info */}
                  <div className="p-4 rounded-xl border-2 border-black bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Calamity</p>
                    <p className="font-bold text-slate-800">
                      {CALAMITY_OPTIONS.find((c) => c.id === calamityType)?.emoji}{" "}
                      {CALAMITY_OPTIONS.find((c) => c.id === calamityType)?.label}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">{calamityDescription}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-lg border-2 border-orange-400 bg-orange-50">
                        <p className="text-xs font-black text-orange-700">Damage: {damagedPercentage}%</p>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg border-2 border-emerald-400 bg-emerald-50">
                        <p className="text-xs font-black text-emerald-700">
                          Area: {damagedAreaSqm.toLocaleString("en-IN", { maximumFractionDigits: 0 })} sq. m
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Photos Grid */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Evidence Photos</p>
                    <div className="grid grid-cols-5 gap-2">
                      {PHOTO_SLOTS.map((slot) => (
                        <div key={slot.key} className="space-y-1">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-black">
                            {capturedImages[slot.key] ? (
                              <img src={capturedImages[slot.key]!} alt={slot.label} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <ImageIcon size={16} className="text-slate-400" />
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] font-bold text-slate-500 text-center leading-tight">{slot.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculation Notice */}
                  <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 shadow-[2px_2px_0px_0px_rgba(16,185,129,0.4)]">
                    <div className="flex items-start gap-3">
                      <Shield size={20} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-emerald-800">Automatic PMFBY Calculation</p>
                        <p className="text-xs text-emerald-700 mt-0.5 font-medium">
                          After submission, our mathematical algorithm will automatically estimate your insurance payout amount, applicable interest rate, and scheme details strictly as per PMFBY norms.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-700 font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Submitting…</>
                  ) : (
                    <><CloudUpload size={18} /> Submit Claim</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
