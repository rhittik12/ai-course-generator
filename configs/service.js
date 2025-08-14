import axios from "axios";

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3'

// Simple in-memory cache (session scoped). Key: normalized query. Value: filtered items.
const _videoCache = new Map();

let _lastYoutubeStatus = null;

const getVideos = async(query) => {
    const primaryKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const altKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY_ALT; // optional fallback
    if(!primaryKey){
        console.warn('[YouTube][skip] Missing primary API key');
        return [];
    }
    _lastYoutubeStatus = null; // reset for this call
    // Normalize query
    let norm = (query||'').replace(/\s+/g,' ').trim();
    norm = norm.split(' ').filter((w,i,a)=> i===0 || w.toLowerCase()!==a[i-1].toLowerCase()).join(' ');
    if(norm.length>120) norm = norm.slice(0,118);

    // Serve from cache
    if(_videoCache.has(norm)){
        return _videoCache.get(norm);
    }

    const attempt = async(q, keyUsed) => {
        const params = {
            part:'snippet', q:q, maxResults:10, type:'video', videoDuration:'medium', videoDefinition:'high', order:'relevance', key:keyUsed
        };
        console.log('[YouTube][search]', {raw:query, norm:q, keySuffix:keyUsed?.slice(-5)});
    const resp = await axios.get(YOUTUBE_BASE_URL+'/search', {params});
    _lastYoutubeStatus = resp?.status || 200;
        if(resp?.data?.error){
            console.warn('[YouTube][error object]', resp.data.error);
        }
        const items = resp.data.items || [];
        const filtered = items.filter(v=>{
            const title = v?.snippet?.title?.toLowerCase()||'';
            return !title.includes('#shorts') &&
                   !title.includes('trailer') &&
                   !title.includes('reaction') &&
                   !title.includes('unboxing') &&
                   v?.snippet?.title && v?.id?.videoId && v?.snippet?.title.length>10;
        }).slice(0,6);
        if(filtered.length) _videoCache.set(norm, filtered);
        return filtered;
    };

    const keysToTry = [primaryKey, altKey].filter(Boolean);
    let lastErr;
    for(const k of keysToTry){
        // Try full normalized query then a shortened fallback if 403
        const shortened = norm.split(' ').slice(0,6).join(' ');
        try{
            return await attempt(norm, k);
        }catch(e){
            lastErr = e;
            const status = e?.response?.status;
            if(status===403){
                _lastYoutubeStatus = 403;
                console.warn('[YouTube][403-first]', {norm, keySuffix:k.slice(-5), msg:e?.response?.data?.error?.message});
                // Try shortened query once with same key
                try{
                    return await attempt(shortened, k);
                }catch(e2){
                    lastErr = e2;
                    if(e2?.response?.status===403){
                        _lastYoutubeStatus = 403;
                        console.warn('[YouTube][403-shortened]', {shortened, keySuffix:k.slice(-5)});
                        // continue to next key if exists
                        continue;
                    }
                }
            } else {
                _lastYoutubeStatus = status || 'error';
                console.error('[YouTube][fail]', {norm, status, data:e?.response?.data});
            }
        }
    }
    return [];
}

const getLastYoutubeStatus = () => _lastYoutubeStatus;

export default{
    getVideos,
    getLastYoutubeStatus
}