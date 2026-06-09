import { PageHeader } from "@/components/layout/PageHeader";
import { MasterPanel } from "./MasterPanel";
import { TrainingPeriodPanel } from "./TrainingPeriodPanel";

/** Super-admin: manage all reference data. */
export function MastersPage() {
  return (
    <>
      <PageHeader title="Masters" subtitle="Manage reference data used across the app." />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <MasterPanel table="teams" title="Teams" />
        <MasterPanel table="colleges" title="Colleges" />
        <MasterPanel table="courses" title="Courses" />
        <MasterPanel table="systems" title="Systems" />
        <MasterPanel table="companies" title="Companies" />
        <TrainingPeriodPanel />
      </div>
    </>
  );
}
