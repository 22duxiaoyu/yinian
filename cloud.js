(function createActionCloud(global) {
    const config = global.ACTION_CLOUD_CONFIG || {};
    const configured = Boolean(config.supabaseUrl && config.publishableKey);
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
        if (!configured) return { configured: false, session: null };
        const library = await loadSupabaseLibrary();
        client = library.createClient(config.supabaseUrl, config.publishableKey, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        return { configured: true, session: data.session };
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
            evidenceRefs: Array.isArray(row.evidence_refs) ? row.evidence_refs : [],
        };
    }

    async function signIn(email, password) {
        const { data, error } = await requireClient().auth.signInWithPassword({ email, password });
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

    async function signOut() {
        const { error } = await requireClient().auth.signOut();
        if (error) throw error;
    }

    async function loadWorkspace(user) {
        const api = requireClient();
        const [profileResult, notesResult, documentsResult, insightsResult, weeklyResult] = await Promise.all([
            api.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
            api.from("notes").select("*").order("updated_at", { ascending: false }),
            api.from("documents").select("*").order("parsed_at", { ascending: false }),
            api.from("insights").select("*").order("updated_at", { ascending: false }),
            api.from("weekly_reports").select("*").order("week_start", { ascending: false }).limit(1).maybeSingle(),
        ]);
        const error = [profileResult, notesResult, documentsResult, insightsResult, weeklyResult].find((result) => result.error)?.error;
        if (error) throw error;
        const fallbackName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Action 用户";
        if (!profileResult.data) {
            const { error: profileError } = await api.from("profiles").upsert({ id: user.id, display_name: fallbackName });
            if (profileError) throw profileError;
        }
        return {
            user: {
                id: user.id,
                email: user.email || "",
                name: profileResult.data?.display_name || fallbackName,
                cloud: true,
            },
            notes: (notesResult.data || []).map(mapNote),
            documents: (documentsResult.data || []).map(mapDocument),
            insights: (insightsResult.data || []).map(mapInsight),
            weeklyReport: weeklyResult.data || null,
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
            keywords: document.keywords || [],
            cards: document.cards || [],
            parsed_at: document.parsedAt,
            storage_path: document.storagePath || null,
        }));
        const { data, error } = await requireClient().from("documents").upsert(rows).select();
        if (error) throw error;
        return data.map(mapDocument);
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
        ["notes", "documents", "insights", "weekly_reports"].forEach((table) => {
            channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` }, onChange);
        });
        channel.subscribe();
        return () => api.removeChannel(channel);
    }

    global.ActionCloud = {
        configured,
        init,
        signIn,
        signUp,
        resendSignup,
        signOut,
        loadWorkspace,
        syncNotes,
        syncDocuments,
        uploadDocument,
        remove,
        invoke,
        subscribe,
        mapInsight,
    };
})(window);
