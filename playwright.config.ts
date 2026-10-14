import { defineConfig } from "@playwright/test";

// Os testes rodam contra o app compilado ("next start") com um Supabase de mentira: nada aqui precisa de conta nem de internet.
export const ENV_TESTE = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "chave-de-teste",
  NEXT_PUBLIC_SITE_URL: "https://amautocenter.example",
};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3100",
    viewport: { width: 390, height: 844 },
    launchOptions: { args: ["--no-sandbox"] },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run build && npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: ENV_TESTE,
  },
});
