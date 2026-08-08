"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackgroundPattern from "@/components/BackgroundPattern";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, PlusSquare, Loader2, Maximize } from "lucide-react";
import { toast } from "react-toastify";

export default function MyPlotsPage() {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const [plots, setPlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPlots();
    }
  }, [status]);

  const fetchPlots = async () => {
    try {
      const response = await fetch("/api/plots");
      if (!response.ok) throw new Error("Failed to fetch plots");
      const data = await response.json();
      setPlots(data);
    } catch (error) {
      console.error(error);
      toast.error("Error loading plots.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-10 px-4 flex flex-col items-center">
      <BackgroundPattern />
      
      <div className="w-full max-w-6xl z-10 relative">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
          <div className="text-center sm:text-left">
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-800">
              My <span className="bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Plots</span>
            </h1>
            <p className="max-w-[60vw] text-lg sm:text-xl text-slate-500 font-medium tracking-tight mt-2">
              Manage and view your <span className="font-bold bg-linear-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">registered</span> lands.
            </p>
          </div>
          <Link href="/plots/create">
            <button className="flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold tracking-tight bg-linear-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer border-none shadow-md">
              <PlusSquare className="w-5 h-5" />
              Register New Plot
            </button>
          </Link>
        </div>

        {plots.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-black rounded-3xl bg-white/60 backdrop-blur-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <MapPin className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-2xl font-bold text-slate-700 mb-2">No plots found</h3>
            <p className="text-slate-500 max-w-md mb-6 font-medium">
              You haven't registered any agricultural plots yet. Start tracking your land by adding your first plot.
            </p>
            <Link href="/plots/create">
              <button className="rounded-xl bg-slate-900 px-6 py-3.5 font-bold text-white hover:bg-slate-800 transition-colors border-none cursor-pointer">
                Create your first plot
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plots.map((plot) => (
              <Link href={`/plots/${plot._id}`} key={plot._id} className="block group">
                <Card className="shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group-hover:-translate-y-1 bg-white/90 backdrop-blur-md overflow-hidden flex flex-col h-full">
                  <div className="h-32 bg-slate-100 relative border-b border-slate-100 overflow-hidden">
                     {/* Fallback visual, normally could be a static map image via Google Static Maps API */}
                     <img 
                       src={`https://maps.googleapis.com/maps/api/staticmap?center=${plot.landmark.lat},${plot.landmark.lng}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C${plot.landmark.lat},${plot.landmark.lng}&key=${process.env.NEXT_PUBLIC_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`} 
                       alt="Plot Map"
                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                       onError={(e) => { e.currentTarget.style.display = 'none' }}
                     />
                  </div>
                <CardHeader className="pb-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-bold text-slate-800 line-clamp-1" title={plot.name || plot.landmark.name}>
                        {plot.name || plot.landmark.name}
                      </CardTitle>
                      <div className="flex items-center gap-1 bg-emerald-55 border border-black text-emerald-700 px-2 py-0.5 rounded-lg font-bold text-[10px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                        <Maximize className="w-2.5 h-2.5" />
                        {plot.area} ac
                      </div>
                    </div>
                    {plot.name && (
                      <p className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wide line-clamp-1">
                        {plot.landmark.name}
                      </p>
                    )}
                  </div>
                  <CardDescription className="text-slate-400 font-semibold line-clamp-2 mt-1 h-10" title={plot.landmark.address}>
                    {plot.landmark.address}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-4">
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-600 bg-slate-50/50 p-3.5 rounded-xl border-2 border-black">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">State</span>
                      {plot.state}
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">City</span>
                      {plot.city}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm font-bold bg-linear-to-r from-orange-500 to-emerald-600 bg-clip-text text-transparent flex items-center justify-center gap-1 group-hover:from-orange-600 group-hover:to-emerald-700 transition-all duration-200">
                      View Details &rarr;
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
