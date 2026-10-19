/**
 * 《黑暗公爵府的勇者开局》官方网站交互与沉浸式阅读器主逻辑
 * Astrea Duke's Hero Awakening Web App
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Data sanity check
  const novelData = window.NOVEL_DATA || { volumes: [], chapters: [] };
  const characterData = window.CHARACTER_DATA || { characters: [], nineKids: [] };
  const cgData = window.CG_DATA || [];
  const scheduleData = window.SCHEDULE_DATA || {};

  // 2. State
  let currentChapterIndex = 0;
  let activeCharFilter = 'all';
  let activeWeek = 1;

  // Reader Settings State
  const readerSettings = {
    fontSize: parseInt(localStorage.getItem('astrea_font_size') || '18', 10),
    lineHeight: parseFloat(localStorage.getItem('astrea_line_height') || '1.85'),
    fontFamily: localStorage.getItem('astrea_font_family') || 'serif',
    width: localStorage.getItem('astrea_width') || '820px',
    theme: localStorage.getItem('astrea_theme') || 'dark'
  };

  // Restore Theme
  applyTheme(readerSettings.theme);

  // Restore saved chapter
  const savedChapterId = parseInt(localStorage.getItem('astrea_last_chapter_id') || '1', 10);
  const foundIndex = novelData.chapters.findIndex(c => c.id === savedChapterId);
  if (foundIndex !== -1) {
    currentChapterIndex = foundIndex;
  }

  // DOM Elements
  const chapterListEl = document.getElementById('chapterList');
  const readerArticleEl = document.getElementById('readerArticle');
  const prevChapterBtn = document.getElementById('prevChapterBtn');
  const nextChapterBtn = document.getElementById('nextChapterBtn');
  const prevChapterBottomBtn = document.getElementById('prevChapterBottomBtn');
  const nextChapterBottomBtn = document.getElementById('nextChapterBottomBtn');
  const quickReadBtn = document.getElementById('quickReadBtn');
  const heroContinueBtn = document.getElementById('heroContinueBtn');
  const heroStartBtn = document.getElementById('heroStartBtn');
  const chapterFilterInput = document.getElementById('chapterFilterInput');
  const charGridEl = document.getElementById('charGrid');
  const nineKidsGridEl = document.getElementById('nineKidsGrid');
  const charModal = document.getElementById('charModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const scheduleTabsContainer = document.getElementById('scheduleTabs');
  const scheduleViewport = document.getElementById('scheduleViewport');
  const cgGridEl = document.getElementById('cgGrid');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeMenu = document.getElementById('themeMenu');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');
  const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
  const readerSidebar = document.getElementById('readerSidebar');

  // Reader Toolbar buttons
  const fontDecBtn = document.getElementById('fontDecBtn');
  const fontIncBtn = document.getElementById('fontIncBtn');
  const fontValLabel = document.getElementById('fontValLabel');
  const fontToggleBtn = document.getElementById('fontToggleBtn');
  const widthToggleBtn = document.getElementById('widthToggleBtn');

  // ==========================================
  // Modern Web Guidance: light-dismiss-a-dialog fallback
  // ==========================================
  if (charModal) {
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      charModal.addEventListener('click', (event) => {
        if (event.target !== charModal) return;
        const rect = charModal.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (isDialogContent) return;
        charModal.close();
      });
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => charModal.close());
    }
  }

  // ==========================================
  // 3. Theme Engine
  // ==========================================
  function applyTheme(themeName) {
    readerSettings.theme = themeName;
    localStorage.setItem('astrea_theme', themeName);
    if (themeName === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeName);
    }

    // Update active state in theme menu
    document.querySelectorAll('.theme-opt-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
  }

  if (themeToggleBtn && themeMenu) {
    themeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      themeMenu.classList.remove('show');
    });

    document.querySelectorAll('.theme-opt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const theme = btn.dataset.theme;
        applyTheme(theme);
        themeMenu.classList.remove('show');
      });
    });
  }

  // Mobile Nav Toggle
  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    // Close menu when clicking nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  if (mobileSidebarToggle && readerSidebar) {
    mobileSidebarToggle.addEventListener('click', () => {
      readerSidebar.classList.toggle('open');
    });
  }

  // ==========================================
  // 4. Reader Engine
  // ==========================================
  function applyReaderSettings() {
    if (!readerArticleEl) return;
    readerArticleEl.style.fontSize = `${readerSettings.fontSize}px`;
    readerArticleEl.style.lineHeight = readerSettings.lineHeight;
    readerArticleEl.style.maxWidth = readerSettings.width;

    if (readerSettings.fontFamily === 'serif') {
      readerArticleEl.style.fontFamily = '"Noto Serif SC", "Songti SC", "SimSun", serif';
    } else {
      readerArticleEl.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
    }

    if (fontValLabel) {
      fontValLabel.textContent = `${readerSettings.fontSize}px`;
    }

    // sync width toolbar
    const toolbar = document.querySelector('.reader-toolbar');
    if (toolbar) {
      toolbar.style.maxWidth = readerSettings.width;
    }
  }

  // Font adjustments
  if (fontDecBtn) {
    fontDecBtn.addEventListener('click', () => {
      if (readerSettings.fontSize > 14) {
        readerSettings.fontSize -= 2;
        localStorage.setItem('astrea_font_size', readerSettings.fontSize);
        applyReaderSettings();
      }
    });
  }

  if (fontIncBtn) {
    fontIncBtn.addEventListener('click', () => {
      if (readerSettings.fontSize < 28) {
        readerSettings.fontSize += 2;
        localStorage.setItem('astrea_font_size', readerSettings.fontSize);
        applyReaderSettings();
      }
    });
  }

  if (fontToggleBtn) {
    fontToggleBtn.addEventListener('click', () => {
      readerSettings.fontFamily = readerSettings.fontFamily === 'serif' ? 'sans-serif' : 'serif';
      localStorage.setItem('astrea_font_family', readerSettings.fontFamily);
      fontToggleBtn.textContent = readerSettings.fontFamily === 'serif' ? '典雅宋体' : '现代黑体';
      applyReaderSettings();
    });
  }

  if (widthToggleBtn) {
    widthToggleBtn.addEventListener('click', () => {
      const widths = ['760px', '860px', '1040px'];
      const currentIndex = widths.indexOf(readerSettings.width);
      const nextIndex = (currentIndex + 1) % widths.length;
      readerSettings.width = widths[nextIndex];
      localStorage.setItem('astrea_width', readerSettings.width);
      widthToggleBtn.textContent = `宽度: ${nextIndex === 0 ? '舒适' : nextIndex === 1 ? '宽屏' : '超宽'}`;
      applyReaderSettings();
    });
  }

  // Format Markdown Paragraphs to HTML
  function formatParagraph(text) {
    text = text.trim();

    // Check if it's a system HUD block (starts with > **【个人状态面板】** or similar)
    if (text.startsWith('> **【个人状态面板】**') || text.includes('**【个人状态面板】**')) {
      const cleaned = text.replace(/^>\s*/gm, '');
      const lines = cleaned.split('\n').filter(l => l.trim());
      const title = lines[0].replace(/\*\*/g, '').replace(/^[#>\s]*/, '');
      const contentLines = lines.slice(1).map(l => {
        let line = l.replace(/^\*\s*/, '').replace(/\*\*/g, '<strong>').replace(/\*\*/g, '</strong>');
        return `<li>${line}</li>`;
      }).join('');

      return `
        <div class="system-hud-panel">
          <div class="system-hud-title">⚡ ${title}</div>
          <ul>${contentLines}</ul>
        </div>
      `;
    }

    // Check if it's high-risk warning detection panel
    if (text.includes('【叮！检测到外部高危') || text.includes('【系统紧急判定中')) {
      const cleaned = text.replace(/^>\s*/gm, '');
      const lines = cleaned.split('\n').filter(l => l.trim());
      const title = lines[0].replace(/\*\*/g, '');
      const contentLines = lines.slice(1).map(l => {
        let line = l.replace(/^\*\s*/, '').replace(/\*\*/g, '<strong>').replace(/\*\*/g, '</strong>');
        return `<li>${line}</li>`;
      }).join('');

      return `
        <div class="warning-hud-panel">
          <div class="warning-hud-title">⚠️ ${title}</div>
          <ul>${contentLines}</ul>
        </div>
      `;
    }

    // Regular quotes (starts with >)
    if (text.startsWith('>')) {
      const quoteText = text.replace(/^>\s*/gm, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return `<blockquote class="reader-quote">${quoteText}</blockquote>`;
    }

    // Normal text paragraph with bolding and highlight formatting
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/【(.*?)】/g, '<span style="color:var(--gold-light);font-weight:600;">【$1】</span>');

    return `<p>${formatted}</p>`;
  }

  // Render Sidebar Chapters List
  function renderChapterSidebar(filterQuery = '') {
    if (!chapterListEl) return;
    chapterListEl.innerHTML = '';

    const query = filterQuery.toLowerCase().trim();

    novelData.volumes.forEach(vol => {
      const volChapters = novelData.chapters.filter(c => c.volumeId === vol.id);
      const filteredChapters = query
        ? volChapters.filter(c => c.title.toLowerCase().includes(query) || c.content.toLowerCase().includes(query))
        : volChapters;

      if (filteredChapters.length === 0) return;

      const volGroup = document.createElement('div');
      volGroup.className = 'volume-group';

      const volHeader = document.createElement('div');
      volHeader.className = 'volume-header';
      volHeader.innerHTML = `<span>📜</span> <span>${vol.title}</span>`;
      volGroup.appendChild(volHeader);

      filteredChapters.forEach(ch => {
        const item = document.createElement('div');
        item.className = `chapter-item ${novelData.chapters[currentChapterIndex]?.id === ch.id ? 'active' : ''}`;
        item.innerHTML = `
          <div>${ch.title}</div>
          <div class="chapter-item-meta">${ch.wordCount.toLocaleString()} 字 · ${ch.volumeTitle.slice(0, 5)}</div>
        `;

        item.addEventListener('click', () => {
          const targetIndex = novelData.chapters.findIndex(c => c.id === ch.id);
          if (targetIndex !== -1) {
            loadChapter(targetIndex);
            if (readerSidebar) readerSidebar.classList.remove('open');
          }
        });

        volGroup.appendChild(item);
      });

      chapterListEl.appendChild(volGroup);
    });
  }

  // Load and Render Chapter
  function loadChapter(index) {
    if (index < 0 || index >= novelData.chapters.length) return;
    currentChapterIndex = index;
    const chapter = novelData.chapters[index];

    // Save to local storage
    localStorage.setItem('astrea_last_chapter_id', chapter.id);

    // Update buttons
    const isFirst = index === 0;
    const isLast = index === novelData.chapters.length - 1;

    [prevChapterBtn, prevChapterBottomBtn].forEach(b => {
      if (b) b.disabled = isFirst;
    });
    [nextChapterBtn, nextChapterBottomBtn].forEach(b => {
      if (b) b.disabled = isLast;
    });

    // Update Quick Read Buttons Label
    if (heroContinueBtn) {
      heroContinueBtn.innerHTML = `<span>📖</span> 继续阅读：${chapter.title.slice(0, 14)}...`;
    }

    // Format content paragraphs
    const paragraphsHtml = chapter.paragraphs.map(p => formatParagraph(p)).join('');

    readerArticleEl.innerHTML = `
      <header class="reader-header">
        <div class="reader-volume-badge">${chapter.volumeTitle}</div>
        <h2 class="reader-chapter-title">${chapter.title}</h2>
        <div class="reader-meta-row">
          <span>📅 全本精修</span>
          <span>✍️ 字数：${chapter.wordCount.toLocaleString()} 字</span>
          <span>⏱️ 预计阅读：${Math.ceil(chapter.wordCount / 400)} 分钟</span>
        </div>
      </header>
      <div class="reader-content">
        ${paragraphsHtml}
      </div>
    `;

    // Apply settings
    applyReaderSettings();

    // Re-render sidebar to highlight active item
    renderChapterSidebar(chapterFilterInput ? chapterFilterInput.value : '');

    // Scroll to reader top smoothly
    const readerSection = document.getElementById('reader');
    if (readerSection) {
      readerSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Sidebar Filter input listener
  if (chapterFilterInput) {
    chapterFilterInput.addEventListener('input', (e) => {
      renderChapterSidebar(e.target.value);
    });
  }

  // Prev / Next actions
  const goPrev = () => {
    if (currentChapterIndex > 0) loadChapter(currentChapterIndex - 1);
  };
  const goNext = () => {
    if (currentChapterIndex < novelData.chapters.length - 1) loadChapter(currentChapterIndex + 1);
  };

  if (prevChapterBtn) prevChapterBtn.addEventListener('click', goPrev);
  if (nextChapterBtn) nextChapterBtn.addEventListener('click', goNext);
  if (prevChapterBottomBtn) prevChapterBottomBtn.addEventListener('click', goPrev);
  if (nextChapterBottomBtn) nextChapterBottomBtn.addEventListener('click', goNext);

  // Jump from Hero buttons
  if (quickReadBtn) {
    quickReadBtn.addEventListener('click', () => {
      loadChapter(currentChapterIndex);
      document.getElementById('reader')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
  if (heroContinueBtn) {
    heroContinueBtn.addEventListener('click', () => {
      loadChapter(currentChapterIndex);
      document.getElementById('reader')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
  if (heroStartBtn) {
    heroStartBtn.addEventListener('click', () => {
      loadChapter(0);
      document.getElementById('reader')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ==========================================
  // 5. Character Archive & Modal
  // ==========================================
  function renderCharacters() {
    if (!charGridEl) return;
    charGridEl.innerHTML = '';

    const list = characterData.characters.filter(c => {
      if (activeCharFilter === 'all') return true;
      if (activeCharFilter === 'protagonist') return c.group === 'protagonist';
      if (activeCharFilter === 'harem') return c.group === 'harem';
      if (activeCharFilter === 'family') return c.group === 'family';
      return true;
    });

    list.forEach(c => {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.innerHTML = `
        <div class="char-portrait-wrapper">
          <img src="${c.avatar}" alt="${c.name}" class="char-portrait-img" loading="lazy" />
          <div class="char-badge-overlay">${c.groupName}</div>
        </div>
        <div class="char-info-block">
          <div class="char-name-row">
            <h3>${c.name}</h3>
            <div class="char-romaji">${c.romaji}</div>
          </div>
          <p class="char-quote">“${c.quote.slice(0, 36)}...”</p>
          <div class="char-stats-mini">
            <div class="stat-bar-row">
              <span class="stat-label-mini">力量</span>
              <div class="stat-track"><div class="stat-fill" style="width:${c.statsPercent.str}%"></div></div>
              <span class="stat-val-mini">${c.stats.str}</span>
            </div>
            <div class="stat-bar-row">
              <span class="stat-label-mini">敏捷</span>
              <div class="stat-track"><div class="stat-fill" style="width:${c.statsPercent.agi}%"></div></div>
              <span class="stat-val-mini">${c.stats.agi}</span>
            </div>
            <div class="stat-bar-row">
              <span class="stat-label-mini">体质</span>
              <div class="stat-track"><div class="stat-fill" style="width:${c.statsPercent.vit}%"></div></div>
              <span class="stat-val-mini">${c.stats.vit}</span>
            </div>
            <div class="stat-bar-row">
              <span class="stat-label-mini">精神</span>
              <div class="stat-track"><div class="stat-fill" style="width:${c.statsPercent.mnd}%"></div></div>
              <span class="stat-val-mini">${c.stats.mnd}</span>
            </div>
          </div>
          <button class="btn-view-card" data-id="${c.id}">
            <span>✨</span> 查看完整档案
          </button>
        </div>
      `;

      card.querySelector('.btn-view-card').addEventListener('click', () => {
        openCharacterModal(c);
      });

      charGridEl.appendChild(card);
    });
  }

  function openCharacterModal(c) {
    if (!charModal) return;
    const modalContent = document.getElementById('modalContent');
    if (!modalContent) return;

    modalContent.innerHTML = `
      <div class="modal-portrait-col">
        <img src="${c.avatar}" alt="${c.name}" />
      </div>
      <div class="modal-info-col">
        <div class="modal-header">
          <h2 id="modalTitle">${c.name}</h2>
          <div class="modal-title-pill">${c.title}</div>
        </div>
        <p class="char-quote" style="font-size:0.95rem;margin:0.5rem 0;">“${c.quote}”</p>
        <table class="modal-specs-table">
          <tbody>
            <tr><td>身份地位</td><td>${c.role}</td></tr>
            <tr><td>最终年龄</td><td>${c.age}</td></tr>
            <tr><td>身高身材</td><td>${c.height} ${c.bust ? `｜ <strong>三围:</strong> ${c.bust}` : ''}</td></tr>
            <tr><td>外貌特征</td><td><strong>瞳色:</strong> ${c.eyes} <br><strong>发型:</strong> ${c.hair}</td></tr>
            <tr><td>随身圣物</td><td>${c.artifacts}</td></tr>
            <tr><td>人物标签</td><td>${c.tags.map(t => `<span class="char-pill">${t}</span>`).join(' ')}</td></tr>
          </tbody>
        </table>
        <div>
          <h4 style="color:var(--gold-light);margin-bottom:0.4rem;font-size:0.95rem;">人物小传与核心羁绊</h4>
          <p class="modal-bio-text">${c.bio}</p>
        </div>
      </div>
    `;

    charModal.showModal();
  }

  // Filter Tabs Event Listeners
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCharFilter = tab.dataset.filter;
      renderCharacters();
    });
  });

  // Render Nine Kids
  function renderNineKids() {
    if (!nineKidsGridEl) return;
    nineKidsGridEl.innerHTML = '';
    characterData.nineKids.forEach(k => {
      const card = document.createElement('div');
      card.className = 'kid-card';
      card.innerHTML = `
        <div class="kid-name">${k.name}</div>
        <div class="kid-meta">${k.title} · ${k.age}岁 · 母：${k.mother}</div>
        <p class="kid-trait">${k.trait}</p>
      `;
      nineKidsGridEl.appendChild(card);
    });
  }

  // ==========================================
  // 6. Schedule Simulator (四周排期表互动系统)
  // ==========================================
  function renderSchedule() {
    if (!scheduleTabsContainer || !scheduleViewport) return;
    scheduleTabsContainer.innerHTML = '';

    scheduleData.weeks.forEach(w => {
      const btn = document.createElement('button');
      btn.className = `schedule-tab-btn ${w.week === activeWeek ? 'active' : ''}`;
      btn.textContent = w.name.split('：')[0];
      btn.addEventListener('click', () => {
        activeWeek = w.week;
        renderSchedule();
      });
      scheduleTabsContainer.appendChild(btn);
    });

    const currentWeekData = scheduleData.weeks.find(w => w.week === activeWeek) || scheduleData.weeks[0];

    let daysHtml = '';
    if (activeWeek === 1) {
      daysHtml = currentWeekData.days.map(d => `
        <div class="day-card">
          <div class="day-badge">${d.day}</div>
          <div class="day-wife">${d.wife}</div>
          <div class="day-event">${d.event}</div>
        </div>
      `).join('');
    } else if (activeWeek === 2) {
      daysHtml = currentWeekData.days.map(d => `
        <div class="day-card" style="border-left: 3px solid var(--purple-light);">
          <div class="day-badge">${d.day}</div>
          <div class="day-wife" style="color:var(--purple-light);">${d.pair}</div>
          <div class="day-event">${d.event}</div>
        </div>
      `).join('');
    } else {
      daysHtml = currentWeekData.days.map(d => `
        <div class="day-card" style="grid-column: 1 / -1;">
          <div class="day-badge">${d.day}</div>
          <div class="day-wife">${d.wife}</div>
          <div class="day-event" style="font-size:1rem;">${d.event}</div>
        </div>
      `).join('');
    }

    scheduleViewport.innerHTML = `
      <div class="week-display-header">
        <h3 class="week-display-title">${currentWeekData.name}</h3>
        <p class="week-display-sub">${currentWeekData.subtitle}</p>
        <div style="margin-top:0.6rem;font-size:0.85rem;color:var(--text-muted);display:flex;justify-content:center;gap:1.5rem;">
          <span>👑 奥尔多斯：<strong style="color:var(--gold-light);">${currentWeekData.aldousDuty}</strong></span>
          <span>⚡ 奥尔黛丝：<strong style="color:var(--purple-light);">${currentWeekData.aldousiaDuty}</strong></span>
        </div>
      </div>
      <div class="days-grid">
        ${daysHtml}
      </div>
    `;

    // Render Math Strike Dialogue
    const mathBox = document.getElementById('mathStrikeBox');
    if (mathBox) {
      const dialogueLines = scheduleData.dialogue.map(line => `
        <div class="dialogue-line">
          <span class="dialogue-speaker ${line.speaker === '奥尔多斯' ? 'speaker-aldous' : 'speaker-aldousia'}">${line.speaker}：</span>
          <span>${line.text}</span>
        </div>
      `).join('');

      mathBox.innerHTML = `
        <div class="math-strike-header">
          <h3>⚡ 创世女帝的数学暴击：8 ÷ 2 = 4</h3>
          <span style="font-size:0.85rem;color:var(--purple-light);">《四周循环排期法则》</span>
        </div>
        <div class="math-stats-comparison">
          <div class="strike-stat-card">
            <div class="strike-name">👑 奥尔多斯（男版主宰）</div>
            <div class="strike-val">21 <span style="font-size:1rem;color:var(--text-muted);">场约会</span></div>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.4rem;">${scheduleData.stats.aldous.weeks}</p>
            <p style="font-size:0.82rem;color:var(--gold-light);margin-top:0.2rem;">${scheduleData.stats.aldous.week2Status}</p>
          </div>
          <div class="strike-stat-card" style="border-color:var(--purple-light);">
            <div class="strike-name" style="color:var(--purple-light);">⚡ 奥尔黛丝（女帝同位体）</div>
            <div class="strike-val" style="color:var(--purple-light);">28 <span style="font-size:1rem;color:var(--text-muted);">场全勤！(+33%)</span></div>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.4rem;">${scheduleData.stats.aldousia.weeks}</p>
            <p style="font-size:0.82rem;color:var(--purple-light);margin-top:0.2rem;">${scheduleData.stats.aldousia.week2Status}</p>
          </div>
        </div>
        <div class="dialogue-playback">
          ${dialogueLines}
        </div>
      `;
    }
  }

  // ==========================================
  // 7. CG Storyboards
  // ==========================================
  function renderCgStoryboards() {
    if (!cgGridEl) return;
    cgGridEl.innerHTML = '';

    cgData.forEach(cg => {
      const card = document.createElement('div');
      card.className = 'cg-card';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="cg-number-badge">SCENE ${cg.number}</span>
          <span class="cg-tag">${cg.volume} · ${cg.tag}</span>
        </div>
        <h4 class="cg-title">${cg.title}</h4>
        <p class="cg-quote">${cg.quote}</p>
        <p class="cg-desc">${cg.desc}</p>
        <div class="cg-characters-row">
          ${cg.characters.map(char => `<span class="char-pill">👤 ${char}</span>`).join('')}
        </div>
      `;
      cgGridEl.appendChild(card);
    });
  }

  // Initialize all sections
  loadChapter(currentChapterIndex);
  renderCharacters();
  renderNineKids();
  renderSchedule();
  renderCgStoryboards();
});
