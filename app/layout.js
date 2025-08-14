import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import GoogleOneTapWrapper from './_components/GoogleOneTapWrapper';
import { Analytics } from "@vercel/analytics/react"

const inter = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "AI Course Generator",
  description: "Create engaging courses with AI in minutes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
  <body className={`${inter.className} min-h-screen antialiased bg-gradient-to-b from-white via-purple-50/40 to-white dark:from-[#0b0b10] dark:via-[#0b0b12] dark:to-[#0b0b10]` }>
        <ClerkProvider>
          {children}
          <GoogleOneTapWrapper />
        </ClerkProvider>
      </body>
    </html>
  );
}