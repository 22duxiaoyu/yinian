const LEGACY_STORAGE_KEY = "yinian-lite-notes-v1";
const USERS_KEY = "yinian-lite-users-v1";
const ACTIVE_USER_KEY = "yinian-lite-active-user-v1";
const MIGRATED_KEY = "yinian-lite-legacy-migrated-v1";
const NOTES_PREFIX = "yinian-lite-notes-v2:";
const DEMO_USER = {
    id: "portfolio-demo",
    name: "作品集访客",
    passHash: "demo-space",
    createdAt: "2026-07-01T08:00:00.000Z",
};

const typeLabels = { idea: "灵感", diary: "观察", review: "复盘", task: "行动" };
const typeIcons = { idea: "i-spark", diary: "i-quote", review: "i-trend", task: "i-check" };
const viewLabels = { overview: "工作台", library: "输入库", insights: "洞察", actions: "行动", weekly: "周报", method: "产品方法" };

const state = {
    user: loadActiveUser(),
    notes: [],
    view: "overview",
    filter: "all",
    query: "",
    sort: "newest",
    editingId: null,
    selectedId: null,
    analyzing: false,
};

const el = {
    authScreen: document.querySelector("#authScreen"),
    authForm: document.querySelector("#authForm"),
    authName: document.querySelector("#authName"),
    authPasscode: document.querySelector("#authPasscode"),
    authMessage: document.querySelector("#authMessage"),
    demoButton: document.querySelector("#demoButton"),
    spaceName: document.querySelector("#spaceName"),
    activeUserName: document.querySelector("#activeUserName"),
    userInitial: document.querySelector("#userInitial"),
    profileButton: document.querySelector("#profileButton"),
    profileMenu: document.querySelector("#profileMenu"),
    logoutButton: document.querySelector("#logoutButton"),
    exportButton: document.querySelector("#exportNotes"),
    importInput: document.querySelector("#importNotes"),
    breadcrumbCurrent: document.querySelector("#breadcrumbCurrent"),
    sidebar: document.querySelector("#sidebar"),
    sidebarClose: document.querySelector("#sidebarClose"),
    mobileMenu: document.querySelector("#mobileMenu"),
    recentSignals: document.querySelector("#recentSignals"),
    overviewActions: document.querySelector("#overviewActions"),
    libraryList: document.querySelector("#libraryList"),
    librarySearch: document.querySelector("#librarySearch"),
    sortSelect: document.querySelector("#sortSelect"),
    filterTabs: document.querySelector("#filterTabs"),
    insightGrid: document.querySelector("#insightGrid"),
    assumptionTable: document.querySelector("#assumptionTable"),
    todoActions: document.querySelector("#todoActions"),
    doneActions: document.querySelector("#doneActions"),
    activityBars: document.querySelector("#activityBars"),
    railEvidenceList: document.querySelector("#railEvidenceList"),
    reasoningSteps: document.querySelector("#reasoningSteps"),
    captureModal: document.querySelector("#captureModal"),
    noteForm: document.querySelector("#noteForm"),
    noteTitle: document.querySelector("#noteTitle"),
    noteContent: document.querySelector("#noteContent"),
    noteTags: document.querySelector("#noteTags"),
    noteMood: document.querySelector("#noteMood"),
    captureTypes: document.querySelector("#captureTypes"),
    captureWordCount: document.querySelector("#captureWordCount"),
    captureTitle: document.querySelector("#captureTitle"),
    captureSubtitle: document.querySelector("#captureSubtitle"),
    captureSubmitLabel: document.querySelector("#captureSubmitLabel"),
    detailBackdrop: document.querySelector("#detailBackdrop"),
    detailDrawer: document.querySelector("#detailDrawer"),
    detailType: document.querySelector("#detailType"),
    detailBody: document.querySelector("#detailBody"),
    closeDetail: document.querySelector("#closeDetail"),
    commandPalette: document.querySelector("#commandPalette"),
    commandSearch: document.querySelector("#commandSearch"),
    commandResults: document.querySelector("#commandResults"),
    searchTrigger: document.querySelector("#searchTrigger"),
    toast: document.querySelector("#toast"),
    runAnalysis: document.querySelector("#runAnalysis"),
    aiStatusText: document.querySelector("#aiStatusText"),
    analysisTime: document.querySelector("#analysisTime"),
    aiQuestion: document.querySelector("#aiQuestion"),
    askAi: document.querySelector("#askAi"),
    railSuggestion: document.querySelector("#railSuggestion"),
    acceptSuggestion: document.querySelector("#acceptSuggestion"),
};

