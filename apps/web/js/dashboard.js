const companies=[{name:"CNU",station:"CNU Radio",code:"C",type:"Company radio"},{name:"ETL",station:"ETL Radio",code:"E",type:"Company radio"}];
let tracks=[
["Midnight Drive","Sample Artist","Electronic","CNU"],
["Open Highway","Sample Artist","Country","ETL"],
["Northern Lights","Sample Artist","Rock","CNU"],
["Blue Horizon","Sample Artist","Jazz","ETL"],
["City Motion","Sample Artist","Pop","CNU"],
["Quiet Roads","Sample Artist","Classical","ETL"],
["Long Distance","Sample Artist","Country","CNU"],
["After Sunset","Sample Artist","Electronic","ETL"]
];
const $=id=>document.getElementById(id);
function companyCard(c){return `<article class="company-card"><div class="company-logo ${c.code==='E'?'etl':''}">${c.code}</div><div class="company-meta"><strong>${escapeHTML(c.name)} Radio</strong><small>${escapeHTML(c.type)} · Demo configuration</small></div><button class="company-open" data-company="${escapeHTML(c.name)}">View →</button></article>`}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderCompanies(){$("companyList").innerHTML=companies.map(companyCard).join("");$("overviewCompanies").innerHTML=companies.map(companyCard).join("");$("statCompanies").textContent=String(companies.length).padStart(2,"0");}
function renderStations(){$("stationRows").innerHTML=companies.map(c=>`<tr><td><strong>${escapeHTML(c.station)}</strong></td><td>${escapeHTML(c.name)}</td><td>Not connected</td><td><span class="status warning">Offline</span></td></tr>`).join("")}
function renderTracks(){const q=$("trackSearch").value.toLowerCase(),cat=$("categoryFilter").value;const filtered=tracks.filter(t=>(t.join(" ").toLowerCase().includes(q))&&(cat==="All"||t[2]===cat));$("trackRows").innerHTML=filtered.map(t=>`<tr><td><strong>${escapeHTML(t[0])}</strong></td><td>${escapeHTML(t[1])}</td><td>${escapeHTML(t[2])}</td><td>${escapeHTML(t[3])}</td></tr>`).join("")||'<tr><td colspan="4">No matching tracks.</td></tr>';$("statTracks").textContent=String(tracks.length).padStart(2,"0")}
function navigate(page){document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));$(page)?.classList.remove("hidden");document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));const active=document.querySelector(`[data-page="${page}"]`);$("pageTitle").textContent=active?active.textContent.trim():"Overview";$("sidebar").classList.remove("open");}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
document.addEventListener("click",e=>{const b=e.target.closest("[data-company]");if(b)alert(`${b.dataset.company} Radio\n\nDemo station details. Live stream is not connected.`)});
const modal=$("modal"),form=$("modalForm"),value=$("fieldValue");let modalMode="company";
function openModal(mode){modalMode=mode;$("modalTitle").textContent=mode==="company"?"Add company":"Add music track";$("fieldLabel").textContent=mode==="company"?"Company name":"Track title";value.value="";value.placeholder=mode==="company"?"e.g. NEW COMPANY":"e.g. Highway Journey";modal.classList.remove("hidden");value.focus()}
function closeModal(){modal.classList.add("hidden")}
$("addCompany").addEventListener("click",()=>openModal("company"));$("addTrack").addEventListener("click",()=>openModal("track"));$("closeModal").addEventListener("click",closeModal);$("cancelModal").addEventListener("click",closeModal);
form.addEventListener("submit",e=>{e.preventDefault();const v=value.value.trim();if(!v)return;if(modalMode==="company"){if(companies.some(c=>c.name.toLowerCase()===v.toLowerCase())){alert("This company already exists.");return}const code=v[0].toUpperCase();companies.push({name:v,station:v+" Radio",code,type:"Company radio"});renderCompanies();renderStations()}else{tracks.push([v,"Unknown artist","Uncategorized","CNU"]);renderTracks()}closeModal()});
$("trackSearch").addEventListener("input",renderTracks);$("categoryFilter").addEventListener("change",renderTracks);
renderCompanies();renderStations();renderTracks();
