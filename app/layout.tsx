import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

import { ExperienceProvider } from "@/providers/ExperienceProvider";
import { LayoutProvider } from "@/providers/LayoutProvider";
import { AuthProvider } from "@/providers/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "CommerceOS",
  description: "The Operating System for Ecommerce Businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.remove('dark');try{localStorage.removeItem('commerceos.theme.v1')}catch(e){}",
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased">
        <AuthProvider>
          <ExperienceProvider>
            <LayoutProvider>{children}</LayoutProvider>
          </ExperienceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