function loadUsers() {
    try {
        const value = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadActiveUser() {
    const id = localStorage.getItem(ACTIVE_USER_KEY);
    if (!id) return null;
    if (id === DEMO_USER.id) return DEMO_USER;
    return loadUsers().find((user) => user.id === id) || null;
}

function notesKey(userId) {
    return `${NOTES_PREFIX}${userId}`;
}

function createId() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function dateAt(daysAgo, hour = 9, minute = 30) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
}

function freshPortfolioNotes() {
    const seeds = [
        {
            title: "把作品集的第一步缩小到一屏",
            content: "今天没有继续补完整方案，只先写清楚首页第一屏要向面试官证明什么。15 分钟后结构就出来了，开始比想象中容易。",
            type: "task", mood: "清醒", tags: ["启动成本", "作品集", "最小行动"], done: true, days: 0, hour: 10,
        },
        {
            title: "开始前总想先搭好完整结构",
            content: "每次面对重要项目，我都会先设想一个很完整的系统。它看起来专业，但也让真正动手的时间不断推迟。",
            type: "diary", mood: "卡住", tags: ["启动成本", "完美主义", "节奏"], done: false, days: 0, hour: 8,
        },
        {
            title: "15 分钟版本让我真的开始了",
            content: "复盘：把任务改成“先完成一个能被看见的小结果”之后，我没有再纠结工具和结构，推进速度明显提高。",
            type: "review", mood: "开心", tags: ["启动成本", "行动反馈", "最小行动"], done: false, days: 1, hour: 21,
        },
        {
            title: "洞察必须和原始记录绑在一起",
            content: "AI 给出结论并不够。用户需要知道它从哪里来、哪些证据支持、哪里仍是推测，才敢把建议用于真实决策。",
            type: "idea", mood: "清醒", tags: ["可解释AI", "产品设计", "证据链"], done: false, days: 1, hour: 15,
        },
        {
            title: "作品不能只是页面好看",
            content: "面试官真正想看到的是产品判断：为什么做、AI 在哪里创造价值、用户保留什么权力，以及如何判断它是否有效。",
            type: "diary", mood: "清醒", tags: ["作品集", "产品判断", "AI产品"], done: false, days: 2, hour: 13,
        },
        {
            title: "写出 AI 与用户的角色边界",
            content: "明确模型负责聚类、引用和建议；用户负责确认语境、修改结论和决定是否进入行动。",
            type: "task", mood: "清醒", tags: ["AI产品", "作品集", "人机协作"], done: false, days: 2, hour: 9,
        },
        {
            title: "先做完整框架反而拖慢了",
            content: "昨天花了很久整理所有功能，最后没有可演示的结果。今天先完成一个关键流程，反馈来得更快。",
            type: "review", mood: "卡住", tags: ["启动成本", "节奏", "行动反馈"], done: false, days: 3, hour: 19,
        },
        {
            title: "周报应该是下一周的决策输入",
            content: "好的总结不是把发生过的事情重新排列，而是指出重复模式、尚未解决的张力，并提出一个可验证实验。",
            type: "idea", mood: "清醒", tags: ["产品设计", "周报", "决策"], done: false, days: 4, hour: 11,
        },
        {
            title: "完成核心用户路径草图",
            content: "从快速输入开始，到 AI 提炼洞察，再到用户确认并转成行动，最后用行动结果反哺下一轮分析。",
            type: "task", mood: "开心", tags: ["启动成本", "作品集", "最小行动"], done: true, days: 5, hour: 16,
        },
        {
            title: "信息越多，越难决定先做什么",
            content: "我并不缺想法，真正的负担是每个想法看起来都值得做。需要一个机制帮我看见反复出现的问题，而不是继续收集。",
            type: "diary", mood: "卡住", tags: ["决策负担", "启动成本", "信息过载"], done: false, days: 6, hour: 20,
        },
        {
            title: "录制 90 秒产品演示",
            content: "用一个真实场景讲清输入、洞察、证据和行动闭环，避免逐个介绍功能。",
            type: "task", mood: "清醒", tags: ["作品集", "行动", "表达"], done: false, days: 6, hour: 14,
        },
        {
            title: "减少计划时间，增加反馈时间",
            content: "上周最大的教训是把太多精力放在事前想象。下一轮要更早把东西放到真实的人面前。",
            type: "review", mood: "松弛", tags: ["启动成本", "行动反馈", "节奏"], done: false, days: 9, hour: 18,
        },
    ];

    return seeds.map((seed) => {
        const timestamp = dateAt(seed.days, seed.hour);
        return normalizeNote({
            id: createId(),
            title: seed.title,
            content: seed.content,
            type: seed.type,
            mood: seed.mood,
            tags: seed.tags,
            done: seed.done,
            pinned: false,
            archived: false,
            createdAt: timestamp,
            updatedAt: timestamp,
        });
    });
}

function normalizeNote(note) {
    const source = note && typeof note === "object" ? note : {};
    const now = new Date().toISOString();
    const createdAt = source.createdAt || now;
    return {
        id: String(source.id || createId()),
        title: String(source.title || "未命名输入"),
        content: String(source.content || ""),
        type: typeLabels[source.type] ? source.type : "idea",
        mood: ["清醒", "开心", "卡住", "松弛"].includes(source.mood) ? source.mood : "清醒",
        tags: Array.isArray(source.tags) ? source.tags.map(String).filter(Boolean).slice(0, 8) : [],
        done: Boolean(source.done),
        pinned: Boolean(source.pinned),
        archived: Boolean(source.archived),
        createdAt,
        updatedAt: source.updatedAt || createdAt,
    };
}

function isLegacySeedSpace(notes) {
    const oldTitles = new Set(["把一闪而过的想法留住", "晚间复盘模板"]);
    return notes.length > 0 && notes.length <= 2 && notes.every((note) => oldTitles.has(note.title));
}

function loadNotesForUser(userId) {
    const stored = localStorage.getItem(notesKey(userId));
    if (stored) {
        try {
            const notes = JSON.parse(stored);
            if (Array.isArray(notes)) {
                const normalized = notes.map(normalizeNote);
                return isLegacySeedSpace(normalized) ? freshPortfolioNotes() : normalized;
            }
        } catch {
            return freshPortfolioNotes();
        }
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && !localStorage.getItem(MIGRATED_KEY)) {
        try {
            const notes = JSON.parse(legacy);
            if (Array.isArray(notes) && notes.length > 2) {
                localStorage.setItem(MIGRATED_KEY, userId);
                return notes.map(normalizeNote);
            }
        } catch {
            localStorage.setItem(MIGRATED_KEY, userId);
        }
    }
    return freshPortfolioNotes();
}

function saveNotes() {
    if (!state.user) return;
    localStorage.setItem(notesKey(state.user.id), JSON.stringify(state.notes));
}

function setActiveUser(user) {
    state.user = user;
    if (user) {
        localStorage.setItem(ACTIVE_USER_KEY, user.id);
        state.notes = loadNotesForUser(user.id);
        saveNotes();
    } else {
        localStorage.removeItem(ACTIVE_USER_KEY);
        state.notes = [];
    }
    state.view = "overview";
    renderAuthState();
    renderAll();
}

async function hashPasscode(name, passcode) {
    const source = `${name.trim().toLowerCase()}:${passcode}`;
    if (crypto.subtle) {
        const bytes = new TextEncoder().encode(source);
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }
    let hash = 0;
    for (const character of source) {
        hash = (hash << 5) - hash + character.charCodeAt(0);
        hash |= 0;
    }
    return String(hash);
}

function normalizeTags(value) {
    return String(value || "").split(/[,，\s]+/).map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
}

function activeNotes() {
    return state.notes.filter((note) => !note.archived);
}

function isWithinDays(value, days) {
    const date = new Date(value);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    return date >= start;
}

function isInPreviousWeek(value) {
    const date = new Date(value);
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 13);
    const end = new Date(today);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 7);
    return date >= start && date <= end;
}

