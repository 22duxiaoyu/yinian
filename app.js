const LEGACY_STORAGE_KEY = "yinian-lite-notes-v1";
const USERS_KEY = "yinian-lite-users-v1";
const ACTIVE_USER_KEY = "yinian-lite-active-user-v1";
const MIGRATED_KEY = "yinian-lite-legacy-migrated-v1";
const NOTES_PREFIX = "yinian-lite-notes-v2:";
const DOCUMENTS_PREFIX = "action-imported-documents-v1:";
const PROFILE_PREFIX = "action-local-profile-v1:";
const INSIGHTS_PREFIX = "action-local-insights-v1:";
const WEEKLY_PREFIX = "action-local-weekly-v1:";
const EVENTS_PREFIX = "action-local-events-v1:";
const FEEDBACK_PREFIX = "action-local-feedback-v1:";
const DEFAULT_PREFERENCES = { startView: "overview", reduceMotion: false };
const DEMO_USER = {
    id: "portfolio-demo",
    name: "作品集访客",
    passHash: "demo-space",
    createdAt: "2026-07-01T08:00:00.000Z",
};

const typeLabels = { idea: "灵感", diary: "观察", review: "复盘", task: "行动" };
const typeIcons = { idea: "i-spark", diary: "i-quote", review: "i-trend", task: "i-check" };
const viewLabels = { overview: "工作台", library: "灵感库", insights: "洞察", actions: "行动", weekly: "周报", method: "产品方法" };
const resultOutcomeLabels = { supported: "支持判断", unclear: "结果待观察", disproved: "不支持原判断" };

const state = {
    user: loadActiveUser(),
    notes: [],
    documents: [],
    insights: [],
    weeklyReport: null,
    weeklyReports: [],
    cloudEnabled: false,
    cloudHydrating: false,
    cloudUnsubscribe: null,
    localMigrationCandidate: null,
    authMode: "login",
    view: "overview",
    filter: "all",
    query: "",
    sort: "newest",
    editingId: null,
    selectedId: null,
    flashTaskId: null,
    expandedLibraryCardId: null,
    analyzing: false,
    pendingAvatarFile: null,
    pendingAvatarUrl: null,
    pendingAvatarRemoved: false,
    pendingTaskFeedbackId: null,
    pendingSourceInsightKey: "",
    selectedWeeklyStart: "",
};

