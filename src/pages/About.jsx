import { Link } from "react-router-dom";

export default function About() {
  const section = (title, content) => (
    <section style={{ marginBottom: "48px" }}>
      <h2 style={{ color: "#E8A838", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px", borderLeft: "3px solid #E8A838", paddingLeft: "10px" }}>{title}</h2>
      <div style={{ color: "#999", fontSize: "15px", lineHeight: 1.8 }}>{content}</div>
    </section>
  );

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ color: "#F5F5F0", fontSize: "32px", fontWeight: 900, marginBottom: "8px" }}>About Free State Action Now</h1>
      <p style={{ color: "#666", marginBottom: "48px", fontSize: "15px" }}>An independent civic-evidence platform operated by civil society.</p>

      {section("Who runs this platform", "Free State Action Now is operated by [REGISTERED ENTITY NAME], an independent civil-society organisation. We are not a government department, not a political party, and not affiliated with any municipality or provincial government. Our Information Officer can be contacted at [INFORMATION OFFICER EMAIL].")}

      {section("Theory of change", <div>
        <p>We operate on five accountability pressure points:</p>
        <ol style={{ paddingLeft: "20px", lineHeight: 2 }}>
          <li><strong style={{ color: "#F5F5F0" }}>Personal liability of named officials</strong> — formal demand letters addressed to the accounting officer by name create a paper trail that follows them across roles.</li>
          <li><strong style={{ color: "#F5F5F0" }}>Mandamus litigation</strong> — a documented refusal to provide services after a formal demand is the foundation of a court application compelling performance.</li>
          <li><strong style={{ color: "#F5F5F0" }}>Treasury / Auditor-General consequences</strong> — AG findings in MFMA audits are triggered by documented evidence of service failures. We feed that evidence.</li>
          <li><strong style={{ color: "#F5F5F0" }}>Media exposure</strong> — a verified, GPS-timestamped public record is a journalist's primary source. We make it easy to find.</li>
          <li><strong style={{ color: "#F5F5F0" }}>Organised civil society</strong> — an aggregated public database of failures enables civic organisations, ratepayer associations, and community leaders to coordinate effectively.</li>
        </ol>
      </div>)}

      {section("How reports are verified", <div>
        <p>Every report goes through a curator moderation queue before publication. Curators check:</p>
        <ul style={{ paddingLeft: "20px", lineHeight: 2 }}>
          <li>That the report describes a service-delivery failure (not a personal dispute, commercial matter, or off-topic content)</li>
          <li>That the report is a firsthand account or that the submitter has clear authority to report it</li>
          <li>That evidence photos are relevant and not manipulated (EXIF GPS checked against stated location)</li>
          <li>That the content does not contain defamatory personal information, private identifying details, or content that breaches the Acceptable Use Policy</li>
        </ul>
        <p>Approved reports are published. Rejected reports are removed with a reason. No report is published without curator review.</p>
      </div>)}

      {section("Legitimate-Sources Monitor", <div>
        <p>The platform automatically monitors these publicly-accessible, intended-use sources:</p>
        <ul style={{ paddingLeft: "20px", lineHeight: 2 }}>
          <li><strong style={{ color: "#F5F5F0" }}>SAFLII</strong> — Free State High Court, Constitutional Court, and Supreme Court of Appeal judgment feeds</li>
          <li><strong style={{ color: "#F5F5F0" }}>News24, Daily Maverick, GroundUp, EWN</strong> — RSS news feeds filtered for Free State municipal content</li>
          <li><strong style={{ color: "#F5F5F0" }}>Parliamentary Monitoring Group (PMG)</strong> — committee reports on COGTA, SCOPA, and Free State oversight</li>
          <li><strong style={{ color: "#F5F5F0" }}>Auditor-General SA</strong> — MFMA municipal audit publications</li>
        </ul>
        <p>Nothing from these monitors is published publicly until a curator marks it "featured". We do not scrape social media. We do not harvest full copyrighted article text — only headlines and RSS summaries.</p>
      </div>)}

      {section("SHA-256 evidence integrity", "Every file uploaded as evidence has a SHA-256 cryptographic hash computed on the server at the moment of upload. This hash is displayed on the report detail page. Anyone — an attorney, a journalist, the Auditor-General — can download the file and independently verify the hash. If a single byte of the file has changed since upload, the hash will differ. This is how we create tamper-evident evidence records without a blockchain.")}

      {section("Legal notice process", <div>
        <p>Legal notices are generated as drafts only. They cannot be sent until:</p>
        <ol style={{ paddingLeft: "20px", lineHeight: 2 }}>
          <li>The notice template has been reviewed and signed off by an admitted public-law attorney, with the sign-off document uploaded to the platform's TemplateApproval record</li>
          <li>A curator or attorney-reviewer has verified the evidence and addressee details</li>
          <li>The attorney-reviewer role confirms the specific notice before dispatch</li>
        </ol>
        <p>Notices are addressed to the accounting officer (Municipal Manager) by name, cc'd to the Premier, COGTA MEC, Auditor-General, and Public Protector, and served with the full evidence pack reference including SHA-256 hashes.</p>
      </div>)}

      {section("Data protection (POPIA)", <div>
        <p>We process personal information in compliance with the Protection of Personal Information Act 4 of 2013 (POPIA). We collect only what is necessary for the platform's accountability purpose. We do not sell personal information. We cooperate with valid legal process.</p>
        <p>To exercise your POPIA data-subject rights (access, correction, deletion, objection), email [INFORMATION OFFICER EMAIL]. See also the <Link to="/privacy-policy" style={{ color: "#E8A838" }}>Privacy Policy</Link>.</p>
      </div>)}

      {section("Contact the curators", <div>
        <p>To report an error in the directory, raise a content concern, or contact the Information Officer:</p>
        <Link to="/contact" style={{ color: "#E8A838", fontWeight: 700 }}>→ Contact page</Link>
      </div>)}
    </div>
  );
}
