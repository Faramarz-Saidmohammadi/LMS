export function toQueryString(params = {}) {
  const sp = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.append(k, String(v));
  });

  const s = sp.toString();
  return s ? `?${s}` : "";
}
