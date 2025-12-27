import { addMonths, addWeeks, addDays, getDay, nextDay, startOfDay } from "date-fns";

// Note: date-fns/types doesn't exist in newer versions, define type inline
type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";

export interface ScheduleConfig {
  startDate: Date;
  endDate: Date;
  frequency: Frequency;
  totalVisits?: number;
  preferredDayOfWeek?: Day; // 0 = Sunday, 1 = Monday, etc.
  skipWeekends?: boolean;
}

/**
 * Visit Scheduler Engine
 * Generates specific visit dates based on contract parameters.
 */
export function generateVisitSchedule(
  config: ScheduleConfig
): Date[] {
  const { startDate, endDate, frequency, totalVisits, preferredDayOfWeek, skipWeekends } = config;
  const visits: Date[] = [];
  
  let currentDate = startOfDay(startDate);
  const end = startOfDay(endDate);

  // Correction for preferred day (if weekly or more frequent)
  if (preferredDayOfWeek !== undefined && getDay(currentDate) !== preferredDayOfWeek) {
    currentDate = nextDay(currentDate, preferredDayOfWeek);
  }

  // Safety break to prevent infinite loops
  let count = 0;
  const maxLoops = 1000; 

  while (currentDate <= end && count < maxLoops) {
    // If we hit the total visit count, stop
    if (totalVisits && visits.length >= totalVisits) {
      break;
    }

    // Weekend skipping logic (Sat/Sun)
    let visitDate = new Date(currentDate);
    if (skipWeekends) {
      const day = getDay(visitDate);
      if (day === 0) visitDate = addDays(visitDate, 1); // If Sunday -> Monday
      if (day === 6) visitDate = addDays(visitDate, 2); // If Saturday -> Monday
    }

    // Only add if within end date (after adjustment)
    if (visitDate <= end) {
      visits.push(visitDate);
    }

    // Increment based on frequency
    switch (frequency) {
      case "DAILY":
        currentDate = addDays(currentDate, 1);
        break;
      case "WEEKLY":
        currentDate = addWeeks(currentDate, 1);
        break;
      case "MONTHLY":
        currentDate = addMonths(currentDate, 1);
        break;
      case "QUARTERLY":
        currentDate = addMonths(currentDate, 3);
        break;
      case "HALF_YEARLY":
        currentDate = addMonths(currentDate, 6);
        break;
      case "YEARLY":
        currentDate = addMonths(currentDate, 12);
        break;
    }
    count++;
  }

  return visits;
}
