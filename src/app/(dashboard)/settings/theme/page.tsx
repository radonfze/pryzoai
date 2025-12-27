"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// MUI Components
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import Fab from "@mui/material/Fab";
import Rating from "@mui/material/Rating";
import { Add, Favorite, CheckCircle } from "@mui/icons-material";

const themes = [
  "light", "dark", "corporate", "business", "winter", "night",
  "cyberpunk", "retro", "synthwave", "forest", "aqua", "luxury", "dracula", "nord"
];

export default function ThemeSettingsPage() {
  const [currentTheme, setCurrentTheme] = useState("corporate");
  const [rating, setRating] = useState(4);

  useEffect(() => {
    const saved = localStorage.getItem("pryzo-theme") || "corporate";
    setCurrentTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem("pryzo-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Theme Settings</h2>
        <p className="text-muted-foreground">Customize appearance with DaisyUI & MUI integration</p>
      </div>

      {/* Theme Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {themes.map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTheme === theme
                    ? "ring-2 ring-primary ring-offset-2 bg-primary text-primary-content"
                    : "bg-base-200 hover:bg-base-300"
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Current theme: <strong className="text-primary">{currentTheme}</strong>
          </p>
        </CardContent>
      </Card>

      {/* MUI Components Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🎨</span> MUI Components Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons */}
          <div>
            <h4 className="font-medium mb-3">MUI Buttons</h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="contained" color="primary">Primary</Button>
              <Button variant="contained" color="secondary">Secondary</Button>
              <Button variant="outlined" color="primary">Outlined</Button>
              <Button variant="text" color="primary">Text</Button>
              <Button variant="contained" color="success">Success</Button>
              <Button variant="contained" color="error">Error</Button>
              <Button variant="contained" color="warning">Warning</Button>
              <Button variant="contained" color="info">Info</Button>
            </div>
          </div>

          {/* FAB */}
          <div>
            <h4 className="font-medium mb-3">Floating Action Buttons</h4>
            <div className="flex gap-3">
              <Fab color="primary" size="small"><Add /></Fab>
              <Fab color="secondary" size="medium"><Favorite /></Fab>
              <Fab variant="extended" color="primary">
                <Add className="mr-2" /> Add Item
              </Fab>
            </div>
          </div>

          {/* Chips */}
          <div>
            <h4 className="font-medium mb-3">Chips</h4>
            <div className="flex flex-wrap gap-2">
              <Chip label="Primary" color="primary" />
              <Chip label="Secondary" color="secondary" />
              <Chip label="Success" color="success" icon={<CheckCircle />} />
              <Chip label="Deletable" color="primary" onDelete={() => {}} />
              <Chip label="Outlined" variant="outlined" color="primary" />
            </div>
          </div>

          {/* Form Controls */}
          <div>
            <h4 className="font-medium mb-3">Form Controls</h4>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm">Switch:</span>
                <Switch defaultChecked color="primary" />
                <Switch color="secondary" />
              </div>
              <div className="w-48">
                <TextField label="Text Field" variant="outlined" size="small" fullWidth />
              </div>
              <div className="w-48">
                <span className="text-sm block mb-2">Slider:</span>
                <Slider defaultValue={50} color="primary" />
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <h4 className="font-medium mb-3">Rating</h4>
            <div className="flex items-center gap-4">
              <Rating
                value={rating}
                onChange={(_, newValue) => setRating(newValue || 0)}
              />
              <span className="text-sm text-muted-foreground">{rating} / 5</span>
            </div>
          </div>

          {/* Progress */}
          <div>
            <h4 className="font-medium mb-3">Progress Indicators</h4>
            <div className="flex items-center gap-6">
              <div className="w-48">
                <LinearProgress color="primary" variant="determinate" value={65} />
              </div>
              <CircularProgress color="primary" size={32} />
              <CircularProgress color="secondary" size={32} />
            </div>
          </div>

          {/* Alerts */}
          <div>
            <h4 className="font-medium mb-3">Alerts</h4>
            <div className="space-y-2">
              <Alert severity="success">MUI theme is synced with DaisyUI!</Alert>
              <Alert severity="info">Primary color changes with theme selection.</Alert>
              <Alert severity="warning">This is a warning alert — check it out!</Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <ul className="space-y-2 text-sm">
            <li>✅ <strong>DaisyUI themes</strong> control the overall page styling (backgrounds, sidebar, cards)</li>
            <li>✅ <strong>MUI components</strong> automatically sync their primary/secondary colors with the selected theme</li>
            <li>✅ <strong>14 themes available:</strong> {themes.join(", ")}</li>
            <li>✅ <strong>Theme persists</strong> in localStorage across sessions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
