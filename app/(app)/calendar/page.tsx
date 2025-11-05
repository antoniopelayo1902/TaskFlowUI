"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import CalendarView from "@/components/calendar/CalendarView";
import ConnectProviderBanner from "@/components/calendar/ConnectProviderBanner";
import { toast } from "@/lib/toast";

type View = "month" | "week" | "day";

export default function CalendarPage() {
  const [view, setView] = React.useState<View>("month");

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
        <CalendarToolbar view={view} onViewChange={setView} />
      </div>

      <ConnectProviderBanner onConnect={() => toast.info("Conexión simulada")} />

      <CalendarView view={view} />
    </div>
  );
}
