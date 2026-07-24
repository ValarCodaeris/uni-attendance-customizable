import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  User, 
  Award, 
  Settings, 
  Trash2, 
  Edit2
} from 'lucide-react';
import { Course, AttendanceRecord, TimetableSlot } from '../types';
import { 
  calculateCourseStats, 
  getPlannerRecommendation, 
  getCourseColorClasses, 
  getDayName,
  formatTime12h
} from '../utils/attendance';

interface CourseModalProps {
  course: Course;
  records: AttendanceRecord[];
  slots: TimetableSlot[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setSlots: React.Dispatch<React.SetStateAction<TimetableSlot[]>>;
  onClose: () => void;
}

export default function CourseModal({
  course,
  records,
  slots,
  setRecords,
  setCourses,
  setSlots,
  onClose
}: CourseModalProps) {
  // Stats calculations
  const stats = calculateCourseStats(course, records);
  const colors = getCourseColorClasses(course.color);

  // States
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState(course.code);
  const [editName, setEditName] = useState(course.name);
  const [editVenue, setEditVenue] = useState(course.venue);
  const [editProfessor, setEditProfessor] = useState(course.professor);
  const [editThreshold, setEditThreshold] = useState(course.threshold);
  const [editColor, setEditColor] = useState(course.color);

  // Retroactive log form
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logStatus, setLogStatus] = useState<'attended' | 'absent' | 'cancelled'>('attended');
  const [logNote, setLogNote] = useState('');

  // Course specific logs, sorted newest first
  const courseLogs = records
    .filter(r => r.courseId === course.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp);

  // Course timetable slots
  const courseSlots = slots.filter(s => s.courseId === course.id);

