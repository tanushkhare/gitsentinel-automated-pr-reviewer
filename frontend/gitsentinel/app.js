
function toggleTheme(){document.body.classList.toggle("light");}
function filterRows(inputId, rowsId){const q=document.getElementById(inputId).value.toLowerCase();document.querySelectorAll("#"+rowsId+" tr").forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?"":"none");}
function severityFilter(level,btn){document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));btn.classList.add("active");document.querySelectorAll("#findingRows tr").forEach(r=>r.style.display=level==="all"||r.dataset.severity===level?"":"none");}

/* ---------- live data from the GitSentinel backend ---------- */
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api = async (path) => { const r = await fetch('/api' + path); if (!r.ok) throw new Error(r.status); return r.json(); };
const ago = (d) => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.round(m / 60) + ' h ago'; };
const badge = (sev) => { const s = String(sev).toLowerCase(); return `<span class="badge ${s === 'critical' ? 'critical-bg' : s === 'high' ? 'high-bg' : 'medium-bg'}">${esc(s[0].toUpperCase() + s.slice(1))}</span>`; };

async function loadFindings() {
  const tbody = document.getElementById('findingRows'); if (!tbody) return;
  try {
    const reviews = await api('/reviews?limit=100');
    const rows = reviews.flatMap((r) => (r.securityFlags || []).map((f) =>
      `<tr data-severity="${esc(String(f.severity).toLowerCase())}"><td><strong>${esc(f.description)}</strong><small>${esc(f.ruleId)}</small></td><td>${badge(f.severity)}</td><td>${esc(r.repoName)}</td><td>PR #${esc(r.prNumber)}</td><td>${esc(r.status)}</td></tr>`));
    tbody.innerHTML = rows.join('') || '<tr><td colspan="5">No findings yet.</td></tr>';
  } catch { tbody.innerHTML = '<tr><td colspan="5">Could not reach the API.</td></tr>'; }
}

async function loadDashboard() {
  const events = document.getElementById('eventRows'); if (!events) return;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  try {
    const [st, recent] = await Promise.all([api('/reviews/stats'), api('/reviews?limit=5')]);
    const sev = st.bySeverity || {}, total = Object.values(sev).reduce((a, b) => a + b, 0);
    set('statRepos', st.repositories); set('statDone', st.byStatus.completed || 0);
    set('statFailed', (st.byStatus.failed || 0) + ' failed'); set('statPending', st.byStatus.pending || 0);
    set('statFindings', total); set('statHigh', ((sev.HIGH || 0) + (sev.CRITICAL || 0)) + ' high/critical');
    for (const l of ['Critical', 'High', 'Medium', 'Low']) {
      const n = sev[l.toUpperCase()] || 0;
      set('cnt' + l, n); const b = document.getElementById('bar' + l); if (b) b.style.width = (total ? Math.round(n / total * 100) : 0) + '%';
    }
    events.innerHTML = recent.map((r) => `<tr><td>PR #${esc(r.prNumber)} review ${esc(r.status)}</td><td>${esc(r.repoName)}</td><td><span class="badge ${r.status === 'failed' ? 'critical-bg' : 'good-bg'}">${(r.securityFlags || []).length} findings</span></td><td>${ago(r.updatedAt)}</td></tr>`).join('') || '<tr><td colspan="4">No reviews yet.</td></tr>';
  } catch { events.innerHTML = '<tr><td colspan="4">Could not reach the API.</td></tr>'; }
}
document.addEventListener('DOMContentLoaded', () => { loadFindings(); loadDashboard(); });
