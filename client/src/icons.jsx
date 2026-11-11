/**
 * Line icons, 24px grid, drawn with currentColor so they take the text colour they sit in.
 */

const P = {
  today: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-6h5v6" /></>,
  stock: <><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></>,
  use: <><path d="M12 3v11" /><path d="m7.5 9.5 4.5 4.5 4.5-4.5" /><path d="M4 17v2.5h16V17" /></>,
  custody: <><path d="M12 3.5 4 7.5v5c0 4.2 3.3 7 8 8 4.7-1 8-3.8 8-8v-5z" /><path d="m8.5 12 2.5 2.5 4.5-4.5" /></>,
  linen: <><path d="M5 4h14v4H5z" /><path d="M6 8v12h12V8" /><path d="M9 12h6M9 15.5h6" /></>,
  requests: <><path d="M4 13 6.5 5h11L20 13v6H4z" /><path d="M4 13h4.5l1 2h5l1-2H20" /></>,
  receive: <><path d="M2.5 6h11v10h-11z" /><path d="M13.5 9.5H18l3.5 3.5v3h-8" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></>,
  transfer: <><path d="M4 8h14l-3.5-3.5" /><path d="M20 16H6l3.5 3.5" /></>,
  purchasing: <><path d="M3 4h2.5l2.2 11h10.6L20.5 7H7" /><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></>,
  counts: <><path d="M8 4h8v3H8z" /><path d="M6 5.5H4.5V21h15V5.5H18" /><path d="m8.5 13 2.2 2.2 4.8-4.7" /></>,
  corrections: <><path d="M14.5 4.5 19.5 9.5 9 20H4v-5z" /><path d="m12.5 6.5 5 5" /></>,
  reports: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  admin: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.3 14H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" /><path d="M12 17h.01" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  back: <path d="m15 6-6 6 6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: <><path d="M12 3.5 2.5 20h19z" /><path d="M12 10v4.5M12 17.5h.01" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  logout: <><path d="M15 4h4v16h-4" /><path d="M10 8 6 12l4 4M6 12h10" /></>,
  more: <><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>,
  download: <><path d="M12 4v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M4 19.5h16" /></>,
  trash: <><path d="M4.5 7h15M9.5 7V4.5h5V7" /><path d="M6.5 7l1 13h9l1-13" /></>,
  unit: <><path d="M4 20V8l8-4 8 4v12" /><path d="M9 20v-5h6v5M4 20h16" /></>,
  filter: <path d="M4 5h16l-6.2 7.4V19l-3.6-1.8v-4.8z" />,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /></>,
  sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></>,
};

export default function Icon({ name, size = 20, className = '', label }) {
  return (
    <svg
      className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
    >
      {P[name] || P.stock}
    </svg>
  );
}
