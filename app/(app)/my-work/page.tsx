"use client";

import Breadcrumbs from "@/components/common/Breadcrumbs";
import TasksList from "@/components/tables/TasksList";
import { useAuth } from "@/components/providers/AuthProvider";

export const metadata = {
  title: "Mi trabajo | TaskFlow",
};

export default function MyWorkPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold tracking-tight">Mi trabajo</h1>
      <TasksList myUserId={user?.id} />
    </div>
  );
}
