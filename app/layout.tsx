import type { Metadata } from "next";
import "./globals.css";
import "./story.css";
import "./notebook.css";
import "./maximal.css";
import "./curiosity.css";
import "./drink-journey.css";

export const metadata: Metadata = {
  title: "A Guy Called Avinash — His Story So Far",
  description:
    "The portfolio of Sai Avinash: data science student at IIT Madras, startup operator, writer, and builder of AI driven products.",
  openGraph: {
    title: "A Guy Called Avinash — His Story So Far",
    description:
      "An ongoing story of strategy, technology, and the people in between.",
    images: [{ url: "/avinash-portrait.jpg", width: 1080, height: 1920 }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,500;1,400;1,500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
