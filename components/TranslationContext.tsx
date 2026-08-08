"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type LanguageCode = "en" | "hi" | "mr" | "ta" | "bn";

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
];

interface TranslationContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  translateText: (text: string) => Promise<string>;
  translateTextWithLang: (text: string, targetLang: LanguageCode) => Promise<string>;
  loading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Keep track of the original English text for text nodes
const originals = new WeakMap<Text, string>();
const translatedValues = new WeakSet<Text>();

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [loading, setLoading] = useState(false);
  const isUpdatingDOMRef = useRef(false);

  // Load language preference from local storage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("tatva_language") as LanguageCode;
    if (savedLang && SUPPORTED_LANGUAGES.some((l) => l.code === savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("tatva_language", lang);
  };

  const translateTextWithLang = async (text: string, targetLang: LanguageCode): Promise<string> => {
    if (!text || !text.trim() || targetLang === "en") return text;

    const cacheKey = `tatva_trans_${targetLang}_${encodeURIComponent(text.trim())}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target: targetLang }),
      });
      const data = await res.json();
      if (data.translatedText) {
        // Decode HTML entities
        const decodedText = decodeHTML(data.translatedText);
        localStorage.setItem(cacheKey, decodedText);
        return decodedText;
      }
      return text;
    } catch (err) {
      console.error("Translation API failure:", err);
      return text;
    }
  };

  const translateText = async (text: string): Promise<string> => {
    return translateTextWithLang(text, language);
  };

  // Helper to decode HTML entities
  const decodeHTML = (html: string): string => {
    if (typeof window === "undefined") return html;
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  // Traverses DOM to collect and update text nodes
  const translateDOM = async () => {
    if (typeof window === "undefined" || language === "en") return;

    const pendingNodes: Text[] = [];
    const pendingTexts: string[] = [];

    // Helper to walk nodes recursively
    const walk = (node: Node) => {
      // Exclude script, style, textareas, iframes, maps, and widgets marked with no-translate class
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();
        const classNameStr = el.className?.toString() || "";
        const idStr = el.id?.toString() || "";

        if (
          tagName === "script" ||
          tagName === "style" ||
          tagName === "textarea" ||
          tagName === "iframe" ||
          tagName === "noscript" ||
          el.classList.contains("no-translate") ||
          el.closest(".no-translate") ||
          // Map exclusions
          classNameStr.includes("leaflet") ||
          el.closest(".leaflet-container") ||
          classNameStr.includes("gm-style") ||
          el.closest(".gm-style") ||
          idStr.toLowerCase().includes("map") ||
          classNameStr.toLowerCase().includes("map") ||
          el.closest('[id*="map"]') ||
          el.closest('[class*="map"]')
        ) {
          return;
        }
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        const val = textNode.nodeValue?.trim();
        if (val && val.length > 0 && isNaN(Number(val))) {
          // If we haven't stored the original English text, store it
          if (!originals.has(textNode)) {
            originals.set(textNode, textNode.nodeValue || "");
          }

          const originalText = originals.get(textNode) || "";
          const cacheKey = `tatva_trans_${language}_${encodeURIComponent(originalText.trim())}`;
          const cached = localStorage.getItem(cacheKey);

          if (cached) {
            isUpdatingDOMRef.current = true;
            textNode.nodeValue = cached;
            translatedValues.add(textNode);
            isUpdatingDOMRef.current = false;
          } else {
            pendingNodes.push(textNode);
            pendingTexts.push(originalText);
          }
        }
        return;
      }

      let child = node.firstChild;
      while (child) {
        walk(child);
        child = child.nextSibling;
      }
    };

    walk(document.body);

    if (pendingTexts.length === 0) return;

    // Translate pending texts in batches of 50 to optimize API payload
    const batchSize = 50;
    for (let i = 0; i < pendingTexts.length; i += batchSize) {
      const textBatch = pendingTexts.slice(i, i + batchSize);
      const nodeBatch = pendingNodes.slice(i, i + batchSize);

      try {
        setLoading(true);
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textBatch, target: language }),
        });

        const data = await res.json();
        const translatedTexts = data.translatedText;

        if (translatedTexts && Array.isArray(translatedTexts)) {
          isUpdatingDOMRef.current = true;
          translatedTexts.forEach((tText, index) => {
            const node = nodeBatch[index];
            const original = textBatch[index];
            const decoded = decodeHTML(tText);

            // Cache translation
            const cacheKey = `tatva_trans_${language}_${encodeURIComponent(original.trim())}`;
            localStorage.setItem(cacheKey, decoded);

            node.nodeValue = decoded;
            translatedValues.add(node);
          });
          isUpdatingDOMRef.current = false;
        }
      } catch (err) {
        console.error("Batch translation failure:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Restores all translated nodes back to their original English values
  const restoreOriginals = () => {
    if (typeof window === "undefined") return;

    const walkRestore = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        if (originals.has(textNode)) {
          isUpdatingDOMRef.current = true;
          textNode.nodeValue = originals.get(textNode) || "";
          translatedValues.delete(textNode);
          isUpdatingDOMRef.current = false;
        }
        return;
      }
      let child = node.firstChild;
      while (child) {
        walkRestore(child);
        child = child.nextSibling;
      }
    };
    walkRestore(document.body);
  };

  // Run DOM translation whenever language or DOM mutations occur
  useEffect(() => {
    if (language === "en") {
      restoreOriginals();
      return;
    }

    // Translate DOM initially
    translateDOM();

    // Setup MutationObserver to watch dynamic changes
    const observer = new MutationObserver((mutations) => {
      if (isUpdatingDOMRef.current) return; // Prevent loops from our own translations

      let shouldTranslate = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldTranslate = true;
          break;
        }
        if (mutation.type === "characterData") {
          const node = mutation.target as Text;
          const val = node.nodeValue || "";
          // React updated a text node to a new value (e.g. dynamic state data)
          if (val && val.trim() && !translatedValues.has(node)) {
            originals.set(node, val);
            shouldTranslate = true;
          }
        }
      }

      if (shouldTranslate) {
        translateDOM();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, translateText, translateTextWithLang, loading }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};

// Legacy inline helper compatibility fallback (no-op since translation is automated)
export const T: React.FC<{ children: string }> = ({ children }) => {
  return <>{children}</>;
};
