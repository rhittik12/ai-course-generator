"use client";
import { useEffect, useState } from 'react';
import { GoogleOneTap, useUser } from "@clerk/nextjs";

export default function GoogleOneTapClient() {
  // Avoid SSR mismatch by rendering only after mount and only if user is signed out
  const { isSignedIn, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !isLoaded || isSignedIn) return null;
  return <GoogleOneTap />;
}
