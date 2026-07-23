import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIService } from './openai.service';

const SYSTEM_PROMPT = `You are a technical report writer. Your job is to summarize a developer's workday based strictly on the structured activity data provided.

RULES:
- Only describe what is explicitly present in the data. Do not infer outcomes, impact, code quality, or intent.
- Do not add details, examples, or explanations that are not in the data.
- Do not evaluate or judge the work (no "good progress", "well done", "needs improvement").
- If a section has no data, leave it empty — do not invent content.
- Use plain, professional language.

OUTPUT FORMAT — use exactly these four sections:

Today's Work:
<summary of commits, PRs opened, projects worked on, and general activity>

In Progress:
<mention any session still active (no end time) or work-in-progress indicators>

Blockers:
<leave empty if nothing in the data suggests a blocker>

Tomorrow:
<leave empty — this is for the employee to fill in>`;

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
        startedAt: { gte: date, lt: nextDate },
      },
      include: {
        project: { select: { id: true, name: true } },
        activityEvents: { orderBy: { timestamp: 'asc' } },
      },
    });

    const projectsWorkedOn = [
      ...new Map(
        sessions
          .filter((s) => s.project)
          .map((s) => [s.project!.id, { id: s.project!.id, name: s.project!.name }]),
      ).values(),
    ];

    const commits: { message: string; filesChanged: string[] }[] = [];
    const branchSwitches: { from: string; to: string; timestamp: string }[] = [];
    const pullRequests: { number: number; title: string; url: string }[] = [];

    for (const session of sessions) {
      for (const event of session.activityEvents) {
        const payload = event.payload as any;
        switch (event.type) {
          case 'COMMIT':
            commits.push({
              message: payload.message,
              filesChanged: normalizeFilesChanged(payload.filesChanged),
            });
            break;
          case 'BRANCH_SWITCH':
            branchSwitches.push({
              from: payload.from,
              to: payload.to,
              timestamp: event.timestamp.toISOString(),
            });
            break;
          case 'PR_OPENED':
            pullRequests.push({
              number: payload.number,
              title: payload.title,
              url: payload.url,
            });
            break;
        }
      }
    }

    const totalSessionMinutes = sessions.reduce((sum, s) => {
      if (s.endedAt) {
        return sum + Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 60000);
      }
      return sum;
    }, 0);

    return {
      date: dateStr,
      projectsWorkedOn,
      commits,
      branchSwitches,
      pullRequests,
      totalSessionMinutes,
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
