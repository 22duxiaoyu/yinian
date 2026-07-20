(function createActionCloud(global) {
    const config = global.ACTION_CLOUD_CONFIG || {};
    const configured = Boolean(config.supabaseUrl && config.publishableKey);
    const oauthProviders = Array.isArray(config.oauthProviders) ? config.oauthProviders : [];
    let client = null;
    let loading = null;

    function loadSupabaseLibrary() {
        if (global.supabase?.createClient) return Promise.resolve(global.supabase);
        if (loading) return loading;
        loading = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
            script.async = true;
            script.onload = () => resolve(global.supabase);
            script.onerror = () => reject(new Error("无法加载云端连接组件"));
            document.head.appendChild(script);
        });
        return loading;
    }

    async function init() {
        if (!configured) return { configured: false, session: null, oauthProviders };
        const library = await loadSupabaseLibrary();
        client = library.createClient(config.supabaseUrl, config.publishableKey, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        return { configured: true, session: data.session, oauthProviders };
    }

    function requireClient() {
        if (!client) throw new Error("云端尚未初始化");
        return client;
    }

    function isUuid(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
    }

    function ensureUuid(item) {
        if (!isUuid(item.id)) item.id = crypto.randomUUID();
        return item.id;
    }

    function mapNote(row) {
        return {
            id: row.id,
            title: row.title,
            content: row.content,
            type: row.type,
            mood: row.mood,
            tags: row.tags || [],
            done: row.done,
            pinned: row.pinned,
            archived: row.archived,
            sourceInsightKey: row.source_insight_key || "",
            resultText: row.result_text || "",
            resultOutcome: row.result_outcome || "",
            completedAt: row.completed_at || null,
            agentGoalId: row.agent_goal_id || "",
            agentStepId: row.agent_step_id || "",
            dueAt: row.due_at || null,
            priority: row.priority || "normal",
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    function mapDocument(row) {
        return {
            id: row.id,
            name: row.name,
            kind: row.kind,
            size: Number(row.size_bytes || 0),
            status: row.status,
            summary: row.summary,
            extractedText: row.extracted_text || "",
            keywords: row.keywords || [],
            cards: Array.isArray(row.cards) ? row.cards : [],
            parsedAt: row.parsed_at,
            storagePath: row.storage_path || null,
        };
    }

    function mapInsight(row) {
        return {
            id: row.insight_key,
            label: row.label,
            topic: row.topic,
            title: row.title,
            detail: row.detail,
            evidence: Number(row.evidence_count || 0),
            confidence: Number(row.confidence || 0),
            accent: row.accent,
            status: row.status,
            decidedAt: row.decided_at || null,
            evidenceRefs: Array.isArray(row.evidence_refs) ? row.evidence_refs : [],
        };
    }

    function mapWeeklyReport(row) {
        return row ? {
            id: row.id,
            weekStart: row.week_start,
            weekEnd: row.week_end,
            layout: row.layout,
            theme: row.theme,
            report: row.report || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        } : null;
    }

    function mapAgent(agent) {
        const source = agent && typeof agent === "object" ? agent : {};
        const goalRow = source.goal && typeof source.goal === "object" ? source.goal : null;
        const goal = goalRow ? {
            id: goalRow.id,
            title: goalRow.title,
            objective: goalRow.objective,
            status: goalRow.status,
            targetDate: goalRow.target_date || null,
            successCriteria: goalRow.success_criteria || "",
            constraints: goalRow.constraints || {},
            context: goalRow.context || {},
            currentPlanVersion: Number(goalRow.current_plan_version || 0),
            nextCheckInAt: goalRow.next_check_in_at || null,
            createdAt: goalRow.created_at,
            updatedAt: goalRow.updated_at,
        } : null;
        const messages = (Array.isArray(source.messages) ? source.messages : []).map((row) => ({
            id: row.id,
            goalId: row.goal_id,
            role: row.role,
            kind: row.kind,
            content: row.content,
            metadata: row.metadata || {},
            createdAt: row.created_at,
        }));
        const steps = (Array.isArray(source.steps) ? source.steps : []).map((row) => ({
            id: row.id,
            goalId: row.goal_id,
            version: Number(row.version || 0),
            position: Number(row.position || 0),
            title: row.title,
            detail: row.detail || "",
            durationMinutes: Number(row.duration_minutes || 15),
            dueAt: row.due_at || null,
            status: row.status,
            successCriteria: row.success_criteria || "",
            noteId: row.note_id || "",
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
        const checkIns = (Array.isArray(source.check_ins) ? source.check_ins : Array.isArray(source.checkIns) ? source.checkIns : []).map((row) => ({
            id: row.id,
            goalId: row.goal_id,
            stepId: row.step_id || "",
            dueAt: row.due_at,
            status: row.status,
            question: row.question,
            response: row.response || "",
            outcome: row.outcome || "",
            answeredAt: row.answered_at || null,
        }));
        const currentSteps = goal ? steps.filter((step) => step.version === goal.currentPlanVersion) : [];
        const completed = currentSteps.filter((step) => step.status === "completed").length;
        const progress = source.progress && typeof source.progress === "object" ? {
            completed: Number(source.progress.completed ?? completed),
            total: Number(source.progress.total ?? currentSteps.length),
            percentage: Number(source.progress.percentage ?? (currentSteps.length ? Math.round(completed / currentSteps.length * 100) : 0)),
        } : { completed, total: currentSteps.length, percentage: currentSteps.length ? Math.round(completed / currentSteps.length * 100) : 0 };
        return { goal, messages, steps: currentSteps, checkIns, progress };
    }

    async function signIn(email, password) {
        const { data, error } = await requireClient().auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function signInWithProvider(provider) {
        const redirectTo = `${global.location.origin}${global.location.pathname}`;
        const { data, error } = await requireClient().auth.signInWithOAuth({
            provider,
            options: { redirectTo },
        });
        if (error) throw error;
        return data;
    }

    async function signUp(email, password, displayName) {
        const redirectTo = `${global.location.origin}${global.location.pathname}`;
        const { data, error } = await requireClient().auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName || email.split("@")[0] }, emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        if (data.user) {
            const { error: profileError } = await requireClient().from("profiles").upsert({
                id: data.user.id,
                display_name: displayName || email.split("@")[0],
            });
            if (profileError && data.session) throw profileError;
        }
        return data;
    }

    async function resendSignup(email) {
        const emailRedirectTo = `${global.location.origin}${global.location.pathname}`;
        const { data, error } = await requireClient().auth.resend({ type: "signup", email, options: { emailRedirectTo } });
        if (error) throw error;
        return data;
    }

    async function verifySignupOtp(email, token) {
        const { data, error } = await requireClient().auth.verifyOtp({ email, token, type: "email" });
        if (error) throw error;
        if (!data.user || !data.session) throw new Error("验证码验证后没有建立会话");
        return data;
    }

    async function signOut() {
        const { error } = await requireClient().auth.signOut();
        if (error) throw error;
    }

    async function loadWorkspace(user) {
        const api = requireClient();
        const [profileResult, notesResult, documentsResult, insightsResult, weeklyResult, goalsResult, messagesResult, stepsResult, checkInsResult] = await Promise.all([
            api.from("profiles").select("display_name,avatar_path,preferences").eq("id", user.id).maybeSingle(),
            api.from("notes").select("*").order("updated_at", { ascending: false }),
            api.from("documents").select("*").order("parsed_at", { ascending: false }),
            api.from("insights").select("*").order("updated_at", { ascending: false }),
            api.from("weekly_reports").select("*").order("week_start", { ascending: false }).limit(8),
            api.from("agent_goals").select("*").order("updated_at", { ascending: false }).limit(12),
            api.from("agent_messages").select("*").order("created_at", { ascending: true }).limit(120),
            api.from("agent_plan_steps").select("*").order("version", { ascending: false }).order("position", { ascending: true }).limit(120),
            api.from("agent_check_ins").select("*").order("due_at", { ascending: true }).limit(80),
        ]);
        const error = [profileResult, notesResult, documentsResult, insightsResult, weeklyResult, goalsResult, messagesResult, stepsResult, checkInsResult].find((result) => result.error)?.error;
        if (error) throw error;
        const fallbackName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Action 用户";
        if (!profileResult.data) {
            const { error: profileError } = await api.from("profiles").upsert({ id: user.id, display_name: fallbackName });
            if (profileError) throw profileError;
        }
        const avatarPath = profileResult.data?.avatar_path || null;
        let avatarUrl = "";
        if (avatarPath) {
            const { data: avatarData, error: avatarError } = await api.storage.from("action-avatars").createSignedUrl(avatarPath, 604800);
            if (!avatarError) avatarUrl = avatarData?.signedUrl || "";
        }
        const goals = goalsResult.data || [];
        const activeGoal = goals.find((goal) => ["clarifying", "ready", "active", "paused"].includes(goal.status))
            || goals.find((goal) => goal.status === "completed")
            || null;
        const agent = mapAgent(activeGoal ? {
            goal: activeGoal,
            messages: (messagesResult.data || []).filter((message) => message.goal_id === activeGoal.id),
            steps: (stepsResult.data || []).filter((step) => step.goal_id === activeGoal.id),
            check_ins: (checkInsResult.data || []).filter((checkIn) => checkIn.goal_id === activeGoal.id),
        } : null);
        return {
            user: {
                id: user.id,
                email: user.email || "",
                name: profileResult.data?.display_name || fallbackName,
                avatarPath,
                avatarUrl,
                preferences: profileResult.data?.preferences || {},
                cloud: true,
            },
            notes: (notesResult.data || []).map(mapNote),
            documents: (documentsResult.data || []).map(mapDocument),
            insights: (insightsResult.data || []).map(mapInsight),
            weeklyReports: (weeklyResult.data || []).map(mapWeeklyReport),
            weeklyReport: mapWeeklyReport(weeklyResult.data?.[0] || null),
            agent,
        };
    }

    async function syncNotes(userId, notes) {
        if (!notes.length) return [];
        const rows = notes.map((note) => ({
            id: ensureUuid(note),
            user_id: userId,
            title: note.title,
            content: note.content,
            type: note.type,
            mood: note.mood,
            tags: note.tags || [],
            done: Boolean(note.done),
            pinned: Boolean(note.pinned),
            archived: Boolean(note.archived),
            source_insight_key: note.sourceInsightKey || null,
            result_text: note.resultText || "",
            result_outcome: note.resultOutcome || null,
            completed_at: note.completedAt || null,
            agent_goal_id: note.agentGoalId || null,
            agent_step_id: note.agentStepId || null,
            due_at: note.dueAt || null,
            priority: ["low", "normal", "high"].includes(note.priority) ? note.priority : "normal",
            created_at: note.createdAt,
            updated_at: note.updatedAt,
        }));
        const { data, error } = await requireClient().from("notes").upsert(rows).select();
        if (error) throw error;
        return data.map(mapNote);
    }

    async function syncDocuments(userId, documents) {
        if (!documents.length) return [];
        const rows = documents.map((document) => ({
            id: ensureUuid(document),
            user_id: userId,
            name: document.name,
            kind: document.kind,
            size_bytes: Number(document.size || 0),
            status: document.status,
            summary: document.summary,
            extracted_text: document.extractedText || "",
            keywords: document.keywords || [],
            cards: document.cards || [],
            parsed_at: document.parsedAt,
            storage_path: document.storagePath || null,
        }));
        const { data, error } = await requireClient().from("documents").upsert(rows).select();
        if (error) throw error;
        return data.map(mapDocument);
    }

    async function syncInsights(userId, insights) {
        if (!insights.length) return [];
        const rows = insights.map((insight, index) => ({
            user_id: userId,
            insight_key: insight.id || ["pattern", "tension", "change"][index] || `restored-${index + 1}`,
            label: insight.label || "行为模式",
            topic: insight.topic || "待确认主题",
            title: insight.title || "待确认洞察",
            detail: insight.detail || "",
            evidence_count: Number(insight.evidence || 0),
            confidence: Math.min(100, Math.max(0, Number(insight.confidence || 0))),
            accent: /^#[0-9a-f]{6}$/i.test(insight.accent || "") ? insight.accent : "#667d92",
            status: ["pending", "confirmed", "rejected"].includes(insight.status) ? insight.status : "pending",
            decided_at: insight.decidedAt || null,
            evidence_refs: Array.isArray(insight.evidenceRefs) ? insight.evidenceRefs : [],
        }));
        const { data, error } = await requireClient().from("insights").upsert(rows, { onConflict: "user_id,insight_key" }).select();
        if (error) throw error;
        return data.map(mapInsight);
    }

    async function syncWeeklyReports(userId, reports) {
        if (!reports.length) return [];
        const rows = reports.filter((report) => report.weekStart && report.weekEnd).map((report) => ({
            user_id: userId,
            week_start: report.weekStart,
            week_end: report.weekEnd,
            layout: ["sparse", "balanced", "dense"].includes(report.layout) ? report.layout : "balanced",
            theme: report.theme || report.report?.theme || "历史周报",
            report: report.report || {},
        }));
        if (!rows.length) return [];
        const { data, error } = await requireClient().from("weekly_reports").upsert(rows, { onConflict: "user_id,week_start" }).select();
        if (error) throw error;
        return data.map(mapWeeklyReport);
    }

    async function exportWorkspace() {
        const api = requireClient();
        const [insightFeedback, analytics, productFeedback] = await Promise.all([
            api.from("insight_feedback").select("*").order("created_at", { ascending: false }),
            api.from("analytics_events").select("*").order("created_at", { ascending: false }),
            api.from("product_feedback").select("*").order("created_at", { ascending: false }),
        ]);
        const failed = [insightFeedback, analytics, productFeedback].find((result) => result.error);
        if (failed?.error) throw failed.error;
        return {
            insightFeedback: insightFeedback.data || [],
            analyticsEvents: analytics.data || [],
            productFeedback: productFeedback.data || [],
        };
    }

    async function uploadDocument(userId, file, document) {
        const api = requireClient();
        ensureUuid(document);
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
        const storagePath = `${userId}/${document.id}-${safeName}`;
        const { error: uploadError } = await api.storage.from("action-documents").upload(storagePath, file, { upsert: true });
        if (uploadError) throw uploadError;
        document.storagePath = storagePath;
        await syncDocuments(userId, [document]);
        return document;
    }

    async function updateProfile(userId, { displayName, avatarPath, preferences }) {
        const { data, error } = await requireClient().from("profiles").upsert({
            id: userId,
            display_name: displayName,
            avatar_path: avatarPath || null,
            preferences: preferences || {},
        }).select("display_name,avatar_path,preferences").single();
        if (error) throw error;
        return data;
    }

    async function updateInsightStatus(userId, insight, status) {
        const decidedAt = new Date().toISOString();
        const api = requireClient();
        const { data, error } = await api.from("insights")
            .update({ status, decided_at: decidedAt })
            .eq("user_id", userId)
            .eq("insight_key", insight.id)
            .select()
            .single();
        if (error) throw error;
        const { error: feedbackError } = await api.from("insight_feedback").insert({
            user_id: userId,
            insight_key: insight.id,
            insight_title: insight.title,
            insight_topic: insight.topic,
            decision: status,
        });
        if (feedbackError) throw feedbackError;
        return mapInsight(data);
    }

    async function trackEvent(userId, eventName, page, properties = {}) {
        const { error } = await requireClient().from("analytics_events").insert({
            user_id: userId,
            event_name: eventName,
            page: page || "",
            properties,
        });
        if (error) throw error;
    }

    async function submitFeedback(userId, score, category, message, context = {}) {
        const { error } = await requireClient().from("product_feedback").insert({
            user_id: userId,
            score,
            category,
            message,
            context,
        });
        if (error) throw error;
    }

    async function uploadAvatar(userId, file, previousPath = null) {
        const api = requireClient();
        const extension = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
        const path = `${userId}/avatar-${Date.now()}.${extension}`;
        const { error: uploadError } = await api.storage.from("action-avatars").upload(path, file, { upsert: false, contentType: file.type });
        if (uploadError) throw uploadError;
        if (previousPath && previousPath !== path) await api.storage.from("action-avatars").remove([previousPath]);
        const { data, error } = await api.storage.from("action-avatars").createSignedUrl(path, 604800);
        if (error) throw error;
        return { path, url: data.signedUrl };
    }

    async function removeAvatar(path) {
        if (!path) return;
        const { error } = await requireClient().storage.from("action-avatars").remove([path]);
        if (error) throw error;
    }

    async function remove(table, id, storagePath) {
        const api = requireClient();
        if (storagePath) await api.storage.from("action-documents").remove([storagePath]);
        const { error } = await api.from(table).delete().eq("id", id);
        if (error) throw error;
    }

    async function invoke(name, body = {}) {
        const { data, error } = await requireClient().functions.invoke(name, { body });
        if (error) throw error;
        return data;
    }

    function subscribe(userId, onChange) {
        const api = requireClient();
        const channel = api.channel(`action-workspace-${userId}`);
        ["notes", "documents", "insights", "weekly_reports", "agent_goals", "agent_messages", "agent_plan_steps", "agent_check_ins"].forEach((table) => {
            channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` }, onChange);
        });
        channel.on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` }, onChange);
        channel.subscribe();
        return () => api.removeChannel(channel);
    }

    global.ActionCloud = {
        configured,
        init,
        signIn,
        signInWithProvider,
        signUp,
        resendSignup,
        verifySignupOtp,
        signOut,
        loadWorkspace,
        syncNotes,
        syncDocuments,
        syncInsights,
        syncWeeklyReports,
        exportWorkspace,
        uploadDocument,
        updateProfile,
        updateInsightStatus,
        trackEvent,
        submitFeedback,
        uploadAvatar,
        removeAvatar,
        remove,
        invoke,
        subscribe,
        mapInsight,
        mapWeeklyReport,
        mapNote,
        mapAgent,
    };
})(window);
