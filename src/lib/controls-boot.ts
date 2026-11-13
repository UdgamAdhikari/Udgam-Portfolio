// Kept free of React so the server layout can inline it.

export const STORAGE_KEY = "ua-controls";

// Runs before first paint (inlined in <head>) so there is no theme flash.
export const bootScript = `(function(){var s=null;try{s=JSON.parse(localStorage.getItem("${STORAGE_KEY}"))}catch(e){}var r=document.documentElement;var t=s&&s.theme==="graphite"||s&&s.theme==="paper"?s.theme:(matchMedia("(prefers-color-scheme: dark)").matches?"graphite":"paper");var m=s&&typeof s.motion==="number"?s.motion:(matchMedia("(prefers-reduced-motion: reduce)").matches?0:1);r.dataset.theme=t;r.dataset.motion=String(m);r.style.setProperty("--motion",String(m))})()`;
