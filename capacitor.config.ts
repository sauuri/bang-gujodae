import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sauuri.banggujodae",
  appName: "방구조대",
  webDir: "www",
  server: {
    url: "https://bang-gujodae.vercel.app",
    cleartext: false,
  },
};

export default config;
