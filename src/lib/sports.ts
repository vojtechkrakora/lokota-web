import { z } from 'astro/zod';
import { site } from '../site.ts';
import { validDate, pragueClock, number } from './dates.ts';

const id = z.number().int().positive();
const count = z.number().int().nonnegative();
const text = z.string().trim().min(1);
export const calendarDate = z.string().refine(validDate, 'Expected a real YYYY-MM-DD date');
export const seasonSchema = z.object({ id, name: text, active: z.boolean(), q1StartDate: calendarDate, q3StartDate: calendarDate });
const teamSchema = z.object({ id, name: text, club: z.object({ id, name: text, logo: z.string().nullable().optional().catch(null) }) });
const competitionSchema = z.object({ id, slug: text, name: text, season: seasonSchema });
const scoreSchema = z.object({ isHome: z.boolean(), teamPoints: z.number().nonnegative().nullable(), totalPerformance: count.nullable(), totalSetPoints: z.number().nonnegative().nullable() });
export const matchSchema = z.object({
  id, date: calendarDate.nullish().transform(v => v ?? null),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullish().transform(v => v ?? null),
  round: id.nullish().transform(v => v ?? null),
  status: z.enum(['SCHEDULED', 'PREPARATION', 'IN_PROGRESS', 'FINISHED', 'FORFEIT']),
  homeTeam: teamSchema, awayTeam: teamSchema, competition: competitionSchema,
  venue: z.object({ name: text, city: text.nullish(), street: text.nullish() }).nullish().transform(v => v ?? null),
  results: z.array(scoreSchema),
}).superRefine((m, ctx) => {
  if (m.homeTeam.id === m.awayTeam.id) ctx.addIssue({ code: 'custom', message: 'Match has the same team on both sides' });
  if (new Set(m.results.map(r => r.isHome)).size !== m.results.length) ctx.addIssue({ code: 'custom', message: 'Duplicate result side' });
});
export const rowSchema = z.object({
  type: z.literal('ALL'), position: id, matches: count, wins: count, draws: count, losses: count,
  tablePoints: z.number(), teamPointsWon: z.number(), teamPointsLost: z.number(), team: teamSchema,
});
export type Season = z.infer<typeof seasonSchema>;
export type Match = z.infer<typeof matchSchema>;
export type TableRow = z.infer<typeof rowSchema>;
export type Competition = z.infer<typeof competitionSchema>;

export const datasetSchema = z.object({
  schemaVersion: z.literal(1), provenance: z.enum(['live', 'fixture']), clubId: z.literal(site.clubId),
  fetchedAt: z.iso.datetime(), season: seasonSchema, matches: z.array(matchSchema),
  teams: z.array(teamSchema), competitions: z.array(z.object({
    competition: competitionSchema, round: id.nullable(), rows: z.array(rowSchema),
  })),
});
export type Sports = z.infer<typeof datasetSchema>;

export function standingsForTeam(sports: Sports, teamName: string) {
  const belongs = (team: Match['homeTeam']) => team.club.id === site.clubId && team.name === teamName;
  const competitionIds = new Set(sports.matches
    .filter(match => belongs(match.homeTeam) || belongs(match.awayTeam))
    .map(match => match.competition.id));
  return sports.competitions.filter(table => competitionIds.has(table.competition.id) || table.rows.some(row => belongs(row.team)));
}

export class ApiError extends Error {}
export class PaginationError extends ApiError {}
type Options = { fetch?: typeof fetch; sleep?: (ms: number) => Promise<void>; signal?: AbortSignal; timeoutMs?: number; maxRequests?: number };

