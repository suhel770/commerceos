/**
 * CommerceOS V4 — Storage Lifecycle Engine
 * Enforces valid state machine transitions:
 * Draft -> Configured -> Active <-> Maintenance <-> Inactive -> Archived
 */

import { VALID_LIFECYCLE_TRANSITIONS } from "../domain/constants";
import type { StorageLocationEntity } from "../domain/location.entity";
import type { StorageLifecycleState } from "../domain/types";

export class StorageLifecycleEngine {
  /**
   * Evaluates if a transition from currentState to targetState is valid
   */
  public canTransition(currentState: StorageLifecycleState, targetState: StorageLifecycleState): boolean {
    const allowed = VALID_LIFECYCLE_TRANSITIONS[currentState];
    return allowed.includes(targetState);
  }

  /**
   * Executes a lifecycle state transition on a location entity
   */
  public transition(location: StorageLocationEntity, targetState: StorageLifecycleState): void {
    if (!this.canTransition(location.lifecycleState, targetState)) {
      throw new Error(
        `[StorageLifecycleEngine] Invalid state transition from '${location.lifecycleState}' to '${targetState}'.`
      );
    }
    location.transitionLifecycle(targetState);
  }

  /**
   * Asserts location is active for operational execution
   */
  public assertActive(location: StorageLocationEntity): void {
    if (location.lifecycleState !== "active") {
      throw new Error(
        `[StorageLifecycleEngine] Location '${location.name}' (${location.code}) is in state '${location.lifecycleState}' (must be 'active').`
      );
    }
  }
}

export const storageLifecycleEngine = new StorageLifecycleEngine();
