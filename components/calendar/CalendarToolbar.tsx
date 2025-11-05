"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type View = "month" | "week" | "day";

export default function CalendarToolbar({
  view,
  onViewChange,
}: {
  view: View;
  onViewChange: (v: View) => void;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
      <div className="text-sm text-muted-foreground">
        Toolbar • Vista:
        <span className="ml-2 rounded bg-muted px-2 py-0.5 text-foreground">{view}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={view === "month" ? "default" : "outline"}
          onClick={() => onViewChange("month")}
        >
          Mes
        </Button>
        <Button
          size="sm"
          variant={view === "week" ? "default" : "outline"}
          onClick={() => onViewChange("week")}
        >
          Semana
        </Button>
        <Button
          size="sm"
          variant={view === "day" ? "default" : "outline"}
          onClick={() => onViewChange("day")}
        >
          Día
        </Button>
      </div>
    </div>
  );
}
