"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation, LanguageCode } from "./TranslationContext";
import { Volume2, Loader2, Square, VolumeX } from "lucide-react";
import { toast } from "react-toastify";

interface SpeechButtonProps {
  text: string;
  className?: string;
}

export default function SpeechButton({ text, className = "" }: SpeechButtonProps) {
  const { language, translateText } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio if text or language changes
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [text, language]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleSpeak = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
      stopAudio();
      return;
    }

    setIsLoading(true);
    try {
      // 1. Translate the text to target language first if not English
      const targetText = language === "en" ? text : await translateText(text);

      // 2. Request synthesized TTS audio from backend
      const res = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: targetText,
          languageCode: language,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to synthesize speech");
      }

      const data = await res.json();
      if (!data.audioContent) {
        throw new Error("No audio returned from server");
      }

      // 3. Play the Base64 audio stream
      const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlaying(false);
        audioRef.current = null;
        toast.error("Audio playback error.");
      };

      setIsPlaying(true);
      await audio.play();
    } catch (err: any) {
      console.error("Speech playback error:", err);
      toast.error("Speech synthesis unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSpeak}
      disabled={isLoading}
      title={isPlaying ? "Stop listening" : "Listen to this description"}
      className={`inline-flex items-center justify-center p-2 rounded-xl border-2 border-black bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-slate-800 dark:text-slate-200 cursor-pointer shrink-0 disabled:opacity-60 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
      ) : isPlaying ? (
        <VolumeX className="w-4 h-4 text-rose-500 animate-pulse" />
      ) : (
        <Volume2 className="w-4 h-4 text-emerald-600" />
      )}
    </button>
  );
}
