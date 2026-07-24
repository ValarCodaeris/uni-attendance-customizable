import { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  AlertCircle, 
  Volume2
} from 'lucide-react';
import { Course, TimetableSlot, AttendanceRecord, SimulationTime, NotificationLog } from './types';
import { SAMPLE_COURSES, SAMPLE_TIMETABLE_SLOTS, generateSampleRecords } from './utils/attendance';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TimetableGrid from './components/TimetableGrid';
import AttendanceLog from './components/AttendanceLog';
import NotificationCenter from './components/NotificationCenter';
import CourseModal from './components/CourseModal';

export default function App() {
  // 1. STATE INITIALIZATION (Local-First Synced with localStorage)
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('unia_courses');
    return saved ? JSON.parse(saved) : SAMPLE_COURSES;
  });

  const [slots, setSlots] = useState<TimetableSlot[]>(() => {
    const saved = localStorage.getItem('unia_slots');
    return saved ? JSON.parse(saved) : SAMPLE_TIMETABLE_SLOTS;
  });

  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('unia_records');
    return saved ? JSON.parse(saved) : generateSampleRecords();
  });

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem('unia_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Track which slot-date notifications have been fired to prevent duplicate alerts
  const [alreadyNotified, setAlreadyNotified] = useState<string[]>(() => {
    const saved = localStorage.getItem('unia_already_notified');
    return saved ? JSON.parse(saved) : [];
  });

  // Active view tab state ('dashboard' | 'timetable' | 'logs' | 'notifications')
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Selected course for detailed inspector modal
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Modal toggle state for adding a brand new course
  const [showAddCourse, setShowAddCourse] = useState(false);

  // Time-travel / Simulation parameters
  const [simTime, setSimTime] = useState<SimulationTime>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const hours = String(new Date().getHours()).padStart(2, '0');
    const minutes = String(new Date().getMinutes()).padStart(2, '0');
    return {
      isSimulated: false,
      simulatedDate: todayStr,
      simulatedTime: `${hours}:${minutes}`,
      timeSpeed: 'paused'
    };
  });

  // Active in-app floating banner toast
  const [activeToast, setActiveToast] = useState<NotificationLog | null>(null);

  // Simple offline audio player for alerts (Web Audio API synthesis - 100% offline & local!)
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Tone 1: High note
      const osc1 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc1.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.3);

      // Tone 2: Harmonious chord after 150ms
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gainNode2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5
        gainNode2.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc2.connect(gainNode2);
        gainNode2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.4);
      }, 150);
    } catch (e) {
      console.log('Web Audio API not supported/interacted yet.');
    }
  };

  // State values for New Course form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [newProfessor, setNewProfessor] = useState('');
  const [newThreshold, setNewThreshold] = useState(75);
  const [newColor, setNewColor] = useState('indigo');
  const [addCourseError, setAddCourseError] = useState('');

  // 2. DATA PERSISTENCE EFFECTS
  useEffect(() => {
    localStorage.setItem('unia_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('unia_slots', JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem('unia_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('unia_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('unia_already_notified', JSON.stringify(alreadyNotified));
  }, [alreadyNotified]);

  // Keep simulated time updated if real-time is active
  useEffect(() => {
    if (!simTime.isSimulated) {
      const interval = setInterval(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const hours = String(new Date().getHours()).padStart(2, '0');
        const minutes = String(new Date().getMinutes()).padStart(2, '0');
        setSimTime(prev => {
          if (!prev.isSimulated) {
            return {
              ...prev,
              simulatedDate: todayStr,
              simulatedTime: `${hours}:${minutes}`
            };
          }
          return prev;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [simTime.isSimulated]);

  // 3. AUTOMATED 10-MINUTE PRIOR CLASS ALARM MONITOR
  useEffect(() => {
    const alarmInterval = setInterval(() => {
      // Determine active target date & hour
      let targetDateStr = simTime.simulatedDate;
      let targetTimeStr = simTime.simulatedTime;

      if (!simTime.isSimulated) {
        const now = new Date();
        targetDateStr = now.toISOString().split('T')[0];
        targetTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      }

      const activeDateObj = new Date(targetDateStr + 'T' + targetTimeStr);
      const weekday = activeDateObj.getDay(); // 0 = Sun, 1 = Mon ...

      // Find schedule slots scheduled for today
      const todaySlots = slots.filter(s => s.day === weekday);

      // Parse current time in minutes from midnight
      const [ch, cm] = targetTimeStr.split(':').map(Number);
      const currentMins = ch * 60 + cm;

      todaySlots.forEach(slot => {
        const course = courses.find(c => c.id === slot.courseId);
        if (!course) return;

        // Parse slot start time in minutes from midnight
        const [sh, sm] = slot.startTime.split(':').map(Number);
        const slotMins = sh * 60 + sm;

        // Minutes prior check
        const diffMinutes = slotMins - currentMins;

        // Trigger alarm if slot is 0-10 mins away and NOT already notified
        const notificationKey = `${slot.id}-${targetDateStr}`;
        if (diffMinutes >= 0 && diffMinutes <= 10 && !alreadyNotified.includes(notificationKey)) {
          
          const alertTitle = `Upcoming Class Alert: ${course.code}!`;
          const alertMessage = `Your class "${course.name}" starts in ${diffMinutes} minutes (at ${slot.startTime}) in classroom ${course.venue}. Don't miss it!`;

          const newNotification: NotificationLog = {
            id: `notif-${Date.now()}-${slot.id}`,
            title: alertTitle,
            message: alertMessage,
            timestamp: Date.now(),
            courseId: course.id,
            read: false
          };

          // 1. Play offline audio chord
          playAlertSound();

          // 2. Trigger standard HTML5 system browser alert (if permission is given)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(alertTitle, {
              body: alertMessage,
              icon: '/favicon.ico'
            });
          }

          // 3. Register in local state history
          setNotifications(prev => [newNotification, ...prev]);
          setAlreadyNotified(prev => [...prev, notificationKey]);

          // 4. Activate beautiful overlay toast banner
          setActiveToast(newNotification);
          setTimeout(() => {
            setActiveToast(null);
          }, 8000);
        }
      });

    }, 3000);

    return () => clearInterval(alarmInterval);
  }, [simTime, slots, courses, alreadyNotified]);

  // Form Submit: Create New Course
  const handleAddCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddCourseError('');

    if (!newCode.trim() || !newName.trim() || !newVenue.trim() || !newProfessor.trim()) {
      setAddCourseError('Please fill out all fields.');
      return;
    }

    const codeExists = courses.some(c => c.code.toUpperCase() === newCode.trim().toUpperCase());
    if (codeExists) {
      setAddCourseError(`A course with code "${newCode.toUpperCase()}" already exists.`);
      return;
    }

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      venue: newVenue.trim(),
      professor: newProfessor.trim(),
      threshold: Number(newThreshold),
      color: newColor
    };

    setCourses([...courses, newCourse]);
    setShowAddCourse(false);

    // Reset Form Fields
    setNewCode('');
    setNewName('');
    setNewVenue('');
    setNewProfessor('');
    setNewThreshold(75);
    setNewColor('indigo');
  };

  // Reset helper to clear customize states back to original templates
  const handleResetToMocks = () => {
    if (confirm('Are you sure you want to reset everything back to the template university data? This will overwrite your current timetable.')) {
      setCourses(SAMPLE_COURSES);
      setSlots(SAMPLE_TIMETABLE_SLOTS);
      setRecords(generateSampleRecords());
      setNotifications([]);
      setAlreadyNotified([]);
      setActiveTab('dashboard');
    }
  };

  // Keep selected Course synchronized if changed elsewhere
  const syncedSelectedCourse = selectedCourse 
    ? courses.find(c => c.id === selectedCourse.id) || null
    : null;

  // Unread notification counts
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col font-sans transition-colors duration-200">
      
      {/* GLOBAL HEADER & SIMULATION NAV */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        courses={courses}
        setCourses={setCourses}
        slots={slots}
        setSlots={setSlots}
        records={records}
        setRecords={setRecords}
        simTime={simTime}
        setSimTime={setSimTime}
        unreadCount={unreadNotificationsCount}
        resetAllData={handleResetToMocks}
      />

      {/* CORE VIEWPORT LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            courses={courses}
            slots={slots}
            records={records}
            setRecords={setRecords}
            setCourses={setCourses}
            onCourseClick={setSelectedCourse}
            onAddCourseClick={() => setShowAddCourse(true)}
            simTime={simTime}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableGrid
            courses={courses}
            slots={slots}
            setSlots={setSlots}
            onCourseClick={setSelectedCourse}
          />
        )}

        {activeTab === 'logs' && (
          <AttendanceLog
            courses={courses}
            records={records}
            setRecords={setRecords}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationCenter
            notifications={notifications}
            setNotifications={setNotifications}
            courses={courses}
            onCourseClick={setSelectedCourse}
          />
        )}
      </main>

      {/* FLOATING INTERACTIVE CLASS INCOMING TOAST BANNER */}
      {activeToast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-900/60 p-4 animate-slide-up overflow-hidden flex items-start gap-3">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-indigo-600"></div>
          
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{activeToast.title}</span>
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-600 animate-ping"></span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
              {activeToast.message}
            </p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  const course = courses.find(c => c.id === activeToast.courseId);
                  if (course) {
                    setSelectedCourse(course);
                    setActiveToast(null);
                  }
                }}
                className="py-1 px-3 bg-indigo-600 text-white font-bold text-[10px] rounded-lg hover:bg-indigo-700"
              >
                Track Class Now
              </button>
              <button
                onClick={() => setActiveToast(null)}
                className="py-1 px-2.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold text-[10px] rounded-lg hover:bg-slate-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFLINE NEW COURSE POPUP CREATION MODAL */}
      {showAddCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-scale-up">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                <span>Configure New Course Track</span>
              </h3>
              <button 
                onClick={() => setShowAddCourse(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCourseSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Course Code */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Course Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BT3001"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold font-mono"
                  />
                </div>

                {/* Theme Color selector */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Theme Color
                  </label>
                  <select
                    value={newColor}
                    onChange={e => setNewColor(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="emerald">Emerald Green</option>
                    <option value="indigo">Indigo Purple</option>
                    <option value="blue">Sapphire Blue</option>
                    <option value="purple">Orchid Violet</option>
                    <option value="orange">Sunset Orange</option>
                    <option value="pink">Blossom Pink</option>
                    <option value="cyan">Ocean Teal</option>
                    <option value="amber">Warm Amber</option>
                  </select>
                </div>
              </div>

              {/* Course Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biotechnology 101"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              {/* Classroom / Venue */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Venue / Classroom
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LHC-202"
                  value={newVenue}
                  onChange={e => setNewVenue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              {/* Professor Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Instructor / Professor Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Shashi"
                  value={newProfessor}
                  onChange={e => setNewProfessor(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              {/* Customizable criteria slider */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Target Criteria
                  </label>
                  <span className="text-xs font-black text-indigo-600 font-mono">
                    {newThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={newThreshold}
                  onChange={e => setNewThreshold(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold font-mono">
                  <span>50% (Low)</span>
                  <span>75% (Compulsory)</span>
                  <span>90% (Strict)</span>
                </div>
              </div>

              {addCourseError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl text-xs text-rose-500 font-bold flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>{addCourseError}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  Configure Track
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* COMPACT COURSE DETAIL MODAL WRAPPER */}
      {syncedSelectedCourse && (
        <CourseModal
          course={syncedSelectedCourse}
          records={records}
          slots={slots}
          setRecords={setRecords}
          setCourses={setCourses}
          setSlots={setSlots}
          onClose={() => setSelectedCourse(null)}
        />
      )}

      {/* FOOTER */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 text-center text-xs text-slate-400 dark:text-slate-500 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-1.5 font-semibold">
            <span>UniAttend Compliance Tool</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">100% Offline</span>
            <span>•</span>
            <span className="text-indigo-500 font-bold">No Internet Required</span>
          </div>
          <div>
            Design optimized for standard 50%, 75%, and 90% compulsory university regimes.
          </div>
        </div>
      </footer>

    </div>
  );
}
