"use client";

import React, { useState } from "react";
import { Send, MapPin, Phone, Mail, User, AlertCircle, Building } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundPattern from "@/components/BackgroundPattern";
import { indianStatesAndCities } from "@/lib/states";
import { toast } from "react-toastify";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    city: "",
    mobile: "",
    email: "",
    problem: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived available cities
  const availableCities = formData.state ? indianStatesAndCities[formData.state] || [] : [];

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Full name is required.";
        return "";
      case "state":
        if (!value) return "Please select a state.";
        return "";
      case "city":
        if (!value) return "Please select a city.";
        return "";
      case "mobile":
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!value) return "Mobile number is required.";
        if (!mobileRegex.test(value)) return "Please enter a valid 10-digit Indian mobile number starting with 6-9.";
        return "";
      case "email":
        if (!value) return "Email address is required.";
        if (!value.toLowerCase().endsWith("@gmail.com")) return "Please provide a valid Gmail address (ending with @gmail.com).";
        return "";
      case "problem":
        if (!value.trim()) return "Please describe your concern.";
        return "";
      default:
        return "";
    }
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateVal = e.target.value;
    setFormData({
      ...formData,
      state: stateVal,
      city: "", // Reset city when state changes
    });
    setErrors((prev) => ({
      ...prev,
      state: stateVal ? "" : "Please select a state.",
      city: "Please select a city.",
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Real-time inline validation
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger full validation
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const val = formData[key as keyof typeof formData];
      const errorMsg = validateField(key, val);
      if (errorMsg) {
        newErrors[key] = errorMsg;
      }
    });

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err !== "")) {
      toast.error("Please correct the errors in the form before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("https://formspree.io/f/xdajbbge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Your message has been received! Our support team will reach out soon.");
        setFormData({
          name: "",
          state: "",
          city: "",
          mobile: "",
          email: "",
          problem: "",
        });
        setErrors({});
      } else {
        toast.error("Failed to send message. Please try again later.");
      }
    } catch (error) {
      toast.error("An error occurred while sending your message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 flex flex-col items-center">
      <BackgroundPattern />

      <div className="w-full max-w-4xl z-10 relative mt-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.0, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border-2 border-black bg-blue-100 text-blue-800 font-black text-sm uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span>Support</span>
          </div>
          <h1 className="mb-4 text-4xl font-extrabold sm:text-6xl bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent pb-2 select-none tracking-tight">
            Contact Us
          </h1>
          <p className="mx-auto mt-2 text-lg sm:text-xl text-slate-700 font-bold max-w-2xl leading-relaxed">
            Facing any issues with our platform? Reach out to our support team and we will assist you right away.
          </p>
        </motion.div>

        {/* Contact Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.0, ease: "easeOut", delay: 0.15 }}
          className="border-2 border-black rounded-3xl bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
        >
          <div className="bg-linear-to-r from-blue-500 via-indigo-500 to-purple-600 h-3 w-full border-b-2 border-black" />
          
          <div className="p-6 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  Full Name
                </label>
                <motion.input
                  whileHover={{ scale: 1.01 }}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full border-2 border-black rounded-xl p-4 bg-slate-50 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/20 transition-all text-base font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
                <AnimatePresence>
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1 pl-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Location (State & City) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-600" />
                    State
                  </label>
                  <motion.select
                    whileHover={{ scale: 1.01 }}
                    name="state"
                    value={formData.state}
                    onChange={handleStateChange}
                    className="w-full border-2 border-black rounded-xl p-4 bg-slate-50 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/20 transition-all text-base font-bold text-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    <option value="" disabled>Select State</option>
                    {Object.keys(indianStatesAndCities).sort().map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </motion.select>
                  <AnimatePresence>
                    {errors.state && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1 pl-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.state}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Building size={16} className="text-emerald-600" />
                    City
                  </label>
                  <motion.select
                    whileHover={{ scale: 1.01 }}
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!formData.state}
                    className="w-full border-2 border-black rounded-xl p-4 bg-slate-50 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/20 transition-all text-base font-bold text-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>Select City</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </motion.select>
                  <AnimatePresence>
                    {errors.city && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1 pl-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.city}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Contact Details (Mobile & Email) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Phone size={16} className="text-orange-600" />
                    Mobile Number
                  </label>
                  <motion.input
                    whileHover={{ scale: 1.01 }}
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="w-full border-2 border-black rounded-xl p-4 bg-slate-50 outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/20 transition-all text-base font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <AnimatePresence>
                    {errors.mobile ? (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1 pl-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.mobile}
                      </motion.p>
                    ) : (
                      <p className="text-xs font-bold text-slate-500 pl-1">Must be a valid Indian number (e.g. 9876543210).</p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={16} className="text-orange-600" />
                    Email Address
                  </label>
                  <motion.input
                    whileHover={{ scale: 1.01 }}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="yourname@gmail.com"
                    className="w-full border-2 border-black rounded-xl p-4 bg-slate-50 outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/20 transition-all text-base font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <AnimatePresence>
                    {errors.email ? (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1 pl-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.email}
                      </motion.p>
                    ) : (
                      <p className="text-xs font-bold text-slate-500 pl-1">Must be a @gmail.com address.</p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Problem/Message */}
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={16} className="text-purple-600" />
                  Describe Your Problem
                </label>
                <motion.textarea
                  whileHover={{ scale: 1.01 }}
                  name="problem"
                  value={formData.problem}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  rows={5}
                  className="w-full border-2 border-black rounded-xl p-4 bg-slate-50 outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/20 transition-all text-base font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-y"
                />
                <AnimatePresence>
                  {errors.problem && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1 pl-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.problem}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-10 py-4 font-black bg-black text-white hover:bg-slate-800 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 text-lg uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send size={20} />
                      Submit Request
                    </span>
                  )}
                </motion.button>
              </div>

            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
