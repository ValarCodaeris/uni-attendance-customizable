import { Course, AttendanceRecord, TimetableSlot } from '../types';

/**
 * Calculates attendance metrics for a specific course
 */
export interface CourseStats {
  attended: number;
  absent: number;
  cancelled: number;
  totalHeld: number;
  percentage: number;
  statusColor: 'green' | 'yellow' | 'red';
  safeToMiss: number;
  requiredToAttend: number;
}

export function calculateCourseStats(course: Course, records: AttendanceRecord[]): CourseStats {
  const courseRecords = records.filter(r => r.courseId === course.id);
  
  let attended = 0;
  let absent = 0;
  let cancelled = 0;

  courseRecords.forEach(r => {
    if (r.status === 'attended') attended++;
    else if (r.status === 'absent') absent++;
    else if (r.status === 'cancelled') cancelled++;
  });

  const totalHeld = attended + absent;
  const percentage = totalHeld === 0 ? 100 : (attended / totalHeld) * 100;

  const threshold = course.threshold;
  const yellowThreshold = threshold - 10;

  let statusColor: 'green' | 'yellow' | 'red' = 'green';
  if (percentage >= threshold) {
    statusColor = 'green';
  } else if (percentage >= yellowThreshold) {
    statusColor = 'yellow';
  } else {
    statusColor = 'red';
  }

  // Safe to miss: max M such that A / (H + M) >= T/100
  // M <= (100 * A) / T - H
  let safeToMiss = 0;
  if (percentage >= threshold && totalHeld > 0) {
    const maxTotal = Math.floor((100 * attended) / threshold);
    safeToMiss = Math.max(0, maxTotal - totalHeld);
  }

  // Required to attend: min R such that (A + R) / (H + R) >= T/100
  // R >= (T * H - 100 * A) / (100 - T)
  let requiredToAttend = 0;
  if (percentage < threshold) {
    if (threshold === 100) {
      // If threshold is 100%, and they missed any, they can never reach 100%
      requiredToAttend = absent > 0 ? 999 : 0;
    } else {
      const numerator = threshold * totalHeld - 100 * attended;
      const denominator = 100 - threshold;
      requiredToAttend = Math.ceil(numerator / denominator);
      if (requiredToAttend < 0) requiredToAttend = 0;
    }
  }

  return {
    attended,
    absent,
    cancelled,
    totalHeld,
    percentage: Math.round(percentage * 10) / 10, // 1 decimal place
    statusColor,
    safeToMiss,
    requiredToAttend
  };
}

/**
 * Returns a friendly text description of the safe/required classes
 */
export function getPlannerRecommendation(course: Course, stats: CourseStats): string {
  if (stats.totalHeld === 0) {
    return `No classes held yet. Keep attendance above ${course.threshold}% starting from the first class!`;
  }

  if (stats.percentage >= course.threshold) {
    if (stats.safeToMiss > 0) {
      return `You are in the safe zone! You can safely skip the next ${stats.safeToMiss} class${stats.safeToMiss > 1 ? 'es' : ''} and still remain above your ${course.threshold}% threshold.`;
    } else {
      return `You are at the boundary of your ${course.threshold}% threshold. You cannot afford to miss the next class!`;
    }
  } else {
    if (stats.requiredToAttend === 999) {
      return `With a 100% threshold, it is mathematically impossible to reach your target since you have already missed a class. Try adjusting your course threshold.`;
    }
    return `You need to attend the next ${stats.requiredToAttend} consecutive class${stats.requiredToAttend > 1 ? 'es' : ''} to bring your attendance back to ${course.threshold}%.`;
  }
}

/**
 * Default sample courses to populate the local state if empty
 */
export const SAMPLE_COURSES: Course[] = [
  {
    id: 'c-1',
    code: 'BT3001',
    name: 'Biotechnology 101',
    venue: 'LHC-202',
    professor: 'Dr. Shashi',
    color: 'emerald',
    threshold: 75
  },
  {
    id: 'c-2',
    code: 'CS3001',
    name: 'Computer Architecture',
    venue: 'LHC-301',
    professor: 'Dr. Vinay',
    color: 'indigo',
    threshold: 75
  },
  {
    id: 'c-3',
    code: 'EE2002',
    name: 'Signals & Systems',
    venue: 'Seminar Hall B',
    professor: 'Prof. Vikram',
    color: 'blue',
    threshold: 50
  },
  {
    id: 'c-4',
    code: 'MA1002',
    name: 'Linear Algebra',
    venue: 'LHC-101',
    professor: 'Dr. Mehta',
    color: 'purple',
    threshold: 90
  },
  {
    id: 'c-5',
    code: 'HU1021',
    name: 'Technical Writing',
    venue: 'Room 205',
    professor: 'Prof. Anjali',
    color: 'orange',
    threshold: 75
  }
];

/**
 * Default sample timetable slots
 */
