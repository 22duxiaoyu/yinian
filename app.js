const LEGACY_STORAGE_KEY = "yinian-lite-notes-v1";
const USERS_KEY = "yinian-lite-users-v1";
const ACTIVE_USER_KEY = "yinian-lite-active-user-v1";
const MIGRATED_KEY = "yinian-lite-legacy-migrated-v1";
const NOTES_PREFIX = "yinian-lite-notes-v2:";

const typeLabels = {
    idea: "灵感",
    diary: "日记",
    review: "复盘",
    task: "待办",
};

const moodMeters = {
    清醒: { width: "42%", tone: "linear-gradient(90deg, #176f67, #4854a3)" },
    开心: { width: "76%", tone: "linear-gradient(90deg, #99620f, #b9475f)" },
    卡住: { width: "28%", tone: "linear-gradient(90deg, #66706b, #99620f)" },
    松弛: { width: "58%", tone: "linear-gradient(90deg, #527735, #176f67)" },
};

const templates = {
    diary: {
        type: "diary",
        title: "今天的片段",
        content: "今天发生了：\n\n我注意到：\n\n想留给明天的一句话：",
        tags: "日记,生活",
        mood: "松弛",
    },
    idea: {
        type: "idea",
        title: "一个新想法",
        content: "想法：\n\n为什么值得做：\n\n下一步可以试：",
        tags: "灵感,产品",
        mood: "清醒",
    },
    review: {
        type: "review",
        title: "今日复盘",
        content: "做成了：\n\n卡住了：\n\n明天优先：",
        tags: "复盘,工作",
        mood: "清醒",
    },
    task: {
        type: "task",
        title: "待办清单",
        content: "- [ ] \n- [ ] \n- [ ] ",
        tags: "待办",
        mood: "清醒",
    },
};

