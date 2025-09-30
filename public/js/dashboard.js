import {
  getSession,
  logout,
  fetchOverview,
  fetchDamages,
  fetchActivity,
} from './api.js';

const overviewContainer = document.querySelector('#overview');
const statTemplate = document.querySelector('#stat-template');
const damageRows = document.querySelector('#damage-rows');
const activityList = document.querySelector('#activity');
const activityTemplate = document.querySelector('#activity-template');
const exportButton = document.querySelector('#export-damages');
const logoutButton = document.querySelector('#logout');
const currentUser = document.querySelector('#current-user');

let refreshTimer = null;

async function init() {
  try {
    const session = await getSession();
    if (!session?.user) {
      redirectToLogin();
      return;
    }
    currentUser.textContent = `${session.user.fullName} (${session.user.role})`;
  } catch (error) {
    redirectToLogin();
    return;
  }

  await Promise.all([loadOverview(), loadDamages(), loadActivity()]);
  refreshTimer = window.setInterval(loadOverview, 15000);

  exportButton?.addEventListener('click', exportDamagesAsCsv);
  logoutButton?.addEventListener('click', handleLogout);
}

function redirectToLogin() {
  window.location.replace('/index.html');
}

async function loadOverview() {
  try {
    const data = await fetchOverview();
    renderStats(data.metrics);
  } catch (error) {
    console.error('Genel bakış verisi alınamadı', error);
  }
}

async function loadDamages() {
  try {
    const data = await fetchDamages();
    renderDamages(data.items);
  } catch (error) {
    console.error('Hasar kayıtları alınamadı', error);
  }
}

async function loadActivity() {
  try {
    const data = await fetchActivity();
    renderActivity(data.events);
  } catch (error) {
    console.error('Aktivite verisi alınamadı', error);
  }
}

function renderStats(metrics = []) {
  overviewContainer.innerHTML = '';
  metrics.forEach((metric) => {
    const stat = statTemplate.content.cloneNode(true);
    stat.querySelector('.stat__label').textContent = metric.label;
    stat.querySelector('.stat__value').textContent = metric.value;
    stat.querySelector('.stat__delta').textContent = metric.delta;
    overviewContainer.appendChild(stat);
  });
}

function renderDamages(items = []) {
  damageRows.innerHTML = '';
  items.forEach((item) => {
    const tr = document.createElement('tr');
    const statusSlug = slugify(item.status);
    tr.innerHTML = `
      <td>${item.reference}</td>
      <td>${item.model}</td>
      <td><span class="badge badge--${statusSlug}">${item.status}</span></td>
      <td>${item.stage}</td>
      <td>${new Date(item.date).toLocaleDateString('tr-TR')}</td>
    `;
    damageRows.appendChild(tr);
  });
}

function renderActivity(events = []) {
  activityList.innerHTML = '';
  events.forEach((event) => {
    const node = activityTemplate.content.cloneNode(true);
    node.querySelector('.timeline__time').textContent = event.time;
    node.querySelector('.timeline__title').textContent = event.title;
    node.querySelector('.timeline__meta').textContent = event.meta;
    activityList.appendChild(node);
  });
}

async function handleLogout() {
  try {
    await logout();
  } finally {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    redirectToLogin();
  }
}

function exportDamagesAsCsv() {
  const rows = Array.from(damageRows.querySelectorAll('tr')).map((row) =>
    Array.from(row.children)
      .map((cell) => cell.textContent?.trim() ?? '')
      .join(',')
  );
  const header = 'Kayıt No,Model,Durum,Aşama,Tarih';
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `tako-hasar-${new Date().toISOString().slice(0, 10)}.csv`);
  link.click();
  URL.revokeObjectURL(link.href);
}

function slugify(value = '') {
  return value
    .toString()
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

init();
