"use client";

import React from "react";
import { 
  FileText, 
  Map as MapIcon, 
  Landmark, 
  CreditCard, 
  Scan, 
  TrendingUp,
  MapPin,
  Umbrella
} from "lucide-react";
import { motion } from "framer-motion";
import BackgroundPattern from "@/components/BackgroundPattern";

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-32 pt-10 px-4 flex flex-col items-center">
      <BackgroundPattern />

      <div className="w-full max-w-7xl z-10 relative">
        {/* Hero Content */}
        <div className="flex flex-col items-center justify-center text-center mb-20 mt-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2.0, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border-2 border-black bg-orange-100 text-orange-800 font-black text-sm uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <span>About Us</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2.0, ease: "easeOut", delay: 0.1 }}
            className="mb-6 text-5xl font-extrabold sm:text-7xl bg-linear-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent pb-3 select-none"
          >
            Our Motto
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2.0, ease: "easeOut", delay: 0.2 }}
            className="mx-auto mt-2 capitalize leading-relaxed text-2xl sm:text-4xl text-slate-800 font-black tracking-tight"
          >
            Empowering & modernizing Indian farmers with modern{" "}
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">technology</span>.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2.0, ease: "easeOut", delay: 0.35 }}
            className="mt-10 p-6 sm:p-8 border-2 border-black rounded-3xl bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-3xl relative"
          >
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-emerald-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
            <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-blue-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
            <p className="text-lg sm:text-xl text-slate-600 font-bold leading-relaxed">
              Tatva Agro is a comprehensive AgriTech platform designed exclusively for farmers. We bring advanced AI tools, predictive analytics, and digital crop insurance right to your fingertips, helping you make data-driven decisions for better yields and secure livelihoods.
            </p>
          </motion.div>
        </div>

        <div className="space-y-24">
          
          {/* Farmers Requirements Section */}
          <section>
            <div className="mb-10 text-center">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Get Involved: Required Documents
              </h2>
              <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto">Essential documents needed for farmers to register and unlock full platform features.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 2.0, ease: "easeOut", delay: 0.0 }}
                className="group flex flex-col rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all overflow-hidden cursor-pointer"
              >
                <div className="bg-linear-to-r from-emerald-400 to-teal-500 h-2.5 w-full border-b-2 border-black" />
                <div className="p-6 grow flex flex-col">
                  <div className="w-14 h-14 rounded-xl border-2 border-black bg-emerald-100 flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:-rotate-3 transition-transform">
                    <FileText size={28} className="text-emerald-700" />
                  </div>
                  <h3 className="text-xl font-black mb-3 text-slate-900 tracking-tight">Aadhar Card</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed grow">For primary KYC identity verification and establishing a secure profile on our platform.</p>
                </div>
              </motion.div>
              
              {/* Card 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 2.0, ease: "easeOut", delay: 0.15 }}
                className="group flex flex-col rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all overflow-hidden cursor-pointer"
              >
                <div className="bg-linear-to-r from-emerald-400 to-teal-500 h-2.5 w-full border-b-2 border-black" />
                <div className="p-6 grow flex flex-col">
                  <div className="w-14 h-14 rounded-xl border-2 border-black bg-emerald-100 flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-3 transition-transform">
                    <MapIcon size={28} className="text-emerald-700" />
                  </div>
                  <h3 className="text-xl font-black mb-3 text-slate-900 tracking-tight">Land Document</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed grow">Land registration or 7/12 extract for verifying farm ownership to register your plots.</p>
                </div>
              </motion.div>
              
              {/* Card 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 2.0, ease: "easeOut", delay: 0.3 }}
                className="group flex flex-col rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all overflow-hidden cursor-pointer"
              >
                <div className="bg-linear-to-r from-emerald-400 to-teal-500 h-2.5 w-full border-b-2 border-black" />
                <div className="p-6 grow flex flex-col">
                  <div className="w-14 h-14 rounded-xl border-2 border-black bg-emerald-100 flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:-rotate-3 transition-transform">
                    <Landmark size={28} className="text-emerald-700" />
                  </div>
                  <h3 className="text-xl font-black mb-3 text-slate-900 tracking-tight">Bank Details</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed grow">Passbook or cancelled cheque to ensure direct, quick insurance claim settlements.</p>
                </div>
              </motion.div>
              
              {/* Card 4 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 2.0, ease: "easeOut", delay: 0.45 }}
                className="group flex flex-col rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all overflow-hidden cursor-pointer"
              >
                <div className="bg-linear-to-r from-emerald-400 to-teal-500 h-2.5 w-full border-b-2 border-black" />
                <div className="p-6 grow flex flex-col">
                  <div className="w-14 h-14 rounded-xl border-2 border-black bg-emerald-100 flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-3 transition-transform">
                    <CreditCard size={28} className="text-emerald-700" />
                  </div>
                  <h3 className="text-xl font-black mb-3 text-slate-900 tracking-tight">Kisan Credit Card</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed grow">Optional. Helps in linking credit facilities and provides additional financial support records.</p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* System Overview Section */}
          <section>
            <div className="mb-10 text-center">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Everything A Farmer Needs
              </h2>
              <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto">Our advanced AI-driven tools built specifically to solve daily farming challenges.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 2.0, ease: "easeOut", delay: 0.1 }}
                className="group flex flex-col rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all overflow-hidden cursor-pointer"
              >
                <div className="bg-linear-to-r from-blue-500 to-indigo-600 h-2.5 w-full border-b-2 border-black" />
                <div className="p-6 grow flex flex-col">
                  <div className="w-14 h-14 rounded-xl border-2 border-black bg-blue-100 flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:-rotate-3 transition-transform">
                    <MapPin size={28} className="text-blue-700" />
                  </div>
                  <h3 className="text-xl font-black mb-3 text-slate-900 tracking-tight">Plot Registration</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed grow">Digitally register your farmlands. Maintain records of crop cycles, soil conditions, and farm area efficiently.</p>
                </div>
              </motion.div>
              
              {/* Card 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 2.0, ease: "easeOut", delay: 0.25 }}
                className="group flex flex-col rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all overflow-hidden cursor-pointer"
              >
                <div className="bg-linear-to-r from-emerald-500 to-teal-600 h-2.5 w-full border-b-2 border-black" />
                <div className="p-6 grow flex flex-col">
                  <div className="w-14 h-14 rounded-xl border-2 border-black bg-emerald-100 flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-3 transition-transform">
                    <Scan size={28} className="text-emerald-700" />
                  </div>
                  <h3 className="text-xl font-black mb-3 text-slate-900 tracking-tight">Disease Analyzer</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed grow">Upload leaf photos to instantly diagnose diseases and get a tailored 4-week recovery medication calendar.</p>
                </div>
              </motion.div>
              
              {/* Card 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 2.0, ease: "easeOut", delay: 0.4 }}
                className="group flex flex-col rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all overflow-hidden cursor-pointer"
              >
                <div className="bg-linear-to-r from-orange-500 to-amber-500 h-2.5 w-full border-b-2 border-black" />
                <div className="p-6 grow flex flex-col">
                  <div className="w-14 h-14 rounded-xl border-2 border-black bg-orange-100 flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:-rotate-3 transition-transform">
                    <TrendingUp size={28} className="text-orange-700" />
                  </div>
                  <h3 className="text-xl font-black mb-3 text-slate-900 tracking-tight">Market Predictor</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed grow">Forecast selling prices in major APMC markets and estimate your net profitability using AI algorithms.</p>
                </div>
              </motion.div>
              
              {/* Card 4 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 2.0, ease: "easeOut", delay: 0.55 }}
                className="group flex flex-col rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all overflow-hidden cursor-pointer"
              >
                <div className="bg-linear-to-r from-purple-500 to-fuchsia-600 h-2.5 w-full border-b-2 border-black" />
                <div className="p-6 grow flex flex-col">
                  <div className="w-14 h-14 rounded-xl border-2 border-black bg-purple-100 flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-3 transition-transform">
                    <Umbrella size={28} className="text-purple-700" />
                  </div>
                  <h3 className="text-xl font-black mb-3 text-slate-900 tracking-tight">Digital Insurance</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed grow">File claims for flood, drought, or pest damages. Our system analyzes farm snapshots for quick estimated payouts.</p>
                </div>
              </motion.div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
