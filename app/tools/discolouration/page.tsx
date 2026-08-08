"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
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
  UploadCloud,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Maximize,
} from "lucide-react";

interface AnalysisStats {
  totalPixels: number;
  healthyPixels: number;
  stressedPixels: number;
  emptyPixels: number;
  healthyPercent: number;
  stressedPercent: number;
  emptyPercent: number;
  healthyAreaM2?: number;
  stressedAreaM2?: number;
  emptyAreaM2?: number;
}

interface AnalysisResult {
  stats: AnalysisStats;
  overlayImage: string;
  inputImage: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

function generateDiscolourationEmailHtml(stats: AnalysisStats) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #000000; border-radius: 12px; background-color: #ffffff; box-shadow: 4px 4px 0px 0px #000000;">
      <div style="border-bottom: 2px solid #000000; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase;">
          ⚠️ Autonomous Discolouration Alert
        </h1>
        <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
          Tatva Agro Crop Diagnostics
        </p>
      </div>

      <div style="background-color: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; color: #9b2c2c; font-weight: bold;">
          Critical Stress Detected in Crop Canopy!
        </p>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #742a2a;">
          Foliar discolouration has reached <strong>${stats.stressedPercent.toFixed(1)}%</strong>, which exceeds your safe threshold of 5%.
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin: 0 0 12px 0; text-transform: uppercase; color: #1f2937;">
          🌾 Canopy Metrics
        </h3>
        <p style="margin: 6px 0; font-size: 13px;"><strong>Stressed / Discoloured:</strong> <span style="color: #ef4444; font-weight: bold;">${stats.stressedPercent.toFixed(1)}%</span>${stats.stressedAreaM2 ? ` (${stats.stressedAreaM2.toFixed(1)} m²)` : ""}</p>
        <p style="margin: 6px 0; font-size: 13px;"><strong>Healthy Foliage:</strong> <span style="color: #10b981; font-weight: bold;">${stats.healthyPercent.toFixed(1)}%</span>${stats.healthyAreaM2 ? ` (${stats.healthyAreaM2.toFixed(1)} m²)` : ""}</p>
        <p style="margin: 6px 0; font-size: 13px;"><strong>Empty/Soil Area:</strong> ${stats.emptyPercent.toFixed(1)}%${stats.emptyAreaM2 ? ` (${stats.emptyAreaM2.toFixed(1)} m²)` : ""}</p>
      </div>

      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #4b5563; text-transform: uppercase;">📋 Recommendations</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #4b5563; line-height: 1.5;">
          <li>Review irrigation/soil moisture logs for overwatering or drought signs.</li>
          <li>Check nitrogen applications (both excess and deficiency can trigger discolouration).</li>
          <li>Scout the field location shown in the attached scan for pathogens, mold, or insect nesting.</li>
        </ul>
      </div>

