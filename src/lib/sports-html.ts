import { nextMatch, score, standingsForTeam, statusLabels, type Match, type Sports } from './sports.ts';
import { formatDate, formatUpdated, number } from './dates.ts';
import { mergeFeed, paginate, type FeedItem } from './feed.ts';
import { matchAppearance, teamAccent } from './team-colors.ts';
import { site } from '../site.ts';

export type SportsAssets = { logos: Record<string, string>; covers: Record<string, { src: string; width: number; height: number }> };
export type SportsManifest = SportsAssets & { version: string; builtAt: string; provenance: 'live' | 'fixture'; news: FeedItem[]; staticNewsPages: number };
export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const e = escapeHtml;
const attr = (name: string, value: string | undefined) => value === undefined ? '' : ` ${name}="${e(value)}"`;
const empty = (message: string) => `<div class="empty-state"><p>${e(message)}</p></div>`;
const aTeamName = `${site.clubName} A`;

export function renderMatch(match: Match, assets: SportsAssets, { anchor = true, compact = false, logos = true } = {}) {
  const completed = ['FINISHED', 'FORFEIT', 'IN_PROGRESS'].includes(match.status);
  const appearance = matchAppearance([match.homeTeam, match.awayTeam]);
  const size = compact ? 56 : 48;
  const team = (team: Match['homeTeam'], side: string) => {
    const src = assets.logos[team.club.id];
    const emblem = src ? `<img src="${e(src)}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" class="team-logo">` : '<span class="team-logo team-logo-placeholder" aria-hidden="true" title="Znak není k dispozici">—</span>';
    return `<span${attr('class', team.club.id === site.clubId ? 'club-team' : undefined)}${attr('data-team-color', teamAccent(team))}>${logos ? emblem : ''}<span>${e(team.name)}<small${compact ? ' class="sr-only"' : ''}>${side}</small></span></span>`;
  };
  return `<article class="match-card${compact ? ' match-card-compact' : ''}"${attr('data-team-color', appearance.accent)}${attr('style', appearance.style)}${attr('id', anchor ? `zapas-${match.id}` : undefined)}>
    <div class="match-meta"><span>${match.date ? `<time datetime="${match.date}">${formatDate(match.date)}</time>` : 'Termín bude upřesněn'} · ${e(match.time ?? 'Čas bude upřesněn')}</span><span class="tag">${statusLabels[match.status]}</span></div>
    <div class="match-teams${logos ? ' with-logos' : ''}">${team(match.homeTeam, 'Domácí')}<strong class="score" aria-label="Body domácí : hosté">${completed ? score(match) : 'vs'}</strong>${team(match.awayTeam, 'Hosté')}</div>
    ${completed ? `<p class="score-detail">Body · Kuželky ${score(match, 'totalPerformance')} · Sety ${score(match, 'totalSetPoints')}</p>` : ''}
    ${compact ? '' : `<p class="match-venue">${e(match.venue ? [match.venue.name, match.venue.street, match.venue.city].filter(Boolean).join(', ') : 'Místo bude upřesněno')}${match.round ? ` · ${match.round}. kolo` : ''}</p>`}
  </article>`;
}

export function renderFeed(items: FeedItem[], assets: SportsAssets, featured = false) {
  return `<div class="feed-list">${items.map((item, index) => {
    const cover = assets.covers[item.key];
    const appearance = matchAppearance(item.kind === 'match' ? item.teams ?? [] : []);
    const side = (value: number, index: number, label: string) => `<span${attr('data-team-color', item.teams?.[index] && teamAccent(item.teams[index]!))}><small>${label}</small>${number(value)}</span>`;
    const visual = item.kind === 'match' ? `<div class="score-preview"><span class="score-preview-label">Výsledek na body</span>${item.result ? `<div class="score-preview-value">${side(item.result.home, 0, 'Domácí')}<span class="score-preview-separator">:</span>${side(item.result.away, 1, 'Hosté')}</div>` : '<span>Výsledek bude doplněn</span>'}<div class="score-preview-teams">${(item.teams ?? []).filter(t => t.club.id === site.clubId).map(t => `<span class="team-chip"${attr('data-team-color', teamAccent(t))}>${e(t.name.replace(site.clubName, 'Tábor'))}</span>`).join('')}</div></div>` : cover ? `<img src="${e(cover.src)}" alt="" width="${cover.width}" height="${cover.height}" loading="lazy" decoding="async" class="feed-photo">` : '';
    return `<article class="feed-card${featured && index === 0 ? ' feed-featured' : ''}${visual ? ' feed-has-visual' : ''}" data-feed-key="${e(item.key)}" data-feed-kind="${item.kind}"${attr('data-team-color', appearance.accent)}${attr('style', appearance.style)}>
      ${visual ? `<a href="${e(item.href)}" class="feed-visual" tabindex="-1" aria-hidden="true">${visual}</a>` : ''}
      <div class="feed-card-body"><div class="eyebrow"><span class="tag${item.kind === 'match' ? ' tag-result' : ''}">${item.kind === 'news' ? 'Z klubu' : 'Výsledek zápasu'}</span><time datetime="${item.date}">${formatDate(item.date)}</time></div><h3><a href="${e(item.href)}">${e(item.title)}</a></h3><p>${e(item.summary)}</p><a class="text-link" href="${e(item.href)}">${item.kind === 'news' ? 'Číst novinku' : 'Detail výsledku'} <span aria-hidden="true">↗</span></a></div></article>`;
  }).join('') || empty('Klubové zprávy a oficiální výsledky zde najdete, jakmile budou k dispozici.')}</div>`;
}

