(()=>{async function O(t){let x=new AbortController,s=window.setTimeout(()=>x.abort(),2e4);try{return await fetch(t,{signal:x.signal})}finally{window.clearTimeout(s)}}function j(){let t=document.currentScript??document.querySelector("script[data-api-base]");return{apiBase:(t?.dataset.apiBase??"http://127.0.0.1:8000").replace(/\/$/,""),accent:t?.dataset.accent??"#059669",title:t?.dataset.title??"AI Search"}}function B(t){return`
  :host { all: initial; }
  * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .launch { position: fixed; bottom: 24px; right: 24px; z-index: 2147483000;
    display: flex; align-items: center; gap: 8px; padding: 12px 18px; border: none;
    border-radius: 999px; background: ${t}; color: #fff; font-size: 14px;
    font-weight: 700; cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,.18); }
  .overlay { position: fixed; inset: 0; z-index: 2147483001; display: none;
    background: rgba(15,23,42,.45); backdrop-filter: blur(2px); }
  .overlay.open { display: block; }
  .panel { position: absolute; top: 0; right: 0; height: 100%; width: 500px;
    max-width: 100%; background: #f8fafc; box-shadow: -8px 0 30px rgba(0,0,0,.2);
    display: flex; flex-direction: column; }
  .head { display: flex; align-items: center; gap: 10px; padding: 16px;
    background: #fff; border-bottom: 1px solid #e2e8f0; }
  .head h2 { margin: 0; font-size: 16px; color: #0f172a; flex: 1; font-weight: 800; }
  .close { border: none; background: none; font-size: 22px; cursor: pointer; color: #64748b; }
  .searchrow { padding: 14px 16px; background: #fff; border-bottom: 1px solid #e2e8f0; }
  .searchrow form { display: flex; gap: 8px; align-items: center; }
  .searchrow input { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1;
    border-radius: 999px; font-size: 14px; outline: none; color: #0f172a; }
  .searchrow input:focus { border-color: ${t}; box-shadow: 0 0 0 3px ${t}22; }
  .searchrow button, .load { border: none; border-radius: 999px; background: ${t};
    color: #fff; padding: 10px 14px; font-size: 13px; font-weight: 700; cursor: pointer; }
  .body { flex: 1; overflow-y: auto; padding: 16px; }
  .ai { background: ${t}0d; border: 1px solid ${t}33; border-radius: 14px;
    padding: 14px; margin-bottom: 14px; font-size: 14px; line-height: 1.6; color: #1e293b; }
  .ai .tag { display: inline-block; background: ${t}; color: #fff; font-size: 11px;
    font-weight: 800; padding: 2px 6px; border-radius: 5px; margin-bottom: 8px; }
  .ai p { margin: 0 0 9px; }
  .cite { display: inline-flex; transform: translateY(-1px); margin: 0 2px; padding: 1px 5px;
    border-radius: 999px; background: ${t}18; color: ${t}; font-size: 11px;
    font-weight: 800; text-decoration: none; }
  .sources { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; padding-top: 10px;
    border-top: 1px solid ${t}22; }
  .source { max-width: 190px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; color: #475569;
    padding: 4px 8px; font-size: 12px; text-decoration: none; }
  .facets { display: flex; gap: 7px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 12px; }
  .facet { white-space: nowrap; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff;
    color: #475569; padding: 6px 9px; font-size: 12px; cursor: pointer; }
  .facet.active { border-color: ${t}33; background: ${t}12; color: ${t}; font-weight: 800; }
  .summary { color: #64748b; font-size: 13px; margin: 0 0 10px; }
  .card { display: flex; gap: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
    padding: 12px; margin-bottom: 10px; text-decoration: none; transition: .15s; }
  .card:hover { border-color: ${t}; box-shadow: 0 3px 12px rgba(0,0,0,.07); }
  .thumb { width: 54px; height: 54px; flex: 0 0 auto; border-radius: 9px; object-fit: cover; background: #e2e8f0; }
  .card .cat { display: inline-flex; max-width: 100%; border-radius: 999px; background: ${t}12;
    color: ${t}; padding: 2px 7px; font-size: 11px; font-weight: 800; }
  .card .t { font-size: 15px; font-weight: 700; color: #1e293b; margin: 5px 0 3px; line-height: 1.25; }
  .card .s { font-size: 13px; color: #64748b; line-height: 1.5; }
  .muted { color: #94a3b8; font-size: 13px; text-align: center; padding: 24px; }
  .loadrow { display: flex; justify-content: center; padding: 4px 0 16px; }
  .load[disabled] { opacity: .55; cursor: wait; }
  @media (max-width: 560px) {
    .panel { width: 100%; }
    .thumb { display: none; }
  }
  `}function I(){let t=j(),x=document.createElement("div");x.id="ai-search-widget-host",document.body.appendChild(x);let s=x.attachShadow({mode:"open"});s.innerHTML=`
    <style>${B(t.accent)}</style>
    <button class="launch" part="launch">Search</button>
    <div class="overlay">
      <div class="panel" role="dialog" aria-label="${t.title}">
        <div class="head"><h2>${t.title}</h2><button class="close" aria-label="Close">x</button></div>
        <div class="searchrow">
          <form>
            <input type="search" placeholder="Type a query and press Enter..." />
            <button type="submit">Search</button>
          </form>
        </div>
        <div class="body"><p class="muted">Start typing to search.</p></div>
      </div>
    </div>`;let v=s.querySelector(".overlay"),_=s.querySelector("form"),$=s.querySelector("input"),S=s.querySelector(".body"),l=null,p="",u=null,y=0,f=0,d=[],E={},b="",h=[],m=!1,w="",c,a=e=>e.replace(/[&<>"]/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[r]),T=()=>{v.classList.add("open"),setTimeout(()=>$.focus(),50)},k=()=>{v.classList.remove("open"),c&&window.clearTimeout(c),c=void 0,l?.close()};function A(){if(!b)return'<span class="ovtext">Generating...</span>';let e=new Map(h.map(o=>[String(o.n),o]));return a(b).replace(/\[(\d+)\]/g,(o,n)=>{let i=e.get(n);return i?`<a class="cite" href="${a(i.url)}" title="${a(i.title)}" target="_blank" rel="noopener">${n}</a>`:o}).split(/\n{2,}/).map(o=>`<p>${o.replace(/\n/g,"<br />")}</p>`).join("")}function q(){let e=Object.entries(E).sort((o,n)=>n[1]-o[1]);if(!e.length)return"";let r=e.reduce((o,[,n])=>o+n,0);return`<div class="facets">
      <button class="facet ${u===null?"active":""}" data-category="">All (${r})</button>
      ${e.map(([o,n])=>`<button class="facet ${u===o?"active":""}" data-category="${encodeURIComponent(o)}">${a(o)} (${n})</button>`).join("")}
    </div>`}function H(e){let r=e.thumbnail?`<img class="thumb" src="${a(e.thumbnail)}" alt="" loading="lazy" />`:"";return`<a class="card" href="${a(e.url)}" target="_blank" rel="noopener">
      ${r}
      <div>
        <div class="cat">${a(e.category)}</div>
        <div class="t">${a(e.title)}</div>
        <div class="s">${a(e.snippet)}</div>
      </div>
    </a>`}function g(){let e=h.length?`<div class="sources">${h.map(i=>`<a class="source" href="${a(i.url)}" target="_blank" rel="noopener">${i.n}. ${a(i.title)}</a>`).join("")}</div>`:"",r=p?`<p class="summary">${m&&!d.length?"Searching...":`${f} results for "${a(p)}"${u?` in ${a(u)}`:""}`}</p>`:"",o=w?`<p class="muted">${a(w)}</p>`:d.length?d.map(H).join(""):p&&!m?'<p class="muted">No results found.</p>':`<p class="muted">${p?"Searching...":"Start typing to search."}</p>`,n=d.length<f?`<div class="loadrow"><button class="load" type="button" ${m?"disabled":""}>${m?"Loading...":`Load more (${f-d.length} left)`}</button></div>`:"";S.innerHTML=`
      <div class="ai"><span class="tag">AI</span>${A()}${e}</div>
      ${q()}
      ${r}
      <div class="results">${o}</div>
      ${n}`,S.querySelectorAll(".facet").forEach(i=>{i.addEventListener("click",()=>{let R=i.dataset.category||"";u=R?decodeURIComponent(R):null,y=0,L(!1)})}),S.querySelector(".load")?.addEventListener("click",()=>{y+=8,L(!0)})}async function L(e){if(!p)return!1;m=!0,w="",g();let r=new URLSearchParams({q:p,offset:String(y),limit:String(8)});u&&r.set("category",u);try{let o=await O(`${t.apiBase}/api/search?${r}`);if(!o.ok)throw new Error(`HTTP ${o.status}`);let n=await o.json();return f=n.total??0,e||(E=n.facets??{}),d=e?[...d,...n.results??[]]:n.results??[],!0}catch{return f=0,e||(d=[]),w=`Search failed. Check that the backend is reachable at ${t.apiBase}.`,!1}finally{m=!1,g()}}function C(){l?.close(),c&&window.clearTimeout(c),b="",h=[],g(),l=new EventSource(`${t.apiBase}/api/overview?q=${encodeURIComponent(p)}`),c=window.setTimeout(()=>{b||="AI overview timed out. The ranked results below are still available.",l?.close(),g()},45e3);let e=()=>{c&&window.clearTimeout(c),c=void 0,l?.close()};l.addEventListener("sources",r=>{try{h=JSON.parse(r.data),g()}catch{}}),l.addEventListener("delta",r=>{try{b+=JSON.parse(r.data)}catch{b+=r.data}g()}),l.addEventListener("done",e),l.addEventListener("error",e)}function M(e){let r=e.trim();r&&(p=r,u=null,y=0,f=0,d=[],E={},$.value=r,T(),g(),L(!1).then(o=>{o&&f>0&&C()}))}let z=e=>M(e),U={open:e=>{e?.trim()?z(e):T()},search:z,close:k};window.AISearchAssistant=U,s.querySelector(".launch").addEventListener("click",T),s.querySelector(".close").addEventListener("click",k),v.addEventListener("click",e=>{e.target===v&&k()}),_.addEventListener("submit",e=>{e.preventDefault(),M($.value)})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",I):I();})();
