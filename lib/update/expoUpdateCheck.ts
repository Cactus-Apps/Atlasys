import * as Updates from "expo-updates";
import * as Sentry from "@sentry/react-native";
import { EventEmitter } from "eventemitter3";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "dismissed";

export interface UpdateState {
  status: UpdateStatus;
  progress: number; // 0-100
  error?: string;
}

class UpdateManager extends EventEmitter {
  private state: UpdateState = {
    status: "idle",
    progress: 0,
  };

  private checkInterval: ReturnType<typeof setInterval> | null = null;

  getState(): UpdateState {
    return { ...this.state };
  }

  setState(newState: Partial<UpdateState>) {
    this.state = { ...this.state, ...newState };
    this.emit("update", this.state);
  }

  async checkForUpdate(): Promise<void> {
    if (__DEV__ || !Updates.isEnabled) return;

    try {
      this.setState({ status: "checking", error: undefined });

      const result = await Updates.checkForUpdateAsync();

      if (result.isAvailable) {
        this.setState({ status: "available", progress: 0 });
        await this.downloadUpdate();
      } else {
        this.setState({ status: "idle" });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.setState({ status: "idle", error: errorMsg });
      Sentry.captureException(error);
    }
  }

  private async downloadUpdate(): Promise<void> {
    try {
      this.setState({ status: "downloading", progress: 10 });

      // Simulate progress (Update.fetchUpdateAsync doesn't provide real progress)
      const progressInterval = setInterval(() => {
        const currentProgress = this.state.progress;
        const newProgress = Math.min(currentProgress + Math.random() * 30, 90);
        this.setState({ progress: newProgress });
      }, 500);

      await Updates.fetchUpdateAsync();

      clearInterval(progressInterval);
      this.setState({ status: "ready", progress: 100 });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Download failed";
      this.setState({ status: "idle", error: errorMsg });
      Sentry.captureException(error);
    }
  }

  async reloadApp(): Promise<void> {
    try {
      this.setState({ status: "idle" });
      await Updates.reloadAsync();
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  dismissUpdate(): void {
    this.setState({ status: "dismissed" });
  }

  startPeriodicCheck(intervalMs: number = 3600000): void {
    // Check every hour by default
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => this.checkForUpdate(), intervalMs);
  }

  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const updateManager = new UpdateManager();

/** Checks for and downloads OTA updates in the background (applied on next app launch). */
export async function runExpoUpdateCheck(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;

  if (!Updates.channel) return;

  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      await Updates.fetchUpdateAsync();
    }
  } catch (error) {
    console.warn("OTA Update check failed:", error);
  }
}