const seedNotes = [
    {
        id: "seed-1",
        title: "把一闪而过的想法留住",
        content:
            "一念适合记录那些还没成熟、但不想丢掉的句子。先写下来，之后再整理成文章、产品点子或待办。",
        type: "idea",
        mood: "清醒",
        tags: ["灵感", "产品"],
        pinned: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "seed-2",
        title: "晚间复盘模板",
        content:
            "做成了：搭出第一版可用界面。\n卡住了：想法太多时需要先收敛。\n明天优先：把记录变成可分享的长图。",
        type: "review",
        mood: "松弛",
        tags: ["复盘", "工作"],
        pinned: false,
        archived: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
];

const state = {
    user: loadActiveUser(),
    notes: [],
    filter: "all",
    tag: "",
    query: "",
    sort: "newest",
    editingId: null,
};

const el = {
    form: document.querySelector("#noteForm"),
    title: document.querySelector("#noteTitle"),
    content: document.querySelector("#noteContent"),
    tags: document.querySelector("#noteTags"),
    type: document.querySelector("#noteType"),
    mood: document.querySelector("#noteMood"),
    timeline: document.querySelector("#timeline"),
    search: document.querySelector("#searchInput"),
    sort: document.querySelector("#sortSelect"),
    tagCloud: document.querySelector("#tagCloud"),
    clearTag: document.querySelector("#clearTag"),
    importInput: document.querySelector("#importNotes"),
    exportButton: document.querySelector("#exportNotes"),
    captureStatus: document.querySelector("#captureStatus"),
    liveWords: document.querySelector("#liveWords"),
    moodIndicator: document.querySelector("#moodIndicator"),
    toast: document.querySelector("#toast"),
    todayMonth: document.querySelector("#todayMonth"),
    todayDay: document.querySelector("#todayDay"),
    dailyLine: document.querySelector("#dailyLine"),
    timePill: document.querySelector("#timePill span"),
    authScreen: document.querySelector("#authScreen"),
    authForm: document.querySelector("#authForm"),
    authName: document.querySelector("#authName"),
    authPasscode: document.querySelector("#authPasscode"),
    authMessage: document.querySelector("#authMessage"),
    userChip: document.querySelector("#userChip"),
    userInitial: document.querySelector("#userInitial"),
    activeUserName: document.querySelector("#activeUserName"),
    logoutButton: document.querySelector("#logoutButton"),
    spaceName: document.querySelector("#spaceName"),
    spaceMeta: document.querySelector("#spaceMeta"),
    workspaceTitle: document.querySelector("#workspaceTitle"),
    workspaceSubtitle: document.querySelector("#workspaceSubtitle"),
    focusType: document.querySelector("#focusType"),
    focusTitle: document.querySelector("#focusTitle"),
    focusExcerpt: document.querySelector("#focusExcerpt"),
    metricToday: document.querySelector("#metricToday"),
    metricWeek: document.querySelector("#metricWeek"),
    metricPinned: document.querySelector("#metricPinned"),
    weekRange: document.querySelector("#weekRange"),
    activityStrip: document.querySelector("#activityStrip"),
    resultTitle: document.querySelector("#resultTitle"),
    resultMeta: document.querySelector("#resultMeta"),
    activeScope: document.querySelector("#activeScope"),
    cancelEdit: document.querySelector("#cancelEdit"),
    submitLabel: document.querySelector("#submitLabel"),
};

const filterLabels = {
    all: "全部",
    today: "今天",
    idea: "灵感",
    diary: "日记",
    review: "复盘",
    task: "待办",
    archived: "归档",
};

function loadUsers() {
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadActiveUser() {
    const activeId = localStorage.getItem(ACTIVE_USER_KEY);
    if (!activeId) return null;
    return loadUsers().find((user) => user.id === activeId) || null;
}

function setActiveUser(user) {
    state.user = user;
    if (user) {
        localStorage.setItem(ACTIVE_USER_KEY, user.id);
        state.notes = loadNotesForUser(user.id);
    } else {
        localStorage.removeItem(ACTIVE_USER_KEY);
        state.notes = [];
    }
    renderAuthState();
    render();
}

function notesKey(userId) {
    return `${NOTES_PREFIX}${userId}`;
}

function freshSeedNotes() {
    return seedNotes.map((note, index) => ({
        ...note,
        id: createId(),
        createdAt: new Date(Date.now() - index * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - index * 86400000).toISOString(),
    }));
}

function normalizeNote(note) {
    const source = note && typeof note === "object" ? note : {};
    const now = new Date().toISOString();
    const createdAt = source.createdAt || now;
    const content = String(source.content || "");
    return {
        id: source.id || createId(),
        title: String(source.title || "未命名记录"),
        content,
        type: typeLabels[source.type] ? source.type : "idea",
        mood: moodMeters[source.mood] ? source.mood : "清醒",
        tags: Array.isArray(source.tags)
            ? source.tags.map(String).filter(Boolean).slice(0, 8)
            : [],
        pinned: Boolean(source.pinned),
        archived: Boolean(source.archived),
        createdAt,
        updatedAt: source.updatedAt || createdAt,
    };
}

function loadNotesForUser(userId) {
    const stored = localStorage.getItem(notesKey(userId));
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed.map(normalizeNote);
        } catch {
            return freshSeedNotes();
        }
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    const migratedTo = localStorage.getItem(MIGRATED_KEY);
    if (legacy && !migratedTo) {
        try {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed)) {
                const notes = parsed.map(normalizeNote);
                localStorage.setItem(MIGRATED_KEY, userId);
                localStorage.setItem(notesKey(userId), JSON.stringify(notes));
                return notes;
            }
        } catch {
            localStorage.setItem(MIGRATED_KEY, userId);
        }
    }

    const notes = freshSeedNotes();
    localStorage.setItem(notesKey(userId), JSON.stringify(notes));
    return notes;
}

function saveNotes() {
    if (!state.user) return;
    localStorage.setItem(notesKey(state.user.id), JSON.stringify(state.notes));
}

