import React from 'react'

function Hero() {
  return ( 
<>
<div className="relative overflow-hidden">
  <div className="absolute inset-0 -z-10 opacity-40">
    <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[36rem] w-[36rem] rounded-full bg-gradient-to-tr from-fuchsia-300 via-purple-300 to-blue-300 blur-3xl" />
  </div>
  <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-14">

   

    
    <div className="mt-5 max-w-3xl text-center mx-auto">
      <h1 className="block font-extrabold tracking-tight text-gray-900 text-4xl md:text-6xl lg:text-7xl">
        AI Course
        <span className="bg-clip-text bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-blue-600 text-transparent"> Generator</span>
      </h1>
    </div>
   

    <div className="mt-6 max-w-3xl text-center mx-auto">
      <p className="text-lg md:text-xl text-gray-600">
      Revolutionize your course creation with our AI‑powered app — deliver engaging, high‑quality courses in minutes.</p>
    </div>

   
    <div className="mt-10 gap-3 flex justify-center">
      <a className="inline-flex justify-center items-center 
      gap-x-3 text-center bg-gradient-to-tr from-blue-600
       to-violet-600 hover:from-violet-600 hover:to-blue-600 border border-transparent text-white text-base md:text-lg font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 py-3 px-5" 
       href="/dashboard">
        Get started
  <svg className="flex-shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </a>
     
    </div>
   

   
  </div>
</div>


<div className="max-w-[85rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16 mx-auto">
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 items-center gap-2">

    <a className="group flex flex-col justify-center hover:bg-gray-50 rounded-xl p-5 md:p-7 transition-colors" href="#">
      <div className="flex justify-center items-center size-12 bg-blue-600 rounded-xl shadow-sm">
  <svg className="flex-shrink-0 size-6 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="10" height="14" x="3" y="8" rx="2"/><path d="M5 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2.4"/><path d="M8 18h.01"/></svg>
      </div>
      <div className="mt-5">
        <h3 className="group-hover:text-gray-700 text-lg font-semibold text-gray-800">25+ templates</h3>
        <p className="mt-1 text-gray-600">Responsive, and mobile-first project on the web</p>
        <span className="mt-2 inline-flex items-center gap-x-1.5 text-sm text-blue-600 decoration-2 group-hover:underline font-medium">
          Learn more
          <svg className="flex-shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </span>
      </div>
    </a>
   
    <a className="group flex flex-col justify-center hover:bg-gray-50 rounded-xl p-5 md:p-7 transition-colors" href="#">
      <div className="flex justify-center items-center size-12 bg-blue-600 rounded-xl shadow-sm">
  <svg className="flex-shrink-0 size-6 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
      </div>
      <div className="mt-5">
        <h3 className="group-hover:text-gray-700 text-lg font-semibold text-gray-800">Customizable</h3>
        <p className="mt-1 text-gray-600">Components are easily customized and extendable</p>
        <span className="mt-2 inline-flex items-center gap-x-1.5 text-sm text-blue-600 decoration-2 group-hover:underline font-medium">
          Learn more
          <svg className="flex-shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </span>
      </div>
    </a>
   
    <a className="group flex flex-col justify-center hover:bg-gray-50 rounded-xl p-5 md:p-7 transition-colors" href="#">
      <div className="flex justify-center items-center size-12 bg-blue-600 rounded-xl shadow-sm">
  <svg className="flex-shrink-0 size-6 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      </div>
      <div className="mt-5">
        <h3 className="group-hover:text-gray-700 text-lg font-semibold text-gray-800">Free to Use</h3>
        <p className="mt-1 text-gray-600">Every component and plugin is well documented</p>
        <span className="mt-2 inline-flex items-center gap-x-1.5 text-sm text-blue-600 decoration-2 group-hover:underline font-medium">
          Learn more
          <svg className="flex-shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </span>
      </div>
    </a>
  
    <a className="group flex flex-col justify-center hover:bg-gray-50 rounded-xl p-5 md:p-7 transition-colors" href="#">
      <div className="flex justify-center items-center size-12 bg-blue-600 rounded-xl shadow-sm">
  <svg className="flex-shrink-0 size-6 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
      </div>
      <div className="mt-5">
        <h3 className="group-hover:text-gray-700 text-lg font-semibold text-gray-800">24/7 Support</h3>
        <p className="mt-1 text-gray-600">Contact us 24 hours a day, 7 days a week</p>
        <span className="mt-2 inline-flex items-center gap-x-1.5 text-sm text-blue-600 decoration-2 group-hover:underline font-medium">
          Learn more
          <svg className="flex-shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </span>
      </div>
    </a>
   
  </div>
</div>
</>

  )
}

export default Hero