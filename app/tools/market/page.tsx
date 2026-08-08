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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  TrendingUp,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Map,
} from "lucide-react";
import { CROPS_CATALOGUE } from "@/lib/crops";
import { T } from "@/components/TranslationContext";
import { motion, AnimatePresence } from "framer-motion";
import SpeechButton from "@/components/SpeechButton";
import YouTubeVideos from "@/components/YouTubeVideos";

const MAJOR_MARKETS = [
  "Andhra Pradesh (Guntur Chilli APMC)",
  "Arunachal Pradesh (Naharlagun APMC, Itanagar)",
  "Assam (Fancy Bazar Mandi, Guwahati)",
  "Bihar (Musallahpur APMC Mandi, Patna)",
  "Chhattisgarh (Krishi Upaj Mandi, Raipur)",
  "Delhi (Azadpur APMC Mandi)",
  "Goa (Panaji Wholesale Market)",
  "Gujarat (Unjha Spice APMC / Ahmedabad APMC)",
  "Haryana (Karnal Grain APMC Mandi)",
  "Himachal Pradesh (Dhalli Apple APMC, Shimla)",
  "Jharkhand (Pandra APMC Krishi Bazar, Ranchi)",
  "Karnataka (Yeshwanthpur Grain APMC, Bangalore)",
  "Kerala (Chalai Wholesale Market, Trivandrum)",
  "Madhya Pradesh (Choithram APMC Mandi, Indore)",
  "Maharashtra (Vashi APMC Mandi, Navi Mumbai)",
  "Manipur (Ima Keithel Mothers Market, Imphal)",
  "Meghalaya (Iew Duh Bara Bazar, Shillong)",
  "Mizoram (Bara Bazar Mandi, Aizawl)",
  "Nagaland (Mao APMC Market, Kohima)",
  "Odisha (Chatra Bazar APMC Mandi, Cuttack)",
  "Punjab (Khanna Grain APMC, Ludhiana)",
  "Rajasthan (Muhana Vegetable APMC, Jaipur)",
  "Sikkim (Lal Wholesale Market, Gangtok)",
  "Tamil Nadu (Koyambedu Wholesale APMC, Chennai)",
  "Telangana (Bowenpally APMC, Hyderabad)",
  "Tripura (Maharajganj APMC Mandi, Agartala)",
  "Uttar Pradesh (Naveen Galla Mandi, Lucknow)",
  "Uttarakhand (Niranjanpur APMC Mandi, Dehradun)",
  "West Bengal (Koley Wholesale Mandi, Kolkata)",
];

