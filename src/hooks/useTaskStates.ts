import { configAPI } from "@/api/agentAPI";
import { DEFAULT_TASK_STATES } from "@/api/agentAPI";
import { useApiRefresh } from "./useApiRefresh";

export function useTaskStates(): string[] {
  useApiRefresh();
  const states = configAPI.get("taskStates") as string[] | undefined;
  return states && states.length > 0 ? states : DEFAULT_TASK_STATES;
}
