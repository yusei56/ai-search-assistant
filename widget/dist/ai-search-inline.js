(()=>{var F=["ginseng quality testing","fingerprint analysis","pesticide residue detection","active ingredient extraction"];async function N(e){let o=new AbortController,r=window.setTimeout(()=>o.abort(),2e4);try{return await fetch(e,{signal:o.signal})}finally{window.clearTimeout(r)}}function Z(){return document.currentScript??document.querySelector("script[src*='ai-search-inline']")}function D(){let e=Z();return{apiBase:(e?.dataset.apiBase??"http://127.0.0.1:8000").replace(/\/$/,""),accent:e?.dataset.accent??"#059669",title:e?.dataset.title??"AI Search",target:e?.dataset.target??"#ai-search-root",queryParam:e?.dataset.queryParam??"q"}}function n(e){return e.replace(/[&<>"]/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[o])}function J(e){return`
  :host { all: initial; }
  * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .app { color: #0f172a; background: #f8fafc; min-height: 640px; }
  .top { position: sticky; top: 0; z-index: 5; border-bottom: 1px solid #e2e8f0; background: rgba(255,255,255,.92); backdrop-filter: blur(10px); }
  .top-inner { max-width: 1120px; margin: 0 auto; display: flex; align-items: center; gap: 16px; padding: 14px 20px; }
  .brand { color: ${e}; font-size: 18px; font-weight: 800; white-space: nowrap; }
  .hero { max-width: 760px; margin: 0 auto; padding: 92px 20px 80px; text-align: center; }
  .badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid ${e}33; background: ${e}12; color: ${e}; border-radius: 999px; padding: 5px 12px; font-size: 13px; font-weight: 700; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: ${e}; }
  h1 { margin: 18px 0 10px; color: #0f172a; font-size: clamp(34px, 6vw, 56px); line-height: 1.05; letter-spacing: 0; }
  .sub { margin: 0 0 28px; color: #64748b; font-size: 18px; }
  .search { display: flex; align-items: center; gap: 10px; width: 100%; border: 1px solid #cbd5e1; background: #fff; border-radius: 999px; padding: 10px 12px 10px 18px; box-shadow: 0 8px 24px rgba(15,23,42,.08); }
  .search:focus-within { border-color: ${e}; box-shadow: 0 0 0 4px ${e}1a; }
  .search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: #0f172a; font-size: 16px; }
  .search button, .load { border: 0; border-radius: 999px; background: ${e}; color: #fff; padding: 10px 18px; font-weight: 700; cursor: pointer; }
  .search button:hover, .load:hover { filter: brightness(.94); }
  .examples { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px; }
  .examples button, .facet { border: 1px solid #e2e8f0; background: #fff; color: #475569; border-radius: 999px; padding: 8px 12px; cursor: pointer; }
  .examples button:hover, .facet:hover { border-color: ${e}; color: ${e}; }
  .results-view { display: none; max-width: 1120px; margin: 0 auto; padding: 26px 20px 48px; grid-template-columns: 230px minmax(0, 1fr); gap: 28px; }
  .results-view.active { display: grid; }
  .hero.hidden { display: none; }
  .facets { position: sticky; top: 78px; align-self: start; }
  .facet-title { margin: 0 0 10px; color: #334155; font-size: 14px; font-weight: 800; }
  .facet-list { display: grid; gap: 6px; }
  .facet { width: 100%; display: flex; justify-content: space-between; gap: 8px; border-radius: 9px; text-align: left; }
  .facet.active { border-color: ${e}33; background: ${e}12; color: ${e}; font-weight: 800; }
  .count { color: #94a3b8; }
  .overview { border: 1px solid ${e}26; background: linear-gradient(135deg, ${e}10, #fff 42%, #fff); border-radius: 14px; padding: 20px; box-shadow: 0 6px 20px rgba(15,23,42,.05); }
  .overview-head { display: flex; align-items: center; gap: 10px; color: #334155; font-size: 15px; font-weight: 800; }
  .overview-icon { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; background: ${e}; color: #fff; }
  .overview-body { margin-top: 12px; color: #1e293b; font-size: 15px; line-height: 1.65; }
  .overview-body p { margin: 0 0 10px; }
  .cite { display: inline-flex; transform: translateY(-1px); margin: 0 2px; padding: 1px 5px; border-radius: 999px; background: ${e}18; color: ${e}; font-size: 11px; font-weight: 800; text-decoration: none; }
  .sources { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid ${e}1f; }
  .source { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; color: #475569; padding: 5px 9px; font-size: 12px; text-decoration: none; }
  .summary { color: #64748b; margin: 20px 0 12px; font-size: 14px; }
  .cards { display: grid; gap: 12px; }
  .card { display: flex; gap: 14px; border: 1px solid #e2e8f0; background: #fff; border-radius: 14px; padding: 14px; color: inherit; text-decoration: none; transition: .15s ease; }
  .card:hover { border-color: ${e}; transform: translateY(-1px); box-shadow: 0 8px 22px rgba(15,23,42,.07); }
  .thumb { width: 72px; height: 72px; flex: 0 0 auto; border-radius: 10px; object-fit: cover; background: #e2e8f0; }
  .pill { display: inline-flex; max-width: 100%; border-radius: 999px; background: ${e}12; color: ${e}; padding: 3px 8px; font-size: 12px; font-weight: 800; }
  .card h3 { margin: 7px 0 5px; font-size: 17px; line-height: 1.25; color: #0f172a; }
  .card p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.55; }
  .muted, .error { color: #64748b; padding: 18px; text-align: center; }
  .error { border: 1px solid #fbbf24; background: #fffbeb; color: #92400e; border-radius: 12px; text-align: left; }
  .load-row { display: flex; justify-content: center; margin-top: 18px; }
  .load[disabled] { opacity: .55; cursor: wait; }
  @media (max-width: 760px) {
    .top-inner { display: block; padding: 12px; }
    .brand { margin-bottom: 10px; }
    .results-view.active { display: block; padding: 16px 12px 36px; }
    .facets { position: static; margin-bottom: 16px; }
    .facet-list { grid-template-columns: 1fr 1fr; }
    .card { display: block; }
    .thumb { display: none; }
    h1 { font-size: 38px; }
  }
  `}function Q(e){let o=e.thumbnail?`<img class="thumb" src="${n(e.thumbnail)}" alt="" loading="lazy" />`:"",r=e.subcategory&&e.subcategory!==e.category?` <span class="count">${n(e.subcategory)}</span>`:"";return`<a class="card" href="${n(e.url)}" target="_blank" rel="noopener noreferrer">
    ${o}
    <div>
      <span class="pill">${n(e.category)}</span>${r}
      <h3>${n(e.title)}</h3>
      <p>${n(e.snippet)}</p>
    </div>
  </a>`}function Y(e,o){if(!e)return'<div class="muted">Generating AI overview...</div>';let r=new Map(o.map(d=>[String(d.n),d]));return n(e).replace(/\[(\d+)\]/g,(d,y)=>{let g=r.get(y);return g?`<a class="cite" href="${n(g.url)}" title="${n(g.title)}" target="_blank" rel="noopener noreferrer">${y}</a>`:d}).split(/\n{2,}/).map(d=>`<p>${d.replace(/\n/g,"<br />")}</p>`).join("")}function R(){let e=D(),o=document.querySelector(e.target);o||(o=document.createElement("div"),o.id=e.target.replace(/^#/,"")||"ai-search-root",document.body.appendChild(o));let r=o.attachShadow?o.attachShadow({mode:"open"}):o;r.innerHTML=`
    <style>${J(e.accent)}</style>
    <div class="app">
      <header class="top" hidden>
        <div class="top-inner">
          <div class="brand">${n(e.title)}</div>
          <form class="search compact" data-search-form>
            <input type="search" placeholder="Search herbal testing services, herbs, methods..." />
            <button type="submit">Search</button>
          </form>
        </div>
      </header>
      <section class="hero">
        <span class="badge"><span class="dot"></span>AI-powered search</span>
        <h1>Herbal Medicine Knowledge Search</h1>
        <p class="sub">Ask about testing services, herbs, methods, and more.</p>
        <form class="search" data-search-form>
          <input type="search" placeholder="Search herbal testing services, herbs, methods..." />
          <button type="submit">Search</button>
        </form>
        <div class="examples"></div>
      </section>
      <main class="results-view">
        <aside class="facets">
          <h2 class="facet-title">Filters</h2>
          <div class="facet-list"></div>
        </aside>
        <section class="main-results">
          <div class="overview">
            <div class="overview-head"><span class="overview-icon">AI</span> AI Overview</div>
            <div class="overview-body"></div>
            <div class="sources"></div>
          </div>
          <div class="summary"></div>
          <div class="error" hidden></div>
          <div class="cards"></div>
          <div class="load-row"><button class="load" type="button" hidden>Load more</button></div>
        </section>
      </main>
    </div>`;let k=r.querySelector(".top"),d=r.querySelector(".hero"),y=r.querySelector(".results-view"),g=r.querySelector(".examples"),I=Array.from(r.querySelectorAll("[data-search-form]")),A=Array.from(r.querySelectorAll('input[type="search"]')),q=r.querySelector(".facet-list"),z=r.querySelector(".overview-body"),_=r.querySelector(".sources"),P=r.querySelector(".summary"),C=r.querySelector(".cards"),E=r.querySelector(".error"),w=r.querySelector(".load"),u="",c=null,S=0,f=0,l=[],$={},h="",b=[],x=!1,p=null,m;function U(t){A.forEach(i=>{i.value=t})}function j(){k.hidden=!1,d.classList.add("hidden"),y.classList.add("active")}function O(){let t=Object.entries($).sort((a,s)=>s[1]-a[1]),i=t.reduce((a,[,s])=>a+s,0);q.innerHTML=[`<button class="facet ${c===null?"active":""}" data-category="">All categories <span class="count">${i}</span></button>`,...t.map(([a,s])=>`<button class="facet ${c===a?"active":""}" data-category="${encodeURIComponent(a)}"><span>${n(a)}</span><span class="count">${s}</span></button>`)].join(""),q.querySelectorAll("[data-category]").forEach(a=>{a.addEventListener("click",()=>{let s=a.dataset.category||"";c=s?decodeURIComponent(s):null,S=0,L(!1)})})}function v(){z.innerHTML=Y(h,b),_.innerHTML=b.length?b.map(t=>`<a class="source" href="${n(t.url)}" target="_blank" rel="noopener noreferrer">${t.n}. ${n(t.title)}</a>`).join(""):""}function T(){O(),v();let t=c?` in ${c}`:"";P.innerHTML=x&&l.length===0?"Searching...":`<strong>${f}</strong> results for <strong>"${n(u)}"</strong>${n(t)}`,C.innerHTML=l.length?l.map(Q).join(""):x?'<div class="muted">Searching...</div>':'<div class="muted">No results found. Try a different term.</div>',w.hidden=l.length>=f||f===0,w.disabled=x,w.textContent=x?"Loading...":`Load more (${Math.max(0,f-l.length)} left)`}async function L(t){if(!u)return!1;x=!0,E.hidden=!0,T();let i=new URLSearchParams({q:u,limit:String(10),offset:String(S)});c&&i.set("category",c);try{let a=await N(`${e.apiBase}/api/search?${i}`);if(!a.ok)throw new Error(`HTTP ${a.status}`);let s=await a.json();return f=s.total,t||($=s.facets||{}),l=t?[...l,...s.results||[]]:s.results||[],!0}catch(a){return t||(l=[]),E.hidden=!1,E.textContent=`Search failed. Check that the backend is reachable at ${e.apiBase}.`,console.error(a),!1}finally{x=!1,T()}}function B(){p?.close(),m&&window.clearTimeout(m),h="",b=[],v(),p=new EventSource(`${e.apiBase}/api/overview?q=${encodeURIComponent(u)}`),m=window.setTimeout(()=>{h||="AI overview timed out. The ranked results below are still available.",p?.close(),v()},45e3);let t=()=>{m&&window.clearTimeout(m),m=void 0,p?.close()};p.addEventListener("sources",i=>{try{b=JSON.parse(i.data),v()}catch{}}),p.addEventListener("delta",i=>{try{h+=JSON.parse(i.data)}catch{h+=i.data}v()}),p.addEventListener("done",t),p.addEventListener("error",t)}function G(){let t=new URL(window.location.href);t.searchParams.set(e.queryParam,u),window.history.replaceState(null,"",t.toString())}function M(t){let i=t.trim();i&&(u=i,c=null,S=0,f=0,l=[],$={},U(u),j(),G(),T(),L(!1).then(a=>{a&&f>0&&B()}))}g.innerHTML=F.map(t=>`<button type="button" data-example="${n(t)}">${n(t)}</button>`).join(""),g.querySelectorAll("[data-example]").forEach(t=>{t.addEventListener("click",()=>M(t.dataset.example||""))}),I.forEach(t=>{t.addEventListener("submit",i=>{i.preventDefault();let a=t.querySelector('input[type="search"]');M(a?.value||"")})}),w.addEventListener("click",()=>{S+=10,L(!0)});let H=new URLSearchParams(window.location.search).get(e.queryParam);H&&M(H)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",R):R();})();