function tableRegion(label: string, table: string) {
  return `<div class="table-region"><p class="table-help small" hidden><span aria-hidden="true">↔</span> Posuňte tabulku do strany pro další sloupce.</p><div class="table-scroll" tabindex="0" role="region" aria-label="${e(label)}">${table}</div></div>`;
}

export function renderTables(sports: Sports, compact = false) {
  const competitions = compact ? standingsForTeam(sports, aTeamName) : sports.competitions;
  return competitions.map(({ competition, rows }) => {
    const body = rows.map(row => {
      const selected = row.team.club.id === site.clubId && (!compact || row.team.name === aTeamName);
      return `<tr${attr('class', selected ? compact ? 'selected-team' : 'our-team' : undefined)}${attr('data-team-color', teamAccent(row.team))}><td>${row.position}.</td><th scope="row">${e(row.team.name)}${selected ? `<span class="team-selection">${compact ? 'Náš A-tým' : 'Naše družstvo'}</span>` : ''}</th><td>${row.matches}</td>${compact ? '' : `<td>${row.wins}</td><td>${row.draws}</td><td>${row.losses}</td>`}<td><strong>${number(row.tablePoints)}</strong></td>${compact ? '' : `<td class="nowrap">${number(row.teamPointsWon)} : ${number(row.teamPointsLost)}</td>`}</tr>`;
    }).join('');
    const table = `<table><caption${compact ? ' class="sr-only"' : ''}>${e(competition.name)} · aktuální oficiální tabulka · ${e(sports.season.name)}${compact ? '. A-tým našeho klubu je zvýrazněný.' : ''}</caption><thead><tr><th scope="col"><abbr title="Pořadí">Poř.</abbr></th><th scope="col">Družstvo</th><th scope="col"><abbr title="Odehrané zápasy">Z</abbr></th>${compact ? '' : '<th scope="col"><abbr title="Výhry">V</abbr></th><th scope="col"><abbr title="Remízy">R</abbr></th><th scope="col"><abbr title="Prohry">P</abbr></th>'}<th scope="col">Body</th>${compact ? '' : '<th scope="col">Skóre na body</th>'}</tr></thead><tbody>${body}</tbody></table>`;
    if (compact) return `<div class="home-league"><h3>${e(competition.name)}</h3>${rows.length ? tableRegion(`Tabulka A-týmu · ${competition.name}`, table) : '<p class="small">Oficiální tabulka A-týmu zatím není k dispozici.</p>'}<a href="/tabulky/#soutez-${competition.id}" class="text-link">Podrobná tabulka →</a></div>`;
    return `<section class="competition-section" id="soutez-${competition.id}"><div class="section-heading"><h2>${e(competition.name)}</h2><a href="/zapasy/#soutez-${competition.id}" class="text-link">Zápasy ↗</a></div>${rows.length ? tableRegion(`Tabulka ${competition.name}`, table) : empty('Oficiální tabulka zatím není k dispozici.')}</section>`;
  }).join('') || empty(compact ? 'Tabulka A-týmu pro tuto sezónu zatím není k dispozici.' : 'Tabulky se zobrazí, jakmile budou zveřejněné soutěže našich družstev.');
}

export function renderMatches(sports: Sports, assets: SportsAssets) {
  return (sports.competitions.length ? `<nav class="section-nav" aria-label="Soutěže">${sports.competitions.map(({ competition: c }) => `<a href="#soutez-${c.id}">${e(c.name)}</a>`).join('')}</nav>` : '') + (sports.competitions.map(({ competition }) => `<section class="competition-section" id="soutez-${competition.id}"><div class="section-heading"><h2>${e(competition.name)}</h2><a href="/tabulky/#soutez-${competition.id}" class="text-link">Tabulka ↗</a></div><div class="matches-grid">${sports.matches.filter(m => m.competition.id === competition.id).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.id - b.id).map(m => renderMatch(m, assets)).join('')}</div></section>`).join('') || empty('Pro nejnovější sezónu zatím nejsou zveřejněné klubové zápasy.'));
}

