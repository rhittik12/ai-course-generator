"use client";
import { GoogleOneTap } from "@clerk/nextjs";

export default function GoogleOneTapClient() {
  // Render on client only to avoid SSR hydration mismatches
  return <GoogleOneTap />;
}