function createId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function hashPasscode(name, passcode) {
    const source = `${name.trim().toLowerCase()}:${passcode}`;
    if (crypto.subtle) {
        const bytes = new TextEncoder().encode(source);
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        return [...new Uint8Array(digest)]
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }
    let hash = 0;
    for (const char of source) {
        hash = (hash << 5) - hash + char.charCodeAt(0);
        hash |= 0;
    }
    return String(hash);
}

function normalizeName(value) {
    return value.trim().replace(/\s+/g, " ");
}

function normalizeTags(value) {
    return value
        .split(/[,，\s]+/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8);
}

function formatTime(value) {
    const date = new Date(value);
    return new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function isToday(value) {
    const date = new Date(value);
    const now = new Date();
    return date.toDateString() === now.toDateString();
}

function startOfDay(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function isWithinLastDays(value, days) {
    const date = startOfDay(value);
    const start = startOfDay(new Date());
    start.setDate(start.getDate() - (days - 1));
    return date >= start;
}

function getActiveNotes() {
    return state.notes.filter((note) => !note.archived);
}

function getCounts() {
    const activeNotes = getActiveNotes();
    return {
        all: activeNotes.length,
        today: activeNotes.filter((note) => isToday(note.createdAt)).length,
        idea: activeNotes.filter((note) => note.type === "idea").length,
        diary: activeNotes.filter((note) => note.type === "diary").length,
        review: activeNotes.filter((note) => note.type === "review").length,
        task: activeNotes.filter((note) => note.type === "task").length,
        archived: state.notes.filter((note) => note.archived).length,
        pinned: activeNotes.filter((note) => note.pinned).length,
        week: activeNotes.filter((note) => isWithinLastDays(note.createdAt, 7))
            .length,
    };
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 11) return "早上好";
    if (hour < 18) return "下午好";
    return "晚上好";
}

function getLatestActiveNote() {
    return [...getActiveNotes()].sort(
        (a, b) =>
            new Date(b.updatedAt || b.createdAt) -
            new Date(a.updatedAt || a.createdAt),
    )[0];
}

function getContentWords(note) {
    return note.content.replace(/\s/g, "").length;
}

function summarize(value, maxLength = 96) {
    const text = value.replace(/\s+/g, " ").trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
}

function getFilteredNotes() {
    const query = state.query.trim().toLowerCase();
    const notes = state.notes.filter((note) => {
        if (state.filter === "archived" && !note.archived) return false;
        if (state.filter !== "archived" && note.archived) return false;
        if (state.filter === "today" && !isToday(note.createdAt)) return false;
        if (Object.keys(typeLabels).includes(state.filter)) {
            if (note.type !== state.filter) return false;
        }
        if (state.tag && !note.tags.includes(state.tag)) return false;
        if (!query) return true;
        const haystack = [note.title, note.content, note.tags.join(" ")]
            .join(" ")
            .toLowerCase();
        return haystack.includes(query);
    });

    return notes.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (state.sort === "oldest") {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
        if (state.sort === "longest") {
            return b.content.length - a.content.length;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

function render() {
    renderCounts();
    renderStats();
    renderTags();
    renderOverview();
    renderListSummary();
    renderTimeline();
    renderComposerState();
    renderUser();
}

function renderAuthState() {
    const locked = !state.user;
    document.body.classList.toggle("auth-locked", locked);
    el.authScreen.classList.toggle("hidden", !locked);
    el.authScreen.setAttribute("aria-hidden", String(!locked));
    if (locked) {
        window.setTimeout(() => el.authName.focus(), 80);
    }
}

function renderUser() {
    if (!state.user) {
        el.userChip.hidden = true;
        el.spaceName.textContent = "未登录";
        el.spaceMeta.textContent = "浏览器本地保存";
        el.workspaceTitle.textContent = "今天有什么值得留下？";
        el.workspaceSubtitle.textContent =
            "记录想法、复盘和待办，沉淀成自己的私人时间线。";
        return;
    }
    el.userChip.hidden = false;
    el.activeUserName.textContent = state.user.name;
    el.userInitial.textContent = state.user.name.slice(0, 1).toUpperCase();
    el.spaceName.textContent = state.user.name;
    el.spaceMeta.textContent = `${getActiveNotes().length} 条活跃记录`;
    el.workspaceTitle.textContent = `${getGreeting()}，${state.user.name}`;
    el.workspaceSubtitle.textContent =
        getActiveNotes().length > 0
            ? "继续把零散想法整理成可靠的私人时间线。"
            : "先写下一条，空间就会开始长出自己的结构。";
}

function renderDatePlate() {
    const now = new Date();
    el.todayMonth.textContent = `${now.getMonth() + 1} 月`;
    el.todayDay.textContent = String(now.getDate()).padStart(2, "0");
    el.timePill.textContent = now.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const hours = now.getHours();
    if (hours < 11) {
        el.dailyLine.textContent = "先写下一句，今天就有了开头。";
    } else if (hours < 18) {
        el.dailyLine.textContent = "把脑子里的光，先放到纸上。";
    } else {
        el.dailyLine.textContent = "收一收今天，把明天留得轻一点。";
    }
}

function renderComposerState() {
    const words = el.content.value.replace(/\s/g, "").length;
    const title = el.title.value.trim();
    const tags = normalizeTags(el.tags.value);
    const mood = moodMeters[el.mood.value] || moodMeters["清醒"];
    const editing = Boolean(state.editingId);

    el.liveWords.textContent = `${words} 字`;
    el.captureStatus.textContent =
        editing
            ? "正在编辑记录"
            : words > 0 || title || tags.length > 0
              ? "正在形成"
              : "空白草稿";
    el.moodIndicator.style.width = mood.width;
    el.moodIndicator.style.background = mood.tone;
    el.cancelEdit.hidden = !editing;
    el.submitLabel.textContent = editing ? "保存" : "记录";
    el.form.classList.toggle("is-editing", editing);
}

function renderCounts() {
    const counts = getCounts();

    document.querySelector("#countAll").textContent = counts.all;
    document.querySelector("#countToday").textContent = counts.today;
    document.querySelector("#countIdea").textContent = counts.idea;
    document.querySelector("#countDiary").textContent = counts.diary;
    document.querySelector("#countReview").textContent = counts.review;
    document.querySelector("#countTask").textContent = counts.task;
    document.querySelector("#countArchived").textContent = counts.archived;

    document.querySelectorAll(".nav-item").forEach((button) => {
        button.classList.toggle("active", button.dataset.filter === state.filter);
    });
}

function renderStats() {
    const words = getActiveNotes().reduce(
        (sum, note) => sum + getContentWords(note),
        0,
    );
    document.querySelector("#statWords").textContent = words;
    document.querySelector("#statStreak").textContent = calculateStreak();
}

function calculateStreak() {
    const days = new Set(
        state.notes
            .filter((note) => !note.archived)
            .map((note) => new Date(note.createdAt).toDateString()),
    );
    let streak = 0;
    const cursor = new Date();
    while (days.has(cursor.toDateString())) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

function renderTags() {
    const tagCounts = new Map();
    getActiveNotes()
        .flatMap((note) => note.tags)
        .forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));

    el.tagCloud.innerHTML = "";
    if (tagCounts.size === 0) {
        const empty = document.createElement("p");
        empty.className = "tag-empty";
        empty.textContent = "暂无标签";
        el.tagCloud.append(empty);
        return;
    }
    [...tagCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 16)
        .forEach(([tag, count]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = `${tag} ${count}`;
            button.classList.toggle("active", state.tag === tag);
            button.addEventListener("click", () => {
                state.tag = state.tag === tag ? "" : tag;
                render();
            });
            el.tagCloud.append(button);
        });
}

function renderOverview() {
    const counts = getCounts();
    const latest = getLatestActiveNote();
    el.metricToday.textContent = counts.today;
    el.metricWeek.textContent = counts.week;
    el.metricPinned.textContent = counts.pinned;

    if (latest) {
        el.focusType.textContent = typeLabels[latest.type] || "记录";
        el.focusTitle.textContent = latest.title || "未命名记录";
        el.focusExcerpt.textContent = summarize(latest.content);
    } else {
        el.focusType.textContent = "记录";
        el.focusTitle.textContent = "还没有记录";
        el.focusExcerpt.textContent = "写下第一条内容后，这里会显示最近一次更新。";
    }

    renderActivityStrip();
}

function renderActivityStrip() {
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = startOfDay(new Date());
        date.setDate(date.getDate() - (6 - index));
        return date;
    });
    const dayCounts = days.map(
        (day) =>
            getActiveNotes().filter(
                (note) =>
                    startOfDay(note.createdAt).toDateString() ===
                    day.toDateString(),
            ).length,
    );
    const maxCount = Math.max(...dayCounts, 1);
    const first = days[0];
    const last = days[days.length - 1];
    el.weekRange.textContent = `${first.getMonth() + 1}/${first.getDate()} - ${
        last.getMonth() + 1
    }/${last.getDate()}`;
    el.activityStrip.innerHTML = "";

    days.forEach((day, index) => {
        const item = document.createElement("div");
        item.className = "activity-day";
        const bar = document.createElement("span");
        const label = document.createElement("small");
        const count = dayCounts[index];
        bar.style.height = `${10 + (count / maxCount) * 42}px`;
        bar.dataset.count = String(count);
        label.textContent = day.toLocaleDateString("zh-CN", {
            weekday: "short",
        });
        item.title = `${day.getMonth() + 1}/${day.getDate()} ${count} 条`;
        item.append(bar, label);
        el.activityStrip.append(item);
    });
}

function renderListSummary() {
    const notes = getFilteredNotes();
    const filterLabel = filterLabels[state.filter] || "全部";
    const scopes = [];
    if (state.tag) scopes.push(`#${state.tag}`);
    if (state.query.trim()) scopes.push(`"${state.query.trim()}"`);

    el.resultTitle.textContent = `${filterLabel}记录`;
    el.activeScope.textContent = scopes[0] || filterLabel;
    el.resultMeta.textContent =
        scopes.length > 0
            ? `${notes.length} 条匹配结果`
            : `${notes.length} 条记录按当前排序展示`;
}

function renderTimeline() {
    const notes = getFilteredNotes();
    el.timeline.innerHTML = "";

    if (notes.length === 0) {
        renderEmptyState();
        return;
    }

    notes.forEach((note, index) => {
        const card = document.createElement("article");
        card.className = `note-card${note.pinned ? " pinned" : ""}`;
        card.dataset.id = note.id;
        card.dataset.type = note.type;
        card.style.setProperty("--delay", `${Math.min(index * 42, 240)}ms`);
        card.innerHTML = `
            <div class="note-card-header">
                <div class="note-card-main">
                    <h2 class="note-title">${escapeHtml(note.title || "未命名记录")}</h2>
                    <div class="note-meta">
                        <span class="type-pill type-${note.type}">${typeLabels[note.type] || "记录"}</span>
                        <span class="mood-pill">${escapeHtml(note.mood)}</span>
                        <span>${formatTime(note.createdAt)}</span>
                        <span>${getContentWords(note)} 字</span>
                    </div>
                </div>
                <div class="note-card-toolbar">
                    ${
                        note.pinned
                            ? `<span class="pin-badge"><svg><use href="#icon-pin" /></svg>置顶</span>`
                            : ""
                    }
                    <button class="card-action" title="编辑" aria-label="编辑" data-action="edit">
                        <svg><use href="#icon-edit" /></svg>
                    </button>
                    <button class="card-action" title="${note.pinned ? "取消置顶" : "置顶"}" aria-label="${note.pinned ? "取消置顶" : "置顶"}" data-action="pin">
                        <svg><use href="#icon-pin" /></svg>
                    </button>
                    <button class="card-action" title="${note.archived ? "取消归档" : "归档"}" aria-label="${note.archived ? "取消归档" : "归档"}" data-action="archive">
                        <svg><use href="#icon-archive" /></svg>
                    </button>
                    <button class="card-action danger" title="删除" aria-label="删除" data-action="delete">
                        <svg><use href="#icon-trash" /></svg>
                    </button>
                </div>
            </div>
            <p class="note-content">${escapeHtml(note.content)}</p>
            <div class="note-tags">
                ${note.tags.map((tag) => `<button class="note-tag" type="button" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join("")}
            </div>
        `;
        el.timeline.append(card);
    });
}

function renderEmptyState() {
    const hasScope =
        state.filter !== "all" || state.tag || state.query.trim().length > 0;
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
        <div class="empty-visual" aria-hidden="true"></div>
        <h2>${hasScope ? "没有匹配的记录" : "这里还没有记录"}</h2>
        <p>${
            hasScope
                ? "换个筛选条件，或者把当前视图清空。"
                : "写下第一条，一念就会变成你的私人时间线。"
        }</p>
        ${
            hasScope
                ? `<button class="ghost-button empty-action" type="button" data-empty-action="clear">清空筛选</button>`
                : ""
        }
    `;
    el.timeline.append(empty);
}

function transitionRenderTimeline() {
    el.timeline.classList.add("is-switching");
    renderListSummary();
    window.setTimeout(() => {
        renderTimeline();
        el.timeline.classList.remove("is-switching");
    }, 120);
}

let toastTimer;

function showToast(message) {
    window.clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.add("show");
    toastTimer = window.setTimeout(() => {
        el.toast.classList.remove("show");
    }, 1800);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function resetComposer() {
    state.editingId = null;
    el.form.reset();
    el.type.value = "idea";
    el.mood.value = "清醒";
    renderComposerState();
}

function startEdit(note) {
    state.editingId = note.id;
    el.title.value = note.title || "";
    el.content.value = note.content || "";
    el.tags.value = Array.isArray(note.tags) ? note.tags.join(",") : "";
    el.type.value = typeLabels[note.type] ? note.type : "idea";
    el.mood.value = moodMeters[note.mood] ? note.mood : "清醒";
    renderComposerState();
    el.form.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => el.title.focus(), 220);
    showToast("正在编辑记录");
}

function clearScope() {
    state.filter = "all";
    state.tag = "";
    state.query = "";
    el.search.value = "";
    render();
}

el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.user) {
        showToast("请先登录");
        renderAuthState();
        return;
    }
    const content = el.content.value.trim();
    if (!content) {
        showToast("先写点内容");
        el.content.focus();
        return;
    }
    const now = new Date().toISOString();
    const payload = {
        title: el.title.value.trim() || "未命名记录",
        content,
        type: el.type.value,
        mood: el.mood.value,
        tags: normalizeTags(el.tags.value),
        updatedAt: now,
    };

    if (state.editingId) {
        const note = state.notes.find((item) => item.id === state.editingId);
        if (note) {
            Object.assign(note, payload);
            saveNotes();
            resetComposer();
            showToast("修改已保存");
            render();
            return;
        }
    }

    state.notes.unshift({
        id: createId(),
        ...payload,
        pinned: false,
        archived: false,
        createdAt: now,
    });
    saveNotes();
    resetComposer();
    showToast("已记录到时间线");
    render();
});

