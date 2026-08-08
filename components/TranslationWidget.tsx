"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation, SUPPORTED_LANGUAGES, LanguageCode } from "./TranslationContext";
import { Globe, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TranslationWidget() {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="fixed top-4 right-4 z-50 no-translate" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-xs font-black uppercase text-slate-800 dark:text-slate-200 cursor-pointer"
      >
        <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="hidden sm:inline">{activeLang.nativeName}</span>
        <span className="sm:hidden">{activeLang.code.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-48 bg-white dark:bg-zinc-950 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
          >
            <div className="p-1.5 space-y-1">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-black uppercase transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-extrabold">{lang.nativeName}</span>
                      <span className="text-[9px] text-slate-400 font-bold lowercase">({lang.name})</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-650 dark:text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
