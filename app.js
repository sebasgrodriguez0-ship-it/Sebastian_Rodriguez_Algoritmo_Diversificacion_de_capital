const activos = [
  "ETF S&P 500",
  "ETF Global Diversificado",
  "Acciones de alto crecimiento",
  "Acciones de dividendos",
  "Bonos gubernamentales",
  "Bonos corporativos",
  "Bienes raíces (REITs)",
  "Oro",
  "Criptomonedas",
  "Fondos mixtos balanceados"
];

const segmentos = {
  "C": "Perfil Conservador",
  "M": "Perfil Moderado",
  "A": "Perfil Agresivo",
  "J": "Joven Largo Plazo",
  "R": "Cercano a Retiro"
};

const contextos = {
  "E": "¿Qué activo ofrece mejor equilibrio riesgo–rentabilidad?",
  "S": "¿Cuál es más estable?",
  "L": "¿Cuál elegirías a 10 años?",
  "CR": "¿Cuál resistiría mejor una crisis?"
};

const RATING_INICIAL = 1000;
const K = 32;
const STORAGE_KEY = "investmash_state_v1";

function defaultState(){
  const buckets = {};
  for (const seg of Object.keys(segmentos)){
    for (const ctx of Object.keys(contextos)){
      const key = `${seg}__${ctx}`;
      buckets[key] = {};
      activos.forEach(a => buckets[key][a] = RATING_INICIAL);
    }
  }
  return { buckets, votes: [] };
}

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  return JSON.parse(raw);
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function expectedScore(ra, rb){
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(bucket, a, b, winner){
  const ra = bucket[a], rb = bucket[b];
  const ea = expectedScore(ra, rb);
  const sa = winner === "A" ? 1 : 0;
  const sb = winner === "B" ? 1 : 0;
  bucket[a] = ra + K * (sa - ea);
  bucket[b] = rb + K * (sb - (1 - ea));
}

function randomPair(){
  const a = activos[Math.floor(Math.random() * activos.length)];
  let b = a;
  while (b === a){
    b = activos[Math.floor(Math.random() * activos.length)];
  }
  return [a, b];
}

function bucketKey(seg, ctx){ return `${seg}__${ctx}`; }

function topN(bucket){
  return Object.entries(bucket)
    .map(([item, rating]) => ({item, rating}))
    .sort((a,b) => b.rating - a.rating)
    .slice(0,10);
}

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const questionEl = document.getElementById("question");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const topBox = document.getElementById("topBox");

function fillSelect(selectEl, obj){
  for (const [k,v] of Object.entries(obj)){
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = v;
    selectEl.appendChild(opt);
  }
}

fillSelect(segmentSelect, segmentos);
fillSelect(contextSelect, contextos);

function newDuel(){
  const [a,b] = randomPair();
  labelA.textContent = a;
  labelB.textContent = b;
  questionEl.textContent = contextos[contextSelect.value];
  window.currentA = a;
  window.currentB = b;
}

function renderTop(){
  const bucket = state.buckets[bucketKey(segmentSelect.value, contextSelect.value)];
  const rows = topN(bucket);
  topBox.innerHTML = rows.map((r,i)=>`
    <div class="toprow">
      <div><b>${i+1}.</b> ${r.item}</div>
      <div>${r.rating.toFixed(0)}</div>
    </div>
  `).join("");
}

function vote(winner){
  const bucket = state.buckets[bucketKey(segmentSelect.value, contextSelect.value)];
  updateElo(bucket, currentA, currentB, winner);
  saveState();
  renderTop();
  newDuel();
}

document.getElementById("btnA").onclick = ()=>vote("A");
document.getElementById("btnB").onclick = ()=>vote("B");
document.getElementById("btnNewPair").onclick = newDuel;
document.getElementById("btnShowTop").onclick = renderTop;

document.getElementById("btnReset").onclick = ()=>{
  state = defaultState();
  saveState();
  renderTop();
  newDuel();
};

newDuel();
renderTop();
