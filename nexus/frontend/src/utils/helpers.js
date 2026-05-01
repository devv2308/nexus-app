/** Format a timestamp as "just now", "5m", "3h", "2d" */
export function timeAgo(ts, justNow = "just now") {
  const s = (Date.now() - ts) / 1000;
  if (s < 60)    return justNow;
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/** Format number as "1.2k", "5.1k", etc. */
export function fmtNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n || 0);
}

/** Deterministic colour for an avatar based on first char of name */
export function avatarColor(name = "") {
  const palette = ["#c97a28","#4a7fa5","#7a5ea5","#4caf72","#c05060","#5a9a70"];
  return palette[name.charCodeAt(0) % palette.length];
}

/** Generate initials from a full name */
export function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}
