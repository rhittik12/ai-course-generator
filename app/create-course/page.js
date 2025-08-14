"use client";
import { Button } from "@/components/ui/button";
import React, { useContext, useState, useEffect } from "react";
import { HiClipboardDocumentCheck, HiInboxStack, HiLightBulb, HiMiniSquares2X2 } from "react-icons/hi2";
import SelectCategory from "./_components/SelectCategory";
import TopicDescription from "./_components/TopicDescription";
import SelectOption from "./_components/SelectOption";
import { UserInputContext } from "../_context/UserInputContext";
import { sendCourseLayoutMessage } from "@/configs/AiModel";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import LoadingDialog from "./_components/LoadingDialog";
import { CourseList } from "@/configs/schema";
import { useUser } from "@clerk/nextjs";
import { UserProfile } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import { db } from "@/configs/db";

const CreateCourse = () => {
  const StepperOptions = [
    {
      id: 1,
      name: 'Category',
      icon: <HiMiniSquares2X2 />
    },
    {
      id: 2,
      name: 'Topic & Desc',
      icon: <HiLightBulb />
    },
    {
      id: 3,
      name: 'Options',
      icon: <HiClipboardDocumentCheck />
    }
  ]


  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const router=useRouter();
  useEffect(() => {
    console.log(userCourseInput);
  }, [userCourseInput]);

  const checkStatus = () => {
    if (userCourseInput?.length == 0) {
      return true;
    }
    if(activeIndex == 0 && (userCourseInput?.category?.length == 0 || userCourseInput?.category == undefined )){
      return true;
    }
    if(activeIndex == 1 && (userCourseInput?.topic?.length == 0 || userCourseInput?.topic == undefined )){
      return true;
  }else if(activeIndex == 2 && (userCourseInput?.level == undefined || userCourseInput?.displayVideo == undefined || userCourseInput?.noOfChapters == undefined)){
      return true
    }
    return false;
  };

  const GenerateCourseLayout = async () => {
    setError(null)
    setLoading(true)
    const BASIC_PROMPT = 'Generate a structured programming course JSON with fields: course.name, course.description, course.noOfChapters, course.level, course.chapters (array of {name, about, difficultyTag}). Do NOT include duration anywhere.'
    const levelGuidance = userCourseInput?.level === 'Beginner'
      ? 'Chapters should start from absolute basics, incremental small concepts.'
      : userCourseInput?.level === 'Intermediate'
        ? 'Assume fundamentals known; focus on applied patterns, problem-solving, deeper concepts.'
        : 'Assume strong base; focus on advanced architecture, optimization, scalability, edge cases.';
    const USER_INPUT_PROMPT = ` Category: ${userCourseInput?.category}; Topic: ${userCourseInput?.topic}; Level: ${userCourseInput?.level}; NoOfChapters: ${userCourseInput?.noOfChapters}. ${levelGuidance} Ensure each chapter name is concise and unique.`
    const FINAL_PROMPT = BASIC_PROMPT + USER_INPUT_PROMPT
    console.log(FINAL_PROMPT);
    try {
      // Prefer server endpoint to keep keys server-side
      const res = await fetch('/api/ai/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: FINAL_PROMPT })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'AI request failed')
      setLoading(false)
      SaveCourseLayoutInDb(data)
    } catch (err) {
      console.error('AI error', err)
      setLoading(false)
      setError(err?.message || 'AI request failed')
    }
  }
  
  const SaveCourseLayoutInDb = async (courseLayout) => {
    // Ensure auth context is ready
    if (!userLoaded) {
      setError('User not loaded yet. Please wait a second and retry.');
      return;
    }
    if (!isSignedIn) {
      setError('You must be signed in to save a course.');
      return;
    }
    const createdBy = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || user?.id;
    if (!createdBy) {
      setError('Unable to resolve user identity for saving course.');
      return;
    }
    // Validate required course input again defensively
    if (!userCourseInput?.topic || !userCourseInput?.level || !userCourseInput?.category) {
      setError('Missing required course details. Please complete all fields.');
      return;
    }
    try {
      const id = uuidv4();
      setLoading(true);
      await db.insert(CourseList).values({
        courseId: id,
        name: userCourseInput.topic,
        level: userCourseInput.level,
        category: userCourseInput.category,
        courseOutput: courseLayout,
        createdBy,
        userName: user?.fullName || null,
        userProfileImage: user?.imageUrl || null,
      });
      console.log("Finish");
      setLoading(false);
      router.replace('/create-course/' + id);
    } catch (e) {
      console.error('DB insert failed', e);
      setLoading(false);
      setError('Failed to save course. Please retry.');
    }
  }
  
  return (
    <div>
      {/* Stepper */}
      <div className="flex flex-col justify-center items-center mt-10">
        <h2 className="text-4xl text-primary font-medium">Create Course</h2>
        <div className="flex mt-10">
          {StepperOptions.map((item, index) => (
            <div className="flex items-center" key={item.id}>
              <div className="flex flex-col items-center w-[10px] md:w-[100px]">
                <div
                  className={`bg-gray-200 p-3 rounded-full text-white ${
                    activeIndex >= index && "bg-primary"
                  }`}
                >
                  {item.icon}
                </div>
                <h2 className="hidden md:block md:text-sm">{item.name}</h2>
              </div>
              {index != StepperOptions?.length - 1 && (
                <div
                  className={`h-1 w-[50px] md:w-[100px] rounded-full lg:w-[170px] bg-gray-300 
                ${activeIndex >= index && "bg-primary"}`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Components */}

      {/* Next Previous Button */}
      <div className="px-10 md:px-20 lg:px-44 mt-10">
        {activeIndex == 0 ? <SelectCategory /> : null}
        {activeIndex == 1 ? <TopicDescription /> : null}
        {activeIndex == 2 ? <SelectOption /> : null}

        <div className="flex justify-between mt-10">
          <Button
            variant="outline"
            disabled={activeIndex == 0}
            onClick={() => setActiveIndex(activeIndex - 1)}
          >
            Previous
          </Button>
          {activeIndex < 2 && (
            <Button
              disabled={checkStatus()}
              onClick={() => setActiveIndex(activeIndex + 1)}
            >
              Next
            </Button>
          )}
          {activeIndex == 2 && (
            <Button 
            disabled={checkStatus()}
            onClick={() => GenerateCourseLayout()}>
              Generate Course Layout
            </Button>
          )}
        </div>
      </div>
      <LoadingDialog loading={loading}/>
      {/* Error dialog */}
      <AlertDialog open={!!error}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>We hit a limit</AlertDialogTitle>
            <AlertDialogDescription>
              {error}
              <br />
              Tips: Wait a few minutes and retry, or set NEXT_PUBLIC_GEMINI_MODEL / NEXT_PUBLIC_GEMINI_FALLBACK_MODEL to a less busy model, or add billing to raise quotas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setError(null)}>Close</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateCourse;
