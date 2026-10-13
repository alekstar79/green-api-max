export type PollingStatus = "idle" | "listening" | "retrying";

export interface PollingState {
  chatId: string | null;
  status: PollingStatus;
  error: string | null;
}

export type PollingAction =
  | { type: "listening"; chatId: string }
  | { type: "retrying"; chatId: string; error: string };

export const initialPollingState: PollingState = {
  chatId: null,
  status: "idle",
  error: null,
};

export function pollingReducer(_state: PollingState, action: PollingAction): PollingState {
  if (action.type === "retrying") {
    return { chatId: action.chatId, status: "retrying", error: action.error };
  }
  return { chatId: action.chatId, status: "listening", error: null };
}