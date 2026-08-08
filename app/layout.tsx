import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/components/Providers";
import BackgroundPattern from "@/components/BackgroundPattern";
import DockNav from "@/components/DockNav";
import { TranslationProvider } from "@/components/TranslationContext";
import TranslationWidget from "@/components/TranslationWidget";

const notoserif = Noto_Serif({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Tatva",
  description: "Tatva",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="apple-touch-icon"
          href="https://ik.imagekit.io/tegfbc59i/TATVA/ChatGPT%20Image%20Jul%207,%202026,%2010_07_23%20AM.png"
        />
      </head>
      <body className={`${notoserif.className} relative`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TranslationProvider>
              <TooltipProvider>
                <BackgroundPattern />
                <main className="pb-16">{children}</main>
                <DockNav />
                <TranslationWidget />
              </TooltipProvider>
            </TranslationProvider>
          </AuthProvider>
          <ToastContainer
            autoClose={2000}
            position="top-right"
            theme="light"
            closeOnClick={true}
            pauseOnHover={true}
            hideProgressBar={false}
            newestOnTop={true}
            transition={Slide}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

