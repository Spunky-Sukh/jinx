import { PageHeader } from "@/components/layout/PageHeader";
import { MentorMaster } from "./MentorMaster";

export function MentorsPage() {
  return (
    <>
      <PageHeader title="Mentors" subtitle="Register mentors and assign them to teams." />
      <div className="max-w-2xl">
        <MentorMaster />
      </div>
    </>
  );
}
