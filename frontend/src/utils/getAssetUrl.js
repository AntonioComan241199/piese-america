export const getAssetUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const origin = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

  // dacă vine "uploads/abc.png" fără slash la început, îl corectăm:
  if (!path.startsWith("/")) return `${origin}/${path}`;

  // dacă vine "/uploads/abc.png"
  return `${origin}${path}`;
};