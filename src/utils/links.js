export function websiteHref(url) {
  if (!url || typeof url !== "string") return null;
  const s = url.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

export function phoneHref(phone) {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : `tel:${phone.replace(/\s/g, "")}`;
}