const el = {
    authScreen: document.querySelector("#authScreen"),
    authForm: document.querySelector("#authForm"),
    authName: document.querySelector("#authName"),
    authPasscode: document.querySelector("#authPasscode"),
    authMessage: document.querySelector("#authMessage"),
    authNameLabel: document.querySelector("#authNameLabel"),
    authPasscodeLabel: document.querySelector("#authPasscodeLabel"),
    authDividerText: document.querySelector("#authDividerText"),
    authSubmitButton: document.querySelector("#authSubmitButton"),
    registerButton: document.querySelector("#registerButton"),
    authLoginTab: document.querySelector("#authLoginTab"),
    authModeSwitch: document.querySelector("#authModeSwitch"),
    authConfirmWrap: document.querySelector("#authConfirmWrap"),
    authConfirmPasscode: document.querySelector("#authConfirmPasscode"),
    authStatus: document.querySelector("#authStatus"),
    authStatusTitle: document.querySelector("#authStatusTitle"),
    resendVerification: document.querySelector("#resendVerification"),
    authSuccess: document.querySelector("#authSuccess"),
    authSuccessTitle: document.querySelector("#authSuccessTitle"),
    authSuccessCopy: document.querySelector("#authSuccessCopy"),
    authSuccessEmail: document.querySelector("#authSuccessEmail"),
    authSuccessLogin: document.querySelector("#authSuccessLogin"),
    authSuccessResend: document.querySelector("#authSuccessResend"),
    demoButton: document.querySelector("#demoButton"),
    spaceName: document.querySelector("#spaceName"),
    activeUserName: document.querySelector("#activeUserName"),
    activeUserMeta: document.querySelector("#activeUserMeta"),
    userAvatar: document.querySelector("#userAvatar"),
    userAvatarImage: document.querySelector("#userAvatarImage"),
    userInitial: document.querySelector("#userInitial"),
    profileButton: document.querySelector("#profileButton"),
    profileMenu: document.querySelector("#profileMenu"),
    profileMenuName: document.querySelector("#profileMenuName"),
    profileMenuEmail: document.querySelector("#profileMenuEmail"),
    settingsButton: document.querySelector("#settingsButton"),
    settingsModal: document.querySelector("#settingsModal"),
    settingsForm: document.querySelector("#settingsForm"),
    settingsDisplayName: document.querySelector("#settingsDisplayName"),
    settingsStartView: document.querySelector("#settingsStartView"),
    settingsReduceMotion: document.querySelector("#settingsReduceMotion"),
    settingsAvatarInput: document.querySelector("#settingsAvatarInput"),
    settingsAvatarImage: document.querySelector("#settingsAvatarImage"),
    settingsAvatarInitial: document.querySelector("#settingsAvatarInitial"),
    settingsProfileName: document.querySelector("#settingsProfileName"),
    settingsProfileEmail: document.querySelector("#settingsProfileEmail"),
    settingsSave: document.querySelector("#settingsSave"),
    settingsSaveHint: document.querySelector("#settingsSaveHint"),
    removeAvatar: document.querySelector("#removeAvatar"),
    logoutButton: document.querySelector("#logoutButton"),
    logoutLabel: document.querySelector("#logoutLabel"),
    engineStatusTitle: document.querySelector("#engineStatusTitle"),
    engineStatusCopy: document.querySelector("#engineStatusCopy"),
    exportButton: document.querySelector("#exportNotes"),
    importInput: document.querySelector("#importNotes"),
    productFeedbackScore: document.querySelector("#productFeedbackScore"),
    productFeedbackMessage: document.querySelector("#productFeedbackMessage"),
    submitProductFeedback: document.querySelector("#submitProductFeedback"),
    showDeleteAccount: document.querySelector("#showDeleteAccount"),
    deleteAccountConfirm: document.querySelector("#deleteAccountConfirm"),
    deleteAccountInput: document.querySelector("#deleteAccountInput"),
    deleteAccountButton: document.querySelector("#deleteAccountButton"),
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
    weeklyHistorySelect: document.querySelector("#weeklyHistorySelect"),
    weeklyTrend: document.querySelector("#weeklyTrend"),
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
    actionFeedbackModal: document.querySelector("#actionFeedbackModal"),
    actionFeedbackForm: document.querySelector("#actionFeedbackForm"),
    actionFeedbackTitle: document.querySelector("#actionFeedbackTitle"),
    actionResultText: document.querySelector("#actionResultText"),
    actionResultOutcome: document.querySelector("#actionResultOutcome"),
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

function normalizePreferences(value) {
    const preferences = value && typeof value === "object" ? value : {};
    return {
        startView: viewLabels[preferences.startView] ? preferences.startView : DEFAULT_PREFERENCES.startView,
        reduceMotion: Boolean(preferences.reduceMotion),
    };
}

function loadLocalProfile(userId) {
    try {
        const profile = JSON.parse(localStorage.getItem(`${PROFILE_PREFIX}${userId}`) || "{}");
        return profile && typeof profile === "object" ? profile : {};
    } catch {
        return {};
    }
}

function mergeLocalProfile(user) {
    if (!user) return null;
    const profile = loadLocalProfile(user.id);
    return {
        ...user,
        name: String(profile.name || user.name || "Action 用户"),
        avatarData: profile.avatarData || null,
        preferences: normalizePreferences(profile.preferences || user.preferences),
    };
}

function saveLocalProfile(user) {
    localStorage.setItem(`${PROFILE_PREFIX}${user.id}`, JSON.stringify({
        name: user.name,
        avatarData: user.avatarData || null,
        preferences: normalizePreferences(user.preferences),
    }));
}

function loadActiveUser() {
    const id = localStorage.getItem(ACTIVE_USER_KEY);
    if (!id) return null;
    if (id === DEMO_USER.id) return mergeLocalProfile(DEMO_USER);
    return mergeLocalProfile(loadUsers().find((user) => user.id === id) || null);
}

function notesKey(userId) {
    return `${NOTES_PREFIX}${userId}`;
}

function documentsKey(userId) {
    return `${DOCUMENTS_PREFIX}${userId}`;
}

function insightsKey(userId) {
    return `${INSIGHTS_PREFIX}${userId}`;
}

function weeklyKey(userId) {
    return `${WEEKLY_PREFIX}${userId}`;
}

function eventsKey(userId) {
    return `${EVENTS_PREFIX}${userId}`;
}

function feedbackKey(userId) {
    return `${FEEDBACK_PREFIX}${userId}`;
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
        extractedText: String(source.extractedText || "").slice(0, 30000),
        keywords: Array.isArray(source.keywords) ? source.keywords.map(String).filter(Boolean).slice(0, 6) : [],
        cards: cards.map((card) => ({
            label: String(card?.label || "卡片"),
            title: String(card?.title || "待整理信息"),
            body: String(card?.body || "导入后会自动生成可浏览的资料卡片。"),
        })).slice(0, 4),
        parsedAt: source.parsedAt || now,
        storagePath: source.storagePath || null,
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
    queueCloudSync("documents");
}

function loadLocalInsights(userId) {
    try {
        const value = JSON.parse(localStorage.getItem(insightsKey(userId)) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function saveLocalInsights() {
    if (!state.user || state.user.cloud) return;
    localStorage.setItem(insightsKey(state.user.id), JSON.stringify(state.insights));
}

function loadLocalWeeklyReports(userId) {
    try {
        const value = JSON.parse(localStorage.getItem(weeklyKey(userId)) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function saveLocalWeeklyReports() {
    if (!state.user || state.user.cloud) return;
    localStorage.setItem(weeklyKey(state.user.id), JSON.stringify(state.weeklyReports.slice(0, 12)));
}

function trackEvent(eventName, properties = {}) {
    if (!state.user) return;
    const safeProperties = Object.fromEntries(Object.entries(properties).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)));
    const event = { eventName, page: state.view, properties: safeProperties, createdAt: new Date().toISOString() };
    if (state.user.cloud && state.cloudEnabled) {
        window.ActionCloud.trackEvent(state.user.id, eventName, state.view, safeProperties).catch(() => {});
        return;
    }
    try {
        const stored = JSON.parse(localStorage.getItem(eventsKey(state.user.id)) || "[]");
        const events = Array.isArray(stored) ? stored : [];
        localStorage.setItem(eventsKey(state.user.id), JSON.stringify([...events.slice(-199), event]));
    } catch {
        localStorage.setItem(eventsKey(state.user.id), JSON.stringify([event]));
    }
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
        sourceInsightKey: String(source.sourceInsightKey || ""),
        resultText: String(source.resultText || ""),
        resultOutcome: ["supported", "unclear", "disproved"].includes(source.resultOutcome) ? source.resultOutcome : "",
        completedAt: source.completedAt || (source.done ? source.updatedAt || createdAt : null),
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
    queueCloudSync("notes");
}

const cloudSyncTimers = { notes: null, documents: null, refresh: null };

function queueCloudSync(kind) {
    if (!state.cloudEnabled || !state.user?.cloud || state.cloudHydrating) return;
    window.clearTimeout(cloudSyncTimers[kind]);
    cloudSyncTimers[kind] = window.setTimeout(async () => {
        try {
            if (kind === "notes") await window.ActionCloud.syncNotes(state.user.id, state.notes);
            if (kind === "documents") await window.ActionCloud.syncDocuments(state.user.id, state.documents);
            el.engineStatusCopy.textContent = `刚刚同步 · ${state.user.email}`;
        } catch (error) {
            console.error("Action cloud sync failed", error);
            el.engineStatusCopy.textContent = "同步暂时中断 · 本机副本仍已保存";
            showToast("云端同步暂时失败，本机副本仍然安全");
        }
    }, 420);
}

async function refreshCloudWorkspace({ render = true } = {}) {
    if (!state.cloudEnabled || !state.user?.cloud) return;
    const workspace = await window.ActionCloud.loadWorkspace({
        id: state.user.id,
        email: state.user.email,
        user_metadata: { display_name: state.user.name },
    });
    state.cloudHydrating = true;
    state.user = { ...workspace.user, preferences: normalizePreferences(workspace.user.preferences) };
    state.notes = workspace.notes.map(normalizeNote);
    state.documents = workspace.documents.map(normalizeDocumentImport);
    state.insights = workspace.insights;
    state.weeklyReport = workspace.weeklyReport;
    state.weeklyReports = workspace.weeklyReports || (workspace.weeklyReport ? [workspace.weeklyReport] : []);
    localStorage.setItem(ACTIVE_USER_KEY, state.user.id);
    localStorage.setItem(notesKey(state.user.id), JSON.stringify(state.notes));
    localStorage.setItem(documentsKey(state.user.id), JSON.stringify(state.documents));
    state.cloudHydrating = false;
    if (render) {
        renderAuthState();
        renderAll();
    }
}

function subscribeToCloudWorkspace() {
    state.cloudUnsubscribe?.();
    if (!state.user?.cloud) return;
    state.cloudUnsubscribe = window.ActionCloud.subscribe(state.user.id, () => {
        window.clearTimeout(cloudSyncTimers.refresh);
        cloudSyncTimers.refresh = window.setTimeout(() => refreshCloudWorkspace().catch(console.error), 500);
    });
}

async function activateCloudUser(authUser) {
    const workspace = await window.ActionCloud.loadWorkspace(authUser);
    const migration = state.localMigrationCandidate;
    const shouldMigrate = workspace.notes.length === 0 && workspace.documents.length === 0 && migration && migration.user?.id !== DEMO_USER.id;
    if (shouldMigrate) {
        workspace.notes = migration.notes.map(normalizeNote);
        workspace.documents = migration.documents.map(normalizeDocumentImport);
        await Promise.all([
            window.ActionCloud.syncNotes(authUser.id, workspace.notes),
            window.ActionCloud.syncDocuments(authUser.id, workspace.documents),
        ]);
        showToast(`已把本机的 ${workspace.notes.length + workspace.documents.length} 条内容迁移到云端`);
    }
    state.cloudHydrating = true;
    state.user = { ...workspace.user, preferences: normalizePreferences(workspace.user.preferences) };
    state.notes = workspace.notes.map(normalizeNote);
    state.documents = workspace.documents.map(normalizeDocumentImport);
    state.insights = workspace.insights;
    state.weeklyReport = workspace.weeklyReport;
    state.weeklyReports = workspace.weeklyReports || (workspace.weeklyReport ? [workspace.weeklyReport] : []);
    state.view = state.user.preferences.startView;
    localStorage.setItem(ACTIVE_USER_KEY, state.user.id);
    localStorage.setItem(notesKey(state.user.id), JSON.stringify(state.notes));
    localStorage.setItem(documentsKey(state.user.id), JSON.stringify(state.documents));
    state.cloudHydrating = false;
    subscribeToCloudWorkspace();
    renderAuthState();
    renderAll();
}

function setActiveUser(user) {
    state.cloudUnsubscribe?.();
    state.cloudUnsubscribe = null;
    state.user = user?.cloud ? { ...user, preferences: normalizePreferences(user.preferences) } : mergeLocalProfile(user);
    if (user) {
        localStorage.setItem(ACTIVE_USER_KEY, user.id);
        state.notes = loadNotesForUser(user.id);
        state.documents = loadDocumentsForUser(user.id);
        state.insights = loadLocalInsights(user.id);
        state.weeklyReports = loadLocalWeeklyReports(user.id);
        state.weeklyReport = state.weeklyReports[0] || null;
        saveNotes();
        saveDocuments();
    } else {
        localStorage.removeItem(ACTIVE_USER_KEY);
        state.notes = [];
        state.documents = [];
        state.insights = [];
        state.weeklyReport = null;
        state.weeklyReports = [];
    }
    state.view = state.user?.preferences?.startView || "overview";
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

function getEvidenceForInsight(insight) {
    const refs = new Set((insight?.evidenceRefs || []).map(String));
    if (refs.size) {
        const exact = activeSources().filter((source) => refs.has(String(source.sourceId)));
        if (exact.length) return exact.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return getEvidence(insight?.topic || "");
}

function buildInsights() {
    if (state.insights.length) return state.insights;
    if (state.user?.cloud && !activeSources().length) {
        return [{
            id: "empty",
            label: "等待输入",
            topic: "证据不足",
            title: "先记录几条真实变化，再让 AI 帮你寻找模式。",
            detail: "当前空间还没有可分析的内容。系统不会在没有依据时生成判断。",
            evidence: 0,
            confidence: 0,
            accent: "#667d92",
            status: "empty",
            evidenceRefs: [],
        }];
    }
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
            status: "pending",
            evidenceRefs: evidence.map((source) => source.sourceId).slice(0, 12),
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
            status: "pending",
            evidenceRefs: getEvidence("卡住").map((source) => source.sourceId).slice(0, 12),
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
            status: "pending",
            evidenceRefs: getEvidence("行动反馈").map((source) => source.sourceId).slice(0, 12),
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
        extractedText: text.slice(0, 30000),
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
    const sourceCountBeforeImport = activeSources().length;
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
            const document = await parseImportedDocument(file);
            if (state.user?.cloud) await window.ActionCloud.uploadDocument(state.user.id, file, document);
            parsed.push(document);
        }
        const existingNames = new Set(parsed.map((item) => item.name));
        state.documents = [...parsed, ...state.documents.filter((item) => !existingNames.has(item.name))].slice(0, 10);
        state.expandedLibraryCardId = null;
        saveDocuments();
        parsed.forEach((document) => trackEvent("document_imported", { document_id: document.id, kind: document.kind, status: document.status }));
        const sourceCountAfterImport = activeSources().length;
        if (sourceCountBeforeImport < 1 && sourceCountAfterImport >= 1) trackEvent("first_input_saved", { source_type: "document" });
        if (sourceCountBeforeImport < 3 && sourceCountAfterImport >= 3) trackEvent("third_source_added", { source_type: "document" });
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
    trackEvent("source_saved", { source_type: "idea", is_edit: false, source_document_id: item.id });
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

function configureCloudUi() {
    if (!state.cloudEnabled) return;
    el.authModeSwitch.hidden = false;
    el.authDividerText.textContent = "或先体验";
    el.authNameLabel.textContent = "邮箱";
    el.authPasscodeLabel.textContent = "密码";
    el.authName.type = "email";
    el.authName.maxLength = 254;
    el.authName.placeholder = "name@example.com";
    el.authPasscode.minLength = 6;
    el.authPasscode.placeholder = "至少 6 位";
    setAuthMode("login");
}

function setAuthMode(mode) {
    state.authMode = mode === "register" ? "register" : "login";
    const registering = state.authMode === "register";
    el.authLoginTab?.classList.toggle("active", !registering);
    el.registerButton?.classList.toggle("active", registering);
    el.authLoginTab?.setAttribute("aria-selected", String(!registering));
    el.registerButton?.setAttribute("aria-selected", String(registering));
    el.authConfirmWrap.hidden = !registering;
    el.authConfirmPasscode.required = registering;
    el.authForm.classList.toggle("register-mode", registering);
    el.authSubmitButton.textContent = registering ? "创建账号" : "登录";
    el.authPasscode.autocomplete = registering ? "new-password" : "current-password";
    el.resendVerification.hidden = true;
    setAuthMessage(
        registering ? "注册后需要验证邮箱，点击邮件链接会自动进入 Action。" : "使用已注册的邮箱和密码登录。",
        false,
        registering ? "创建云端账号" : "登录云端空间",
    );
}

function showAuthSuccess(email, autoEntering = false) {
    el.authSuccessTitle.textContent = "注册成功";
    el.authSuccessCopy.textContent = autoEntering
        ? "账号已经创建，正在进入你的云端空间。"
        : "验证邮件已经发送。请点击邮件里的验证链接，验证后会自动进入 Action，不需要再次登录。";
    el.authSuccessEmail.textContent = email;
    el.authSuccessLogin.hidden = autoEntering;
    el.authSuccessResend.hidden = autoEntering;
    el.authSuccess.hidden = false;
    el.authSuccess.setAttribute("aria-hidden", "false");
}

function hideAuthSuccess() {
    el.authSuccess.hidden = true;
    el.authSuccess.setAttribute("aria-hidden", "true");
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

function getUserAvatarUrl(user = state.user) {
    return user?.avatarUrl || user?.avatarData || "";
}

function renderAvatar(image, initial, name, avatarUrl) {
    const hasAvatar = Boolean(avatarUrl);
    image.hidden = !hasAvatar;
    image.src = hasAvatar ? avatarUrl : "";
    initial.hidden = hasAvatar;
    initial.textContent = String(name || "A").trim().slice(0, 1).toUpperCase() || "A";
}

function applyUserPreferences() {
    const preferences = normalizePreferences(state.user?.preferences);
    document.documentElement.classList.toggle("user-reduce-motion", preferences.reduceMotion);
}

function renderUser() {
    const name = state.user?.name || "作品集访客";
    el.spaceName.textContent = state.user?.id === DEMO_USER.id ? "AI 产品经理作品集" : `${name}的思考空间`;
    el.activeUserName.textContent = name;
    const cloud = Boolean(state.user?.cloud);
    el.activeUserMeta.textContent = cloud ? "云端个人空间" : "本地演示空间";
    el.profileMenuName.textContent = name;
    el.profileMenuEmail.textContent = cloud ? state.user.email : "本地个人空间";
    el.logoutLabel.textContent = cloud ? "退出登录" : "退出示例";
    renderAvatar(el.userAvatarImage, el.userInitial, name, getUserAvatarUrl());
    el.engineStatusTitle.textContent = cloud ? "云端同步已连接" : "本地洞察引擎";
    el.engineStatusCopy.textContent = cloud ? `跨设备同步 · ${state.user.email}` : "前端验证版 · 数据仅保存在本机";
    document.querySelector("#greetingTitle").textContent = `${getGreeting()}，${name}。今天先推进一件事。`;
    applyUserPreferences();
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
    const scored = insights.filter((item) => item.status !== "empty");
    const average = scored.length ? Math.round(scored.reduce((sum, item) => sum + item.confidence, 0) / scored.length) : 0;
    const hero = document.querySelector(".insight-decision-hero");
    const confirm = document.querySelector("#insightLeadConfirm");
    const reject = document.querySelector("#insightLeadReject");
    const action = document.querySelector("#insightLeadAction");
    const evidenceButton = document.querySelector("#insightLeadEvidence");
    const status = lead.status || "pending";

    document.querySelector("#insightSourceSummary").textContent = `${recentSources.length} 条内容 · 最近 14 天`;
    document.querySelector("#insightConsensus").textContent = lead.title;
    document.querySelector("#insightConsensusDetail").textContent = lead.detail;
    setAnimatedNumber(document.querySelector("#insightScore"), average);
    document.querySelector(".confidence-ring").style.setProperty("--score", average);
    evidenceButton.dataset.openEvidence = lead.topic;
    evidenceButton.dataset.insightKey = lead.id;
    evidenceButton.hidden = status === "empty";

    hero.classList.toggle("is-confirmed", status === "confirmed");
    hero.classList.toggle("is-rejected", status === "rejected");
    confirm.hidden = status === "rejected" || status === "empty";
    confirm.disabled = status === "confirmed";
    confirm.innerHTML = status === "confirmed" ? `<svg><use href="#i-check" /></svg>已确认` : `<svg><use href="#i-check" /></svg>确认洞察`;
    reject.hidden = status === "confirmed" || status === "empty";
    reject.disabled = status === "rejected";
    reject.textContent = status === "rejected" ? "已暂不采纳" : "暂不采纳";
    action.hidden = status !== "confirmed";
    action.dataset.insightKey = lead.id;

    const secondaryInsights = insights.slice(1, 2);
    document.querySelector("#insightSecondaryCount").textContent = `${secondaryInsights.length} 条`;
    el.insightGrid.innerHTML = secondaryInsights.map((insight, index) => `
        <article class="insight-card" style="--accent:${insight.accent}">
            <div class="insight-card-head"><span>0${index + 2} / ${escapeHtml(insight.label)}</span><em>${insight.confidence}% 可信</em></div>
            <h3>${escapeHtml(insight.title)}</h3>
            <p>${escapeHtml(insight.detail)}</p>
            <footer><button data-open-evidence="${escapeHtml(insight.topic)}" data-insight-key="${escapeHtml(insight.id)}" type="button">查看 ${insight.evidence} 条依据 →</button><span>${insight.status === "confirmed" ? "已确认" : insight.status === "rejected" ? "已驳回" : "AI 生成 · 待确认"}</span></footer>
        </article>`).join("");

    const decisionInsights = insights.slice(1);
    const pendingCount = insights.filter((item) => (item.status || "pending") === "pending").length;
    document.querySelector("#insightDecisionCount").textContent = `${pendingCount} 个待确认`;
    el.assumptionTable.innerHTML = decisionInsights.length ? decisionInsights.map((insight) => {
        const insightStatus = insight.status || "pending";
        const statusLabel = insightStatus === "confirmed" ? "已由你确认" : insightStatus === "rejected" ? "已驳回 · 不再使用" : `${insight.evidence} 条依据 · ${insight.confidence}% 可信`;
        return `<div class="assumption-row" data-insight-key="${escapeHtml(insight.id)}">
            <div><strong>${escapeHtml(insight.title)}</strong><p>${escapeHtml(summarize(insight.detail, 76))}</p></div>
            <span class="assumption-status" data-status="${insightStatus}">${statusLabel}</span>
            <div class="assumption-actions"><button data-assumption-action="confirmed" type="button" ${insightStatus !== "pending" ? "disabled" : ""}>确认</button><button data-assumption-action="rejected" type="button" ${insightStatus !== "pending" ? "disabled" : ""}>驳回</button></div>
        </div>`;
    }).join("") : `<div class="action-empty">暂无其他待确认判断</div>`;
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
            <div><strong>${escapeHtml(note.title)}</strong><p>${escapeHtml(summarize(note.resultText || note.content, 82))}</p><footer><span>${note.resultOutcome ? escapeHtml(resultOutcomeLabels[note.resultOutcome]) : note.tags[0] ? `#${escapeHtml(note.tags[0])}` : "个人行动"}</span><time>${formatRelative(note.completedAt || note.createdAt)}</time></footer></div>
        </article>`).join("");
}

function startOfWeek(value = new Date()) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1);
    return date;
}

function dateKey(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weeklyBounds(report = null) {
    const start = report?.weekStart ? new Date(`${report.weekStart}T00:00:00`) : startOfWeek();
    const end = report?.weekEnd ? new Date(`${report.weekEnd}T23:59:59.999`) : new Date(start);
    if (!report?.weekEnd) end.setDate(start.getDate() + 6);
    return { start, end };
}

function inDateRange(value, bounds) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && date >= bounds.start && date <= bounds.end;
}

function reportMetric(report, key, fallback = 0) {
    const value = Number(report?.report?.[key]);
    return Number.isFinite(value) ? value : fallback;
}

function signedDelta(value) {
    if (!value) return "持平";
    return `${value > 0 ? "+" : ""}${value}`;
}

function updateLocalWeeklySnapshot() {
    if (!state.user || state.user.cloud) return null;
    const bounds = weeklyBounds();
    const week = activeSources().filter((source) => inDateRange(source.createdAt, bounds));
    const tasks = activeNotes().filter((note) => note.type === "task" && inDateRange(note.updatedAt, bounds));
    const completed = tasks.filter((note) => note.done && inDateRange(note.completedAt || note.updatedAt, bounds));
    const lead = buildInsights()[0];
    const layout = week.length <= 3 ? "sparse" : week.length >= 9 ? "dense" : "balanced";
    const report = {
        layout,
        theme: lead.title,
        summary: lead.detail,
        topics: [...new Set([lead.topic, ...week.flatMap((source) => source.tags)])].filter(Boolean).slice(0, 6),
        explanation: "这份本地周报根据当周输入密度自动调整结构，并保留生成时的阶段性判断。",
        action_feedback: completed.length ? `已有 ${completed.length} 个行动结果进入下一轮判断。` : "本周还缺少行动结果，当前判断仍需验证。",
        next_experiment: {
            title: `为“${lead.topic}”完成一次最小验证`,
            detail: "用一个 15 分钟内可开始的动作记录真实结果，再决定是否继续。",
            duration_days: 5,
            minutes_per_day: 15,
            metric: "实际开始时间",
            success_criteria: "更快开始并留下可复核结果",
        },
        input_count: week.length,
        action_count: tasks.length,
        completed_action_count: completed.length,
        insight_key: lead.id,
        insight_topic: lead.topic,
        insight_confidence: lead.confidence,
        evidence_count: lead.evidence,
        evidence_refs: lead.evidenceRefs || [],
    };
    const snapshot = {
        id: `local-${dateKey(bounds.start)}`,
        weekStart: dateKey(bounds.start),
        weekEnd: dateKey(bounds.end),
        layout,
        theme: lead.title,
        report,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    state.weeklyReport = snapshot;
    state.weeklyReports = [snapshot, ...state.weeklyReports.filter((item) => item.weekStart !== snapshot.weekStart)].slice(0, 12);
    saveLocalWeeklyReports();
    return snapshot;
}

function renderWeekly() {
    const currentWeekStart = dateKey(startOfWeek());
    const reports = [...state.weeklyReports].filter(Boolean).sort((a, b) => String(b.weekStart).localeCompare(String(a.weekStart)));
    const currentReport = reports.find((report) => report.weekStart === currentWeekStart) || (state.weeklyReport?.weekStart === currentWeekStart ? state.weeklyReport : null);
    const availableKeys = new Set([currentWeekStart, ...reports.map((report) => report.weekStart)]);
    if (!state.selectedWeeklyStart || !availableKeys.has(state.selectedWeeklyStart)) state.selectedWeeklyStart = currentWeekStart;
    const selectedReport = state.selectedWeeklyStart === currentWeekStart ? currentReport : reports.find((report) => report.weekStart === state.selectedWeeklyStart);
    const historical = Boolean(selectedReport && state.selectedWeeklyStart !== currentWeekStart);
    const bounds = weeklyBounds(selectedReport);
    const week = activeSources().filter((source) => inDateRange(source.createdAt, bounds));
    const tasks = activeNotes().filter((note) => note.type === "task" && inDateRange(note.updatedAt, bounds));
    const done = tasks.filter((note) => note.done && inDateRange(note.completedAt || note.updatedAt, bounds));
    const cloudReport = selectedReport?.report || null;
    const inputCount = historical ? reportMetric(selectedReport, "input_count", week.length) : week.length;
    const actionCount = historical ? reportMetric(selectedReport, "action_count", tasks.length) : tasks.length;
    const completedCount = historical ? reportMetric(selectedReport, "completed_action_count", done.length) : done.length;
    const rate = actionCount ? Math.round((completedCount / actionCount) * 100) : 0;
    const currentLead = buildInsights()[0];
    const reportTopics = Array.isArray(cloudReport?.topics) ? cloudReport.topics.map(String) : [];
    const lead = historical ? {
        ...currentLead,
        id: String(cloudReport?.insight_key || "weekly-snapshot"),
        topic: String(cloudReport?.insight_topic || reportTopics[0] || "本周核心判断"),
        title: String(cloudReport?.theme || selectedReport?.theme || "本周仍在积累判断"),
        detail: String(cloudReport?.summary || "这份历史周报保留了当周的阶段性判断。"),
        evidence: reportMetric(selectedReport, "evidence_count", inputCount),
        confidence: reportMetric(selectedReport, "insight_confidence", currentLead.confidence),
        evidenceRefs: Array.isArray(cloudReport?.evidence_refs) ? cloudReport.evidence_refs.map(String) : [],
    } : currentLead;
    const inferredLayout = week.length <= 3 ? "sparse" : week.length >= 9 ? "dense" : "balanced";
    const layout = ["sparse", "balanced", "dense"].includes(cloudReport?.layout) ? cloudReport.layout : inferredLayout;
    const topicLimit = layout === "dense" ? 6 : layout === "sparse" ? 2 : 4;
    const topics = [...new Set([...reportTopics, lead.topic, ...week.flatMap((source) => source.tags)])].filter(Boolean).slice(0, topicLimit);
    const reportEvidenceRefs = new Set((lead.evidenceRefs || []).map(String));
    const weeklyEvidence = week.filter((source) => reportEvidenceRefs.has(String(source.sourceId)) || source.tags.includes(lead.topic) || `${source.title} ${source.content}`.includes(lead.topic));
    const evidencePool = weeklyEvidence.length ? weeklyEvidence : week;
    const evidenceLimit = layout === "dense" ? 4 : layout === "sparse" ? 1 : 2;
    const reportElement = document.querySelector(".weekly-map-report");
    reportElement.dataset.layout = layout;
    reportElement.dataset.hasActions = String(actionCount > 0);
    el.weeklyHistorySelect.innerHTML = [
        `<option value="${currentWeekStart}">本周实时简报</option>`,
        ...reports.filter((report) => report.weekStart !== currentWeekStart).map((report) => `<option value="${escapeHtml(report.weekStart)}">${escapeHtml(new Date(`${report.weekStart}T00:00:00`).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }))} 当周</option>`),
    ].join("");
    el.weeklyHistorySelect.value = state.selectedWeeklyStart;
    const liveStatus = document.querySelector(".weekly-live-status");
    liveStatus.innerHTML = historical ? "<i></i>历史周报快照" : "<i></i>随输入实时更新";
    document.querySelector("#weeklyRange").textContent = `${bounds.start.getMonth() + 1} 月 ${bounds.start.getDate()} 日 - ${bounds.end.getMonth() + 1} 月 ${bounds.end.getDate()} 日`;
    document.querySelector("#weeklyDate").textContent = `${bounds.end.getFullYear()}.${String(bounds.end.getMonth() + 1).padStart(2, "0")}.${String(bounds.end.getDate()).padStart(2, "0")}`;
    const previousReport = reports.find((report) => report.weekStart < state.selectedWeeklyStart);
    if (previousReport) {
        const previousInput = reportMetric(previousReport, "input_count");
        const previousDone = reportMetric(previousReport, "completed_action_count");
        const previousActions = reportMetric(previousReport, "action_count");
        const previousRate = previousActions ? Math.round((previousDone / previousActions) * 100) : 0;
        el.weeklyTrend.innerHTML = `<span>与上一份周报相比</span><div><strong>输入 ${signedDelta(inputCount - previousInput)}</strong><strong>完成 ${signedDelta(completedCount - previousDone)}</strong><strong>完成率 ${signedDelta(rate - previousRate)}%</strong></div><p>趋势只用于观察变化，不替代对原始证据的判断。</p>`;
    } else {
        el.weeklyTrend.innerHTML = `<span>周期趋势</span><div><strong>第一份可比较周报</strong></div><p>保留下一周数据后，这里会显示输入、行动与完成率变化。</p>`;
    }
    document.querySelector("#weeklyLayoutLabel").textContent = layout === "sparse" ? "AI 精简布局" : layout === "dense" ? "AI 深度布局" : "AI 标准布局";
    document.querySelector("#weeklyLayoutSummary").textContent = cloudReport?.explanation || (layout === "sparse"
        ? "本周信息量较少，先保留核心判断与最关键的依据，避免过度总结。"
        : layout === "dense"
          ? "本周输入较多，AI 已展开更多主题和原始证据，帮助你检查结论是否可靠。"
          : "中心是本周核心判断，四个分支分别说明它从哪里来、如何被验证，以及下一步去哪里。");
    document.querySelector("#weeklyTheme").textContent = cloudReport?.theme || selectedReport?.theme || (lead.topic === "启动成本" ? "从“把事情想清楚”转向“先做出一个可以验证的版本”。" : `本周最稳定的思考主线是“${lead.topic}”，它正在影响你的行动选择。`);
    document.querySelector("#weeklyRepeatTitle").textContent = lead.topic;
    document.querySelector("#weeklyMapInsight").textContent = lead.topic;
    document.querySelector("#weeklyRepeatCopy").textContent = cloudReport?.summary || lead.detail;
    document.querySelector("#weeklyHeaderInputs").textContent = inputCount;
    document.querySelector("#weeklyHeaderDone").textContent = completedCount;
    document.querySelector("#weeklyHeaderRate").textContent = `${rate}%`;
    document.querySelector("#weeklyInputCount").textContent = inputCount;
    document.querySelector("#weeklyInsightScore").textContent = lead.confidence;
    document.querySelector("#weeklyDoneCount").textContent = completedCount;
    document.querySelector("#weeklyEvidenceCount").textContent = `${lead.evidence} 条依据`;
    document.querySelector("#weeklyEvidenceButton").dataset.openEvidence = lead.topic;
    document.querySelector("#weeklyEvidenceButton").dataset.insightKey = lead.id || "";
    document.querySelector("#weeklyTopicList").innerHTML = topics.length ? topics.map((topic) => `<span>#${escapeHtml(topic)}</span>`).join("") : "<span>等待更多输入</span>";
    document.querySelector("#weeklyProgressLabel").textContent = actionCount ? `${rate}% 完成` : "等待行动反馈";
    document.querySelector("#weeklyActionCopy").textContent = cloudReport?.action_feedback || (completedCount ? `本周已有 ${completedCount} 个结果进入反馈，后续洞察会优先参考这些真实行动。` : "本周还缺少完成后的真实反馈，先完成一个最小行动再回来看结论。");
    const nextExperiment = cloudReport?.next_experiment && typeof cloudReport.next_experiment === "object" ? cloudReport.next_experiment : null;
    document.querySelector("#weeklyNextTitle").textContent = nextExperiment?.title || (lead.topic === "启动成本" ? "把下一步缩小到 15 分钟" : `为“${lead.topic}”做一次最小验证`);
    document.querySelector("#weeklyNextCopy").textContent = nextExperiment?.detail || (lead.topic === "启动成本" ? "连续测试 5 天，记录实际开始时间和完成感受，再判断它是否有效。" : `用一个低成本行动验证“${lead.topic}”是否真的影响本周推进。`);
    document.querySelector("#weeklyEvidenceSamples").innerHTML = evidencePool.slice(0, evidenceLimit).map((source) => `
        <article ${source.sourceKind === "document" ? `data-document-id="${escapeHtml(source.sourceId)}"` : `data-note-id="${escapeHtml(source.sourceId)}"`}>
            <span>${source.sourceKind === "document" ? escapeHtml(source.documentKind) : typeLabels[source.type]}</span>
            <strong>${escapeHtml(source.title)}</strong>
            <p>${escapeHtml(summarize(source.content, 58))}</p>
        </article>`).join("") || `<p class="weekly-no-evidence">这份周报没有保留可展示的原始依据。</p>`;
    document.querySelector("#weeklySourceCount").textContent = `基于 ${inputCount} 条当周输入与 ${actionCount} 个行动${historical ? " · 历史快照" : ""}`;
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
    trackEvent("page_viewed", { destination: view });
    if (view === "weekly") trackEvent("weekly_report_viewed", { week_start: state.selectedWeeklyStart || dateKey(startOfWeek()) });
    const activePanel = document.querySelector(`[data-view-panel="${view}"]`);
    const reduceMotion = document.documentElement.classList.contains("user-reduce-motion") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (activePanel && !reduceMotion) {
        activePanel.classList.remove("motion-enter");
        void activePanel.offsetWidth;
        activePanel.classList.add("motion-enter");
        window.clearTimeout(activePanel.motionTimer);
        activePanel.motionTimer = window.setTimeout(() => activePanel.classList.remove("motion-enter"), 720);
    }
    el.sidebar.classList.remove("open");
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
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

function setSettingsAvatarPreview(avatarUrl, name = el.settingsDisplayName.value || state.user?.name) {
    renderAvatar(el.settingsAvatarImage, el.settingsAvatarInitial, name, avatarUrl);
    el.removeAvatar.hidden = !avatarUrl;
}

function openSettings() {
    if (!state.user) return;
    const preferences = normalizePreferences(state.user.preferences);
    state.pendingAvatarFile = null;
    state.pendingAvatarUrl = null;
    state.pendingAvatarRemoved = false;
    el.settingsDisplayName.value = state.user.name || "";
    el.settingsStartView.value = preferences.startView;
    el.settingsReduceMotion.checked = preferences.reduceMotion;
    el.settingsProfileName.textContent = state.user.name || "Action 用户";
    el.settingsProfileEmail.textContent = state.user.cloud ? state.user.email : "本地个人空间";
    el.settingsSaveHint.textContent = state.user.cloud ? "保存后会同步到你的云端空间" : "设置仅保存在当前浏览器";
    el.deleteAccountConfirm.hidden = true;
    el.deleteAccountInput.value = "";
    el.deleteAccountButton.disabled = true;
    el.deleteAccountButton.textContent = "永久删除";
    setSettingsAvatarPreview(getUserAvatarUrl());
    el.profileMenu.hidden = true;
    el.settingsModal.hidden = false;
    el.settingsModal.querySelector(".settings-modal").setAttribute("aria-hidden", "false");
    document.body.classList.add("settings-open");
    window.setTimeout(() => el.settingsDisplayName.focus(), 120);
}

function closeSettings() {
    el.settingsModal.hidden = true;
    el.settingsModal.querySelector(".settings-modal").setAttribute("aria-hidden", "true");
    document.body.classList.remove("settings-open");
    el.settingsAvatarInput.value = "";
    state.pendingAvatarFile = null;
    state.pendingAvatarUrl = null;
    state.pendingAvatarRemoved = false;
    el.deleteAccountConfirm.hidden = true;
}

async function prepareAvatarFile(file) {
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error("请选择 JPG、PNG 或 WebP 图片");
    if (file.size > 8 * 1024 * 1024) throw new Error("头像图片不能超过 8 MB");
    const objectUrl = URL.createObjectURL(file);
    try {
        const image = new Image();
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(new Error("无法读取这张图片"));
            image.src = objectUrl;
        });
        const sourceSide = Math.min(image.naturalWidth, image.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(512, sourceSide);
        canvas.height = Math.min(512, sourceSide);
        const context = canvas.getContext("2d");
        const sourceX = (image.naturalWidth - sourceSide) / 2;
        const sourceY = (image.naturalHeight - sourceSide) / 2;
        context.drawImage(image, sourceX, sourceY, sourceSide, sourceSide, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", .86));
        if (!blob) throw new Error("头像处理失败，请换一张图片");
        return {
            file: new File([blob], "avatar.webp", { type: "image/webp" }),
            previewUrl: canvas.toDataURL("image/webp", .86),
        };
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

async function saveSettings(event) {
    event.preventDefault();
    const displayName = el.settingsDisplayName.value.trim().replace(/\s+/g, " ");
    if (displayName.length < 2) {
        el.settingsSaveHint.textContent = "显示名称至少需要 2 个字符";
        el.settingsDisplayName.focus();
        return;
    }
    const preferences = normalizePreferences({
        startView: el.settingsStartView.value,
        reduceMotion: el.settingsReduceMotion.checked,
    });
    el.settingsSave.disabled = true;
    el.settingsSaveHint.textContent = "正在保存设置";
    try {
        if (state.user.cloud) {
            let avatarPath = state.user.avatarPath || null;
            let avatarUrl = getUserAvatarUrl();
            if (state.pendingAvatarRemoved && avatarPath) {
                await window.ActionCloud.removeAvatar(avatarPath);
                avatarPath = null;
                avatarUrl = "";
            }
            if (state.pendingAvatarFile) {
                const uploaded = await window.ActionCloud.uploadAvatar(state.user.id, state.pendingAvatarFile, avatarPath);
                avatarPath = uploaded.path;
                avatarUrl = uploaded.url;
            }
            await window.ActionCloud.updateProfile(state.user.id, { displayName, avatarPath, preferences });
            state.user = { ...state.user, name: displayName, avatarPath, avatarUrl, preferences };
        } else {
            const avatarData = state.pendingAvatarRemoved ? null : (state.pendingAvatarUrl || state.user.avatarData || null);
            state.user = { ...state.user, name: displayName, avatarData, preferences };
            saveLocalProfile(state.user);
        }
        renderAll();
        closeSettings();
        showOperationFeedback("设置已保存", "success");
        showToast(state.user.cloud ? "个人设置已同步到云端" : "个人设置已保存在本机");
    } catch (error) {
        console.error(error);
        el.settingsSaveHint.textContent = "保存失败，请检查网络后重试";
        showToast("设置暂时没有保存，请稍后再试");
    } finally {
        el.settingsSave.disabled = false;
    }
}

async function submitProductFeedback() {
    if (!state.user || el.submitProductFeedback.disabled) return;
    const score = Math.min(5, Math.max(1, Number(el.productFeedbackScore.value) || 3));
    const message = el.productFeedbackMessage.value.trim();
    el.submitProductFeedback.disabled = true;
    el.submitProductFeedback.textContent = "正在提交";
    try {
        if (state.user.cloud) {
            await window.ActionCloud.submitFeedback(state.user.id, score, "product_experience", message, { page: state.view });
        } else {
            const stored = JSON.parse(localStorage.getItem(feedbackKey(state.user.id)) || "[]");
            const feedback = Array.isArray(stored) ? stored : [];
            feedback.push({ id: createId(), score, category: "product_experience", message, page: state.view, createdAt: new Date().toISOString() });
            localStorage.setItem(feedbackKey(state.user.id), JSON.stringify(feedback.slice(-50)));
        }
        trackEvent("product_feedback_submitted", { score, has_message: Boolean(message) });
        el.productFeedbackMessage.value = "";
        showOperationFeedback("反馈已收到", "success");
        showToast(state.user.cloud ? "谢谢，你的反馈已经安全提交" : "反馈已保存在本机备份中");
    } catch (error) {
        console.error(error);
        showToast("反馈暂时没有提交，请稍后重试");
    } finally {
        el.submitProductFeedback.disabled = false;
        el.submitProductFeedback.textContent = "提交反馈";
    }
}

function clearLocalWorkspace(userId) {
    [notesKey(userId), documentsKey(userId), insightsKey(userId), weeklyKey(userId), eventsKey(userId), feedbackKey(userId), `${PROFILE_PREFIX}${userId}`]
        .forEach((key) => localStorage.removeItem(key));
}

async function deleteCurrentAccount() {
    if (!state.user || el.deleteAccountInput.value.trim() !== "删除") return;
    const user = state.user;
    el.deleteAccountButton.disabled = true;
    el.deleteAccountButton.textContent = "正在删除";
    try {
        if (user.cloud) {
            await window.ActionCloud.invoke("delete-account");
            await window.ActionCloud.signOut().catch(() => {});
        } else if (user.id !== DEMO_USER.id) {
            saveUsers(loadUsers().filter((item) => item.id !== user.id));
        }
        clearLocalWorkspace(user.id);
        closeSettings();
        setActiveUser(null);
        showOperationFeedback("账户数据已删除", "success");
        showToast(user.cloud ? "云端账户与全部数据已删除" : "本地空间与全部数据已清除");
    } catch (error) {
        console.error(error);
        showToast("删除未完成，你的数据仍然保留，请稍后重试");
        el.deleteAccountButton.disabled = false;
        el.deleteAccountButton.textContent = "永久删除";
    }
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
    state.pendingSourceInsightKey = "";
    el.noteForm.reset();
    setCaptureType("idea");
}

function updateWordCount() {
    const count = el.noteContent.value.replace(/\s/g, "").length;
    el.captureWordCount.textContent = `${count} 字 · ${state.user?.cloud ? "自动同步到云端" : "仅保存在本机"}`;
}

function toggleTask(id) {
    const note = state.notes.find((item) => item.id === id && item.type === "task");
    if (!note) return;
    const detailWasOpen = state.selectedId === id && el.detailDrawer.classList.contains("open");
    note.done = !note.done;
    note.updatedAt = new Date().toISOString();
    note.completedAt = note.done ? note.updatedAt : null;
    if (!note.done) {
        note.resultText = "";
        note.resultOutcome = "";
    }
    state.flashTaskId = id;
    saveNotes();
    renderAll();
    window.setTimeout(() => {
        if (state.flashTaskId === id) state.flashTaskId = null;
    }, 900);
    if (detailWasOpen && note.done) {
        window.clearTimeout(toggleTask.detailCloseTimer);
        toggleTask.detailCloseTimer = window.setTimeout(closeDetailDrawer, 700);
    } else if (detailWasOpen) {
        openNoteDetail(id);
    }
    showOperationFeedback(note.done ? "已标记完成" : "已恢复未完成", note.done ? "success" : "restore");
    showToast(note.done ? "行动已完成，结果已进入下一轮分析" : "行动已恢复为待处理");
    trackEvent(note.done ? "action_completed" : "action_reopened", { action_id: note.id, source_insight_id: note.sourceInsightKey || "" });
    if (note.done) window.setTimeout(() => openActionFeedback(note.id), 900);
}

function openActionFeedback(id) {
    const note = state.notes.find((item) => item.id === id && item.type === "task" && item.done);
    if (!note || !el.actionFeedbackModal) return;
    state.pendingTaskFeedbackId = id;
    el.actionFeedbackTitle.textContent = note.title;
    el.actionResultText.value = note.resultText || "";
    const selected = el.actionResultOutcome.querySelector(`input[value="${note.resultOutcome || "supported"}"]`);
    if (selected) selected.checked = true;
    el.actionFeedbackModal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => el.actionResultText.focus(), 80);
}

function closeActionFeedback() {
    if (!el.actionFeedbackModal) return;
    el.actionFeedbackModal.hidden = true;
    state.pendingTaskFeedbackId = null;
    document.body.classList.remove("modal-open");
    el.actionFeedbackForm.reset();
}

async function saveActionFeedback(event) {
    event.preventDefault();
    const note = state.notes.find((item) => item.id === state.pendingTaskFeedbackId);
    if (!note) return closeActionFeedback();
    note.resultText = el.actionResultText.value.trim();
    note.resultOutcome = el.actionResultOutcome.querySelector("input:checked")?.value || "unclear";
    note.updatedAt = new Date().toISOString();
    saveNotes();
    trackEvent("action_result_saved", { action_id: note.id, outcome: note.resultOutcome, has_note: Boolean(note.resultText) });
    closeActionFeedback();
    renderAll();
    showOperationFeedback("行动结果已保存", "success");
    showToast("结果会参与下一轮洞察与周报");
    if (state.user?.cloud) {
        try {
            await window.ActionCloud.syncNotes(state.user.id, [note]);
            const weekly = await window.ActionCloud.invoke("generate-weekly");
            const report = window.ActionCloud.mapWeeklyReport(weekly.weekly_report);
            if (report) {
                state.weeklyReport = report;
                state.weeklyReports = [report, ...state.weeklyReports.filter((item) => item.weekStart !== report.weekStart)].slice(0, 8);
            }
        } catch {
            showToast("结果已保存在本机，云端周报稍后更新");
        }
    } else updateLocalWeeklySnapshot();
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
        ${note.done ? `<section class="detail-result"><span>行动结果 · ${escapeHtml(resultOutcomeLabels[note.resultOutcome] || "等待补充")}</span><p>${escapeHtml(note.resultText || "已经完成，但还没有补充结果说明。")}</p><button data-edit-action-result="${escapeHtml(note.id)}" type="button">${note.resultText ? "修改结果" : "补充结果"}</button></section>` : ""}
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

function openEvidence(topic, insightKey = "") {
    const insight = buildInsights().find((item) => item.id === insightKey) || buildInsights().find((item) => item.topic === topic);
    const sources = insight ? getEvidenceForInsight(insight) : getEvidence(topic);
    trackEvent("insight_evidence_opened", { insight_id: insight?.id || "", evidence_count: sources.length });
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

async function setInsightStatus(insightKey, status) {
    const insights = buildInsights();
    const insight = insights.find((item) => item.id === insightKey);
    if (!insight || insight.status === "empty") return;
    if (!state.insights.length) state.insights = insights.map((item) => ({ ...item }));
    const target = state.insights.find((item) => item.id === insightKey);
    if (!target) return;
    const previousStatus = target.status || "pending";
    target.status = status;
    target.decidedAt = new Date().toISOString();
    saveLocalInsights();
    renderAll();
    try {
        if (state.user?.cloud) {
            const saved = await window.ActionCloud.updateInsightStatus(state.user.id, target, status);
            Object.assign(target, saved);
        }
        trackEvent(status === "confirmed" ? "insight_confirmed" : "insight_rejected", { insight_id: insightKey, previous_status: previousStatus });
        renderAll();
        showOperationFeedback(status === "confirmed" ? "洞察已确认" : "洞察已驳回", status === "confirmed" ? "success" : "restore");
        showToast(status === "confirmed" ? "已确认，下一轮 AI 会提高相关证据权重" : "已暂不采纳，下一轮 AI 不会换句话重复它");
    } catch (error) {
        target.status = previousStatus;
        saveLocalInsights();
        renderAll();
        console.error("Insight decision sync failed", error);
        showToast("判断没有同步成功，请检查网络后重试");
    }
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
    trackEvent("insight_analysis_started", { source_count: sourceCount });
    const cloudAnalysis = state.user?.cloud
        ? window.ActionCloud.invoke("analyze-insights")
            .then(async (result) => {
                state.insights = (result.insights || []).map(window.ActionCloud.mapInsight);
                const weekly = await window.ActionCloud.invoke("generate-weekly");
                state.weeklyReport = window.ActionCloud.mapWeeklyReport(weekly.weekly_report) || null;
                if (state.weeklyReport) state.weeklyReports = [state.weeklyReport, ...state.weeklyReports.filter((item) => item.weekStart !== state.weeklyReport.weekStart)].slice(0, 8);
                return { ok: true };
            })
            .catch((error) => ({ ok: false, error }))
        : Promise.resolve().then(() => {
            if (!state.insights.length) state.insights = buildInsights().map((insight) => ({ ...insight }));
            saveLocalInsights();
            updateLocalWeeklySnapshot();
            return { ok: true };
        });
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
    const cloudResult = await cloudAnalysis;
    el.reasoningSteps.classList.remove("analyzing");
    steps.forEach((item) => item.classList.remove("active"));
    el.aiStatusText.textContent = cloudResult.ok ? "已更新当前空间" : "云端分析暂时不可用";
    el.analysisTime.textContent = "刚刚";
    renderAll();
    el.analysisOverlay.classList.add("complete");
    el.analysisOverlayTitle.textContent = cloudResult.ok ? "洞察整理完成" : "已保留原有洞察";
    el.analysisOverlayDetail.textContent = cloudResult.ok ? `已更新 ${buildInsights().length} 条洞察与对应证据` : "云端 AI 暂时未响应，你的数据没有丢失";
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
    if (cloudResult.ok) {
        trackEvent("insight_analysis_completed", { insight_count: buildInsights().filter((item) => item.status !== "empty").length, source_count: sourceCount });
        showToast(`分析完成：已更新 ${buildInsights().length} 条洞察和动态周报`);
    } else {
        trackEvent("insight_analysis_failed", { source_count: sourceCount });
        console.error("Action cloud analysis failed", cloudResult.error);
        showToast("云端 AI 暂时不可用，已继续显示本地洞察");
    }
}

async function askAi() {
    const question = el.aiQuestion.value.trim();
    if (!question) {
        el.aiQuestion.focus();
        return;
    }
    el.askAi.disabled = true;
    el.aiStatusText.textContent = "正在回看原始记录";
    try {
        let response;
        if (state.user?.cloud) {
            const result = await window.ActionCloud.invoke("ask-action", { question });
            response = `${result.answer}\n\n依据：${result.basis}\n可选下一步：${result.next_step}`;
        } else {
            await delay(700);
            response = question.includes("为什么")
                ? "因为“计划完整”和“推迟开始”在 4 条记录中共同出现，而两次完成都发生在任务被缩小之后。"
                : question.includes("下一步")
                  ? "先写出一个 15 分钟内可以完成的版本，并记录实际开始时间。连续观察 3 天后再判断。"
                  : "现有证据更支持“先缩小动作再观察”，但样本仍少。建议把它当作待验证假设，而不是确定结论。";
        }
        el.railSuggestion.textContent = response;
        el.aiQuestion.value = "";
        el.aiStatusText.textContent = "回答已引用当前空间";
    } catch (error) {
        console.error(error);
        el.aiStatusText.textContent = "回答暂时失败";
        showToast("云端 AI 暂时没有响应，请稍后再试");
    } finally {
        el.askAi.disabled = false;
    }
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
    const sourceInsightKey = buildInsights()[0]?.id || "";
    state.notes.unshift(normalizeNote({ id: createId(), title, content: "用 15 分钟写清目标用户、核心问题和这一屏要证明的产品判断。", type: "task", mood: "清醒", tags: ["启动成本", "AI建议"], sourceInsightKey, done: false, createdAt: now, updatedAt: now }));
    saveNotes();
    trackEvent("insight_converted_to_action", { insight_id: sourceInsightKey || "assistant" });
    renderAll();
    closeAiRail(false);
    switchView("actions");
    showOperationFeedback("已加入行动", "success");
    showToast("AI 建议已转成行动，你仍可随时修改");
}

async function deleteNote(id) {
    const note = state.notes.find((item) => item.id === id);
    if (!note || !window.confirm(`确认删除“${note.title}”吗？`)) return;
    if (state.user?.cloud) {
        try {
            await window.ActionCloud.remove("notes", id);
        } catch (error) {
            console.error(error);
            showToast("云端删除失败，请检查网络后重试");
            return;
        }
    }
    state.notes = state.notes.filter((item) => item.id !== id);
    saveNotes();
    closeDetailDrawer();
    renderAll();
    showToast("输入已删除，相关洞察已重新计算");
}

function setAuthMessage(message, error = false, title = error ? "操作未完成" : "账号提示") {
    el.authStatus.hidden = false;
    el.authStatusTitle.textContent = title;
    el.authMessage.textContent = message;
    el.authMessage.classList.toggle("error", error);
    el.authStatus.classList.toggle("error", error);
}

el.demoButton.addEventListener("click", () => setActiveUser(DEMO_USER));

async function resendVerificationEmail() {
    const email = (el.authSuccessEmail.textContent || el.authName.value).trim();
    if (!email.includes("@")) {
        setAuthMessage("请先填写注册邮箱。", true, "缺少邮箱");
        return;
    }
    el.resendVerification.disabled = true;
    el.authSuccessResend.disabled = true;
    try {
        await window.ActionCloud.resendSignup(email);
        if (!el.authSuccess.hidden) {
            el.authSuccessCopy.textContent = "新的验证邮件已发送。点击邮件里的验证链接后会自动进入 Action。";
        } else {
            setAuthMessage("新的验证邮件已发送，请检查收件箱和垃圾邮件。", false, "验证邮件已重发");
        }
    } catch (error) {
        console.error(error);
        setAuthMessage("暂时无法重新发送，请一分钟后再试。", true, "发送失败");
    } finally {
        el.resendVerification.disabled = false;
        el.authSuccessResend.disabled = false;
    }
}

el.authLoginTab.addEventListener("click", () => setAuthMode("login"));
el.registerButton.addEventListener("click", () => setAuthMode("register"));
el.resendVerification.addEventListener("click", resendVerificationEmail);
el.authSuccessResend.addEventListener("click", resendVerificationEmail);
el.authSuccessLogin.addEventListener("click", () => {
    const email = el.authSuccessEmail.textContent;
    hideAuthSuccess();
    setAuthMode("login");
    el.authName.value = email;
    el.authPasscode.value = "";
    el.authPasscode.focus();
});

el.authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = el.authName.value.trim().replace(/\s+/g, " ");
    const passcode = el.authPasscode.value.trim();
    if (state.cloudEnabled) {
        const registering = state.authMode === "register";
        if (!name.includes("@") || passcode.length < 6) {
            setAuthMessage("请输入正确邮箱，密码至少 6 位。", true, "请检查输入");
            return;
        }
        if (registering && passcode !== el.authConfirmPasscode.value.trim()) {
            setAuthMessage("两次输入的密码不一致。", true, "密码没有对上");
            el.authConfirmPasscode.focus();
            return;
        }
        el.authSubmitButton.disabled = true;
        el.authSubmitButton.textContent = registering ? "正在创建账号" : "正在登录";
        try {
            if (registering) {
                const data = await window.ActionCloud.signUp(name, passcode, name.split("@")[0]);
                const alreadyRegistered = data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;
                if (alreadyRegistered) {
                    setAuthMode("login");
                    el.authName.value = name;
                    el.resendVerification.hidden = false;
                    setAuthMessage("这个邮箱已经注册。如果还没验证邮箱，可以重新发送验证邮件。", true, "账号已经存在");
                } else if (data.session && data.user) {
                    showAuthSuccess(name, true);
                    await delay(1100);
                    await activateCloudUser(data.user);
                    trackEvent("auth_completed", { mode: "register", provider: "email" });
                    hideAuthSuccess();
                    el.authForm.reset();
                } else {
                    showAuthSuccess(name, false);
                    el.authForm.reset();
                }
            } else {
                const { user } = await window.ActionCloud.signIn(name, passcode);
                await activateCloudUser(user);
                trackEvent("auth_completed", { mode: "login", provider: "email" });
                el.authForm.reset();
            }
        } catch (error) {
            console.error(error);
            const message = String(error.message || "").toLowerCase();
            if (message.includes("email not confirmed")) {
                setAuthMode("login");
                el.resendVerification.hidden = false;
                setAuthMessage("账号已创建，但邮箱还没有验证。请先点击验证邮件里的链接；验证后会自动进入。", true, "邮箱尚未验证");
            } else if (message.includes("invalid login")) {
                setAuthMessage("邮箱或密码不正确。如果刚完成注册，请先确认邮箱已经验证。", true, "登录信息不正确");
            } else if (message.includes("already registered")) {
                setAuthMode("login");
                setAuthMessage("这个邮箱已经注册，请直接登录。", true, "账号已经存在");
            } else if (message.includes("fetch") || message.includes("network")) {
                setAuthMessage("网络连接失败，请检查网络后重试。", true, "无法连接云端");
            } else {
                setAuthMessage(registering ? "注册暂时失败，请稍后重试。" : "登录暂时失败，请稍后重试。", true);
            }
        } finally {
            el.authSubmitButton.disabled = false;
            el.authSubmitButton.textContent = state.authMode === "register" ? "创建账号" : "登录";
        }
        return;
    }
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
    trackEvent("auth_completed", { mode: existing ? "login" : "register", provider: "local" });
});

document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
document.querySelectorAll("[data-view-link]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); switchView(link.dataset.viewLink); }));
document.querySelectorAll("[data-view-jump]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.viewJump)));
document.querySelector("#quickCapture").addEventListener("click", () => openCapture());
document.querySelectorAll("[data-open-capture]").forEach((button) => button.addEventListener("click", () => {
    state.pendingSourceInsightKey = button.dataset.insightKey || "";
    openCapture(button.dataset.openCapture || "idea");
}));
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
        sourceInsightKey: state.pendingSourceInsightKey,
        updatedAt: now,
    };
    if (!payload.sourceInsightKey) delete payload.sourceInsightKey;
    if (state.editingId) {
        const note = state.notes.find((item) => item.id === state.editingId);
        if (note) Object.assign(note, payload);
    } else {
        state.notes.unshift(normalizeNote({ id: createId(), ...payload, createdAt: now, done: false }));
    }
    saveNotes();
    trackEvent("source_saved", { source_type: payload.type, is_edit: wasEditing });
    if (!wasEditing) {
        const sourceCount = activeSources().length;
        if (sourceCount === 1) trackEvent("first_input_saved", { source_type: payload.type });
        if (sourceCount === 3) trackEvent("third_source_added", { source_type: payload.type });
    }
    if (payload.type === "task" && payload.sourceInsightKey) trackEvent("insight_converted_to_action", { insight_id: payload.sourceInsightKey });
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
        openEvidence(evidence.dataset.openEvidence, evidence.dataset.insightKey || "");
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
    setInsightStatus(row.dataset.insightKey, action.dataset.assumptionAction);
});

document.querySelector("#insightLeadConfirm").addEventListener("click", () => setInsightStatus(buildInsights()[0].id, "confirmed"));
document.querySelector("#insightLeadReject").addEventListener("click", () => setInsightStatus(buildInsights()[0].id, "rejected"));

el.closeDetail.addEventListener("click", closeDetailDrawer);
el.detailBackdrop.addEventListener("click", (event) => { if (event.target === el.detailBackdrop) closeDetailDrawer(); });
el.detailBody.addEventListener("click", (event) => {
    const resultButton = event.target.closest("[data-edit-action-result]");
    if (resultButton) {
        closeDetailDrawer();
        window.setTimeout(() => openActionFeedback(resultButton.dataset.editActionResult), 240);
        return;
    }
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
        else if (el.actionFeedbackModal && !el.actionFeedbackModal.hidden) closeActionFeedback();
        else if (!el.settingsModal.hidden) closeSettings();
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
el.actionFeedbackForm.addEventListener("submit", saveActionFeedback);
document.querySelectorAll("[data-close-action-feedback]").forEach((button) => button.addEventListener("click", closeActionFeedback));
el.actionFeedbackModal.addEventListener("click", (event) => { if (event.target === el.actionFeedbackModal) closeActionFeedback(); });

el.profileButton.addEventListener("click", (event) => {
    event.stopPropagation();
    el.profileMenu.hidden = !el.profileMenu.hidden;
});
document.addEventListener("click", (event) => { if (!event.target.closest(".profile-row")) el.profileMenu.hidden = true; });
el.settingsButton.addEventListener("click", openSettings);
document.querySelectorAll("[data-close-settings]").forEach((button) => button.addEventListener("click", closeSettings));
el.settingsModal.addEventListener("click", (event) => { if (event.target === el.settingsModal) closeSettings(); });
el.settingsForm.addEventListener("submit", saveSettings);
el.submitProductFeedback.addEventListener("click", submitProductFeedback);
el.showDeleteAccount.addEventListener("click", () => {
    el.deleteAccountConfirm.hidden = !el.deleteAccountConfirm.hidden;
    if (!el.deleteAccountConfirm.hidden) window.setTimeout(() => el.deleteAccountInput.focus(), 60);
});
el.deleteAccountInput.addEventListener("input", () => {
    el.deleteAccountButton.disabled = el.deleteAccountInput.value.trim() !== "删除";
});
el.deleteAccountButton.addEventListener("click", deleteCurrentAccount);
el.settingsDisplayName.addEventListener("input", () => {
    const name = el.settingsDisplayName.value.trim() || state.user?.name || "A";
    el.settingsProfileName.textContent = name;
    if (!state.pendingAvatarUrl && (state.pendingAvatarRemoved || !getUserAvatarUrl())) setSettingsAvatarPreview("", name);
});
el.settingsAvatarInput.addEventListener("change", async () => {
    const file = el.settingsAvatarInput.files?.[0];
    if (!file) return;
    el.settingsSaveHint.textContent = "正在处理头像";
    try {
        const prepared = await prepareAvatarFile(file);
        state.pendingAvatarFile = prepared.file;
        state.pendingAvatarUrl = prepared.previewUrl;
        state.pendingAvatarRemoved = false;
        setSettingsAvatarPreview(prepared.previewUrl);
        el.settingsSaveHint.textContent = "头像已准备好，点击保存后生效";
    } catch (error) {
        el.settingsAvatarInput.value = "";
        el.settingsSaveHint.textContent = error.message || "头像处理失败";
    }
});
el.removeAvatar.addEventListener("click", () => {
    state.pendingAvatarFile = null;
    state.pendingAvatarUrl = null;
    state.pendingAvatarRemoved = true;
    el.settingsAvatarInput.value = "";
    setSettingsAvatarPreview("", el.settingsDisplayName.value);
    el.settingsSaveHint.textContent = "保存后将恢复为首字母头像";
});
document.querySelector("#workspaceSwitcher").addEventListener("click", () => showToast(state.user?.cloud ? "当前为你的云端个人空间" : "当前为个人本地空间"));
el.logoutButton.addEventListener("click", async () => {
    el.profileMenu.hidden = true;
    if (state.user?.cloud) {
        try {
            await window.ActionCloud.signOut();
        } catch (error) {
            console.error(error);
        }
    }
    setActiveUser(null);
});

el.exportButton.addEventListener("click", async () => {
    el.exportButton.disabled = true;
    try {
        const cloudData = state.user?.cloud ? await window.ActionCloud.exportWorkspace() : {
            analyticsEvents: JSON.parse(localStorage.getItem(eventsKey(state.user.id)) || "[]"),
            productFeedback: JSON.parse(localStorage.getItem(feedbackKey(state.user.id)) || "[]"),
            insightFeedback: [],
        };
        const payload = JSON.stringify({
            product: "Action",
            version: 6,
            exportedAt: new Date().toISOString(),
            profile: {
                name: state.user?.name || "",
                email: state.user?.email || "",
                preferences: normalizePreferences(state.user?.preferences),
                avatarData: state.user?.cloud ? undefined : state.user?.avatarData || null,
            },
            notes: state.notes,
            documents: state.documents,
            insights: state.insights,
            weeklyReports: state.weeklyReports,
            ...cloudData,
        }, null, 2);
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `action-backup-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
        trackEvent("workspace_exported", { note_count: state.notes.length, document_count: state.documents.length });
        el.profileMenu.hidden = true;
        showToast("完整数据备份已导出");
    } catch (error) {
        console.error(error);
        showToast("导出失败，请检查网络后重试");
    } finally {
        el.exportButton.disabled = false;
    }
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
        if (Array.isArray(data.insights)) state.insights = data.insights;
        if (Array.isArray(data.weeklyReports)) {
            state.weeklyReports = data.weeklyReports;
            state.weeklyReport = state.weeklyReports[0] || null;
        }
        if (state.user.cloud) {
            await Promise.all([
                window.ActionCloud.syncNotes(state.user.id, state.notes),
                window.ActionCloud.syncDocuments(state.user.id, state.documents.map((document) => ({ ...document, storagePath: null }))),
                window.ActionCloud.syncInsights(state.user.id, state.insights),
                window.ActionCloud.syncWeeklyReports(state.user.id, state.weeklyReports),
            ]);
            if (data.profile?.name) {
                const preferences = normalizePreferences(data.profile.preferences);
                await window.ActionCloud.updateProfile(state.user.id, { displayName: String(data.profile.name), avatarPath: state.user.avatarPath, preferences });
                state.user = { ...state.user, name: String(data.profile.name), preferences };
            }
            await refreshCloudWorkspace();
        } else {
            if (data.profile?.name) {
                state.user = { ...state.user, name: String(data.profile.name), avatarData: data.profile.avatarData || state.user.avatarData, preferences: normalizePreferences(data.profile.preferences) };
                saveLocalProfile(state.user);
            }
            saveNotes();
            saveDocuments();
            saveLocalInsights();
            saveLocalWeeklyReports();
        }
        trackEvent("workspace_imported", { note_count: state.notes.length, document_count: state.documents.length });
        renderAll();
        showToast(`已恢复 ${state.notes.length} 条输入、${state.insights.length} 条洞察与 ${state.weeklyReports.length} 份周报`);
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
    if (document.documentElement.classList.contains("user-reduce-motion") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
el.weeklyHistorySelect.addEventListener("change", () => {
    state.selectedWeeklyStart = el.weeklyHistorySelect.value || dateKey(startOfWeek());
    renderWeekly();
    trackEvent("weekly_report_viewed", { week_start: state.selectedWeeklyStart, historical: state.selectedWeeklyStart !== dateKey(startOfWeek()) });
});

async function bootstrapApp() {
    const localUser = state.user;
    if (localUser) {
        state.localMigrationCandidate = {
            user: localUser,
            notes: loadNotesForUser(localUser.id),
            documents: loadDocumentsForUser(localUser.id),
        };
    }
    try {
        const cloud = await window.ActionCloud.init();
        state.cloudEnabled = cloud.configured;
        configureCloudUi();
        if (cloud.configured && cloud.session?.user) {
            await activateCloudUser(cloud.session.user);
            return;
        }
        if (cloud.configured) {
            state.user = null;
            state.notes = [];
            state.documents = [];
            state.insights = [];
            state.weeklyReport = null;
            state.weeklyReports = [];
            renderAuthState();
            renderAll();
            return;
        }
    } catch (error) {
        console.error("Action cloud initialization failed", error);
        state.cloudEnabled = false;
        setAuthMessage("云端暂时无法连接，已切回本地模式。", true);
    }
    state.user = localUser;
    if (state.user) {
        state.user = mergeLocalProfile(state.user);
        state.view = state.user.preferences.startView;
        state.notes = state.localMigrationCandidate?.notes || loadNotesForUser(state.user.id);
        state.documents = state.localMigrationCandidate?.documents || loadDocumentsForUser(state.user.id);
        state.insights = loadLocalInsights(state.user.id);
        state.weeklyReports = loadLocalWeeklyReports(state.user.id);
        state.weeklyReport = state.weeklyReports[0] || null;
        saveNotes();
        saveDocuments();
    }
    renderAuthState();
    renderAll();
}

bootstrapApp();
