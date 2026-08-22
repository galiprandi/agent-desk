import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tasksAPI } from "@/api/agentAPI";
import type { TaskRecord } from "@/lib/db";
import { useTaskStates } from "@/hooks/useTaskStates";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskRecord | null;
}

const PRIORITIES: TaskRecord["priority"][] = ["low", "medium", "high", "urgent"];

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const { t } = useTranslation();
  const states = useTaskStates();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(states[0] ?? "backlog");
  const [priority, setPriority] = useState<TaskRecord["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setStatus(task?.status ?? states[0] ?? "backlog");
      setPriority(task?.priority ?? "medium");
      setDueDate(task?.dueDate ? task.dueDate.slice(0, 10) : "");
      setTags(task?.tags.join(", ") ?? "");
    }
  }, [open, task, states]);

  const handleSave = () => {
    const tagArray = tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      tags: tagArray,
    };
    if (task) {
      tasksAPI.update(task.id, payload);
    } else {
      tasksAPI.create(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="task-dialog">
        <DialogHeader>
          <DialogTitle data-testid="task-dialog-title">{task ? t("tasks.edit") : t("tasks.new")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">{t("tasks.titleField")}</Label>
            <Input
              id="task-title"
              data-testid="task-field-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-desc">{t("tasks.description")}</Label>
            <Textarea
              id="task-desc"
              data-testid="task-field-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("tasks.status")}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="task-field-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s} value={s} data-testid={`task-status-option-${s}`}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("tasks.priority")}</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskRecord["priority"])}
              >
                <SelectTrigger data-testid="task-field-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} data-testid={`task-priority-option-${p}`}>
                      {t(`priority.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-due">{t("tasks.dueDate")}</Label>
              <Input
                id="task-due"
                data-testid="task-field-dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-tags">{t("tasks.tags")}</Label>
              <Input
                id="task-tags"
                data-testid="task-field-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t("tasks.tagsPlaceholder")}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="task-cancel-btn">
            {t("tasks.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()} data-testid="task-submit-btn">
            {t("tasks.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
