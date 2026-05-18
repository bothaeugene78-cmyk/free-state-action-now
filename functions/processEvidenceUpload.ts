import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function gpsDmsToDecimal(dms: number[], ref: string): number {
  const d = dms[0] + dms[1]/60 + dms[2]/3600;
  return (ref === 'S' || ref === 'W') ? -d : d;
}

function readAscii(bytes: Uint8Array, base: number, offset: number, length: number): string {
  try { return String.fromCharCode(...bytes.slice(base+offset, base+offset+length)).replace(/\0/g,''); } catch { return ''; }
}

function readRationals(bytes: Uint8Array, base: number, offset: number, count: number, le: boolean): number[] {
  const r = [];
  for (let i = 0; i < count; i++) {
    const o = base+offset+i*8;
    const num = le ? (bytes[o]|(bytes[o+1]<<8)|(bytes[o+2]<<16)|(bytes[o+3]<<24)) : ((bytes[o]<<24)|(bytes[o+1]<<16)|(bytes[o+2]<<8)|bytes[o+3]);
    const den = le ? (bytes[o+4]|(bytes[o+5]<<8)|(bytes[o+6]<<16)|(bytes[o+7]<<24)) : ((bytes[o+4]<<24)|(bytes[o+5]<<16)|(bytes[o+6]<<8)|bytes[o+7]);
    r.push(den !== 0 ? num/den : 0);
  }
  return r;
}

function extractBasicExif(bytes: Uint8Array): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  try {
    let offset = 2;
    while (offset < bytes.length - 1) {
      if (bytes[offset] === 0xFF && bytes[offset+1] === 0xE1) {
        const exifHeader = String.fromCharCode(...bytes.slice(offset+4, offset+10));
        if (exifHeader.startsWith('Exif')) {
          const tiffStart = offset + 10;
          const le = bytes[tiffStart] === 0x49;
          const readU16 = (o: number) => le ? (bytes[tiffStart+o] | (bytes[tiffStart+o+1]<<8)) : ((bytes[tiffStart+o]<<8) | bytes[tiffStart+o+1]);
          const readU32 = (o: number) => le
            ? (bytes[tiffStart+o] | (bytes[tiffStart+o+1]<<8) | (bytes[tiffStart+o+2]<<16) | (bytes[tiffStart+o+3]<<24))
            : ((bytes[tiffStart+o]<<24) | (bytes[tiffStart+o+1]<<16) | (bytes[tiffStart+o+2]<<8) | bytes[tiffStart+o+3]);
          const ifd0Offset = readU32(4);
          const ifd0Count = readU16(ifd0Offset);
          let gpsIfdOffset = 0;
          for (let i = 0; i < ifd0Count; i++) {
            const eO = ifd0Offset + 2 + i * 12;
            const tag = readU16(eO);
            const vO = eO + 8;
            if (tag === 0x8825) gpsIfdOffset = readU32(vO);
            if (tag === 0x010F) result.make = readAscii(bytes, tiffStart, readU32(vO), readU32(eO+4));
            if (tag === 0x0110) result.model = readAscii(bytes, tiffStart, readU32(vO), readU32(eO+4));
            if (tag === 0x0132) result.captureDateTime = readAscii(bytes, tiffStart, readU32(vO), 20);
          }
          if (gpsIfdOffset) {
            const gpsCount = readU16(gpsIfdOffset);
            let latRef = 'N', lonRef = 'E';
            let latDms: number[] = [], lonDms: number[] = [];
            for (let i = 0; i < gpsCount; i++) {
              const eO = gpsIfdOffset + 2 + i * 12;
              const tag = readU16(eO);
              const count = readU32(eO+4);
              const vO = eO+8;
              if (tag === 0x0001) latRef = String.fromCharCode(bytes[tiffStart + readU32(vO)]);
              if (tag === 0x0003) lonRef = String.fromCharCode(bytes[tiffStart + readU32(vO)]);
              if (tag === 0x0002 && count === 3) latDms = readRationals(bytes, tiffStart, readU32(vO), 3, le);
              if (tag === 0x0004 && count === 3) lonDms = readRationals(bytes, tiffStart, readU32(vO), 3, le);
            }
            if (latDms.length === 3) result.latitude = gpsDmsToDecimal(latDms, latRef);
            if (lonDms.length === 3) result.longitude = gpsDmsToDecimal(lonDms, lonRef);
          }
        }
        break;
      }
      if (bytes[offset] === 0xFF) {
        const segLen = (bytes[offset+2]<<8)|bytes[offset+3];
        offset += 2 + segLen;
      } else { offset++; }
    }
  } catch (_) {}
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { evidenceItemId, fileUrl, reportId } = body;
    if (!evidenceItemId || !fileUrl || !reportId) {
      return Response.json({ error: 'evidenceItemId, fileUrl, and reportId are required' }, { status: 400 });
    }

    let sha256Hash = '';
    let fileSizeBytes = 0;
    let exifData: Record<string, unknown> = {};

    try {
      const fileResp = await fetch(fileUrl, { signal: AbortSignal.timeout(30000) });
      if (fileResp.ok) {
        const buffer = await fileResp.arrayBuffer();
        fileSizeBytes = buffer.byteLength;
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        sha256Hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
        const bytes = new Uint8Array(buffer);
        if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
          exifData = extractBasicExif(bytes);
        }
      }
    } catch (e) {
      console.warn('Could not fetch file for hashing:', e);
    }

    const custodyEntry = {
      timestamp: new Date().toISOString(),
      action: 'uploaded',
      userId: user.id,
      sha256Hash,
      fileSizeBytes,
    };

    let locationDiscrepancy = false;
    if (exifData.latitude && exifData.longitude) {
      const report = await base44.asServiceRole.entities.Report.get(reportId);
      if (report && report.latitude && report.longitude) {
        const dist = haversineKm(Number(report.latitude), Number(report.longitude), Number(exifData.latitude), Number(exifData.longitude));
        if (dist > 5) locationDiscrepancy = true;
      }
    }

    const updateData: Record<string, unknown> = {
      sha256Hash, fileSizeBytes,
      uploadedAt: new Date().toISOString(),
      uploadedByUserId: user.id,
      chainOfCustodyLog: JSON.stringify([custodyEntry]),
      locationDiscrepancy,
    };
    if (exifData.latitude) updateData.exifGpsLatitude = exifData.latitude;
    if (exifData.longitude) updateData.exifGpsLongitude = exifData.longitude;
    if (exifData.captureDateTime) updateData.exifCaptureDateTime = exifData.captureDateTime;
    if (exifData.make) updateData.exifDeviceMake = String(exifData.make).trim();
    if (exifData.model) updateData.exifDeviceModel = String(exifData.model).trim();

    await base44.asServiceRole.entities.EvidenceItem.update(evidenceItemId, updateData);
    const items = await base44.asServiceRole.entities.EvidenceItem.filter({ reportId });
    await base44.asServiceRole.entities.Report.update(reportId, { evidenceItemCount: items.length });

    return Response.json({ ok: true, sha256Hash, fileSizeBytes, locationDiscrepancy, exifExtracted: Object.keys(exifData).length > 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