function getTagCounts() {
    const counts = new Map();
    activeNotes().filter((note) => isWithinDays(note.createdAt, 14)).forEach((note) => {
        note.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function getEvidence(topic) {
    const key = String(topic || "").toLowerCase();
    const matches = activeNotes().filter((note) => note.tags.some((tag) => tag.toLowerCase() === key) || `${note.title} ${note.content}`.toLowerCase().includes(key));
    return (matches.length ? matches : activeNotes()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function buildInsights() {
    const tags = getTagCounts();
    const topTopic = tags[0]?.[0] || "行动反馈";
    const evidence = getEvidence(topTopic);
    const stuck = activeNotes().filter((note) => note.mood === "卡住");
    const tasks = activeNotes().filter((note) => note.type === "task");
    const done = tasks.filter((note) => note.done);
    const confidence = Math.min(94, 68 + evidence.length * 3);
    const isStartTopic = topTopic === "启动成本" || evidence.some((note) => note.tags.includes("启动成本"));

    return [
        {
            id: "pattern",
            label: "行为模式",
            topic: topTopic,
            title: isStartTopic ? "你不是缺少计划，而是启动动作太大。" : `${topTopic} 已经成为你反复关注的核心主题。`,
            detail: isStartTopic ? "多条记录都指向同一个摩擦点：当任务需要先搭完整框架时，你更容易延迟开始。把第一步压缩到 15 分钟，完成率明显提高。" : `过去两周，“${topTopic}”在不同场景中重复出现。它可能不是偶发想法，而是当前最值得优先处理的议题。`,
            evidence: evidence.length,
            confidence,
            accent: "#18745e",
        },
        {
            id: "tension",
            label: "潜在张力",
            topic: "卡住",
            title: "质量要求与推进速度正在相互拉扯。",
            detail: stuck.length ? `有 ${stuck.length} 条记录提到“卡住”。它们大多出现在开始前，而不是执行中，说明问题更可能来自任务定义。` : "当前记录中的负向状态较少，但仍需要持续观察开始前的决策负担。",
            evidence: Math.max(stuck.length, 2),
            confidence: Math.min(88, 70 + stuck.length * 4),
            accent: "#c76b3d",
        },
        {
            id: "change",
            label: "正向变化",
            topic: "行动反馈",
            title: "行动结果开始取代事前推演。",
            detail: done.length ? `你已经完成 ${done.length} 个最小行动，并在复盘中记录了真实反馈。这个变化会让后续判断比单纯计划更可靠。` : "目前还缺少完成后的真实反馈。先完成一个最小行动，会让下一轮洞察更可靠。",
            evidence: Math.max(done.length + 1, 2),
            confidence: Math.min(91, 72 + done.length * 6),
            accent: "#4d67c6",
        },
    ];
}

function getFilteredNotes() {
    const query = state.query.trim().toLowerCase();
    return activeNotes().filter((note) => {
        if (state.filter !== "all" && note.type !== state.filter) return false;
        if (!query) return true;
        return `${note.title} ${note.content} ${note.tags.join(" ")}`.toLowerCase().includes(query);
    }).sort((a, b) => {
        if (state.sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
        if (state.sort === "longest") return b.content.length - a.content.length;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
}

function formatRelative(value) {
    const date = new Date(value);
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const days = Math.round((dayStart - targetStart) / 86400000);
    if (days === 0) return `今天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
    if (days === 1) return "昨天";
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

function summarize(value, max = 86) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > max ? `${text.slice(0, max)}…` : text;
}

function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function signalIcon(type) {
    return `<span class="signal-type ${type}"><svg><use href="#${typeIcons[type] || "i-file"}" /></svg></span>`;
}

function renderAuthState() {
    const locked = !state.user;
    document.body.classList.toggle("auth-locked", locked);
    el.authScreen.classList.toggle("hidden", !locked);
    el.authScreen.setAttribute("aria-hidden", String(!locked));
    if (locked) window.setTimeout(() => el.demoButton.focus(), 100);
}

function renderNavigation() {
    document.querySelectorAll("[data-view-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === state.view));
    document.querySelectorAll(".nav-item[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === state.view));
    el.breadcrumbCurrent.textContent = viewLabels[state.view] || "工作台";
    const notes = activeNotes();
    const tasks = notes.filter((note) => note.type === "task" && !note.done);
    document.querySelector("#navSignalCount").textContent = notes.length;
    document.querySelector("#navActionCount").textContent = tasks.length;
}

function renderUser() {
    const name = state.user?.name || "作品集访客";
    el.spaceName.textContent = state.user?.id === DEMO_USER.id ? "AI 产品经理作品集" : `${name}的思考空间`;
    el.activeUserName.textContent = name;
    el.userInitial.textContent = name.slice(0, 1).toUpperCase();
    document.querySelector("#greetingTitle").textContent = `${getGreeting()}，${name}。先看见真正重要的事。`;
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 11) return "早上好";
    if (hour < 18) return "下午好";
    return "晚上好";
}

function renderDates() {
    const now = new Date();
    document.querySelector("#todayLabel").textContent = `${now.getMonth() + 1} 月 ${now.getDate()} 日 · 今日思考现场`;
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    document.querySelector("#weeklyRange").textContent = `${start.getMonth() + 1} 月 ${start.getDate()} 日 - ${now.getMonth() + 1} 月 ${now.getDate()} 日`;
    document.querySelector("#weeklyDate").textContent = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
}

function renderOverview() {
    const notes = activeNotes();
    const week = notes.filter((note) => isWithinDays(note.createdAt, 7));
    const previous = notes.filter((note) => isInPreviousWeek(note.createdAt));
    const tasks = notes.filter((note) => note.type === "task");
    const done = tasks.filter((note) => note.done);
    const insights = buildInsights();
    const lead = insights[0];
    const conversion = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;

    document.querySelector("#heroInsight").textContent = lead.title;
    document.querySelector("#heroInsightDetail").textContent = lead.detail;
    document.querySelector("#heroConfidence").textContent = `${lead.confidence}%`;
    document.querySelector("#heroEvidence button span").textContent = `${lead.evidence} 条证据`;
    document.querySelector("#heroEvidence button").dataset.openEvidence = lead.topic;
    document.querySelector("#metricWeekSignals").textContent = week.length;
    document.querySelector("#metricWeekDelta").textContent = `${week.length - previous.length >= 0 ? "+" : ""}${week.length - previous.length} 较上周`;
    document.querySelector("#metricInsights").textContent = insights.length;
    document.querySelector("#metricConversion").textContent = `${conversion}%`;
    document.querySelector("#actionOpenCount").textContent = `${tasks.filter((note) => !note.done).length} 待处理`;
    document.querySelector("#reasonInputCount").textContent = `已读取 ${notes.length} 条有效记录`;

    renderActivityBars();
    renderRecentSignals();
    renderOverviewActions();
    renderRail(lead);
}

function renderActivityBars() {
    el.activityBars.innerHTML = "";
    const notes = activeNotes();
    const counts = Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));
        return notes.filter((note) => new Date(note.createdAt).toDateString() === date.toDateString()).length;
    });
    const max = Math.max(...counts, 1);
    counts.forEach((count, index) => {
        const bar = document.createElement("div");
        bar.style.setProperty("--height", `${18 + (count / max) * 44}px`);
        bar.classList.toggle("active", index === counts.length - 1 || count === max);
        bar.title = `${count} 条输入`;
        el.activityBars.append(bar);
    });
}

function renderRecentSignals() {
    const notes = [...activeNotes()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 4);
    el.recentSignals.innerHTML = notes.length ? notes.map((note, index) => `
        <article class="signal-row ${index === 1 ? "featured" : ""}" data-note-id="${escapeHtml(note.id)}">
            ${signalIcon(note.type)}
            <div class="signal-copy"><strong>${escapeHtml(note.title)}</strong><p>${escapeHtml(summarize(note.content))}</p></div>
            <div class="signal-meta"><span>${formatRelative(note.createdAt)}</span><em>${typeLabels[note.type]}</em></div>
        </article>`).join("") : `<div class="action-empty">还没有输入。先写下一条，洞察会从这里开始。</div>`;
}

function renderOverviewActions() {
    const tasks = activeNotes().filter((note) => note.type === "task").sort((a, b) => Number(a.done) - Number(b.done)).slice(0, 4);
    el.overviewActions.innerHTML = tasks.length ? tasks.map((note) => `
        <article class="action-row ${note.done ? "done" : ""}" data-note-id="${escapeHtml(note.id)}">
            <button class="action-check" data-toggle-task="${escapeHtml(note.id)}" type="button" aria-label="${note.done ? "标记未完成" : "标记完成"}"><svg><use href="#i-check" /></svg></button>
            <div><strong>${escapeHtml(note.title)}</strong><p>${note.done ? "已形成真实反馈" : escapeHtml(note.tags[0] ? `来自洞察：${note.tags[0]}` : "来自你的输入")}</p></div>
        </article>`).join("") : `<div class="action-empty">洞察还没有转成行动。</div>`;
}

function renderLibrary() {
    const notes = getFilteredNotes();
    document.querySelector("#libraryCount").textContent = `${notes.length} 条输入`;
    document.querySelector("#librarySummary").textContent = state.query ? `正在搜索“${state.query}”` : "原始表达永久保留，AI 只在上层增加理解";
    el.libraryList.innerHTML = notes.length ? notes.map((note) => `
        <article class="library-item" data-note-id="${escapeHtml(note.id)}">
            ${signalIcon(note.type)}
            <div class="library-copy"><strong>${escapeHtml(note.title)}</strong><p>${escapeHtml(summarize(note.content, 105))}</p></div>
            <div class="library-tags">${note.tags.slice(0, 3).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}</div>
            <time class="library-time">${formatRelative(note.createdAt)}</time>
        </article>`).join("") : `<div class="empty-panel"><div><svg><use href="#i-search" /></svg><p>没有找到匹配的输入</p></div></div>`;
}

function renderInsights() {
    const insights = buildInsights();
    const average = Math.round(insights.reduce((sum, item) => sum + item.confidence, 0) / insights.length);
    document.querySelector("#insightConsensus").textContent = insights[0].title;
    document.querySelector("#insightScore").textContent = average;
    document.querySelector(".confidence-ring").style.setProperty("--score", average);
    el.insightGrid.innerHTML = insights.map((insight, index) => `
        <article class="insight-card" style="--accent:${insight.accent}">
            <div class="insight-card-head"><span>0${index + 1} / ${insight.label}</span><em>${insight.confidence}% 可信</em></div>
            <h3>${escapeHtml(insight.title)}</h3>
            <p>${escapeHtml(insight.detail)}</p>
            <footer><button data-open-evidence="${escapeHtml(insight.topic)}" type="button">查看 ${insight.evidence} 条依据 →</button><span>AI 生成 · 待确认</span></footer>
        </article>`).join("");

    const assumptions = [
        ["任务拆分过大是延迟开始的主要原因", "需要再观察 3 天"],
        ["15 分钟最小行动能持续提高完成率", "已有初步证据"],
        ["每周一次提炼比实时提醒更少打扰", "尚未验证"],
    ];
    el.assumptionTable.innerHTML = assumptions.map(([title, status], index) => `
        <div class="assumption-row" data-assumption="${index}">
            <div><strong>${title}</strong><p>系统会根据后续输入持续更新判断。</p></div>
            <span class="assumption-status">${status}</span>
            <div class="assumption-actions"><button data-assumption-action="confirm" type="button">确认</button><button data-assumption-action="reject" type="button">驳回</button></div>
        </div>`).join("");
}

function renderActions() {
    const tasks = activeNotes().filter((note) => note.type === "task").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const todo = tasks.filter((note) => !note.done);
    const done = tasks.filter((note) => note.done);
    const percentage = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
    document.querySelector("#actionProgressValue").textContent = `${percentage}%`;
    document.querySelector("#actionProgressBar").style.width = `${percentage}%`;
    document.querySelector("#actionProgressCopy").textContent = percentage >= 60 ? "行动反馈已经开始形成稳定闭环。" : "再完成一个最小行动，让洞察获得真实反馈。";
    document.querySelector("#todoCount").textContent = todo.length;
    document.querySelector("#doneCount").textContent = done.length;
    el.todoActions.innerHTML = renderBoardCards(todo, false);
    el.doneActions.innerHTML = renderBoardCards(done, true);
}

function renderBoardCards(notes, done) {
    if (!notes.length) return `<div class="action-empty">${done ? "完成后的行动会沉淀在这里" : "暂时没有待处理行动"}</div>`;
    return notes.map((note) => `
        <article class="board-card ${done ? "done" : ""}" data-note-id="${escapeHtml(note.id)}">
            <button class="action-check" data-toggle-task="${escapeHtml(note.id)}" type="button" aria-label="${done ? "标记未完成" : "标记完成"}"><svg><use href="#i-check" /></svg></button>
            <div><strong>${escapeHtml(note.title)}</strong><p>${escapeHtml(summarize(note.content, 82))}</p><footer><span>${note.tags[0] ? `#${escapeHtml(note.tags[0])}` : "个人行动"}</span><time>${formatRelative(note.createdAt)}</time></footer></div>
        </article>`).join("");
}

function renderWeekly() {
    const notes = activeNotes();
    const week = notes.filter((note) => isWithinDays(note.createdAt, 7));
    const lead = buildInsights()[0];
    document.querySelector("#weeklyTheme").textContent = lead.topic === "启动成本" ? "从“把事情想清楚”转向“先做出一个可以验证的版本”。" : `本周最稳定的思考主线是“${lead.topic}”，它正在影响你的行动选择。`;
    document.querySelector("#weeklyRepeatTitle").textContent = lead.topic;
    document.querySelector("#weeklyRepeatCopy").textContent = lead.detail;
    document.querySelector("#weeklySourceCount").textContent = `基于 ${week.length} 条本周原始输入`;
}

function renderRail(lead = buildInsights()[0]) {
    const evidence = getEvidence(lead.topic).slice(0, 3);
    el.railEvidenceList.innerHTML = evidence.map((note) => `
        <article class="rail-evidence-item" data-note-id="${escapeHtml(note.id)}"><strong>${escapeHtml(note.title)}</strong><p>“${escapeHtml(summarize(note.content, 42))}”</p></article>`).join("");
}

function renderAll() {
    renderNavigation();
    renderUser();
    renderDates();
    renderOverview();
    renderLibrary();
    renderInsights();
    renderActions();
    renderWeekly();
}

function switchView(view) {
    if (!viewLabels[view]) return;
    state.view = view;
    renderNavigation();
    el.sidebar.classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function setCaptureType(type) {
    const next = typeLabels[type] ? type : "idea";
    el.captureTypes.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.type === next));
    el.noteForm.dataset.type = next;
    const placeholders = {
        idea: ["一个值得保留的想法", "这个想法是什么？为什么它值得继续想？"],
        diary: ["我注意到一个现象", "发生了什么？你当时有什么感受或判断？"],
        review: ["一次值得复盘的经历", "做成了什么？哪里卡住？下次会改变什么？"],
        task: ["一个可验证的下一步", "完成标准是什么？它要验证哪个判断？"],
    };
    el.noteTitle.placeholder = placeholders[next][0];
    el.noteContent.placeholder = placeholders[next][1];
}

function openCapture(type = "idea", note = null) {
    state.editingId = note?.id || null;
    el.noteTitle.value = note?.title || "";
    el.noteContent.value = note?.content || "";
    el.noteTags.value = note?.tags?.join(", ") || "";
    el.noteMood.value = note?.mood || "清醒";
    setCaptureType(note?.type || type || "idea");
    el.captureTitle.textContent = note ? "编辑输入" : "快速输入";
    el.captureSubtitle.textContent = note ? "修改会同步更新相关洞察。" : "先保留原话，整理交给之后。";
    el.captureSubmitLabel.textContent = note ? "保存修改" : "保存输入";
    updateWordCount();
    el.captureModal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => el.noteTitle.focus(), 80);
}

function closeCapture() {
    el.captureModal.hidden = true;
    document.body.classList.remove("modal-open");
    state.editingId = null;
    el.noteForm.reset();
    setCaptureType("idea");
}

function updateWordCount() {
    const count = el.noteContent.value.replace(/\s/g, "").length;
    el.captureWordCount.textContent = `${count} 字 · 仅保存在本机`;
}

function toggleTask(id) {
    const note = state.notes.find((item) => item.id === id && item.type === "task");
    if (!note) return;
    note.done = !note.done;
    note.updatedAt = new Date().toISOString();
    saveNotes();
    renderAll();
    showToast(note.done ? "行动已完成，结果已进入下一轮分析" : "行动已恢复为待处理");
}

function openNoteDetail(id) {
    const note = state.notes.find((item) => item.id === id);
    if (!note) return;
    state.selectedId = id;
    el.detailType.textContent = `原始输入 / ${typeLabels[note.type]}`;
    const insight = note.tags.includes("启动成本") ? "这条记录支持“启动动作大小影响推进速度”的判断。它描述的是实际行为，而不只是抽象观点，因此证据强度较高。" : `这条输入与“${note.tags[0] || "个人节奏"}”主题有关。当前只作为关联信号保留，不会被直接推断为结论。`;
    el.detailBody.innerHTML = `
        <h2>${escapeHtml(note.title)}</h2>
        <div class="detail-meta"><span>${typeLabels[note.type]}</span><span>${escapeHtml(note.mood)}</span><span>${formatRelative(note.createdAt)}</span>${note.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="detail-content">${escapeHtml(note.content)}</div>
        <div class="detail-divider"></div>
        <section class="detail-ai"><span>AI 关联判断</span><p>${escapeHtml(insight)}</p></section>
        <div class="detail-actions"><button data-detail-action="edit" type="button"><svg><use href="#i-edit" /></svg>编辑</button>${note.type === "task" ? `<button data-toggle-task="${escapeHtml(note.id)}" type="button"><svg><use href="#i-check" /></svg>${note.done ? "恢复行动" : "标记完成"}</button>` : ""}<button class="danger" data-detail-action="delete" type="button"><svg><use href="#i-trash" /></svg>删除</button></div>`;
    showDetailDrawer();
}

function openEvidence(topic) {
    const notes = getEvidence(topic);
    el.detailType.textContent = "洞察证据链";
    el.detailBody.innerHTML = `
        <h2>“${escapeHtml(topic)}”的依据</h2>
        <div class="detail-meta"><span>${notes.length} 条相关输入</span><span>过去 14 天</span><span>可追溯</span></div>
        <div class="detail-content">系统只展示与你原始表达直接相关的记录。你可以逐条检查语境，再决定是否接受这条洞察。</div>
        <div class="detail-divider"></div>
        <div class="evidence-detail-list">${notes.map((note) => `<article class="rail-evidence-item" data-note-id="${escapeHtml(note.id)}"><strong>${escapeHtml(note.title)}</strong><p>“${escapeHtml(summarize(note.content, 72))}”</p></article>`).join("")}</div>`;
    showDetailDrawer();
}

function showDetailDrawer() {
    el.detailBackdrop.hidden = false;
    el.detailDrawer.classList.add("open");
    el.detailDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeDetailDrawer() {
    el.detailDrawer.classList.remove("open");
    el.detailDrawer.setAttribute("aria-hidden", "true");
    el.detailBackdrop.hidden = true;
    document.body.classList.remove("modal-open");
    state.selectedId = null;
}

function openCommandPalette() {
    el.commandPalette.hidden = false;
    document.body.classList.add("modal-open");
    el.commandSearch.value = "";
    renderCommandResults("");
    window.setTimeout(() => el.commandSearch.focus(), 60);
}

function closeCommandPalette() {
    el.commandPalette.hidden = true;
    document.body.classList.remove("modal-open");
}

function renderCommandResults(query) {
    const value = query.trim().toLowerCase();
    if (!value) {
        const destinations = [["overview", "工作台", "回到今日思考现场"], ["insights", "洞察", "查看 AI 提炼的模式"], ["actions", "行动", "跟进已经确认的下一步"], ["method", "产品方法", "查看完整 AI 产品决策"]];
        el.commandResults.innerHTML = destinations.map(([view, title, detail]) => `<button class="command-result" data-command-view="${view}" type="button">${signalIcon(view === "insights" ? "idea" : view === "actions" ? "task" : "review")}<span><strong>${title}</strong><small>${detail}</small></span><em>前往</em></button>`).join("");
        return;
    }
    const results = activeNotes().filter((note) => `${note.title} ${note.content} ${note.tags.join(" ")}`.toLowerCase().includes(value)).slice(0, 8);
    el.commandResults.innerHTML = results.length ? results.map((note) => `<button class="command-result" data-note-id="${escapeHtml(note.id)}" type="button">${signalIcon(note.type)}<span><strong>${escapeHtml(note.title)}</strong><small>${escapeHtml(summarize(note.content, 58))}</small></span><em>${typeLabels[note.type]}</em></button>`).join("") : `<div class="command-empty">没有找到相关内容</div>`;
}

function showToast(message) {
    window.clearTimeout(showToast.timer);
    el.toast.textContent = message;
    el.toast.classList.add("show");
    showToast.timer = window.setTimeout(() => el.toast.classList.remove("show"), 2200);
}

function delay(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function runAnalysis() {
    if (state.analyzing) return;
    state.analyzing = true;
    const buttons = document.querySelectorAll("#runAnalysis, [data-run-analysis]");
    buttons.forEach((button) => {
        button.disabled = true;
        const label = button.querySelector("span");
        if (label) label.textContent = "正在分析";
    });
    el.aiStatusText.textContent = "正在理解最近输入";
    el.reasoningSteps.classList.add("analyzing");
    const steps = [...el.reasoningSteps.children];
    for (const step of steps) {
        steps.forEach((item) => item.classList.remove("active"));
        step.classList.add("active");
        await delay(620);
    }
    el.reasoningSteps.classList.remove("analyzing");
    steps.forEach((item) => item.classList.remove("active"));
    el.aiStatusText.textContent = "已更新当前空间";
    el.analysisTime.textContent = "刚刚";
    renderAll();
    buttons.forEach((button) => {
        button.disabled = false;
        const label = button.querySelector("span");
        if (label) label.textContent = button.id === "runAnalysis" ? "生成今日洞察" : "重新分析";
    });
    state.analyzing = false;
    showToast("分析完成：已更新 3 条洞察和证据链");
}

async function askAi() {
    const question = el.aiQuestion.value.trim();
    if (!question) {
        el.aiQuestion.focus();
        return;
    }
    el.askAi.disabled = true;
    el.aiStatusText.textContent = "正在回看原始记录";
    await delay(700);
    const response = question.includes("为什么")
        ? "因为“计划完整”和“推迟开始”在 4 条记录中共同出现，而两次完成都发生在任务被缩小之后。"
        : question.includes("下一步")
          ? "先写出一个 15 分钟内可以完成的版本，并记录实际开始时间。连续观察 3 天后再判断。"
          : "现有证据更支持“先缩小动作再观察”，但样本仍少。建议把它当作待验证假设，而不是确定结论。";
    el.railSuggestion.textContent = response;
    el.aiQuestion.value = "";
    el.aiStatusText.textContent = "回答已引用当前空间";
    el.askAi.disabled = false;
}

function createSuggestedAction() {
    const title = "先写出第一屏要证明什么";
    if (activeNotes().some((note) => note.type === "task" && note.title === title && !note.done)) {
        showToast("这条行动已经在待处理列表中");
        switchView("actions");
        return;
    }
    const now = new Date().toISOString();
    state.notes.unshift(normalizeNote({ id: createId(), title, content: "用 15 分钟写清目标用户、核心问题和这一屏要证明的产品判断。", type: "task", mood: "清醒", tags: ["启动成本", "AI建议"], done: false, createdAt: now, updatedAt: now }));
    saveNotes();
    renderAll();
    switchView("actions");
    showToast("AI 建议已转成行动，你仍可随时修改");
}

function deleteNote(id) {
    const note = state.notes.find((item) => item.id === id);
    if (!note || !window.confirm(`确认删除“${note.title}”吗？`)) return;
    state.notes = state.notes.filter((item) => item.id !== id);
    saveNotes();
    closeDetailDrawer();
    renderAll();
    showToast("输入已删除，相关洞察已重新计算");
}

function setAuthMessage(message, error = false) {
    el.authMessage.textContent = message;
    el.authMessage.classList.toggle("error", error);
}

el.demoButton.addEventListener("click", () => setActiveUser(DEMO_USER));

el.authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = el.authName.value.trim().replace(/\s+/g, " ");
    const passcode = el.authPasscode.value.trim();
    if (name.length < 2 || passcode.length < 4) {
        setAuthMessage("用户名至少 2 个字符，访问码至少 4 位。", true);
        return;
    }
    const users = loadUsers();
    const existing = users.find((user) => user.name.toLowerCase() === name.toLowerCase());
    const passHash = await hashPasscode(name, passcode);
    if (existing && existing.passHash !== passHash) {
        setAuthMessage("访问码不正确，请重新输入。", true);
        return;
    }
    const user = existing || { id: createId(), name, passHash, createdAt: new Date().toISOString() };
    if (!existing) {
        users.push(user);
        saveUsers(users);
    }
    el.authForm.reset();
    setAuthMessage("首次登录会在本机创建独立空间，数据不会上传。");
    setActiveUser(user);
});

document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
document.querySelectorAll("[data-view-link]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); switchView(link.dataset.viewLink); }));
document.querySelectorAll("[data-view-jump]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.viewJump)));
document.querySelector("#openWeekly").addEventListener("click", () => switchView("weekly"));
document.querySelector("#quickCapture").addEventListener("click", () => openCapture());
document.querySelectorAll("[data-open-capture]").forEach((button) => button.addEventListener("click", () => openCapture(button.dataset.openCapture || "idea")));
document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeCapture));
el.captureModal.addEventListener("click", (event) => { if (event.target === el.captureModal) closeCapture(); });
el.captureTypes.addEventListener("click", (event) => { const button = event.target.closest("button[data-type]"); if (button) setCaptureType(button.dataset.type); });
el.noteContent.addEventListener("input", updateWordCount);

el.noteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const wasEditing = Boolean(state.editingId);
    const content = el.noteContent.value.trim();
    if (!content) {
        showToast("先写下一点真实内容");
        el.noteContent.focus();
        return;
    }
    const now = new Date().toISOString();
    const payload = {
        title: el.noteTitle.value.trim() || "未命名输入",
        content,
        type: el.noteForm.dataset.type || "idea",
        mood: el.noteMood.value,
        tags: normalizeTags(el.noteTags.value),
        updatedAt: now,
    };
    if (state.editingId) {
        const note = state.notes.find((item) => item.id === state.editingId);
        if (note) Object.assign(note, payload);
    } else {
        state.notes.unshift(normalizeNote({ id: createId(), ...payload, createdAt: now, done: false }));
    }
    saveNotes();
    closeCapture();
    renderAll();
    showToast(wasEditing ? "修改已保存，洞察会随之更新" : "输入已保存，已进入下一轮分析");
});

el.filterTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    state.filter = button.dataset.filter;
    el.filterTabs.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
    renderLibrary();
});
el.librarySearch.addEventListener("input", () => { state.query = el.librarySearch.value; renderLibrary(); });
el.sortSelect.addEventListener("change", () => { state.sort = el.sortSelect.value; renderLibrary(); });

document.addEventListener("click", (event) => {
    const evidence = event.target.closest("[data-open-evidence]");
    if (evidence) {
        openEvidence(evidence.dataset.openEvidence);
        return;
    }
    const toggle = event.target.closest("[data-toggle-task]");
    if (toggle) {
        event.stopPropagation();
        toggleTask(toggle.dataset.toggleTask);
        return;
    }
    const noteTarget = event.target.closest("[data-note-id]");
    if (noteTarget) openNoteDetail(noteTarget.dataset.noteId);
});

el.insightGrid.addEventListener("click", () => {});
el.assumptionTable.addEventListener("click", (event) => {
    const action = event.target.closest("[data-assumption-action]");
    if (!action) return;
    const row = action.closest(".assumption-row");
    const status = row.querySelector(".assumption-status");
    status.textContent = action.dataset.assumptionAction === "confirm" ? "已由你确认" : "已驳回 · 不再使用";
    status.style.color = action.dataset.assumptionAction === "confirm" ? "var(--green)" : "var(--rose)";
    row.querySelectorAll("button").forEach((button) => button.disabled = true);
    showToast(action.dataset.assumptionAction === "confirm" ? "假设已确认，将进入后续观察" : "假设已驳回，AI 将降低相关权重");
});

el.closeDetail.addEventListener("click", closeDetailDrawer);
el.detailBackdrop.addEventListener("click", closeDetailDrawer);
el.detailBody.addEventListener("click", (event) => {
    const action = event.target.closest("[data-detail-action]");
    if (!action || !state.selectedId) return;
    const note = state.notes.find((item) => item.id === state.selectedId);
    if (!note) return;
    if (action.dataset.detailAction === "edit") {
        closeDetailDrawer();
        openCapture(note.type, note);
    }
    if (action.dataset.detailAction === "delete") deleteNote(note.id);
});

el.searchTrigger.addEventListener("click", openCommandPalette);
el.commandPalette.addEventListener("click", (event) => { if (event.target === el.commandPalette) closeCommandPalette(); });
el.commandSearch.addEventListener("input", () => renderCommandResults(el.commandSearch.value));
el.commandResults.addEventListener("click", (event) => {
    const view = event.target.closest("[data-command-view]");
    if (view) { closeCommandPalette(); switchView(view.dataset.commandView); }
    const note = event.target.closest("[data-note-id]");
    if (note) {
        event.stopPropagation();
        closeCommandPalette();
        openNoteDetail(note.dataset.noteId);
    }
});

document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommandPalette();
    }
    if (event.key === "Escape") {
        if (!el.commandPalette.hidden) closeCommandPalette();
        else if (el.detailDrawer.classList.contains("open")) closeDetailDrawer();
        else if (!el.captureModal.hidden) closeCapture();
        else el.sidebar.classList.remove("open");
    }
});

el.runAnalysis.addEventListener("click", runAnalysis);
document.querySelectorAll("[data-run-analysis]").forEach((button) => button.addEventListener("click", runAnalysis));
el.askAi.addEventListener("click", askAi);
el.aiQuestion.addEventListener("keydown", (event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") askAi(); });
el.acceptSuggestion.addEventListener("click", createSuggestedAction);

el.profileButton.addEventListener("click", (event) => {
    event.stopPropagation();
    el.profileMenu.hidden = !el.profileMenu.hidden;
});
document.addEventListener("click", (event) => { if (!event.target.closest(".profile-row")) el.profileMenu.hidden = true; });
document.querySelector("#workspaceSwitcher").addEventListener("click", () => showToast("当前为个人本地空间，多工作区将在云端版本开放"));
el.logoutButton.addEventListener("click", () => { el.profileMenu.hidden = true; setActiveUser(null); });

el.exportButton.addEventListener("click", () => {
    const payload = JSON.stringify({ product: "一念", version: 3, exportedAt: new Date().toISOString(), notes: state.notes }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `yinian-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    el.profileMenu.hidden = true;
    showToast("数据已导出");
});

el.importInput.addEventListener("change", async () => {
    const file = el.importInput.files?.[0];
    if (!file) return;
    try {
        const data = JSON.parse(await file.text());
        const imported = Array.isArray(data) ? data : data.notes;
        if (!Array.isArray(imported)) throw new Error("invalid");
        state.notes = imported.map(normalizeNote);
        saveNotes();
        renderAll();
        showToast(`已导入 ${state.notes.length} 条输入`);
    } catch {
        showToast("导入失败，请选择一念导出的 JSON 文件");
    } finally {
        el.importInput.value = "";
        el.profileMenu.hidden = true;
    }
});

el.mobileMenu.addEventListener("click", () => el.sidebar.classList.add("open"));
el.sidebarClose.addEventListener("click", () => el.sidebar.classList.remove("open"));

const focusBoard = document.querySelector(".focus-board");
focusBoard.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = focusBoard.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12;
    focusBoard.style.setProperty("--board-x", `${x.toFixed(2)}px`);
    focusBoard.style.setProperty("--board-y", `${y.toFixed(2)}px`);
});
focusBoard.addEventListener("pointerleave", () => {
    focusBoard.style.setProperty("--board-x", "0px");
    focusBoard.style.setProperty("--board-y", "0px");
});

document.querySelector("#copyWeekly").addEventListener("click", async () => {
    const report = `一念本周思考简报\n\n本周主线：${document.querySelector("#weeklyTheme").textContent}\n\n重复出现：${document.querySelector("#weeklyRepeatTitle").textContent}\n${document.querySelector("#weeklyRepeatCopy").textContent}\n\n下周实验：所有大任务先写 15 分钟版本。`;
    try {
        await navigator.clipboard.writeText(report);
        showToast("本周简报已复制");
    } catch {
        showToast("浏览器未允许复制，请稍后重试");
    }
});

if (state.user) {
    state.notes = loadNotesForUser(state.user.id);
    saveNotes();
}
renderAuthState();
renderAll();
