/**
 * Time-Based Reflections Service
 * 
 * Constitutional Principles:
 * - User-initiated future reflections
 * - Optional reminder (never forced)
 * - No pressure to complete
 * - Can be dismissed anytime
 */

export interface TimeBasedReflection {
  id: string;
  content: string;
  scheduledFor: Date;
  createdAt: Date;
  reminderEnabled: boolean;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
  };
  completedAt?: Date;
  note?: string;
}

class TimeBasedReflectionsService {
  private readonly STORAGE_KEY = 'mirror_time_based_reflections';
  private reflections: TimeBasedReflection[] = [];

  constructor() {
    this.loadReflections();
  }

  /**
   * Load time-based reflections
   */
  private loadReflections(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.reflections = parsed.map((r: any) => ({
          ...r,
          scheduledFor: new Date(r.scheduledFor),
          createdAt: new Date(r.createdAt),
          completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
          recurring: r.recurring ? {
            ...r.recurring,
            endDate: r.recurring.endDate ? new Date(r.recurring.endDate) : undefined,
          } : undefined,
        }));
      } catch {
        this.reflections = [];
      }
    }
  }

  /**
   * Save reflections
   */
  private saveReflections(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.reflections));
  }

  /**
   * Schedule a reflection for the future
   */
  schedule(
    content: string,
    scheduledFor: Date,
    options?: {
      reminderEnabled?: boolean;
      recurring?: TimeBasedReflection['recurring'];
      note?: string;
    }
  ): TimeBasedReflection {
    const reflection: TimeBasedReflection = {
      id: crypto.randomUUID(),
      content,
      scheduledFor,
      createdAt: new Date(),
      reminderEnabled: options?.reminderEnabled ?? false,
      recurring: options?.recurring,
      note: options?.note,
    };

    this.reflections.push(reflection);
    this.saveReflections();

    return reflection;
  }

  /**
   * Get all scheduled reflections
   */
  getScheduled(): TimeBasedReflection[] {
    return this.reflections.filter(r => !r.completedAt);
  }

  /**
   * Get upcoming reflections
   */
  getUpcoming(daysAhead: number = 7): TimeBasedReflection[] {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);

    return this.reflections.filter(
      r => !r.completedAt && 
           r.scheduledFor >= now && 
           r.scheduledFor <= future
    );
  }

  /**
   * Get past due reflections
   */
  getPastDue(): TimeBasedReflection[] {
    const now = new Date();
    return this.reflections.filter(
      r => !r.completedAt && r.scheduledFor < now
    );
  }

  /**
   * Get reflections for today
   */
  getToday(): TimeBasedReflection[] {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return this.reflections.filter(
      r => !r.completedAt &&
           r.scheduledFor >= startOfDay &&
           r.scheduledFor < endOfDay
    );
  }

  /**
   * Mark as completed
   */
  complete(id: string): void {
    const reflection = this.reflections.find(r => r.id === id);
    if (reflection) {
      reflection.completedAt = new Date();

      // If recurring, create next instance
      if (reflection.recurring) {
        this.createRecurringInstance(reflection);
      }

      this.saveReflections();
    }
  }

  /**
   * Create next recurring instance
   */
  private createRecurringInstance(reflection: TimeBasedReflection): void {
    if (!reflection.recurring) return;

    const nextDate = new Date(reflection.scheduledFor);

    switch (reflection.recurring.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    // Check if past end date
    if (reflection.recurring.endDate && nextDate > reflection.recurring.endDate) {
      return;
    }

    this.schedule(reflection.content, nextDate, {
      reminderEnabled: reflection.reminderEnabled,
      recurring: reflection.recurring,
      note: reflection.note,
    });
  }

  /**
   * Update scheduled reflection
   */
  update(id: string, updates: Partial<TimeBasedReflection>): void {
    const index = this.reflections.findIndex(r => r.id === id);
    if (index !== -1) {
      this.reflections[index] = {
        ...this.reflections[index],
        ...updates,
      };
      this.saveReflections();
    }
  }

  /**
   * Delete scheduled reflection
   */
  delete(id: string): void {
    this.reflections = this.reflections.filter(r => r.id !== id);
    this.saveReflections();
  }

  /**
   * Get reflection by ID
   */
  get(id: string): TimeBasedReflection | null {
    return this.reflections.find(r => r.id === id) || null;
  }

  /**
   * Get completed reflections
   */
  getCompleted(): TimeBasedReflection[] {
    return this.reflections.filter(r => r.completedAt);
  }

  /**
   * Check if reminders should be shown
   * Constitutional: Only if user explicitly enabled
   */
  shouldShowReminder(): TimeBasedReflection[] {
    const today = this.getToday();
    return today.filter(r => r.reminderEnabled);
  }

  /**
   * Snooze reflection (reschedule for later today)
   */
  snooze(id: string, hours: number = 1): void {
    const reflection = this.reflections.find(r => r.id === id);
    if (reflection) {
      const newDate = new Date();
      newDate.setHours(newDate.getHours() + hours);
      reflection.scheduledFor = newDate;
      this.saveReflections();
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    scheduled: number;
    completed: number;
    pastDue: number;
    recurring: number;
  } {
    return {
      total: this.reflections.length,
      scheduled: this.getScheduled().length,
      completed: this.getCompleted().length,
      pastDue: this.getPastDue().length,
      recurring: this.reflections.filter(r => r.recurring).length,
    };
  }
}

// Singleton instance
export const timeBasedReflections = new TimeBasedReflectionsService();
