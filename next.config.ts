import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist لازم ينقاد من node_modules مباشرة وقت التشغيل
  // وإلا الـ bundling يكسره على السيرفر
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
