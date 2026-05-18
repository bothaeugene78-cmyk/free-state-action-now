import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FS_MUNICIPALITIES = [
  'Mangaung','Matjhabeng','Maluti-a-Phofung','Setsoto','Mantsopa','Moqhaka',
  'Metsimaholo','Ngwathe','Mafube','Nala','Masilonyana','Tswelopele','Tokologo',
  'Dihlabeng','Nketoana','Phumelela','Letsemeng','Kopanong','Mohokare',
  'Bloemfontein','Welkom','Phuthaditjhaba','Harrismith','Bethlehem','Kroonstad',
  'Sasolburg','Parys','Frankfort','Ladybrand','Ficksburg','Clocolan','Marquard',
];

const SERVICE_KEYWORDS = [
  'water','electricity','pothole','potholes','sewage','sanitation','refuse',
  'protest','service delivery','road','roads','infrastructure','municipality',
  'municipal','section 139','audit','AGSA',
];

const RSS_SOURCES = [
  { name: 'News24', url: 'https://feeds.news24.com/articles/news24/SouthAfrica/rss' },
  { name: 'Daily Maverick', url: 'https://www.dailymaverick.co.za/feed/' },
  { name: 'GroundUp', url: 'https://groundup.org.za/feed/articles/' },
  { name: 'EWN', url: 'https://ewn.co.za/RSS' },
  { name: 'PMG', url: 'https://pmg.org.za/rss/' },
];

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  const hasMuni = FS_MUNICIPALITIES.some(m => lower.includes(m.toLowerCase()));
  const hasFreeState = lower.includes('free state');
  const hasService = SERVICE_KEYWORDS.some(k => lower.includes(k));
  return (hasMuni || hasFreeState) && hasService;
}

function extractTextFromXml(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, 'si');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

async function fetchRss(url: string, sourceName: string): Promise<Array<{headline: string, sourceUrl: string, summary: string, publishedDate: string}>> {
  const items: Array<{headline: string, sourceUrl: string, summary: string, publishedDate: string}> = [];
  try {
    await new Promise(r => setTimeout(r, 1000)); // 1s delay between hosts
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'FreeStateActionNow-Monitor/1.0 (+https://freestateactionnow.org.za/about)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return items;
    const xml = await resp.text();

    // Split into <item> blocks
    const itemBlocks = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    for (const block of itemBlocks) {
      const title = extractTextFromXml(block, 'title');
      const link = extractTextFromXml(block, 'link');
      const desc = extractTextFromXml(block, 'description');
      const pubDate = extractTextFromXml(block, 'pubDate');

      if (!title || !link) continue;
      const combined = `${title} ${desc}`;
      if (!isRelevant(combined)) continue;

      items.push({
        headline: title.slice(0, 300),
        sourceUrl: link.trim(),
        summary: desc.replace(/<[^>]+>/g, '').slice(0, 500),
        publishedDate: pubDate ? new Date(pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    }
  } catch (e) {
    console.warn(`[monitorNews] Failed to fetch ${sourceName}: ${e.message}`);
  }
  return items;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Allow service-role calls from scheduled automations
    const user = await base44.auth.me().catch(() => null);
    if (user && !['curator', 'admin'].includes(user.role)) {
      return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    let totalFound = 0;
    let totalCreated = 0;
    const errors: string[] = [];

    for (const source of RSS_SOURCES) {
      try {
        const items = await fetchRss(source.url, source.name);
        totalFound += items.length;

        for (const item of items) {
          // Deduplicate by sourceUrl
          const existing = await base44.asServiceRole.entities.NewsItem.filter({ sourceUrl: item.sourceUrl });
          if (existing && existing.length > 0) continue;

          await base44.asServiceRole.entities.NewsItem.create({
            source: source.name,
            sourceUrl: item.sourceUrl,
            headline: item.headline,
            publishedDate: item.publishedDate,
            summary: item.summary,
            curationStatus: 'pending_curation',
          });
          totalCreated++;
        }
      } catch (e) {
        errors.push(`${source.name}: ${e.message}`);
      }
    }

    // Log the run
    await base44.asServiceRole.entities.MonitorRunLog.create({
      source: 'monitorNews',
      runAt: new Date().toISOString(),
      itemsFound: totalFound,
      itemsCreated: totalCreated,
      errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
    });

    return Response.json({ ok: true, totalFound, totalCreated, errors });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
