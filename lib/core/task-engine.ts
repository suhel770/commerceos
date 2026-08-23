/**
 * CommerceOS Core Platform Foundation (CPF) V1
 * Universal Task Engine (TaskEngine)
 */

export type TaskModule =
  | "purchase"
  | "inventory"
  | "warehouse"
  | "orders"
  | "returns"
  | "finance";

export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "open" | "in_progress" | "qc_hold" | "completed" | "cancelled";

export type CommerceTask = {
  taskId: string;
  module: TaskModule;
  title: string;
  priority: TaskPriority;
  ownerId: string;
  assigneeId?: string;
  status: TaskStatus;
  dueDate: string;
  startedAt?: string;
  completedAt?: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  relatedEntity: {
    entityType: "purchase_bill" | "grn" | "order" | "return" | "cycle_count";
    entityId: string;
  };
  comments?: string[];
};

class TaskEngine {
  private tasks: Map<string, CommerceTask> = new Map();

  public createTask(task: Omit<CommerceTask, "taskId" | "status">): CommerceTask {
    const id = `tsk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullTask: CommerceTask = {
      ...task,
      taskId: id,
      status: "open",
    };
    this.tasks.set(id, fullTask);
    return fullTask;
  }

  public updateStatus(taskId: string, status: TaskStatus): CommerceTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    task.status = status;
    if (status === "completed") {
      task.completedAt = new Date().toISOString();
    }
    this.tasks.set(taskId, task);
    return task;
  }

  public getTasksByModule(module: TaskModule): CommerceTask[] {
    return Array.from(this.tasks.values()).filter((t) => t.module === module);
  }
}

export const taskEngine = new TaskEngine();
