"use client"
import React, { useState, useEffect, useRef } from 'react'
import service from '@/configs/service'
import YouTube from 'react-youtube'
import ReactMarkdown from 'react-markdown';
import { db } from '@/configs/db';
import { Chapters, CourseList } from '@/configs/schema';
import { and, eq } from 'drizzle-orm';
const opts = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 0,
    },
  };
function ChapterContent({chapter,content,courseId,courseName}) {
    // Hardcoded emergency fallback videos (only used when API quota exhausted / 403 and returns no results)
    const PROGRAMMING_FALLBACKS = {
      javascript:[
        {id:'upDLs1sn7g4', title:'JavaScript Crash Course', channel:'Traversy Media'},
        {id:'PkZNo7MFNFg', title:'JavaScript Tutorial for Beginners', channel:'freeCodeCamp.org'},
        {id:'W6NZfCO5SIk', title:'Learn JavaScript', channel:'Programming with Mosh'}
      ],
      python:[
        {id:'rfscVS0vtbw', title:'Python for Beginners', channel:'freeCodeCamp.org'},
        {id:'kqtD5dpn9C8', title:'Python Full Course', channel:'Programming with Mosh'}
      ],
      react:[
        {id:'bMknfKXIFA8', title:'React Course', channel:'freeCodeCamp.org'},
        {id:'w7ejDZ8SWv8', title:'React Crash Course', channel:'Traversy Media'}
      ],
      default:[
        {id:'HJagBAe4L0w', title:'Data Structures & Algorithms', channel:'freeCodeCamp.org'},
        {id:'ZniVgo8U7ek', title:'Big O Notation', channel:'CS Dojo'}
      ]
    }
    // Derive stored meta (legacy or new structure)
    const storedMeta = content?.content?.video || content?.video;
    const initialVideoId = content?.videoId || storedMeta?.primary || storedMeta?.candidates?.[0]?.id;
    
    console.log('[ChapterContent] Component initialized with:', {
      chapter: chapter?.name,
      content,
      storedMeta,
      initialVideoId,
      courseId,
      courseName
    });
    
  const [videoError,setVideoError]=useState(false);
    const [currentVideo,setCurrentVideo]=useState(initialVideoId);
    const [loading,setLoading]=useState(false);
    const [candidates,setCandidates]=useState(()=>{
      if(storedMeta?.candidates?.length){
        // Normalize shape (may already be {id,title,channel})
        return storedMeta.candidates.map(c=> typeof c === 'string' ? {id:c} : c );
      }
      return initialVideoId? [{id:initialVideoId}] : [];
    });
  const [fallbackActive,setFallbackActive]=useState(false); // indicates quota fallback list
    const [searching,setSearching]=useState(false);
    const [courseCategory, setCourseCategory] = useState('');
    const [courseTopic, setCourseTopic] = useState(''); // Add course topic state
  const attemptedSearchRef = useRef({}); // track chapters already auto-searched to prevent loops
  const videoId = (currentVideo && currentVideo!=='pending' && typeof currentVideo==='string') ? currentVideo : undefined;

    // Auto search if no video present initially
    useEffect(()=>{
      console.log('[ChapterContent] Auto-search check:', {
        initialVideoId, 
        currentVideo,
        chapterName: chapter?.name,
        chapterType: typeof chapter,
        chapterKeys: chapter ? Object.keys(chapter) : 'null',
        loading, 
        candidatesCount: candidates.length,
        videoError,
        courseCategory,
        courseTopic
      });
      
      // Trigger auto-search if:
      // 1. No valid video ID (null, undefined, 'pending', or empty)
      // 2. Chapter name exists (and chapter is an object, not a number)
      // 3. Not currently loading
      // 4. No candidates available
      // 5. Course category/topic are loaded
      const hasValidVideo = initialVideoId && initialVideoId !== 'pending' && initialVideoId !== '';
      const hasValidChapter = chapter && typeof chapter === 'object' && chapter?.name;
      const hasCourseInfo = courseCategory || courseTopic;
      
      if(!hasValidVideo && hasValidChapter && !loading && candidates.length===0 && hasCourseInfo && !attemptedSearchRef.current[chapter.name]){
        console.log('[ChapterContent] Triggering auto-search for:', chapter.name);
        attemptedSearchRef.current[chapter.name] = true;
        setTimeout(() => handleReplace(), 100); // Small delay to ensure course info is loaded
      } else {
        console.log('[ChapterContent] Auto-search skipped:', {
          hasValidVideo,
          hasValidChapter,
          loading,
          candidatesLength: candidates.length,
          hasCourseInfo
        });
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[chapter?.name, initialVideoId, courseCategory, courseTopic]);

    // When we have candidates but no currentVideo (e.g., fallback list applied) select first candidate.
    useEffect(()=>{
      if(!currentVideo && candidates.length>0){
        console.log('[ChapterContent] Auto-selecting first candidate after search');
        selectVideo(candidates[0].id);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[candidates]);

    // Detect course category and topic from course info
    useEffect(() => {
      const detectCourseInfo = async () => {
        if (courseId) {
          try {
            const course = await db.select().from(CourseList).where(eq(CourseList.courseId, courseId));
            const category = course[0]?.category?.toLowerCase() || '';
            // Try to get topic from courseOutput JSON structure, fallback to course name
            let topic = '';
            const courseOutput = course[0]?.courseOutput;
            if (courseOutput?.course?.topic) {
              topic = courseOutput.course.topic.toLowerCase();
            } else if (courseOutput?.topic) {
              topic = courseOutput.topic.toLowerCase();
            } else {
              // Fallback to course name
              topic = course[0]?.name?.toLowerCase() || '';
            }
            setCourseCategory(category);
            setCourseTopic(topic);
            console.log('[ChapterContent] Detected course category:', category, 'topic:', topic);
          } catch (e) {
            console.warn('Failed to get course info:', e);
          }
        }
      };
      detectCourseInfo();
    }, [courseId]);

    // Persist selected videoId to DB
    const persistVideo = async(newId)=>{
      const chapId = content?.chapterId ?? chapter?.chapterId; // db row has chapterId
      if(!courseId || chapId===undefined || chapId===null || !newId) return;
      try{
        await db.update(Chapters)
          .set({ videoId:newId })
          .where(and(eq(Chapters.courseId, courseId), eq(Chapters.chapterId, chapId)));
      }catch(e){
        console.warn('Failed to persist videoId', e);
      }
    }

    const selectVideo = async(id)=>{
      setCurrentVideo(id); setVideoError(false);
      persistVideo(id);
    }

    const runSearch = async(baseName)=>{
      // Try multiple ways to get chapter name
      let name = baseName;
      if (!name) {
        if (chapter?.name) {
          name = chapter.name;
        } else if (typeof chapter === 'object' && chapter?.title) {
          name = chapter.title;
        } else if (typeof chapter === 'number') {
          name = `Chapter ${chapter + 1}`;
        } else if (content?.content?.name) {
          name = content.content.name;
        } else if (content?.name) {
          name = content.name;
        } else {
          console.error('[ChapterContent] No chapter name found. Available data:', {
            chapter,
            content,
            baseName
          });
          return [];
        }
      }
      
      console.log('[ChapterContent] Starting runSearch with:', {
        chapterName: name,
        courseCategory,
        courseTopic,
        courseName,
        originalChapter: chapter,
        originalContent: content
      });
      
      // Detect content type from course category and chapter name
      const category = courseCategory.toLowerCase();
      const topic = courseTopic.toLowerCase();
      const chapterLower = name.toLowerCase();
      const courseLower = (courseName || '').toLowerCase();
      
      let queries = [];
      
      if (category.includes('programming') || category.includes('coding') || 
          /programming|coding|web|software|javascript|html|css|python|java|typescript|react|node|sql|database/.test(courseLower)) {
        // Programming content - diverse, stage-aware queries
        const topicKeyword = topic || 'programming';
        const isAdvanced = /advanced|expert|pro/i.test(courseName||'');
        const tokens = name.replace(/[/\\()\[\]:]+/g,' ').split(/\s+/).filter(Boolean);
        const compact = tokens.filter(t=>t.length>3).slice(0,5).join(' ');
        queries = [
          `${topicKeyword} ${name} ${isAdvanced? 'advanced':'beginner'} tutorial`,
          `${name} ${topicKeyword} crash course`,
          `${topicKeyword} ${name} full course`,
          `${name} ${topicKeyword} walkthrough`,
          `learn ${name} ${topicKeyword} step by step`,
          `${topicKeyword} ${name} project tutorial`,
          `${name} ${topicKeyword} examples`,
          `${topicKeyword} ${compact} deep dive`,
          `${topicKeyword} ${name} concepts explained`,
          `${name} ${topicKeyword} best practices`
        ];
      } else if (category.includes('creative') || category.includes('art') || category.includes('design') ||
                 /drawing|sketch|paint|art|design|creative/.test(chapterLower) || /creative|art|design/.test(courseLower)) {
        // Creative/Art content - include specific creative topic
        const topicKeyword = topic || 'art';
        queries = [
          `${topicKeyword} ${name} tutorial step by step`,
          `how to ${name} ${topicKeyword}`,
          `${name} ${topicKeyword} tutorial`,
          `learn ${name} ${topicKeyword} technique`,
          `${topicKeyword} ${name} lesson`,
          `${name} ${topicKeyword} guide`,
          `${topicKeyword} ${name} basics`,
          `${name} in ${topicKeyword}`,
          `${topicKeyword} ${name} instruction`,
          `${topicKeyword} ${name} fundamentals`
        ];
  // Removed health/wellness branch
      } else if (category.includes('business') || category.includes('finance') ||
                 /business|finance|marketing|entrepreneurship/.test(courseLower)) {
        // Business content - include specific business topic
        const topicKeyword = topic || 'business';
        queries = [
          `${topicKeyword} ${name} tutorial`,
          `${name} ${topicKeyword} guide`,
          `how to ${name} in ${topicKeyword}`,
          `${topicKeyword} ${name} explained`,
          `${name} ${topicKeyword} strategy`,
          `${topicKeyword} ${name} basics`
        ];
      } else {
        // Generic content - still use topic if available
        const topicKeyword = topic || '';
        queries = [
          `${topicKeyword} ${name} tutorial`.trim(),
          `how to ${name} ${topicKeyword}`.trim(),
          `${name} ${topicKeyword} guide`.trim(),
          `learn ${name} ${topicKeyword}`.trim(),
          `${name} explained ${topicKeyword}`.trim(),
          `${name} step by step ${topicKeyword}`.trim()
        ];
      }
      
      console.log('[ChapterContent] Generated search queries:', queries);
      
  // Get previously used video IDs for this course to avoid duplicates across chapters (client-only heuristic)
  let usedIds = [];
  try{ usedIds = JSON.parse(localStorage.getItem('usedVideoIds:'+courseId) || '[]'); }catch{}
  const collected = [];
      for(const q of queries){
        try{
          console.log('[ChapterContent] Searching with query:', q);
          const res = await service.getVideos(q);
          console.log('[ChapterContent] Raw service response for query', q, ':', res);
          res.forEach(r=>{
            const id=r?.id?.videoId; 
            if(id && !usedIds.includes(id) && !collected.some(c=>c.id===id)) {
              collected.push({
                id,
                title:r?.snippet?.title,
                channel:r?.snippet?.channelTitle
              });
            }
          });
          if(collected.length>=5) break; // Increased to get more candidates
        }catch(e){ console.warn('query failed', q, e); }
      }
      
      // If we didn't get enough results, try some generic fallback searches
      if(collected.length < 2) {
        console.log('[ChapterContent] Not enough results, trying fallback searches...');
        const fallbackQueries = [
          `${name} tutorial`,
          `how to ${name}`,
          `${name} guide`,
          `learn ${name}`,
          `${name} explained`
        ];
        
        for(const q of fallbackQueries){
          if(collected.length >= 3) break;
          try{
            const res = await service.getVideos(q);
            res.forEach(r=>{
                const id=r?.id?.videoId; 
                if(id && !usedIds.includes(id) && !collected.some(c=>c.id===id)) {
                collected.push({
                  id,
                  title:r?.snippet?.title,
                  channel:r?.snippet?.channelTitle
                });
              }
            });
          }catch(e){ console.warn('fallback query failed', q, e); }
        }
      }
      
      console.log('[ChapterContent] Total candidates found:', collected.length, 'for category:', category);
      // Broader fallback: if empty AND we either detect programming intent OR last YouTube status was 403 (quota) use hardcoded videos
    if(collected.length===0){
        const lastStatus = service.getLastYoutubeStatus?.();
        const haystack = `${courseCategory} ${courseTopic} ${courseName} ${name}`.toLowerCase();
        const isProgramming = /(programming|coding|javascript|python|react|node|html|css|typescript|java|sql|database|frontend|backend)/.test(haystack);
        if(isProgramming || lastStatus===403){
          const topicKey = Object.keys(PROGRAMMING_FALLBACKS).find(k=> (courseTopic||'').includes(k)) || 'default';
          const fb = (PROGRAMMING_FALLBACKS[topicKey] || PROGRAMMING_FALLBACKS.default).map(v=> ({...v, title:`${v.title} (fallback)`}));
          console.warn('[ChapterContent] Using hardcoded fallback videos', {topicKey, lastStatus, isProgramming});
      setFallbackActive(true);
          return fb;
        }
      }
      return collected;
    }

    const handleReplace = async()=>{
      console.log('[ChapterContent] handleReplace called');
      
      // Try fallback already provided
      if(storedMeta?.fallback && storedMeta.fallback!==currentVideo){
        console.log('[ChapterContent] Using stored fallback:', storedMeta.fallback);
        selectVideo(storedMeta.fallback); return;
      }
      
      // Otherwise advance to next candidate if exists
      const currentIndex = candidates.findIndex(c=>c.id===currentVideo);
      if(currentIndex>-1 && currentIndex < candidates.length-1){
        console.log('[ChapterContent] Advancing to next candidate');
        selectVideo(candidates[currentIndex+1].id); return;
      }
      
      // Re-search adding domain specific keywords
      if(!chapter?.name) {
        console.log('[ChapterContent] No chapter name, cannot search');
        return;
      }
      
      try{
        setLoading(true); setSearching(true);
        console.log('[ChapterContent] Starting new search for:', chapter.name, 'Category:', courseCategory);
        
        // Context-aware domain hints based on course category and content
        let domainHint = '';
        const chapterName = chapter.name.toLowerCase();
        const category = courseCategory.toLowerCase();
        const topic = courseTopic.toLowerCase();
        
        if (category.includes('programming') || /html|css|javascript|js|web|programming|coding/.test(chapterName)) {
          domainHint = ` ${topic} programming tutorial`;
        } else if (category.includes('creative') || /drawing|sketch|paint|art|design/.test(chapterName)) {
          domainHint = ` ${topic} art tutorial step by step`;
  // Removed health/wellness detection
        } else if (category.includes('business') || /business|marketing|finance/.test(chapterName)) {
          domainHint = ` ${topic} business guide`;
        } else if (/sql|database/.test(chapterName)) {
          domainHint = ` ${topic} database tutorial`;
        } else {
          domainHint = ` ${topic} tutorial guide`;
        }
        
        const enriched = `${chapter?.name}${domainHint}`.trim();
        const newCands = await runSearch(enriched);
        
        console.log('[ChapterContent] Search completed, found:', newCands.length, 'candidates');
        
        const filtered = newCands.filter(v=>!candidates.some(c=>c.id===v.id));
  if(filtered.length){
          const updated=[...candidates,...filtered];
          // Persist new used IDs
          let existingIds=[]; try{ existingIds=JSON.parse(localStorage.getItem('usedVideoIds:'+courseId)||'[]'); }catch{}
          const newUsed=[...new Set([...existingIds, ...filtered.map(f=>f.id)])];
          try{ localStorage.setItem('usedVideoIds:'+courseId, JSON.stringify(newUsed)); }catch{}
          setCandidates(updated);
          selectVideo(filtered[0].id);
          console.log('[ChapterContent] Selected first new candidate:', filtered[0].id);
        } else if(!candidates.length){
          console.log('[ChapterContent] No candidates found, setting error');
          setVideoError(true);
        }
      }catch(e){
        console.error('[ChapterContent] Search failed:', e); 
        setVideoError(true);
      }finally{setLoading(false); setSearching(false);}
    }

  const handleManualSearch = async()=>{
      if(!chapter?.name) return;
      const term = prompt('Search videos for this chapter. Enter extra keywords:', chapter.name + ' tutorial');
      if(!term) return;
      try{
        setLoading(true); setSearching(true);
        const results = await service.getVideos(term);
        const newCands = results.map(r=>({
          id:r?.id?.videoId,
          title:r?.snippet?.title,
          channel:r?.snippet?.channelTitle
        })).filter(v=>v.id);
        if(newCands.length){
          setCandidates(newCands);
          selectVideo(newCands[0].id);
        } else {
          alert('No results found');
        }
      }catch(e){
        console.error(e); alert('Search failed');
      }finally{setLoading(false); setSearching(false);}
    }

    const handleForceSearch = async()=>{
    const chapterName = chapter?.name || `Chapter ${(typeof chapter === 'number') ? chapter + 1 : 'Unknown'}`;
    if(!chapterName || chapterName === 'Chapter Unknown') {
      alert('No chapter name available. Chapter data: ' + JSON.stringify(chapter));
      return;
    }
    try{
      setLoading(true);
      console.log('[ChapterContent] Force search triggered for:', chapterName);
      console.log('[ChapterContent] Current course info:', {courseCategory, courseTopic, courseName});
      
      // If course info not loaded yet, try simple generic search
      if(!courseCategory && !courseTopic) {
        console.log('[ChapterContent] No course info, trying generic search...');
        const genericQueries = [
          `${chapterName} tutorial`,
          `how to ${chapterName}`,
          `${chapterName} guide`,
          `learn ${chapterName}`,
          `${chapterName} explained`
        ];
        
        const collected = [];
        for(const q of genericQueries) {
          if(collected.length >= 3) break;
          try {
            console.log('[ChapterContent] Generic search query:', q);
            const res = await service.getVideos(q);
            console.log('[ChapterContent] Generic search results:', res);
            res.forEach(r=>{
              const id=r?.id?.videoId; 
              if(id && !collected.some(c=>c.id===id)) {
                collected.push({
                  id,
                  title:r?.snippet?.title,
                  channel:r?.snippet?.channelTitle
                });
              }
            });
          } catch(e) {
            console.warn('Generic search failed for query', q, e);
          }
        }
        
        if(collected.length > 0) {
          setCandidates(collected);
          selectVideo(collected[0].id);
          alert(`Found ${collected.length} videos for "${chapterName}" (generic search)`);
        } else {
          alert('No videos found even with generic search');
        }
        setLoading(false);
        return;
      }
      
      const results = await runSearch(chapterName);
      console.log('[ChapterContent] Force search results:', results);
      if(results.length > 0) {
        setCandidates(results);
        selectVideo(results[0].id);
        alert(`Found ${results.length} videos for "${chapterName}"`);
      } else {
        alert('No videos found even with force search');
      }
    }catch(e){
      console.error('Force search failed:', e);
      alert('Force search failed: ' + e.message);
    }finally{
      setLoading(false);
    }
  }
  return (
    <div className='p-10'>
        <h2 className='font-medium text-2xl'>{chapter?.name}</h2>
        <p className='text-gray-500'>{chapter?.about}</p>
        
        {/* Video  */}
        <div className='flex flex-col items-center my-6 min-h-[200px] gap-3 w-full'>
          {videoId && !videoError ? (
            <YouTube
              videoId={videoId}
              opts={opts}
              onError={()=>setVideoError(true)}
            />
          ) : (
            <div className='w-full max-w-[640px] h-[200px] flex items-center justify-center rounded-md border border-dashed text-sm text-gray-400 text-center px-4'>
              {videoError ? 'Video unavailable after multiple searches.' : 
                `No video for this chapter yet. 
                Chapter: "${chapter?.name || (typeof chapter === 'number' ? `Chapter ${chapter + 1}` : 'undefined')}" | 
                Topic: "${courseTopic || 'loading...'}" | 
                Category: "${courseCategory || 'loading...'}"
                ${!chapter?.name ? ' ⚠️ Chapter name missing - this may cause search issues' : ''}`}
            </div>
          )}
          <div className='flex gap-2 flex-wrap justify-center'>
            <button onClick={handleReplace} disabled={loading} className='text-xs px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50'>
              {loading? 'Searching...' : 'Replace / Next'}
            </button>
            <button onClick={handleManualSearch} disabled={loading} className='text-xs px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-500 disabled:opacity-50'>
              {searching? 'Searching...' : 'Manual Search'}
            </button>
            <button onClick={handleForceSearch} disabled={loading} className='text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-500 disabled:opacity-50'>
              Force Search
            </button>
            <button onClick={()=>{
              const testName = chapter?.name || chapter?.title || content?.content?.name || content?.name || 'JavaScript tutorial';
              console.log('[Test API] Using test name:', testName);
              runSearch(testName).then(r=>console.log('Test search results:', r));
            }} disabled={loading} className='text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50'>
              Test API
            </button>
            <button onClick={async ()=>{
              console.log('[Direct API Test] Testing YouTube API directly...');
              try {
                const results = await service.getVideos('JavaScript tutorial');
                console.log('[Direct API Test] Raw API results:', results);
                if(results.length > 0) {
                  alert(`API Working! Found ${results.length} videos for "JavaScript tutorial"`);
                } else {
                  alert('API returned empty results');
                }
              } catch(e) {
                console.error('[Direct API Test] API Error:', e);
                alert('API Error: ' + e.message);
              }
            }} disabled={loading} className='text-xs px-3 py-1 rounded bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-50'>
              Direct API Test
            </button>
          </div>
      {candidates.length>0 && (
            <div className='w-full max-w-[640px] border rounded p-2'>
        <p className='text-xs text-gray-500 mb-1'>Video Candidates ({candidates.length}) {fallbackActive && <span className='ml-2 px-2 py-[2px] bg-yellow-200 text-yellow-800 rounded'>Fallback (quota exceeded)</span>}</p>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto'>
                {candidates.map(c=> {
                  const thumb = `https://img.youtube.com/vi/${c.id}/hqdefault.jpg`;
                  return (
                    <button key={c.id}
                      onClick={()=>selectVideo(c.id)}
                      className={`relative text-left text-xs p-2 rounded border group hover:bg-purple-50 ${c.id===currentVideo? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                    >
                      <img src={thumb} alt={c.title || 'thumbnail'} className='w-full h-24 object-cover rounded mb-1'/>
                      <span className='font-medium line-clamp-2 block'>{c.title || c.id}</span>
                      {c.channel && <span className='block text-[10px] text-gray-500'>{c.channel}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* <div>
            {content?.content?.map((item,index)=>(
                <div className='p-5 bg-purple-50 shadow-sm mb-3 rounded-lg'>
                    <h2 className='font-medium text-2xl'>{item.title}</h2>
                    <p className='whitespace-pre-wrap'>{item?.description}</p>
                    <ReactMarkdown className='text-lg text-black leading-9'>{item?.description}</ReactMarkdown>
                  { item.codeExample&& 
                  <div className='p-4 bg-black text-white rounded-md mt-3'>
                        <pre>
                            <code>{item.codeExample.replace('<precode>','').replace('</precode>','')}</code>
                        </pre>
                    </div>}
                </div>
            ))}
        </div> */}

        {/* Content  */}
    </div>
  )
}

export default ChapterContent