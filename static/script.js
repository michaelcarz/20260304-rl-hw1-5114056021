/* ══════════════════════════════════════════════════════════════════════════
   HW1 – Grid World  |  Frontend Logic
   ══════════════════════════════════════════════════════════════════════════ */

// ── State ────────────────────────────────────────────────────────────────
let gridSize = 5;
let startCell = null;   // {r, c}
let endCell = null;     // {r, c}
let obstacles = [];     // [{r, c}, ...]
let maxObstacles = 3;   // n - 2

// ── DOM refs ─────────────────────────────────────────────────────────────
const sizeSelect = document.getElementById('grid-size');
const genBtn = document.getElementById('btn-generate');
const evalBtn = document.getElementById('btn-evaluate');
const gridEl = document.getElementById('grid');
const statusBar = document.getElementById('status-bar');
const resultArea = document.getElementById('result-area');
const toastEl = document.getElementById('toast');

// ── Helpers ──────────────────────────────────────────────────────────────
function key(r, c) { return `${r},${c}`; }

function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2200);
}

const ARROW_MAP = {
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
};

// ── Generate Grid ────────────────────────────────────────────────────────
function generateGrid() {
    gridSize = parseInt(sizeSelect.value);
    maxObstacles = gridSize - 2;
    startCell = null;
    endCell = null;
    obstacles = [];
    resultArea.innerHTML = '';

    gridEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gridEl.innerHTML = '';

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.textContent = r * gridSize + c + 1;  // 1-indexed label
            cell.addEventListener('click', () => onCellClick(r, c, cell));
            gridEl.appendChild(cell);
        }
    }

    updateStatus();
    evalBtn.disabled = true;
    toast(`Generated ${gridSize}×${gridSize} grid`);
}

// ── Cell Click Handler ───────────────────────────────────────────────────
function onCellClick(r, c, el) {
    const k = key(r, c);

    // If clicking an already-set cell → clear it
    if (startCell && startCell.r === r && startCell.c === c) {
        startCell = null;
        el.classList.remove('start');
        updateStatus(); return;
    }
    if (endCell && endCell.r === r && endCell.c === c) {
        endCell = null;
        el.classList.remove('end');
        updateStatus(); return;
    }
    const obsIdx = obstacles.findIndex(o => o.r === r && o.c === c);
    if (obsIdx !== -1) {
        obstacles.splice(obsIdx, 1);
        el.classList.remove('obstacle');
        updateStatus(); return;
    }

    // Set start → end → obstacles
    if (!startCell) {
        startCell = { r, c };
        el.classList.add('start');
        toast('起點已設定 ✓');
    } else if (!endCell) {
        endCell = { r, c };
        el.classList.add('end');
        toast('終點已設定 ✓');
    } else if (obstacles.length < maxObstacles) {
        obstacles.push({ r, c });
        el.classList.add('obstacle');
        toast(`障礙物 ${obstacles.length}/${maxObstacles}`);
    } else {
        toast(`障礙物已達上限 (${maxObstacles})`);
        return;
    }

    updateStatus();
}

// ── Status Bar ───────────────────────────────────────────────────────────
function updateStatus() {
    let html = '';
    html += `<span class="status-tag tag-start"><span class="dot"></span>起點 ${startCell ? '✓' : '—'}</span>`;
    html += `<span class="status-tag tag-end"><span class="dot"></span>終點 ${endCell ? '✓' : '—'}</span>`;
    html += `<span class="status-tag tag-obs"><span class="dot"></span>障礙 ${obstacles.length}/${maxObstacles}</span>`;
    statusBar.innerHTML = html;

    evalBtn.disabled = !(startCell && endCell);
}

// ── Evaluate Policy ──────────────────────────────────────────────────────
async function evaluatePolicy() {
    if (!startCell || !endCell) {
        toast('請先設定起點和終點');
        return;
    }

    evalBtn.disabled = true;
    evalBtn.textContent = '計算中…';

    try {
        const resp = await fetch('/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                n: gridSize,
                start: [startCell.r, startCell.c],
                end: [endCell.r, endCell.c],
                obstacles: obstacles.map(o => [o.r, o.c]),
            }),
        });
        const data = await resp.json();
        renderResults(data);
        toast('策略評估完成 ✓');
    } catch (err) {
        toast('Error: ' + err.message);
    } finally {
        evalBtn.disabled = false;
        evalBtn.textContent = '📊 Evaluate Policy';
    }
}

// ── Render Matrices ──────────────────────────────────────────────────────
function renderResults(data) {
    const { policy, values } = data;

    resultArea.innerHTML = `
    <div class="matrices">
      <div class="matrix-block">
        <div class="matrix-label">Value Matrix — V(s)</div>
        <div class="matrix-grid" id="value-matrix"
             style="grid-template-columns:repeat(${gridSize},1fr)"></div>
      </div>
      <div class="matrix-block">
        <div class="matrix-label">Policy Matrix — π(s)</div>
        <div class="matrix-grid" id="policy-matrix"
             style="grid-template-columns:repeat(${gridSize},1fr)"></div>
      </div>
    </div>
  `;

    const vMatrix = document.getElementById('value-matrix');
    const pMatrix = document.getElementById('policy-matrix');

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            // ── Value cell ──
            const vCell = document.createElement('div');
            vCell.className = 'm-cell' + cellTypeClass(r, c);
            if (isObstacle(r, c)) {
                vCell.textContent = '▪';
            } else if (isEnd(r, c)) {
                vCell.textContent = '★';
            } else {
                vCell.textContent = values[r][c].toFixed(2);
            }
            vMatrix.appendChild(vCell);

            // ── Policy cell ──
            const pCell = document.createElement('div');
            pCell.className = 'm-cell' + cellTypeClass(r, c);
            const act = policy[r][c];
            if (isObstacle(r, c)) {
                pCell.innerHTML = '<span class="arrow">▪</span>';
            } else if (isEnd(r, c)) {
                pCell.innerHTML = '<span class="arrow">★</span>';
            } else if (act && ARROW_MAP[act]) {
                pCell.innerHTML = `<span class="arrow">${ARROW_MAP[act]}</span>`;
            } else {
                pCell.textContent = '·';
            }
            pMatrix.appendChild(pCell);
        }
    }
}

function cellTypeClass(r, c) {
    if (startCell && startCell.r === r && startCell.c === c) return ' start';
    if (endCell && endCell.r === r && endCell.c === c) return ' end';
    if (obstacles.some(o => o.r === r && o.c === c)) return ' obstacle';
    return '';
}
function isEnd(r, c) { return endCell && endCell.r === r && endCell.c === c; }
function isObstacle(r, c) { return obstacles.some(o => o.r === r && o.c === c); }

// ── Event Bindings ───────────────────────────────────────────────────────
genBtn.addEventListener('click', generateGrid);
evalBtn.addEventListener('click', evaluatePolicy);

// Generate default grid on load
window.addEventListener('DOMContentLoaded', generateGrid);
