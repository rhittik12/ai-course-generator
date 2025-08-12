"use client"
import dynamic from 'next/dynamic'
const UserButton = dynamic(() => import('@clerk/nextjs').then(m => m.UserButton), { ssr: false })
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import ThemeToggle from '@/app/_components/ThemeToggle'

function Header() {
  return (
  <div className='sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/60 border-b border-gray-100 dark:supports-[backdrop-filter]:bg-neutral-900/70 dark:bg-neutral-900/60 dark:border-white/10'>
      <div className='max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between'>
        <Link href={'/dashboard'} className='flex items-center gap-2'>
          <Image alt="App"  src={'/favicon.svg'} width={36} height={36} className='h-9 w-9' />
        </Link>
        <div className='flex items-center gap-3'>
          <ThemeToggle />
          <UserButton/>
        </div>
      </div>
    </div>
  )
}

export default Header