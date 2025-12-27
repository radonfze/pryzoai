"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Check } from "lucide-react";

const themes = [
  { name: "light", label: "Light", category: "Light" },
  { name: "corporate", label: "Corporate", category: "Light" },
  { name: "winter", label: "Winter", category: "Light" },
  { name: "aqua", label: "Aqua", category: "Light" },
  { name: "retro", label: "Retro", category: "Light" },
  { name: "dark", label: "Dark", category: "Dark" },
  { name: "business", label: "Business", category: "Dark" },
  { name: "night", label: "Night", category: "Dark" },
  { name: "forest", label: "Forest", category: "Dark" },
  { name: "luxury", label: "Luxury", category: "Dark" },
  { name: "dracula", label: "Dracula", category: "Dark" },
  { name: "synthwave", label: "Synthwave", category: "Dark" },
  { name: "cyberpunk", label: "Cyberpunk", category: "Special" },
  { name: "nord", label: "Nord", category: "Special" },
];

export function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState("corporate");

  useEffect(() => {
    // Get theme from localStorage on mount
    const savedTheme = localStorage.getItem("pryzo-theme") || "corporate";
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pryzo-theme", theme);
  };

  const lightThemes = themes.filter((t) => t.category === "Light");
  const darkThemes = themes.filter((t) => t.category === "Dark");
  const specialThemes = themes.filter((t) => t.category === "Special");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Light Themes</DropdownMenuLabel>
        {lightThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.name}
            onClick={() => handleThemeChange(theme.name)}
            className="flex justify-between"
          >
            {theme.label}
            {currentTheme === theme.name && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Dark Themes</DropdownMenuLabel>
        {darkThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.name}
            onClick={() => handleThemeChange(theme.name)}
            className="flex justify-between"
          >
            {theme.label}
            {currentTheme === theme.name && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Special</DropdownMenuLabel>
        {specialThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.name}
            onClick={() => handleThemeChange(theme.name)}
            className="flex justify-between"
          >
            {theme.label}
            {currentTheme === theme.name && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
