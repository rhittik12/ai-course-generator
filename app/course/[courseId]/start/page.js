"use client"
import { db } from '@/configs/db'
import { Chapters, CourseList } from '@/configs/schema'
import { and, eq } from 'drizzle-orm'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ChapterListCard from './_components/ChapterListCard'
import ChapterContent from './_components/ChapterContent'

function CourseStart() {

    const [course,setCourse]=useState();
    const [selectedChapter,setSelectedChapter]=useState(0);
    const [chapterContent,setChapterContent]=useState();
    const [dbChapters,setDbChapters]=useState([]);
    const params = useParams();
        useEffect(()=>{
                if (params?.courseId) GetCourse();
        },[params?.courseId])

        // When course loads, select first chapter automatically (fallback to DB rows)
        useEffect(()=>{
            console.log('[CourseStart] Chapter selection effect triggered:', {
                course: course?.name,
                selectedChapter: typeof selectedChapter === 'object' ? selectedChapter?.name : selectedChapter,
                dbChaptersCount: dbChapters.length
            });
            
            const outputChapters = course?.courseOutput?.course?.chapters || course?.courseOutput?.chapters;
            if(outputChapters && outputChapters.length>0 && (selectedChapter === 0 || !selectedChapter?.name)){
                const first = outputChapters[0];
                console.log('[CourseStart] Selecting first chapter from courseOutput:', first);
                setSelectedChapter(first);
                GetSelectedChapterContent(0);
            } else if(dbChapters.length>0 && (selectedChapter === 0 || !selectedChapter?.name)){
                const first = dbChapters[0];
                console.log('[CourseStart] Selecting first chapter from DB:', first);
                setSelectedChapter(first);
                GetSelectedChapterContent(first.chapterId);
            }
        },[course, dbChapters]);

    // useEffect(()=>{
       
    //     GetSelectedChapterContent(0)
    // },[course])

    /**
     * Used to get Course Info by Course Id
     */
    const GetCourse=async()=>{
        const result=await db.select().from(CourseList)
            .where(eq(CourseList?.courseId,params?.courseId));
        let c = result[0];
        if(!c){
            console.warn('[CourseStart] No course found for id', params?.courseId);
            return;
        }

        // Parse courseOutput if it is a string or wrapped in raw fenced JSON
        let output = c.courseOutput;
        try {
            if(output && typeof output === 'object' && output.raw && !output.course){
                let raw = output.raw;
                if(typeof raw === 'string'){
                    const fencedMatch = raw.match(/```json\n([\s\S]*?)```/i);
                    if(fencedMatch) raw = fencedMatch[1];
                    try { output = JSON.parse(raw); } catch(parseErr){ console.warn('[CourseStart] Failed to parse fenced raw json', parseErr); }
                }
            } else if(typeof output === 'string'){
                try { output = JSON.parse(output); } catch(parseErr){ console.warn('[CourseStart] Failed to parse courseOutput string', parseErr); }
            }
        } catch(e){ console.warn('[CourseStart] Unexpected parse error', e); }
        c = { ...c, courseOutput: output };
        setCourse(c);

        // Load chapters from DB to show topics even if courseOutput missing or malformed
        const chRows = await db.select().from(Chapters).where(eq(Chapters.courseId, params?.courseId));
        const normalized = chRows.sort((a,b)=>a.chapterId-b.chapterId).map(r=>({
            name: r.content?.name || `Chapter ${r.chapterId+1}`,
            about: r.content?.about || '',
            chapterId: r.chapterId
        }));
        setDbChapters(normalized);

        // Immediately choose first chapter object (from output or DB) to avoid lingering numeric state
        const outputChapters = output?.course?.chapters || output?.chapters;
        if(Array.isArray(outputChapters) && outputChapters.length){
            const first = outputChapters[0];
            // ensure shape
            const firstObj = typeof first === 'object' ? first : { name: first?.name || `Chapter 1`, about: first?.about || '' , chapterId:0 };
            setSelectedChapter(firstObj);
        } else if(normalized.length){
            setSelectedChapter(normalized[0]);
        } else {
            // fallback placeholder so ChapterContent can still run video search
            setSelectedChapter({ name: 'Chapter 1', about: '', chapterId:0 });
        }
    }

    const GetSelectedChapterContent=async(chapterId)=>{
      if(!course?.courseId) {
        console.warn('[CourseStart] GetSelectedChapterContent called but no courseId available');
        return;
      }
      
      console.log('[CourseStart] Loading chapter content for chapterId:', chapterId);
      
      try {
        const result=await db.select().from(Chapters)
        .where(and(eq(Chapters.chapterId,chapterId),
        eq(Chapters.courseId,course?.courseId)));

        setChapterContent(result[0]);
        console.log('[CourseStart] Chapter content loaded:', result[0]);
      } catch(e) {
        console.error('[CourseStart] Failed to load chapter content:', e);
      }
    }

  return (
    <div>
        {/* Chapter list Side Bar  */}
        <div className=' fixed md:w-72 hidden md:block h-screen border-r shadow-sm'>
            <h2 className='font-medium text-lg bg-primary p-4
            text-white'>{course?.courseOutput?.course?.name}</h2>

                        <div>
                                {(()=>{ // robust chapter extraction + DB fallback + deep search
                                    const output = course?.courseOutput;
                                    const deepFind = (obj)=>{
                                        if(!obj || typeof obj!=='object') return null;
                                        for(const [k,v] of Object.entries(obj)){
                                            if(k.toLowerCase()==='chapters' && Array.isArray(v)) return v;
                                            if(typeof v==='object'){
                                                const found = deepFind(v);
                                                if(found) return found;
                                            }
                                        }
                                        return null;
                                    }
                                    let chs = output?.course?.chapters || output?.chapters;
                                    if(!Array.isArray(chs)) chs = deepFind(output) || [];
                                    if(!Array.isArray(chs) || chs.length===0){
                                        chs = dbChapters; // fallback to DB stored names
                                    }
                                    // Normalize each chapter so it always has name/about/chapterId
                                    chs = (chs||[]).map((c,i)=>{
                                        if(typeof c !== 'object') return { name: `Chapter ${i+1}`, about:'', chapterId:i };
                                        return {
                                            name: c.name || c.title || `Chapter ${i+1}`,
                                            about: c.about || c.description || '',
                                            chapterId: c.chapterId ?? i
                                        }
                                    });
                                    return chs;
                                })()?.map((chapter,index)=>(
                    <div key={chapter.chapterId ?? index} 
                    className={`cursor-pointer
                    hover:bg-purple-50
                    ${selectedChapter?.name==chapter?.name&&'bg-purple-100'}
                    `}
                    onClick={()=>{
                    // Clear previous chapter content/video before loading new
                    setChapterContent(undefined);
                    setSelectedChapter(chapter);
                    const cid = chapter.chapterId ?? index;
                    GetSelectedChapterContent(cid)
                    }}
                    >
                        <ChapterListCard chapter={chapter} index={index} />
                    </div>
                ))}
            </div>
        </div>
        {/* Content Div  */}
        <div className='md:ml-72'>
            {(() => {
                // Resolve chapter object even if state kept an index
                if(!course?.courseId) return (
                    <div className='p-10 flex items-center justify-center min-h-[400px]'>Loading course...</div>
                );
                let chapObj = selectedChapter;
                if(typeof chapObj !== 'object' || !chapObj?.name){
                    const outputChapters = course?.courseOutput?.course?.chapters || course?.courseOutput?.chapters || [];
                    if(Array.isArray(outputChapters) && outputChapters[selectedChapter]) chapObj = outputChapters[selectedChapter];
                    if(typeof chapObj !== 'object') chapObj = { name: `Chapter ${(selectedChapter??0)+1}`, about: '', chapterId: selectedChapter??0 };
                }
                return (
                    <ChapterContent 
                        key={chapObj.chapterId ?? chapObj.name}
                        chapter={chapObj}
                        content={chapterContent}
                        courseId={course?.courseId}
                        courseName={course?.name || course?.courseOutput?.course?.name}
                    />
                );
            })()}
        </div>
    </div>
  )
}

export default CourseStart