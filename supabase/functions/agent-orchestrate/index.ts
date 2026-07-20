import { authenticatedClient, corsHeaders, functionError, generateJson, json } from "../_shared/runtime.ts";

type JsonObject = Record<string, unknown>;

const OPEN_STATUSES = ["clarifying", "ready", "active", "paused"];

function cleanText(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function asList(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback;
}

function addDaysIso(days: number, hour = 10) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + Math.max(0, days));
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

function validDate(value: unknown) {
  const text = cleanText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function normalizeQuestions(value: unknown) {
  return asList(value).map((item, index) => {
    const source = typeof item === "string" ? { question: item } : asObject(item);
    return {
      id: cleanText(source.id, `question-${index + 1}`),
      question: cleanText(source.question),
      why: cleanText(source.why),
    };
  }).filter((item) => item.question).slice(0, 3);
}

function normalizePlan(value: unknown) {
  return asList(value).map((item, index) => {
    const source = asObject(item);
    const offset = clamp(source.due_offset_days, 0, 30, index);
    return {
      position: index + 1,
      title: cleanText(source.title, `第 ${index + 1} 步`),
      detail: cleanText(source.detail),
      duration_minutes: clamp(source.duration_minutes, 5, 480, 15),
      due_at: addDaysIso(offset),
      success_criteria: cleanText(source.success_criteria, "留下一个可以检查的结果"),
    };
  }).filter((item) => item.title).slice(0, 5);
}

async function loadMemory(client: any) {
  const [{ data: notes, error: notesError }, { data: documents, error: documentsError }, { data: insights, error: insightsError }] = await Promise.all([
    client.from("notes").select("id,title,content,type,tags,done,result_text,result_outcome,updated_at").order("updated_at", { ascending: false }).limit(40),
    client.from("documents").select("id,name,summary,keywords,parsed_at").order("parsed_at", { ascending: false }).limit(15),
    client.from("insights").select("insight_key,topic,title,detail,confidence,status,evidence_refs").neq("status", "rejected").order("updated_at", { ascending: false }).limit(8),
  ]);
  if (notesError) throw notesError;
  if (documentsError) throw documentsError;
  if (insightsError) throw insightsError;
  return { notes: notes || [], documents: documents || [], insights: insights || [] };
}

async function loadGoalContext(client: any, goalId: string) {
  const [{ data: goal, error: goalError }, { data: messages, error: messagesError }, { data: steps, error: stepsError }] = await Promise.all([
    client.from("agent_goals").select("*").eq("id", goalId).single(),
    client.from("agent_messages").select("role,kind,content,metadata,created_at").eq("goal_id", goalId).order("created_at", { ascending: true }).limit(30),
    client.from("agent_plan_steps").select("*").eq("goal_id", goalId).order("version", { ascending: true }).order("position", { ascending: true }),
  ]);
  if (goalError) throw goalError;
  if (messagesError) throw messagesError;
  if (stepsError) throw stepsError;
  return { goal, messages: messages || [], steps: steps || [] };
}

async function snapshot(client: any, goalId = "") {
  let goal = null;
  if (goalId) {
    const result = await client.from("agent_goals").select("*").eq("id", goalId).maybeSingle();
    if (result.error) throw result.error;
    goal = result.data;
  } else {
    const result = await client.from("agent_goals").select("*").in("status", OPEN_STATUSES).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (result.error) throw result.error;
    goal = result.data;
  }
  if (!goal) return { goal: null, messages: [], steps: [], check_ins: [], progress: { completed: 0, total: 0, percentage: 0 } };
  const [{ data: messages, error: messagesError }, { data: steps, error: stepsError }, { data: checkIns, error: checkInsError }] = await Promise.all([
    client.from("agent_messages").select("*").eq("goal_id", goal.id).order("created_at", { ascending: true }).limit(50),
    client.from("agent_plan_steps").select("*").eq("goal_id", goal.id).order("version", { ascending: false }).order("position", { ascending: true }),
    client.from("agent_check_ins").select("*").eq("goal_id", goal.id).order("due_at", { ascending: true }).limit(20),
  ]);
  if (messagesError) throw messagesError;
  if (stepsError) throw stepsError;
  if (checkInsError) throw checkInsError;
  const currentSteps = (steps || []).filter((step: any) => Number(step.version) === Number(goal.current_plan_version));
  const completed = currentSteps.filter((step: any) => step.status === "completed").length;
  return {
    goal,
    messages: messages || [],
    steps: currentSteps,
    check_ins: checkIns || [],
    progress: { completed, total: currentSteps.length, percentage: currentSteps.length ? Math.round(completed / currentSteps.length * 100) : 0 },
  };
}

async function createRun(client: any, userId: string, action: string, goalId: string | null, input: JsonObject) {
  const trigger = action === "check_in" || action === "complete_step" ? "check_in" : "user";
  const { data, error } = await client.from("agent_runs").insert({
    user_id: userId,
    goal_id: goalId,
    trigger,
    phase: action,
    input,
  }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

async function finishRun(client: any, runId: string, goalId: string | null, summary: string, output: JsonObject) {
  const { error } = await client.from("agent_runs").update({
    goal_id: goalId,
    status: "completed",
    summary,
    output,
    completed_at: new Date().toISOString(),
  }).eq("id", runId);
  if (error) throw error;
}

function validateAction(action: string, body: JsonObject, goalId: string | null) {
  const supported = new Set(["start", "answer", "approve", "complete_step", "check_in", "pause", "resume", "cancel", "status"]);
  if (!supported.has(action)) return "不支持的 Agent 操作";
  if (action === "start" && !cleanText(body.message)) return "请先描述你想推进的目标";
  if (["answer", "check_in"].includes(action) && (!goalId || !cleanText(body.message))) return "缺少目标或补充信息";
  if (["approve", "complete_step", "pause", "resume", "cancel"].includes(action) && !goalId) return "缺少目标";
  if (action === "complete_step" && !cleanText(body.step_id)) return "缺少计划步骤";
  return "";
}

async function draftGoal(client: any, message: string, goalContext: JsonObject | null) {
  const memory = await loadMemory(client);
  const result = await generateJson(
    "你是 Action 的个人行动编排器。你的任务不是直接给一串待办，而是先判断目标是否清楚，再提出最多 5 步、每步可验证的计划。只能使用用户当前表达和其私人记录作为上下文，不得编造经历。若缺少完成标准、约束或可执行范围，needs_clarification 必须为 true，并提出 1 至 3 个最关键问题，此时 plan 必须为空。信息足够时 needs_clarification 为 false。输出 JSON：goal 包含 title、objective、success_criteria、target_date、constraints、context_summary；assistant_message；needs_clarification；questions 数组；plan 数组。plan 每项包含 title、detail、duration_minutes、due_offset_days、success_criteria。计划必须由用户确认后才能执行。全部使用简洁中文。",
    { user_message: message, current_goal: goalContext, memory },
  ) as JsonObject;
  const generatedGoal = asObject(result.goal);
  const questions = normalizeQuestions(result.questions);
  const plan = normalizePlan(result.plan);
  const needsClarification = Boolean(result.needs_clarification) || (!plan.length && questions.length > 0);
  return {
    goal: {
      title: cleanText(generatedGoal.title, message.slice(0, 28) || "新的行动目标"),
      objective: cleanText(generatedGoal.objective, message),
      success_criteria: cleanText(generatedGoal.success_criteria),
      target_date: validDate(generatedGoal.target_date),
      constraints: asObject(generatedGoal.constraints),
      context: { summary: cleanText(generatedGoal.context_summary) },
    },
    assistantMessage: cleanText(result.assistant_message, needsClarification ? "我还需要确认几个关键信息。" : "我整理了一版计划，确认后才会创建行动。"),
    needsClarification,
    questions,
    plan: needsClarification ? [] : plan,
  };
}

async function persistDraft(client: any, userId: string, goalId: string, draft: any, nextVersion: number) {
  const status = draft.needsClarification || !draft.plan.length ? "clarifying" : "ready";
  const { error: goalError } = await client.from("agent_goals").update({
    ...draft.goal,
    status,
    current_plan_version: status === "ready" ? nextVersion : Math.max(0, nextVersion - 1),
  }).eq("id", goalId);
  if (goalError) throw goalError;
  if (status === "ready") {
    const { error: deleteError } = await client.from("agent_plan_steps").delete().eq("goal_id", goalId).eq("status", "proposed");
    if (deleteError) throw deleteError;
    const rows = draft.plan.map((step: any) => ({ ...step, user_id: userId, goal_id: goalId, version: nextVersion, status: "proposed" }));
    const { error: stepsError } = await client.from("agent_plan_steps").insert(rows);
    if (stepsError) throw stepsError;
  }
  const content = [draft.assistantMessage, ...draft.questions.map((item: any, index: number) => `${index + 1}．${item.question}`)].join("\n");
  const { error: messageError } = await client.from("agent_messages").insert({
    user_id: userId,
    goal_id: goalId,
    role: "assistant",
    kind: status === "ready" ? "plan" : "clarification",
    content,
    metadata: { questions: draft.questions },
  });
  if (messageError) throw messageError;
  return status;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);

  let runClient: any = null;
  let runId = "";
  try {
    const body = asObject(await request.json().catch(() => ({})));
    const action = cleanText(body.action, "status");
    const requestedGoalId = cleanText(body.goal_id) || null;
    const { client, user } = await authenticatedClient(request);
    const validationError = validateAction(action, body, requestedGoalId);
    if (validationError) return json(request, { error: validationError }, 400);
    runClient = client;
    runId = await createRun(client, user.id, action, requestedGoalId, body);
    let goalId = requestedGoalId;
    let createdNotes: any[] = [];
    let summary = "Agent 状态已读取";

    if (action === "start") {
      const message = cleanText(body.message);
      const { data: goal, error: goalError } = await client.from("agent_goals").insert({
        user_id: user.id,
        title: message.slice(0, 28),
        objective: message,
        status: "clarifying",
      }).select("id").single();
      if (goalError) throw goalError;
      const activeGoalId = goal.id as string;
      goalId = activeGoalId;
      const { error: userMessageError } = await client.from("agent_messages").insert({ user_id: user.id, goal_id: activeGoalId, role: "user", kind: "goal", content: message });
      if (userMessageError) throw userMessageError;
      const draft = await draftGoal(client, message, null);
      const status = await persistDraft(client, user.id, activeGoalId, draft, 1);
      summary = status === "ready" ? "已生成待确认计划" : "已提出目标澄清问题";
    } else if (action === "answer") {
      const activeGoalId = goalId as string;
      const message = cleanText(body.message);
      const context = await loadGoalContext(client, activeGoalId);
      const { error: messageError } = await client.from("agent_messages").insert({ user_id: user.id, goal_id: activeGoalId, role: "user", kind: "clarification", content: message });
      if (messageError) throw messageError;
      const draft = await draftGoal(client, message, context);
      const nextVersion = Number(context.goal.current_plan_version || 0) + 1;
      const status = await persistDraft(client, user.id, activeGoalId, draft, nextVersion);
      summary = status === "ready" ? "补充信息后已生成待确认计划" : "继续澄清目标";
    } else if (action === "approve") {
      const activeGoalId = goalId as string;
      const context = await loadGoalContext(client, activeGoalId);
      const version = Number(context.goal.current_plan_version || 0);
      const steps = context.steps.filter((step: any) => Number(step.version) === version && step.status === "proposed");
      if (!steps.length) {
        const { error: runError } = await client.from("agent_runs").update({ status: "failed", error: "NO_PROPOSED_PLAN", completed_at: new Date().toISOString() }).eq("id", runId);
        if (runError) throw runError;
        return json(request, { error: "当前没有待确认的计划" }, 409);
      }
      createdNotes = steps.map((step: any, index: number) => ({
        id: crypto.randomUUID(),
        user_id: user.id,
        title: step.title,
        content: [step.detail, step.success_criteria ? `完成标准：${step.success_criteria}` : ""].filter(Boolean).join("\n\n"),
        type: "task",
        mood: "清醒",
        tags: ["Agent计划", context.goal.title].slice(0, 2),
        agent_goal_id: activeGoalId,
        agent_step_id: step.id,
        due_at: step.due_at,
        priority: index === 0 ? "high" : "normal",
      }));
      const { data: notes, error: notesError } = await client.from("notes").insert(createdNotes).select();
      if (notesError) throw notesError;
      createdNotes = notes || [];
      const currentStepIds = new Set(steps.map((step: any) => step.id));
      const { data: existingGoalNotes, error: existingNotesError } = await client
        .from("notes")
        .select("id,agent_step_id,done")
        .eq("agent_goal_id", activeGoalId)
        .eq("done", false);
      if (existingNotesError) throw existingNotesError;
      const outdatedNoteIds = (existingGoalNotes || [])
        .filter((note: any) => note.agent_step_id && !currentStepIds.has(note.agent_step_id))
        .map((note: any) => note.id);
      if (outdatedNoteIds.length) {
        const { error: archiveError } = await client.from("notes").update({ archived: true }).in("id", outdatedNoteIds);
        if (archiveError) throw archiveError;
      }
      const stepUpdates = await Promise.all(steps.map((step: any) => {
        const note = createdNotes.find((item: any) => item.agent_step_id === step.id);
        return client.from("agent_plan_steps").update({ status: "approved", note_id: note?.id || null }).eq("id", step.id);
      }));
      const failedStepUpdate = stepUpdates.find((result: any) => result.error);
      if (failedStepUpdate?.error) throw failedStepUpdate.error;
      const checkIns = steps.map((step: any) => ({
        user_id: user.id,
        goal_id: activeGoalId,
        step_id: step.id,
        due_at: step.due_at || addDaysIso(step.position),
        question: `“${step.title}”推进得怎么样？已经完成、遇到阻碍，还是需要调整？`,
      }));
      const { error: checkInError } = await client.from("agent_check_ins").insert(checkIns);
      if (checkInError) throw checkInError;
      const nextCheckIn = checkIns.map((item) => item.due_at).sort()[0] || addDaysIso(1);
      const { error: activateError } = await client.from("agent_goals").update({ status: "active", next_check_in_at: nextCheckIn }).eq("id", activeGoalId);
      if (activateError) throw activateError;
      const { error: approvedMessageError } = await client.from("agent_messages").insert({
        user_id: user.id,
        goal_id: activeGoalId,
        role: "assistant",
        kind: "status",
        content: `计划已确认。我已把 ${steps.length} 个步骤放进行动页，并会按节点回来询问结果。`,
      });
      if (approvedMessageError) throw approvedMessageError;
      summary = `已确认计划并创建 ${steps.length} 个行动`;
    } else if (action === "complete_step") {
      const activeGoalId = goalId as string;
      const stepId = cleanText(body.step_id);
      const completed = body.completed !== false;
      const { data: updatedStep, error: stepError } = await client.from("agent_plan_steps").update({ status: completed ? "completed" : "approved" }).eq("id", stepId).eq("goal_id", activeGoalId).select("id").maybeSingle();
      if (stepError) throw stepError;
      if (!updatedStep) throw new Error("AGENT_STEP_NOT_FOUND");
      if (completed) {
        await client.from("agent_check_ins").update({ status: "answered", outcome: "completed", answered_at: new Date().toISOString() }).eq("step_id", stepId).eq("status", "scheduled");
      }
      const current = await loadGoalContext(client, activeGoalId);
      const versionSteps = current.steps.filter((step: any) => Number(step.version) === Number(current.goal.current_plan_version));
      const allDone = versionSteps.length > 0 && versionSteps.every((step: any) => step.id === stepId ? completed : step.status === "completed" || step.status === "skipped");
      const nextStep = versionSteps.find((step: any) => step.id !== stepId && !["completed", "skipped"].includes(step.status));
      const { error: goalError } = await client.from("agent_goals").update({
        status: allDone ? "completed" : "active",
        next_check_in_at: allDone ? null : nextStep?.due_at || addDaysIso(1),
      }).eq("id", activeGoalId);
      if (goalError) throw goalError;
      if (allDone) {
        const { error: messageError } = await client.from("agent_messages").insert({
          user_id: user.id,
          goal_id: activeGoalId,
          role: "assistant",
          kind: "status",
          content: "这个目标的计划步骤已经全部完成。下一步是核对结果是否真正满足完成标准。",
        });
        if (messageError) throw messageError;
      }
      summary = allDone ? "目标的全部计划步骤已完成" : completed ? "计划步骤已完成" : "计划步骤已恢复";
    } else if (action === "check_in") {
      const activeGoalId = goalId as string;
      const message = cleanText(body.message);
      const context = await loadGoalContext(client, activeGoalId);
      const { error: userMessageError } = await client.from("agent_messages").insert({ user_id: user.id, goal_id: activeGoalId, role: "user", kind: "feedback", content: message });
      if (userMessageError) throw userMessageError;
      const memory = await loadMemory(client);
      const result = await generateJson(
        "你是 Action 的执行跟进助手。根据用户目标、计划、真实行动结果和本次反馈判断下一步。不要责备用户。若只是小阻碍，给一个更小的下一步；若目标或约束发生明显变化，replan_required 为 true，并提出新的 plan，等待用户再次确认。输出 JSON：assistant_message、assessment、replan_required、plan。plan 结构与行动计划一致。",
        { feedback: message, goal: context.goal, steps: context.steps, memory },
      ) as JsonObject;
      const replan = Boolean(result.replan_required);
      const plan = normalizePlan(result.plan);
      const nextCheckInAt = addDaysIso(2);
      if (replan && plan.length) {
        const nextVersion = Number(context.goal.current_plan_version || 0) + 1;
        const rows = plan.map((step) => ({ ...step, user_id: user.id, goal_id: activeGoalId, version: nextVersion, status: "proposed" }));
        const { error: planError } = await client.from("agent_plan_steps").insert(rows);
        if (planError) throw planError;
        const { error: goalError } = await client.from("agent_goals").update({ status: "ready", current_plan_version: nextVersion, next_check_in_at: null }).eq("id", activeGoalId);
        if (goalError) throw goalError;
        const { error: dismissError } = await client.from("agent_check_ins").update({ status: "dismissed" }).eq("goal_id", activeGoalId).eq("status", "scheduled");
        if (dismissError) throw dismissError;
      } else {
        const { error: goalError } = await client.from("agent_goals").update({ status: "active", next_check_in_at: nextCheckInAt }).eq("id", activeGoalId);
        if (goalError) throw goalError;
        const { error: nextCheckInError } = await client.from("agent_check_ins").insert({
          user_id: user.id,
          goal_id: activeGoalId,
          due_at: nextCheckInAt,
          question: "这次调整后有新的结果或阻碍吗？",
        });
        if (nextCheckInError) throw nextCheckInError;
      }
      const assistantMessage = cleanText(result.assistant_message, replan ? "情况发生了变化，我整理了一版新计划，确认后再替换执行。" : "收到。我会继续依据真实结果跟进，而不是只看计划完成数量。");
      const { data: pendingCheckIn, error: pendingCheckInError } = await client
        .from("agent_check_ins")
        .select("id")
        .eq("goal_id", activeGoalId)
        .eq("status", "scheduled")
        .lt("due_at", nextCheckInAt)
        .order("due_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (pendingCheckInError) throw pendingCheckInError;
      if (pendingCheckIn?.id) {
        const { error: answerCheckInError } = await client.from("agent_check_ins").update({
          status: "answered",
          response: message,
          outcome: replan ? "replan" : cleanText(result.assessment, "progress"),
          answered_at: new Date().toISOString(),
        }).eq("id", pendingCheckIn.id);
        if (answerCheckInError) throw answerCheckInError;
      }
      const { error: assistantError } = await client.from("agent_messages").insert({ user_id: user.id, goal_id: activeGoalId, role: "assistant", kind: replan ? "plan" : "feedback", content: assistantMessage, metadata: { assessment: cleanText(result.assessment), replan_required: replan } });
      if (assistantError) throw assistantError;
      summary = replan ? "反馈触发了待确认的新计划" : "已记录反馈并安排下一次跟进";
    } else if (action === "pause" || action === "resume") {
      const activeGoalId = goalId as string;
      const status = action === "pause" ? "paused" : "active";
      const { error: goalError } = await client.from("agent_goals").update({ status, next_check_in_at: status === "paused" ? null : addDaysIso(1) }).eq("id", activeGoalId);
      if (goalError) throw goalError;
      summary = status === "paused" ? "目标已暂停" : "目标已恢复";
    } else if (action === "cancel") {
      const activeGoalId = goalId as string;
      const { error: goalError } = await client.from("agent_goals").update({ status: "cancelled", next_check_in_at: null }).eq("id", activeGoalId);
      if (goalError) throw goalError;
      const { error: checkInError } = await client.from("agent_check_ins").update({ status: "dismissed" }).eq("goal_id", activeGoalId).eq("status", "scheduled");
      if (checkInError) throw checkInError;
      const { error: archiveError } = await client.from("notes").update({ archived: true }).eq("agent_goal_id", activeGoalId).eq("done", false);
      if (archiveError) throw archiveError;
      summary = "当前目标已结束，已有结果继续保留";
    }

    const agent = await snapshot(client, goalId || "");
    await finishRun(client, runId, agent.goal?.id || goalId, summary, { status: agent.goal?.status || "empty", progress: agent.progress });
    return json(request, { agent, created_notes: createdNotes, summary });
  } catch (error) {
    if (runClient && runId) {
      try {
        await runClient.from("agent_runs").update({
          status: "failed",
          error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
          completed_at: new Date().toISOString(),
        }).eq("id", runId);
      } catch {
        // Preserve the original execution error for the caller.
      }
    }
    return functionError(request, error);
  }
});
