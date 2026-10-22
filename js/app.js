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

  // Restore saved chapter (prioritize bookmark over last chapter id)
  const savedChapterId = parseInt(
    localStorage.getItem('astrea_bookmark_chapter_id') ||
    localStorage.getItem('astrea_last_chapter_id') || '1',
    10
  );
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

  // Reader Toolbar & Chapter Picker Elements
  const toolbarDrawerBtn = document.getElementById('toolbarDrawerBtn');
  const openChapterPickerBtn = document.getElementById('openChapterPickerBtn');
  const toolbarChapterTitle = document.getElementById('toolbarChapterTitle');
  const fontDecBtn = document.getElementById('fontDecBtn');
  const fontIncBtn = document.getElementById('fontIncBtn');
  const fontValLabel = document.getElementById('fontValLabel');
  const fontToggleBtn = document.getElementById('fontToggleBtn');
  const widthToggleBtn = document.getElementById('widthToggleBtn');

  // Modern Modal & Bookmark Elements
  const chapterPickerModal = document.getElementById('chapterPickerModal');
  const closeChapterModalBtn = document.getElementById('closeChapterModalBtn');
  const modalChapterSearch = document.getElementById('modalChapterSearch');
  const modalChapterGrid = document.getElementById('modalChapterGrid');

  const navBookmarkBtn = document.getElementById('navBookmarkBtn');
  const navBookmarkLabel = document.getElementById('navBookmarkLabel');
  const floatingBookmark = document.getElementById('floatingBookmark');
  const floatingBookmarkPercent = document.getElementById('floatingBookmarkPercent');
  const floatingBookmarkTitle = document.getElementById('floatingBookmarkTitle');
  const floatingBookmarkJumpBtn = document.getElementById('floatingBookmarkJumpBtn');
  const dismissBookmarkBtn = document.getElementById('dismissBookmarkBtn');
  const toastNotification = document.getElementById('toastNotification');

  // AI TTS Voice Audio Player Elements
  const toolbarTtsBtn = document.getElementById('toolbarTtsBtn');
  const toolbarTtsLabel = document.getElementById('toolbarTtsLabel');
  const ttsPlayerBar = document.getElementById('ttsPlayerBar');
  const ttsVisualizer = document.getElementById('ttsVisualizer');
  const ttsStatusBadge = document.getElementById('ttsStatusBadge');
  const ttsParaCount = document.getElementById('ttsParaCount');
  const ttsVoiceTitle = document.getElementById('ttsVoiceTitle');
  const ttsPrevParaBtn = document.getElementById('ttsPrevParaBtn');
  const ttsPlayPauseBtn = document.getElementById('ttsPlayPauseBtn');
  const ttsPlayIcon = document.getElementById('ttsPlayIcon');
  const ttsNextParaBtn = document.getElementById('ttsNextParaBtn');
  const ttsStopBtn = document.getElementById('ttsStopBtn');
  const voiceMaleBtn = document.getElementById('voiceMaleBtn');
  const voiceFemaleBtn = document.getElementById('voiceFemaleBtn');
  const ttsVoiceSelect = document.getElementById('ttsVoiceSelect');
  const ttsRateSelect = document.getElementById('ttsRateSelect');
  const ttsCloseBtn = document.getElementById('ttsCloseBtn');
  const ttsHelpBtn = document.getElementById('ttsHelpBtn');
  const ttsHelpModal = document.getElementById('ttsHelpModal');
  const closeTtsHelpBtn = document.getElementById('closeTtsHelpBtn');

  // Settings Tab & Voice Customization Elements
  const settingsSaveVoiceBtn = document.getElementById('settingsSaveVoiceBtn');
  const settingsJumpToReaderBtn = document.getElementById('settingsJumpToReaderBtn');
  const voiceTestPhraseInput = document.getElementById('voiceTestPhraseInput');
  const testPlayCurrentVoiceBtn = document.getElementById('testPlayCurrentVoiceBtn');
  const testPlayMainIcon = document.getElementById('testPlayMainIcon');
  const testPlayMainText = document.getElementById('testPlayMainText');
  const testStopBtn = document.getElementById('testStopBtn');
  const settingsRateSlider = document.getElementById('settingsRateSlider');
  const rateValueBadge = document.getElementById('rateValueBadge');
  const settingsPitchSlider = document.getElementById('settingsPitchSlider');
  const pitchValueBadge = document.getElementById('pitchValueBadge');
  const settingsVoiceSearch = document.getElementById('settingsVoiceSearch');
  const clearVoiceSearchBtn = document.getElementById('clearVoiceSearchBtn');
  const settingsVoiceListContainer = document.getElementById('settingsVoiceListContainer');
  const voiceTotalCountBadge = document.getElementById('voiceTotalCountBadge');
  const activeVoiceBadgeText = document.getElementById('activeVoiceBadgeText');
  const activeVoiceDetailsText = document.getElementById('activeVoiceDetailsText');
  const countAll = document.getElementById('countAll');
  const countZh = document.getElementById('countZh');
  const countMale = document.getElementById('countMale');
  const countFemale = document.getElementById('countFemale');
  const countOther = document.getElementById('countOther');

  // TTS State
  const ttsState = {
    supported: 'speechSynthesis' in window,
    isPlaying: false,
    isPaused: false,
    mode: localStorage.getItem('astrea_tts_mode') || 'male', // 'male' | 'female' | 'custom'
    rate: parseFloat(localStorage.getItem('astrea_tts_rate') || '1.0'),
    pitch: parseFloat(localStorage.getItem('astrea_tts_pitch') || '1.0'),
    selectedVoiceURI: localStorage.getItem('astrea_tts_voice_uri') || 'auto',
    currentParaIndex: 0,
    currentUtterance: null,
    previewPlayingVoiceURI: null,
    previewUtterance: null,
    voices: [],
    maleVoices: [],
    femaleVoices: [],
    activeFilter: 'all',
    searchQuery: ''
  };

  // ==========================================
  // Modern Web Guidance: light-dismiss-a-dialog fallback
  // ==========================================
  [charModal, chapterPickerModal, ttsHelpModal].forEach(dialogEl => {
    if (dialogEl && !('closedBy' in HTMLDialogElement.prototype)) {
      dialogEl.addEventListener('click', (event) => {
        if (event.target !== dialogEl) return;
        const rect = dialogEl.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (isDialogContent) return;
        dialogEl.close();
      });
    }
  });

  if (modalCloseBtn && charModal) {
    modalCloseBtn.addEventListener('click', () => charModal.close());
  }
  if (closeChapterModalBtn && chapterPickerModal) {
    closeChapterModalBtn.addEventListener('click', () => chapterPickerModal.close());
  }
  if (closeTtsHelpBtn && ttsHelpModal) {
    closeTtsHelpBtn.addEventListener('click', () => ttsHelpModal.close());
  }
  if (ttsHelpBtn && ttsHelpModal) {
    ttsHelpBtn.addEventListener('click', () => ttsHelpModal.showModal());
  }

  // ==========================================
  // Toast Notification Helper
  // ==========================================
  let toastTimer = null;
  function showToast(message, duration = 2800) {
    if (!toastNotification) return;
    toastNotification.innerHTML = `<span>✨</span> <span>${message}</span>`;
    toastNotification.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.remove('show');
    }, duration);
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

  // ==========================================
  // Bookmark & Reading Progress Engine
  // ==========================================
  function getBookmark() {
    const chapterId = parseInt(
      localStorage.getItem('astrea_bookmark_chapter_id') ||
      localStorage.getItem('astrea_last_chapter_id') || '1',
      10
    );
    const scrollPct = parseInt(localStorage.getItem('astrea_bookmark_scroll_pct') || '0', 10);
    const foundChapter = novelData.chapters.find(c => c.id === chapterId) || novelData.chapters[0];
    return {
      chapterId: foundChapter ? foundChapter.id : 1,
      scrollPct: isNaN(scrollPct) ? 0 : Math.max(0, Math.min(100, scrollPct)),
      chapter: foundChapter
    };
  }

  function updateBookmarkUI(chapter, scrollPct) {
    if (!chapter) return;

    // Update Header Bookmark Pill
    if (navBookmarkLabel) {
      navBookmarkLabel.textContent = `第${chapter.id}章 (${scrollPct}%)`;
    }

    // Update Floating Bookmark Bar
    if (floatingBookmarkPercent) {
      floatingBookmarkPercent.textContent = `已读 ${scrollPct}%`;
    }
    if (floatingBookmarkTitle) {
      floatingBookmarkTitle.textContent = chapter.title;
    }

    // Update Hero Continue Button
    if (heroContinueBtn) {
      heroContinueBtn.innerHTML = `<span>📖</span> 继续阅读：第${chapter.id}章 (${scrollPct}%)`;
    }
  }

  function saveBookmark(chapterId, scrollPct) {
    const chapter = novelData.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    localStorage.setItem('astrea_bookmark_chapter_id', chapter.id);
    localStorage.setItem('astrea_bookmark_scroll_pct', scrollPct);
    localStorage.setItem('astrea_bookmark_title', chapter.title);

    updateBookmarkUI(chapter, scrollPct);
  }

  function jumpToBookmark() {
    const bookmark = getBookmark();
    const targetIndex = novelData.chapters.findIndex(c => c.id === bookmark.chapterId);
    const validIndex = targetIndex !== -1 ? targetIndex : 0;
    const targetChapter = novelData.chapters[validIndex];

    const performScroll = () => {
      if (!readerArticleEl) return;
      const articleTop = readerArticleEl.offsetTop;
      const articleHeight = readerArticleEl.offsetHeight;
      const targetScroll = articleTop + (articleHeight * (bookmark.scrollPct / 100)) - 90;
      window.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
      showToast(`已跳回记忆书签：${targetChapter.title} (进度 ${bookmark.scrollPct}%)`);
    };

    if (currentChapterIndex !== validIndex) {
      loadChapter(validIndex, false);
      setTimeout(performScroll, 120);
    } else {
      performScroll();
    }
  }

  // ==========================================
  // Quick Chapter Selector Modal (弹窗目录与快速切换)
  // ==========================================
  function renderChapterModalGrid(filterQuery = '') {
    if (!modalChapterGrid) return;
    modalChapterGrid.innerHTML = '';
    const query = filterQuery.toLowerCase().trim();
    const bookmark = getBookmark();

    novelData.volumes.forEach(vol => {
      const volChapters = novelData.chapters.filter(c => c.volumeId === vol.id);
      const filtered = query
        ? volChapters.filter(c => c.title.toLowerCase().includes(query) || c.content.toLowerCase().includes(query))
        : volChapters;

      if (filtered.length === 0) return;

      const volBlock = document.createElement('div');
      volBlock.className = 'modal-volume-block';

      const volTitle = document.createElement('div');
      volTitle.className = 'modal-volume-title';
      volTitle.innerHTML = `<span>📜</span> <span>${vol.title}</span>`;
      volBlock.appendChild(volTitle);

      const grid = document.createElement('div');
      grid.className = 'modal-chapter-grid';

      filtered.forEach(ch => {
        const isActive = novelData.chapters[currentChapterIndex]?.id === ch.id;
        const isBookmarked = ch.id === bookmark.chapterId;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `modal-chapter-btn ${isActive ? 'active' : ''} ${isBookmarked ? 'bookmarked' : ''}`;
        btn.innerHTML = `
          <span class="modal-ch-num">${ch.volumeTitle.split('·')[0].trim()} · 第 ${ch.id} 章</span>
          <span class="modal-ch-title">${ch.title}</span>
          <span class="modal-ch-meta">
            <span>✍️ ${ch.wordCount.toLocaleString()} 字</span>
            <span>⏱️ ${Math.ceil(ch.wordCount / 400)} 分钟</span>
          </span>
        `;

        btn.addEventListener('click', () => {
          const targetIndex = novelData.chapters.findIndex(c => c.id === ch.id);
          if (targetIndex !== -1) {
            loadChapter(targetIndex, true);
            if (chapterPickerModal) chapterPickerModal.close();
            showToast(`📖 已切换至：${ch.title}`);
          }
        });

        grid.appendChild(btn);
      });

      volBlock.appendChild(grid);
      modalChapterGrid.appendChild(volBlock);
    });
  }

  // Chapter Picker Modal Triggers & Events
  if (openChapterPickerBtn && chapterPickerModal) {
    openChapterPickerBtn.addEventListener('click', () => {
      chapterPickerModal.showModal();
      if (modalChapterSearch) {
        modalChapterSearch.value = '';
        setTimeout(() => modalChapterSearch.focus(), 60);
      }
      renderChapterModalGrid('');
    });
  }

  if (modalChapterSearch) {
    modalChapterSearch.addEventListener('input', (e) => {
      renderChapterModalGrid(e.target.value);
    });
  }

  // Toolbar Drawer Toggle
  if (toolbarDrawerBtn && readerSidebar) {
    toolbarDrawerBtn.addEventListener('click', () => {
      readerSidebar.classList.toggle('open');
    });
  }

  // Real-time Debounced Reading Scroll Tracker
  let scrollTrackTimeout = null;
  window.addEventListener('scroll', () => {
    if (scrollTrackTimeout) return;
    scrollTrackTimeout = setTimeout(() => {
      scrollTrackTimeout = null;
      if (!readerArticleEl) return;
      const rect = readerArticleEl.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // When user is reading inside or near article
      if (rect.top <= windowHeight && rect.bottom >= 0) {
        const articleHeight = readerArticleEl.offsetHeight;
        const currentScroll = window.scrollY || window.pageYOffset;
        const articleTop = readerArticleEl.offsetTop;
        const scrollOffset = currentScroll - articleTop;
        const maxScroll = articleHeight - windowHeight * 0.7;
        let pct = 0;
        if (maxScroll > 0) {
          pct = Math.round((scrollOffset / maxScroll) * 100);
        }
        pct = Math.max(0, Math.min(100, pct));
        const currentChapter = novelData.chapters[currentChapterIndex];
        if (currentChapter) {
          saveBookmark(currentChapter.id, pct);
        }
      }
    }, 150);
  }, { passive: true });

  // Load and Render Chapter
  function loadChapter(index, autoScroll = true) {
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

    // Update Toolbar Chapter Title Dropdown
    if (toolbarChapterTitle) {
      toolbarChapterTitle.textContent = `${chapter.title.slice(0, 15)} ▾`;
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

    // Reset bookmark for newly opened chapter
    saveBookmark(chapter.id, 0);

    // Scroll to reader top smoothly if requested
    if (autoScroll) {
      const readerSection = document.getElementById('reader');
      if (readerSection) {
        readerSection.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // TTS Synchronous Update: if playing, seamlessly start reading new chapter from start
    if (ttsState.isPlaying) {
      ttsState.currentParaIndex = 0;
      playParagraph(0);
    } else {
      ttsState.currentParaIndex = 0;
      updateTTSPlayerUI();
      readerArticleEl.querySelectorAll('.tts-reading-highlight').forEach(el => {
        el.classList.remove('tts-reading-highlight');
      });
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

  // Jump from Hero & Bookmark buttons
  if (quickReadBtn) {
    quickReadBtn.addEventListener('click', () => {
      loadChapter(currentChapterIndex);
      document.getElementById('reader')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
  if (heroContinueBtn) {
    heroContinueBtn.addEventListener('click', jumpToBookmark);
  }
  if (heroStartBtn) {
    heroStartBtn.addEventListener('click', () => {
      loadChapter(0);
      document.getElementById('reader')?.scrollIntoView({ behavior: 'smooth' });
      showToast('🚀 已开启第一章：铅灰雨夜与初啼');
    });
  }
  if (navBookmarkBtn) {
    navBookmarkBtn.addEventListener('click', jumpToBookmark);
  }
  if (floatingBookmarkJumpBtn) {
    floatingBookmarkJumpBtn.addEventListener('click', jumpToBookmark);
  }
  if (dismissBookmarkBtn && floatingBookmark) {
    dismissBookmarkBtn.addEventListener('click', () => {
      floatingBookmark.classList.add('hidden');
      showToast('记忆书签已最小化，可点击顶部导航栏书签随时唤起');
    });
  }

  // ==========================================
  // AI VOICE READ-ALOUD ENGINE (Web Speech API 智能朗读)
  // ==========================================

  // Chinese Voice Verification & Mobile Guard
  function isChineseVoice(v) {
    if (!v) return false;
    const lang = (v.lang || '').toLowerCase().replace(/_/g, '-');
    const name = (v.name || '').toLowerCase();
    return (
      lang.startsWith('zh') ||
      lang.startsWith('cmn') ||
      lang.includes('chinese') ||
      name.includes('chinese') ||
      name.includes('中文') ||
      name.includes('普通话') ||
      name.includes('国语') ||
      name.includes('华语') ||
      name.includes('taiwan') ||
      name.includes('mandarin') ||
      name.includes('cantonese') ||
      name.includes('xiaoxiao') ||
      name.includes('yunxi') ||
      name.includes('yunjian') ||
      name.includes('tingting') ||
      name.includes('yaoyao') ||
      name.includes('huihui') ||
      name.includes('kangkang') ||
      name.includes('sinji') ||
      name.includes('meijia')
    );
  }

  function isMaleVoice(v) {
    if (!v) return false;
    const n = (v.name + ' ' + (v.voiceURI || '')).toLowerCase();
    return (
      n.includes('yunxi') || n.includes('yunjian') || n.includes('yunyang') ||
      n.includes('kangkang') || n.includes('danny') || n.includes('male') ||
      n.includes('男') || n.includes('bo') || n.includes('guang') ||
      n.includes('yushu') || n.includes('limu') || n.includes('haoyu') ||
      n.includes('xiaoqiang')
    );
  }

  function isFemaleVoice(v) {
    if (!v) return false;
    const n = (v.name + ' ' + (v.voiceURI || '')).toLowerCase();
    return (
      n.includes('xiaoxiao') || n.includes('xiaoyi') || n.includes('yaoyao') ||
      n.includes('huihui') || n.includes('female') || n.includes('女') ||
      n.includes('tingting') || n.includes('meijia') || n.includes('sinji') ||
      n.includes('xiaoyan') || n.includes('goddess') || n.includes('siri') ||
      n.includes('xiaomeng') || n.includes('hiuga')
    );
  }

  function getVoiceRoleLabel(v) {
    if (isMaleVoice(v)) return '👑 沉稳男声 (奥尔多斯)';
    if (isFemaleVoice(v)) return '✨ 空灵女神 (神明娇妻)';
    if (isChineseVoice(v)) return '🎙️ 中文自然音';
    return '🌐 外语发音';
  }

  function getVoiceTypeLabel(v) {
    return v.localService ? '⚡ 本地系统' : '☁️ 高清在线';
  }

  // Populate system voices & classify into Male / Goddess / Full Settings List
  function initTTSVoices() {
    if (!ttsState.supported) {
      if (toolbarTtsBtn) toolbarTtsBtn.title = '当前浏览器暂不支持语音合成';
      renderSettingsVoiceList();
      return;
    }

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      if (!all || all.length === 0) return;
      ttsState.voices = all;

      // Filter Chinese voices
      const zhVoices = all.filter(isChineseVoice);

      // Categorize into Male (男声)
      ttsState.maleVoices = zhVoices.filter(isMaleVoice);

      // Categorize into Goddess / Female (女神音)
      ttsState.femaleVoices = zhVoices.filter(isFemaleVoice);

      // Populate voice select dropdown
      if (ttsVoiceSelect) {
        ttsVoiceSelect.innerHTML = `<option value="auto">🎙️ 自动最优系统声线</option>`;
        if (zhVoices.length === 0) {
          const opt = document.createElement('option');
          opt.value = 'system-native-zh';
          opt.textContent = '📱 移动端系统原生中文引擎 (标准普通话)';
          ttsVoiceSelect.appendChild(opt);
        } else {
          zhVoices.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.voiceURI || v.name;
            const isM = ttsState.maleVoices.includes(v);
            const isF = ttsState.femaleVoices.includes(v);
            const icon = isM ? '👑' : isF ? '✨' : '🎙️';
            opt.textContent = `${icon} ${v.name} (${v.lang})`;
            ttsVoiceSelect.appendChild(opt);
          });
        }

        if (ttsState.selectedVoiceURI && ttsState.selectedVoiceURI !== 'auto') {
          ttsVoiceSelect.value = ttsState.selectedVoiceURI;
        }
      }

      // Sync active button classes
      if (voiceMaleBtn) voiceMaleBtn.classList.toggle('active', ttsState.mode === 'male');
      if (voiceFemaleBtn) voiceFemaleBtn.classList.toggle('active', ttsState.mode === 'female');

      updateVoiceLabel();
      updateSettingsActiveBanner();
      renderSettingsVoiceList();
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  // Get active voice configuration (voice object, pitch, rate, lang)
  function getActiveVoiceConfig() {
    let chosenVoice = null;
    let pitch = ttsState.pitch || 1.0;
    let rate = ttsState.rate || 1.0;

    // 1. If user explicitly selected a voice in Settings
    if (ttsState.selectedVoiceURI && ttsState.selectedVoiceURI !== 'auto' && ttsState.selectedVoiceURI !== 'system-native-zh') {
      const match = ttsState.voices.find(v => (v.voiceURI || v.name) === ttsState.selectedVoiceURI);
      if (match) {
        chosenVoice = match;
      }
    }

    // 2. If no custom voice matched, fall back to male or goddess mode
    if (!chosenVoice) {
      const zhVoices = ttsState.voices.filter(isChineseVoice);
      if (ttsState.mode === 'female') {
        // Goddess mode: prioritize best natural female voice
        chosenVoice = ttsState.femaleVoices[0] ||
                      zhVoices.find(v => !ttsState.maleVoices.includes(v)) ||
                      zhVoices[0] ||
                      null;
        pitch = 1.15; // clear, sweet celestial pitch
      } else {
        // Male protagonist mode: prioritize best deep male voice
        chosenVoice = ttsState.maleVoices[0] ||
                      zhVoices.find(v => !ttsState.femaleVoices.includes(v)) ||
                      zhVoices[0] ||
                      null;
        pitch = 0.92; // deep, resonant lord protagonist pitch
      }
    }

    // Determine language tag
    let lang = 'zh-CN';
    if (chosenVoice && chosenVoice.lang) {
      lang = chosenVoice.lang.replace(/_/g, '-');
    }

    return {
      voice: chosenVoice,
      pitch,
      rate,
      lang
    };
  }

  // Update active voice banner in Settings Tab
  function updateSettingsActiveBanner() {
    if (!activeVoiceBadgeText || !activeVoiceDetailsText) return;

    const config = getActiveVoiceConfig();
    const voice = config.voice;
    let displayName = '👑 奥尔多斯·沉稳男声';
    if (voice) {
      displayName = `🎙️ ${voice.name}`;
    } else if (ttsState.mode === 'female') {
      displayName = '✨ 神明娇妻·空灵女神音';
    }

    activeVoiceBadgeText.textContent = `当前朗读声线：${displayName}`;

    const langText = config.lang || 'zh-CN';
    const rateText = `${ttsState.rate.toFixed(1)}x`;
    const pitchText = `${ttsState.pitch.toFixed(2)}`;
    const engineText = voice ? (voice.localService ? '本机系统引擎' : '云端高保真引擎') : '系统智能优选';

    activeVoiceDetailsText.textContent = `发音引擎: ${engineText} ｜ 语言代码: ${langText} ｜ 语速: ${rateText} ｜ 音调: ${pitchText}`;
  }

  // Update voice display title in player bar
  function updateVoiceLabel() {
    const config = getActiveVoiceConfig();
    let nameText = '👑 沉稳男声 (奥尔多斯)';
    if (ttsState.mode === 'female') {
      nameText = '✨ 空灵女神 (神明娇妻)';
    } else if (ttsState.mode === 'custom' && config.voice) {
      nameText = `🎙️ ${config.voice.name.slice(0, 16)}`;
    } else {
      if (config.voice && (config.voice.name.includes('Yunxi') || config.voice.name.includes('云希'))) {
        nameText = '👑 微软云希 (沉稳主角音)';
      } else if (config.voice && (config.voice.name.includes('Yunjian') || config.voice.name.includes('云健'))) {
        nameText = '👑 微软云健 (霸气主宰音)';
      } else if (!config.voice) {
        nameText = '👑 原生中文男声 (深沉基底)';
      }
    }

    if (ttsVoiceTitle) {
      ttsVoiceTitle.textContent = `声线：${nameText}`;
      ttsVoiceTitle.title = config.voice ? `${config.voice.name} (${config.voice.lang})` : `${nameText} (系统中文引擎)`;
    }
  }

  // Render Full Voice List in Settings Tab
  function renderSettingsVoiceList() {
    if (!settingsVoiceListContainer) return;

    if (!ttsState.supported) {
      settingsVoiceListContainer.innerHTML = `
        <div class="voice-empty-state">
          <p>⚠️ 当前浏览器暂不支持 SpeechSynthesis 语音合成引擎，推荐在移动端使用 Chrome 或 Safari 打开。</p>
        </div>
      `;
      return;
    }

    if (!ttsState.voices || ttsState.voices.length === 0) {
      settingsVoiceListContainer.innerHTML = `
        <div class="voice-loading-state">
          <div class="loading-spinner"></div>
          <p>正在检索手机系统发音人... 若长时间未列出，请点击任意位置激活浏览器音频授权。</p>
        </div>
      `;
      return;
    }

    // Filter by category
    let list = ttsState.voices.filter(v => {
      if (ttsState.activeFilter === 'all') return true;
      if (ttsState.activeFilter === 'chinese') return isChineseVoice(v);
      if (ttsState.activeFilter === 'male') return isMaleVoice(v);
      if (ttsState.activeFilter === 'female') return isFemaleVoice(v);
      if (ttsState.activeFilter === 'other') return !isChineseVoice(v);
      return true;
    });

    // Filter by search query
    if (ttsState.searchQuery) {
      const q = ttsState.searchQuery.toLowerCase();
      list = list.filter(v => {
        const name = (v.name || '').toLowerCase();
        const lang = (v.lang || '').toLowerCase();
        const role = getVoiceRoleLabel(v).toLowerCase();
        return name.includes(q) || lang.includes(q) || role.includes(q);
      });
    }

    // Update count badges
    if (countAll) countAll.textContent = ttsState.voices.length;
    if (countZh) countZh.textContent = ttsState.voices.filter(isChineseVoice).length;
    if (countMale) countMale.textContent = ttsState.voices.filter(isMaleVoice).length;
    if (countFemale) countFemale.textContent = ttsState.voices.filter(isFemaleVoice).length;
    if (countOther) countOther.textContent = ttsState.voices.filter(v => !isChineseVoice(v)).length;
    if (voiceTotalCountBadge) {
      voiceTotalCountBadge.textContent = `共 ${ttsState.voices.length} 个发音人 (当前显示 ${list.length})`;
    }

    if (list.length === 0) {
      settingsVoiceListContainer.innerHTML = `
        <div class="voice-empty-state">
          <p>🔍 没有找到匹配「${ttsState.searchQuery || ttsState.activeFilter}」的发音人，请尝试切换其他分类或重置搜索词。</p>
        </div>
      `;
      return;
    }

    settingsVoiceListContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();

    list.forEach(v => {
      const uri = v.voiceURI || v.name;
      const isSelected = uri === ttsState.selectedVoiceURI;
      const isPreviewing = uri === ttsState.previewPlayingVoiceURI;
      const roleLabel = getVoiceRoleLabel(v);
      const typeLabel = getVoiceTypeLabel(v);

      const card = document.createElement('div');
      card.className = `voice-card-item${isSelected ? ' selected' : ''}${isPreviewing ? ' previewing' : ''}`;
      card.dataset.uri = uri;

      card.innerHTML = `
        <div class="voice-card-top">
          <div class="voice-card-title-row">
            <div class="voice-card-name" title="${v.name}">${v.name}</div>
            ${isSelected ? '<span class="voice-active-tag">✓ 当前选用</span>' : ''}
          </div>
          <div class="voice-card-badges">
            <span class="voice-badge voice-badge-lang">${v.lang || '未知'}</span>
            <span class="voice-badge voice-badge-role">${roleLabel}</span>
            <span class="voice-badge voice-badge-type">${typeLabel}</span>
          </div>
        </div>
        <div class="voice-card-bottom">
          <div class="voice-card-actions">
            <button type="button" class="btn-card-preview${isPreviewing ? ' playing' : ''}" data-action="preview" data-uri="${uri}" title="试听该声线发音">
              ${isPreviewing
                ? '<span class="wave-mini"><span class="wave-mini-bar"></span><span class="wave-mini-bar"></span><span class="wave-mini-bar"></span></span> ⏹ 停止'
                : '<span>▶</span> 试听'
              }
            </button>
            <button type="button" class="btn-card-select" data-action="select" data-uri="${uri}" title="选择该发音人">
              ${isSelected ? '✓ 已选用' : '✓ 选择此声线'}
            </button>
          </div>
        </div>
      `;

      fragment.appendChild(card);
    });

    settingsVoiceListContainer.appendChild(fragment);
  }

  // Preview Voice Function (independent audio preview)
  function previewVoice(voiceURI, sampleText) {
    if (!ttsState.supported) {
      showToast('⚠️ 当前浏览器不支持语音合成，推荐使用 Chrome 或 Edge');
      return;
    }

    if (ttsState.previewPlayingVoiceURI === voiceURI) {
      window.speechSynthesis.cancel();
      ttsState.previewPlayingVoiceURI = null;
      updatePreviewButtonsUI();
      return;
    }

    window.speechSynthesis.cancel();
    if (ttsState.isPlaying) {
      ttsState.isPaused = true;
      updateTTSPlayerUI();
    }

    const targetVoice = ttsState.voices.find(v => (v.voiceURI || v.name) === voiceURI);
    const textToSpeak = cleanTextForSpeech(
      sampleText ||
      (voiceTestPhraseInput ? voiceTestPhraseInput.value : '') ||
      '奥尔多斯·冯·阿斯特雷亚，欢迎来到公爵府。弱水三千，唯爱八人。'
    );

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (targetVoice) {
      utterance.voice = targetVoice;
      utterance.lang = targetVoice.lang || 'zh-CN';
    } else {
      utterance.lang = 'zh-CN';
    }
    utterance.rate = ttsState.rate;
    utterance.pitch = ttsState.pitch;

    utterance.onstart = () => {
      ttsState.previewPlayingVoiceURI = voiceURI;
      updatePreviewButtonsUI();
    };

    utterance.onend = () => {
      ttsState.previewPlayingVoiceURI = null;
      updatePreviewButtonsUI();
    };

    utterance.onerror = () => {
      ttsState.previewPlayingVoiceURI = null;
      updatePreviewButtonsUI();
    };

    ttsState.previewUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  // Update preview buttons status across UI
  function updatePreviewButtonsUI() {
    if (testPlayCurrentVoiceBtn && testPlayMainIcon && testPlayMainText) {
      const isCurrentTesting = Boolean(ttsState.previewPlayingVoiceURI);
      if (isCurrentTesting) {
        testPlayMainIcon.textContent = '⏹';
        testPlayMainText.textContent = '停止试听';
        testPlayCurrentVoiceBtn.classList.add('playing');
      } else {
        testPlayMainIcon.textContent = '▶';
        testPlayMainText.textContent = '试听声线';
        testPlayCurrentVoiceBtn.classList.remove('playing');
      }
    }

    if (settingsVoiceListContainer) {
      settingsVoiceListContainer.querySelectorAll('.voice-card-item').forEach(card => {
        const uri = card.dataset.uri;
        const isPreviewing = uri === ttsState.previewPlayingVoiceURI;
        card.classList.toggle('previewing', isPreviewing);

        const pBtn = card.querySelector('.btn-card-preview');
        if (pBtn) {
          pBtn.classList.toggle('playing', isPreviewing);
          if (isPreviewing) {
            pBtn.innerHTML = '<span class="wave-mini"><span class="wave-mini-bar"></span><span class="wave-mini-bar"></span><span class="wave-mini-bar"></span></span> ⏹ 停止';
          } else {
            pBtn.innerHTML = '<span>▶</span> 试听';
          }
        }
      });
    }
  }

  // Select a voice from card
  function selectVoice(voiceURI) {
    ttsState.selectedVoiceURI = voiceURI;
    const match = ttsState.voices.find(v => (v.voiceURI || v.name) === voiceURI);

    if (settingsVoiceListContainer) {
      settingsVoiceListContainer.querySelectorAll('.voice-card-item').forEach(card => {
        const isSelected = card.dataset.uri === voiceURI;
        card.classList.toggle('selected', isSelected);
        const titleRow = card.querySelector('.voice-card-title-row');
        const activeTag = card.querySelector('.voice-active-tag');
        if (isSelected && !activeTag && titleRow) {
          const tag = document.createElement('span');
          tag.className = 'voice-active-tag';
          tag.textContent = '✓ 当前选用';
          titleRow.appendChild(tag);
        } else if (!isSelected && activeTag) {
          activeTag.remove();
        }

        const selBtn = card.querySelector('.btn-card-select');
        if (selBtn) {
          selBtn.textContent = isSelected ? '✓ 已选用' : '✓ 选择此声线';
        }
      });
    }

    if (ttsVoiceSelect && voiceURI) {
      ttsVoiceSelect.value = voiceURI;
    }

    updateSettingsActiveBanner();
    const voiceName = match ? match.name : voiceURI;
    showToast(`🎙️ 已选定：${voiceName}，点击「保存并应用声线」即可全面生效`);
  }

  // Save Voice Settings permanently
  function saveVoiceSettings() {
    localStorage.setItem('astrea_tts_voice_uri', ttsState.selectedVoiceURI);
    localStorage.setItem('astrea_tts_rate', ttsState.rate.toString());
    localStorage.setItem('astrea_tts_pitch', ttsState.pitch.toString());
    ttsState.mode = 'custom';
    localStorage.setItem('astrea_tts_mode', 'custom');

    if (voiceMaleBtn) voiceMaleBtn.classList.remove('active');
    if (voiceFemaleBtn) voiceFemaleBtn.classList.remove('active');

    updateSettingsActiveBanner();
    updateVoiceLabel();
    renderSettingsVoiceList();

    if (ttsState.isPlaying && !ttsState.isPaused) {
      playParagraph(ttsState.currentParaIndex);
    }

    const config = getActiveVoiceConfig();
    const voiceName = config.voice ? config.voice.name : '系统原生发音';
    showToast(`🎉 声线已成功保存！小说朗读将全面使用【${voiceName}】`);
  }

  // Update TTS Player UI widgets
  function updateTTSPlayerUI() {
    const chapter = novelData.chapters[currentChapterIndex];
    const totalParas = chapter?.paragraphs?.length || 0;

    // Visualizer playing animation
    if (ttsPlayerBar) {
      ttsPlayerBar.classList.toggle('playing', ttsState.isPlaying && !ttsState.isPaused);
    }

    // Play/Pause icon
    if (ttsPlayIcon) {
      ttsPlayIcon.textContent = (ttsState.isPlaying && !ttsState.isPaused) ? '⏸' : '▶';
    }

    // Status Badge
    if (ttsStatusBadge) {
      if (!ttsState.isPlaying) {
        ttsStatusBadge.textContent = '🎧 准备就绪';
        ttsStatusBadge.style.color = 'var(--gold-light)';
      } else if (ttsState.isPaused) {
        ttsStatusBadge.textContent = '⏸ 已暂停';
        ttsStatusBadge.style.color = 'var(--text-muted)';
      } else {
        ttsStatusBadge.textContent = '🔊 正在朗读';
        ttsStatusBadge.style.color = '#10b981';
      }
    }

    // Paragraph Count
    if (ttsParaCount) {
      ttsParaCount.textContent = `段落 ${ttsState.currentParaIndex + 1} / ${totalParas}`;
    }

    // Toolbar button text
    if (toolbarTtsLabel) {
      if (ttsState.isPlaying && !ttsState.isPaused) {
        toolbarTtsLabel.textContent = '朗读中...';
      } else if (ttsState.isPaused) {
        toolbarTtsLabel.textContent = '已暂停';
      } else {
        toolbarTtsLabel.textContent = '语音朗读';
      }
    }

    updateVoiceLabel();
  }

  // Strip markdown, HUD indicators, and emojis for smooth, natural audio speech
  function cleanTextForSpeech(text) {
    if (!text) return '';
    return text
      .replace(/^>\s*/gm, '')
      .replace(/^[#*>\-]+\s*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[【〔［]/g, '，')
      .replace(/[】〕］]/g, '，')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Highlight active reading paragraph with smooth center scroll
  function highlightParagraph(index) {
    if (!readerArticleEl) return;

    readerArticleEl.querySelectorAll('.tts-reading-highlight').forEach(el => {
      el.classList.remove('tts-reading-highlight');
    });

    const paragraphs = readerArticleEl.querySelectorAll('.reader-content > *');
    if (index >= 0 && index < paragraphs.length) {
      const activeEl = paragraphs[index];
      activeEl.classList.add('tts-reading-highlight');
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Play a specific paragraph
  function playParagraph(index) {
    if (!ttsState.supported) {
      showToast('⚠️ 当前浏览器不支持语音合成，推荐使用 Chrome 或 Edge');
      return;
    }

    const chapter = novelData.chapters[currentChapterIndex];
    if (!chapter || !chapter.paragraphs || chapter.paragraphs.length === 0) return;

    if (index < 0) index = 0;
    if (index >= chapter.paragraphs.length) {
      // Finished all paragraphs of current chapter!
      stopTTS();
      showToast('🎉 本章已全部朗读完毕！');
      if (currentChapterIndex < novelData.chapters.length - 1) {
        setTimeout(() => {
          showToast('即将自动进入下一章朗读...');
          loadChapter(currentChapterIndex + 1);
          setTimeout(() => startTTS(0), 500);
        }, 1500);
      }
      return;
    }

    ttsState.currentParaIndex = index;
    const rawPara = chapter.paragraphs[index];
    const speechText = cleanTextForSpeech(rawPara);

    // Cancel current synthesis
    window.speechSynthesis.cancel();

    // Skip empty or short symbol lines
    if (!speechText || speechText.length < 2) {
      playParagraph(index + 1);
      return;
    }

    const config = getActiveVoiceConfig();
    const utterance = new SpeechSynthesisUtterance(speechText);

    // If explicit voice is matched, set voice and its native language
    if (config.voice) {
      utterance.voice = config.voice;
      utterance.lang = config.voice.lang || config.lang || 'zh-CN';
    } else {
      utterance.lang = config.lang || 'zh-CN';
    }

    utterance.rate = config.rate;
    utterance.pitch = config.pitch;

    utterance.onstart = () => {
      ttsState.isPlaying = true;
      ttsState.isPaused = false;
      updateTTSPlayerUI();
      highlightParagraph(index);
    };

    utterance.onend = () => {
      if (ttsState.isPlaying && !ttsState.isPaused) {
        playParagraph(index + 1);
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        playParagraph(index + 1);
      }
    };

    ttsState.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  // Start TTS playback
  function startTTS(fromIndex = null) {
    if (fromIndex !== null) {
      ttsState.currentParaIndex = fromIndex;
    }
    if (ttsPlayerBar) ttsPlayerBar.classList.remove('hidden');
    if (toolbarTtsBtn) toolbarTtsBtn.classList.add('active');
    playParagraph(ttsState.currentParaIndex);
  }

  // Pause TTS
  function pauseTTS() {
    if (ttsState.isPlaying && !ttsState.isPaused) {
      window.speechSynthesis.pause();
      ttsState.isPaused = true;
      updateTTSPlayerUI();
    }
  }

  // Resume TTS
  function resumeTTS() {
    if (ttsState.isPaused) {
      window.speechSynthesis.resume();
      ttsState.isPaused = false;
      updateTTSPlayerUI();
    } else {
      playParagraph(ttsState.currentParaIndex);
    }
  }

  // Toggle Play / Pause
  function togglePlayPauseTTS() {
    if (!ttsState.isPlaying) {
      startTTS();
    } else if (ttsState.isPaused) {
      resumeTTS();
    } else {
      pauseTTS();
    }
  }

  // Stop TTS
  function stopTTS() {
    window.speechSynthesis.cancel();
    ttsState.isPlaying = false;
    ttsState.isPaused = false;
    ttsState.currentParaIndex = 0;
    updateTTSPlayerUI();

    if (readerArticleEl) {
      readerArticleEl.querySelectorAll('.tts-reading-highlight').forEach(el => {
        el.classList.remove('tts-reading-highlight');
      });
    }
    if (toolbarTtsBtn) {
      toolbarTtsBtn.classList.remove('active');
      toolbarTtsLabel.textContent = '语音朗读';
    }
  }

  // Next paragraph
  function nextParagraphTTS() {
    playParagraph(ttsState.currentParaIndex + 1);
  }

  // Prev paragraph
  function prevParagraphTTS() {
    playParagraph(Math.max(0, ttsState.currentParaIndex - 1));
  }

  // Set Voice Mode (male / female / custom)
  function setVoiceMode(mode) {
    ttsState.mode = mode;
    localStorage.setItem('astrea_tts_mode', mode);

    if (voiceMaleBtn) voiceMaleBtn.classList.toggle('active', mode === 'male');
    if (voiceFemaleBtn) voiceFemaleBtn.classList.toggle('active', mode === 'female');

    if (ttsVoiceSelect) {
      ttsVoiceSelect.value = 'auto';
      ttsState.selectedVoiceURI = 'auto';
      localStorage.setItem('astrea_tts_voice_uri', 'auto');
    }

    updateVoiceLabel();
    showToast(mode === 'male' ? '👑 已切换至【奥尔多斯·沉稳男声】' : '✨ 已切换至【神明娇妻·空灵女神音】');

    if (ttsState.isPlaying && !ttsState.isPaused) {
      playParagraph(ttsState.currentParaIndex);
    }
  }

  // Attach TTS Listeners
  if (toolbarTtsBtn) {
    toolbarTtsBtn.addEventListener('click', () => {
      if (ttsPlayerBar && ttsPlayerBar.classList.contains('hidden')) {
        ttsPlayerBar.classList.remove('hidden');
        startTTS();
        showToast('🎧 语音朗读播放器已开启，点击任意段落可直达朗读');
      } else {
        togglePlayPauseTTS();
      }
    });
  }

  if (ttsPlayPauseBtn) {
    ttsPlayPauseBtn.addEventListener('click', togglePlayPauseTTS);
  }

  if (ttsStopBtn) {
    ttsStopBtn.addEventListener('click', () => {
      stopTTS();
      showToast('⏹ 朗读已停止');
    });
  }

  if (ttsPrevParaBtn) ttsPrevParaBtn.addEventListener('click', prevParagraphTTS);
  if (ttsNextParaBtn) ttsNextParaBtn.addEventListener('click', nextParagraphTTS);

  if (voiceMaleBtn) {
    voiceMaleBtn.addEventListener('click', () => setVoiceMode('male'));
  }
  if (voiceFemaleBtn) {
    voiceFemaleBtn.addEventListener('click', () => setVoiceMode('female'));
  }

  if (ttsVoiceSelect) {
    ttsVoiceSelect.addEventListener('change', (e) => {
      ttsState.selectedVoiceURI = e.target.value;
      localStorage.setItem('astrea_tts_voice_uri', e.target.value);
      if (e.target.value === 'auto') {
        ttsState.mode = voiceMaleBtn && voiceMaleBtn.classList.contains('active') ? 'male' : 'female';
      } else {
        ttsState.mode = 'custom';
        if (voiceMaleBtn) voiceMaleBtn.classList.remove('active');
        if (voiceFemaleBtn) voiceFemaleBtn.classList.remove('active');
      }
      localStorage.setItem('astrea_tts_mode', ttsState.mode);
      updateVoiceLabel();
      showToast(`🎙️ 已切换发音人：${e.target.selectedOptions[0]?.text || e.target.value}`);
      if (ttsState.isPlaying && !ttsState.isPaused) {
        playParagraph(ttsState.currentParaIndex);
      }
    });
  }

  if (ttsRateSelect) {
    ttsRateSelect.value = ttsState.rate.toString();
    ttsRateSelect.addEventListener('change', (e) => {
      ttsState.rate = parseFloat(e.target.value);
      localStorage.setItem('astrea_tts_rate', ttsState.rate);
      showToast(`⏱️ 语速已设置为 ${ttsState.rate}x`);
      if (ttsState.isPlaying && !ttsState.isPaused) {
        playParagraph(ttsState.currentParaIndex);
      }
    });
  }

  if (ttsCloseBtn && ttsPlayerBar) {
    ttsCloseBtn.addEventListener('click', () => {
      stopTTS();
      ttsPlayerBar.classList.add('hidden');
      showToast('语音播放器已收起');
    });
  }

  // ==========================================
  // Settings Tab Event Listeners & Sliders
  // ==========================================
  if (settingsRateSlider) {
    settingsRateSlider.value = ttsState.rate.toString();
    const updateRateUI = () => {
      ttsState.rate = parseFloat(settingsRateSlider.value);
      if (rateValueBadge) rateValueBadge.textContent = `${ttsState.rate.toFixed(1)}x`;
      if (ttsRateSelect) ttsRateSelect.value = ttsState.rate.toString();
      updateSettingsActiveBanner();
    };
    settingsRateSlider.addEventListener('input', updateRateUI);
    settingsRateSlider.addEventListener('change', () => {
      localStorage.setItem('astrea_tts_rate', ttsState.rate.toString());
      if (ttsState.isPlaying && !ttsState.isPaused) {
        playParagraph(ttsState.currentParaIndex);
      }
    });
    updateRateUI();
  }

  if (settingsPitchSlider) {
    settingsPitchSlider.value = ttsState.pitch.toString();
    const updatePitchUI = () => {
      ttsState.pitch = parseFloat(settingsPitchSlider.value);
      if (pitchValueBadge) pitchValueBadge.textContent = `${ttsState.pitch.toFixed(2)}`;
      updateSettingsActiveBanner();
    };
    settingsPitchSlider.addEventListener('input', updatePitchUI);
    settingsPitchSlider.addEventListener('change', () => {
      localStorage.setItem('astrea_tts_pitch', ttsState.pitch.toString());
      if (ttsState.isPlaying && !ttsState.isPaused) {
        playParagraph(ttsState.currentParaIndex);
      }
    });
    updatePitchUI();
  }

  // Preset phrase chips
  document.querySelectorAll('.phrase-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.phrase-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (voiceTestPhraseInput) {
        voiceTestPhraseInput.value = chip.dataset.phrase || '';
      }
      if (ttsState.previewPlayingVoiceURI) {
        previewVoice(ttsState.previewPlayingVoiceURI, chip.dataset.phrase);
      }
    });
  });

  if (testPlayCurrentVoiceBtn) {
    testPlayCurrentVoiceBtn.addEventListener('click', () => {
      if (ttsState.previewPlayingVoiceURI) {
        window.speechSynthesis.cancel();
        ttsState.previewPlayingVoiceURI = null;
        updatePreviewButtonsUI();
      } else {
        const config = getActiveVoiceConfig();
        const targetURI = config.voice ? (config.voice.voiceURI || config.voice.name) : (ttsState.selectedVoiceURI || 'auto');
        previewVoice(targetURI, voiceTestPhraseInput ? voiceTestPhraseInput.value : '');
      }
    });
  }

  if (testStopBtn) {
    testStopBtn.addEventListener('click', () => {
      window.speechSynthesis.cancel();
      ttsState.previewPlayingVoiceURI = null;
      updatePreviewButtonsUI();
      showToast('⏹ 试听已停止');
    });
  }

  // Settings Voice Search
  if (settingsVoiceSearch) {
    settingsVoiceSearch.addEventListener('input', (e) => {
      ttsState.searchQuery = e.target.value.trim();
      if (clearVoiceSearchBtn) {
        clearVoiceSearchBtn.classList.toggle('hidden', !ttsState.searchQuery);
      }
      renderSettingsVoiceList();
    });
  }

  if (clearVoiceSearchBtn) {
    clearVoiceSearchBtn.addEventListener('click', () => {
      if (settingsVoiceSearch) settingsVoiceSearch.value = '';
      ttsState.searchQuery = '';
      clearVoiceSearchBtn.classList.add('hidden');
      renderSettingsVoiceList();
    });
  }

  // Voice Filter Chips
  document.querySelectorAll('.voice-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.voice-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ttsState.activeFilter = btn.dataset.filter || 'all';
      renderSettingsVoiceList();
    });
  });

  // Settings Save Button
  if (settingsSaveVoiceBtn) {
    settingsSaveVoiceBtn.addEventListener('click', saveVoiceSettings);
  }

  // Jump to Reader Button
  if (settingsJumpToReaderBtn) {
    settingsJumpToReaderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('reader')?.scrollIntoView({ behavior: 'smooth' });
      if (!ttsState.isPlaying || ttsState.isPaused) {
        setTimeout(() => {
          startTTS(ttsState.currentParaIndex);
        }, 400);
      }
      showToast('📖 已进入小说朗读模式，正在为您朗读！');
    });
  }

  // Delegate clicks on Voice Card Grid
  if (settingsVoiceListContainer) {
    settingsVoiceListContainer.addEventListener('click', (e) => {
      const previewBtn = e.target.closest('[data-action="preview"]');
      if (previewBtn) {
        e.stopPropagation();
        const uri = previewBtn.dataset.uri;
        previewVoice(uri);
        return;
      }

      const selectBtn = e.target.closest('[data-action="select"]');
      if (selectBtn) {
        e.stopPropagation();
        const uri = selectBtn.dataset.uri;
        selectVoice(uri);
        return;
      }

      const card = e.target.closest('.voice-card-item');
      if (card) {
        const uri = card.dataset.uri;
        selectVoice(uri);
      }
    });
  }

  // Click on any paragraph inside reader to jump-play that paragraph
  if (readerArticleEl) {
    readerArticleEl.addEventListener('click', (e) => {
      if (ttsPlayerBar && !ttsPlayerBar.classList.contains('hidden')) {
        const p = e.target.closest('.reader-content > *');
        if (p) {
          const paragraphs = Array.from(readerArticleEl.querySelectorAll('.reader-content > *'));
          const idx = paragraphs.indexOf(p);
          if (idx !== -1) {
            playParagraph(idx);
            showToast(`🎧 从第 ${idx + 1} 段开始朗读`);
          }
        }
      }
    });
  }

  // Keyboard shortcut listener for TTS
  window.addEventListener('keydown', (e) => {
    // Only trigger if TTS bar is visible and user is not typing in an input
    if (ttsPlayerBar && !ttsPlayerBar.classList.contains('hidden') && e.target.tagName !== 'INPUT') {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPauseTTS();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextParagraphTTS();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevParagraphTTS();
      }
    }
  });

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
  loadChapter(currentChapterIndex, false);
  const initialBookmark = getBookmark();
  updateBookmarkUI(initialBookmark.chapter, initialBookmark.scrollPct);
  initTTSVoices();

  renderCharacters();
  renderNineKids();
  renderSchedule();
  renderCgStoryboards();
});
