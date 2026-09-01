import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import { JsonLd } from "@/components/seo/json-ld";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://saathika.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Saathika — Premium Indian Dating App | Match & Connect",
    template: "%s | Saathika",
  },
  description:
    "Saathika is a premium Indian dating app featuring verified profiles, smart matchmaking, voice-first chat, privacy controls, and meaningful connections.",
  keywords: [
    "dating app",
    "indian dating app",
    "saathika",
    "matchmaking app",
    "verified profiles",
    "online dating india",
    "relationships",
    "voice chat dating",
    "meet singles",
  ],
  authors: [{ name: "Saathika Team", url: siteUrl }],
  creator: "Saathika",
  publisher: "Saathika",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Saathika",
    title: "Saathika — Premium Indian Dating Experience",
    description:
      "Saathika is a premium Indian dating app featuring verified profiles, smart matchmaking, voice-first chat, and privacy controls.",
    images: [
      {
        url: "/saathika-logo.jpg",
        width: 1200,
        height: 630,
        alt: "Saathika Dating App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Saathika — Premium Indian Dating Experience",
    description:
      "Saathika is a premium Indian dating app featuring verified profiles, smart matchmaking, and privacy controls.",
    images: ["/saathika-logo.jpg"],
    creator: "@saathika_app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <JsonLd />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