el.authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = normalizeName(el.authName.value);
    const passcode = el.authPasscode.value.trim();

    if (name.length < 2) {
        setAuthMessage("用户名至少 2 个字符。", true);
        return;
    }
    if (passcode.length < 4) {
        setAuthMessage("访问码至少 4 位。", true);
        return;
    }

    const users = loadUsers();
    const existing = users.find(
        (user) => user.name.toLowerCase() === name.toLowerCase(),
    );
    const passcodeHash = await hashPasscode(name, passcode);

    if (existing) {
        if (existing.passcodeHash !== passcodeHash) {
            setAuthMessage("访问码不对。", true);
            return;
        }
        setActiveUser(existing);
        setAuthMessage("没有账户会自动创建本地空间。", false);
        el.authForm.reset();
        showToast("欢迎回来");
        return;
    }

    const user = {
        id: createId(),
        name,
        passcodeHash,
        createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
    setActiveUser(user);
    setAuthMessage("没有账户会自动创建本地空间。", false);
    el.authForm.reset();
    showToast("本地空间已创建");
});

function setAuthMessage(message, isError) {
    el.authMessage.textContent = message;
    el.authMessage.classList.toggle("error", isError);
}

document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        renderCounts();
        transitionRenderTimeline();
    });
});

document.querySelectorAll("[data-template]").forEach((button) => {
    button.addEventListener("click", () => {
        const template = templates[button.dataset.template];
        el.title.value = template.title;
        el.content.value = template.content;
        el.tags.value = template.tags;
        el.type.value = template.type;
        el.mood.value = template.mood;
        renderComposerState();
        el.content.focus();
        showToast("模板已填入");
    });
});

