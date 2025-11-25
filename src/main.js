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
const exportJsonButton = document.getElementById('export-json');
const exportTextButton = document.getElementById('export-text');

let sources = [];
let metadataReady = false;
let metadataSnapshot = null;
let latestResults = null;
let pipelineLog = [];

function setDetailsEnabled(enabled) {
  [channelInput, titleInput, scriptInput, detailsSubmit].forEach((field) => {
    field.disabled = !enabled;
  });
  detailsForm.classList.toggle('locked', !enabled);
}

function updateExportButtons() {
  const enabled = Boolean(latestResults);
  [exportJsonButton, exportTextButton].forEach((btn) => {
    if (!btn) return;
    btn.disabled = !enabled;
    btn.title = enabled ? 'Download the latest analysis results.' : 'Run the pipeline to enable exports.';
  });
}

function markMetadataStale(reason) {
  metadataReady = false;
  metadataSnapshot = null;
  latestResults = null;
  updateExportButtons();
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

function isNarrativeExpression(sentence) {
  const expressivePhrases = [
    'wow',
    'haha',
    'lol',
    'poor guy',
    'genius',
    'what a moment',
    'go on, guess',
    'that\'s wild',
    'i am jealous',
    'poof',
    'shadow dimension',
    'portal opened'
  ];

  const normalized = sentence.toLowerCase();
  return expressivePhrases.some((phrase) => normalized.includes(phrase));
}

function isFactualSentence(sentence) {
  if (!sentence || sentence.split(/\s+/).length < 5) return false;
  if (isNarrativeExpression(sentence)) return false;

  const numericPattern = /\b\d+(?:\.\d+)?%?|one|two|three|four|five|six|seven|eight|nine|ten|dozen/i;
  const temporalPattern = /\b(\d{3,4}|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;
  const measurementPattern = /\b(km|kilometers|miles|meters|degrees|percent|population|billion|million|thousand)\b/i;
  const factualVerbs = /\b(is|are|was|were|has|have|contains|equals|located|signed|founded)\b/i;

  return (
    numericPattern.test(sentence) ||
    temporalPattern.test(sentence) ||
    measurementPattern.test(sentence) ||
    factualVerbs.test(sentence)
  );
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

function extractLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
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

function buildMetadataSnapshot(currentSources) {
  const typeCounts = currentSources.reduce(
    (map, src) => {
      map[src.type] = (map[src.type] || 0) + 1;
      map.totalWords += countWords(src.content || src.label);
      return map;
    },
    { totalWords: 0 }
  );

  const perSource = currentSources.map((src) => {
    const text = src.content || src.label;
    return {
      id: src.id,
      label: src.label,
      type: src.type,
      words: countWords(text),
      characters: text.length,
      keyPoints: extractKeyPoints(text, 4),
      fullText: text
    };
  });

  return {
    totalSources: currentSources.length,
    totalWords: typeCounts.totalWords,
    typeCounts,
    perSource
  };
}

function simulateMetadataExtraction() {
  if (!sources.length) {
    metadataResults.innerHTML = '<span class="badge">Add at least one source first.</span>';
    setDetailsEnabled(false);
    return;
  }

  metadataSnapshot = buildMetadataSnapshot(sources);
  const { typeCounts } = metadataSnapshot;

  metadataResults.innerHTML = '';

  const summary = document.createElement('div');
  summary.className = 'metadata-summary';
  summary.innerHTML = `
    <div><strong>${metadataSnapshot.totalSources}</strong> sources scanned</div>
    <div><strong>${metadataSnapshot.totalWords}</strong> words ingested</div>
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

  metadataSnapshot.perSource.forEach((src) => {
    const card = document.createElement('div');
    card.className = 'metadata-card';

    const heading = document.createElement('div');
    heading.className = 'metadata-card__heading';
    heading.innerHTML = `<strong>${src.label}</strong> <span>${src.type}</span>`;

    const stats = document.createElement('div');
    stats.className = 'metadata-card__stats';
    stats.innerHTML = `Words: ${src.words} • Characters: ${src.characters}`;

    const insights = document.createElement('ul');
    insights.className = 'metadata-card__insights';
    insights.innerHTML = src.keyPoints.length
      ? src.keyPoints.map((point) => `<li>${point}</li>`).join('')
      : '<li>No textual insights detected.</li>';

    const fullText = document.createElement('details');
    fullText.className = 'metadata-card__fulltext';
    const summaryEl = document.createElement('summary');
    summaryEl.textContent = 'View full extracted text';
    const textBody = document.createElement('div');
    textBody.textContent = src.fullText || 'No text extracted from this source.';
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
  pipelineLog.push({
    title,
    body,
    timestamp: new Date().toISOString()
  });
}

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter((word) => word.length > 2);
}

function evaluateScript(script) {
  const scriptTokens = tokenize(script);
  const scriptSentences = extractSentences(script);
  const scriptLines = extractLines(script);
  const aggregateText = sources.map((src) => src.content || src.label).join(' ');
  const sourceTokens = tokenize(aggregateText);
  const sourceTokenSet = new Set(sourceTokens);

  const matchedTokens = scriptTokens.filter((token) => sourceTokenSet.has(token));
  const perSentence = scriptSentences.map((sentence) => {
    const tokens = tokenize(sentence);
    const matches = tokens.filter((token) => sourceTokenSet.has(token));
    const ratio = tokens.length ? matches.length / tokens.length : 0;
    const factual = isFactualSentence(sentence);
    return {
      sentence,
      isFactual: factual,
      supported: factual ? ratio >= 0.35 && matches.length >= 2 : true,
      matchRatio: Math.round(ratio * 100),
      evidence: matches.slice(0, 10)
    };
  });

  const perLine = scriptLines.map((line, index) => {
    const lineTokens = tokenize(line);
    const matches = lineTokens.filter((token) => sourceTokenSet.has(token));
    const ratio = lineTokens.length ? matches.length / lineTokens.length : 0;
    const lineSentences = extractSentences(line);
    const lineIsFactual =
      lineSentences.some((sentence) => isFactualSentence(sentence)) || isFactualSentence(line);
    return {
      lineNumber: index + 1,
      text: line,
      isFactual: lineIsFactual,
      supported: lineIsFactual ? ratio >= 0.35 && matches.length >= 2 : true,
      matchRatio: Math.round(ratio * 100),
      evidence: Array.from(new Set(matches)).slice(0, 12)
    };
  });

  const factualSentences = perSentence.filter((item) => item.isFactual);
  const factualLines = perLine.filter((item) => item.isFactual);
  const unsupportedFactual = factualSentences.filter((item) => !item.supported).map((item) => item.sentence);
  const unsupportedFactualLines = factualLines.filter((item) => !item.supported).map((item) => item.text);

  const overallCoverage = factualSentences.length
    ? Math.round(((factualSentences.length - unsupportedFactual.length) / factualSentences.length) * 100)
    : 100;

  const perSource = sources.map((src) => {
    const tokens = tokenize(src.content || src.label);
    const sourceSet = new Set(tokens);
    const overlap = scriptTokens.filter((token) => sourceSet.has(token));
    const coverageScore = scriptTokens.length
      ? Math.round((overlap.length / scriptTokens.length) * 100)
      : 0;
    return {
      label: src.label,
      type: src.type,
      coverage: coverageScore,
      overlapWords: Array.from(new Set(overlap)).slice(0, 8)
    };
  });

  return {
    overallCoverage,
    matchedCount: matchedTokens.length,
    totalCount: scriptTokens.length,
    unsupportedSentences: unsupportedFactual,
    unsupportedLines: unsupportedFactualLines,
    perSentence,
    perLine,
    perSource,
    factualSentenceCount: factualSentences.length,
    factualLineCount: factualLines.length
  };
}

function buildNarrative(channel, title, script, evaluation) {
  const coverageLine = `Evidence coverage: ${evaluation.overallCoverage}% of factual sentences show source support.`;
  const unsupportedLine = evaluation.unsupportedSentences.length
    ? `Flagged factual sentences (${evaluation.unsupportedSentences.length}) need citations.`
    : 'All detected factual sentences show overlap with captured sources.';
  return [
    `Channel "${channel}" explores "${title}" with human-like, curious narration.`,
    `Script summary: ${summarizeText(script, 240)}`,
    coverageLine,
    unsupportedLine
  ].join(' ');
}

function renderReport(channel, title, script, evaluation, narrative) {
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

  const accuracyCard = document.createElement('div');
  accuracyCard.className = 'report-card report-card--accuracy';
  const header = document.createElement('div');
  header.className = 'accuracy-header';
  header.innerHTML = `<h4>Script Accuracy Check</h4><span class="badge">${evaluation.overallCoverage}% factual coverage</span>`;

  const coverageStats = document.createElement('p');
  coverageStats.className = 'muted';
  if (evaluation.factualSentenceCount) {
    const supportedCount = evaluation.factualSentenceCount - evaluation.unsupportedSentences.length;
    coverageStats.textContent = `${supportedCount}/${evaluation.factualSentenceCount} factual sentences show evidence overlap.`;
  } else {
    coverageStats.textContent = 'No factual sentences detected — narrative-only content.';
  }

  const unsupported = document.createElement('div');
  unsupported.className = 'unsupported-block';
  unsupported.innerHTML = `<strong>Flagged factual sentences (${evaluation.unsupportedSentences.length}):</strong>`;
  const list = document.createElement('ul');
  list.className = 'unsupported-list';
  list.innerHTML = evaluation.unsupportedSentences.length
    ? evaluation.unsupportedSentences.map((sentence) => `<li>${sentence}</li>`).join('')
    : '<li>All detected factual sentences show evidence overlap.</li>';
  unsupported.appendChild(list);

  const lineCheck = document.createElement('div');
  lineCheck.className = 'line-review';
  lineCheck.innerHTML = `
    <div class="line-review__header">
      <strong>Line-by-line scan</strong>
      <span class="badge">${evaluation.factualLineCount || 0} factual lines</span>
    </div>
  `;
  const lineList = document.createElement('ul');
  lineList.className = 'line-review__list';
  lineList.innerHTML = evaluation.perLine
    .map((line) => {
      const status = line.isFactual
        ? line.supported
          ? '<span class="pill pill--good">supported</span>'
          : '<span class="pill pill--warn">needs evidence</span>'
        : '<span class="pill">narrative</span>';
      const evidenceText = line.evidence.length ? ` • evidence: ${line.evidence.join(', ')}` : '';
      return `<li><span class="line-number">${line.lineNumber}</span> ${status}<span class="line-text">${line.text}</span><span class="line-evidence">${evidenceText}</span></li>`;
    })
    .join('');
  lineCheck.appendChild(lineList);

  const sourceGrid = document.createElement('div');
  sourceGrid.className = 'source-coverage-grid';
  evaluation.perSource.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'coverage-card';
    card.innerHTML = `
      <div class="coverage-heading">
        <strong>${item.label}</strong>
        <span class="badge">${item.type}</span>
      </div>
      <div class="coverage-score">${item.coverage}% script overlap</div>
      <div class="coverage-evidence">${item.overlapWords.length ? 'Evidence tokens: ' + item.overlapWords.join(', ') : 'No overlap detected'}</div>
    `;
    sourceGrid.appendChild(card);
  });

  accuracyCard.appendChild(header);
  accuracyCard.appendChild(coverageStats);
  accuracyCard.appendChild(unsupported);
  accuracyCard.appendChild(lineCheck);
  accuracyCard.appendChild(sourceGrid);
  report.appendChild(accuracyCard);
}

function buildTextReport(result) {
  const lines = [];
  lines.push('Source Fusion Studio Report');
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push('');
  lines.push(`Channel: ${result.channel}`);
  lines.push(`Title: ${result.title}`);
  lines.push('');
  lines.push('Script:');
  lines.push(result.script);
  lines.push('');
  lines.push('Narrative:');
  lines.push(result.narrative);
  lines.push('');
  lines.push('Accuracy');
  const supportedCount = result.evaluation.factualSentenceCount - result.evaluation.unsupportedSentences.length;
  lines.push(
    `Coverage: ${result.evaluation.overallCoverage}% factual support (${supportedCount}/${
      result.evaluation.factualSentenceCount || 0
    } sentences backed)`
  );
  lines.push('Flagged factual sentences:');
  if (result.evaluation.unsupportedSentences.length) {
    result.evaluation.unsupportedSentences.forEach((sentence, idx) => {
      lines.push(`  ${idx + 1}. ${sentence}`);
    });
  } else {
    lines.push('  No factual sentences missing evidence.');
  }
  lines.push('Line-by-line scan:');
  result.evaluation.perLine.forEach((line) => {
    const status = line.isFactual ? (line.supported ? 'supported' : 'needs evidence') : 'narrative';
    const evidence = line.evidence.length ? ` | evidence: ${line.evidence.join(', ')}` : '';
    lines.push(`  [${line.lineNumber}] (${status}) ${line.text}${evidence}`);
  });
  lines.push('');
  lines.push('Per-source overlap:');
  result.evaluation.perSource.forEach((entry) => {
    lines.push(
      `  - ${entry.label} [${entry.type}]: ${entry.coverage}% overlap; tokens: ${entry.overlapWords.join(', ') || 'none'}`
    );
  });
  lines.push('');
  lines.push('Metadata snapshot:');
  lines.push(`  Sources scanned: ${result.metadata?.totalSources || 0}`);
  lines.push(`  Words ingested: ${result.metadata?.totalWords || 0}`);
  if (result.metadata?.perSource?.length) {
    result.metadata.perSource.forEach((src) => {
      lines.push(
        `  * ${src.label} (${src.type}) — ${src.words} words, ${src.characters} chars; key points: ${src.keyPoints.join(' | ') || 'none'}`
      );
    });
  }
  lines.push('');
  lines.push('Pipeline log:');
  if (result.pipelineLog.length) {
    result.pipelineLog.forEach((entry) => {
      lines.push(`  - [${entry.timestamp}] ${entry.title}: ${entry.body}`);
    });
  } else {
    lines.push('  No pipeline entries recorded.');
  }

  return lines.join('\n');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportResultsAsJSON() {
  if (!latestResults) return;
  const payload = JSON.stringify(latestResults, null, 2);
  downloadFile(payload, 'source-fusion-report.json', 'application/json');
}

function exportResultsAsText() {
  if (!latestResults) return;
  const textReport = buildTextReport(latestResults);
  downloadFile(textReport, 'source-fusion-report.txt', 'text/plain');
}

function runPipeline(channel, title, script) {
  const evaluation = evaluateScript(script);
  const narrative = buildNarrative(channel, title, script, evaluation);
  analysisLog.innerHTML = '';
  pipelineLog = [];
  latestResults = null;
  updateExportButtons();
  renderSteps(0);
  progressFill.style.width = '0%';

  const steps = [
    () => logEntry('Source prep', 'Clustering uploads, queries, and pasted text for quick lookup.'),
    () =>
      logEntry(
        'Script alignment',
        `Scanning every script line for factual claims and evidence overlap. Coverage: ${evaluation.overallCoverage}%.`
      ),
    () =>
      logEntry(
        'Evidence flags',
        `${evaluation.unsupportedSentences.length} factual sentences need stronger sourcing; ${evaluation.unsupportedLines.length} lines flagged overall.`
      ),
    () => logEntry('Report assembly', 'Merging channel inputs, accuracy checks, and narrative into a ready-to-share report.')
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
      renderReport(channel, title, script, evaluation, narrative);
      latestResults = {
        generatedAt: new Date().toISOString(),
        channel,
        title,
        script,
        narrative,
        evaluation,
        metadata: metadataSnapshot,
        sources: sources.map((src) => ({ ...src })),
        pipelineLog: pipelineLog.map((entry) => ({ ...entry }))
      };
      updateExportButtons();
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
  exportJsonButton.addEventListener('click', exportResultsAsJSON);
  exportTextButton.addEventListener('click', exportResultsAsText);

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
