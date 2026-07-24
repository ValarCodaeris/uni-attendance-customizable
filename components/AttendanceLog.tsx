import { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Filter, 
  Plus, 
  MapPin, 
  Clock,
  Sparkles
} from 'lucide-react';
import { Course, AttendanceRecord } from '../types';
import { getCourseColorClasses } from '../utils/attendance';

interface AttendanceLogProps {
  courses: Course[];
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

export default function AttendanceLog({
  courses,
  records,
  setRecords
}: AttendanceLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  // Manual retroactive log state (fast-add on this page too!)
  const [showFastAdd, setShowAddLog] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logStatus, setLogStatus] = useState<'attended' | 'absent' | 'cancelled'>('attended');
  const [logNote, setLogNote] = useState('');

  // Handle manual log addition
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert('Please select a course.');
      return;
    }

    const newLog: AttendanceRecord = {
      id: `r-manual-list-${Date.now()}`,
      courseId: selectedCourseId,
      date: logDate,
      status: logStatus,
      timestamp: new Date(logDate).getTime(),
      note: logNote || 'Ledger Entry'
    };

    setRecords([newLog, ...records]);
    setLogNote('');
    setShowAddLog(false);
  };

  // Toggle log status inline
  const cycleLogStatus = (logId: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id === logId) {
        const nextStatusMap: Record<string, 'attended' | 'absent' | 'cancelled'> = {
          attended: 'absent',
          absent: 'cancelled',
          cancelled: 'attended'
        };
        return { ...r, status: nextStatusMap[r.status] };
      }
      return r;
    }));
  };

  // Delete individual log
  const deleteLog = (logId: string) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      setRecords(prev => prev.filter(r => r.id !== logId));
    }
  };

  // Clear all logs
  const clearAllLogs = () => {
    if (confirm('🚨 DANGER: This will permanently delete ALL recorded attendance logs. This cannot be undone! Are you sure?')) {
      if (confirm('Double checking: Do you really want to reset your attendance to 0?')) {
        setRecords([]);
      }
    }
  };

  // Filter records based on criteria
  const filteredRecords = records.filter(record => {
    const course = courses.find(c => c.id === record.courseId);
    if (!course) return false;

    const matchesSearch = 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.note || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesCourse = courseFilter === 'all' || record.courseId === courseFilter;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* HEADER TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-6 h-6 text-indigo-500" />
            <span>Attendance Registry Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A comprehensive history of all sessions. Adjust or remove retroactively as required.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddLog(true)}
            className="flex items-center space-x-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Retroactive Entry</span>
          </button>

          <button
            onClick={clearAllLogs}
            disabled={records.length === 0}
            className="flex items-center space-x-1 px-4 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear All Logs</span>
          </button>
        </div>
      </div>

      {/* FILTER AND SEARCH CONTROLLERS */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        
        {/* Text Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search class code or notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 pl-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="text-slate-400 w-4 h-4 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full md:w-44 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="attended">✅ Attended</option>
            <option value="absent">❌ Absent</option>
            <option value="cancelled">➖ Cancelled / Holiday</option>
          </select>
        </div>

        {/* Course Filter Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="w-full md:w-56 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-bold ml-auto font-mono">
          Showing {filteredRecords.length} of {records.length} records
        </div>
      </div>

      {/* LEDGER TABLE GRID LIST */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                <th className="py-4 px-6">Class Code</th>
                <th className="py-4 px-6">Course Name</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6 text-center">Status (Click to toggle)</th>
                <th className="py-4 px-6">Note</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="max-w-md mx-auto space-y-2">
                      <Sparkles className="w-10 h-10 text-indigo-300 dark:text-indigo-700 mx-auto" />
                      <h4 className="font-extrabold text-slate-800 dark:text-white">No matches found</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Try modifying your filters or logging custom retroactive attendance above!
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => {
                  const course = courses.find(c => c.id === record.courseId);
                  if (!course) return null;
                  const colors = getCourseColorClasses(course.color);

                  let statusBadgeClass = 'bg-emerald-500 hover:bg-emerald-600 text-white';
                  let statusLabel = 'Attended';

                  if (record.status === 'absent') {
                    statusBadgeClass = 'bg-rose-500 hover:bg-rose-600 text-white';
                    statusLabel = 'Absent';
                  } else if (record.status === 'cancelled') {
                    statusBadgeClass = 'bg-slate-400 hover:bg-slate-500 text-white';
                    statusLabel = 'Cancelled';
                  }

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      
                      {/* Code */}
                      <td className="py-3 px-6 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded font-extrabold text-xs ${colors.badge}`}>
                          {course.code}
                        </span>
                      </td>

                      {/* Name & Venue */}
                      <td className="py-3 px-6">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white block line-clamp-1 max-w-[200px]">
                          {course.name}
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center">
                          <MapPin className="w-3 h-3 mr-0.5" /> {course.venue}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-6 font-semibold font-mono text-xs text-slate-500 dark:text-slate-400">
                        {record.date}
                      </td>

                      {/* Interactive Status Indicator Toggle */}
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => cycleLogStatus(record.id)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black w-24 tracking-wider transition-all hover:scale-105 active:scale-95 ${statusBadgeClass}`}
                          title="Click to cycle: Attended → Absent → Cancelled"
                        >
                          {statusLabel}
                        </button>
                      </td>

                      {/* Log notes / linked timetable timeslot */}
                      <td className="py-3 px-6 max-w-[150px] truncate text-[11px] text-slate-400 italic">
                        {record.note || 'Class session'}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => deleteLog(record.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAST MANUAL ADD LOG MODAL OVERLAY */}
      {showFastAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-scale-up">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span>Log Custom Session</span>
              </h3>
              <button 
                onClick={() => setShowAddLog(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="p-6 space-y-4">
              
              {/* Select Course */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">
                  Select Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">
                  Date
                </label>
                <input
                  type="date"
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">
                  Status
                </label>
                <select
                  value={logStatus}
                  onChange={e => setLogStatus(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="attended">✅ Attended</option>
                  <option value="absent">❌ Absent</option>
                  <option value="cancelled">➖ Cancelled / Holiday / Free</option>
                </select>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase font-semibold">
                  Log Label / Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm prep, Medical leave..."
                  value={logNote}
                  onChange={e => setLogNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddLog(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  Record Log
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
