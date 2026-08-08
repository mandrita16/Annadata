"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flower,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Spade,
  Droplet,
  TrendingUp,
  Clock,
  Sparkles,
  TrendingDown,
  Info,
  Calendar,
  AlertCircle,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BackgroundPattern from "@/components/BackgroundPattern";
import SpeechButton from "@/components/SpeechButton";
import { useTranslation } from "@/components/TranslationContext";
import YouTubeVideos from "@/components/YouTubeVideos";

interface Plot {
  _id: string;
  name: string;
  state: string;
  city: string;
  pincode: string;
  area: number;
  soilData?: {
    moisture?: number;
    temperature?: number;
  };
}

interface FloricultureReport {
  score: number;
  recommendationText: string;
  explanation: string;
  suitabilityWhy: string;
  beforePlanting: string;
  careWarnings: string;
  wateringAdvice: string;
  fertilizerAdvice: string;
  growingDuration: string;
  floweringPeriod: string;
  profitPotential: string;
  marketDemand: string;
  finalRecommendation: string;
}

const FLOWERS = [
  "Aster (Aster / Taraka Pushpa)",
  "Carnation (Carnation)",
  "Chrysanthemum (Guldaudi / Shevanti)",
  "Crossandra (Kanakambaram / Aboli)",
  "Dahlia (Dahlia)",
  "Gerbera (Gerbera / Transvaal Daisy)",
  "Gladiolus (Gladiolus)",
  "Hibiscus (Gudhal / Jaswand)",
  "Jasmine (Mogra / Chameli)",
  "Lotus (Kamal)",
  "Marigold (Genda / Zendu)",
  "Orchid (Orchid)",
  "Rose (Gulab)",
  "Sunflower (Surajmukhi)",
  "Tuberose (Rajnigandha)",
  "Tulip (Tulip)",
];

