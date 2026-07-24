import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  User, 
  Calendar,
  Grid,
  List,
  AlertCircle,
  X
} from 'lucide-react';
import { Course, TimetableSlot } from '../types';
import { getCourseColorClasses, formatTime12h } from '../utils/attendance';

interface TimetableGridProps {
  courses: Course[];
  slots: TimetableSlot[];
  setSlots: (s: TimetableSlot[]) => void;
  onCourseClick: (course: Course) => void;
}

export default function TimetableGrid({
  courses,
  slots,
  setSlots,
  onCourseClick
}: TimetableGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddSlot, setShowAddSlot] = useState(false);
  
  // New slot form state
  const [courseId, setCourseId] = useState('');
  const [day, setDay] = useState(1); // Default Monday
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:50');
  const [formError, setFormError] = useState('');

  // Define hours for the grid rows (from 8 AM to 6 PM)
  const gridHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  
  // Weekdays (Monday = 1 to Friday = 5. Saturday = 6)
  const weekdays = [
    { day: 1, label: 'Monday' },
    { day: 2, label: 'Tuesday' },
    { day: 3, label: 'Wednesday' },
    { day: 4, label: 'Thursday' },
    { day: 5, label: 'Friday' },
    { day: 6, label: 'Saturday' }
  ];

  const handleAddSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!courseId) {
      setFormError('Please select a course.');
      return;
    }

    if (startTime >= endTime) {
      setFormError('End time must be after start time.');
      return;
    }

    // Check for overlap on the same day & time
    const parsedStart = startTime.replace(':', '');
    const parsedEnd = endTime.replace(':', '');

    const isOverlap = slots.some(slot => {
      if (slot.day !== Number(day)) return false;
      const sStart = slot.startTime.replace(':', '');
      const sEnd = slot.endTime.replace(':', '');
      
      // Overlap formula: (StartA < EndB) and (EndA > StartB)
      return parsedStart < sEnd && parsedEnd > sStart;
    });

    if (isOverlap) {
      setFormError('This slot overlaps with an existing class in your timetable!');
      return;
    }

    const newSlot: TimetableSlot = {
      id: `slot-user-${Date.now()}`,
      courseId,
      day: Number(day),
      startTime,
      endTime
    };

    setSlots([...slots, newSlot]);
    setShowAddSlot(false);
    // Reset form
    setCourseId('');
    setStartTime('09:00');
    setEndTime('09:50');
  };

  const deleteSlot = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent course click modal opening
    if (confirm('Are you sure you want to remove this slot from your timetable?')) {
      setSlots(slots.filter(s => s.id !== slotId));
    }
  };

  // Groups slots by weekday for list view
  const getSlotsByDay = (dayNum: number) => {
    return slots
      .filter(s => s.day === dayNum)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* TIMETABLE HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-indigo-500" />
            <span>Weekly Class Timetable</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View your class times, add new slots, and Tap a cell to inspect specific course statistics.
          </p>
        </div>

        {/* View Mode Toggle & Add Button */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
              title="Calendar Grid Layout"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
              title="Daily List Layout"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAddSlot(true)}
            className="flex items-center space-x-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Class Slot</span>
          </button>
        </div>
      </div>

      {/* VIEW MODES CAROUSEL */}
      {viewMode === 'grid' ? (
        
        /* 1. WEEKLY CALENDAR GRID LAYOUT (Ideal for Large Screens) */
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl shadow-sm overflow-x-auto">
          <div className="min-w-[800px] divide-y divide-slate-100 dark:divide-slate-700/60">
            
            {/* Days Header */}
            <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/50 py-3 text-center text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
              <div className="col-span-1 border-r border-slate-100 dark:border-slate-700/40 flex items-center justify-center font-mono">
                Hour
              </div>
              {weekdays.map(wd => (
                <div key={wd.day} className="col-span-1">
                  {wd.label}
                </div>
              ))}
            </div>

            {/* Time Grid Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {gridHours.map(hour => {
                const hourFormatted = String(hour).padStart(2, '0') + ':00';
                
                return (
                  <div key={hour} className="grid grid-cols-7 min-h-[80px]">
                    
                    {/* Hour Sidebar Label */}
                    <div className="col-span-1 bg-slate-50/50 dark:bg-slate-800/20 border-r border-slate-100 dark:border-slate-700/40 flex flex-col items-center justify-center py-2 text-xs font-black text-slate-400 dark:text-slate-500 font-mono">
                      <span>{formatTime12h(hourFormatted)}</span>
                    </div>

                    {/* Weekday Columns for This Hour Row */}
                    {weekdays.map(wd => {
                      // Find if any class slots match this weekday and start hour block
                      const matchingSlots = slots.filter(slot => {
                        const slotHour = parseInt(slot.startTime.split(':')[0], 10);
                        return slot.day === wd.day && slotHour === hour;
                      });

                      return (
                        <div 
                          key={`${wd.day}-${hour}`} 
                          className="col-span-1 p-1 border-r border-slate-100 dark:border-slate-700/40 relative group/cell hover:bg-indigo-50/10 transition-colors"
                        >
                          {matchingSlots.map(slot => {
                            const course = courses.find(c => c.id === slot.courseId);
                            if (!course) return null;
                            const colors = getCourseColorClasses(course.color);

                            return (
                              <div
                                key={slot.id}
                                onClick={() => onCourseClick(course)}
                                className={`absolute inset-1 p-2 rounded-xl border flex flex-col justify-between cursor-pointer select-none group/slot transition-all hover:scale-[1.03] hover:shadow-md ${colors.bg} ${colors.border} ${colors.text}`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black font-mono tracking-wide">
                                      {course.code}
                                    </span>
                                    
                                    {/* Quick slot delete action */}
                                    <button
                                      onClick={(e) => deleteSlot(slot.id, e)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 opacity-0 group-hover/slot:opacity-100 transition-opacity"
                                      title="Remove slot"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                  <h4 className="text-[10.5px] font-extrabold line-clamp-1">
                                    {course.name}
                                  </h4>
                                </div>

                                <div className="space-y-0.5 pt-1 border-t border-indigo-200/20 dark:border-indigo-800/20">
                                  <span className="text-[9px] font-bold block flex items-center truncate">
                                    <MapPin className="w-2.5 h-2.5 mr-0.5" /> {course.venue}
                                  </span>
                                  <span className="text-[8px] opacity-80 block font-mono">
                                    {formatTime12h(slot.startTime)} - {formatTime12h(slot.endTime)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                  </div>
                );
              })}
            </div>

          </div>
        </div>
      ) : (
        
        /* 2. TIMELINE SCHEDULE LIST (Optimal for Mobile Displays) */
        <div className="space-y-6">
          {weekdays.map(wd => {
            const daySlots = getSlotsByDay(wd.day);
            
            return (
              <div 
                key={wd.day} 
                className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm"
              >
                <div className="border-b border-slate-100 dark:border-slate-700 pb-2.5 mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    {wd.label}
                  </h3>
                  <span className="text-xs text-slate-400 font-bold font-mono">
                    {daySlots.length} Class{daySlots.length === 1 ? '' : 'es'}
                  </span>
                </div>

                {daySlots.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
                    No classes scheduled.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {daySlots.map(slot => {
                      const course = courses.find(c => c.id === slot.courseId);
                      if (!course) return null;
                      const colors = getCourseColorClasses(course.color);

                      return (
                        <div
                          key={slot.id}
                          onClick={() => onCourseClick(course)}
                          className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer hover:scale-[1.01] transition-transform ${colors.bg} ${colors.border}`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-black px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-mono shadow-xs text-slate-800 dark:text-slate-200">
                              {course.code}
                            </span>
                            <div>
                              <h4 className="text-xs font-black text-slate-800 dark:text-white">
                                {course.name}
                              </h4>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="flex items-center"><MapPin className="w-2.5 h-2.5 mr-0.5" /> {course.venue}</span>
                                <span className="flex items-center"><User className="w-2.5 h-2.5 mr-0.5" /> {course.professor}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div className="text-right font-mono text-xs">
                              <span className="font-extrabold text-slate-700 dark:text-slate-300 block">
                                {formatTime12h(slot.startTime)}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                                to {formatTime12h(slot.endTime)}
                              </span>
                            </div>

                            <button
                              onClick={(e) => deleteSlot(slot.id, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* OFFLINE ADD TIMETABLE SLOT MODAL */}
      {showAddSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-scale-up">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span>Add Class to Timetable</span>
              </h3>
              <button 
                onClick={() => setShowAddSlot(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSlotSubmit} className="p-6 space-y-4">
              
              {/* Select Course */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Select Course
                </label>
                {courses.length === 0 ? (
                  <div className="text-xs p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl">
                    No courses available! Please click "Add Course" first on the Dashboard to populate courses.
                  </div>
                ) : (
                  <select
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Day of Week */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Weekday
                </label>
                <select
                  value={day}
                  onChange={e => setDay(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </select>
              </div>

              {/* Timeslot hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Start Time (24h)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    End Time (24h)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl text-xs text-rose-500 font-bold flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddSlot(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={courses.length === 0}
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  Schedule Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
