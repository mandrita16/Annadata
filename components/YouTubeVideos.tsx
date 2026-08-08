"use client";

import React, { useState, useEffect } from "react";
import { Play, Youtube, Loader2, Calendar, Tv, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { T } from "./TranslationContext";

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

interface YouTubeVideosProps {
  query: string;
  title?: string;
}

export default function YouTubeVideos({ query, title = "Helpful Video Tutorials" }: YouTubeVideosProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;

    let active = true;
    const fetchVideos = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        if (active) {
          setVideos(data.videos || []);
        }
      } catch (err) {
        console.error("YouTube widget error:", err);
        if (active) {
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchVideos();
    return () => {
      active = false;
    };
  }, [query]);

  if (loading) {
    return (
      <div className="w-full py-6 space-y-4">
        <h4 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Youtube className="w-5 h-5 text-rose-655 animate-pulse" />
          <T>{title}</T>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="border-2 border-black rounded-2xl aspect-[1.4] bg-slate-100 dark:bg-zinc-900 animate-pulse flex items-center justify-center"
            >
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || videos.length === 0) {
    return null; // Fallback silently if YouTube API quota or call fails
  }

  return (
    <div className="w-full py-6 space-y-4">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <h4 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-605" />
          <T>{title}</T>
        </h4>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border border-black px-2.5 py-0.5 rounded-md">
          <T>Video Suggestion</T>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {videos.map((vid) => (
          <div
            key={vid.id}
            onClick={() => setActiveVideoId(vid.id)}
            className="group block border-2 border-black rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all cursor-pointer text-left"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-zinc-900 overflow-hidden">
              <img
                src={vid.thumbnail}
                alt={vid.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-red-600 border border-black text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="p-3 space-y-1.5">
              <p
                className="text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight"
                dangerouslySetInnerHTML={{ __html: vid.title }}
              />
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                <span className="flex items-center gap-1">
                  <Tv className="w-3.5 h-3.5" />
                  {vid.channelTitle}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(vid.publishedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Popup Modal Player */}
      {activeVideoId && (
        <div
          className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md no-translate"
          onClick={() => setActiveVideoId(null)}
        >
          <div
            className="relative bg-black border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl overflow-hidden aspect-video flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideoId(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-xl bg-white/90 hover:bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4 text-black" />
            </button>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&controls=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}