      <p style="font-size: 12px; color: #6b7280; font-style: italic; margin-top: 15px;">
        Please find the original image analyzed by the platform attached to this email.
      </p>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 11px; color: #9ca3af;">
        This alert was sent automatically by Tatva Agro AI. © ${new Date().getFullYear()} Tatva Team.
      </div>
    </div>
  `;
}

export default function DiscolourationToolPage() {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fieldArea, setFieldArea] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null); // Clear previous results
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select an image to analyze.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      if (fieldArea) {
        formData.append("fieldAreaM2", fieldArea);
      }

      const response = await fetch("/api/discolouration", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
      toast.success("Analysis complete!");

      // Autonomous Email alert: exceeds 5% stressed foliage
      if (data.stats.stressedPercent > 5 && session?.user?.email) {
        const toastId = toast.loading("⏳ Discolouration > 5%! Sending alert in 10s...");
        
        let secondsLeft = 10;
        const intervalId = setInterval(() => {
          secondsLeft--;
          if (secondsLeft > 0) {
            toast.update(toastId, {
              render: `Discolouration > 5%! Sending alert in ${secondsLeft}s...`,
              type: "warning",
              isLoading: true,
            });
          } else {
            clearInterval(intervalId);
          }
        }, 1000);

        const emailAction = async () => {
          // Wait 10 seconds (countdown phase)
          await new Promise((resolve) => setTimeout(resolve, 10000));
          
          const dataUrl = await fileToBase64(selectedFile);
          const htmlContent = generateDiscolourationEmailHtml(data.stats);
          
          const res = await fetch("/api/send-mail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: session.user.email,
              subject: `⚠️ Autonomous Alert: High Canopy Discolouration Detected (${data.stats.stressedPercent.toFixed(1)}%)`,
              html: htmlContent,
              attachments: [
                {
                  filename: selectedFile.name || "field_analysis.jpg",
                  path: dataUrl
                }
              ]
            })
          });
          
          const mailData = await res.json();
          if (!res.ok || !mailData.success) {
            throw new Error(mailData.error || "Email failed");
          }
          return mailData;
        };

        toast.promise(
          emailAction(),
          {
            pending: "✉️ Sending alert email...",
            success: "Autonomous crop discolouration alert email sent! ✉️",
            error: {
              render({ data }) {
                return `Failed to send alert: ${(data as Error)?.message || "Unknown error"}`;
              }
            }
          },
          {
            toastId: toastId
          }
        ).catch(err => {
          console.error("Promise toast caught error:", err);
        });
      }
    } catch (error: any) {
      console.error("Analysis Error:", error);
      toast.error(error.message || "Failed to analyze image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 flex justify-center">
      <BackgroundPattern />

      <div className="w-full max-w-[90vw] z-10 relative space-y-6">
        <div className="text-center mb-6 relative">
          <div className="absolute left-0 top-0 hidden md:block">
            <Link href="/">
              <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white border-2 border-black text-slate-800 hover:bg-slate-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                Home
              </button>
            </Link>
          </div>

          <div className="md:hidden mb-6 flex justify-start">
            <Link href="/">
              <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white border-2 border-black text-slate-800 hover:bg-slate-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </Link>
          </div>

          <h1 className="mb-2 text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-800">
            Crop{" "}
            <span className="bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Analysis
            </span>
          </h1>
          <p className="mx-auto max-w-[65vw] text-lg sm:text-xl text-slate-500 font-medium tracking-tight mt-1">
            Detect discolouration and assess the health of your{" "}
            <span className="font-bold bg-linear-to-r capitalize from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              rice fields
            </span>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start ">
          {/* Upload Section */}
          <Card className="lg:col-span-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 overflow-hidden">
            <div className="bg-linear-to-r from-emerald-500 to-teal-600 h-1.5 w-full"></div>
            <CardHeader className="py-3 px-4 border-b border-slate-100">
              <CardTitle className="text-xl font-bold text-slate-850 flex items-center gap-2 tracking-tight">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                Upload Image
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Upload an aerial or close-up photo of your field.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div
                  className={`border-2 border-dashed border-black rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${previewUrl ? "bg-emerald-50/50 shadow-inner" : "hover:border-slate-800 bg-slate-50 hover:bg-slate-100"}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  {previewUrl ? (
                    <div className="space-y-4 flex flex-col items-center">
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-black shadow-sm">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-sm font-bold text-emerald-700">
                        Image Selected
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 flex flex-col items-center justify-center py-2">
                      <div className="p-2.5 bg-white rounded-full shadow-sm border border-black">
                        <UploadCloud className="w-7 h-7 text-slate-550" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          Click to upload image
                        </p>
                        <p className="text-[10px] text-slate-450 mt-0.5 font-medium">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!selectedFile || isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold bg-linear-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Leaf className="w-5 h-5" />
                      Analyze Health
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>
          {/* Results Section */}
          <Card className="lg:col-span-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 overflow-hidden flex flex-col min-h-[320px]">
            <div className="bg-linear-to-r from-amber-500 to-orange-600 h-1.5 w-full"></div>
            <CardHeader className="py-3 px-4 border-b border-slate-100">
              <CardTitle className="text-xl font-bold text-slate-850 flex items-center gap-2 tracking-tight">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grow flex flex-col">
              {!result && !isAnalyzing && (
                <div className="grow flex flex-col items-center justify-center text-center text-slate-500 space-y-4">
                  <div className="p-4 bg-slate-50 border-2 border-black rounded-full">
                    <Leaf className="w-12 h-12 text-slate-350" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700 text-lg">
                      No results yet
                    </p>
                    <p className="text-sm max-w-sm text-slate-450 font-medium">
                      Upload an image of your rice field and click "Analyze
                      Health" to detect discolouration and stress.
                    </p>
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div className="grow flex flex-col items-center justify-center text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                  <p className="font-bold text-slate-700 animate-pulse">
                    Running computer vision models...
                  </p>
                </div>
              )}

              <AnimatePresence>
                {result && !isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 2.0, ease: "easeOut" }}
                    className="space-y-4"
                  >
                  {/* Stat Tiles */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Healthy */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-linear-to-br from-emerald-50 to-teal-50/50 border-2 border-black rounded-xl p-3.5 flex flex-col justify-center gap-1 hover:shadow-sm transition-all duration-200 relative overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    >
                      <div className="absolute -right-4 -top-4 opacity-10">
                        <Leaf className="w-24 h-24 text-emerald-900" />
                      </div>
                      <p className="text-3xl font-extrabold text-emerald-950 leading-tight">
                        {result.stats.healthyPercent.toFixed(1)}%
                      </p>
                      <div className="space-y-0.5 z-10">
                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                          Healthy Area
                        </p>
                      </div>
                    </motion.div>

                    {/* Stressed */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-linear-to-br from-rose-50 to-orange-50/60 border-2 border-black rounded-xl p-3.5 flex flex-col justify-center gap-1 hover:shadow-sm transition-all duration-200 relative overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    >
                      <div className="absolute -right-4 -top-4 opacity-10">
                        <AlertTriangle className="w-24 h-24 text-rose-900" />
                      </div>
                      <p className="text-3xl font-extrabold text-rose-950 leading-tight">
                        {result.stats.stressedPercent.toFixed(1)}%
                      </p>
                      <div className="space-y-0.5 z-10">
                        <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                          Stressed Area
                        </p>
                      </div>
                    </motion.div>

                    {/* Background / Empty */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-slate-50/80 border-2 border-black rounded-xl p-3.5 hidden md:flex flex-col justify-center gap-1 hover:bg-white transition-all duration-200 relative overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    >
                      <div className="absolute -right-4 -top-4 opacity-5">
                        <Maximize className="w-24 h-24 text-slate-900" />
                      </div>
                      <p className="text-3xl font-extrabold text-slate-800 leading-tight">
                        {result.stats.emptyPercent.toFixed(1)}%
                      </p>
                      <div className="space-y-0.5 z-10">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Empty space
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Images Side-by-Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold flex items-center justify-between text-sm">
                        <span>Original Image</span>
                      </Label>
                      <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden border-2 border-black shadow-sm">
                        <Image
                          src={result.inputImage}
                          alt="Original Input"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold flex items-center justify-between text-sm">
                        <span>Analysis Overlay</span>
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                              Healthy
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                              Stressed
                            </span>
                          </div>
                        </div>
                      </Label>
                      <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden border-2 border-black shadow-sm">
                        <Image
                          src={result.overlayImage}
                          alt="Analysis Overlay"
                          fill
                          className="object-cover"
                        />
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
    </div>
  );
}
