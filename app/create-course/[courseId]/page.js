"use client"
import { db } from '@/configs/db'
import { Chapters, CourseList } from '@/configs/schema'
import { useUser } from '@clerk/nextjs'
import { and, eq } from 'drizzle-orm'
import React, { useEffect, useState } from 'react'
import CourseBasicInfo from './_components/CourseBasicInfo'
import CourseDetails from './_components/CourseDetails'
import ChapterList from './_components/ChapterList'
import { Button } from '@/components/ui/button'
import { GenerateChapterContent_AI } from '@/configs/AiModel'
import LoadingDialog from '../_components/LoadingDialog'
import service from '@/configs/service'
import { useParams, useRouter } from 'next/navigation'

function CourseLayout() {
  const { user } = useUser();
  const [course,setCourse]=useState([]);
  const [loading,setLoading]=useState(false);
  const router=useRouter();
  const params = useParams();
  useEffect(() => {
    if (params?.courseId && user) GetCourse();
  }, [params?.courseId,user])

  const GetCourse = async () => {
    const result = await db.select().from(CourseList)
      .where(and(eq(CourseList.courseId, params?.courseId),
        eq(CourseList?.createdBy, user?.primaryEmailAddress?.emailAddress)))
    
        setCourse(result[0]);
        console.log(result);
  }

  const GenerateChapterContent=async()=>{
    setLoading(true);
    
    // Debug the course structure
    console.log('Full course object:', course);
    console.log('Course output:', course?.courseOutput);
    console.log('Course output type:', typeof course?.courseOutput);
    console.log('Course output stringified:', JSON.stringify(course?.courseOutput, null, 2));
    
    let chapters;
    let courseOutput = course?.courseOutput;

    // Handle legacy shape where API returned { raw: text }
    if (courseOutput && typeof courseOutput === 'object' && courseOutput.raw && !courseOutput.course) {
      let raw = courseOutput.raw;
      if (typeof raw === 'string') {
        // Strip markdown code fences ```json ... ``` if present
        const fencedMatch = raw.match(/```json\n([\s\S]*?)```/i);
        if (fencedMatch) raw = fencedMatch[1];
        try {
          const parsedRaw = JSON.parse(raw);
          courseOutput = parsedRaw; // replace with parsed json
          console.log('Parsed courseOutput from raw fenced JSON');
        } catch (e) {
          console.warn('Failed to parse raw fenced JSON, will continue with existing structure');
        }
      }
    }
    
    // If courseOutput is a string, parse it first
    if (typeof courseOutput === 'string') {
      try {
        courseOutput = JSON.parse(courseOutput);
        console.log('Parsed courseOutput from string:', courseOutput);
      } catch (e) {
        console.error('Failed to parse courseOutput as JSON:', e);
        setLoading(false);
        return;
      }
    }
    
    // Try different possible structures for chapters
    if (courseOutput?.course?.chapters) {
      chapters = courseOutput.course.chapters;
    } else if (courseOutput?.chapters) {
      chapters = courseOutput.chapters;
    } else if (Array.isArray(courseOutput)) {
      // Edge case: model returned chapters array directly
      chapters = courseOutput;
    } else {
      console.error('No chapters found in courseOutput structure');
      console.log('courseOutput structure keys:', courseOutput ? Object.keys(courseOutput) : 'null');
      console.log('Full courseOutput:', courseOutput);
      
      // Let's try a deep search for chapters
      const findChapters = (obj, path = '') => {
        if (!obj || typeof obj !== 'object') return null;
        
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (key === 'chapters' && Array.isArray(value)) {
            console.log(`Found chapters at: ${currentPath}`, value);
            return value;
          }
          
          if (typeof value === 'object' && value !== null) {
            const found = findChapters(value, currentPath);
            if (found) return found;
          }
        }
        return null;
      };
      
      chapters = findChapters(courseOutput);
      if (!chapters) {
        console.error('No chapters array found anywhere in courseOutput structure');
      }
    }
    
    console.log('Extracted chapters:', chapters);
    
    // Add null check for chapters array
    if (!chapters || !Array.isArray(chapters)) {
      console.error('Chapters array is undefined or not an array');
      console.error('Available course keys:', course ? Object.keys(course) : 'course is null');
      setLoading(false);
      return;
    }
    
  // Track used video IDs during this generation run to avoid repeats across chapters
  const usedVideoIds = new Set();
  // Helper for richer video search (tries multiple queries until finds results) with chapter index for stage-based variation
  const searchVideosMulti = async(chapterName, chapterIndex)=>{
      const category = course?.category?.toLowerCase() || '';
      // Extract topic from courseOutput JSON structure or fallback to course name
      let topic = '';
      const courseOutput = course?.courseOutput;
      if (courseOutput?.course?.topic) {
        topic = courseOutput.course.topic.toLowerCase();
      } else if (courseOutput?.topic) {
        topic = courseOutput.topic.toLowerCase();
      } else {
        // Fallback to course name
        topic = course?.name?.toLowerCase() || '';
      }
      
      const courseName = course?.name?.toLowerCase() || '';
      const chapterLower = chapterName.toLowerCase();
      
      console.log(`[VideoSearch] Searching for chapter "${chapterName}" with topic "${topic}" in category "${category}"`);
      
      let queries = [];
      
      if (category.includes('programming') || category.includes('coding') || 
          /programming|coding|web|software|javascript|html|css|python|java|typescript|react|node|sql|database/.test(courseName)) {
        // Programming content with stage-aware diversity
        const topicKeyword = topic || 'programming';
        const total = (courseOutput?.course?.chapters?.length || courseOutput?.chapters?.length || chapters.length || 1);
        const ratio = (chapterIndex ?? 0) / Math.max(total-1,1);
        let stageWords = ['basics','introduction','fundamentals'];
        if(ratio>0.33) stageWords = ['intermediate','practice','examples'];
        if(ratio>0.66) stageWords = ['advanced','project','best practices'];
        const safeName = chapterName.replace(/[/\\()\[\]:]+/g,' ').trim();
        const tokens = safeName.split(/\s+/).filter(Boolean);
        const compact = tokens.filter(t=>t.length>3).slice(0,5).join(' ');
        queries = [
          `${topicKeyword} ${safeName} ${stageWords[0]} tutorial`,
          `${safeName} ${topicKeyword} ${stageWords[1]} guide`,
            `learn ${safeName} ${topicKeyword} ${stageWords[2]}`,
          `${topicKeyword} ${safeName} crash course`,
          `${safeName} ${topicKeyword} full course`,
          `${topicKeyword} ${safeName} walkthrough`,
          `${topicKeyword} ${safeName} project tutorial`,
          `${safeName} ${topicKeyword} concepts explained`,
          `${topicKeyword} ${compact} examples`,
          `${compact} ${topicKeyword} deep dive`
        ];
      } else if (category.includes('creative') || category.includes('art') || category.includes('design') ||
                 /drawing|sketch|paint|art|design|creative/.test(chapterLower) || /creative|art|design/.test(courseName)) {
        // Creative/Art content - include specific creative topic
        const topicKeyword = topic || 'art';
        queries = [
          `${topicKeyword} ${chapterName} tutorial step by step`,
          `how to ${chapterName} ${topicKeyword}`,
          `${chapterName} ${topicKeyword} tutorial`,
          `learn ${chapterName} ${topicKeyword} technique`,
          `${topicKeyword} ${chapterName} lesson`,
          `${chapterName} ${topicKeyword} guide`,
          `${topicKeyword} ${chapterName} basics`,
          `${chapterName} in ${topicKeyword}`,
          `${topicKeyword} ${chapterName} instruction`,
          `${topicKeyword} ${chapterName} fundamentals`
        ];
  // Removed health/wellness branch
      } else if (category.includes('business') || category.includes('finance') ||
                 /business|finance|marketing|entrepreneurship/.test(courseName)) {
        // Business content - include specific business topic
        const topicKeyword = topic || 'business';
        queries = [
          `${topicKeyword} ${chapterName} tutorial`,
          `${chapterName} ${topicKeyword} guide`,
          `how to ${chapterName} in ${topicKeyword}`,
          `${topicKeyword} ${chapterName} explained`,
          `${chapterName} ${topicKeyword} strategy`,
          `${topicKeyword} ${chapterName} business tutorial`
        ];
      } else {
        // Generic fallback - still use topic if available
        const topicKeyword = topic || '';
        queries = [
          `${topicKeyword} ${chapterName} tutorial`.trim(),
          `how to ${chapterName} ${topicKeyword}`.trim(),
          `${chapterName} ${topicKeyword} guide`.trim(),
          `learn ${chapterName} ${topicKeyword}`.trim(),
          `${chapterName} explained`
        ];
      }
      
      let collected=[];
    // De-duplicate queries locally
    queries = queries.filter((q,i,a)=>a.indexOf(q)===i);
    for(const q of queries){
        try{
          const resp = await service.getVideos(q);
          const mapped = resp.map(v=>({
            id:v?.id?.videoId,
            title:v?.snippet?.title,
            channel:v?.snippet?.channelTitle
          })).filter(v=>v.id);
      mapped.forEach(m=>{ if(!usedVideoIds.has(m.id) && !collected.some(c=>c.id===m.id)) collected.push(m); });
          console.log('Video search', q, 'found', mapped.length);
      if(collected.length>=6) break; // allow more candidates for diversity
        }catch(e){ console.warn('Video search failed for query', q, e); }
      }
      
      // If we didn't get enough results, try generic fallback searches
    if(collected.length < 3) {
        console.log('Not enough results for chapter', chapterName, ', trying fallback searches...');
        const fallbackQueries = [
          `${chapterName} tutorial`,
          `how to ${chapterName}`,
          `${chapterName} guide`,
          `learn ${chapterName}`,
      `${chapterName} explained`,
      `${chapterName} lesson`,
      `${chapterName} basics`,
      `${chapterName} for beginners`,
      `${chapterName} crash course`
        ];
        
        for(const q of fallbackQueries){
          if(collected.length >= 3) break;
          try{
            const resp = await service.getVideos(q);
            const mapped = resp.map(v=>({
              id:v?.id?.videoId,
              title:v?.snippet?.title,
              channel:v?.snippet?.channelTitle
            })).filter(v=>v.id);
            mapped.forEach(m=>{ if(!collected.some(c=>c.id===m.id)) collected.push(m); });
            console.log('Fallback video search', q, 'found', mapped.length);
          }catch(e){ console.warn('Fallback video search failed for query', q, e); }
        }
      }
      
      // If still no results, try ultra-generic searches
      if(collected.length === 0) {
        console.log('No results found, trying ultra-generic searches for', chapterName);
        const ultraGeneric = [
          `tutorial`,
          `how to guide`,
          `learning basics`,
          `beginner tutorial`,
          `step by step guide`
        ];
        
        for(const q of ultraGeneric){
          if(collected.length >= 1) break;
          try{
            const resp = await service.getVideos(q);
            const mapped = resp.map(v=>({
              id:v?.id?.videoId,
              title:v?.snippet?.title,
              channel:v?.snippet?.channelTitle
            })).filter(v=>v.id);
            if(mapped.length > 0) {
              collected.push(mapped[0]); // Take at least one
              console.log('Ultra-generic search found fallback video');
              break;
            }
          }catch(e){ console.warn('Ultra-generic search failed', e); }
        }
      }
      
      console.log(`Final video search results for "${chapterName}": ${collected.length} videos found`);
  return collected.slice(0,6); // Return up to 6 candidates
    }

  for (const [index, chapter] of chapters.entries()) {
      setLoading(true);

  const level = (course?.level||'').toLowerCase();
  let depthInstr = 'Explain clearly with definitions, purpose, simple analogies.';
  if(level.includes('intermediate')) depthInstr = 'Focus on practical application, internal workings, trade-offs, and moderately complex examples.';
  if(level.includes('advance') || level.includes('advanced')) depthInstr = 'Provide in-depth technical detail, performance considerations, pitfalls, and advanced real-world patterns.';
  const PROMPT = `Return JSON with fields: name, about, sections (array of {title, description, codeExample?}). Topic:${course?.name}. Chapter:${chapter?.name}. Level:${course?.level}. ${depthInstr} Omit any duration field. Use <precode> tags ONLY wrapping raw code in codeExample.`;
      console.log(PROMPT)
      // if(index<3)
      // {
          try{
            let videoId='';
            let videoCandidates=[];

            //Generate Video URL (with fallback multi-query)
            videoCandidates = await searchVideosMulti(chapter?.name, index);
            
            // Ensure we have at least one video candidate
            if (videoCandidates.length === 0) {
              console.warn(`No video candidates found for chapter: ${chapter?.name}, using placeholder`);
              videoCandidates = [{
                id: 'dQw4w9WgXcQ', // Placeholder video ID (Rick Roll as emergency fallback)
                title: `${chapter?.name} - No specific video found`,
                channel: 'Placeholder'
              }];
            }
            
            videoId = videoCandidates[0]?.id || 'pending'; // placeholder to satisfy notNull
            if(videoId && videoId!=='pending') usedVideoIds.add(videoId);
            console.log(`Chapter "${chapter?.name}" - Found ${videoCandidates.length} video candidates, using:`, videoId);
            //generate chapter content
              const result=await GenerateChapterContent_AI.sendMessage(PROMPT);
              // console.log(result?.response?.text());
              const content=JSON.parse(result?.response?.text())
              // Embed candidates inside content for later replacement
              content.video = { 
                primary: videoId || null,
                fallback: videoCandidates[1]?.id || null,
                candidates: videoCandidates
              }
              
              // Save Chapter Content + Video URL
             // Ensure content has name/about for later fallback listing
             if(!content.name) content.name = chapter?.name || `Chapter ${index+1}`;
             if(!content.about) content.about = chapter?.about || '';
             // Insert (skip if row already exists to prevent duplicates)
             try {
              const resp= await db.insert(Chapters).values({
                  chapterId:index,
                  courseId:course?.courseId,
                  content:content,
                  videoId:videoId
               }).returning({id:Chapters.id})
               console.log('Inserted chapter row', resp);
             } catch(insertErr){
               console.warn('Insert failed (maybe exists). Will attempt update.', insertErr);
               try {
                 await db.update(Chapters).set({content:content, videoId:videoId}).where(and(eq(Chapters.courseId, course?.courseId), eq(Chapters.chapterId, index)));
               } catch(updateErr){
                 console.error('Update after failed insert also failed', updateErr);
               }
             }
              setLoading(false)
          }catch(e)
          {
            setLoading(false);
            console.log(e)
          }
          // Mark publish only for this course after each successful chapter to reflect progress
          await db.update(CourseList).set({ publish:true }).where(eq(CourseList.courseId, course?.courseId));

         if(index==chapters?.length-1) 
         {
          router.replace('/create-course/'+course?.courseId+"/finish")
         }
      //  }

    }
  }

  // Regenerate videos for chapters missing videoId
  const RegenerateMissingVideos = async()=>{
    if(!course?.courseId) return;
    setLoading(true);
    try{
      const existing = await db.select().from(Chapters).where(eq(Chapters.courseId, course.courseId));
      const output = course?.courseOutput;
      const courseChapters = output?.course?.chapters || output?.chapters || [];
      for(const ch of existing){
        if(!ch.videoId || ch.videoId==='pending'){
          console.log('Regenerating video for chapter', ch.chapterId);
          const contentObj = ch.content || {};
          const chapterName = contentObj?.name || courseChapters?.[ch.chapterId]?.name || `Chapter ${ch.chapterId+1}`;
          const candidates = await searchVideosMulti(chapterName);
          if(candidates.length){
            await db.update(Chapters).set({
              videoId:candidates[0].id,
              content:{...ch.content, video:{primary:candidates[0].id, fallback:candidates[1]?.id||null, candidates}}
            }).where(and(eq(Chapters.courseId, course.courseId), eq(Chapters.chapterId, ch.chapterId)));
          }
        }
      }
      alert('Video regeneration complete (check chapters)');
    }catch(e){
      console.error(e); alert('Regeneration failed');
    }finally{ setLoading(false); }
  }

  // Backfill any missing chapter rows (in case earlier generation failed when videoId empty)
  const BackfillMissingChapters = async()=>{
    if(!course?.courseId) return;
    setLoading(true);
    try{
      const existing = await db.select().from(Chapters).where(eq(Chapters.courseId, course.courseId));
      const existingIds = new Set(existing.map(e=>e.chapterId));
      const output = course?.courseOutput;
      const courseChapters = output?.course?.chapters || output?.chapters || [];
      for(const [index, ch] of courseChapters.entries()){
        if(!existingIds.has(index)){
          console.log('Backfilling missing chapter row', index);
          const placeholderContent = { name: ch?.name || `Chapter ${index+1}`, about: ch?.about || '', sections: [], video:{ primary:null, fallback:null, candidates:[] } };
          await db.insert(Chapters).values({
            chapterId:index,
            courseId:course.courseId,
            content:placeholderContent,
            videoId:'pending'
          });
        }
      }
      alert('Backfill done. Now click Regenerate Videos.');
    }catch(e){ console.error(e); alert('Backfill failed'); }
    finally{ setLoading(false); }
  }
  return (
    <div className='mt-10 px-7 md:px-20 lg:px-44'>
      <h2 className='font-bold text-center text-2xl'>Course Layout</h2>

      <LoadingDialog loading={loading} />
      {/* Basic Info  */}
        <CourseBasicInfo course={course} refreshData={()=>GetCourse()} />
      {/* Course Detail  */}
        <CourseDetails course={course} />
      {/* List of Lesson  */}
        <ChapterList course={course} refreshData={()=>GetCourse()}/>

      <div className='flex flex-wrap gap-3 my-10'>
        <Button onClick={GenerateChapterContent}>Generate Course Content</Button>
        <Button variant="outline" onClick={RegenerateMissingVideos}>Regenerate Videos</Button>
        <Button variant="secondary" onClick={BackfillMissingChapters}>Backfill Chapters</Button>
      </div>
    </div>
  )
}

export default CourseLayout