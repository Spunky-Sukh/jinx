import { useEffect, useState } from "react";
import { Button, Field, Modal, Select, Textarea, useToast } from "@/components/ui";
import { useWorkLogMutations } from "../hooks/useWorkLogs";
import { STATUS_OPTIONS } from "../constants";
import type { WorkLog, WorkStatus } from "@/types/db";

/** Mentor marks complete/failed/etc. with remarks. */
export function ReviewModal({
  open,
  onClose,
  log,
}: {
  open: boolean;
  onClose: () => void;
  log: WorkLog | null;
}) {
  const { notify } = useToast();
  const { review } = useWorkLogMutations();
  const [status, setStatus] = useState<WorkStatus>("complete");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (log) {
      setStatus(log.status);
      setRemarks(log.mentor_remarks ?? "");
    }
  }, [log]);

  async function submit() {
    if (!log) return;
    try {
      await review.mutateAsync({ id: log.id, status, remarks });
      notify("Review saved");
      onClose();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Review work log">
      {log && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-surface-2 px-3 py-2">
            <p className="font-medium">{log.task_name}</p>
            <p className="text-sm text-muted">{log.trainee?.full_name}</p>
          </div>
          <Field label="Status">
            <Select options={STATUS_OPTIONS} value={status} onChange={(v) => setStatus(v as WorkStatus)} />
          </Field>
          <Field label="Remarks">
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Feedback for the trainee…" />
          </Field>
          <Button onClick={submit} loading={review.isPending} className="w-full">
            Save review
          </Button>
        </div>
      )}
    </Modal>
  );
}
