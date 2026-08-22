import Dexie, { type Table } from "dexie";

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  tags: string[];
  links: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  links: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  id: string;
  summary: string;
  startedAt: string;
  endedAt: string | null;
}

export interface LinkRecord {
  id: string;
  from: string;
  to: string;
  type: string;
  createdAt: string;
}

export interface ConfigRecord {
  key: string;
  value: unknown;
}

export class AgentDeskDB extends Dexie {
  tasks!: Table<TaskRecord, string>;
  events!: Table<EventRecord, string>;
  sessions!: Table<SessionRecord, string>;
  links!: Table<LinkRecord, string>;
  config!: Table<ConfigRecord, string>;

  constructor() {
    super("agent-desk");
    this.version(1).stores({
      tasks: "id, status, priority, dueDate, *tags",
      events: "id, start, end",
      sessions: "id, startedAt, endedAt",
      links: "id, from, to, type",
      config: "key",
    });
  }
}

export const db = new AgentDeskDB();
