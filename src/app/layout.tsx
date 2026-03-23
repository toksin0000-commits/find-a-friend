import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Find a Friend",
  description: "Anonymní minimalistický chat pro náhodná spojení.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "1a3aa391-2859-44fe-bc66-5ca65ae32af0",
                safari_web_id: "web.onesignal.auto.1090098e-4903-4552-95f3-c54784a6c6e7", // Pokud máš, jinak nevadí
                notifyButton: {
                  enable: true, // PŘIDÁNO: Zobrazí zvoneček pro ruční aktivaci (klíčové pro PWA)
                },
                allowLocalhostAsSecureOrigin: true,
              });

              // POKUS O AUTOMATICKÉ PROPOJENÍ S ANON ID
              const anonId = localStorage.getItem("anonId");
              if (anonId) {
                await OneSignal.login(anonId);
                console.log("OneSignal: Uživatel přihlášen pod ID", anonId);
              }
            });
          `}
        </Script>

        <ServiceWorkerRegister />
        {children}
        <Analytics />
      </body>
    </html>
  );
}