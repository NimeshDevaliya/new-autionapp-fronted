import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MedianV Auction",
    template: "%s · MedianV Auction",
  },
  description:
    "Run live cricket player auctions, manage squads and follow tournament statistics.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${barlowCondensed.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-ink text-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
