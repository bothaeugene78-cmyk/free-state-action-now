import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SAFLII_FEEDS = [
  { url: 'http://www.saflii.org/cgi-bin/atom-feed.pl?collection=ZAFSHC', label: 'Free State High Court' },
  { url: 'http://www.saflii.org/cgi-bin/atom-feed.pl?collection=ZACC', label: 'Constitutional Court' },
  { url: 'http://www.saflii.org/cgi-bin/atom-feed.pl?collection=ZASCA', label: 'Supreme Court of Appeal' },
];

const FILTER_TERMS = [
  'municipality','municipal','section 139','service delivery','potable water',
  'sanitation','Mangaung','Matjhabeng','Maluti-a-Phofung','Setsoto','Mantsopa',
  'Moqhaka','Metsimaholo','Ngwathe','Mafube','Nala','Masilonyana','Dihlabeng',
  'Nketoana','Phumelela','Letsemeng','Kopanong','Mohokare','Tswelopele','Tokologo',
  'Bloemfontein','Free State','Welkom',
];

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return FILTER_TERMS.some(t => lower.includes(t.toLowerCase()));
}

function extractAtomField(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, 'si');
  const match = xml.match(regex);
  return match ? match[1].replace(/<[^>]+>/g,'').trim() : '';
}

function extractAtomLink(entryBlock: string): string {
  const match = entryBlock.match(/<link[^>]+href=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let totalFound = 0;
    let totalCreated = 0;
    const errors: string[] = [];

    for (const feed of SAFLII_FEEDS) {
      try {
        await new Promise(r => setTimeout(r, 1000));
        const resp = await fetch(feed.url, {
          headers: { 'User-Agent': 'FreeStateActionNow-Monitor/1.0 (+https://freestateactionnow.org.za/about)' },
          signal: AbortSignal.timeout(20000),
        });
        if (!resp.ok) { errors.push(`${feed.label}: HTTP ${resp.status}`); continue; }
        const xml = await resp.text();

        const entries = xml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) || [];
        totalFound += entries.length;

        for (const entry of entries) {
          const title = extractAtomField(entry, 'title');
          const summary = extractAtomField(entry, 'summary') || extractAtomField(entry, 'content');
          const published = extractAtomField(entry, 'published') || extractAtomField(entry, 'updated');
          const link = extractAtomLink(entry);

          if (!title || !link) continue;
          if (!isRelevant(`${title} ${summary}`)) continue;

          const existing = await base44.asServiceRole.entities.LegalDevelopment.filter({ sourceUrl: link });
          if (existing && existing.length > 0) continue;

          await base44.asServiceRole.entities.LegalDevelopment.create({
            source: 'SAFLII',
            sourceUrl: link,
            title: title.slice(0, 400),
            documentDate: published ? published.split('T')[0] : new Date().toISOString().split('T')[0],
            documentType: 'court_judgment',
            summary: summary.slice(0, 1000),
            relevanceToFreeState: `Matched filter terms in ${feed.label} feed`,
            curationStatus: 'pending_curation',
          });
          totalCreated++;
        }
      } catch (e) {
        errors.push(`${feed.label}: ${e.message}`);
      }
    }

    await base44.asServiceRole.entities.MonitorRunLog.create({
      source: 'monitorSAFLII',
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
