import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['curator', 'attorney_reviewer', 'admin'].includes(user.role)) {
      return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { reportId } = await req.json().catch(() => ({}));
    if (!reportId) return Response.json({ error: 'reportId is required' }, { status: 400 });

    const TEMPLATE_NAME = 'demand_v1_section73_msa';

    // Check TemplateApproval gate
    const approvals = await base44.asServiceRole.entities.TemplateApproval.filter({ templateName: TEMPLATE_NAME });
    const now = new Date();
    const validApproval = approvals.find((a: Record<string, unknown>) => {
      if (!a.expiresAt) return true;
      return new Date(a.expiresAt as string) > now;
    });
    if (!validApproval) {
      return Response.json({
        error: 'No valid attorney sign-off on file for this template. Upload a TemplateApproval record before generating notices.',
        templateName: TEMPLATE_NAME,
        requiresApproval: true,
      }, { status: 422 });
    }

    // Load the Report
    const report = await base44.asServiceRole.entities.Report.get(reportId);
    if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });
    if (!['approved', 'escalated'].includes(report.status)) {
      return Response.json({ error: 'Report must be approved before generating a notice' }, { status: 422 });
    }

    // Load EvidenceItems
    const evidenceItems = await base44.asServiceRole.entities.EvidenceItem.filter({ reportId });

    // Find current Municipal Manager for this municipality
    const officials = await base44.asServiceRole.entities.OfficialContact.filter({
      municipalityId: report.municipalityId,
      role: 'municipal_manager',
      isCurrent: true,
    });
    if (!officials || officials.length === 0) {
      return Response.json({
        error: `No verified Municipal Manager on file for ${report.municipalityName}. Verify and add via /admin/officials before generating a notice.`,
        municipalityName: report.municipalityName,
      }, { status: 422 });
    }
    const mm = officials[0];

    // Load cc contacts (Premier, MEC COGTA, AG, PP)
    const ccPortfolios = ["Premier's Office", 'COGTA', 'Auditor-General', 'Public Protector'];
    const allProvincial = await base44.asServiceRole.entities.ProvincialContact.filter({ isCurrent: true });
    const ccContacts = allProvincial.filter((c: Record<string, unknown>) =>
      ccPortfolios.some(p => (c.portfolio as string)?.toLowerCase().includes(p.toLowerCase()))
    ).slice(0, 4);

    const ccLines = ccContacts.map((c: Record<string, unknown>) =>
      `${c.fullName} — ${c.title || c.portfolio}${c.email ? ' (' + c.email + ')' : ''}`
    ).join('\n');

    // Build evidence summary
    const photoCount = evidenceItems.filter((e: Record<string, unknown>) => e.fileType === 'photo').length;
    const videoCount = evidenceItems.filter((e: Record<string, unknown>) => e.fileType === 'video').length;
    const gpsVerified = evidenceItems.filter((e: Record<string, unknown>) => e.exifGpsLatitude).length;
    const hashLines = evidenceItems.map((e: Record<string, unknown>) =>
      `  • File: ${e.originalFilename || e.fileUrl} | SHA-256: ${e.sha256Hash || 'pending'}`
    ).join('\n');

    const today = new Date();
    const deadlineDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const formatDate = (d: Date) => d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });

    const noticeBody = `FREE STATE ACTION NOW — INDEPENDENT CIVIC PLATFORM
DEMAND FOR PERFORMANCE IN TERMS OF THE MUNICIPAL SYSTEMS ACT

Date: ${formatDate(today)}
Reference: FSAN-${reportId.slice(0,8).toUpperCase()}

TO:
${mm.fullName}
${mm.title || 'Municipal Manager'}
${report.municipalityName}
${mm.office || ''}

CC:
${ccLines}

RE: DEMAND FOR WRITTEN RESPONSE — ${report.title.toUpperCase()}
    ${report.townOrWard}, ${report.municipalityName}
    Incident date: ${report.incidentDate}

─────────────────────────────────────────────────────────────

SECTION 1 — FACTS

A verified community report has been submitted to Free State Action Now regarding the following service-delivery failure:

Category: ${report.category.replace(/_/g,' ').replace(/\b\w/g, (c:string) => c.toUpperCase())}
Municipality: ${report.municipalityName}
Town / Ward: ${report.townOrWard}
Date of incident: ${report.incidentDate}

Resident's account:
"${report.body}"

Evidence on record: ${photoCount} photograph(s)${videoCount ? ', ' + videoCount + ' video(s)' : ''} with ${gpsVerified} GPS-verified file(s).
All evidence is cryptographically anchored by SHA-256 hash for integrity verification:
${hashLines || '  (Evidence items pending hash computation)'}

The above evidence is held on the Free State Action Now platform and can be independently verified by any party with the reference number above.

─────────────────────────────────────────────────────────────

SECTION 2 — STATUTORY FRAMEWORK

In terms of the Constitution of the Republic of South Africa, 1996:
• Section 152: Local government must ensure the provision of services to communities in a sustainable manner, and promote a safe and healthy environment.
• Section 153: A municipality must structure and manage its administration, budgeting, and planning processes to give priority to basic needs.

In terms of the Local Government: Municipal Systems Act 32 of 2000:
• Section 73: A municipality must give effect to every resident's right of access to municipal services, ensure that services are provided in a financially and environmentally sustainable manner, and take reasonable steps to ensure that the interests of vulnerable groups are protected.

In terms of the Promotion of Administrative Justice Act 3 of 2000:
• Section 6(2)(g): Administrative action taken unreasonably delayed or not taken within a reasonable time constitutes reviewable administrative action.

─────────────────────────────────────────────────────────────

SECTION 3 — DEMAND

We accordingly demand that you provide a written response within THIRTY (30) CALENDAR DAYS of receipt of this notice — by no later than ${formatDate(deadlineDate)} — addressing:

(a) A substantive remediation plan with specific milestones and responsible officials;
(b) The budget line currently allocated to address this matter;
(c) The name and title of the official directly responsible for remediation;
(d) The planned completion date.

Responses must be directed to: [INFORMATION OFFICER EMAIL — INSERT BEFORE SENDING]

─────────────────────────────────────────────────────────────

SECTION 4 — RESERVATION OF RIGHTS

Should you fail to respond substantively within the time stipulated above, Free State Action Now reserves the right to, without further notice:

(a) Initiate a review application under the Promotion of Administrative Justice Act 3 of 2000;
(b) Lodge a formal complaint with the Office of the Public Protector in terms of the Public Protector Act 23 of 1994;
(c) Lodge a complaint with the South African Human Rights Commission regarding violation of the right of access to services;
(d) Refer the matter to the Auditor-General South Africa for inclusion in the next municipal performance audit;
(e) Place the full record — including this notice, the evidence pack, and the absence of response — in the public domain on the Free State Action Now platform.

─────────────────────────────────────────────────────────────

NOTICE METADATA (FOR VERIFICATION)

Generated: ${now.toISOString()}
Report ID: ${reportId}
Template: ${TEMPLATE_NAME}
Template approved by: ${validApproval.approvedBy} on ${validApproval.approvedAt}
Evidence pack SHA-256 hashes: see Section 1 above

─────────────────────────────────────────────────────────────

ATTORNEY SIGN-OFF (REQUIRED BEFORE SENDING)

This notice is a DRAFT. It must be reviewed and approved by an admitted attorney before dispatch.

Attorney name: ___________________________________
Admission number: ________________________________
Date reviewed: ___________________________________
Signature: ______________________________________

─────────────────────────────────────────────────────────────

Free State Action Now — Independent Community Platform
Not affiliated with any government department.
[DOMAIN] | [INFORMATION OFFICER EMAIL]`;

    // Save LegalNotice
    const notice = await base44.asServiceRole.entities.LegalNotice.create({
      reportId,
      templateUsed: TEMPLATE_NAME,
      addressedToId: mm.id,
      addressedToName: `${mm.fullName}, ${mm.title || 'Municipal Manager'}, ${report.municipalityName}`,
      ccList: JSON.stringify(ccContacts.map((c: Record<string, unknown>) => ({ id: c.id, name: c.fullName, email: c.email }))),
      subject: `DEMAND FOR PERFORMANCE — ${report.title} — ${report.townOrWard} — Ref: FSAN-${reportId.slice(0,8).toUpperCase()}`,
      body: noticeBody,
      statutoryCitations: 'Constitution s152, s153; Municipal Systems Act 32 of 2000 s73; PAJA 3 of 2000 s6(2)(g)',
      status: 'draft',
    });

    // Log EscalationEvent
    await base44.asServiceRole.entities.EscalationEvent.create({
      reportId,
      eventType: 'notice_drafted',
      eventDate: now.toISOString(),
      actorUserId: user.id,
      actorName: user.full_name || user.email,
      description: `Legal notice draft generated. Template: ${TEMPLATE_NAME}. Addressed to: ${mm.fullName}. Awaiting attorney review.`,
      responseDeadline: deadlineDate.toISOString().split('T')[0],
    });

    // Update Report escalation stage
    await base44.asServiceRole.entities.Report.update(reportId, { escalationStage: 'notice_drafted' });

    return Response.json({
      ok: true,
      noticeId: notice.id,
      addressedTo: mm.fullName,
      responseDeadline: formatDate(deadlineDate),
      requiresAttorneyReview: true,
      message: 'Notice draft created. An attorney must review and approve before it can be sent.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
