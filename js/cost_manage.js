// ===== Firebase (module) =====
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// window.db 는 HTML에서 이미 설정됨
const colRef = collection(window.db, "trip", "trip-with-mom", "expenses");

// ===== DOM =====
const tBody = document.getElementById("cost_table");
const cavTotalEl = document.getElementById("cav_total");
const jhTotalEl = document.getElementById("jh_total");
const momTotalEl = document.getElementById("mom_total");

// ===== 데이터 =====
let costlist = [];
let deleteId = null;

// Firestore 실시간 반영
onSnapshot(colRef, (snapshot) => {
  costlist = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  render();
});

// ===== 정렬 기준 ====
function dateKey(dateStr) {
  // "2.03" -> [2, 3]
  const s = String(dateStr || "").trim();
  const [mStr, dStr] = s.split(".");
  const m = Number(mStr);
  const d = Number(dStr);
  if (!Number.isFinite(m) || !Number.isFinite(d)) return Number.POSITIVE_INFINITY;

  // 월*100 + 일 로 키 만들기 (2월3일 -> 203)
  return m * 100 + d;
}

// ===== 렌더 =====
function render() {
  const sorted = [...costlist].sort((a, b) => {
    const diff = dateKey(a.date) - dateKey(b.date);
    if (diff !== 0) return diff;

    // 같은 날짜면 createdAt 오름차순
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return ta - tb;
  });

  renderTable(sorted);
  renderTotals(sorted);
}

// ===== 테이블 =====
function renderTable(list) {
  tBody.innerHTML = "";

  if (list.length === 0) {
    tBody.innerHTML =
      `<tr><td colspan="4" style="text-align:center;">내역 없음</td></tr>`;
    return;
  }

  list.forEach(item => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.date}</td>
      <td>${item.spendby}</td>
      <td>${item.who}</td>
      <td>${Number(item.cost).toLocaleString()}원</td>
    `;

    // 모바일 길게 눌러 삭제
    let timer;
    tr.addEventListener("touchstart", () => {
      timer = setTimeout(() => openConfirm(item.id), 700);
    });
    tr.addEventListener("touchend", () => clearTimeout(timer));

    // PC 우클릭
    tr.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      openConfirm(item.id);
    });

    tBody.appendChild(tr);
  });
}

// ===== 합계 =====
function renderTotals(list) {
  let total = 0;
  let mom = 0;
  let me = 0;

  list.forEach(item => {
    const cost = Number(item.cost) || 0;
    
    if (item.who === "공동") {
      total += cost;
      mom += cost/2;
      me += cost/2;
    }
    if (item.who === "엄마") {
      mom += cost;
    }
    if (item.who === "지현") {
      me += cost;
    }
  });

  cavTotalEl.textContent = total.toLocaleString();
  jhTotalEl.textContent = me.toLocaleString();
  momTotalEl.textContent = mom.toLocaleString();
}

// ===== 삭제 confirm =====
function openConfirm(id) {
  deleteId = id;
  document.getElementById("confirmModal").classList.remove("hidden");
}

document.getElementById("confirmCancel").onclick = () => {
  document.getElementById("confirmModal").classList.add("hidden");
  deleteId = null;
};

document.getElementById("confirmOk").onclick = async () => {
  if (!deleteId) return;
  await deleteDoc(doc(window.db, "trip", "trip-with-mom", "expenses", deleteId));
  document.getElementById("confirmModal").classList.add("hidden");
  deleteId = null;
};
