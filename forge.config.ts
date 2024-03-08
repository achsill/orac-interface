import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: "./src/assets/icon",
    osxSign: {},
    osxNotarize: {
      appleId: process.env.APP_ID ?? "",
      appleIdPassword: process.env.APP_PWD ?? "",
      teamId: process.env.APP_TEAM_ID ?? "",
    },
  },
  rebuildConfig: {},
  makers: [
    // new MakerSquirrel({}),
    // new MakerZIP({}, ["darwin", "linux"]),
    // new MakerRpm({}),
    // new MakerDeb({}),
    new MakerDMG({}),
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "hlouar",
          name: "orac-interface",
        },

        prerelease: true,
      },
    },
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/SearchWindow.html",
            js: "./src/SearchWindow.tsx",
            name: "main_window",
            preload: {
              js: "./src/preload.ts",
            },
          },
          {
            html: "./src/OutputWindow.html",
            js: "./src/OutputWindow.tsx",
            name: "output_window",
            preload: {
              js: "./src/preload.ts",
            },
          },
          {
            html: "./src/SettingsWindow.html",
            js: "./src/SettingsWindow.tsx",
            name: "settings_window",
            preload: {
              js: "./src/preload.ts",
            },
          },
        ],
      },
    }),
  ],
};

export default config;