el.search.addEventListener("input", () => {
    state.query = el.search.value;
    transitionRenderTimeline();
});

el.sort.addEventListener("change", () => {
    state.sort = el.sort.value;
    transitionRenderTimeline();
});

el.clearTag.addEventListener("click", () => {
    state.tag = "";
    render();
    showToast("标签筛选已清除");
});

el.cancelEdit.addEventListener("click", () => {
    resetComposer();
    showToast("已取消编辑");
});

el.logoutButton.addEventListener("click", () => {
    resetComposer();
    setActiveUser(null);
    showToast("已退出");
});

el.timeline.addEventListener("click", (event) => {
    const emptyAction = event.target.closest("[data-empty-action]");
    if (emptyAction) {
        clearScope();
        showToast("已清空筛选");
        return;
    }

    const tagButton = event.target.closest("[data-tag]");
    if (tagButton) {
        state.tag = tagButton.dataset.tag;
        state.filter = "all";
        render();
        showToast(`已筛选 #${state.tag}`);
        return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) return;
    const card = button.closest(".note-card");
    const note = state.notes.find((item) => item.id === card.dataset.id);
    if (!note) return;

    const action = button.dataset.action;
    if (action === "edit") {
        startEdit(note);
        return;
    }
    if (action === "pin") note.pinned = !note.pinned;
    if (action === "archive") note.archived = !note.archived;
    if (action === "delete") {
        state.notes = state.notes.filter((item) => item.id !== note.id);
        if (state.editingId === note.id) resetComposer();
        saveNotes();
        showToast("已删除记录");
        render();
        return;
    }
    note.updatedAt = new Date().toISOString();
    saveNotes();
    if (action === "pin") showToast(note.pinned ? "已置顶" : "已取消置顶");
    if (action === "archive") showToast(note.archived ? "已归档" : "已回到时间线");
    render();
});

el.exportButton.addEventListener("click", () => {
    if (!state.user) {
        renderAuthState();
        return;
    }
    const blob = new Blob([JSON.stringify(state.notes, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `yinian-notes-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("导出文件已生成");
});

el.importInput.addEventListener("change", async () => {
    if (!state.user) {
        renderAuthState();
        return;
    }
    const file = el.importInput.files[0];
    if (!file) return;
    const text = await file.text();
    try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error("Invalid notes");
        state.notes = parsed.map(normalizeNote);
        resetComposer();
        saveNotes();
        render();
        showToast("导入完成");
    } catch {
        alert("导入失败，请选择一念导出的 JSON 文件。");
    } finally {
        el.importInput.value = "";
    }
});

["input", "change"].forEach((eventName) => {
    el.title.addEventListener(eventName, renderComposerState);
    el.content.addEventListener(eventName, renderComposerState);
    el.tags.addEventListener(eventName, renderComposerState);
    el.mood.addEventListener(eventName, renderComposerState);
    el.type.addEventListener(eventName, renderComposerState);
});

if (state.user) {
    state.notes = loadNotesForUser(state.user.id);
}
renderDatePlate();
renderAuthState();
window.setInterval(renderDatePlate, 30000);
render();
