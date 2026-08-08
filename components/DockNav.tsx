"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home,
  Map,
  MapPin,
  Camera,
  Bug,
  TrendingUp,
  Flower,
  Store,
  Umbrella,
  User,
  Info,
  PhoneCall,
  LogIn,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  shortName: string;
  icon: React.ElementType;
  iconFilled: React.ElementType;
  href: string;
  show: boolean;
}

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string>("");
  const dockRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      name: "Home",
      shortName: "Home",
      icon: Home,
      iconFilled: Home,
      href: "/",
      show: true,
    },
    {
      name: "My Plots",
      shortName: "Plots",
      icon: Map,
      iconFilled: Map,
      href: "/plots",
      show: status === "authenticated",
    },
    {
      name: "Register Plot",
      shortName: "Add Plot",
      icon: MapPin,
      iconFilled: MapPin,
      href: "/plots/create",
      show: status === "authenticated",
    },
    {
      name: "Discoloration",
      shortName: "Discoloration",
      icon: Camera,
      iconFilled: Camera,
      href: "/tools/discolouration",
      show: status === "authenticated",
    },
    {
      name: "Crop Disease",
      shortName: "Disease",
      icon: Bug,
      iconFilled: Bug,
      href: "/tools/disease",
      show: status === "authenticated",
    },
    {
      name: "Yield Predictor",
      shortName: "Yield",
      icon: TrendingUp,
      iconFilled: TrendingUp,
      href: "/tools/yield",
      show: status === "authenticated",
    },
    {
      name: "Floriculture",
      shortName: "Flowers",
      icon: Flower,
      iconFilled: Flower,
      href: "/tools/floriculture",
      show: status === "authenticated",
    },
    {
      name: "Market Predictor",
      shortName: "Market",
      icon: Store,
      iconFilled: Store,
      href: "/tools/market",
      show: status === "authenticated",
    },
    {
      name: "Insurance",
      shortName: "Insure",
      icon: Umbrella,
      iconFilled: Umbrella,
      href: "/insurance",
      show: status === "authenticated",
    },
    {
      name: "Profile",
      shortName: "Profile",
      icon: User,
      iconFilled: User,
      href: "/profile",
      show: status === "authenticated",
    },
    {
      name: "About",
      shortName: "About",
      icon: Info,
      iconFilled: Info,
      href: "/about",
      show: true,
    },
    {
      name: "Contact",
      shortName: "Support",
      icon: PhoneCall,
      iconFilled: PhoneCall,
      href: "/contact",
      show: true,
    },
    {
      name: "Login",
      shortName: "Login",
      icon: LogIn,
      iconFilled: LogIn,
      href: "/auth",
      show: status === "unauthenticated",
    },
  ];

  const activeItems = navItems.filter((item) => item.show);

  return (
    <>
      {/* Desktop Floating Dock Navigation */}
      <div
        className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        ref={dockRef}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
          className="flex items-center gap-1 px-5 py-2 rounded-2xl bg-white/90 backdrop-blur-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          {activeItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = isActive ? item.iconFilled : item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setHovered(item.name)}
                onMouseLeave={() => setHovered("")}
                className="group relative"
              >
                {/* Per-item tooltip */}
                <AnimatePresence>
                  {hovered === item.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 rounded-lg bg-black text-white text-[10px] font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap pointer-events-none"
                    >
                      {item.name}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Icon button */}
                <div
                  className={cn(
                    "p-3 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center",
                    isActive
                      ? "bg-slate-900 text-white scale-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </Link>
            );
          })}
        </motion.div>
      </div>

      {/* Mobile Hamburger Trigger Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-3 rounded-xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-slate-800 cursor-pointer flex items-center justify-center"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Full Screen Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-9999 bg-white/95 backdrop-blur-lg flex flex-col p-6 overflow-y-auto"
          >
            {/* Top bar inside menu */}
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
              <span className="text-xl font-black text-slate-800 uppercase tracking-widest">Tatva Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col gap-3 my-auto">
              {activeItems.map((item, idx) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-5 py-3 rounded-2xl border-2 border-black font-black text-base transition-all",
                        isActive
                          ? "bg-slate-900 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] scale-[1.02]"
                          : "bg-white text-slate-800 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      )}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Mobile Footer */}
            <div className="mt-8 border-t border-slate-200 pt-4 text-center">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                © {new Date().getFullYear()} Tatva Agro. All rights reserved.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
