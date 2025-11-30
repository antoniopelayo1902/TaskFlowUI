"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import CalendarView from "@/components/calendar/CalendarView";
import ConnectProviderBanner from "@/components/calendar/ConnectProviderBanner";
import { toast } from "@/lib/toast";
import { fetchProjects } from "@/services/api/projects.service";
import type { CalendarEvent } from "@/components/calendar/CalendarView";

type View = "month" | "week" | "day";

export default function CalendarPage() {
  const [view, setView] = React.useState<View>("month");
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [current, setCurrent] = React.useState<Date>(new Date());

  const onToday = React.useCallback(() => {
    setCurrent(new Date());
  }, []);

  const onPrev = React.useCallback(() => {
    setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const onNext = React.useCallback(() => {
    setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  React.useEffect(() => {
    let mounted = true;
    fetchProjects()
      .then((ps) => {
        if (!mounted) return;
        const evts: CalendarEvent[] = ps
          .filter((p) => !!p.dueDate)
          .map((p) => ({
            // normalizamos a YYYY-MM-DD para evitar desfases por zona horaria
            date: (p.dueDate as string).slice(0, 10),
            title: `Proyecto: ${p.name}`,
            href: `/projects/${p.id}/kanban`,
          }));
        setEvents(evts);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
        <CalendarToolbar
          view={view}
          onViewChange={setView}
          current={current}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
        />
      </div>

      <ConnectProviderBanner onConnect={() => toast.info("Conexión simulada")} />

      <CalendarView view={view} events={events} current={current} />
    </div>
  );
}
