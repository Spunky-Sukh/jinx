import { useEffect, useState } from "react";
import {
  Button,
  ChipGroup,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import { useMentorsByTeam } from "@/features/mentors/hooks/useMentors";
import { useWorkLogMutations } from "../hooks/useWorkLogs";
import { STATUS_OPTIONS } from "../constants";
import { today } from "@/lib/date";
import type { Trainee, WorkLocation, WorkLog, WorkStatus } from "@/types/db";

interface Props {
  open: boolean;
  onClose: () => void;
  trainee: Trainee; // the logged-in trainee's record (for mentor defaults)
  editing?: WorkLog | null;
}

/**
 * Daily-work entry. Mentor defaults to the trainee's assigned mentor, with the
 * option to pick another mentor from the same team. Completed logs are locked
 * (the form refuses to open in edit mode for them).
 */
export function WorkLogFormModal({ open, onClose, trainee, editing }: Props) {
  const { notify } = useToast();
  const { create, update } = useWorkLogMutations();
  const { data: teamMentors } = useMentorsByTeam(trainee.team_id);

  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<WorkLocation>("office");
  const [workDate, setWorkDate] = useState(today());
  const [status, setStatus] = useState<WorkStatus>("pending");
  const [mentorId, setMentorId] = useState(trainee.mentor_id);

  useEffect(() => {
    if (editing) {
      setTaskName(editing.task_name);
      setDescription(editing.description);
      setLocation(editing.location);
      setWorkDate(editing.work_date);
      setStatus(editing.status);
      setMentorId(editing.mentor_id);
    } else {
      setTaskName("");
      setDescription("");
      setLocation("office");
      setWorkDate(today());
      setStatus("pending");
      setMentorId(trainee.mentor_id);
    }
  }, [editing, open, trainee.mentor_id]);

  async function submit() {
    if (!taskName.trim()) return notify("Task name is required", "error");
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          patch: { task_name: taskName, description, location, work_date: workDate, status, mentor_id: mentorId },
        });
        notify("Work log updated");
      } else {
        await create.mutateAsync({
          trainee_id: trainee.id,
          task_name: taskName,
          description,
          location,
          work_date: workDate,
          status,
          mentor_id: mentorId,
        });
        notify("Work log added");
      }
      onClose();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  const mentorOptions = (teamMentors ?? []).map((m) => ({
    value: m.id,
    label: m.id === trainee.mentor_id ? `${m.full_name} (assigned)` : m.full_name,
  }));

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit work log" : "Add work log"}>
      <div className="flex flex-col gap-4">
        <Field label="Task name" required>
          <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="What did you work on?" />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details, blockers, outcomes…" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Location">
            <ChipGroup
              options={[
                { value: "home", label: "Home" },
                { value: "office", label: "Office" },
              ]}
              value={location}
              onChange={(v) => setLocation(v as WorkLocation)}
            />
          </Field>
          <Field label="Date">
            <Input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select options={STATUS_OPTIONS} value={status} onChange={(v) => setStatus(v as WorkStatus)} />
          </Field>
          <Field label="Mentor" hint="Defaults to your assigned mentor">
            <Select options={mentorOptions} value={mentorId} onChange={setMentorId} searchable />
          </Field>
        </div>

        <Button onClick={submit} loading={create.isPending || update.isPending} className="w-full">
          {editing ? "Save changes" : "Add work log"}
        </Button>
      </div>
    </Modal>
  );
}
