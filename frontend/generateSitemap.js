import { SitemapStream, streamToPromise } from "sitemap";
import { createWriteStream } from "fs";
import path from "path";

// Rutele site-ului
const routes = [
  { url: "/", changefreq: "daily", priority: 1.0 },
  { url: "/home", changefreq: "daily", priority: 0.8 },
  { url: "/contact", changefreq: "monthly", priority: 0.7 },
  { url: "/signin", changefreq: "monthly", priority: 0.6 },
  { url: "/register", changefreq: "monthly", priority: 0.6 },
  { url: "/my-profile", changefreq: "monthly", priority: 0.6 },
  { url: "/oil-products", changefreq: "monthly", priority: 0.8 },
  { url: "/my-orders", changefreq: "monthly", priority: 0.7 },
];

// Generare sitemap
const sitemapPath = path.resolve("public", "sitemap.xml");
const writeStream = createWriteStream(sitemapPath);

const sitemap = new SitemapStream({ hostname: "https://www.pieseautoamerica.ro" });

streamToPromise(sitemap)
  .then(() => console.log("Sitemap generat cu succes:", sitemapPath))
  .catch((err) => console.error("Eroare la generarea sitemap-ului:", err));

sitemap.pipe(writeStream);

routes.forEach((route) => sitemap.write(route));
sitemap.end();
