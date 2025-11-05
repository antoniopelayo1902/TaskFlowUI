import Breadcrumbs from "@/components/common/Breadcrumbs";
import SummaryCards from "@/components/dashboard/SummaryCards";
import MySuggestionsPanel from "@/components/dashboard/MySuggestionsPanel";
import PointsStreakWidget from "@/components/dashboard/PointsStreakWidget";
import RecentActivity from "@/components/dashboard/RecentActivity";

export const metadata = {
  title: "Dashboard | TaskFlow",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <SummaryCards />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <MySuggestionsPanel />
          <RecentActivity />
        </div>
        <div className="space-y-4">
          <PointsStreakWidget />
        </div>
      </div>
    </div>
  );
}