export const SAMPLE_TIMETABLE_SLOTS: TimetableSlot[] = [
  // Monday
  { id: 's-m1', courseId: 'c-1', day: 1, startTime: '09:00', endTime: '09:50' }, // BT3001
  { id: 's-m2', courseId: 'c-2', day: 1, startTime: '10:00', endTime: '10:50' }, // CS3001
  { id: 's-m3', courseId: 'c-3', day: 1, startTime: '11:00', endTime: '11:50' }, // EE2002
  { id: 's-m4', courseId: 'c-4', day: 1, startTime: '14:00', endTime: '14:50' }, // MA1002
  
  // Tuesday
  { id: 's-t1', courseId: 'c-5', day: 2, startTime: '09:00', endTime: '09:50' }, // HU1021
  { id: 's-t2', courseId: 'c-2', day: 2, startTime: '10:00', endTime: '10:50' }, // CS3001
  
  // Wednesday
  { id: 's-w1', courseId: 'c-1', day: 3, startTime: '09:00', endTime: '09:50' }, // BT3001
  { id: 's-w2', courseId: 'c-3', day: 3, startTime: '11:00', endTime: '11:50' }, // EE2002
  
  // Thursday
  { id: 's-th1', courseId: 'c-2', day: 4, startTime: '10:00', endTime: '10:50' }, // CS3001
  { id: 's-th2', courseId: 'c-4', day: 4, startTime: '14:00', endTime: '14:50' }, // MA1002
  
  // Friday
  { id: 's-f1', courseId: 'c-1', day: 5, startTime: '09:00', endTime: '09:50' }, // BT3001
  { id: 's-f2', courseId: 'c-3', day: 5, startTime: '11:00', endTime: '11:50' }, // EE2002
  { id: 's-f3', courseId: 'c-5', day: 5, startTime: '15:00', endTime: '15:50' }  // HU1021
];

/**
 * Generates sample attendance records covering the last 3 weeks
 * to present the user with a lively and fully interactive application right from start!
 */
export function generateSampleRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  // Generate data for the past 21 days
  for (let i = 21; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday...
    
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends
    
    const dateStr = d.toISOString().split('T')[0];
    
    // Find slots on this day
    const slots = SAMPLE_TIMETABLE_SLOTS.filter(s => s.day === dayOfWeek);
    
    slots.forEach((slot, index) => {
      // Deterministic but realistic attendance mapping
      let status: 'attended' | 'absent' | 'cancelled' = 'attended';
      
      const seed = (i * 3 + index * 7) % 10;
      
      if (slot.courseId === 'c-1') {
        // BT3001: 5 attended, 1 missed, 1 cancelled
        if (seed === 2) status = 'absent';
        else if (seed === 5) status = 'cancelled';
        else status = 'attended';
      } else if (slot.courseId === 'c-2') {
        // CS3001: 3 attended, 2 missed
        if (seed === 1 || seed === 4) status = 'absent';
        else status = 'attended';
      } else if (slot.courseId === 'c-3') {
        // EE2002: 3 attended, 3 missed (for 50% threshold)
        if (seed % 2 === 0) status = 'absent';
        else status = 'attended';
      } else if (slot.courseId === 'c-4') {
        // MA1002: 3 attended, 1 missed (for 90% threshold, total 4, percentage 75%, should be red)
        if (seed === 3) status = 'absent';
        else status = 'attended';
      } else if (slot.courseId === 'c-5') {
        // HU1021: 3 attended, 1 missed, 1 cancelled
        if (seed === 0) status = 'absent';
        else if (seed === 8) status = 'cancelled';
        else status = 'attended';
      }
      
      records.push({
        id: `r-sample-${i}-${slot.id}`,
        courseId: slot.courseId,
        date: dateStr,
        slotId: slot.id,
        status,
        timestamp: d.getTime()
      });
    });
  }
  
  return records;
}

/**
 * Formats a 24-hour time string into a pretty 12-hour AM/PM string
 */
export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minStr} ${ampm}`;
}

/**
 * Gets day of week name
 */
export function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || '';
}

/**
 * Tailwind background colors mapped to color themes
 */
export function getCourseColorClasses(color: string): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  hover: string;
  ring: string;
  gradient: string;
} {
  const themes: Record<string, any> = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
      ring: 'focus:ring-emerald-500',
      gradient: 'from-emerald-500 to-teal-600',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/20',
      text: 'text-indigo-700 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
      hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
      ring: 'focus:ring-indigo-500',
      gradient: 'from-indigo-500 to-purple-600',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
      ring: 'focus:ring-blue-500',
      gradient: 'from-blue-500 to-cyan-600',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
      ring: 'focus:ring-purple-500',
      gradient: 'from-purple-500 to-pink-600',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
      badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
      hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
      ring: 'focus:ring-orange-500',
      gradient: 'from-orange-500 to-amber-600',
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-950/20',
      text: 'text-pink-700 dark:text-pink-400',
      border: 'border-pink-200 dark:border-pink-800',
      badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
      hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/30',
      ring: 'focus:ring-pink-500',
      gradient: 'from-pink-500 to-rose-600',
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-950/20',
      text: 'text-cyan-700 dark:text-cyan-400',
      border: 'border-cyan-200 dark:border-cyan-800',
      badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
      hover: 'hover:bg-cyan-100 dark:hover:bg-cyan-900/30',
      ring: 'focus:ring-cyan-500',
      gradient: 'from-cyan-500 to-teal-500',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/30',
      ring: 'focus:ring-amber-500',
      gradient: 'from-amber-500 to-orange-500',
    }
  };

  return themes[color] || themes.blue;
}
