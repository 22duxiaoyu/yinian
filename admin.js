const adminEl = {
    auth: document.querySelector("#adminAuth"),
    app: document.querySelector("#adminApp"),
    loginForm: document.querySelector("#adminLoginForm"),
    email: document.querySelector("#adminEmail"),
    password: document.querySelector("#adminPassword"),
    loginMessage: document.querySelector("#adminLoginMessage"),
    period: document.querySelector("#adminPeriod"),
    refresh: document.querySelector("#adminRefresh"),
    logout: document.querySelector("#adminLogout"),
    loading: document.querySelector("#adminLoading"),
    error: document.querySelector("#adminError"),
    content: document.querySelector("#adminContent"),
    updatedAt: document.querySelector("#adminUpdatedAt"),
    overview: document.querySelector("#overviewMetrics"),
    daily: document.querySelector("#dailyTrend"),
    funnel: document.querySelector("#funnelList"),
    features: document.querySelector("#featureUsage"),
    pages: document.querySelector("#pageUsage"),
    quality: document.querySelector("#qualityMetrics"),
    outcomes: document.querySelector("#outcomeDistribution"),
    users: document.querySelector("#userTable"),
    feedback: document.querySelector("#feedbackList"),
    errorDialog: document.querySelector("#adminErrorDialog"),
    errorDialogTitle: document.querySelector("#adminErrorDialogTitle"),
    errorDialogMessage: document.querySelector("#adminErrorDialogMessage"),
    errorDialogClose: document.querySelector("#adminErrorDialogClose"),
};

const pageLabels = { overview: "工作台", library: "灵感库", insights: "洞察", actions: "行动", weekly: "周报", method: "产品方法" };
let adminData = null;

function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function formatNumber(value) {
    return new Intl.NumberFormat("zh-CN").format(Number(value || 0));
}

