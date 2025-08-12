"use client"
import React, { useContext } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserCourseListContext } from '@/app/_context/UserCourseListContext';
const AddCourse = () => {
    const {user} = useUser();
    const {userCourseList, setUserCourseList} = useContext(UserCourseListContext)
  return (
    <div className='flex items-center justify-between mt-6'>
      <div>
        <div className='text-2xl md:text-3xl tracking-tight'>Hello,{' '}
          <span className='font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600'>
            {user?.fullName}
          </span>
        </div>
        <p className='text-sm text-gray-600 mt-1'>Create a new course with AI, share with friends, and earn from it.</p>
      </div>
  <Link href={'/create-course'}>
        <Button variant="gradient" size="lg">+ Create AI Course</Button>
      </Link>
    </div>
  )
}

export default AddCourse