export function createApi(options: Options = {}) {
  const request = options.fetch ?? fetch;
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  let requests = 0;
  async function get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const url = `${site.apiBase}${path}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      options.signal?.throwIfAborted();
      if (++requests > (options.maxRequests ?? Infinity)) throw new ApiError('ČKA request budget exceeded');
      let response: Response;
      const timeout = AbortSignal.timeout(options.timeoutMs ?? 10_000);
      const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
      try {
        // Workers supports manual/follow only. Reject returned 3xx below on both runtimes.
        response = await request(url, { signal, headers: { Accept: 'application/json', 'User-Agent': 'LokotaWeb/0.1' }, redirect: 'manual' });
      } catch {
        if (options.signal?.aborted || attempt === 2) throw new ApiError(`ČKA request failed: ${path.split('?')[0]} (network/timeout)`);
        await sleep(250 * 2 ** attempt); continue;
      }
      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && attempt < 2) {
          const seconds = Number(response.headers.get('Retry-After'));
          void response.body?.cancel().catch(() => {});
          await sleep(Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 2000) : 250 * 2 ** attempt);
          continue;
        }
        void response.body?.cancel().catch(() => {});
        throw new ApiError(`ČKA HTTP ${response.status}: ${path.split('?')[0]}`);
      }
      let body: unknown;
      try { body = await response.json(); } catch {
        if (signal.aborted && !options.signal?.aborted && attempt < 2) { await sleep(250 * 2 ** attempt); continue; }
        throw new ApiError(`ČKA invalid JSON/response timeout: ${path.split('?')[0]}`);
      }
      const result = schema.safeParse(body);
      if (!result.success) throw new ApiError(`ČKA schema mismatch: ${path.split('?')[0]} (${result.error.issues.map(i => `${i.path.join('.')}: ${i.code}`).slice(0, 5).join('; ')})`);
      return result.data;
    }
    throw new ApiError('ČKA retries exhausted');
  }
  async function seasons() {
    const data = await get('/seasons', z.object({ items: z.array(seasonSchema), total: count }));
    if (data.total !== data.items.length || new Set(data.items.map(s => s.id)).size !== data.total) throw new ApiError('Incomplete/duplicate season list');
    return data.items;
  }
  async function matches(seasonId: number) {
    for (let collectionAttempt = 0; collectionAttempt < 2; collectionAttempt++) {
      try {
        const items: Match[] = []; const seen = new Set<number>(); let total: number | undefined;
        for (let page = 0, offset = 0; page < 100; page++) {
          const query = new URLSearchParams({ clubId: String(site.clubId), seasonId: String(seasonId), limit: '100', offset: String(offset), sort: 'id', include: 'homeTeam.club,awayTeam.club,competition.season,venue,results' });
          const data = await get(`/matches?${query}`, z.object({ items: z.array(matchSchema), total: count, limit: id.max(100), offset: count }));
          if (data.offset !== offset || (total !== undefined && total !== data.total) || data.items.length > data.limit || data.items.length + items.length > data.total) throw new PaginationError('Inconsistent match pagination');
          total = data.total;
          for (const m of data.items) {
            if (seen.has(m.id) || (items.length > 0 && m.id <= items[items.length - 1]!.id)) throw new PaginationError('Duplicate/unstable match ids');
            if (m.competition.season.id !== seasonId || ![m.homeTeam.club.id, m.awayTeam.club.id].includes(site.clubId)) throw new ApiError('Match has wrong club/season');
            seen.add(m.id); items.push(m);
          }
          if (items.length === total) return items;
          if (!data.items.length) throw new PaginationError('Match pagination made no progress');
          offset += data.items.length;
        }
        throw new PaginationError('Match collection exceeded 100 pages');
      } catch (error) {
        if (!(error instanceof PaginationError) || collectionAttempt === 1) throw error;
      }
    }
    throw new PaginationError('Incomplete matches');
  }
  async function table(competition: Competition) {
    const path = `/competitions/${encodeURIComponent(competition.slug)}/rounds`;
    const rounds = await get(path, z.array(id));
    if (new Set(rounds).size !== rounds.length) throw new ApiError('Duplicate competition rounds');
    if (!rounds.length) return { competition, round: null, rows: [] };
    const round = Math.max(...rounds);
    const data = await get(`${path}/${round}/table?type=ALL&include=team.club&sort=position`, z.object({ items: z.array(rowSchema), total: count }));
    if (data.total !== data.items.length || new Set(data.items.map(r => r.team.id)).size !== data.total) throw new ApiError('Incomplete/duplicate official table');
    return { competition, round, rows: data.items };
  }
  return { seasons, matches, table };
}

export function latestSeason(seasons: Season[]) {
  const sorted = seasons.map(s => ({ season: s, start: [s.q1StartDate, s.q3StartDate].sort()[0]! })).sort((a, b) => b.start.localeCompare(a.start));
  if (!sorted.length) throw new ApiError('No published seasons');
  if (sorted[0]?.start === sorted[1]?.start) throw new ApiError('Ambiguous latest season dates');
  return sorted[0]!.season;
}

export async function prepareSports(options: Options & { now?: () => Date } = {}): Promise<Sports> {
  const bound = AbortSignal.timeout(180_000);
  const signal = options.signal ? AbortSignal.any([options.signal, bound]) : bound;
  const api = createApi({ ...options, signal });
  const season = latestSeason(await api.seasons());
  const matches = await api.matches(season.id);
  const competitions = new Map<number, Competition>();
  const teams = new Map<number, z.infer<typeof teamSchema>>();
  for (const match of matches) {
    const previous = competitions.get(match.competition.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(match.competition)) throw new ApiError('Inconsistent competition identity');
    competitions.set(match.competition.id, match.competition);
    for (const team of [match.homeTeam, match.awayTeam]) if (team.club.id === site.clubId) teams.set(team.id, team);
  }
  const all = [...competitions.values()].sort((a, b) => a.id - b.id);
  const tables: Sports['competitions'] = [];
  // Exactly two independent competition requests at a time; no per-match fan-out.
  for (let i = 0; i < all.length; i += 2) tables.push(...await Promise.all(all.slice(i, i + 2).map(c => api.table(c))));
  for (const table of tables) for (const row of table.rows) if (row.team.club.id === site.clubId) teams.set(row.team.id, row.team);
  signal.throwIfAborted();
  return datasetSchema.parse({ schemaVersion: 1, provenance: 'live', clubId: site.clubId, fetchedAt: (options.now?.() ?? new Date()).toISOString(), season, matches, teams: [...teams.values()].sort((a, b) => a.id - b.id), competitions: tables });
}

export const statusLabels: Record<Match['status'], string> = { SCHEDULED: 'Plánováno', PREPARATION: 'Příprava', IN_PROGRESS: 'Probíhá', FINISHED: 'Dohráno', FORFEIT: 'Kontumace' };
export function score(match: Match, field: 'teamPoints' | 'totalPerformance' | 'totalSetPoints' = 'teamPoints') {
  return `${number(match.results.find(r => r.isHome)?.[field])} : ${number(match.results.find(r => !r.isHome)?.[field])}`;
}
export function nextMatch(matches: Match[], instant: string) {
  const clock = pragueClock(instant);
  return matches.filter(m => ['SCHEDULED', 'PREPARATION'].includes(m.status) && m.date && (m.date > clock.date || (m.date === clock.date && (!m.time || m.time >= clock.time))))
    .sort((a, b) => `${a.date} ${a.time ?? '99:99'}`.localeCompare(`${b.date} ${b.time ?? '99:99'}`) || a.id - b.id)[0];
}
