const sourcesList = document.getElementById('sources');
const metadataResults = document.getElementById('metadata-results');
const extractButton = document.getElementById('extract-metadata');
const detailsForm = document.getElementById('details-form');
const validationMessage = document.getElementById('validation-message');
const progressFill = document.getElementById('progress-fill');
const progressSteps = document.getElementById('progress-steps');
const analysisLog = document.getElementById('analysis-log');
const report = document.getElementById('report');
const channelInput = document.getElementById('channel-name');
const titleInput = document.getElementById('video-title');
const scriptInput = document.getElementById('script');
const detailsSubmit = detailsForm.querySelector('button[type="submit"]');

let sources = [];
let metadataReady = false;

function setDetailsEnabled(enabled) {
  [channelInput, titleInput, scriptInput, detailsSubmit].forEach((field) => {
    field.disabled = !enabled;
  });
  detailsForm.classList.toggle('locked', !enabled);
}

function markMetadataStale(reason) {
  metadataReady = false;
  if (reason) {
    metadataResults.innerHTML = `<span class="badge">${reason}</span>`;
  }
  validationMessage.textContent = '';
  setDetailsEnabled(false);
}

const stepTemplates = [
  { id: 'prep', label: 'Source prep' },
  { id: 'alignment', label: 'Script alignment' },
  { id: 'insights', label: 'Human-like insights' },
  { id: 'report', label: 'Report assembly' }
];

function renderSources() {
  sourcesList.innerHTML = '';
  if (!sources.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No sources yet';
    empty.className = 'badge';
    sourcesList.appendChild(empty);
    return;
  }

  sources.forEach((src) => {
    const li = document.createElement('li');
    li.textContent = `${src.type}: ${src.label}`;
    sourcesList.appendChild(li);
  });
}

function addSource(type, label, content = '') {
  sources.push({ id: crypto.randomUUID(), type, label, content });
  renderSources();
  markMetadataStale('New sources added — rerun metadata extraction.');
}

