"use client";

type View = "month" | "week" | "day";

export default function CalendarView({ view }: { view: View }) {
  if (view === "day") {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-2 text-sm font-semibold">Vista Día</div>
        <div className="grid grid-rows-6 gap-2">
          {["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"].map((h) => (
            <div key={h} className="flex items-center gap-3 rounded border p-3 text-xs">
              <div className="w-16 shrink-0 text-muted-foreground">{h}</div>
              <div className="h-10 w-full rounded border border-dashed" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "week") {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-2 text-sm font-semibold">Vista Semana</div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => (
            <div key={d} className="min-h-[160px] rounded border p-2">
              <div className="mb-1 text-xs text-muted-foreground">{d}</div>
              <div className="h-24 rounded border border-dashed" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // month
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 text-sm font-semibold">Vista Mes</div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-[100px] rounded border p-2 text-xs">
            <div className="mb-1 text-muted-foreground">Día {i + 1}</div>
            <div className="h-12 rounded border border-dashed" />
          </div>
        ))}
      </div>
    </div>
  );
}
