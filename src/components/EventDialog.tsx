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
import { eventsAPI, linksAPI } from "@/api/agentAPI";
import { Badge } from "@/components/ui/badge";
import type { EventRecord } from "@/lib/db";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventRecord | null;
  defaultStart?: string;
}

export function EventDialog({ open, onOpenChange, event, defaultStart }: EventDialogProps) {
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(event?.title ?? "");
      setDescription(event?.description ?? "");
      setStart(
        event
          ? toLocalInput(event.start, event.allDay)
          : defaultStart
            ? toLocalInput(defaultStart, false)
            : toLocalInput(new Date().toISOString(), false)
      );
      setEnd(
        event
          ? toLocalInput(event.end, event.allDay)
          : toLocalInput(new Date().toISOString(), false)
      );
      setAllDay(event?.allDay ?? false);
      setLocation(event?.location ?? "");
    }
  }, [open, event, defaultStart]);

  const handleSave = () => {
    const startISO = fromLocalInput(start, allDay);
    const endISO = fromLocalInput(end, allDay);
    const payload = {
      title,
      description,
      start: startISO,
      end: endISO,
      allDay,
      location,
    };
    if (event) {
      eventsAPI.update(event.id, payload);
    } else {
      eventsAPI.create(payload);
    }
    onOpenChange(false);
  };

  const backlinks = event ? linksAPI.list({ to: event.id }) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="event-dialog">
        <DialogHeader>
          <DialogTitle data-testid="event-dialog-title">{event ? t("calendar.edit") : t("calendar.new")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">{t("calendar.titleField")}</Label>
            <Input
              id="event-title"
              data-testid="event-field-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-desc">{t("calendar.description")}</Label>
            <Textarea
              id="event-desc"
              data-testid="event-field-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-start">{t("calendar.start")}</Label>
              <Input
                id="event-start"
                data-testid="event-field-start"
                type={allDay ? "date" : "datetime-local"}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">{t("calendar.end")}</Label>
              <Input
                id="event-end"
                data-testid="event-field-end"
                type={allDay ? "date" : "datetime-local"}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="event-allday"
              data-testid="event-field-allDay"
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="event-allday">{t("calendar.allDay")}</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-loc">{t("calendar.location")}</Label>
            <Input
              id="event-loc"
              data-testid="event-field-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          {event && backlinks.length > 0 && (
            <div className="space-y-1">
              <Label>{t("calendar.backlinks")}</Label>
              <div className="flex flex-wrap gap-1">
                {backlinks.map((l) => (
                  <Badge key={l.id} variant="outline" className="text-xs">
                    {l.type}: {l.from}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="event-cancel-btn" aria-label="Cancel">
            {t("calendar.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()} data-testid="event-submit-btn" aria-label="Save event">
            {t("calendar.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toLocalInput(iso: string, allDay: boolean): string {
  const d = new Date(iso);
  if (allDay) {
    return d.toISOString().slice(0, 10);
  }
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

function fromLocalInput(value: string, allDay: boolean): string {
  if (!value) return new Date().toISOString();
  if (allDay) {
    return new Date(value + "T00:00:00").toISOString();
  }
  return new Date(value).toISOString();
}
