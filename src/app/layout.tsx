import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-ink text-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
