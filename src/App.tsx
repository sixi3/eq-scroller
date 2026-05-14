import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import BalanceOutlined from "@mui/icons-material/BalanceOutlined";
import BusinessCenterOutlined from "@mui/icons-material/BusinessCenterOutlined";
import FingerprintOutlined from "@mui/icons-material/FingerprintOutlined";
import PendingActionsOutlined from "@mui/icons-material/PendingActionsOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";

import { ScrollSections, type ScrollSection } from "./components/ScrollSections";

const railIconSx = { fontSize: 20 } as const;

function VerificationCard({
  label,
  title,
  status = "Clear",
  tone = "green",
}: {
  label: string;
  title: string;
  status?: string;
  tone?: "green" | "amber" | "red";
}) {
  return (
    <article className="verification-card">
      <div className="verification-card__summary">
        <div className="verification-card__mark">{label.slice(0, 2).toUpperCase()}</div>
        <div>
          <p className="meta-label">Name on {label}</p>
          <h3>{title}</h3>
        </div>
        <span className={`status-pill status-pill--${tone}`}>{status}</span>
      </div>

      <div className="verification-table">
        <div>
          <span>Name</span>
          <strong>Shaik Nagur</strong>
        </div>
        <div>
          <span>Document Number</span>
          <strong>XXXX XXXX 3842</strong>
        </div>
        <div>
          <span>Source</span>
          <strong>DigiLocker</strong>
        </div>
        <div>
          <span>Completed</span>
          <strong>12:29 PM, 24 Feb 2026</strong>
        </div>
      </div>

      <div className="verification-card__footer">
        <div className="remarks-box">Equal found 0 issues for this check.</div>
        <div className="tat-box">
          <span>TAT</span>
          <strong>SLA met, 3m 05s</strong>
        </div>
      </div>
    </article>
  );
}

const sections: ScrollSection[] = [
  {
    id: "pending-reviews",
    icon: <PendingActionsOutlined sx={railIconSx} />,
    blockCount: 3,
    dotTone: "red",
    eyebrow: "3 items awaiting action",
    title: "Pending Reviews",
    body: (
      <section className="ticket-strip" aria-label="Pending tickets">
        <div className="ticket-card ticket-card--amber">
          Updated cost of Rs 2,800 for new round of background verification requires approval
        </div>
        <div className="ticket-card ticket-card--red">
          Found tenure mismatch with PF UAN data for this company
        </div>
      </section>
    ),
  },
  {
    id: "identity",
    icon: <FingerprintOutlined sx={railIconSx} />,
    blockCount: 2,
    dotTone: "green",
    eyebrow: "2 checks complete",
    title: "Identity Checks",
    body: (
      <div className="card-stack">
        <VerificationCard label="Aadhaar" title="Shaik Nagur" />
        <VerificationCard label="PAN" title="Shaik Nagur" />
      </div>
    ),
  },
  {
    id: "address",
    icon: <BadgeOutlined sx={railIconSx} />,
    blockCount: 2,
    dotTone: "green",
    eyebrow: "1 check needs review",
    title: "Address Checks",
    body: (
      <div className="card-stack">
        <VerificationCard label="Address" title="Banjara Hills, Hyderabad" status="Review" tone="amber" />
        <VerificationCard label="Utility" title="Document uploaded" />
      </div>
    ),
  },
  {
    id: "employment",
    icon: <BusinessCenterOutlined sx={railIconSx} />,
    blockCount: 2,
    dotTone: "blue",
    eyebrow: "Exception found",
    title: "Employment Checks",
    body: (
      <div className="card-stack">
        <VerificationCard label="PF" title="Infinity Identity Pvt Ltd." status="Exception" tone="red" />
        <VerificationCard label="UAN" title="Tenure mismatch" status="Action needed" tone="amber" />
      </div>
    ),
  },
  {
    id: "education",
    icon: <SchoolOutlined sx={railIconSx} />,
    blockCount: 2,
    dotTone: "green",
    eyebrow: "Approval pending",
    title: "Education Checks",
    body: (
      <div className="card-stack">
        <VerificationCard label="Degree" title="Master's Degree" status="Pending" tone="amber" />
        <VerificationCard label="College" title="Awaiting approval" status="Pending" tone="amber" />
      </div>
    ),
  },
  {
    id: "criminal",
    icon: <BalanceOutlined sx={railIconSx} />,
    blockCount: 1,
    dotTone: "red",
    eyebrow: "No issues found",
    title: "Court Checks",
    body: (
      <div className="card-stack">
        <VerificationCard label="Court" title="National database" />
        <VerificationCard label="Police" title="Local jurisdiction" />
      </div>
    ),
  },
];

export function App() {
  return (
    <main className="case-shell">
      <ScrollSections sections={sections} stickyTop={14} />
    </main>
  );
}