function formatDate(value, includeTime = false) {
    if (!value) return "暂无";
    return new Intl.DateTimeFormat("zh-CN", includeTime ? { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" } : { year: "numeric", month: "numeric", day: "numeric" }).format(new Date(value));
}

function formatDuration(value) {
    const milliseconds = Number(value || 0);
    if (!milliseconds) return "暂无样本";
    return milliseconds >= 1000 ? `${(milliseconds / 1000).toFixed(1)} 秒` : `${milliseconds} 毫秒`;
}

function setLoading(loading) {
    adminEl.loading.hidden = !loading;
    adminEl.content.hidden = loading;
    adminEl.error.hidden = true;
    adminEl.refresh.disabled = loading;
}

function showError(message) {
    adminEl.loading.hidden = true;
    adminEl.content.hidden = true;
    adminEl.error.hidden = false;
    adminEl.error.querySelector("p").textContent = message;
    adminEl.refresh.disabled = false;
    showAdminErrorDialog(message);
}

function adminErrorMessage(error, context = "data") {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("invalid login") || message.includes("invalid credentials")) return "管理员邮箱或密码不正确。";
    if (message.includes("forbidden") || message.includes("unauthorized") || message.includes("permission") || message.includes("403")) return "当前账号没有管理员权限，请使用指定管理员邮箱登录。";
    if (message.includes("fetch") || message.includes("network")) return "网络连接失败，请检查网络后重试。";
    return context === "login" ? "登录失败，请检查账号信息后重试。" : "暂时无法读取后台数据，请稍后重试。";
}

function showAdminErrorDialog(message) {
    adminEl.errorDialogTitle.textContent = /(登录|邮箱|密码|账号)/.test(message) ? "管理员身份需要检查" : "后台操作没有完成";
    adminEl.errorDialogMessage.textContent = message;
    adminEl.errorDialog.hidden = false;
    window.setTimeout(() => adminEl.errorDialogClose.focus(), 40);
}

function closeAdminErrorDialog() {
    adminEl.errorDialog.hidden = true;
}

function renderOverview(data) {
    const metrics = [
        ["累计注册", data.total_users, "全部云端账号"],
        ["周期新增", data.new_users, `最近 ${adminData.period_days} 天`],
        ["活跃用户", data.active_users, "发生过关键行为"],
        ["完成 AI 洞察", data.analyses_completed, "成功分析次数"],
        ["完成行动", data.actions_completed, "进入现实反馈"],
        ["周报用户", data.weekly_viewers, "去重查看人数"],
    ];
    adminEl.overview.innerHTML = metrics.map(([label, value, note]) => `<article><span>${label}</span><strong>${formatNumber(value)}</strong><small>${note}</small></article>`).join("");

    const recentDaily = adminData.daily.slice(-Math.min(adminData.daily.length, 30));
    const maximum = Math.max(1, ...recentDaily.flatMap((item) => [item.active_users, item.new_users]));
    adminEl.daily.innerHTML = recentDaily.map((item) => `<div class="trend-day" title="${item.date}：${item.active_users} 位活跃，${item.new_users} 位新增"><div><i style="height:${Math.max(4, item.active_users / maximum * 100)}%"></i><b style="height:${Math.max(3, item.new_users / maximum * 100)}%"></b></div><span>${item.date.slice(5).replace("-", "/")}</span></div>`).join("");
}

function renderFunnel(items) {
    const maximum = Math.max(1, items[0]?.users || 0);
    adminEl.funnel.innerHTML = items.map((item, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${escapeHtml(item.label)}</strong><div class="funnel-track"><i style="width:${Math.max(item.users ? 5 : 0, item.users / maximum * 100)}%"></i></div></div><b>${formatNumber(item.users)} 人</b><em>${index ? `${item.conversion}%` : "起点"}</em></article>`).join("");
}

function renderUsageList(target, items, labelKey) {
    if (!items.length) {
        target.innerHTML = `<p class="empty-state">这个周期还没有数据。</p>`;
        return;
    }
    const maximum = Math.max(1, ...items.map((item) => item.events || item.views || 0));
    target.innerHTML = items.map((item) => {
        const count = item.events ?? item.views ?? 0;
        return `<article class="usage-row"><div><strong>${escapeHtml(labelKey(item))}</strong><span><i style="width:${Math.max(count ? 4 : 0, count / maximum * 100)}%"></i></span></div><p><b>${formatNumber(item.users)}</b> 人<em>${formatNumber(count)} 次</em></p></article>`;
    }).join("");
}

function renderQuality(data) {
    const metrics = [
        ["分析成功率", `${data.success_rate}%`, `${data.analyses_completed} 成功／${data.analyses_failed} 失败`],
        ["洞察采纳率", `${data.acceptance_rate}%`, `${data.insights_confirmed} 确认／${data.insights_rejected} 驳回`],
        ["证据查看率", `${data.evidence_open_rate}%`, "相对成功分析次数"],
        ["平均分析耗时", formatDuration(data.average_duration_ms), "仅统计新版本事件"],
    ];
    adminEl.quality.innerHTML = metrics.map(([label, value, note]) => `<article><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
    const outcomes = [
        ["支持判断", data.outcomes.supported, "supported"],
        ["结果不明确", data.outcomes.unclear, "unclear"],
        ["不支持判断", data.outcomes.disproved, "disproved"],
    ];
    const total = outcomes.reduce((sum, item) => sum + Number(item[1] || 0), 0);
    adminEl.outcomes.innerHTML = outcomes.map(([label, value, className]) => `<article><div><strong>${label}</strong><span>${formatNumber(value)} 次</span></div><i class="${className}"><b style="width:${total ? Number(value) / total * 100 : 0}%"></b></i></article>`).join("");
}

function renderUsers(items) {
    adminEl.users.innerHTML = items.length ? items.map((item) => `<tr><td><strong>${escapeHtml(item.email)}</strong></td><td>${formatDate(item.created_at)}</td><td>${formatDate(item.last_active_at, true)}</td><td><span class="stage-label">${escapeHtml(item.activation_stage)}</span></td><td>${formatNumber(item.event_count)}</td></tr>`).join("") : `<tr><td colspan="5" class="table-empty">还没有云端用户。</td></tr>`;
}

function renderFeedback(items) {
    adminEl.feedback.innerHTML = items.length ? items.map((item) => `<article><header><strong>${"●".repeat(item.score)}${"○".repeat(5 - item.score)}</strong><span>${formatDate(item.created_at, true)}</span></header><p>${escapeHtml(item.message || "用户只提交了评分，没有填写文字。")}</p><footer><span>${escapeHtml(item.user_email)}</span><em>${escapeHtml(pageLabels[item.page] || item.page || "未知页面")}</em></footer></article>`).join("") : `<p class="empty-state">这个周期还没有收到产品反馈。</p>`;
}

function renderDashboard(data) {
    adminData = data;
    adminEl.updatedAt.textContent = `更新于 ${formatDate(data.generated_at, true)}`;
    renderOverview(data.overview);
    renderFunnel(data.funnel);
    renderUsageList(adminEl.features, data.features, (item) => item.label);
    renderUsageList(adminEl.pages, data.pages, (item) => pageLabels[item.page] || item.page);
    renderQuality(data.ai_quality);
    renderUsers(data.users);
    renderFeedback(data.feedback);
}

async function loadDashboard() {
    adminEl.auth.hidden = true;
    adminEl.app.hidden = false;
    setLoading(true);
    try {
        const data = await window.ActionCloud.invoke("admin-analytics", { period_days: Number(adminEl.period.value) });
        renderDashboard(data);
        adminEl.content.hidden = false;
        adminEl.loading.hidden = true;
    } catch (error) {
        console.error(error);
        showError(adminErrorMessage(error));
    } finally {
        adminEl.refresh.disabled = false;
    }
}

adminEl.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    adminEl.loginMessage.textContent = "正在验证管理员身份";
    adminEl.loginForm.querySelector("button").disabled = true;
    try {
        await window.ActionCloud.signIn(adminEl.email.value.trim(), adminEl.password.value);
        adminEl.loginMessage.textContent = "";
        await loadDashboard();
    } catch (error) {
        console.error(error);
        const message = adminErrorMessage(error, "login");
        adminEl.loginMessage.textContent = message;
        showAdminErrorDialog(message);
    } finally {
        adminEl.loginForm.querySelector("button").disabled = false;
    }
});

adminEl.period.addEventListener("change", loadDashboard);
adminEl.refresh.addEventListener("click", loadDashboard);
adminEl.error.querySelector("button").addEventListener("click", loadDashboard);
adminEl.errorDialogClose.addEventListener("click", closeAdminErrorDialog);
adminEl.errorDialog.addEventListener("click", (event) => { if (event.target === adminEl.errorDialog) closeAdminErrorDialog(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !adminEl.errorDialog.hidden) closeAdminErrorDialog(); });
adminEl.logout.addEventListener("click", async () => {
    await window.ActionCloud.signOut().catch(() => {});
    adminEl.app.hidden = true;
    adminEl.auth.hidden = false;
    adminEl.password.value = "";
});
document.querySelectorAll("[data-admin-target]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-admin-target]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelector(`#${button.dataset.adminTarget}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}));

(async function initializeAdmin() {
    try {
        const cloud = await window.ActionCloud.init();
        if (!cloud.configured) {
            const message = "云端尚未配置，无法进入数据中心。";
            adminEl.loginMessage.textContent = message;
            showAdminErrorDialog(message);
            return;
        }
        if (cloud.session?.user) await loadDashboard();
    } catch (error) {
        console.error(error);
        const message = adminErrorMessage(error);
        adminEl.loginMessage.textContent = message;
        showAdminErrorDialog(message);
    }
})();
