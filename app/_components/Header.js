import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import React from 'react'

function Header() {
  return (
  <div className='sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/60 border-b border-gray-100 dark:supports-[backdrop-filter]:bg-neutral-900/70 dark:bg-neutral-900/60 dark:border-white/10'>
      <div className='max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between'>
        <Link href={'/'} className='flex items-center gap-2'>
          <Image alt="Logo" src={'/logo.svg'} width={130} height={40} className='h-8 w-auto' />
        </Link>
        <div className='flex items-center gap-3'>
          <ThemeToggle />
          <Link href={'/dashboard'}>
            <Button variant="gradient" size="lg">Get Started</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Header