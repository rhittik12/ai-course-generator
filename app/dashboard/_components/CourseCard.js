import Image from 'next/image'
import React, { useMemo } from 'react'
import { HiOutlineBookOpen } from "react-icons/hi2";
import { HiMiniEllipsisVertical } from "react-icons/hi2";
import DropdownOption from './DropdownOption';
import { db } from '@/configs/db';
import { CourseList } from '@/configs/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';


function CourseCard({course,refreshData,displayUser=false}) {

    const handleOnDelete=async()=>{
        const resp=await db.delete(CourseList)
        .where(eq(CourseList.id,course?.id))
        .returning({id:CourseList?.id})
        
        if(resp)
        {
            refreshData()
        }
    }

    // Extract chapter names (support multiple shapes, legacy, direct array, or embedded in content).
    const chapterNames = useMemo(()=>{
        // Try enriched chapters first (from DB fallback)
        if (course?._enrichedChapters?.length) {
            return course._enrichedChapters.map(c => c?.name || 'Unnamed Chapter');
        }
        
        let chapters = course?.courseOutput?.course?.chapters || course?.courseOutput?.chapters;
        if(Array.isArray(chapters)){
            return chapters.map((c,i)=> c?.name || `Chapter ${i+1}`);
        }
        return [];
    },[course]);

    return (
        <div className='shadow-sm rounded-lg border p-2 cursor-pointer mt-4 hover:border-primary bg-card text-card-foreground'>
        <Link href={'/course/'+course?.courseId}>
            <Image alt="placeholder"  src={course?.courseBanner} width={300} height={200}
            className='w-full h-[200px] object-cover rounded-lg'
            />
        </Link>
        <div className='p-2'>
            <h2 className='font-medium text-lg flex justify-between items-center'>{course?.courseOutput?.course?.name}
            
           {!displayUser&& <DropdownOption
            handleOnDelete={()=>handleOnDelete()}
            ><HiMiniEllipsisVertical/></DropdownOption>}
            </h2>
            
            <p className='text-sm text-gray-500 dark:text-gray-400 my-1'>{course?.category}</p>
            <div className='flex items-center justify-between'>
                <h2 className='flex gap-2 items-center p-1 bg-purple-50 dark:bg-neutral-800/80 text-primary text-sm rounded-sm'>
                    <HiOutlineBookOpen/>{course?.courseOutput?.course?.numberOfChapters} Chapters</h2>
                <h2 className='text-sm bg-purple-50 dark:bg-neutral-800/80 text-primary p-1 rounded-sm'>{course?.level}</h2>
            
            </div>
            {chapterNames.length>0 && (
                <div className='mt-2'>
                    <p className='text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1'>Topics</p>
                    <div className='flex flex-wrap gap-1 max-h-16 overflow-hidden'>
                        {chapterNames.slice(0,8).map((name,i)=>(
                            <span key={i} className='text-[10px] bg-muted dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-border line-clamp-1 max-w-[110px] whitespace-nowrap overflow-hidden text-ellipsis'>
                                {name}
                            </span>
                        ))}
                        {chapterNames.length>8 && <span className='text-[10px] text-gray-500'>+{chapterNames.length-8} more</span>}
                    </div>
                </div>
            )}
          {!displayUser&&  <div className='flex gap-2 items-center mt-2'>
                <Image alt="placeholder"  src={course?.userProfileImage} width={35} height={35}
                className='rounded-full'
                />
                <h2 className='text-sm'>{course?.userName}</h2>
            </div>}
        </div>
    </div>
  )
}

export default CourseCard