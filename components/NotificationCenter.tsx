import { 
  Bell, 
  Trash2, 
  CheckSquare, 
  Check, 
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { NotificationLog, Course } from '../types';

interface NotificationCenterProps {
  notifications: NotificationLog[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationLog[]>>;
  courses: Course[];
  onCourseClick: (course: Course) => void;
}

export default function NotificationCenter({
  notifications,
  setNotifications,
  courses,
  onCourseClick
}: NotificationCenterProps) {
  
  // Request system notification permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support system push notifications. Enjoy in-app notifications!');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('✓ Awesome! System notifications are now active. We will alert you 10 minutes prior to your classes!');
      
      // Fire a test notification
      new Notification('UniAttend System Alert', {
        body: 'System notifications are linked and running perfectly! Keep tracking!',
        icon: '/favicon.ico'
      });
    } else {
      alert('❌ Notification permission denied. Please grant permission in browser settings to receive local system notifications.');
    }
  };

  // Mark a single notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Delete a notification log
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Clear all notifications
  const clearAll = () => {
    if (confirm('Clear notification ledger history?')) {
      setNotifications([]);
    }
  };

  // Check if system notifications are granted
  const hasBrowserPermission = 'Notification' in window && Notification.permission === 'granted';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Bell className="w-6 h-6 text-indigo-500" />
            <span>Automated Alerts History</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A list of class warnings sent exactly 10 minutes before your lectures. Keep compliant easily!
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-1.5 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
              
              <button
                onClick={clearAll}
                className="flex items-center space-x-1.5 py-2 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 dark:border-rose-950/20 dark:text-rose-400 dark:border-rose-900/50 rounded-xl text-xs font-bold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* SYSTEM PERMISSIONS CARD CARD */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        <div className="col-span-1 md:col-span-2 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </span>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
              Local System Push Notifications
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
            UniAttend triggers standard HTML5 Web Notifications in your browser. This works completely local and offline without any server, database, or subscription! Ensure your permission is active.
          </p>
        </div>

        <div className="col-span-1 flex flex-col justify-center items-end">
          {hasBrowserPermission ? (
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/25 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-900/40">
              <CheckSquare className="w-4 h-4" />
              <span>Permission Active ✓</span>
            </div>
          ) : (
            <button
              onClick={requestPermission}
              className="w-full md:w-auto py-2.5 px-5 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
            >
              Enable Browser Alerts
            </button>
          )}
        </div>

      </div>

      {/* NOTIFICATION FEED LIST */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-100 dark:border-slate-800">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No alerts fired yet</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              When a class is starting in exactly 10 minutes (real-time or in time travel simulation!), an alert will pop up and be logged here.
            </p>
            <div className="mt-4 p-2 bg-amber-500/10 border border-amber-200 text-amber-800 dark:text-amber-400 rounded-lg text-xs inline-block max-w-md">
              <span className="font-bold flex items-center justify-center gap-1">
                <Info className="w-3.5 h-3.5" /> Fast Test Advice:
              </span>
              Activate <strong>Time Travel</strong> in the header and change your simulated clock to 10 minutes prior to a class (e.g. if you have a class at 09:00 AM, travel to 08:50 AM) to trigger alerts instantly!
            </div>
          </div>
        ) : (
          notifications.map(n => {
            const course = n.courseId ? courses.find(c => c.id === n.courseId) : null;
            const formattedDate = new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div 
                key={n.id}
                className={`bg-white dark:bg-slate-800 p-4 rounded-2xl border flex items-center justify-between shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-700 ${
                  n.read 
                    ? 'border-slate-100 dark:border-slate-700/80 opacity-75' 
                    : 'border-indigo-200 dark:border-indigo-900/50 ring-1 ring-indigo-50 dark:ring-indigo-950/20'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 mr-4">
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    n.read 
                      ? 'bg-slate-50 dark:bg-slate-900 text-slate-400' 
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {n.read ? <Bell className="w-4 h-4" /> : <Sparkles className="w-4 h-4 animate-bounce" />}
                  </div>

                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs font-extrabold ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block font-mono">
                      Received at {formattedDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {course && (
                    <button
                      onClick={() => onCourseClick(course)}
                      className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 rounded-lg"
                    >
                      Show Course Track
                    </button>
                  )}

                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                      title="Mark as read"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    title="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
