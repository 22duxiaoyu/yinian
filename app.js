const LEGACY_STORAGE_KEY = "yinian-lite-notes-v1";
const USERS_KEY = "yinian-lite-users-v1";
const ACTIVE_USER_KEY = "yinian-lite-active-user-v1";
const MIGRATED_KEY = "yinian-lite-legacy-migrated-v1";
const NOTES_PREFIX = "yinian-lite-notes-v2:";
const DOCUMENTS_PREFIX = "action-imported-documents-v1:";
const DEMO_USER = {
    id: "portfolio-demo",
    name: "作品集访客",
    passHash: "demo-space",
    createdAt: "2026-07-01T08:00:00.000Z",
};

const typeLabels = { idea: "灵感", diary: "观察", review: "复盘", task: "行动" };
const typeIcons = { idea: "i-spark", diary: "i-quote", review: "i-trend", task: "i-check" };
const viewLabels = { overview: "工作台", library: "灵感库", insights: "洞察", actions: "行动", weekly: "周报", method: "产品方法" };

const state = {
    user: loadActiveUser(),
    notes: [],
    documents: [],
    view: "overview",
    filter: "all",
    query: "",
    sort: "newest",
    editingId: null,
    selectedId: null,
    flashTaskId: null,
    expandedLibraryCardId: null,
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
    focusTaskTitle: document.querySelector("#focusTaskTitle"),
    focusTaskDetail: document.querySelector("#focusTaskDetail"),
    focusTaskMeta: document.querySelector("#focusTaskMeta"),
    focusTaskStatus: document.querySelector("#focusTaskStatus"),
    focusTaskOpen: document.querySelector("#focusTaskOpen"),
    focusTaskComplete: document.querySelector("#focusTaskComplete"),
    workbenchInsightEvidence: document.querySelector("#workbenchInsightEvidence"),
    libraryList: document.querySelector("#libraryList"),
    documentImportInput: document.querySelector("#documentImportInput"),
    librarySearch: document.querySelector("#librarySearch"),
    sortSelect: document.querySelector("#sortSelect"),
    filterTabs: document.querySelector("#filterTabs"),
    insightGrid: document.querySelector("#insightGrid"),
    assumptionTable: document.querySelector("#assumptionTable"),
    todoActions: document.querySelector("#todoActions"),
    doneActions: document.querySelector("#doneActions"),
    aiTrigger: document.querySelector("#aiTrigger"),
    aiRail: document.querySelector("#aiRail"),
    aiRailBackdrop: document.querySelector("#aiRailBackdrop"),
    railClose: document.querySelector("#railClose"),
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
    detailTaskToggle: document.querySelector("#detailTaskToggle"),
    closeDetail: document.querySelector("#closeDetail"),
    commandPalette: document.querySelector("#commandPalette"),
    commandSearch: document.querySelector("#commandSearch"),
    commandResults: document.querySelector("#commandResults"),
    searchTrigger: document.querySelector("#searchTrigger"),
    toast: document.querySelector("#toast"),
    operationFeedback: document.querySelector("#operationFeedback"),
    operationFeedbackText: document.querySelector("#operationFeedbackText"),
    analysisOverlay: document.querySelector("#analysisOverlay"),
    analysisOverlayTitle: document.querySelector("#analysisOverlayTitle"),
    analysisOverlayDetail: document.querySelector("#analysisOverlayDetail"),
    analysisProgressBar: document.querySelector("#analysisProgressBar"),
    analysisStageDots: document.querySelector("#analysisStageDots"),
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

function documentsKey(userId) {
    return `${DOCUMENTS_PREFIX}${userId}`;
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

function freshDocumentImports() {
    const samples = [
        {
            id: "sample-product-prd",
            name: "AI 产品作品集 PRD.docx",
            kind: "Word",
            size: 286000,
            status: "sample",
            summary: "围绕 AI PM 面试作品集，梳理目标用户、核心问题、AI 边界和验证路径，适合作为产品叙事主线。",
            keywords: ["作品集", "AI产品", "用户路径", "验证"],
            parsedAt: dateAt(0, 11, 20),
            cards: [
                { label: "摘要", title: "作品不只展示功能", body: "重点证明你能定义问题、拆用户路径、判断 AI 能力边界，而不是堆页面。" },
                { label: "主题", title: "AI 与用户共同决策", body: "模型负责聚类和建议，用户保留语境、判断和最终行动权。" },
                { label: "行动", title: "补一条可验证指标", body: "把“看起来高级”改成可衡量的周行动转化率、证据打开率和驳回率。" },
            ],
        },
        {
            id: "sample-research-pdf",
            name: "高信息密度人群调研摘要.pdf",
            kind: "PDF",
            size: 514000,
            status: "sample",
            summary: "资料显示，用户不是缺记录工具，而是缺少从长期输入中看见重复模式并形成下一步的机制。",
            keywords: ["用户研究", "信息过载", "重复模式", "行动"],
            parsedAt: dateAt(1, 16, 10),
            cards: [
                { label: "证据", title: "信息越多越难开始", body: "多个访谈对象提到，收集越充分，越难决定先推进哪一件事。" },
                { label: "机会", title: "把输入转成决策资产", body: "产品价值不在记录本身，而在周期性整理和可解释建议。" },
                { label: "风险", title: "避免 AI 过度推断", body: "每条洞察都需要证据入口和用户确认，否则容易失去信任。" },
            ],
        },
        {
            id: "sample-interview-doc",
            name: "面试演示脚本.docx",
            kind: "Word",
            size: 178000,
            status: "sample",
            summary: "90 秒讲清一个真实场景：输入灵感、生成洞察、追溯证据、转成行动，并说明如何衡量产品是否有效。",
            keywords: ["演示", "叙事", "证据链", "闭环"],
            parsedAt: dateAt(2, 9, 45),
            cards: [
                { label: "开场", title: "从真实焦虑进入", body: "我不是缺想法，而是想法太多，导致重要项目迟迟不开工。" },
                { label: "流程", title: "输入到行动的闭环", body: "保留原话，AI 提炼模式，用户确认判断，再把洞察变成最小行动。" },
                { label: "价值", title: "展示 AI PM 判断力", body: "这个作品展示的是用户路径、AI 边界、证据可信度和交付阶段设计。" },
            ],
        },
    ];
    return samples.map(normalizeDocumentImport);
}

function normalizeDocumentImport(document) {
    const source = document && typeof document === "object" ? document : {};
    const now = new Date().toISOString();
    const cards = Array.isArray(source.cards) ? source.cards : [];
    return {
        id: String(source.id || createId()),
        name: String(source.name || "未命名文档"),
        kind: String(source.kind || "Document"),
        size: Number(source.size || 0),
        status: ["parsed", "fallback", "sample"].includes(source.status) ? source.status : "parsed",
        summary: String(source.summary || "文档已导入，等待生成摘要。"),
        keywords: Array.isArray(source.keywords) ? source.keywords.map(String).filter(Boolean).slice(0, 6) : [],
        cards: cards.map((card) => ({
            label: String(card?.label || "卡片"),
            title: String(card?.title || "待整理信息"),
            body: String(card?.body || "导入后会自动生成可浏览的资料卡片。"),
        })).slice(0, 4),
        parsedAt: source.parsedAt || now,
    };
}

function loadDocumentsForUser(userId) {
    const stored = localStorage.getItem(documentsKey(userId));
    if (stored) {
        try {
            const documents = JSON.parse(stored);
            if (Array.isArray(documents)) return documents.map(normalizeDocumentImport);
        } catch {
            return userId === DEMO_USER.id ? freshDocumentImports() : [];
        }
    }
    return userId === DEMO_USER.id ? freshDocumentImports() : [];
}

function saveDocuments() {
    if (!state.user) return;
    localStorage.setItem(documentsKey(state.user.id), JSON.stringify(state.documents));
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
        state.documents = loadDocumentsForUser(user.id);
        saveNotes();
        saveDocuments();
    } else {
        localStorage.removeItem(ACTIVE_USER_KEY);
        state.notes = [];
        state.documents = [];
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

function activeSources() {
    const notes = activeNotes().map((note) => ({ ...note, sourceKind: "note", sourceId: note.id }));
    const documents = state.documents.map((document) => ({
        id: document.id,
        sourceKind: "document",
        sourceId: document.id,
        title: document.name,
        content: document.summary,
        tags: document.keywords,
        type: "idea",
        mood: "",
        done: false,
        createdAt: document.parsedAt,
        updatedAt: document.parsedAt,
        documentKind: document.kind,
    }));
    return [...notes, ...documents];
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
    activeSources().filter((source) => isWithinDays(source.createdAt, 14)).forEach((source) => {
        source.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function getEvidence(topic) {
    const key = String(topic || "").toLowerCase();
    const sources = activeSources();
    const matches = sources.filter((source) => source.tags.some((tag) => tag.toLowerCase() === key) || `${source.title} ${source.content}`.toLowerCase().includes(key));
    return (matches.length ? matches : sources).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

const numberAnimationFrames = new WeakMap();

function setAnimatedNumber(element, target, suffix = "") {
    if (!element) return;
    const next = Number(target) || 0;
    const previous = Number(element.dataset.motionValue);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!Number.isFinite(previous) || reduceMotion) {
        element.dataset.motionValue = String(next);
        element.textContent = `${next}${suffix}`;
        return;
    }
    if (previous === next) {
        window.cancelAnimationFrame(numberAnimationFrames.get(element));
        element.textContent = `${next}${suffix}`;
        return;
    }
    window.cancelAnimationFrame(numberAnimationFrames.get(element));
    element.dataset.motionValue = String(next);
    const startedAt = performance.now();
    const duration = 420;
    const frame = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = `${Math.round(previous + (next - previous) * eased)}${suffix}`;
        if (progress < 1) numberAnimationFrames.set(element, window.requestAnimationFrame(frame));
    };
    numberAnimationFrames.set(element, window.requestAnimationFrame(frame));
}

function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

const externalScripts = new Map();

function loadExternalScript(src, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    if (externalScripts.has(src)) return externalScripts.get(src);
    const promise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => window[globalName] ? resolve(window[globalName]) : reject(new Error(`missing ${globalName}`));
        script.onerror = () => reject(new Error(`failed to load ${src}`));
        document.head.append(script);
    });
    externalScripts.set(src, promise);
    return promise;
}

function getFileExtension(name) {
    const match = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : "";
}

function formatFileSize(bytes) {
    if (!bytes) return "样例";
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function cleanDocumentText(value) {
    return String(value || "")
        .replace(/\u0000/g, " ")
        .replace(/[^\S\r\n]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function fallbackDocumentText(file) {
    const baseName = String(file.name || "导入文档").replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    return `${baseName}。这份文档已经进入 Action 的灵感库预解析流程。当前浏览器暂时没有读取到正文，会先根据文件名、格式和导入时间生成结构卡片，后续接入后端后可替换为全文解析。`;
}

async function extractDocxText(file) {
    const mammoth = await loadExternalScript("https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js", "mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value || "";
}

async function extractPdfText(file) {
    const pdfjsLib = await loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "pdfjsLib");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages = [];
    const maxPages = Math.min(pdf.numPages, 18);
    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => item.str).join(" "));
    }
    return pages.join("\n");
}

async function readDocumentText(file) {
    const extension = getFileExtension(file.name);
    if (extension === "docx") return cleanDocumentText(await extractDocxText(file));
    if (extension === "pdf") return cleanDocumentText(await extractPdfText(file));
    if (["txt", "md", "csv"].includes(extension) || file.type.startsWith("text/")) return cleanDocumentText(await file.text());
    throw new Error("unsupported binary document");
}

function pickDocumentKeywords(text, fileName) {
    const source = `${fileName} ${text}`;
    const dictionary = ["AI", "产品", "用户", "作品集", "面试", "验证", "行动", "洞察", "证据", "调研", "PRD", "需求", "路径", "指标", "风险", "策略", "体验", "交互"];
    const detected = dictionary.filter((keyword) => source.toLowerCase().includes(keyword.toLowerCase()));
    const latinWords = source.match(/[A-Za-z][A-Za-z0-9-]{2,}/g) || [];
    const latinCounts = latinWords.reduce((counts, word) => {
        const key = word.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
        return counts;
    }, new Map());
    const topLatin = [...latinCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word.toUpperCase())
        .filter((word) => !["THE", "AND", "FOR", "WITH", "THIS"].includes(word))
        .slice(0, 3);
    return [...new Set([...detected, ...topLatin])].slice(0, 6);
}

function documentSentences(text) {
    return cleanDocumentText(text)
        .split(/[\n。！？.!?；;]+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 12)
        .slice(0, 18);
}

function buildDocumentCards(text, file, keywords) {
    const sentences = documentSentences(text);
    const summary = summarize(sentences.slice(0, 2).join("。") || text, 92);
    const actionSentence = sentences.find((item) => /应该|需要|建议|下一步|行动|验证|完成|优化|改进|todo/i.test(item));
    const evidenceSentence = sentences.find((item) => item !== actionSentence) || sentences[0] || summary;
    const theme = keywords[0] || "导入文档";
    return [
        { label: "摘要", title: "核心内容", body: summary },
        { label: "主题", title: `围绕“${theme}”展开`, body: keywords.length ? `识别到 ${keywords.slice(0, 4).join("、")} 等主题，可作为后续洞察的聚类入口。` : "暂未识别到稳定主题，需要结合更多输入确认。" },
        { label: "行动", title: actionSentence ? "可转成下一步" : "等待人工确认动作", body: summarize(actionSentence || "先把这份文档中的关键判断沉淀为一条灵感，再决定是否进入行动列表。", 92) },
        { label: "证据", title: "可引用片段", body: summarize(evidenceSentence, 92) },
    ];
}

async function parseImportedDocument(file) {
    let status = "parsed";
    let text = "";
    try {
        text = await readDocumentText(file);
    } catch {
        status = "fallback";
    }
    if (text.length < 18) {
        status = "fallback";
        text = fallbackDocumentText(file);
    }
    const keywords = pickDocumentKeywords(text, file.name);
    return normalizeDocumentImport({
        id: createId(),
        name: file.name,
        kind: getFileExtension(file.name).toUpperCase() || "Document",
        size: file.size,
        status,
        summary: summarize(text, 132),
        keywords,
        cards: buildDocumentCards(text, file, keywords),
        parsedAt: new Date().toISOString(),
    });
}

function documentStatusLabel(status) {
    if (status === "sample") return "样例解析";
    if (status === "fallback") return "结构预解析";
    return "正文已解析";
}

async function handleDocumentImport() {
    const files = [...(el.documentImportInput.files || [])];
    if (!files.length) return;
    const supported = files.filter((file) => ["pdf", "doc", "docx", "txt", "md"].includes(getFileExtension(file.name)));
    if (!supported.length) {
        showToast("请选择 Word 或 PDF 文档");
        el.documentImportInput.value = "";
        return;
    }
    el.libraryList.classList.add("is-parsing");
    el.libraryList.innerHTML = `<div class="library-empty parsing"><span><svg><use href="#i-spark" /></svg></span><strong>正在解析文档</strong><p>Action 正在提取正文并生成卡片。</p></div>`;
    try {
        const parsed = [];
        for (const file of supported.slice(0, 6)) {
            parsed.push(await parseImportedDocument(file));
        }
        const existingNames = new Set(parsed.map((item) => item.name));
        state.documents = [...parsed, ...state.documents.filter((item) => !existingNames.has(item.name))].slice(0, 10);
        state.expandedLibraryCardId = null;
        saveDocuments();
        renderAll();
        showOperationFeedback(`已解析 ${parsed.length} 个文档`, "success");
        showToast("文档已生成资料卡，可以继续沉淀为灵感");
    } catch {
        showToast("文档解析失败，请换一个文件再试");
        renderAll();
    } finally {
        el.libraryList.classList.remove("is-parsing");
        el.documentImportInput.value = "";
    }
}

function createNoteFromDocument(documentId) {
    const item = state.documents.find((documentItem) => documentItem.id === documentId);
    if (!item) return;
    const now = new Date().toISOString();
    state.notes.unshift(normalizeNote({
        id: createId(),
        title: item.cards[0]?.title || item.name,
        content: `${item.summary}\n\n来源文档：${item.name}`,
        type: "idea",
        mood: "清醒",
        tags: [...new Set(["文档导入", ...item.keywords])].slice(0, 6),
        done: false,
        createdAt: now,
        updatedAt: now,
    }));
    saveNotes();
    renderAll();
    showOperationFeedback("已沉淀为灵感", "success");
    showToast("已经加入灵感库，后续洞察会引用它");
}

function toggleLibraryCard(cardId) {
    const nextCardId = state.expandedLibraryCardId === cardId ? null : cardId;
    state.expandedLibraryCardId = nextCardId;
    el.libraryList.querySelectorAll("[data-library-card-id]").forEach((card) => {
        const isExpanded = card.dataset.libraryCardId === nextCardId;
        card.classList.toggle("expanded", isExpanded);
        card.querySelector(".library-card-main")?.setAttribute("aria-expanded", String(isExpanded));
    });
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
    const sources = activeSources();
    const tasks = notes.filter((note) => note.type === "task" && !note.done);
    setAnimatedNumber(document.querySelector("#navSignalCount"), sources.length);
    setAnimatedNumber(document.querySelector("#navInsightCount"), sources.length ? buildInsights().length : 0);
    setAnimatedNumber(document.querySelector("#navActionCount"), tasks.length);
}

function renderUser() {
    const name = state.user?.name || "作品集访客";
    el.spaceName.textContent = state.user?.id === DEMO_USER.id ? "AI 产品经理作品集" : `${name}的思考空间`;
    el.activeUserName.textContent = name;
    el.userInitial.textContent = name.slice(0, 1).toUpperCase();
    document.querySelector("#greetingTitle").textContent = `${getGreeting()}，${name}。今天先推进一件事。`;
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 11) return "早上好";
    if (hour < 18) return "下午好";
    return "晚上好";
}

function renderDates() {
    const now = new Date();
    document.querySelector("#todayLabel").textContent = `${now.getMonth() + 1} 月 ${now.getDate()} 日 · 今日工作区`;
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    document.querySelector("#weeklyRange").textContent = `${start.getMonth() + 1} 月 ${start.getDate()} 日 - ${now.getMonth() + 1} 月 ${now.getDate()} 日`;
    document.querySelector("#weeklyDate").textContent = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
}

function renderOverview() {
    const notes = activeNotes();
    const sources = activeSources();
    const tasks = notes.filter((note) => note.type === "task");
    const openTasks = tasks.filter((note) => !note.done).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const focusTask = openTasks[0];
    const insights = buildInsights();
    const lead = insights[0];

    if (focusTask) {
        el.focusTaskTitle.textContent = focusTask.title;
        el.focusTaskDetail.textContent = summarize(focusTask.content, 118);
        el.focusTaskMeta.textContent = `${focusTask.tags[0] ? `来自洞察：${focusTask.tags[0]} · ` : ""}${formatRelative(focusTask.updatedAt)}`;
        el.focusTaskStatus.textContent = "待推进";
        el.focusTaskOpen.textContent = "打开详情";
        el.focusTaskOpen.dataset.noteId = focusTask.id;
        el.focusTaskComplete.hidden = false;
        el.focusTaskComplete.dataset.toggleTask = focusTask.id;
    } else {
        el.focusTaskTitle.textContent = "今天的待办已经清空";
        el.focusTaskDetail.textContent = "可以记录一个新变化，或从待确认洞察中选择下一步。";
        el.focusTaskMeta.textContent = "没有等待处理的行动";
        el.focusTaskStatus.textContent = "已清空";
        el.focusTaskOpen.textContent = "新建下一步";
        delete el.focusTaskOpen.dataset.noteId;
        el.focusTaskComplete.hidden = true;
        delete el.focusTaskComplete.dataset.toggleTask;
    }

    document.querySelector("#workbenchInsightTitle").textContent = lead.title;
    document.querySelector("#workbenchInsightDetail").textContent = lead.detail;
    document.querySelector("#workbenchInsightConfidence").textContent = `${lead.confidence}% 可信`;
    el.workbenchInsightEvidence.dataset.openEvidence = lead.topic;
    el.workbenchInsightEvidence.querySelector("span").textContent = `查看 ${lead.evidence} 条依据`;
    document.querySelector("#actionOpenCount").textContent = `${openTasks.length} 项`;
    document.querySelector("#reasonInputCount").textContent = `已读取 ${sources.length} 条有效内容`;

    renderRecentSignals();
    renderOverviewActions();
    renderRail(lead);
}

function renderRecentSignals() {
    const sources = [...activeSources()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 2);
    el.recentSignals.innerHTML = sources.length ? sources.map((source, index) => `
        <article class="signal-row ${index === 1 ? "featured" : ""}" ${source.sourceKind === "document" ? `data-document-id="${escapeHtml(source.sourceId)}"` : `data-note-id="${escapeHtml(source.sourceId)}"`}>
            ${signalIcon(source.type)}
            <div class="signal-copy"><strong>${escapeHtml(source.title)}</strong><p>${escapeHtml(summarize(source.content))}</p></div>
            <div class="signal-meta"><span>${formatRelative(source.createdAt)}</span><em>${source.sourceKind === "document" ? escapeHtml(source.documentKind) : typeLabels[source.type]}</em></div>
        </article>`).join("") : `<div class="action-empty">还没有输入。先写下一条，洞察会从这里开始。</div>`;
}

function renderOverviewActions() {
    const tasks = activeNotes().filter((note) => note.type === "task" && !note.done).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);
    el.overviewActions.innerHTML = tasks.length ? tasks.map((note) => `
        <article class="action-row work-queue-item${note.id === state.flashTaskId ? " status-flash" : ""}" data-note-id="${escapeHtml(note.id)}">
            <button class="action-check" data-toggle-task="${escapeHtml(note.id)}" type="button" aria-label="标记完成"><svg><use href="#i-check" /></svg></button>
            <div><strong>${escapeHtml(note.title)}</strong><p>${escapeHtml(note.tags[0] ? `来自洞察：${note.tags[0]}` : "来自你的输入")}</p></div>
            <svg class="queue-arrow"><use href="#i-chevron" /></svg>
        </article>`).join("") : `<div class="action-empty">当前没有待处理行动，可以从洞察中创建下一步。</div>`;
}

function renderLibrary() {
    const notes = getFilteredNotes();
    const query = state.query.trim().toLowerCase();
    const documents = state.documents.filter((item) => {
        if (!["all", "idea"].includes(state.filter)) return false;
        if (!query) return true;
        return `${item.name} ${item.summary} ${item.keywords.join(" ")}`.toLowerCase().includes(query);
    });
    const entries = [
        ...notes.map((item) => ({ kind: "note", item, date: item.updatedAt, length: item.content.length })),
        ...documents.map((item) => ({ kind: "document", item, date: item.parsedAt, length: item.summary.length })),
    ].sort((a, b) => {
        if (state.sort === "oldest") return new Date(a.date) - new Date(b.date);
        if (state.sort === "longest") return b.length - a.length;
        return new Date(b.date) - new Date(a.date);
    });
    setAnimatedNumber(document.querySelector("#libraryCount"), entries.length, " 条灵感");
    document.querySelector("#librarySummary").textContent = state.query ? `正在搜索“${state.query}”` : "原始表达永久保留，AI 只在上层增加理解";
    el.libraryList.innerHTML = entries.length ? entries.map((entry, index) => {
        const item = entry.item;
        const cardId = `${entry.kind}:${item.id}`;
        const isExpanded = state.expandedLibraryCardId === cardId;
        const accent = ["#667d92", "#718f7f", "#b7835a", "#7d7d98"][index % 4];
        if (entry.kind === "document") {
            return `
                <article class="library-stack-card document-source ${isExpanded ? "expanded" : ""}" data-library-card-id="${escapeHtml(cardId)}" data-toggle-library-card="${escapeHtml(cardId)}" style="--card-order:${index + 1}; --card-accent:${accent};">
                    <button class="library-card-main" data-toggle-library-card="${escapeHtml(cardId)}" type="button" aria-expanded="${isExpanded}">
                        <span class="library-card-ridge" aria-hidden="true"></span>
                        <span class="library-card-copy"><span class="library-card-kind">${escapeHtml(item.kind)}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(summarize(item.summary, 76))}</small></span>
                        <span class="library-card-state">${documentStatusLabel(item.status)}</span>
                        <span class="library-card-chevron"><svg><use href="#i-chevron" /></svg></span>
                    </button>
                    <div class="library-card-details"><div class="library-card-details-inner">
                        <p>${escapeHtml(item.summary)}</p>
                        <div class="document-meta"><span>${formatFileSize(item.size)}</span><span>${formatRelative(item.parsedAt)}</span>${item.keywords.slice(0, 4).map((keyword) => `<span>#${escapeHtml(keyword)}</span>`).join("")}</div>
                        <div class="document-card-points">${item.cards.slice(0, 3).map((card) => `<section><span>${escapeHtml(card.label)}</span><strong>${escapeHtml(card.title)}</strong></section>`).join("")}</div>
                        <footer><button class="document-note-button" data-create-note-from-document="${escapeHtml(item.id)}" type="button"><svg><use href="#i-plus" /></svg><span>沉淀为灵感</span></button></footer>
                    </div></div>
                </article>`;
        }
        return `
            <article class="library-stack-card note-source ${isExpanded ? "expanded" : ""}" data-library-card-id="${escapeHtml(cardId)}" data-toggle-library-card="${escapeHtml(cardId)}" style="--card-order:${index + 1}; --card-accent:${accent};">
                <button class="library-card-main" data-toggle-library-card="${escapeHtml(cardId)}" type="button" aria-expanded="${isExpanded}">
                    <span class="library-card-ridge" aria-hidden="true"></span>
                    <span class="library-card-copy"><span class="library-card-kind">${escapeHtml(typeLabels[item.type] || "灵感")}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(summarize(item.content, 76))}</small></span>
                    <time class="library-card-state">${formatRelative(item.updatedAt)}</time>
                    <span class="library-card-chevron"><svg><use href="#i-chevron" /></svg></span>
                </button>
                <div class="library-card-details"><div class="library-card-details-inner">
                    <p>${escapeHtml(item.content)}</p>
                    <div class="document-meta">${item.tags.slice(0, 5).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}<span>${item.done ? "已完成" : "持续记录"}</span></div>
                    <footer><button class="document-note-button secondary" data-note-id="${escapeHtml(item.id)}" type="button"><svg><use href="#i-file" /></svg><span>查看完整记录</span></button></footer>
                </div></div>
            </article>`;
    }).join("") : `<div class="library-empty"><span><svg><use href="#i-search" /></svg></span><strong>这里还没有灵感</strong><p>记录一条想法，或导入 Word / PDF。</p></div>`;
}

function renderInsights() {
    const insights = buildInsights();
    const recentSources = activeSources().filter((source) => isWithinDays(source.createdAt, 14));
    const lead = insights[0];
    const average = Math.round(insights.reduce((sum, item) => sum + item.confidence, 0) / insights.length);
    document.querySelector("#insightSourceSummary").textContent = `${recentSources.length} 条内容 · 最近 14 天`;
    document.querySelector("#insightConsensus").textContent = lead.title;
    document.querySelector("#insightConsensusDetail").textContent = lead.detail;
    setAnimatedNumber(document.querySelector("#insightScore"), average);
    document.querySelector(".confidence-ring").style.setProperty("--score", average);
    document.querySelector("#insightLeadEvidence").dataset.openEvidence = lead.topic;
    const secondaryInsights = insights.slice(1, 2);
    document.querySelector("#insightSecondaryCount").textContent = `${secondaryInsights.length} 条`;
    el.insightGrid.innerHTML = secondaryInsights.map((insight, index) => `
        <article class="insight-card" style="--accent:${insight.accent}">
            <div class="insight-card-head"><span>0${index + 2} / ${insight.label}</span><em>${insight.confidence}% 可信</em></div>
            <h3>${escapeHtml(insight.title)}</h3>
            <p>${escapeHtml(insight.detail)}</p>
            <footer><button data-open-evidence="${escapeHtml(insight.topic)}" type="button">查看 ${insight.evidence} 条依据 →</button><span>AI 生成 · 待确认</span></footer>
        </article>`).join("");

    const assumptions = [
        ["任务拆分过大是延迟开始的主要原因", "需要再观察 3 天"],
        ["15 分钟最小行动能持续提高完成率", "已有初步证据"],
        ["每周一次提炼比实时提醒更少打扰", "尚未验证"],
    ];
    el.assumptionTable.innerHTML = assumptions.slice(0, 2).map(([title, status], index) => `
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
    setAnimatedNumber(document.querySelector("#actionProgressValue"), percentage, "%");
    document.querySelector("#actionProgressBar").style.width = `${percentage}%`;
    document.querySelector("#actionProgressCopy").textContent = percentage >= 60 ? "行动反馈已经开始形成稳定闭环。" : "再完成一个最小行动，让洞察获得真实反馈。";
    setAnimatedNumber(document.querySelector("#todoCount"), todo.length);
    setAnimatedNumber(document.querySelector("#doneCount"), done.length);
    el.todoActions.innerHTML = renderBoardCards(todo, false);
    el.doneActions.innerHTML = renderBoardCards(done, true);
}

function renderBoardCards(notes, done) {
    if (!notes.length) return `<div class="action-empty">${done ? "完成后的行动会沉淀在这里" : "暂时没有待处理行动"}</div>`;
    return notes.map((note) => `
        <article class="board-card ${done ? "done" : ""}${note.id === state.flashTaskId ? " status-flash" : ""}" data-note-id="${escapeHtml(note.id)}">
            <button class="board-complete-control ${done ? "is-complete" : ""}" data-toggle-task="${escapeHtml(note.id)}" type="button" aria-label="${done ? "恢复未完成" : "标记完成"}"><svg><use href="#i-check" /></svg><span>${done ? "已完成" : "标记完成"}</span></button>
            <div><strong>${escapeHtml(note.title)}</strong><p>${escapeHtml(summarize(note.content, 82))}</p><footer><span>${note.tags[0] ? `#${escapeHtml(note.tags[0])}` : "个人行动"}</span><time>${formatRelative(note.createdAt)}</time></footer></div>
        </article>`).join("");
}

function renderWeekly() {
    const week = activeSources().filter((source) => isWithinDays(source.createdAt, 7));
    const lead = buildInsights()[0];
    const tasks = activeNotes().filter((note) => note.type === "task" && isWithinDays(note.updatedAt, 7));
    const done = tasks.filter((note) => note.done);
    const rate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
    const topics = [...new Set([lead.topic, ...week.flatMap((source) => source.tags)])].filter(Boolean).slice(0, 4);
    document.querySelector("#weeklyTheme").textContent = lead.topic === "启动成本" ? "从“把事情想清楚”转向“先做出一个可以验证的版本”。" : `本周最稳定的思考主线是“${lead.topic}”，它正在影响你的行动选择。`;
    document.querySelector("#weeklyRepeatTitle").textContent = lead.topic;
    document.querySelector("#weeklyTrackTopic").textContent = lead.topic;
    document.querySelector("#weeklyRepeatCopy").textContent = lead.detail;
    document.querySelector("#weeklyHeaderInputs").textContent = week.length;
    document.querySelector("#weeklyHeaderDone").textContent = done.length;
    document.querySelector("#weeklyHeaderRate").textContent = `${rate}%`;
    document.querySelector("#weeklyInputCount").textContent = week.length;
    document.querySelector("#weeklyInsightScore").textContent = lead.confidence;
    document.querySelector("#weeklyDoneCount").textContent = done.length;
    document.querySelector("#weeklyEvidenceCount").textContent = `${lead.evidence} 条依据`;
    document.querySelector("#weeklyEvidenceButton").dataset.openEvidence = lead.topic;
    document.querySelector("#weeklyTopicList").innerHTML = topics.length ? topics.map((topic) => `<span>#${escapeHtml(topic)}</span>`).join("") : "<span>等待更多输入</span>";
    document.querySelector("#weeklyProgressLabel").textContent = `${rate}% 完成`;
    document.querySelector("#weeklyActionCopy").textContent = done.length ? `本周已有 ${done.length} 个结果进入反馈，后续洞察会优先参考这些真实行动。` : "本周还缺少完成后的真实反馈，先完成一个最小行动再回来看结论。";
    document.querySelector("#weeklyNextTitle").textContent = lead.topic === "启动成本" ? "把下一步缩小到 15 分钟" : `为“${lead.topic}”做一次最小验证`;
    document.querySelector("#weeklyNextCopy").textContent = lead.topic === "启动成本" ? "连续测试 5 天，记录实际开始时间和完成感受，再判断它是否有效。" : `用一个低成本行动验证“${lead.topic}”是否真的影响本周推进。`;
    document.querySelector("#weeklySourceCount").textContent = `基于 ${week.length} 条本周输入与 ${tasks.length} 个行动`;
}

function renderRail(lead = buildInsights()[0]) {
    const evidence = getEvidence(lead.topic).slice(0, 2);
    el.railEvidenceList.innerHTML = evidence.map((source) => `
        <article class="rail-evidence-item" ${source.sourceKind === "document" ? `data-document-id="${escapeHtml(source.sourceId)}"` : `data-note-id="${escapeHtml(source.sourceId)}"`}><strong>${escapeHtml(source.title)}</strong><p>“${escapeHtml(summarize(source.content, 42))}”</p></article>`).join("");
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
    closeAiRail(false);
    state.view = view;
    renderNavigation();
    const activePanel = document.querySelector(`[data-view-panel="${view}"]`);
    if (activePanel && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        activePanel.classList.remove("motion-enter");
        void activePanel.offsetWidth;
        activePanel.classList.add("motion-enter");
        window.clearTimeout(activePanel.motionTimer);
        activePanel.motionTimer = window.setTimeout(() => activePanel.classList.remove("motion-enter"), 720);
    }
    el.sidebar.classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

let aiRailOpener = null;

function openAiRail(opener = document.activeElement) {
    aiRailOpener = opener instanceof HTMLElement ? opener : el.aiTrigger;
    el.aiRailBackdrop.hidden = false;
    el.aiRail.classList.add("open");
    el.aiRailBackdrop.classList.add("open");
    el.aiRail.setAttribute("aria-hidden", "false");
    el.aiTrigger.setAttribute("aria-expanded", "true");
    document.body.classList.add("ai-rail-open");
    window.setTimeout(() => el.railClose.focus(), 120);
}

function closeAiRail(restoreFocus = true) {
    if (!el.aiRail.classList.contains("open")) return;
    el.aiRail.classList.remove("open");
    el.aiRailBackdrop.classList.remove("open");
    el.aiRail.setAttribute("aria-hidden", "true");
    el.aiTrigger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("ai-rail-open");
    window.setTimeout(() => {
        if (!el.aiRail.classList.contains("open")) el.aiRailBackdrop.hidden = true;
    }, 240);
    if (restoreFocus && aiRailOpener?.isConnected) aiRailOpener.focus();
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
    const detailWasOpen = state.selectedId === id && el.detailDrawer.classList.contains("open");
    note.done = !note.done;
    note.updatedAt = new Date().toISOString();
    state.flashTaskId = id;
    saveNotes();
    renderAll();
    window.setTimeout(() => {
        if (state.flashTaskId === id) state.flashTaskId = null;
    }, 900);
    if (detailWasOpen && note.done) {
        window.clearTimeout(toggleTask.detailCloseTimer);
        toggleTask.detailCloseTimer = window.setTimeout(closeDetailDrawer, 1550);
    } else if (detailWasOpen) {
        openNoteDetail(id);
    }
    showOperationFeedback(note.done ? "已标记完成" : "已恢复未完成", note.done ? "success" : "restore");
    showToast(note.done ? "行动已完成，结果已进入下一轮分析" : "行动已恢复为待处理");
}

function openNoteDetail(id) {
    const note = state.notes.find((item) => item.id === id);
    if (!note) return;
    state.selectedId = id;
    el.detailType.textContent = `原始输入 / ${typeLabels[note.type]}`;
    el.detailTaskToggle.hidden = note.type !== "task";
    if (note.type === "task") {
        el.detailTaskToggle.dataset.toggleTask = note.id;
        el.detailTaskToggle.classList.toggle("is-complete", note.done);
        el.detailTaskToggle.setAttribute("aria-label", note.done ? "恢复未完成" : "标记完成");
        el.detailTaskToggle.querySelector("span").textContent = note.done ? "已完成" : "标记完成";
    }
    const insight = note.tags.includes("启动成本") ? "这条记录支持“启动动作大小影响推进速度”的判断。它描述的是实际行为，而不只是抽象观点，因此证据强度较高。" : `这条输入与“${note.tags[0] || "个人节奏"}”主题有关。当前只作为关联信号保留，不会被直接推断为结论。`;
    el.detailBody.innerHTML = `
        <h2 id="detailHeading">${escapeHtml(note.title)}</h2>
        <div class="detail-meta"><span>${typeLabels[note.type]}</span><span>${escapeHtml(note.mood)}</span><span>${formatRelative(note.createdAt)}</span>${note.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="detail-content">${escapeHtml(note.content)}</div>
        <div class="detail-divider"></div>
        <section class="detail-ai"><span>AI 关联判断</span><p>${escapeHtml(insight)}</p></section>
        <div class="detail-actions"><button data-detail-action="edit" type="button"><svg><use href="#i-edit" /></svg>编辑</button><button class="danger" data-detail-action="delete" type="button"><svg><use href="#i-trash" /></svg>删除</button></div>`;
    showDetailDrawer();
}

function openDocumentDetail(id) {
    const document = state.documents.find((item) => item.id === id);
    if (!document) return;
    state.selectedId = null;
    el.detailTaskToggle.hidden = true;
    el.detailType.textContent = `导入文档 / ${document.kind}`;
    el.detailBody.innerHTML = `
        <h2 id="detailHeading">${escapeHtml(document.name)}</h2>
        <div class="detail-meta"><span>${escapeHtml(document.kind)}</span><span>${formatFileSize(document.size)}</span><span>${formatRelative(document.parsedAt)}</span>${document.keywords.map((keyword) => `<span>#${escapeHtml(keyword)}</span>`).join("")}</div>
        <div class="detail-content">${escapeHtml(document.summary)}</div>
        <div class="detail-divider"></div>
        <section class="detail-ai"><span>AI 解析结果</span><p>这份文档已经作为洞察来源参与主题聚类和证据匹配，原文摘要不会被 AI 结论覆盖。</p></section>
        <div class="document-card-points">${document.cards.slice(0, 3).map((card) => `<section><span>${escapeHtml(card.label)}</span><strong>${escapeHtml(card.title)}</strong></section>`).join("")}</div>`;
    showDetailDrawer();
}

function openEvidence(topic) {
    const sources = getEvidence(topic);
    el.detailTaskToggle.hidden = true;
    el.detailType.textContent = "洞察证据链";
    el.detailBody.innerHTML = `
        <h2 id="detailHeading">“${escapeHtml(topic)}”的依据</h2>
        <div class="detail-meta"><span>${sources.length} 条相关内容</span><span>灵感与导入文档</span><span>可追溯</span></div>
        <div class="detail-content">系统只展示与你原始表达直接相关的记录。你可以逐条检查语境，再决定是否接受这条洞察。</div>
        <div class="detail-divider"></div>
        <div class="evidence-detail-list">${sources.map((source) => `<article class="rail-evidence-item" ${source.sourceKind === "document" ? `data-document-id="${escapeHtml(source.sourceId)}"` : `data-note-id="${escapeHtml(source.sourceId)}"`}><strong>${escapeHtml(source.title)}</strong><p>“${escapeHtml(summarize(source.content, 72))}”</p></article>`).join("")}</div>`;
    showDetailDrawer();
}

function showDetailDrawer() {
    window.clearTimeout(closeDetailDrawer.timer);
    el.detailBackdrop.hidden = false;
    el.detailDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(() => el.detailDrawer.classList.add("open"));
}

function closeDetailDrawer() {
    window.clearTimeout(closeDetailDrawer.timer);
    el.detailDrawer.classList.remove("open");
    el.detailDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    state.selectedId = null;
    closeDetailDrawer.timer = window.setTimeout(() => {
        if (!el.detailDrawer.classList.contains("open")) el.detailBackdrop.hidden = true;
    }, 220);
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
    const results = activeSources().filter((source) => `${source.title} ${source.content} ${source.tags.join(" ")}`.toLowerCase().includes(value)).slice(0, 8);
    el.commandResults.innerHTML = results.length ? results.map((source) => `<button class="command-result" ${source.sourceKind === "document" ? `data-document-id="${escapeHtml(source.sourceId)}"` : `data-note-id="${escapeHtml(source.sourceId)}"`} type="button">${signalIcon(source.type)}<span><strong>${escapeHtml(source.title)}</strong><small>${escapeHtml(summarize(source.content, 58))}</small></span><em>${source.sourceKind === "document" ? escapeHtml(source.documentKind) : typeLabels[source.type]}</em></button>`).join("") : `<div class="command-empty">没有找到相关内容</div>`;
}

function showToast(message) {
    window.clearTimeout(showToast.timer);
    el.toast.textContent = message;
    el.toast.classList.add("show");
    showToast.timer = window.setTimeout(() => el.toast.classList.remove("show"), 2200);
}

function showOperationFeedback(message, variant = "success") {
    window.clearTimeout(showOperationFeedback.timer);
    window.clearTimeout(showOperationFeedback.hideTimer);
    el.operationFeedbackText.textContent = message;
    el.operationFeedback.dataset.variant = variant;
    el.operationFeedback.classList.remove("show");
    el.operationFeedback.setAttribute("aria-hidden", "false");
    void el.operationFeedback.offsetWidth;
    el.operationFeedback.classList.add("show");
    showOperationFeedback.timer = window.setTimeout(() => {
        el.operationFeedback.classList.remove("show");
        showOperationFeedback.hideTimer = window.setTimeout(() => {
            if (!el.operationFeedback.classList.contains("show")) el.operationFeedback.setAttribute("aria-hidden", "true");
        }, 240);
    }, 1550);
}

function delay(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function runAnalysis() {
    if (state.analyzing) return;
    state.analyzing = true;
    const sourceCount = activeSources().length;
    const buttons = document.querySelectorAll("#runAnalysis, [data-run-analysis]");
    buttons.forEach((button) => {
        button.disabled = true;
        const label = button.querySelector("span");
        if (label) label.textContent = "正在分析";
    });
    const overlayStages = [
        ["正在读取你的内容", `扫描 ${sourceCount} 条灵感与导入文档`],
        ["正在寻找重复信号", "对主题、情绪与行动反馈进行聚类"],
        ["正在核对证据链", "排除弱关联并生成可验证结论"],
    ];
    el.analysisOverlay.classList.remove("complete");
    el.analysisProgressBar.style.width = "0";
    [...el.analysisStageDots.children].forEach((dot) => dot.classList.remove("active"));
    void el.analysisOverlay.offsetWidth;
    el.analysisOverlay.classList.add("show");
    el.analysisOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("analysis-running");
    el.aiStatusText.textContent = "正在理解最近输入";
    el.reasoningSteps.classList.add("analyzing");
    const steps = [...el.reasoningSteps.children];
    for (const [index, step] of steps.entries()) {
        steps.forEach((item) => item.classList.remove("active"));
        step.classList.add("active");
        el.analysisOverlayTitle.textContent = overlayStages[index][0];
        el.analysisOverlayDetail.textContent = overlayStages[index][1];
        el.analysisProgressBar.style.width = `${(index + 1) * 33.333}%`;
        [...el.analysisStageDots.children].forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex <= index));
        await delay(760);
    }
    el.reasoningSteps.classList.remove("analyzing");
    steps.forEach((item) => item.classList.remove("active"));
    el.aiStatusText.textContent = "已更新当前空间";
    el.analysisTime.textContent = "刚刚";
    renderAll();
    el.analysisOverlay.classList.add("complete");
    el.analysisOverlayTitle.textContent = "洞察整理完成";
    el.analysisOverlayDetail.textContent = `已更新 ${buildInsights().length} 条洞察与对应证据`;
    el.analysisProgressBar.style.width = "100%";
    await delay(680);
    el.analysisOverlay.classList.remove("show", "complete");
    el.analysisOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("analysis-running");
    buttons.forEach((button) => {
        button.disabled = false;
        const label = button.querySelector("span");
        if (label) label.textContent = button.id === "runAnalysis" ? "生成今日洞察" : "用 AI 做洞察";
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
        closeAiRail(false);
        switchView("actions");
        return;
    }
    const now = new Date().toISOString();
    state.notes.unshift(normalizeNote({ id: createId(), title, content: "用 15 分钟写清目标用户、核心问题和这一屏要证明的产品判断。", type: "task", mood: "清醒", tags: ["启动成本", "AI建议"], done: false, createdAt: now, updatedAt: now }));
    saveNotes();
    renderAll();
    closeAiRail(false);
    switchView("actions");
    showOperationFeedback("已加入行动", "success");
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
    showOperationFeedback(wasEditing ? "修改已保存" : "输入成功", "success");
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
el.documentImportInput.addEventListener("change", handleDocumentImport);

document.addEventListener("click", (event) => {
    const documentNote = event.target.closest("[data-create-note-from-document]");
    if (documentNote) {
        event.stopPropagation();
        createNoteFromDocument(documentNote.dataset.createNoteFromDocument);
        return;
    }
    const libraryCardToggle = event.target.closest("[data-toggle-library-card]");
    if (libraryCardToggle && !event.target.closest("[data-note-id]")) {
        event.stopPropagation();
        toggleLibraryCard(libraryCardToggle.dataset.toggleLibraryCard);
        return;
    }
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
    const documentTarget = event.target.closest("[data-document-id]");
    if (documentTarget) {
        openDocumentDetail(documentTarget.dataset.documentId);
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
el.detailBackdrop.addEventListener("click", (event) => { if (event.target === el.detailBackdrop) closeDetailDrawer(); });
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
    const documentResult = event.target.closest("[data-document-id]");
    if (documentResult) {
        event.stopPropagation();
        closeCommandPalette();
        openDocumentDetail(documentResult.dataset.documentId);
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
        else if (el.aiRail.classList.contains("open")) closeAiRail();
        else el.sidebar.classList.remove("open");
    }
});

el.runAnalysis.addEventListener("click", runAnalysis);
document.querySelectorAll("[data-run-analysis]").forEach((button) => button.addEventListener("click", runAnalysis));
el.focusTaskOpen.addEventListener("click", () => {
    if (el.focusTaskOpen.dataset.noteId) openNoteDetail(el.focusTaskOpen.dataset.noteId);
    else openCapture("task");
});
el.aiTrigger.addEventListener("click", () => openAiRail(el.aiTrigger));
el.railClose.addEventListener("click", () => closeAiRail());
el.aiRailBackdrop.addEventListener("click", () => closeAiRail());
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
    const payload = JSON.stringify({ product: "Action", version: 5, exportedAt: new Date().toISOString(), notes: state.notes, documents: state.documents }, null, 2);
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
        if (Array.isArray(data.documents)) state.documents = data.documents.map(normalizeDocumentImport);
        saveNotes();
        saveDocuments();
        renderAll();
        showToast(`已导入 ${state.notes.length} 条输入`);
    } catch {
        showToast("导入失败，请选择 Action 导出的 JSON 文件");
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

const topbar = document.querySelector(".topbar");
window.addEventListener("scroll", () => {
    topbar.classList.toggle("scrolled", window.scrollY > 18);
}, { passive: true });
document.querySelector("#copyWeekly").addEventListener("click", async () => {
    const report = `Action 本周思考简报\n\n本周主线：${document.querySelector("#weeklyTheme").textContent}\n\n关键洞察：${document.querySelector("#weeklyRepeatTitle").textContent}\n${document.querySelector("#weeklyRepeatCopy").textContent}\n\n行动反馈：${document.querySelector("#weeklyActionCopy").textContent}\n\n下周实验：${document.querySelector("#weeklyNextTitle").textContent}\n${document.querySelector("#weeklyNextCopy").textContent}`;
    try {
        await navigator.clipboard.writeText(report);
        showToast("本周简报已复制");
    } catch {
        showToast("浏览器未允许复制，请稍后重试");
    }
});

if (state.user) {
    state.notes = loadNotesForUser(state.user.id);
    state.documents = loadDocumentsForUser(state.user.id);
    saveNotes();
    saveDocuments();
}
renderAuthState();
renderAll();