export default function FloriculturePlannerPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const { language, translateText } = useTranslation();
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedFlower, setSelectedFlower] = useState("");
  const [loadingPlots, setLoadingPlots] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<FloricultureReport | null>(null);

  // Speedometer sweep state from 0
  const [needleAngle, setNeedleAngle] = useState(-90);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPlots();
    }
  }, [status]);

  useEffect(() => {
    if (report) {
      // First force needle to rest at 0 index (-90 degrees)
      setNeedleAngle(-90);
      // Sweep gradually to target angle
      const timer = setTimeout(() => {
        setNeedleAngle(-90 + (report.score * 1.8));
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setNeedleAngle(-90);
    }
  }, [report]);

  const fetchPlots = async () => {
    try {
      const res = await fetch("/api/plots");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPlots(data);
      if (data.length > 0) {
        setSelectedPlotId(data[0]._id);
      }
    } catch {
      toast.error("Could not load your registered plots.");
    } finally {
      setLoadingPlots(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlotId || !selectedFlower) {
      toast.error("Please select both a plot and a flower.");
      return;
    }

    setIsAnalyzing(true);
    setReport(null);

    try {
      const res = await fetch("/api/floriculture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plotId: selectedPlotId,
          flowerType: selectedFlower,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to analyze suitability.");
      }

      const data = await res.json();
      setReport(data);
      toast.success("Suitability analysis completed!");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during suitability assessment.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!session?.user?.email) {
      toast.error("User email not found. Please log in.");
      return;
    }
    if (!report) return;

    setIsSendingEmail(true);
    try {
      const translate = async (text: string) => {
        return language === "en" ? text : await translateText(text);
      };

      const titleText = `Floriculture Suitability Analysis: ${selectedFlower}`;
      const scoreText = `Suitability Score: ${report.score} / 100`;
      const recText = `Recommendation: ${report.recommendationText}`;
      const explanationLabel = `Explanation`;
      const whyLabel = `Why this flower is suitable or not`;
      const beforeLabel = `What you should do before planting`;
      const warningsLabel = `Things to be careful about`;
      const waterLabel = `Watering advice`;
      const fertLabel = `Basic fertilizer recommendations`;
      const durationLabel = `Expected growing duration`;
      const flowerLabel = `Approximate flowering period`;
      const profitLabel = `Expected profit potential`;
      const demandLabel = `Expected market demand`;
      const finalLabel = `Final recommendation`;

      const [
        translatedTitle,
        translatedScore,
        translatedRec,
        translatedExplLabel,
        translatedExplText,
        translatedWhyLabel,
        translatedWhyText,
        translatedBeforeLabel,
        translatedBeforeText,
        translatedWarningsLabel,
        translatedWarningsText,
        translatedWaterLabel,
        translatedWaterText,
        translatedFertLabel,
        translatedFertText,
        translatedDurationLabel,
        translatedDurationText,
        translatedFlowerLabel,
        translatedFlowerText,
        translatedProfitLabel,
        translatedProfitText,
        translatedDemandLabel,
        translatedDemandText,
        translatedFinalLabel,
        translatedFinalText
      ] = await Promise.all([
        translate(titleText),
        translate(scoreText),
        translate(recText),
        translate(explanationLabel),
        translate(report.explanation),
        translate(whyLabel),
        translate(report.suitabilityWhy),
        translate(beforeLabel),
        translate(report.beforePlanting),
        translate(warningsLabel),
        translate(report.careWarnings),
        translate(waterLabel),
        translate(report.wateringAdvice),
        translate(fertLabel),
        translate(report.fertilizerAdvice),
        translate(durationLabel),
        translate(report.growingDuration),
        translate(flowerLabel),
        translate(report.floweringPeriod),
        translate(profitLabel),
        translate(report.profitPotential),
        translate(demandLabel),
        translate(report.marketDemand),
        translate(finalLabel),
        translate(report.finalRecommendation)
      ]);

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #000000; border-radius: 12px; background-color: #ffffff; box-shadow: 4px 4px 0px 0px #000000;">
          <div style="border-bottom: 2px solid #000000; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase;">
              Tatva Agro
            </h1>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
              ${translatedTitle}
            </p>
          </div>

          <div style="margin-bottom: 20px; background-color: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #166534;">${translatedScore}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: #15803d;">${translatedRec}</p>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: #1e3a1e;">${translatedExplText}</p>
          </div>

          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #374151; text-transform: uppercase;">${translatedWhyLabel}</h3>
            <p style="margin: 0; font-size: 13px; color: #4b5563;">${translatedWhyText}</p>
          </div>

          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #374151; text-transform: uppercase;">${translatedBeforeLabel}</h3>
            <p style="margin: 0; font-size: 13px; color: #4b5563;">${translatedBeforeText}</p>
          </div>

          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #374151; text-transform: uppercase;">${translatedWarningsLabel}</h3>
            <p style="margin: 0; font-size: 13px; color: #4b5563;">${translatedWarningsText}</p>
          </div>

          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #374151; text-transform: uppercase;">${translatedWaterLabel}</h3>
            <p style="margin: 0; font-size: 13px; color: #4b5563;">${translatedWaterText}</p>
          </div>

          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #374151; text-transform: uppercase;">${translatedFertLabel}</h3>
            <p style="margin: 0; font-size: 13px; color: #4b5563;">${translatedFertText}</p>
          </div>

          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #374151; text-transform: uppercase;">${translatedDurationLabel}</h3>
            <p style="margin: 0; font-size: 13px; color: #4b5563;">${translatedDurationText}</p>
          </div>

          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #374151; text-transform: uppercase;">${translatedFlowerLabel}</h3>
            <p style="margin: 0; font-size: 13px; color: #4b5563;">${translatedFlowerText}</p>
          </div>

          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #374151; text-transform: uppercase;">${translatedProfitLabel}</h3>
            <p style="margin: 0; font-size: 13px; color: #4b5563;">${translatedProfitText}</p>
          </div>

          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #374151; text-transform: uppercase;">${translatedDemandLabel}</h3>
            <p style="margin: 0; font-size: 13px; color: #4b5563;">${translatedDemandText}</p>
          </div>

          <div style="margin-bottom: 15px; border-top: 1px dashed #cccccc; padding-top: 10px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #374151; text-transform: uppercase;">${translatedFinalLabel}</h3>
            <p style="margin: 0; font-size: 13px; color: #4b5563; font-weight: bold;">${translatedFinalText}</p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 11px; color: #9ca3af;">
            © ${new Date().getFullYear()} Tatva Team. All rights reserved.
          </div>
        </div>
      `;

      const res = await fetch("/api/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: session.user.email,
          subject: `Tatva Agro: Floriculture Suitability Report - ${selectedFlower}`,
          html: htmlContent,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Suitability report successfully emailed!");
      } else {
        throw new Error(data.error || "Failed to send email");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loadingPlots) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  // Determine colors based on suitability score
  const getScoreColor = (score: number) => {
    if (score < 40) return { text: "text-rose-600", bg: "bg-rose-50 border-rose-200", stroke: "#ef4444" };
    if (score < 70) return { text: "text-amber-600", bg: "bg-amber-50 border-amber-200", stroke: "#eab308" };
    return { text: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", stroke: "#10b981" };
  };

  // Generate ticks for the gauge
  const ticks = Array.from({ length: 11 }, (_, i) => i * 10);
  const selectedPlot = plots.find((p) => p._id === selectedPlotId);

  // Compile full text summary for audio playback
  const speechText = report
    ? `Suitability Analysis Report for growing ${selectedFlower} on plot ${selectedPlot?.name || "selected plot"}.
       Score is ${report.score} out of 100. Overall recommendation is ${report.recommendationText}.
       Explanation: ${report.explanation}.
       Why it is suitable: ${report.suitabilityWhy}.
       Before planting steps: ${report.beforePlanting}.
       Watering: ${report.wateringAdvice}.
       Fertilizer: ${report.fertilizerAdvice}.
       Expected duration: ${report.growingDuration}.
       Market potential: ${report.profitPotential}.`
    : "";

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 flex justify-center">
      <BackgroundPattern />
      <div className="w-[85vw] max-w-[85vw] z-10 relative space-y-6">
        
        {/* Title */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Floriculture Planning</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Select a plot and a flower crop to check suitability and receive simple planting guides.
            </p>
          </div>
          {report && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 border-black bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-xs font-black uppercase text-slate-800 dark:text-slate-200 cursor-pointer disabled:opacity-60 shrink-0"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" /> Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 text-orange-500" /> Send to Email
                  </>
                )}
              </button>
              <span className="text-xs font-bold text-slate-500">Listen to report:</span>
              <SpeechButton text={speechText} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Selector (Left Panel) */}
          <div className="lg:col-span-4 rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b-2 border-slate-100 pb-3">
              <Spade size={18} className="text-orange-500" /> Plot & Crop Selection
            </h2>

            {plots.length === 0 ? (
              <div className="p-4 rounded-xl bg-orange-50 border-2 border-orange-200 text-orange-800 text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="shrink-0" />
                <span>Please register a plot first to run the analysis.</span>
              </div>
            ) : (
              <form onSubmit={handleAnalyze} className="space-y-4">
                {/* Plot Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor="plot-select" className="text-xs font-black uppercase tracking-wider text-slate-500">Select Plot</label>
                  <select
                    id="plot-select"
                    value={selectedPlotId}
                    onChange={(e) => {
                      setSelectedPlotId(e.target.value);
                      setReport(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-black font-semibold text-slate-700 bg-white focus:outline-none transition-all text-sm"
                  >
                    {plots.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.area} Acres - {p.city}, {p.state})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plot Snapshot Info */}
                {selectedPlot && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <p className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">Active Plot Stats</p>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 font-semibold pt-1">
                      <div>Moisture: {selectedPlot.soilData?.moisture ? `${selectedPlot.soilData.moisture.toFixed(0)}%` : "N/A"}</div>
                      <div>Temp: {selectedPlot.soilData?.temperature ? `${selectedPlot.soilData.temperature.toFixed(0)}°C` : "N/A"}</div>
                    </div>
                  </div>
                )}

                {/* Flower Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor="flower-select" className="text-xs font-black uppercase tracking-wider text-slate-500">Select Flower Crop</label>
                  <select
                    id="flower-select"
                    value={selectedFlower}
                    onChange={(e) => {
                      setSelectedFlower(e.target.value);
                      setReport(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-black font-semibold text-slate-700 bg-white focus:outline-none transition-all text-sm"
                  >
                    <option value="">-- Choose a Flower --</option>
                    {FLOWERS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isAnalyzing || !selectedFlower}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Flower className="w-4 h-4" /> Check Suitability
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Results dashboard (Right Panel) */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-black text-slate-800">Assessing Flower Suitability</h3>
                  <p className="text-sm text-slate-400 font-semibold mt-1">
                    Analyzing weather patterns, local soil readings, and regional farming guidelines...
                  </p>
                </motion.div>
              )}

              {report && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 2.0, ease: "easeOut" }} // Premium 2s exit/entrance as requested
                  className="space-y-6"
                >
                  {/* Gauge & Primary Assessment */}
                  <div className="rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col items-center">
                    
                    {/* Semi-circular Speedometer Gauge */}
                    <div className="w-72 h-44 relative flex flex-col items-center justify-center overflow-hidden bg-white/80 rounded-2xl border-2 border-slate-200 p-4 shadow-sm">
                      <div className="w-64 h-32 relative flex items-end justify-center overflow-hidden">
                        <svg viewBox="0 0 100 52" className="w-full h-full">
                          <defs>
                            {/* Dashboard color gradient */}
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="45%" stopColor="#eab308" />
                              <stop offset="75%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                            {/* Realistic drop shadow filter */}
                            <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0.4" dy="1.2" stdDeviation="0.6" floodOpacity="0.25"/>
                            </filter>
                          </defs>

                          {/* Outer Delicate Calibration Ring */}
                          <path
                            d="M 12 46 A 38 38 0 0 1 88 46"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="0.5"
                            strokeDasharray="1.5,1.5"
                          />

                          {/* Grey Background Path */}
                          <path
                            d="M 15 46 A 35 35 0 0 1 85 46"
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth="6"
                            strokeLinecap="round"
                          />

                          {/* Active Gradient Sweep Path */}
                          <path
                            d="M 15 46 A 35 35 0 0 1 85 46"
                            fill="none"
                            stroke="url(#gaugeGradient)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray="110"
                            strokeDashoffset={110 - (110 * report.score) / 100}
                            className="transition-all duration-1000 ease-out"
                          />

                          {/* High-Precision Subdivision Ticks (51 marks total) */}
                          {Array.from({ length: 51 }).map((_, valIndex) => {
                            const val = valIndex * 2;
                            const isMain = val % 10 === 0;
                            const angle = 180 - (val * 1.8);
                            const rad = (angle * Math.PI) / 180;
                            const rOuter = 34.5;
                            const rInner = isMain ? 31.5 : 33;
                            const x1 = 50 + rOuter * Math.cos(rad);
                            const y1 = 46 - rOuter * Math.sin(rad);
                            const x2 = 50 + rInner * Math.cos(rad);
                            const y2 = 46 - rInner * Math.sin(rad);
                            return (
                              <line
                                key={val}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={isMain ? "#64748b" : "#cbd5e1"}
                                strokeWidth={isMain ? "0.6" : "0.3"}
                              />
                            );
                          })}

                          {/* Numeric Ticks */}
                          {[0, 20, 40, 60, 80, 100].map((val) => {
                            const angle = 180 - (val * 1.8);
                            const rad = (angle * Math.PI) / 180;
                            const x = 50 + 26 * Math.cos(rad);
                            const y = 46 - 26 * Math.sin(rad);
                            return (
                              <text
                                key={val}
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="3"
                                className="fill-slate-500 font-bold font-mono select-none"
                              >
                                {val}
                              </text>
                            );
                          })}

                          {/* Speedometer Needle Pointer */}
                          <g
                            style={{
                              transform: `rotate(${needleAngle}deg)`,
                              transformOrigin: "50px 46px",
                              transition: "transform 3s cubic-bezier(0.25, 1, 0.5, 1)",
                            }}
                            filter="url(#needleShadow)"
                          >
                            {/* Bold Tapered Pointer Needle */}
                            <polygon
                              points="48.5,46 50,6 51.5,46"
                              fill="#f43f5e"
                              stroke="#be123c"
                              strokeWidth="0.5"
                            />
                          </g>

                          {/* Metallic Brushed Center Pin Hub */}
                          <circle cx="50" cy="46" r="5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                          <circle cx="50" cy="46" r="3.2" fill="#f1f5f9" stroke="#64748b" strokeWidth="0.5" />
                          <circle cx="50" cy="46" r="1.2" fill="#be123c" />
                        </svg>
                      </div>

                      {/* Light-Themed Odometer Scorecard */}
                      <div className="flex flex-col items-center gap-0.5 mt-2">
                        <div className="px-5 py-1.5 bg-slate-50 border-2 border-slate-200 text-slate-700 font-mono text-xl font-black rounded-lg shadow-inner min-w-[70px] text-center">
                          {report.score}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Suitability Index</span>
                      </div>
                    </div>

                    {/* Recommendation Title & Explanation */}
                    <div className="text-center mt-3 space-y-2 max-w-lg">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 font-black text-sm",
                        getScoreColor(report.score).bg, getScoreColor(report.score).text, "border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      )}>
                        {report.score >= 70 ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <AlertTriangle size={16} />
                        )}
                        {report.recommendationText}
                      </span>
                      <p className="text-sm font-bold text-slate-600 leading-relaxed pt-1">
                        {report.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Supportive Report Cards (Actionable sections) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Suitability */}
                    <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1.5 hover:scale-[1.02] transition-transform">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500" /> Suitability Analysis
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                        {report.suitabilityWhy}
                      </p>
                    </div>

                    {/* Preparation */}
                    <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1.5 hover:scale-[1.02] transition-transform">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <Info size={16} className="text-blue-500" /> Before Planting Steps
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                        {report.beforePlanting}
                      </p>
                    </div>

                    {/* Warnings */}
                    <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1.5 hover:scale-[1.02] transition-transform">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-rose-500" /> Things to be Careful About
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                        {report.careWarnings}
                      </p>
                    </div>

                    {/* Watering */}
                    <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1.5 hover:scale-[1.02] transition-transform">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <Droplet size={16} className="text-sky-500" /> Watering Advice
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                        {report.wateringAdvice}
                      </p>
                    </div>

                    {/* Fertilizer */}
                    <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1.5 hover:scale-[1.02] transition-transform">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <Spade size={16} className="text-emerald-500" /> Fertilizer Advice
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                        {report.fertilizerAdvice}
                      </p>
                    </div>

                    {/* Timeline Details */}
                    <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2 hover:scale-[1.02] transition-transform">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                        <Calendar size={16} className="text-indigo-500" /> Growing Timeline
                      </h3>
                      <div className="space-y-1 text-xs font-semibold text-slate-600">
                        <div>Growing Duration: <span className="text-slate-800 font-bold">{report.growingDuration}</span></div>
                        <div>Flowering Period: <span className="text-slate-800 font-bold">{report.floweringPeriod}</span></div>
                      </div>
                    </div>

                    {/* Market potential */}
                    <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2 hover:scale-[1.02] transition-transform md:col-span-2">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                        <TrendingUp size={16} className="text-orange-500" /> Economic Forecast
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">Profit Potential</p>
                          <p className="text-slate-800 font-bold pt-0.5">{report.profitPotential}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">Market Demand</p>
                          <p className="text-slate-800 font-bold pt-0.5">{report.marketDemand}</p>
                        </div>
                      </div>
                    </div>

                    {/* Final recommendation */}
                    <div className="p-5 rounded-2xl border-2 border-black bg-orange-50/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1.5 md:col-span-2 hover:scale-[1.01] transition-transform">
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-orange-500" /> Summary Recommendation
                      </h3>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">
                        {report.finalRecommendation}
                      </p>
                    </div>
                  </div>

                  {/* YouTube Tutorials */}
                  <YouTubeVideos
                    query={`${selectedFlower} cultivation farming India`}
                    title={`Best practices for growing ${selectedFlower}`}
                  />
                </motion.div>
              )}

              {!report && !isAnalyzing && (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center bg-slate-50/50">
                  <Flower className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-600 text-base">No Analysis Conducted Yet</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    Select one of your registered plots and a flower crop on the left, then click Check Suitability to run the analysis.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