export function renderHomeMatches(sports: Sports, assets: SportsAssets, instant = sports.fetchedAt) {
  const upcoming: Match[] = [];
  for (let i = 0; i < 3; i++) {
    const match = nextMatch(sports.matches.filter(m => !upcoming.some(u => u.id === m.id)), instant);
    if (!match) break;
    upcoming.push(match);
  }
  const byId = new Map(sports.matches.map(m => [`match-${m.id}`, m]));
  const recent = mergeFeed([], sports.matches, instant).slice(0, 3).map(f => byId.get(f.key)!);
  const group = (matches: Match[], upcoming: boolean) => `<section class="home-match-group" aria-labelledby="${upcoming ? 'next-match-heading' : 'recent-matches-heading'}"><h3 id="${upcoming ? 'next-match-heading' : 'recent-matches-heading'}">${upcoming ? 'Nejbližší zápasy' : 'Poslední výsledky'}</h3>${matches.length ? `<div class="home-match-list">${matches.map((m, i) => `<div class="home-match-entry${upcoming && i === 0 ? ' home-next-match' : ''}" data-match-id="${m.id}"><p class="match-competition">${e(m.competition.name)}${m.round ? ` · ${m.round}. kolo` : ''}</p>${renderMatch(m, assets, { anchor: false, compact: true })}<a href="/zapasy/#zapas-${m.id}" class="text-link">${upcoming ? 'Vše o zápasu' : 'Detail výsledku'} <span aria-hidden="true">→</span></a></div>`).join('')}</div>` : empty(upcoming ? 'Další zápas zatím není naplánován.' : 'Výsledky se zobrazí po dohrání zápasů.')}</section>`;
  return `<div class="section-heading"><div><p class="eyebrow">Sezóna <span data-sports-season>${e(sports.season.name)}</span></p><h2 id="home-matches-heading">Na drahách</h2></div><a href="/zapasy/" class="text-link">Všechny zápasy <span aria-hidden="true">→</span></a></div>${group(upcoming, true)}${group(recent, false)}`;
}

export function renderTeamOverview(sports: Sports) {
  const positions = sports.competitions.flatMap(c => c.rows.filter(r => r.team.club.id === site.clubId).map(r => ({ ...r, competition: c.competition.name })));
  return `<div class="section-heading"><h2>Naše družstva</h2></div>${positions.length ? `<ul>${positions.map(r => `<li${attr('data-team-color', teamAccent(r.team))}><span><strong>${e(r.team.name.replace('KK Lokomotiva ', ''))}</strong><small>${e(r.competition)}</small></span><span class="position">${r.position}.<small>místo</small></span></li>`).join('')}</ul>` : '<p>Oficiální tabulky zatím nejsou k dispozici.</p>'}<a href="/tabulky/" class="text-link">Kompletní tabulky ↗</a>`;
}

export function renderPagination(page: number, total: number, staticTotal = total) {
  const url = (n: number) => n > staticTotal ? `/novinky/?strana=${n}` : n === 1 ? '/novinky/' : `/novinky/strana/${n}/`;
  return total > 1 ? `<nav class="pagination" aria-label="Stránkování novinek">${page > 1 ? `<a href="${url(page - 1)}" rel="prev">← Novější</a>` : '<span></span>'}<span>Strana ${page} z ${total}</span>${page < total ? `<a href="${url(page + 1)}" rel="next">Starší →</a>` : '<span></span>'}</nav>` : '';
}

export function renderDataNote(sports: Sports, runtime = false) {
  return `<p>Sportovní data aktualizována <time datetime="${sports.fetchedAt}">${formatUpdated(sports.fetchedAt)}</time> (Praha).</p><p class="small">Zdroj: <a href="https://kuzelky.cz/">Česká kuželkářská asociace</a> · sezóna ${e(sports.season.name)}. ${runtime ? 'Data ověřujeme při otevření stránky s mezipamětí do 5 minut.' : 'Zobrazená data pocházejí ze sestavení webu.'} Nejde o živé výsledky.</p>`;
}

export function renderSports(sports: Sports, manifest: SportsManifest, instant = sports.fetchedAt) {
  const pages = paginate(mergeFeed(manifest.news, sports.matches, instant));
  return {
    version: manifest.version, fetchedAt: sports.fetchedAt, season: sports.season.name,
    slots: {
      'home-matches': renderHomeMatches(sports, manifest, instant),
      'home-table': renderTables(sports, true), 'home-teams': renderTeamOverview(sports),
      'home-counts': `${sports.teams.length} družstev · ${sports.competitions.length} soutěží`,
      matches: renderMatches(sports, manifest), tables: renderTables(sports),
      'data-note': renderDataNote(sports, true),
    },
    newsPages: pages.map(p => renderFeed(p.items, manifest, true) + renderPagination(p.number, p.total, manifest.staticNewsPages)),
  };
}
