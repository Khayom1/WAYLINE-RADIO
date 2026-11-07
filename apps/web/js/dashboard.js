/* WAYLINE RADIO — demo dashboard state
 * Demo-only persistence. This is not authentication or server-side tenant isolation.
 */
const STORAGE_KEY = "wayline-radio:dashboard:v1";

const DEFAULT_COMPANIES = [
  { name: "CNU", station: "CNU Radio", code: "C", type: "Company radio" },
  { name: "ETL", station: "ETL Radio", code: "E", type: "Company radio" }
];

const DEFAULT_TRACKS = [
  ["Midnight Drive", "Sample Artist", "Electronic", "CNU"],
  ["Open Highway", "Sample Artist", "Country", "ETL"],
  ["Northern Lights", "Sample Artist", "Rock", "CNU"],
  ["Blue Horizon", "Sample Artist", "Jazz", "ETL"],
  ["City Motion", "Sample Artist", "Pop", "CNU"],
  ["Quiet Roads", "Sample Artist", "Classical", "ETL"],
  ["Long Distance", "Sample Artist", "Country", "CNU"],
  ["After Sunset", "Sample Artist", "Electronic", "ETL"]
];

const $ = id => document.getElementById(id);

function cloneDefaults() {
  return {
    companies: DEFAULT_COMPANIES.map(item => ({ ...item })),
    tracks: DEFAULT_TRACKS.map(item => [...item])
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();

    const saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.companies) || !Array.isArray(saved.tracks)) {
      return cloneDefaults();
    }

    const companies = saved.companies
      .filter(c => c && typeof c.name === "string" && c.name.trim())
      .map(c => {
        const name = c.name.trim().slice(0, 50);
        return {
          name,
          station: name + " Radio",
          code: Array.from(name)[0].toUpperCase(),
          type: "Company radio"
        };
      });

    const tracks = saved.tracks
      .filter(t => Array.isArray(t) && t.length >= 4)
      .map(t => t.slice(0, 4).map(value => String(value).slice(0, 100)));

    return {
      companies: companies.length ? companies : cloneDefaults().companies,
      tracks
    };
  } catch (error) {
    console.warn("WAYLINE demo data could not be loaded; defaults were restored.", error);
    return cloneDefaults();
  }
}

let state = loadState();
let companies = state.companies;
let tracks = state.tracks;

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ companies, tracks }));
  } catch (error) {
    console.warn("WAYLINE demo data could not be saved in this browser.", error);
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function companyCard(company) {
  const isEtl = company.name === "ETL";
  const initial = escapeHTML(Array.from(company.name)[0] || "?");
  const name = escapeHTML(company.name);
  return `<article class="company-card">
    <div class="company-logo ${isEtl ? "etl" : ""}">${initial}</div>
    <div class="company-meta">
      <strong>${name} Radio</strong>
      <small>${escapeHTML(company.type)} · Demo configuration</small>
    </div>
    <button class="company-open" data-company="${name}" type="button">View →</button>
  </article>`;
}

function renderCompanies() {
  const markup = companies.map(companyCard).join("");
  $("companyList").innerHTML = markup;
  $("overviewCompanies").innerHTML = markup;
  $("statCompanies").textContent = String(companies.length).padStart(2, "0");
}

function renderStations() {
  $("stationRows").innerHTML = companies.map(company => `<tr>
    <td><strong>${escapeHTML(company.station)}</strong></td>
    <td>${escapeHTML(company.name)}</td>
    <td>Not connected</td>
    <td><span class="status warning">Offline</span></td>
  </tr>`).join("");
}

function renderTracks() {
  const query = $("trackSearch").value.trim().toLowerCase();
  const category = $("categoryFilter").value;
  const filtered = tracks.filter(track =>
    track.join(" ").toLowerCase().includes(query) &&
    (category === "All" || track[2] === category)
  );

  $("trackRows").innerHTML = filtered.map(track => `<tr>
    <td><strong>${escapeHTML(track[0])}</strong></td>
    <td>${escapeHTML(track[1])}</td>
    <td>${escapeHTML(track[2])}</td>
    <td>${escapeHTML(track[3])}</td>
  </tr>`).join("") || '<tr><td colspan="4">No matching tracks.</td></tr>';

  $("statTracks").textContent = String(tracks.length).padStart(2, "0");
}

function navigate(page) {
  document.querySelectorAll(".page").forEach(section => section.classList.add("hidden"));
  $(page)?.classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });
  const active = document.querySelector(`.nav-item[data-page="${page}"]`);
  $("pageTitle").textContent = active ? active.textContent.trim() : "Overview";
  $("sidebar").classList.remove("open");
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.go));
});

$("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));

document.addEventListener("click", event => {
  const button = event.target.closest("[data-company]");
  if (!button) return;
  const companyName = button.dataset.company;
  alert(`${companyName} Radio\n\nDemo station details. Live stream is not connected.`);
});

const modal = $("modal");
const form = $("modalForm");
const valueField = $("fieldValue");
let modalMode = "company";

function openModal(mode) {
  modalMode = mode;
  $("modalTitle").textContent = mode === "company" ? "Add company" : "Add music track";
  $("fieldLabel").textContent = mode === "company" ? "Company name" : "Track title";
  valueField.value = "";
  valueField.placeholder = mode === "company" ? "e.g. NEW COMPANY" : "e.g. Highway Journey";
  modal.classList.remove("hidden");
  valueField.focus();
}

function closeModal() {
  modal.classList.add("hidden");
}

$("addCompany").addEventListener("click", () => openModal("company"));
$("addTrack").addEventListener("click", () => openModal("track"));
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);

modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
});

form.addEventListener("submit", event => {
  event.preventDefault();
  const value = valueField.value.trim();
  if (!value) return;

  if (modalMode === "company") {
    if (companies.some(company => company.name.toLowerCase() === value.toLowerCase())) {
      alert("This company already exists.");
      return;
    }

    const name = value.slice(0, 50);
    companies.push({
      name,
      station: name + " Radio",
      code: Array.from(name)[0].toUpperCase(),
      type: "Company radio"
    });
    renderCompanies();
    renderStations();
  } else {
    tracks.push([value.slice(0, 100), "Unknown artist", "Uncategorized", "CNU"]);
    renderTracks();
  }

  saveState();
  closeModal();
});

$("trackSearch").addEventListener("input", renderTracks);
$("categoryFilter").addEventListener("change", renderTracks);

renderCompanies();
renderStations();
renderTracks();
