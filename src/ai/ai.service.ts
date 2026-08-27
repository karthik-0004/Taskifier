import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIService } from './openai.service';

const SYSTEM_PROMPT = `You are a technical report writer. Your job is to summarize a developer's workday based strictly on the structured activity data provided.

RULES:
- Treat "notes" (from the data) as actual work accomplishments. Do NOT say "The developer made a note that...", present the contents directly as work completed.
- Present the work as a clear, line-by-line bulleted list.
- Group the work under the respective Project names provided in the data.
- Only describe what is explicitly present in the data. Do not infer outcomes, impact, code quality, or intent.
- Do not evaluate or judge the work.
- If a section has no data, leave it empty — do not invent content.
- Use plain, professional language.

OUTPUT FORMAT — use exactly these sections:

### Daily Summary

**Today's Work:**
*<Project Name 1>:*
- <Bullet point 1>
- <Bullet point 2>

*<Project Name 2>:*
- <Bullet point 1>

*(If there is unassigned work, list it under *General/Unassigned*:)*`;

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAIService,
  ) {}

  async buildDayContext(userId: string, dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00.000Z');
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

    const sessions = await this.prisma.workSession.findMany({
      where: {
        userId,
        OR: [
          { startedAt: { gte: date, lt: nextDate } },
          { endedAt: { gte: date, lt: nextDate } },
          { endedAt: null }
        ]
      },
      include: {
        project: { select: { id: true, name: true } },
        activityEvents: { 
          where: { timestamp: { gte: date, lt: nextDate } },
          orderBy: { timestamp: 'asc' } 
        },
        workUpdates: { 
          where: { createdAt: { gte: date, lt: nextDate } },
          orderBy: { createdAt: 'asc' } 
        },
      },
    });

    const projects: Record<string, any> = {};
    const unassignedWork: any = { commits: [], notes: [], totalMinutes: 0 };

    for (const session of sessions) {
      const projId = session.project?.id || 'unassigned';
      if (projId !== 'unassigned' && !projects[projId]) {
        projects[projId] = {
          name: session.project!.name,
          commits: [],
          notes: [],
          totalMinutes: 0
        };
      }
      const target = projId === 'unassigned' ? unassignedWork : projects[projId];

      if (session.endedAt) {
        target.totalMinutes += Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000);
      }

      for (const event of session.activityEvents) {
        if (event.type === 'COMMIT') {
          target.commits.push({ message: (event.payload as any).message });
        }
      }

      for (const update of session.workUpdates) {
        target.notes.push(update.finalContent);
      }
    }

    return {
      date: dateStr,
      projects: Object.values(projects),
      unassignedWork: unassignedWork.commits.length > 0 || unassignedWork.notes.length > 0 ? unassignedWork : undefined,
      hasActiveSession: sessions.some((s) => !s.endedAt),
    };
  }

  async generateDailySummary(userId: string, dateStr: string) {
    const context = await this.buildDayContext(userId, dateStr);

    const userMessage = JSON.stringify(context, null, 2);

    const generatedText = await this.openai.generateText(SYSTEM_PROMPT, userMessage);

    return {
      date: dateStr,
      generatedText,
    };
  }

  async generateWeeklySummary(dailyContents: string[]) {
    const userMessage = dailyContents
      .map((c, i) => `=== Day ${i + 1} ===\n${c}`)
      .join('\n\n');

    const generatedText = await this.openai.generateText(
      WEEKLY_SYSTEM_PROMPT,
      userMessage,
    );

    return generatedText;
  }

  async enhanceUpdate(rawCommits: any[], manualTask?: string) {
    const input = JSON.stringify({
      rawCommits,
      manualTask,
    }, null, 2);

    const generatedText = await this.openai.generateText(
      ENHANCE_UPDATE_SYSTEM_PROMPT,
      input,
    );

    return generatedText.trim();
  }
}

const WEEKLY_SYSTEM_PROMPT = `You are a technical report writer consolidating a developer's daily summaries into a weekly report.

RULES:
- Only describe what is explicitly present in the daily summaries provided. Do not infer outcomes, impact, code quality, or intent.
- Do not add details, examples, or explanations that are not present in the input.
- Do not evaluate or judge the work (no "good progress", "well done", "needs improvement").
- If a section has no data, leave it empty — do not invent content.
- Use plain, professional language.

OUTPUT FORMAT — use exactly these five sections:

Features Completed:
<list of features or deliverables completed this week>

Bugs Fixed:
<list of bugs or issues fixed this week>

PRs Merged:
<list of pull requests merged or opened this week>

Blockers:
<list any blockers mentioned across the daily summaries>

Upcoming Work:
<list any planned or upcoming work mentioned across the daily summaries>`;

function normalizeFilesChanged(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((f): f is string => typeof f === 'string');
  }
  if (typeof value === 'number') {
    return [`${value} files changed`];
  }
  return [];
}

const ENHANCE_UPDATE_SYSTEM_PROMPT = `You are an AI assistant responsible for formatting Git commit history into a professional daily work update.

### Instructions

1. Analyze **each Git commit independently**.
2. **Do not combine, merge, or infer relationships** between different commits unless they clearly belong to the same logical task.
3. Preserve the intent of every commit as a separate work item.
4. Enhance the wording to make it professional and easy for managers to understand.
5. Follow common Git commit conventions:
   * **feat:** New feature or functionality
   * **fix:** Bug fix or issue resolution
   * **refactor:** Code restructuring without changing functionality
   * **docs:** Documentation updates
   * **style:** Formatting or styling changes
   * **test:** Test creation or modification
   * **perf:** Performance improvements
   * **build:** Build system or dependency updates
   * **ci:** CI/CD pipeline changes
   * **chore:** Maintenance or miscellaneous tasks
   * **revert:** Reverted previous changes
6. For each commit:
   * Identify its commit type.
   * Rewrite the commit message into a clear professional sentence.
   * Keep the output concise (1–2 lines per commit).
   * Do not invent work that is not mentioned.
   * Do not assume multiple commits are related.
7. If a manual task is provided, treat it as an additional work item (similar to a commit message) and categorize it under Completed Work along with the commits.

### Output Format

#### Completed Work

**Feature**
* Created the database table for employees.

**Bug Fix**
* Altered the required database rows to resolve the identified issue.

**Bug Fix**
* Fixed the customers table mismatch issue.


### Important Rules

* Every Git commit should result in its own output item.
* Never summarize multiple commits into a single paragraph.
* Never create a story connecting unrelated commits.
* Never change the technical meaning of a commit.
* Preserve the chronological order of commits.
* Use professional, manager-friendly language while remaining technically accurate.`;
