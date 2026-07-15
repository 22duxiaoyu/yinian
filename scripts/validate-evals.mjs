import { readFile } from "node:fs/promises";

const path = new URL("../evals/insight-cases.json", import.meta.url);
const suite = JSON.parse(await readFile(path, "utf8"));
const failures = [];

for (const item of suite.cases) {
  const inputIds = new Set(item.inputs.map((input) => input.id));
  const refs = Array.isArray(item.candidate.evidence_refs) ? item.candidate.evidence_refs : [];
  const text = `${item.candidate.title || ""} ${item.candidate.detail || ""}`;
  if (refs.some((id) => !inputIds.has(id))) failures.push(`${item.id}: 引用了不存在的证据`);
  if (refs.length < Number(item.expect.min_evidence || 0)) failures.push(`${item.id}: 证据数量不足`);
  if (Number(item.candidate.confidence || 0) > Number(item.expect.max_confidence || 100)) failures.push(`${item.id}: 可信度超过护栏`);
  for (const phrase of item.expect.forbid || []) if (text.includes(phrase)) failures.push(`${item.id}: 重复了禁止结论“${phrase}”`);
  for (const phrase of item.expect.require || []) if (!text.includes(phrase)) failures.push(`${item.id}: 缺少必要语义“${phrase}”`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Action AI 离线评测通过：${suite.cases.length} 个案例，证据引用、反馈继承、可信度和注入防护均满足护栏。`);
