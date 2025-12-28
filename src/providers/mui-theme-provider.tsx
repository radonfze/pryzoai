"use client";

import * as React from "react";
import { createTheme, ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useEffect, useState } from "react";
import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";
import { CacheProvider as EmotionCacheProvider } from "@emotion/react";
import type { EmotionCache, Options as OptionsOfCreateCache } from "@emotion/cache";

// --- Emotion Cache Registry for Next.js App Router ---
// Adapted from MUI example: https://github.com/mui/material-ui/tree/master/examples/material-ui-nextjs-ts

interface NextAppDirEmotionCacheProviderProps {
  options: Omit<OptionsOfCreateCache, "insertionPoint">;
  CacheProvider?: (props: {
    value: EmotionCache;
    children: React.ReactNode;
  }) => React.JSX.Element | null;
  children: React.ReactNode;
}

function NextAppDirEmotionCacheProvider(props: NextAppDirEmotionCacheProviderProps) {
  const { options, CacheProvider = EmotionCacheProvider, children } = props;

  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache(options);
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = "";
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

// Map DaisyUI themes to MUI palettes
const themeMap: Record<string, { mode: "light" | "dark"; primary: string; secondary: string }> = {
  light: { mode: "light", primary: "#570df8", secondary: "#f000b8" },
  dark: { mode: "dark", primary: "#661AE6", secondary: "#D926AA" },
  corporate: { mode: "light", primary: "#4b6bfb", secondary: "#7b92b2" },
  business: { mode: "dark", primary: "#1C4E80", secondary: "#7C909A" },
  winter: { mode: "light", primary: "#047AFF", secondary: "#463AA2" },
  night: { mode: "dark", primary: "#38bdf8", secondary: "#818CF8" },
  cyberpunk: { mode: "light", primary: "#ff7598", secondary: "#75d1f0" },
  retro: { mode: "light", primary: "#ef9995", secondary: "#a4cbb4" },
  synthwave: { mode: "dark", primary: "#e779c1", secondary: "#58c7f3" },
  forest: { mode: "dark", primary: "#1eb854", secondary: "#1DB88E" },
  aqua: { mode: "light", primary: "#09ecf3", secondary: "#966fb3" },
  luxury: { mode: "dark", primary: "#ffffff", secondary: "#152747" },
  dracula: { mode: "dark", primary: "#ff79c6", secondary: "#bd93f9" },
  nord: { mode: "light", primary: "#5E81AC", secondary: "#81A1C1" },
};

export function MUIProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState("corporate");

  useEffect(() => {
    // Sync with DaisyUI theme from localStorage
    const savedTheme = localStorage.getItem("pryzo-theme") || "corporate";
    setThemeName(savedTheme);

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          const newTheme = document.documentElement.getAttribute("data-theme") || "corporate";
          setThemeName(newTheme);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const themeConfig = themeMap[themeName] || themeMap.corporate;

  const muiTheme = createTheme({
    palette: {
      mode: themeConfig.mode,
      primary: {
        main: themeConfig.primary,
      },
      secondary: {
        main: themeConfig.secondary,
      },
      background: {
        default: "transparent", // Let DaisyUI handle background
        paper: "transparent",
      },
    },
    typography: {
      fontFamily: "var(--font-geist-sans), sans-serif",
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: "transparent",
          },
        },
      },
    },
  });

  return (
    <NextAppDirEmotionCacheProvider options={{ key: "mui" }}>
      <MUIThemeProvider theme={muiTheme}>
        <CssBaseline enableColorScheme />
        {children}
      </MUIThemeProvider>
    </NextAppDirEmotionCacheProvider>
  );
}
