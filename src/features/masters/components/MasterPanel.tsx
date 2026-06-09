import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  Spinner,
  useToast,
} from "@/components/ui";
import type { MasterTable } from "@/types/db";
import { useMaster, useMasterMutations } from "../hooks/useMasters";

/** Reusable list+create+edit panel for any name-based master. */
export function MasterPanel({ table, title }: { table: MasterTable; title: string }) {
  const { notify } = useToast();
  const { data, isLoading } = useMaster(table);
  const m = useMasterMutations(table);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function add() {
    const v = name.trim();
    if (!v) return;
    try {
      await m.create.mutateAsync(v);
      setName("");
      notify(`${title} added`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  async function saveEdit() {
    if (!editId) return;
    try {
      await m.update.mutateAsync({ id: editId, name: editName.trim() });
      setEditId(null);
      notify("Saved");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3 className="font-display text-lg">{title}</h3>
        <Badge tone="primary">{data?.length ?? 0}</Badge>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            value={name}
            placeholder={`Add ${title.toLowerCase()}…`}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button onClick={add} loading={m.create.isPending} size="icon" aria-label="Add">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <Spinner />
        ) : !data?.length ? (
          <EmptyState title="Nothing here yet" hint="Add your first entry above." />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            <AnimatePresence initial={false}>
              {data.map((row) => (
                <motion.li
                  key={row.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between gap-2 py-2.5"
                >
                  {editId === row.id ? (
                    <div className="flex flex-1 gap-2">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                      <Button size="sm" onClick={saveEdit} loading={m.update.isPending}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm">{row.name}</span>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditId(row.id);
                            setEditName(row.name);
                          }}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => m.remove.mutate(row.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
