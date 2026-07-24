import { useState } from 'react';
import { 
  Plus, 
  MapPin, 
  User, 
  Check, 
  X, 
  Minus, 
  Percent, 
  TrendingUp, 
  Calendar,
  Settings,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Course, AttendanceRecord, TimetableSlot, SimulationTime } from '../types';
import { 
  calculateCourseStats, 
  getCourseColorClasses, 
  formatTime12h,
  getDayName 
} from '../utils/attendance';

interface DashboardProps {
  courses: Course[];
  slots: TimetableSlot[];
  records: AttendanceRecord[];
  setRecords: (r: AttendanceRecord[]) => void;
  setCourses: (c: Course[]) => void;
  onCourseClick: (course: Course) => void;
  onAddCourseClick: () => void;
  simTime: SimulationTime;
}

export default function Dashboard({
  courses,
  slots,
  records,
  setRecords,
  setCourses,
  onCourseClick,
  onAddCourseClick,
  simTime
}: DashboardProps) {
  const [editingThresholdCourseId, setEditingThresholdCourseId] = useState<string | null>(null);

  // Get active date context (real or simulated)
  const currentDateObj = new Date(simTime.simulatedDate + 'T' + simTime.simulatedTime);
  const currentDayOfWeek = currentDateObj.getDay(); // 0 = Sun, 1 = Mon ...
  const dateStr = currentDateObj.toISOString().split('T')[0];

  // Calculate global summary metrics
  let totalAttended = 0;
  let totalAbsent = 0;
  let totalHeld = 0;

  const courseStatsMap = courses.reduce((acc, course) => {
    const stats = calculateCourseStats(course, records);
    acc[course.id] = stats;
    totalAttended += stats.attended;
    totalAbsent += stats.absent;
    totalHeld += stats.totalHeld;
    return acc;
  }, {} as Record<string, ReturnType<typeof calculateCourseStats>>);

  const overallPercentage = totalHeld === 0 ? 100 : (totalAttended / totalHeld) * 100;
  const roundedOverall = Math.round(overallPercentage * 10) / 10;

  // Determine global color status based on a default 75% goal, or a custom target
  let overallColorClass = 'text-emerald-500';
  let overallBgClass = 'bg-emerald-500/10';
  if (roundedOverall >= 75) {
    overallColorClass = 'text-emerald-500 dark:text-emerald-400';
    overallBgClass = 'bg-emerald-500/10 border-emerald-500/20';
  } else if (roundedOverall >= 65) {
    overallColorClass = 'text-amber-500 dark:text-amber-400';
    overallBgClass = 'bg-amber-500/10 border-amber-500/20';
  } else {
    overallColorClass = 'text-rose-500 dark:text-rose-400';
    overallBgClass = 'bg-rose-500/10 border-rose-500/20';
  }

  // Quick Action: Log an attendance instance for a course
  const logQuickAttendance = (courseId: string, status: 'attended' | 'absent' | 'cancelled') => {
    // Check if slot exists for today to link, otherwise just log Course ID
    const todaySlots = slots.filter(s => s.courseId === courseId && s.day === currentDayOfWeek);
    const slotId = todaySlots[0]?.id;

    const newRecord: AttendanceRecord = {
      id: `r-quick-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      courseId,
      date: dateStr,
      slotId,
      status,
      timestamp: currentDateObj.getTime(),
      note: 'Logged via Quick Action'
    };

    setRecords([newRecord, ...records]);
  };

  // Adjust course threshold directly from card
  const handleThresholdChange = (courseId: string, newThreshold: number) => {
    const updated = courses.map(c => {
      if (c.id === courseId) {
        return { ...c, threshold: newThreshold };
      }
      return c;
    });
    setCourses(updated);
  };

  // Today's schedule slots
  const todaySlots = slots
    .filter(slot => slot.day === currentDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* SECTION 1: GLOBAL METRICS HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Metric A: Beautiful Percentage Circle */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center justify-between col-span-1 lg:col-span-2 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-4 translate-x-4">
            <Percent className="w-64 h-64 text-indigo-500" />
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Overall Semester Attendance
              </h2>
            </div>
            
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-mono">
                  {roundedOverall}%
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${overallBgClass} ${overallColorClass}`}>
                  {roundedOverall >= 75 ? 'Excellent' : roundedOverall >= 65 ? 'Warning' : 'Critical'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                Calculated across all courses. 75% attendance is standard university compliance, but you can adjust criteria below!
              </p>
            </div>

            <div className="flex items-center space-x-6 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Attended</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">{totalAttended}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Missed</span>
                <span className="text-lg font-bold text-rose-500 font-mono">{totalAbsent}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Total Held</span>
                <span className="text-lg font-bold text-slate-700 dark:text-slate-300 font-mono">{totalHeld}</span>
              </div>
            </div>
          </div>

          {/* Progress Circular Arc */}
          <div className="relative flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 ml-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="40%"
                className="stroke-slate-100 dark:stroke-slate-700/60 fill-none"
                strokeWidth="12"
              />
              <circle
                cx="50%"
                cy="50%"
                r="40%"
                className={`fill-none transition-all duration-500 ${
                  roundedOverall >= 75 
                    ? 'stroke-emerald-500' 
                    : roundedOverall >= 65 
                    ? 'stroke-amber-500' 
                    : 'stroke-rose-500'
                }`}
                strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallPercentage / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-sm font-black text-slate-400 dark:text-slate-500">Target</span>
              <span className="text-lg font-black text-slate-800 dark:text-white font-mono">75%</span>
            </div>
          </div>
        </div>

        {/* Metric B: Today's Schedule Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col justify-between col-span-1">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                Today's Schedule ({getDayName(currentDayOfWeek)})
              </h3>
            </div>
            {simTime.isSimulated && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-[10px] text-white font-bold uppercase tracking-wider animate-pulse">
                Simulated
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-48 space-y-3 pr-1">
            {todaySlots.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-6">
                <Sparkles className="w-8 h-8 text-indigo-300 dark:text-indigo-700 mb-2" />
                <p className="text-xs font-semibold text-slate-400">No classes scheduled for today!</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-500">Enjoy your holiday or time travel to Monday!</p>
              </div>
            ) : (
              todaySlots.map(slot => {
                const course = courses.find(c => c.id === slot.courseId);
                if (!course) return null;
                const colors = getCourseColorClasses(course.color);
                
                return (
                  <div 
                    key={slot.id} 
                    onClick={() => onCourseClick(course)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border ${colors.bg} ${colors.border} cursor-pointer hover:scale-[1.01] transition-transform`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xs font-black px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 font-mono shadow-sm">
                        {course.code}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-white block truncate max-w-[120px]">
                          {course.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center">
                          <MapPin className="w-2.5 h-2.5 mr-0.5" /> {course.venue}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block font-mono">
                        {formatTime12h(slot.startTime)}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                        to {formatTime12h(slot.endTime)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: ATTENDANCE CARDS GRID WITH THRESHOLD CRITERIA */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Your Course Tracks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your attendance thresholds, view safety projections, and quickly record attendance.
            </p>
          </div>
          <button
            onClick={onAddCourseClick}
            className="flex items-center justify-center space-x-2 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-indigo-100 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
              <Calendar className="w-8 h-8 text-indigo-500" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No courses found!</h4>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-md mx-auto">
              Ready to take control of your attendance? Click the button below to add your first course and configure its threshold.
            </p>
            <button
              onClick={onAddCourseClick}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-md"
            >
              Add Your First Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => {
              const stats = courseStatsMap[course.id];
              const colors = getCourseColorClasses(course.color);
              const isEditingThreshold = editingThresholdCourseId === course.id;

              // Color-coded box representing status based on target threshold
              // Above threshold => Green
              // Near threshold (within 10%) => Yellow
              // Below threshold - 10% => Red
              let statusBg = 'bg-emerald-500';
              let statusText = 'Excellent';

              if (stats.statusColor === 'green') {
                statusBg = 'bg-emerald-500 dark:bg-emerald-600';
                statusText = 'On Track';
              } else if (stats.statusColor === 'yellow') {
                statusBg = 'bg-amber-500 dark:bg-amber-600';
                statusText = 'Warning';
              } else {
                statusBg = 'bg-rose-500 dark:bg-rose-600';
                statusText = 'Critical';
              }

              return (
                <div 
                  key={course.id}
                  className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/80 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow relative"
                >
                  
                  {/* Card Header Color Ribbon */}
                  <div className={`h-2 w-full bg-gradient-to-r ${colors.gradient}`}></div>
                  
                  <div className="p-5 flex-1 space-y-4">
                    {/* Header Info */}
                    <div className="flex items-start justify-between">
                      <div className="cursor-pointer flex-1 mr-2" onClick={() => onCourseClick(course)}>
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md font-mono ${colors.badge}`}>
                            {course.code}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center">
                            <MapPin className="w-3 h-3 mr-0.5" /> {course.venue}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {course.name}
                        </h4>
                        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center mt-0.5">
                          <User className="w-3 h-3 mr-1" /> {course.professor || 'No Instructor'}
                        </span>
                      </div>

                      {/* STATS BADGE BOX */}
                      <div className="text-right">
                        <div className={`w-14 h-14 rounded-2xl ${statusBg} text-white flex flex-col items-center justify-center font-bold shadow-md`}>
                          <span className="text-xs font-black font-mono leading-none">
                            {stats.percentage}%
                          </span>
                          <span className="text-[7px] tracking-wider uppercase font-extrabold mt-1">
                            {statusText}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC PROGRESS RANGE & CRITERIA SETTING */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400">Target Threshold:</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setEditingThresholdCourseId(isEditingThreshold ? null : course.id)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-500"
                            title="Edit target criteria percentage"
                          >
                            <Settings className="w-3 h-3" />
                          </button>
                          <span className="text-slate-800 dark:text-slate-100 font-bold font-mono">
                            {course.threshold}%
                          </span>
                        </div>
                      </div>

                      {isEditingThreshold ? (
                        <div className="pt-1.5 space-y-1 animate-slide-down">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 font-semibold">Criteria slider:</span>
                            <span className="text-xs font-bold text-indigo-600 font-mono">{course.threshold}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={course.threshold}
                            onChange={e => handleThresholdChange(course.id, parseInt(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                            <span>50% (Low)</span>
                            <span>75% (Compulsory)</span>
                            <span>90% (Strict)</span>
                          </div>
                        </div>
                      ) : (
                        /* Horizontal Bar showing Attended vs Missed relative to threshold */
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative mt-1">
                          <div 
                            className={`h-full ${
                              stats.statusColor === 'green' 
                                ? 'bg-emerald-500' 
                                : stats.statusColor === 'yellow' 
                                ? 'bg-amber-500' 
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${stats.percentage}%` }}
                          />
                          {/* Indicator pin for target threshold */}
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-500 dark:bg-slate-400 opacity-60" 
                            style={{ left: `${course.threshold}%` }}
                            title={`Target Threshold (${course.threshold}%)`}
                          />
                        </div>
                      )}
                    </div>

                    {/* SAFETY / ATTENDANCE PROJECTIONS */}
                    <div className="text-xs pt-1">
                      {stats.totalHeld === 0 ? (
                        <span className="text-slate-400 flex items-center">
                          <Info className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          No classes held yet
                        </span>
                      ) : stats.percentage >= course.threshold ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block"></span>
                          Can safely skip next <strong className="mx-1 font-mono">{stats.safeToMiss}</strong> class{stats.safeToMiss > 1 ? 'es' : ''}
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 inline-block animate-ping"></span>
                          Must attend next <strong className="mx-1 font-mono">{stats.requiredToAttend}</strong> class{stats.requiredToAttend > 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* QUICK LOGGING ACTION BUTTONS ROW */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700 flex justify-between gap-2">
                    <button
                      onClick={() => logQuickAttendance(course.id, 'attended')}
                      className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                      title="Log an Attended Class for Today"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Attended</span>
                    </button>

                    <button
                      onClick={() => logQuickAttendance(course.id, 'absent')}
                      className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                      title="Log an Absent Class for Today"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Absent</span>
                    </button>

                    <button
                      onClick={() => logQuickAttendance(course.id, 'cancelled')}
                      className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                      title="Log a Cancelled or Holiday Class"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Cancelled</span>
                    </button>
                  </div>

                  {/* BOTTOM HOVER DETAIL BANNER TRIGGER */}
                  <div 
                    onClick={() => onCourseClick(course)}
                    className="py-2.5 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/20 text-center border-t border-slate-100 dark:border-slate-700/80 cursor-pointer flex items-center justify-center space-x-1 transition-colors text-[11px] font-bold text-indigo-600 dark:text-indigo-400"
                  >
                    <span>Analyze Full Statistics</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
