create or replace function public.decide_insight(
  p_insight_key text,
  p_label text,
  p_topic text,
  p_title text,
  p_detail text,
  p_evidence_count integer,
  p_confidence integer,
  p_accent text,
  p_status text,
  p_evidence_refs jsonb default '[]'::jsonb
)
returns public.insights
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  saved_insight public.insights;
begin
  if actor_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if p_status not in ('confirmed', 'rejected') then
    raise exception 'INVALID_INSIGHT_STATUS' using errcode = '22023';
  end if;
  if nullif(btrim(p_insight_key), '') is null then
    raise exception 'INSIGHT_KEY_REQUIRED' using errcode = '22023';
  end if;

  insert into public.insights (
    user_id,
    insight_key,
    label,
    topic,
    title,
    detail,
    evidence_count,
    confidence,
    accent,
    status,
    decided_at,
    evidence_refs
  ) values (
    actor_id,
    p_insight_key,
    coalesce(nullif(btrim(p_label), ''), '行为模式'),
    coalesce(nullif(btrim(p_topic), ''), '待确认主题'),
    coalesce(nullif(btrim(p_title), ''), '待确认洞察'),
    coalesce(p_detail, ''),
    greatest(0, coalesce(p_evidence_count, 0)),
    least(100, greatest(0, coalesce(p_confidence, 0))),
    case when coalesce(p_accent, '') ~ '^#[0-9a-fA-F]{6}$' then p_accent else '#667d92' end,
    p_status,
    now(),
    case when jsonb_typeof(coalesce(p_evidence_refs, '[]'::jsonb)) = 'array' then coalesce(p_evidence_refs, '[]'::jsonb) else '[]'::jsonb end
  )
  on conflict (user_id, insight_key) do update set
    label = excluded.label,
    topic = excluded.topic,
    title = excluded.title,
    detail = excluded.detail,
    evidence_count = excluded.evidence_count,
    confidence = excluded.confidence,
    accent = excluded.accent,
    status = excluded.status,
    decided_at = excluded.decided_at,
    evidence_refs = excluded.evidence_refs
  returning * into saved_insight;

  insert into public.insight_feedback (
    user_id,
    insight_key,
    insight_title,
    insight_topic,
    decision
  ) values (
    actor_id,
    saved_insight.insight_key,
    saved_insight.title,
    saved_insight.topic,
    saved_insight.status
  );

  return saved_insight;
end;
$$;

revoke all on function public.decide_insight(text, text, text, text, text, integer, integer, text, text, jsonb) from public;
grant execute on function public.decide_insight(text, text, text, text, text, integer, integer, text, text, jsonb) to authenticated;
