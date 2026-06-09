import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Spinner,
  useToast,
} from "@/components/ui";
import { useTrainingPeriods, useTrainingPeriodMutations } from "../hooks/useMasters";

export function TrainingPeriodPanel() {
  const { notify } = useToast();
  const { data, isLoading } = useTrainingPeriods();
  const m = useTrainingPeriodMutations();
  const [label, setLabel] = useState("");
  const [days, setDays] = useState("");

  async function add() {
    const d = parseInt(days, 10);
    if (!label.trim() || !d || d <= 0) return notify("Enter a label and positive days", "error");
    try {
      await m.create.mutateAsync({ label: label.trim(), duration_days: d });
      setLabel("");
      setDays("");
      notify("Training period added");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3 className="font-display text-lg">Trainee Days</h3>
        <Badge tone="primary">{data?.length ?? 0}</Badge>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_120px_auto] gap-2">
          <Field label="Label">
            <Input value={label} placeholder="6 Months" onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field label="Days">
            <Input type="number" value={days} placeholder="180" onChange={(e) => setDays(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button onClick={add} loading={m.create.isPending} size="icon" aria-label="Add">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data?.length ? (
          <EmptyState title="No training periods" hint="Add 45 Days, 6 Months, etc." />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            <AnimatePresence initial={false}>
              {data.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="text-sm">
                    {p.label} <span className="text-muted">· {p.duration_days} days</span>
                  </span>
                  <Button size="icon" variant="ghost" onClick={() => m.remove.mutate(p.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