function summarizeText(text, maxLength = 160) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function extractSentences(text) {
  return text
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function extractKeyPoints(text, maxItems = 3) {
  if (!text) return [];
  const sentences = extractSentences(text);
  return sentences
    .sort((a, b) => b.length - a.length)
    .slice(0, maxItems)
    .map((sentence) => summarizeText(sentence, 240));
}

function simulateMetadataExtraction() {
  if (!sources.length) {
    metadataResults.innerHTML = '<span class="badge">Add at least one source first.</span>';
    setDetailsEnabled(false);
    return;
  }

  const typeCounts = sources.reduce(
    (map, src) => {
      map[src.type] = (map[src.type] || 0) + 1;
      map.totalWords += countWords(src.content || src.label);
      return map;
    },
    { totalWords: 0 }
  );

  metadataResults.innerHTML = '';

  const summary = document.createElement('div');
  summary.className = 'metadata-summary';
  summary.innerHTML = `
    <div><strong>${sources.length}</strong> sources scanned</div>
    <div><strong>${typeCounts.totalWords}</strong> words ingested</div>
  `;
  metadataResults.appendChild(summary);

  const badges = document.createElement('div');
  badges.className = 'metadata-badges';
  Object.entries(typeCounts)
    .filter(([key]) => key !== 'totalWords')
    .forEach(([type, count]) => {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = `${type} • ${count}`;
      badges.appendChild(badge);
    });
  metadataResults.appendChild(badges);

  const cards = document.createElement('div');
  cards.className = 'metadata-cards';

  sources.forEach((src) => {
    const card = document.createElement('div');
    card.className = 'metadata-card';

    const heading = document.createElement('div');
    heading.className = 'metadata-card__heading';
    heading.innerHTML = `<strong>${src.label}</strong> <span>${src.type}</span>`;

    const stats = document.createElement('div');
    stats.className = 'metadata-card__stats';
    const words = countWords(src.content || src.label);
    stats.innerHTML = `Words: ${words} • Characters: ${(src.content || src.label).length}`;

    const keyPoints = extractKeyPoints(src.content || src.label, 3);
    const insights = document.createElement('ul');
    insights.className = 'metadata-card__insights';
    insights.innerHTML = keyPoints.length
      ? keyPoints.map((point) => `<li>${point}</li>`).join('')
      : '<li>No textual insights detected.</li>';

    const fullText = document.createElement('details');
    fullText.className = 'metadata-card__fulltext';
    const summaryEl = document.createElement('summary');
    summaryEl.textContent = 'View full extracted text';
    const textBody = document.createElement('div');
    textBody.textContent = src.content || 'No text extracted from this source.';
    fullText.appendChild(summaryEl);
    fullText.appendChild(textBody);

    card.appendChild(heading);
    card.appendChild(stats);
    card.appendChild(insights);
    card.appendChild(fullText);
    cards.appendChild(card);
  });

  metadataResults.appendChild(cards);

  metadataReady = true;
  validationMessage.textContent = '';
  setDetailsEnabled(true);
}

function validateDetails(channel, title, script) {
  const errors = [];
  if (!metadataReady) errors.push('Extract metadata first.');
  if (!channel || channel.trim().length < 3) errors.push('Channel name must be at least 3 characters.');
  if (!title || title.trim().length < 5) errors.push('Title must be at least 5 characters.');
  if (!script || script.trim().length < 20) errors.push('Script must be at least 20 characters.');
  return errors;
}

function renderSteps(activeIndex) {
  progressSteps.innerHTML = '';
  stepTemplates.forEach((step, index) => {
    const div = document.createElement('div');
    div.className = 'step';
    if (index < activeIndex) div.classList.add('done');
    else if (index === activeIndex) div.classList.add('active');

    const label = document.createElement('div');
    label.className = 'label';
    label.innerHTML = index < activeIndex
      ? '✅'
      : index === activeIndex ? '🔄' : '⏳';
    label.innerHTML += ` <span>${step.label}</span>`;

    const status = document.createElement('div');
    status.className = 'status';
    const descriptors = [
      'Organizing sources',
      'Checking alignment',
      'Drafting narrative',
      'Compiling report'
    ];
    status.textContent = descriptors[index];

    div.appendChild(label);
    div.appendChild(status);
    progressSteps.appendChild(div);
  });
}

function logEntry(title, body) {
  const wrapper = document.createElement('div');
  wrapper.className = 'log-entry';
  const heading = document.createElement('div');
  heading.className = 'title';
  heading.textContent = title;
  const content = document.createElement('div');
  content.className = 'body';
  content.textContent = body;
  wrapper.appendChild(heading);
  wrapper.appendChild(content);
  analysisLog.prepend(wrapper);
}

function buildNarrative(channel, title, script) {
  const coverage = sources.map((src) => `${src.type}: ${src.label}`).join(' | ');
  const tone = 'human-like, curious, and explanatory';
  return [
    `Channel "${channel}" explores "${title}" with ${tone} commentary.`,
    `Script summary: ${summarizeText(script, 240)}`,
    `Sources referenced: ${coverage || 'No sources recorded.'}`,
    'Alignment check: main talking points echo uploaded, searched, and pasted evidence with clear transitions.'
  ].join(' ');
}

function renderReport(channel, title, script, narrative) {
  report.innerHTML = '';
  const cards = [
    { heading: 'Channel Name', value: channel },
    { heading: 'Video Title', value: title },
    { heading: 'Script', value: script },
    { heading: 'Analysis Narrative', value: narrative }
  ];

  cards.forEach((card) => {
    const div = document.createElement('div');
    div.className = 'report-card';
    const h4 = document.createElement('h4');
    h4.textContent = card.heading;
    const p = document.createElement('p');
    p.textContent = card.value;
    div.appendChild(h4);
    div.appendChild(p);
    report.appendChild(div);
  });
}

function runPipeline(channel, title, script) {
  const narrative = buildNarrative(channel, title, script);
  analysisLog.innerHTML = '';
  renderSteps(0);
  progressFill.style.width = '0%';

  const steps = [
    () => logEntry('Source prep', 'Clustering uploads, queries, and pasted text for quick lookup.'),
    () => logEntry('Script alignment', 'Highlighting overlaps and gaps between the script and gathered references.'),
    () => logEntry('Human-like insights', 'Crafting connective language and natural pacing for the voiceover.'),
    () => logEntry('Report assembly', 'Merging channel inputs and analysis into a ready-to-share report.')
  ];

  let current = 0;
  renderSteps(current);

  const interval = setInterval(() => {
    steps[current]();
    progressFill.style.width = `${((current + 1) / steps.length) * 100}%`;
    renderSteps(current + 1);
    if (current === steps.length - 1) {
      clearInterval(interval);
      logEntry('Narrative Ready', narrative);
      renderReport(channel, title, script, narrative);
    }
    current += 1;
  }, 900);
}

function isDocx(file) {
  return (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx')
  );
}

async function extractDocxText(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const doc = zip.file('word/document.xml');
  if (!doc) throw new Error('DOCX missing document.xml');
  const xmlString = await doc.async('string');
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlString, 'text/xml');
  const nodes = Array.from(xml.getElementsByTagName('w:t'));
  const text = nodes
    .map((node) => node.textContent.trim())
    .filter(Boolean)
    .join(' ');
  return text;
}