  // Form Submit: Edit Course settings
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCourses(prev => prev.map(c => c.id === course.id ? {
      ...c,
      code: editCode,
      name: editName,
      venue: editVenue,
      professor: editProfessor,
      threshold: Number(editThreshold),
      color: editColor
    } : c));
    setIsEditing(false);
  };

  // Delete Course & linked slots/records
  const handleDeleteCourse = () => {
    if (confirm(`⚠️ WARNING: This will permanently delete course "${course.code}", all its scheduled slots, and its ${courseLogs.length} attendance records. Are you absolutely sure?`)) {
      setCourses(prev => prev.filter(c => c.id !== course.id));
      setSlots(prev => prev.filter(s => s.courseId !== course.id));
      setRecords(prev => prev.filter(r => r.courseId !== course.id));
      onClose();
    }
  };

  // Add retroactive log
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: AttendanceRecord = {
      id: `r-manual-${Date.now()}`,
      courseId: course.id,
      date: logDate,
      status: logStatus,
      timestamp: new Date(logDate).getTime(),
      note: logNote || 'Manual Entry'
    };
    setRecords([newLog, ...records]);
    setLogNote('');
  };

  // Toggle log state inline (useful to correct misclicks)
  const cycleLogStatus = (logId: string) => {
    setRecords(records.map(r => {
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
    if (confirm('Delete this attendance entry? This will update stats in real-time.')) {
      setRecords(records.filter(r => r.id !== logId));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700/80 animate-scale-up my-8 max-h-[90vh] flex flex-col">
        
        {/* MODAL COLOR RIBBON HEADER */}
        <div className={`p-6 bg-gradient-to-r ${colors.gradient} text-white relative`}>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-1">
            <span className="text-[10px] font-extrabold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-md font-mono">
              Course Reference
            </span>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-black font-mono">{course.code}</h2>
              <span className="text-xl opacity-75 font-semibold">|</span>
              <h3 className="text-xl font-extrabold truncate max-w-[400px]">{course.name}</h3>
            </div>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-90 font-medium pt-1.5">
              <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {course.venue}</span>
              <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1" /> {course.professor}</span>
            </div>
          </div>
        </div>

        {/* TAB CONTROLLERS / BODY SCROLLER */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* EDIT FORM (Conditionally Expanded) */}
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-indigo-50 dark:border-indigo-950/20 space-y-4 animate-slide-down">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center">
                  <Settings className="w-4 h-4 mr-1.5 text-indigo-500" /> Adjust Course Parameters
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-semibold text-rose-500 hover:underline"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Course Code</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={e => setEditCode(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Course Title</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Venue / Classroom</label>
                  <input
                    type="text"
                    value={editVenue}
                    onChange={e => setEditVenue(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Professor Name</label>
                  <input
                    type="text"
                    value={editProfessor}
                    onChange={e => setEditProfessor(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                {/* Customizable criteria threshold slider */}
                <div className="space-y-1 col-span-1">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Attendance Goal Criteria</label>
                    <span className="text-xs font-bold text-indigo-600 font-mono">{editThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={editThreshold}
                    onChange={e => setEditThreshold(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                </div>

                {/* Color Scheme Picker */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Card Theme Color</label>
                  <div className="flex gap-2 pt-1">
                    {['emerald', 'indigo', 'blue', 'purple', 'orange', 'pink', 'cyan', 'amber'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          c === 'emerald' ? 'bg-emerald-500' :
                          c === 'indigo' ? 'bg-indigo-500' :
                          c === 'blue' ? 'bg-blue-500' :
                          c === 'purple' ? 'bg-purple-500' :
                          c === 'orange' ? 'bg-orange-500' :
                          c === 'pink' ? 'bg-pink-500' :
                          c === 'cyan' ? 'bg-cyan-500' : 'bg-amber-500'
                        } ${editColor === c ? 'border-slate-900 dark:border-white ring-2 ring-indigo-300 scale-110' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDeleteCourse}
                  className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Course Entirely
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Stats display and settings button */
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Attendance Metrics Dashboard
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all"
              >
                <Edit2 className="w-3 h-3 text-indigo-500" />
                <span>Adjust Course Settings / Goal</span>
              </button>
            </div>
          )}

          {/* REAL-TIME STATS BLOCKS & DYNAMIC PLANNER HERO */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* BIG WHEEL COMPLIANCE INDICATOR */}
            <div className={`col-span-1 md:col-span-2 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/80 flex flex-col items-center justify-center text-center ${
              stats.statusColor === 'green' ? 'bg-emerald-500/5 dark:bg-emerald-950/10' :
              stats.statusColor === 'yellow' ? 'bg-amber-500/5 dark:bg-amber-950/10' :
              'bg-rose-500/5 dark:bg-rose-950/10'
            }`}>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                Current Attendance
              </div>
              <span className={`text-4xl font-black font-mono ${
                stats.statusColor === 'green' ? 'text-emerald-500 dark:text-emerald-400' :
                stats.statusColor === 'yellow' ? 'text-amber-500 dark:text-amber-400' :
                'text-rose-500 dark:text-rose-400'
              }`}>
                {stats.percentage}%
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Target Criteria: <strong className="text-slate-700 dark:text-slate-300 font-mono">{course.threshold}%</strong>
              </span>

              {/* Status color-coded badge */}
              <div className={`mt-3 flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
                stats.statusColor === 'green' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40' :
                stats.statusColor === 'yellow' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/35 dark:text-amber-300 border-amber-200 dark:border-amber-900/40' :
                'bg-rose-100 text-rose-800 dark:bg-rose-950/35 dark:text-rose-300 border-rose-200 dark:border-rose-900/40'
              }`}>
                <span className={`h-2.5 w-2.5 rounded-full ${
                  stats.statusColor === 'green' ? 'bg-emerald-500' :
                  stats.statusColor === 'yellow' ? 'bg-amber-500' :
                  'bg-rose-500'
                }`}></span>
                <span>{stats.statusColor === 'green' ? 'Compliant' : stats.statusColor === 'yellow' ? 'Needs Attention' : 'Below Target'}</span>
              </div>
            </div>

            {/* QUICK COUNTER GRID */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-2xl text-center flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Attended</span>
                <span className="text-xl font-bold text-emerald-500 font-mono">{stats.attended}</span>
                <span className="text-[9px] text-slate-400 mt-0.5 font-mono">classes</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-2xl text-center flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Absent</span>
                <span className="text-xl font-bold text-rose-500 font-mono">{stats.absent}</span>
                <span className="text-[9px] text-slate-400 mt-0.5 font-mono">classes</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-2xl text-center flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Cancelled</span>
                <span className="text-xl font-bold text-indigo-500 font-mono">{stats.cancelled}</span>
                <span className="text-[9px] text-slate-400 mt-0.5 font-mono">excused</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-2xl text-center flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Scheduled</span>
                <span className="text-xl font-bold text-slate-700 dark:text-slate-300 font-mono">{stats.totalHeld}</span>
                <span className="text-[9px] text-slate-400 mt-0.5 font-mono">held total</span>
              </div>
            </div>

          </div>

          {/* DYNAMIC SEMESTER FORECASTER PLANNER CARD */}
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-950/30 flex items-start space-x-3">
            <Award className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h5 className="font-extrabold text-sm text-indigo-900 dark:text-indigo-400">
                Attendance Projection & Advice
              </h5>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-semibold">
                {getPlannerRecommendation(course, stats)}
              </p>
            </div>
          </div>

          {/* RETROACTIVE ATTENDANCE LOG FORM */}
          <div className="border-t border-slate-100 dark:border-slate-700/60 pt-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Retroactive Log (Forgot to track a class?)
            </h4>

            <form onSubmit={handleAddLog} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl flex flex-wrap items-end gap-3">
              
              <div className="flex-1 min-w-[140px] space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Date of Class</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="min-w-[120px] space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Logged Status</label>
                <select
                  value={logStatus}
                  onChange={e => setLogStatus(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="attended">✅ Attended</option>
                  <option value="absent">❌ Absent</option>
                  <option value="cancelled">➖ Cancelled</option>
                </select>
              </div>

              <div className="flex-1 min-w-[180px] space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Note / Label (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Lab experiment, Holiday..."
                  value={logNote}
                  onChange={e => setLogNote(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-4 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                Log Entry
              </button>
            </form>
          </div>

          {/* HISTORICAL ATTENDANCE LEDGER LOG */}
          <div className="border-t border-slate-100 dark:border-slate-700/60 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Log Ledger — Past Sessions ({courseLogs.length})
              </h4>
              <p className="text-[10px] text-slate-400 italic">
                *Click status circle to cycle status (Attended → Absent → Cancelled)
              </p>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-2 pr-1.5">
              {courseLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                  No sessions logged for this class yet. Record your first sessions!
                </div>
              ) : (
                courseLogs.map(log => {
                  let statusColor = 'bg-emerald-500 text-white';
                  let statusText = 'Attended';
                  
                  if (log.status === 'absent') {
                    statusColor = 'bg-rose-500 text-white';
                    statusText = 'Absent';
                  } else if (log.status === 'cancelled') {
                    statusColor = 'bg-slate-400 text-white';
                    statusText = 'Cancelled';
                  }

                  return (
                    <div 
                      key={log.id}
                      className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 transition-colors text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        {/* Interactive toggle status button */}
                        <button
                          onClick={() => cycleLogStatus(log.id)}
                          className={`w-20 py-1 rounded-full text-[10px] font-bold text-center border-none cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xs ${statusColor}`}
                          title="Click to cycle status: Attended -> Absent -> Cancelled"
                        >
                          {statusText}
                        </button>

                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-white block font-mono">
                            {log.date}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[240px]">
                            {log.note || 'Class Session'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => deleteLog(log.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* LIST OF SCHEDULING TIMETABLE SLOTS */}
          <div className="border-t border-slate-100 dark:border-slate-700/60 pt-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Weekly Timetable Schedule Blocks ({courseSlots.length})
            </h4>

            {courseSlots.length === 0 ? (
              <div className="text-xs p-3 bg-indigo-50/50 dark:bg-indigo-950/10 text-indigo-700 dark:text-indigo-400 rounded-xl">
                This course has no weekly timetable blocks scheduled. Go to "Timetable Grid" to assign slots for this class.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {courseSlots.map(slot => (
                  <div key={slot.id} className="p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-xl text-xs flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-300">
                      {getDayName(slot.day)}s
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                      {formatTime12h(slot.startTime)} - {formatTime12h(slot.endTime)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM FOOTER CLOSE */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white font-bold rounded-xl transition-all active:scale-95"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}
