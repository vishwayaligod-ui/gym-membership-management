"use client";

import { useEffect, useState } from "react";

type GymBranding = {
  gymName: string;
  gymLogo: string;
  primaryAccentColor: string;
  secondaryColor: string;
};

const DEFAULT_BRANDING: GymBranding = {
  gymName: "",
  gymLogo: "",
  primaryAccentColor: "#2563EB",
  secondaryColor: "#0F172A",
};

export function useGymBranding(): GymBranding {
  const [branding, setBranding] = useState<GymBranding>(DEFAULT_BRANDING);

  useEffect(() => {
    let cancelled = false;

    async function loadBranding() {
      try {
        const response = await fetch("/api/gym-branding", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as GymBranding;
        if (cancelled) return;
        setBranding({
          gymName: payload.gymName ?? "",
          gymLogo: payload.gymLogo ?? "",
          primaryAccentColor:
            payload.primaryAccentColor ?? DEFAULT_BRANDING.primaryAccentColor,
          secondaryColor: payload.secondaryColor ?? DEFAULT_BRANDING.secondaryColor,
        });
      } catch {
        // Ignore errors; fall back to defaults
      }
    }

    loadBranding();

    return () => {
      cancelled = true;
    };
  }, []);

  // Apply the saved branding colors as global CSS variables so the whole UI
  // (sidebar, header, dashboard, etc.) reflects them via var(--primary) etc.
  useEffect(() => {
    const root = document.documentElement;
    const { primaryAccentColor, secondaryColor } = branding;
    root.style.setProperty("--primary", primaryAccentColor);
    root.style.setProperty(
      "--primary-light",
      `color-mix(in srgb, ${primaryAccentColor} 75%, white)`
    );
    root.style.setProperty(
      "--primary-dark",
      `color-mix(in srgb, ${primaryAccentColor} 75%, black)`
    );
    root.style.setProperty("--secondary", secondaryColor);
  }, [branding.primaryAccentColor, branding.secondaryColor]);

  return branding;
}