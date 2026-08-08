"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import BackgroundPattern from "@/components/BackgroundPattern";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "react-toastify";
import {
  Loader2,
  ArrowLeft,
  Sprout,
  Activity,
  Calculator,
  Target,
  BarChart4,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Droplets,
  ThermometerSun,
  BookOpen,
} from "lucide-react";
import { CROPS_CATALOGUE } from "@/lib/crops";
import { T } from "@/components/TranslationContext";
import { motion, AnimatePresence } from "framer-motion";
import SpeechButton from "@/components/SpeechButton";
import YouTubeVideos from "@/components/YouTubeVideos";
import { Label } from "@/components/ui/label";

const GROWTH_STAGES = [
  "Sowing / Seedling Stage",
  "Vegetative / Growth Stage",
  "Flowering / Reproductive Stage",
  "Harvesting / Maturity Stage",
];

export default function YieldEstimationPage() {
  const [plots, setPlots] = useState<any[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>("");
  const [isLoadingPlots, setIsLoadingPlots] = useState(true);

  // Simple Inputs
  const [paddyType, setPaddyType] = useState("Rice (Paddy)");
  const [growthStage, setGrowthStage] = useState(GROWTH_STAGES[0]);
  const [notes, setNotes] = useState("");

  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchPlots();
  }, []);

  const fetchPlots = async () => {
    try {
      const res = await fetch("/api/plots");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPlots(data);
      if (data.length > 0) setSelectedPlotId(data[0]._id);
    } catch {
      toast.error("Failed to load your plots.");
    } finally {
      setIsLoadingPlots(false);
    }
  };

  const selectedPlot = plots.find((p) => p._id === selectedPlotId);
  const dbMoisture = selectedPlot?.soilData?.moisture;
  const dbTemperature = selectedPlot?.soilData?.temperature;
  const areaAcres = selectedPlot?.area ?? 1.0;

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlot) {
      toast.error("Select a plot first.");
      return;
    }
    setIsCalculating(true);
    setResult(null);

    try {
      const payload = {
        plotName: selectedPlot.name,
        state: selectedPlot.state,
        city: selectedPlot.city,
        pincode: selectedPlot.pincode,
        areaAcres: Number(areaAcres),
        paddyType,
        growthStage,
        moisture: dbMoisture !== undefined ? dbMoisture * 100 : 35,
        temperature: dbTemperature ?? 28,
        notes,
      };

      const res = await fetch("/api/yeild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to predict yield");

      setResult(data);
      toast.success("Yield forecast generated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-10 px-4 flex justify-center">
      <BackgroundPattern />

      <div className="w-full max-w-6xl z-10 relative">
        {/* ── HEADER ── */}
        <div className="text-center mb-10 relative">
          <div className="absolute left-0 top-0 hidden md:flex">
            <Link href="/">
              <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white border-2 border-black text-slate-800 hover:bg-slate-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> <T>Home</T>
              </button>
            </Link>
          </div>
          <div className="md:hidden mb-6 flex justify-start">
            <Link href="/">
              <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white border-2 border-black text-slate-800 hover:bg-slate-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> <T>Back</T>
              </button>
            </Link>
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-800">
            <T>Yield</T>{" "}
            <span className="bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              <T>Predictor</T>
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-550 font-bold tracking-tight mt-2">
            <T>Estimate your crop harvest and market revenue in Quintals and Rupees based on real plot soil indicators.</T>
          </p>
        </div>

        {/* ── MAIN 2-COLUMN LAYOUT ── */}
        <form onSubmit={handleCalculate} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 overflow-hidden">
              <div className="bg-linear-to-r from-emerald-500 to-teal-600 h-2 w-full border-b border-black" />
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <T>Prediction Settings</T>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-bold mt-1 leading-relaxed">
                  <T>Select your plot and select the crop details to predict expected yield.</T>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                {/* Select Plot */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-850 tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-600" /> <T>Select Plot</T>
                  </Label>
                  {isLoadingPlots ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  ) : plots.length === 0 ? (
                    <p className="text-sm text-rose-500 font-bold">
                      <T>No plots found. Create one first.</T>
                    </p>
                  ) : (
                    <select
                      className="w-full border-2 border-black rounded-xl p-3 bg-slate-50/85 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 text-sm font-bold text-slate-800 h-[46px] cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      value={selectedPlotId}
                      onChange={(e) => {
                        setSelectedPlotId(e.target.value);
                        setResult(null);
                      }}
                    >
                      {plots.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} — {p.area} Ac ({p.city})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedPlot && (
                  <div className="bg-slate-50/50 border-2 border-black rounded-xl p-3.5 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Area (Acres)</p>
                      <p className="text-xs font-extrabold text-slate-800">{areaAcres} Ac</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-0.5">
                        <Droplets className="w-3 h-3 text-sky-600" /> Moisture
                      </p>
                      <p className="text-xs font-extrabold text-slate-800">
                        {dbMoisture !== undefined ? `${(dbMoisture * 100).toFixed(0)}%` : "35% (Live)"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-0.5">
                        <ThermometerSun className="w-3 h-3 text-orange-500" /> Temp
                      </p>
                      <p className="text-xs font-extrabold text-slate-800">
                        {dbTemperature !== undefined ? `${dbTemperature}°C` : "28°C (Live)"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Crop Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-850 tracking-wider flex items-center gap-1">
                    <Sprout className="w-3.5 h-3.5 text-emerald-600" /> <T>Crop Type</T>
                  </Label>
                  <select
                    className="w-full border-2 border-black rounded-xl p-3 bg-slate-50/85 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 text-sm font-bold text-slate-800 h-[46px] cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    value={paddyType}
                    onChange={(e) => setPaddyType(e.target.value)}
                  >
                    {CROPS_CATALOGUE.map((crop) => (
                      <option key={crop.id} value={crop.name}>
                        {crop.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Growth Stage */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-850 tracking-wider flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-blue-600" /> <T>Growth Stage</T>
                  </Label>
                  <select
                    className="w-full border-2 border-black rounded-xl p-3 bg-slate-50/85 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 text-sm font-bold text-slate-800 h-[46px] cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                  >
                    {GROWTH_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Observations */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-slate-850 tracking-wider">
                    <T>Any Crop Stress or Observations? (Optional)</T>
                  </Label>
                  <textarea
                    rows={3}
                    placeholder="e.g. slight yellow leaves, no rain, pest spotted..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 bg-slate-50 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] resize-none"
                  />
                </div>

                {/* Submit button */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  type="submit"
                  disabled={isCalculating || !selectedPlotId}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-black bg-black text-white hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 text-base uppercase tracking-wider"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <T>Calculating...</T>
                    </>
                  ) : (
                    <>
                      <BarChart4 className="w-5 h-5" />
                      <T>Predict Yield</T>
                    </>
                  )}
                </motion.button>

              </CardContent>
            </Card>
          </div>

          {/* Right Column: Prediction Results Dashboard */}
          <div className="lg:col-span-7">
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 overflow-hidden flex flex-col min-h-[500px]">
              <div className="bg-linear-to-r from-amber-500 to-orange-600 h-2 w-full border-b border-black" />
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight justify-between">
                  <span className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-600" />
                    <T>Yield Forecast Dashboard</T>
                  </span>
                  {result && (
                    <SpeechButton
                      text={`Yield Prediction Report: Estimated yield is ${result.estimatedYieldMinQuintals} to ${result.estimatedYieldMaxQuintals} Quintals. Expected market value is ${result.marketValueMinRs} to ${result.marketValueMaxRs} Rupees. Soil Status is ${result.soilStatus}. advice: ${result.actionPlanSummary}`}
                      className="h-8 w-8 p-1.5 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grow flex flex-col justify-center">
                
                {/* Empty State */}
                {!result && !isCalculating && (
                  <div className="grow flex flex-col items-center justify-center text-center text-slate-500 space-y-4 py-12">
                    <div className="p-4 bg-slate-50 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Sprout className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-slate-900 text-lg">
                        <T>Ready for Yield Simulation</T>
                      </p>
                      <p className="text-sm max-w-sm text-slate-500 font-bold">
                        <T>Select your plot and click "Predict Yield" to generate an LLM forecast of crop production and mandi value.</T>
                      </p>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {isCalculating && (
                  <div className="grow flex flex-col items-center justify-center text-center space-y-4 py-12">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                    <p className="font-black text-slate-800 animate-pulse">
                      <T>Consulting regional MSP databases and simulating yields...</T>
                    </p>
                  </div>
                )}

                {/* Results View */}
                <AnimatePresence>
                  {result && !isCalculating && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 2.0, ease: "easeOut" }}
                      className="space-y-6"
                    >
                      {/* Metric cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Yield Range Card */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="bg-linear-to-br from-emerald-50 to-teal-50/50 border-2 border-black rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                        >
                          <div>
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                              <T>Expected Yield</T>
                            </p>
                            <h3 className="text-3xl font-black text-emerald-950 mt-1 leading-tight">
                              {result.estimatedYieldMinQuintals} - {result.estimatedYieldMaxQuintals} <span className="text-sm font-extrabold text-emerald-700 uppercase"><T>Quintals</T></span>
                            </h3>
                          </div>
                          <p className="text-[11px] font-bold text-emerald-700/80 mt-2">
                            ≈ {result.estimatedYieldMinKg.toLocaleString()} - {result.estimatedYieldMaxKg.toLocaleString()} kg
                          </p>
                        </motion.div>

                        {/* Revenue Card */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="bg-linear-to-br from-amber-50 to-orange-50/50 border-2 border-black rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                        >
                          <div>
                            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                              <T>Expected Mandi Revenue</T>
                            </p>
                            <h3 className="text-3xl font-black text-amber-950 mt-1 leading-tight">
                              ₹{result.marketValueMinRs.toLocaleString()} - ₹{result.marketValueMaxRs.toLocaleString()}
                            </h3>
                          </div>
                          <p className="text-[11px] font-bold text-amber-700/80 mt-2">
                            <T>Based on regional Mandi MSP rates</T>
                          </p>
                        </motion.div>
                      </div>

                      {/* Info strip */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* MSP Benchmark */}
                        <div className="bg-slate-50/60 border-2 border-black rounded-xl p-3.5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-black bg-white flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <Calculator className="w-5 h-5 text-slate-700" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider"><T>MSP Benchmark Rate</T></p>
                            <p className="text-sm font-extrabold text-slate-800">₹{result.mspRatePerQuintal} / <T>Quintal</T></p>
                          </div>
                        </div>

                        {/* Soil health */}
                        <div className="bg-slate-50/60 border-2 border-black rounded-xl p-3.5 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                            result.soilStatus === "Optimal" ? "bg-emerald-100" : result.soilStatus === "Sub-optimal" ? "bg-amber-100" : "bg-rose-100"
                          }`}>
                            <Activity className={`w-5 h-5 ${
                              result.soilStatus === "Optimal" ? "text-emerald-700" : result.soilStatus === "Sub-optimal" ? "text-amber-700" : "text-rose-700"
                            }`} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider"><T>Soil Health Status</T></p>
                            <p className="text-sm font-extrabold text-slate-850"><T>{result.soilStatus}</T></p>
                          </div>
                        </div>

                      </div>

                      {/* Soil health comment */}
                      <div className="bg-sky-50/50 border-2 border-black rounded-xl p-4 space-y-1">
                        <p className="text-[10px] font-black text-sky-850 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-sky-600" /> <T>Soil Analysis & Sensors</T>
                        </p>
                        <p className="text-xs text-sky-900 font-bold leading-relaxed">
                          <T>{result.soilAnalysis}</T>
                        </p>
                      </div>

                      {/* Agricultural Choices / Rotation */}
                      {result.cropRotationSuggestions && (
                        <div className="bg-emerald-50/50 border-2 border-black rounded-xl p-4 space-y-1">
                          <p className="text-[10px] font-black text-emerald-850 uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> <T>Other Crop & Rotation Advice</T>
                          </p>
                          <p className="text-xs text-emerald-900 font-bold leading-relaxed">
                            <T>{result.cropRotationSuggestions}</T>
                          </p>
                        </div>
                      )}

                      {/* Steps plan */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest"><T>AI Fertilizer & Management Steps</T></h4>
                        <ul className="space-y-2">
                          {result.actionPlanSteps.map((step: string, idx: number) => (
                            <li key={idx} className="bg-white border border-black rounded-xl p-3.5 flex items-start gap-3 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">
                                {idx + 1}
                              </span>
                              <p className="text-xs font-bold text-slate-650 leading-relaxed">
                                <T>{step}</T>
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

        </form>
        
        {paddyType && (
          <div className="mt-8">
            <YouTubeVideos query={`${paddyType} crop yield cultivation methods`} title={`${paddyType} Cultivation Guide Videos`} />
          </div>
        )}

      </div>
    </div>
  );
}
