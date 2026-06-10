import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to remove crossorigin attribute from HTML files (needed for Chrome extensions)
function removeCrossoriginPlugin() {
  return {
    name: "remove-crossorigin",
    writeBundle() {
      const distDir = path.resolve(__dirname, "../FocusModeWebsiteBlocker/dist");
      const htmlFiles = ["popup.html", "options.html"];
      htmlFiles.forEach((fileName) => {
        const filePath = path.join(distDir, fileName);
        try {
          let content = readFileSync(filePath, "utf-8");
          // Remove crossorigin attribute from script and link tags
          content = content.replace(/\s*crossorigin/g, "");
          writeFileSync(filePath, content, "utf-8");
        } catch {
          // File might not exist, skip
        }
      });
    },
  };
}

export default defineConfig({
  base: "./", // IMPORTANT for extension pages
  plugins: [react(), removeCrossoriginPlugin()],
  build: {
    outDir: path.resolve(__dirname, "../FocusModeWebsiteBlocker/dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        options: path.resolve(__dirname, "options.html"),
        popup: path.resolve(__dirname, "popup.html"),
      },
    },
  },
});


