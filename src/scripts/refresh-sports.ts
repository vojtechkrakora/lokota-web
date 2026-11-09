export {};
type Payload = { version: string; fetchedAt: string; season: string; slots: Record<string, string>; newsPages: string[] };
const refreshStatus = document.querySelector<HTMLElement>('[data-sports-status]');
const slots = [...document.querySelectorAll<HTMLElement>('[data-sports-slot]')];
const version = document.body.dataset.sportsVersion;

async function refresh() {
  if (!refreshStatus || !version || !slots.length) return;
  refreshStatus.hidden = false;
  refreshStatus.textContent = 'Ověřujeme aktuálnost sportovních dat…';
  try {
    const response = await fetch('/api/sports', { signal: AbortSignal.timeout(15_000), credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Refresh unavailable');
    const data: Payload = await response.json();
    const builtAt = document.body.dataset.sportsBuiltAt!;
    if (data.version !== version || !Number.isFinite(Date.parse(data.fetchedAt)) || Date.parse(data.fetchedAt) < Date.parse(builtAt) || Date.parse(data.fetchedAt) > Date.now() + 60_000 || typeof data.season !== 'string' || !data.slots || !Array.isArray(data.newsPages) || !data.newsPages.length) throw new Error('Invalid refresh');
    const requestedPage = Number(new URL(location.href).searchParams.get('strana') ?? location.pathname.match(/^\/novinky\/strana\/(\d+)\/$/)?.[1] ?? 1);
    const page = Math.min(Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1, data.newsPages.length);
    // Stage every fragment before changing the page or advancing its timestamp.
    const updates = slots.map(element => {
      const name = element.dataset.sportsSlot!;
      const html = name === 'news' ? data.newsPages[page - 1] : data.slots[name];
      if (typeof html !== 'string') throw new Error('Missing refresh section');
      const template = document.createElement('template');
      template.innerHTML = html;
      if (template.content.querySelector('script, iframe, object, embed, style, link')) throw new Error('Invalid refresh markup');
      return { element, content: template.content };
    });
    const active = document.activeElement;
    const activeHref = active instanceof HTMLAnchorElement ? active.getAttribute('href') : null;
    const activeId = active instanceof HTMLElement ? active.id : null;
    const activeRegion = active instanceof HTMLElement && active.classList.contains('table-scroll') ? active.getAttribute('aria-label') : null;
    const scrollPositions = [...document.querySelectorAll<HTMLElement>('.table-scroll')].map(element => ({ label: element.getAttribute('aria-label'), left: element.scrollLeft }));
    let anchor: string | undefined;
    try { anchor = decodeURIComponent(location.hash.slice(1)); } catch { /* Invalid URL fragment does not invalidate good sports data. */ }
    updates.forEach(({ element, content }) => element.replaceChildren(content));
    document.querySelectorAll('[data-sports-season]').forEach(element => { element.textContent = data.season; });
    const label = document.querySelector('[data-news-page-label]');
    if (label) {
      label.textContent = `Strana ${page}`;
      label.toggleAttribute('hidden', page === 1 && location.pathname === '/novinky/');
    }
    document.body.dataset.sportsRefreshedAt = data.fetchedAt;
    refreshStatus.textContent = 'Sportovní data jsou ověřena. Další kontrola proběhne při obnovení stránky.';
    document.dispatchEvent(new Event('sports:updated'));
    document.querySelectorAll<HTMLElement>('.table-scroll').forEach(element => {
      element.scrollLeft = scrollPositions.find(position => position.label === element.getAttribute('aria-label'))?.left ?? 0;
    });
    if (active && !active.isConnected) {
      const replacement = activeId ? document.getElementById(activeId) : activeRegion ? [...document.querySelectorAll<HTMLElement>('.table-scroll')].find(e => e.getAttribute('aria-label') === activeRegion) : [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].find(a => a.getAttribute('href') === activeHref);
      (replacement ?? document.getElementById('obsah'))?.focus({ preventScroll: true });
    }
    if (anchor) document.getElementById(anchor)?.scrollIntoView();
  } catch {
    refreshStatus.textContent = 'Novější sportovní data se nyní nepodařilo načíst. Zůstávají zobrazené údaje s uvedeným časem aktualizace.';
  }
}
void refresh();
