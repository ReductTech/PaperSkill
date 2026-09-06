'use strict';

const grid = document.querySelector('#paper-grid');
const empty = document.querySelector('#empty');
const search = document.querySelector('#search');
const topicFilter = document.querySelector('#topic-filter');
const summary = document.querySelector('#result-summary');
let papers = [];

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
  grid.innerHTML = visible.map((paper) => {
    const versions = sortedVersions(paper.versions);
    return `
    <article class="paper-card">
      <div class="card-meta"><span>${escapeHtml([paper.venue, paper.year].filter(Boolean).join(' · ') || '论文教程')}</span><span class="status">${statusLabel(paper.status)}</span></div>
      <h2 class="${titleSizeClass(paper.title)}">${escapeHtml(paper.title)}</h2>
      <div class="topics">${(paper.topics || []).map((item) => `<span class="topic">${escapeHtml(item)}</span>`).join('')}</div>
      <div class="versions">
        <p class="versions-title">网页版本 · ${versions.length}</p>
        <ul class="version-list">
          ${versions.map((version) => `
          <li>
            <span class="version-info">
              <span class="version-name">${escapeHtml(version.version)}</span>
              <span class="version-meta">${escapeHtml(versionAuthors(version))}${version.versionDate ? ` · ${escapeHtml(version.versionDate)}` : ''} · ${statusLabel(version.status)}</span>
            </span>
            <a class="open-link" href="./${escapeHtml(version.tutorialUrl)}">打开 →</a>
          </li>`).join('')}
        </ul>
      </div>
      <div class="card-footer">
        <a class="paper-link" href="${escapeHtml(paper.paperUrl)}" target="_blank" rel="noopener">查看原论文</a>
        <span class="branch">分支：paper/${escapeHtml(paper.paperName)}</span>
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