export default function MarketPredictionPage() {
  // Farmer Inputs
  const [cropName, setCropName] = useState("Rice (Paddy)");
  const [estimatedYield, setEstimatedYield] = useState("4000"); // kg
  const [totalCost, setTotalCost] = useState("35000"); // INR
  const [targetMarketCity, setTargetMarketCity] = useState(MAJOR_MARKETS[0]);

  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);

    try {
      const payload = {
        cropName,
        estimatedYield: Number(estimatedYield),
        totalCost: Number(totalCost),
        targetMarketCity,
        farmAreaM2: 0,
      };

      const res = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setResult(data.data);
      toast.success("Market dynamics predicted successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 flex justify-center">
      <BackgroundPattern />

      <div className="w-full max-w-[80vw] z-10 relative">
        {/* ── HEADER ── */}
        <div className="text-center mb-6 relative">
          <div className="absolute left-0 top-0 hidden md:flex">
            <Link href="/">
              <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white border-2 border-black text-slate-800 hover:bg-slate-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Home
              </button>
            </Link>
          </div>
          <div className="md:hidden mb-6 flex justify-start">
            <Link href="/">
              <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white border-2 border-black text-slate-800 hover:bg-slate-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </Link>
          </div>
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-800">
            Market{" "}
            <span className="bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Predictor
            </span>
          </h1>
          <p className="mx-auto max-w-[65vw] text-lg sm:text-xl text-slate-500 font-medium tracking-tight mt-1">
            Forecast price trends and estimate{" "}
            <span className="font-bold bg-linear-to-r from-emerald-650 to-teal-650 bg-clip-text text-transparent">
              profitability
            </span>
            .
          </p>
        </div>

        {/* ── MAIN GRID (Two Equal Columns) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* ── COLUMN 1: Simple Market Settings Form ── */}
          <div>
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 overflow-hidden">
              <div className="bg-linear-to-r from-amber-500 to-orange-600 h-1.5 w-full" />
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-orange-500" /> Crop &
                  Target Market
                </CardTitle>
              </CardHeader>
              <CardContent className="">
                <form onSubmit={handleCalculate} className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-slate-400" />{" "}
                      Economics
                    </p>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">
                        Crop Type
                      </Label>
                      <select
                        className="w-full border border-black rounded-xl p-2.5 bg-slate-50/85 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 text-sm font-medium text-slate-800 h-[42px] cursor-pointer"
                        value={cropName}
                        onChange={(e) => setCropName(e.target.value)}
                      >
                        {CROPS_CATALOGUE.map((crop) => (
                          <option key={crop.id} value={crop.name}>
                            {crop.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">
                          Est. Yield (kg)
                        </Label>
                        <Input
                          type="number"
                          required
                          value={estimatedYield}
                          onChange={(e) => setEstimatedYield(e.target.value)}
                          className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 h-[42px] text-sm font-medium text-slate-800 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">
                          Total Cost (₹)
                        </Label>
                        <Input
                          type="number"
                          required
                          value={totalCost}
                          onChange={(e) => setTotalCost(e.target.value)}
                          className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 h-[42px] text-sm font-medium text-slate-800 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Map className="w-3.5 h-3.5 text-slate-450" /> Destination
                    </p>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">
                        Target Market City
                      </Label>
                      <select
                        className="w-full border border-black rounded-xl p-2.5 bg-slate-50/85 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 text-sm font-medium text-slate-800 h-[42px] cursor-pointer"
                        value={targetMarketCity}
                        onChange={(e) => setTargetMarketCity(e.target.value)}
                      >
                        {MAJOR_MARKETS.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isCalculating}
                      className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold bg-linear-to-r from-blue-700 to-indigo-800 text-white hover:shadow-lg hover:shadow-blue-500/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {isCalculating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Fetching
                          AI Intelligence...
                        </>
                      ) : (
                        <>
                          <BarChart4 className="w-4 h-4" /> AI Auto-Predict
                          Market
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* ── COLUMN 2: Results Dashboard ── */}
          <div>
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 overflow-hidden flex flex-col min-h-[380px]">
              <div className="bg-linear-to-r from-emerald-500 to-teal-600 h-1.5 w-full" />
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-xl font-bold text-slate-850 flex items-center gap-2 tracking-tight">
                  <Target className="w-5 h-5 text-emerald-600" /> <T>Market Insights</T>
                  {result && (
                    <SpeechButton
                      text={`${result.summary}. ${result.marketInsight}`}
                      className="h-7 w-7 p-1 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-lg ml-1"
                    />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grow flex flex-col">
                {!result && !isCalculating && (
                  <div className="grow flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-slate-50 border-2 border-black flex items-center justify-center shadow-inner">
                      <TrendingUp className="w-10 h-10 text-slate-350" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-700 text-lg">
                        <T>No forecasts yet</T>
                      </p>
                      <p className="text-sm text-slate-455 font-medium max-w-xs leading-relaxed">
                        <T>Select your crop and target market, then let AI estimate current prices and profitability.</T>
                      </p>
                    </div>
                  </div>
                )}

                {isCalculating && (
                  <div className="grow flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    <p className="font-bold text-slate-750 animate-pulse">
                      <T>Consulting commodity pricing indices...</T>
                    </p>
                  </div>
                )}

                <AnimatePresence>
                  {result && !isCalculating && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 2.0, ease: "easeOut" }}
                      className="space-y-4"
                    >
                    <div className="bg-sky-50/50 border-2 border-black rounded-xl p-4">
                      <p className="text-sm font-semibold text-slate-700 italic leading-relaxed">
                        "<T>{result.summary}</T>"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-linear-to-br from-sky-50 to-indigo-50/50 border-2 border-black rounded-xl p-4 flex flex-col justify-center gap-1 hover:shadow-sm transition-all duration-200 cursor-pointer"
                      >
                        <p className="text-[9px] font-bold text-sky-850 uppercase tracking-wider">
                          <T>Target Price</T>
                        </p>
                        <p className="text-2xl font-extrabold text-sky-900 leading-tight">
                          ₹{result.predictedPrice.toFixed(1)}
                          <span className="text-xs font-bold text-sky-700/80 border-none bg-transparent">
                            /kg
                          </span>
                        </p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-linear-to-br from-emerald-50 to-teal-50/50 border-2 border-black rounded-xl p-4 flex flex-col justify-center gap-1 hover:shadow-sm transition-all duration-200 cursor-pointer"
                      >
                        <p className="text-[9px] font-bold text-emerald-850 uppercase tracking-wider">
                          <T>Net Profit</T>
                        </p>
                        <p className="text-2xl font-extrabold text-emerald-950 leading-tight">
                          ₹{result.profitability.toFixed(0)}
                        </p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`border-2 border-black rounded-xl p-4 flex flex-col justify-center gap-1 hover:shadow-sm transition-all duration-200 cursor-pointer ${
                          result.sellableStatus === "Highly Sellable" ||
                          result.sellableStatus === "Yes"
                            ? "bg-linear-to-br from-emerald-50 to-teal-50/50 text-emerald-900"
                            : "bg-linear-to-br from-rose-50 to-orange-50/50 text-rose-900"
                        }`}
                      >
                        <p className="text-[9px] font-bold opacity-80 uppercase tracking-wider">
                          <T>Sellable</T>
                        </p>
                        <p className="text-lg font-extrabold leading-tight">
                          <T>{result.sellableStatus}</T>
                        </p>
                      </motion.div>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-slate-50/35 border-2 border-black rounded-xl p-4">
                        <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-2">
                          <T>{result.marketInsight}</T>
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="text-[9px] bg-white border border-black px-2.5 py-1 rounded font-bold text-slate-500 uppercase tracking-wider">
                            <T>Base Rate</T>: ₹{result.aiFactors.basePrice}/kg
                          </span>
                          <span className="text-[9px] bg-white border border-black px-2.5 py-1 rounded font-bold text-slate-500 uppercase tracking-wider">
                            <T>Demand</T>:{" "}
                            <T>
                              {result.aiFactors.marketDemand > 0
                                ? "High"
                                : result.aiFactors.marketDemand < 0
                                  ? "Low"
                                  : "Normal"}
                            </T>
                          </span>
                        </div>
                      </div>
                    </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
        {cropName && (
          <div className="mt-8">
            <YouTubeVideos query={`${cropName} market price mandi rate news`} title={`${cropName} Mandi Rates & Market Trends`} />
          </div>
        )}
      </div>
    </div>
  );
}