function readFileContent(file) {
  return new Promise((resolve) => {
    if (isDocx(file)) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const text = await extractDocxText(reader.result);
          resolve({ label: file.name, content: text });
        } catch (error) {
          console.error('DOCX extraction failed', error);
          resolve({ label: `${file.name} (docx extraction failed)`, content: '' });
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve({ label: file.name, content: reader.result || '' });
    reader.readAsText(file);
  });
}

async function handleUpload(event) {
  event.preventDefault();
  const input = document.getElementById('file-input');
  const files = Array.from(input.files || []);
  if (!files.length) return;

  const uploads = await Promise.all(files.map((file) => readFileContent(file)));
  uploads.forEach(({ label, content }) => addSource('upload', label, content));
  input.value = '';
}

function handleWebSearch(event) {
  event.preventDefault();
  const query = document.getElementById('web-search').value.trim();
  if (!query) return;
  addSource('web search', query, `Simulated search results for "${query}"`);
  event.target.reset();
}

function handleDeepSearch(event) {
  event.preventDefault();
  const query = document.getElementById('deep-search').value.trim();
  if (!query) return;
  addSource('deep search', query, `Deep semantic sweep for "${query}"`);
  event.target.reset();
}

function handlePaste(event) {
  event.preventDefault();
  const text = document.getElementById('paste-area').value.trim();
  if (!text) return;
  addSource('pasted text', summarizeText(text, 120), text);
  event.target.reset();
}

function bindEvents() {
  document.getElementById('upload-form').addEventListener('submit', handleUpload);
  document.getElementById('web-search-form').addEventListener('submit', handleWebSearch);
  document.getElementById('deep-search-form').addEventListener('submit', handleDeepSearch);
  document.getElementById('paste-form').addEventListener('submit', handlePaste);
  extractButton.addEventListener('click', simulateMetadataExtraction);

  detailsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const channel = document.getElementById('channel-name').value.trim();
    const title = document.getElementById('video-title').value.trim();
    const script = document.getElementById('script').value.trim();
    const errors = validateDetails(channel, title, script);
    if (errors.length) {
      validationMessage.textContent = errors.join(' ');
      return;
    }
    validationMessage.textContent = '';
    runPipeline(channel, title, script);
  });
}

markMetadataStale('Awaiting metadata extraction.');
renderSources();
bindEvents();
