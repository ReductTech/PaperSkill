'use strict';

const grid = document.querySelector('#paper-grid');
const empty = document.querySelector('#empty');
const search = document.querySelector('#search');
const topicFilter = document.querySelector('#topic-filter');
const summary = document.querySelector('#result-summary');
let papers = [];
let cardList = [];

const starterForm = document.querySelector('#starter-form');
const starterResult = document.querySelector('#starter-result');

function toPaperName(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const titleField = document.querySelector('#start-title');
const paperNameField = document.querySelector('#start-paper-name');
function syncPaperName() {
  const derived = toPaperName(titleField.value);
  if (derived) paperNameField.value = derived;
}
titleField.addEventListener('input', syncPaperName);
titleField.addEventListener('blur', syncPaperName);

document.querySelector('#start-source').addEventListener('blur', (event) => {
  event.target.value = event.target.value.trim();
});

starterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = document.querySelector('#start-title').value.trim();
  const url = document.querySelector('#start-url').value.trim();
  const paperName = document.querySelector('#start-paper-name').value.trim();
  const githubUser = document.querySelector('#start-source').value.trim();
  const name = document.querySelector('#start-name').value.trim();
  const pinyin = document.querySelector('#start-pinyin').value.trim().toLowerCase();
  const branch = `paper/${paperName}`;

  document.querySelector('#paper-dir-name').textContent = `html_output/${paperName}/<拼音><修改日期>（导入脚本自动生成，例如 html_output/${paperName}/${pinyin}0903）`;
  document.querySelector('#branch-command').textContent = `git switch main\ngit pull origin main\ngit switch -c ${branch}`;
  document.querySelector('#skill-command').textContent = `$paper-skill 请阅读并分析《${title}》（${url}），制作成完整的中文交互式论文教程。`;
  document.querySelector('#import-command').textContent = `npm run import -- <你的网页项目目录> ${paperName} --title "${title}" --paper-url "${url}" --participant "${name}" --pinyin "${pinyin}" --github "${githubUser}"`;
  document.querySelector('#build-paper-command').textContent = `npm run build:paper -- ${paperName}`;
  starterResult.hidden = false;
  starterResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

document.querySelectorAll('.copy-btn').forEach((button) => {
  button.addEventListener('click', async () => {
    const text = document.querySelector(`#${button.dataset.copy}`).textContent;
    await navigator.clipboard.writeText(text);
    const previous = button.textContent;
    button.textContent = '已复制';
    setTimeout(() => { button.textContent = previous; }, 1200);
  });
});

// —— 论文搜索补全：输入标题或「小写下划线论文名」时，从已收录论文中匹配，选中即填充 ——
const urlField = document.querySelector('#start-url');
const suggestionList = document.querySelector('#paper-suggestions');
let currentSuggestions = [];
let activeSuggestion = -1;

function hideSuggestions() {
  suggestionList.hidden = true;
  suggestionList.innerHTML = '';
  currentSuggestions = [];
  activeSuggestion = -1;
}

function suggestionScore(paper, query) {
  const name = paper.paperName;
  const lowerTitle = paper.title.toLowerCase();
  if (name.startsWith(query)) return 0;
  if (name.includes(query)) return 1;
  if (lowerTitle.startsWith(query)) return 2;
  if (lowerTitle.includes(query)) return 3;
  return -1;
}

function showSuggestions(query) {
  if (papers.length === 0) return;
  currentSuggestions = papers
    .map((paper) => ({ paper, score: suggestionScore(paper, query) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => a.score - b.score || a.paper.paperName.localeCompare(b.paper.paperName))
    .slice(0, 8);
  suggestionList.innerHTML = currentSuggestions.length
    ? currentSuggestions.map((item) => `
      <li><code>${escapeHtml(item.paper.paperName)}</code><span>${escapeHtml(item.paper.title)}</span></li>`).join('')
    : '<li class="no-match">没有匹配的论文，可手动填写创建新论文</li>';
  suggestionList.hidden = false;
  paintActive();
}

function paintActive() {
  const items = [...suggestionList.querySelectorAll('li')];
  items.forEach((li, index) => li.classList.toggle('active', index === activeSuggestion));
}

function applySuggestion(paper) {
  titleField.value = paper.title;
  urlField.value = paper.paperUrl;
  paperNameField.value = paper.paperName;
  hideSuggestions();
  starterResult.hidden = true;
}

titleField.addEventListener('input', () => {
  const query = titleField.value.trim().toLowerCase();
  if (query) showSuggestions(query); else hideSuggestions();
});

titleField.addEventListener('keydown', (event) => {
  if (suggestionList.hidden) return;
  const count = currentSuggestions.length;
  if (event.key === 'ArrowDown' && count > 0) {
    event.preventDefault();
    activeSuggestion = (activeSuggestion + 1) % count;
    paintActive();
  } else if (event.key === 'ArrowUp' && count > 0) {
    event.preventDefault();
    activeSuggestion = (activeSuggestion - 1 + count) % count;
    paintActive();
  } else if (event.key === 'Enter' && count > 0) {
    event.preventDefault();
    applySuggestion(currentSuggestions[Math.max(activeSuggestion, 0)].paper);
  } else if (event.key === 'Escape') {
    hideSuggestions();
  }
});

suggestionList.addEventListener('mousedown', (event) => event.preventDefault());
suggestionList.addEventListener('click', (event) => {
  const item = event.target.closest('li');
  const index = item ? [...suggestionList.children].indexOf(item) : -1;
  if (index >= 0 && currentSuggestions[index]) applySuggestion(currentSuggestions[index].paper);
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.title-field')) hideSuggestions();
});

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function titleSizeClass(title) {
  const length = Array.from(String(title)).length;
  if (length > 110) return 'title-compact';
  if (length > 70) return 'title-long';
  return '';
}

function statusLabel(status) {
  if (status === 'published') return '已发布';
  if (status === 'draft') return '草稿';
  return '审核中';
}

/** 版本顺序：已发布优先，其次修改日期最新 */
function sortedVersions(versions) {
  return [...(versions || [])].sort((a, b) => {
    if ((a.status === 'published') !== (b.status === 'published')) return a.status === 'published' ? -1 : 1;
    if ((a.versionDate || '') !== (b.versionDate || '')) return (b.versionDate || '').localeCompare(a.versionDate || '');
    return b.version.localeCompare(a.version);
  });
}

function versionAuthors(version) {
  return (version.participants || []).map((item) => item.name).join('、') || '未署名';
}

/** 把版本按 GitHub 用户名（无 GitHub 则用展示名）分组 */
function groupVersions(versions) {
  const groups = [];
  const byKey = new Map();
  for (const version of versions) {
    const person = (version.participants || [])[0] || {};
    const key = (person.github || person.name || '未署名').toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, {
        label: person.github || person.name || '未署名',
        items: [],
      });
      groups.push(byKey.get(key));
    }
    byKey.get(key).items.push(version);
  }
  return groups;
}

function render() {
  const query = search.value.trim().toLowerCase();
  const topic = topicFilter.value;
  const visible = papers.filter((paper) => {
    const haystack = [
      paper.title, paper.venue, ...(paper.authors || []), ...(paper.topics || []),
      ...(paper.versions || []).flatMap((version) => [
        version.version,
        ...(version.participants || []).map((item) => `${item.name} ${item.github || ''}`),
      ]),
    ].join(' ').toLowerCase();
    return (!query || haystack.includes(query)) && (!topic || (paper.topics || []).includes(topic));
  });

  summary.textContent = `显示 ${visible.length} / ${papers.length} 篇教程`;
  empty.hidden = visible.length !== 0;
  cardList = visible.map((paper) => ({ title: paper.title, groups: groupVersions(sortedVersions(paper.versions)) }));
  grid.innerHTML = visible.map((paper, ci) => {
    const versions = sortedVersions(paper.versions);
    const groups = groupVersions(versions);
    return `
    <article class="paper-card">
      <div class="card-meta"><span>${escapeHtml([paper.venue, paper.year].filter(Boolean).join(' · ') || '论文教程')}</span><span class="status">${statusLabel(paper.status)}</span></div>
      <h2 class="${titleSizeClass(paper.title)}">${escapeHtml(paper.title)}</h2>
      <div class="topics">${(paper.topics || []).map((item) => `<span class="topic">${escapeHtml(item)}</span>`).join('')}</div>
      <div class="versions">
        <div class="versions-head">
          <span class="versions-label">网页版本</span>
          <span class="versions-stats">${versions.length} 个版本${groups.length > 1 ? ` · ${groups.length} 位贡献者` : ''}</span>
        </div>
        ${groups.slice(0, 2).map((group, gi) => `
        <button type="button" class="contributor" data-card="${ci}" data-group="${gi}">
          <span class="contributor-id">@${escapeHtml(group.label)}</span>
          <span class="contributor-count">${group.items.length} 个版本</span>
          <span class="contributor-more">查看 →</span>
        </button>`).join('')}
        ${groups.length > 2 ? `
        <button type="button" class="contributor contributor-all" data-card="${ci}" data-more>
          <span class="contributor-id">查看更多</span>
          <span class="contributor-count">还有 ${groups.length - 2} 位贡献者</span>
        </button>` : ''}
      </div>
      <div class="card-footer">
        <a class="paper-link" href="${escapeHtml(paper.paperUrl)}" target="_blank" rel="noopener">查看原论文</a>
      </div>
    </article>
  `;
  }).join('');
}

fetch('./papers.json')
  .then((response) => {
    if (!response.ok) throw new Error('索引加载失败');
    return response.json();
  })
  .then((data) => {
    papers = data;
    const topics = [...new Set(papers.flatMap((paper) => paper.topics || []))].sort();
    const versions = papers.flatMap((paper) => paper.versions || []);
    const participants = new Set(versions.flatMap((version) => (version.participants || []).map((item) => item.github || item.name)));
    topicFilter.insertAdjacentHTML('beforeend', topics.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join(''));
    document.querySelector('#paper-count').textContent = papers.length;
    document.querySelector('#version-count').textContent = versions.length;
    document.querySelector('#topic-count').textContent = topics.length;
    document.querySelector('#participant-count').textContent = participants.size;
    render();
  })
  .catch((error) => {
    summary.textContent = error.message;
    empty.hidden = false;
  });

search.addEventListener('input', render);
topicFilter.addEventListener('change', render);

// —— 版本选择模态框：点「查看 →」/「查看更多」弹出，在弹层中选择账号或版本进入 ——
const versionModal = document.querySelector('#version-modal');
const modalPaper = document.querySelector('#modal-paper');
const modalUser = document.querySelector('#modal-user');
const modalHint = document.querySelector('#modal-hint');
const modalBack = document.querySelector('#modal-back');
const modalAccounts = document.querySelector('#modal-accounts');
const modalVersions = document.querySelector('#modal-versions');
let modalCardIndex = -1;

function openModal() {
  versionModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeVersionModal() {
  versionModal.hidden = true;
  document.body.style.overflow = '';
  modalAccounts.hidden = true;
  modalVersions.hidden = true;
}

function showAccounts(cardIndex) {
  const card = cardList[cardIndex];
  if (!card) return;
  modalCardIndex = cardIndex;
  modalPaper.textContent = card.title;
  modalUser.textContent = '全部贡献者';
  modalHint.textContent = `共 ${card.groups.length} 位贡献者，点击查看其版本`;
  modalBack.hidden = true;
  modalVersions.hidden = true;
  modalAccounts.innerHTML = card.groups.map((group, gi) => {
    const first = group.items[0];
    const person = (first.participants || [])[0] || {};
    const displayName = person.name && person.name.toLowerCase() !== group.label.toLowerCase() ? person.name : '';
    return `
      <button type="button" class="contributor" data-card="${cardIndex}" data-group="${gi}">
        <span class="contributor-id">@${escapeHtml(group.label)}</span>
        <span class="contributor-owner">${displayName ? escapeHtml(displayName) : ''}</span>
        <span class="contributor-count">${group.items.length} 个版本</span>
        <span class="contributor-more">查看 →</span>
      </button>`;
  }).join('');
  modalAccounts.hidden = false;
  openModal();
}

function openVersionModal(cardIndex, groupIndex) {
  const card = cardList[cardIndex];
  if (!card) return;
  const group = card.groups[groupIndex];
  if (!group) return;
  modalCardIndex = cardIndex;
  modalPaper.textContent = card.title;
  modalUser.textContent = `@${group.label}`;
  modalHint.textContent = `共 ${group.items.length} 个版本，点击进入对应网页`;
  modalBack.hidden = card.groups.length <= 1;
  modalAccounts.hidden = true;
  modalVersions.innerHTML = group.items.map((version) => `
    <li>
      <span class="version-info">
        <span class="version-name">${escapeHtml(version.version)}</span>
        <span class="version-meta">${escapeHtml(versionAuthors(version))}${version.versionDate ? ` · ${escapeHtml(version.versionDate)}` : ''} · ${statusLabel(version.status)}</span>
      </span>
      <a class="open-link" href="./${escapeHtml(version.tutorialUrl)}" target="_blank" rel="noopener">进入 →</a>
    </li>`).join('');
  modalVersions.hidden = false;
  openModal();
}

grid.addEventListener('click', (event) => {
  const row = event.target.closest('.contributor');
  if (!row) return;
  const cardIndex = Number(row.dataset.card);
  if (row.hasAttribute('data-more')) {
    showAccounts(cardIndex);
    return;
  }
  openVersionModal(cardIndex, Number(row.dataset.group));
});
modalAccounts.addEventListener('click', (event) => {
  const row = event.target.closest('.contributor');
  if (!row) return;
  openVersionModal(Number(row.dataset.card), Number(row.dataset.group));
});
versionModal.addEventListener('click', (event) => {
  if (event.target === versionModal) closeVersionModal();
});
modalBack.addEventListener('click', () => {
  if (modalCardIndex >= 0) showAccounts(modalCardIndex);
});
document.querySelector('#modal-close').addEventListener('click', closeVersionModal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !versionModal.hidden) closeVersionModal();
});
