"use client";
import { Suspense } from 'react';
import GoogleOneTapClient from './GoogleOneTapClient';

export default function GoogleOneTapWrapper(){
  return (
    <Suspense fallback={null}>
      <GoogleOneTapClient />
    </Suspense>
  );
}
