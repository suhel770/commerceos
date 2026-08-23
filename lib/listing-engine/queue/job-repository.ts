import type { ListingJob, ListingJobStatus } from "../types";

const STORAGE_KEY = "commerceos.listing-engine.jobs.v1";

function canUseStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

class ListingJobRepository {
  private memory = new Map<string, ListingJob>();

  private readAll(): ListingJob[] {
    if (!canUseStorage()) {
      return Array.from(this.memory.values());
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return Array.from(this.memory.values());
      }

      const parsed = JSON.parse(raw) as ListingJob[];
      this.memory = new Map(parsed.map((job) => [job.id, job]));
      return parsed;
    } catch {
      return Array.from(this.memory.values());
    }
  }

  private writeAll(jobs: ListingJob[]) {
    this.memory = new Map(jobs.map((job) => [job.id, job]));

    if (!canUseStorage()) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(jobs),
    );
  }

  async list(): Promise<ListingJob[]> {
    return this.readAll().sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  async getById(id: string): Promise<ListingJob | null> {
    return this.readAll().find((job) => job.id === id) ?? null;
  }

  async listByProduct(productId: string): Promise<ListingJob[]> {
    return (await this.list()).filter(
      (job) => job.productId === productId,
    );
  }

  async listErrors(): Promise<ListingJob[]> {
    return (await this.list()).filter(
      (job) => job.status === "failed",
    );
  }

  async create(
    input: Omit<
      ListingJob,
      "id" | "createdAt" | "updatedAt" | "attempts"
    > & {
      attempts?: number;
    },
  ): Promise<ListingJob> {
    const now = new Date().toISOString();
    const job: ListingJob = {
      ...input,
      id: crypto.randomUUID(),
      attempts: input.attempts ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    const jobs = this.readAll();
    jobs.push(job);
    this.writeAll(jobs);
    return job;
  }

  async update(
    id: string,
    updates: Partial<ListingJob>,
  ): Promise<ListingJob | null> {
    const jobs = this.readAll();
    const index = jobs.findIndex((job) => job.id === id);

    if (index < 0) {
      return null;
    }

    const next: ListingJob = {
      ...jobs[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    jobs[index] = next;
    this.writeAll(jobs);
    return next;
  }

  async transition(
    id: string,
    status: ListingJobStatus,
    updates: Partial<ListingJob> = {},
  ): Promise<ListingJob | null> {
    return this.update(id, {
      ...updates,
      status,
      completedAt:
        status === "published" || status === "failed"
          ? new Date().toISOString()
          : updates.completedAt,
    });
  }
}

export const listingJobRepository = new ListingJobRepository();
