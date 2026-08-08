"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackgroundPattern from "@/components/BackgroundPattern";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Loader2,
  Maximize,
  ArrowLeft,
  Building2,
  Cloud,
  Sun,
  Droplets,
  MapPinned,
  Wind,
  Sprout,
  ThermometerSun,
} from "lucide-react";
import { toast } from "react-toastify";
import SpeechButton from "@/components/SpeechButton";

export default function PlotDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const [plot, setPlot] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [soilData, setSoilData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const CACHE_KEY = `tatva_weather_${id}`;
  const CACHE_EXPIRY = 30 * 60 * 1000;

  useEffect(() => {
    if (status === "authenticated") {
      fetchPlot();
    }
  }, [status]);

  useEffect(() => {
    if (plot?.landmark?.lat && plot?.landmark?.lng) {
      const interval = setInterval(() => {
        fetchWeather(plot.landmark.lat, plot.landmark.lng, true);
      }, CACHE_EXPIRY);
      return () => clearInterval(interval);
    }
  }, [plot]);

  const fetchSoilData = async (lat: number, lng: number) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_STORMGLASS_API_KEY;
      if (!apiKey) return; // Skip if no API key is provided

      const res = await fetch(
        `https://api.stormglass.io/v2/bio/point?lat=${lat}&lng=${lng}&params=soilMoisture,soilTemperature`,
        {
          headers: {
            Authorization: apiKey,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        if (data.hours && data.hours.length > 0) {
          const current = data.hours[0];
          const newSoilData = {
            moisture:
              current.soilMoisture?.sg ?? current.soilMoisture?.noaa ?? null,
            temperature:
              current.soilTemperature?.sg ??
              current.soilTemperature?.noaa ??
              null,
            lastUpdated: new Date(),
          };

          setSoilData(newSoilData);

          // Save to database instantly
          await fetch(`/api/plots/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ soilData: newSoilData }),
          });
        }
      } else {
        console.error("Stormglass API error:", await res.text());
      }
    } catch (e) {
      console.error("Soil fetch failed:", e);
    }
  };

  const fetchWeather = async (
    lat: number,
    lng: number,
    forceRefresh = false,
  ) => {
    try {
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            setWeather(data);
            return;
          }
        }
      }
      const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      const res = await fetch(
        `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&unitsSystem=METRIC`,
      );
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), data }),
        );
      } else {
        console.error("Weather API error:", await res.text());
        setWeather({ error: true });
      }
    } catch (e) {
      console.error("Weather fetch failed:", e);
      setWeather({ error: true });
    }
  };

  const fetchPlot = async () => {
    try {
      const response = await fetch(`/api/plots/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Plot not found");
          router.push("/plots");
          return;
        }
        throw new Error("Failed to fetch plot details");
      }
      const data = await response.json();
      setPlot(data);
      if (data.soilData) {
        setSoilData(data.soilData);
      }

      if (data?.landmark?.lat && data?.landmark?.lng) {
        fetchWeather(data.landmark.lat, data.landmark.lng);

        // Fetch fresh soil data if not fetched recently (e.g., > 1 hour ago)
        const ONE_HOUR = 60 * 60 * 1000;
        if (
          !data.soilData?.lastUpdated ||
          Date.now() - new Date(data.soilData.lastUpdated).getTime() > ONE_HOUR
        ) {
          fetchSoilData(data.landmark.lat, data.landmark.lng);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading plot details.");
    } finally {
      setIsLoading(false);
    }
  };

  const tempValue =
    weather?.temperature?.degrees ??
    weather?.currentConditions?.temperature?.degrees ??
    weather?.temperature ??
    weather?.currentConditions?.temperature ??
    "--";

  const feelsLikeValue =
    weather?.feelsLike?.degrees ??
    weather?.currentConditions?.feelsLike?.degrees ??
    weather?.feelsLike ??
    weather?.currentConditions?.feelsLike ??
    "--";

  const humidityValue =
    weather?.humidity?.percent ??
    weather?.currentConditions?.humidity?.percent ??
    weather?.relativeHumidity ??
    weather?.currentConditions?.relativeHumidity ??
    weather?.humidity ??
    "--";

  const windValue =
    weather?.windSpeed?.value ??
    weather?.currentConditions?.windSpeed?.value ??
    weather?.wind?.speed?.value ??
    weather?.currentConditions?.wind?.speed?.value ??
    "--";

  const windDirection =
    weather?.windDirection?.cardinal ??
    weather?.currentConditions?.windDirection?.cardinal ??
    "";

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!plot) return null;

  return (
    <div className="min-h-screen pb-24 pt-10 px-4 flex flex-col items-center">
      <BackgroundPattern />

      <div className="w-full max-w-6xl z-10 relative">
        {/* Page Heading */}
        <div className="text-center mb-10 relative">
          {/* Back Button positioned absolutely on the left for larger screens, or top for mobile */}
          <div className="absolute left-0 top-0 hidden md:block">
            <Link href="/plots">
              <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                Back to My Plots
              </button>
            </Link>
          </div>

          <div className="md:hidden mb-6 flex justify-start">
            <Link href="/plots">
              <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </Link>
          </div>

          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-800">
            Plot{" "}
            <span className="bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              {plot.name || "Details"}
            </span>
          </h1>
          <p className="mx-auto max-w-[65vw] text-lg sm:text-xl text-slate-500 font-medium tracking-tight mt-2">
            A complete overview of your{" "}
            <span className="font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              registered
            </span>{" "}
            land{plot.name ? ` (${plot.landmark.name})` : ""}.
          </p>
        </div>

        {/* Main Grid: Map (left, large) + Info (right column) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
          {/* ── Map Card ── spans 2 cols on large screens */}
          <Card className="lg:col-span-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 overflow-hidden flex flex-col min-h-[420px]">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center justify-between tracking-tight">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Live Satellite View
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-black px-3 py-1 rounded-full">
                  {plot.landmark.lat.toFixed(4)}, {plot.landmark.lng.toFixed(4)}
                </span>
              </CardTitle>
            </CardHeader>
            <div className="grow w-full relative bg-slate-100">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "380px" }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&q=${plot.landmark.lat},${plot.landmark.lng}&zoom=17&maptype=satellite`}
              ></iframe>
            </div>
          </Card>

          {/* ── Right Column: Info + Weather ── */}
          <div className="flex flex-col gap-6">
            {/* Land Info Card */}
            <Card className="shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                  <Building2 className="w-5 h-5 text-orange-500" />
                  Land Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Area Tile */}
                <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors duration-200">
                  <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
                    <Maximize className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Land Area
                    </p>
                    <p className="text-base font-extrabold text-slate-850">
                      {plot.area} Acres
                    </p>
                  </div>
                </div>

                {/* Location Tiles: state / city / pincode */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50/50 border-2 border-black rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 hover:bg-slate-50 transition-colors duration-200">
                    <MapPinned className="h-4 w-4 text-slate-450" />
                    <p
                      className="text-xs font-bold text-slate-800 leading-tight truncate w-full"
                      title={plot.state}
                    >
                      {plot.state}
                    </p>
                    <p className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                      State
                    </p>
                  </div>
                  <div className="bg-slate-50/50 border-2 border-black rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 hover:bg-slate-50 transition-colors duration-200">
                    <Building2 className="h-4 w-4 text-slate-450" />
                    <p
                      className="text-xs font-bold text-slate-800 leading-tight truncate w-full"
                      title={plot.city}
                    >
                      {plot.city}
                    </p>
                    <p className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                      City
                    </p>
                  </div>
                  <div className="bg-slate-50/50 border-2 border-black rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 hover:bg-slate-50 transition-colors duration-200">
                    <MapPin className="h-4 w-4 text-slate-450" />
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {plot.pincode}
                    </p>
                    <p className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                      Pincode
                    </p>
                  </div>
                </div>

                {/* Landmark */}
                <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors duration-200">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100/50 mt-0.5">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Registered Landmark
                    </p>
                    <p className="text-sm font-bold text-slate-800 line-clamp-1">
                      {plot.landmark.name}
                    </p>
                    <p className="text-xs text-slate-400 font-medium line-clamp-2">
                      {plot.landmark.address}
                    </p>
                  </div>
                </div>

                {/* Soil Data Tiles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-linear-to-br from-emerald-50 to-teal-50/50 border-2 border-black rounded-xl p-3.5 flex flex-col items-center justify-center text-center gap-1 hover:shadow-sm transition-all duration-200">
                    <Sprout className="h-5 w-5 text-emerald-600 mb-1" />
                    <p className="text-lg font-extrabold text-emerald-950 leading-tight">
                      {soilData?.moisture !== null &&
                      soilData?.moisture !== undefined
                        ? `${soilData.moisture.toFixed(2)}`
                        : "--"}
                    </p>
                    <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
                      Soil Moisture
                    </p>
                  </div>
                  <div className="bg-linear-to-br from-amber-50 to-orange-50/50 border-2 border-black rounded-xl p-3.5 flex flex-col items-center justify-center text-center gap-1 hover:shadow-sm transition-all duration-200">
                    <ThermometerSun className="h-5 w-5 text-orange-500 mb-1" />
                    <p className="text-lg font-extrabold text-orange-950 leading-tight">
                      {soilData?.temperature !== null &&
                      soilData?.temperature !== undefined
                        ? `${soilData.temperature.toFixed(1)}°C`
                        : "--"}
                    </p>
                    <p className="text-[9px] font-bold text-orange-800 uppercase tracking-wider">
                      Soil Temp
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weather Card */}
            <Card className="shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center justify-between tracking-tight">
                   <div className="flex items-center gap-2">
                     <Cloud className="w-5 h-5 text-sky-650" />
                     Live Weather
                     {weather && !weather.error && (
                       <SpeechButton
                         text={`The current temperature at your farm is ${tempValue} degrees Celsius, which feels like ${feelsLikeValue} degrees Celsius. The relative humidity is ${humidityValue} percent, and the wind speed is ${windValue} kilometers per hour.`}
                         className="h-7 w-7 p-1 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-lg ml-1"
                       />
                     )}
                   </div>
                  <span className="text-[9px] uppercase font-bold text-sky-700 bg-sky-50 border border-black px-2.5 py-1 rounded-full shrink-0">
                    Auto-updates
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {!weather ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : weather.error ? (
                  <div className="bg-slate-50 border border-black rounded-xl p-4 text-center">
                    <p className="text-sm font-bold text-slate-650">
                      Weather Unavailable
                    </p>
                    <p className="text-xs text-slate-450 mt-1">
                      Enable the Weather API in Google Cloud Console.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Temperature Row */}
                    <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex items-center justify-between hover:bg-slate-50 transition-colors duration-200">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
                          <Sun className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Temperature
                          </p>
                          <p className="text-xs text-slate-450 font-medium">
                            Feels like {feelsLikeValue}°C
                          </p>
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-slate-800">
                        {tempValue}°C
                      </p>
                    </div>

                    {/* Humidity Row */}
                    <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex items-center justify-between hover:bg-slate-50 transition-colors duration-200">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100/50">
                          <Droplets className="h-5 w-5 text-sky-600" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Humidity
                          </p>
                          <p className="text-xs text-slate-450 font-medium">
                            Relative humidity
                          </p>
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-slate-800">
                        {humidityValue}%
                      </p>
                    </div>

                    {/* Wind Speed Row */}
                    <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex items-center justify-between hover:bg-slate-50 transition-colors duration-200">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100/50">
                          <Wind className="h-5 w-5 text-indigo-650" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Wind Speed
                          </p>
                          <p className="text-xs text-slate-450 font-medium">
                            {windDirection
                              ? `Direction: ${windDirection}`
                              : "Current conditions"}
                          </p>
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-slate-800">
                        {windValue}{" "}
                        <span className="text-xs font-bold text-slate-400">
                          km/h
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
