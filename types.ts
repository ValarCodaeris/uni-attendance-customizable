export interface Course {
  id: string;
  code: string;       // e.g., "BT3001"
  name: string;       // e.g., "Biotechnology 101"
  venue: string;      // e.g., "LHC-202"
  professor: string;  // e.g., "Dr. Shashi"
  color: string;      // Tailwind color identifier (e.g., 'blue', 'purple', 'emerald', 'indigo', 'orange')
  threshold: number;  // Attendance requirement percentage (e.g., 75, 50, 90)
}

export interface TimetableSlot {
  id: string;
  courseId: string;
  day: number;        // 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 0 = Sunday
  startTime: string;  // "HH:MM" (24h format)
  endTime: string;    // "HH:MM" (24h format)
}

export interface AttendanceRecord {
  id: string;
  courseId: string;
  date: string;       // "YYYY-MM-DD"
  slotId?: string;    // Reference to timetable slot if applicable
  status: 'attended' | 'absent' | 'cancelled';
  timestamp: number;  // epoch ms when logged or simulated
  note?: string;
}

export interface SimulationTime {
  isSimulated: boolean;
  simulatedDate: string; // "YYYY-MM-DD"
  simulatedTime: string; // "HH:MM"
  timeSpeed: 'real' | 'paused' | 'fast'; // for demo/simulation
}

export interface NotificationLog {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  courseId?: string;
  read: boolean;
}
