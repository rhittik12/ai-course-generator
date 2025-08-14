"use client";
import { db } from "@/configs/db";
import { useUser } from "@clerk/nextjs";
import { desc, eq } from "drizzle-orm";
import React, { useContext, useEffect, useState } from "react";
import CourseCard from "./CourseCard";
import { CourseList, Chapters } from '@/configs/schema'
import { UserCourseListContext } from "@/app/_context/UserCourseListContext";

const UserCourseList = () => {
  const [courseList, setCourseList] = useState([]);
  const {userCourseList, setUserCourseList} = useContext(UserCourseListContext)
  const { user } = useUser();
  useEffect(() => {
    user && getUserCourses();
  }, [user]);

  
  const getUserCourses=async()=>{
    const result=await db.select().from(CourseList)
    .where(eq(CourseList?.createdBy,user?.primaryEmailAddress?.emailAddress))
    .orderBy(desc(CourseList.id))
    
    // Enrich each course with DB chapters if courseOutput lacks them
    const enriched = await Promise.all(result.map(async (course) => {
      const output = course?.courseOutput;
      let chapters = output?.course?.chapters || output?.chapters || [];
      
      if (!Array.isArray(chapters) || chapters.length === 0) {
        // Fallback: load from DB
        const dbChapters = await db.select().from(Chapters)
          .where(eq(Chapters.courseId, course.courseId))
          .orderBy(Chapters.chapterId);
        
        chapters = dbChapters.map(ch => ({
          name: ch.content?.name || `Chapter ${ch.chapterId + 1}`,
          about: ch.content?.about || ''
        }));
        
        console.log('Loaded chapters from DB for course:', course.courseId, chapters);
      }
      
      return {
        ...course,
        _enrichedChapters: chapters
      };
    }));
    
    console.log('Final enriched courses:', enriched);
    setCourseList(enriched);
    setUserCourseList(enriched);
  }

  return (
    <div className="mt-10">
      <h2 className="font-medium text-xl">My AI Courses</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {courseList?.length>0? courseList?.map((course) => (
        <CourseCard course={course} key={course?.id ?? course?.courseId ?? course?.createdBy}
                  refreshData={()=>getUserCourses()}/>
            )):
            [1,2,3,4,5].map((item) => (
                <div key={`skeleton-${item}`} className='w-full mt-5 bg-slate-200 animate-pulse rounded-lg h-[270px]'>
                  <h1 className="opacity-0">{item}</h1>
                </div>
              ))}
              
        </div>
    </div>
  );
};

export default UserCourseList;
