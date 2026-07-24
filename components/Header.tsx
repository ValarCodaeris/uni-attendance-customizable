import { useState } from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Bell, 
  Download, 
  Clock, 
  BookOpen, 
  Sparkles,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Course, TimetableSlot, AttendanceRecord, SimulationTime } from '../types';
import { getDayName } from '../utils/attendance';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  courses: Course[];
  setCourses: (c: Course[]) => void;
  slots: TimetableSlot[];
  setSlots: (s: TimetableSlot[]) => void;
  records: AttendanceRecord[];
  setRecords: (r: AttendanceRecord[]) => void;
  simTime: SimulationTime;
  setSimTime: (t: SimulationTime) => void;
  unreadCount: number;
  resetAllData: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  courses,
  setCourses,
  slots,
  setSlots,
  records,
  setRecords,
  simTime,
  setSimTime,
  unreadCount,
  resetAllData
}: HeaderProps) {
  const [showImportExport, setShowImportExport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Export state data to JSON file
  const exportData = () => {
    const dataStr = JSON.stringify({ courses, slots, records }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'uniattend_backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import JSON data
  const handleImport = () => {
    try {
      setImportError('');
      setImportSuccess(false);
      const parsed = JSON.parse(importText);
      
      if (!parsed.courses || !parsed.slots || !parsed.records) {
        setImportError('Invalid backup file format. Must contain courses, slots, and records.');
        return;
      }
      
      setCourses(parsed.courses);
      setSlots(parsed.slots);
      setRecords(parsed.records);
      setImportSuccess(true);
      setTimeout(() => {
        setShowImportExport(false);
        setImportSuccess(false);
        setImportText('');
      }, 1500);
    } catch (e) {
      setImportError('Failed to parse JSON. Please ensure the file contents are correct.');
    }
  };

  // Get current simulated date & day info
  const simulatedDateObj = new Date(simTime.simulatedDate + 'T' + simTime.simulatedTime);
  const simDayName = getDayName(simulatedDateObj.getDay());

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200 dark:shadow-none animate-pulse-slow">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                UniAttend
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-400 block -mt-1 uppercase tracking-widest">
                Offline Track
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
              { id: 'timetable', label: 'Timetable Grid', icon: Calendar },
              { id: 'logs', label: 'Attendance History', icon: Clock },
              { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800 animate-bounce">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            
            {/* Quick Time Travel Toggle Button */}
            <button
              onClick={() => setSimTime({ ...simTime, isSimulated: !simTime.isSimulated })}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                simTime.isSimulated
                  ? 'bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-700/60 shadow-inner'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title="Toggle Time Travel Simulation Mode"
            >
              <Clock className={`w-3.5 h-3.5 ${simTime.isSimulated ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {simTime.isSimulated ? 'Time Traveling' : 'Real-Time'}
              </span>
            </button>

            {/* Back Up / Restore Button */}
            <button
              onClick={() => {
                setImportText('');
                setImportError('');
                setShowImportExport(true);
              }}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Backup or Restore Timetable/Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Info help modal trigger */}
            <button
              onClick={() => setShowInfo(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Help & Info"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION BAR (shows only on smaller screens) */}
      <div className="md:hidden flex justify-around border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 py-2 px-1">
        {[
          { id: 'dashboard', label: 'Home', icon: BookOpen },
          { id: 'timetable', label: 'Grid', icon: Calendar },
          { id: 'logs', label: 'History', icon: Clock },
          { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg text-xs font-semibold relative ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5" />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SIMULATION TIMER CONTROL DASHBOARD BAR (Expands if isSimulated is active) */}
      {simTime.isSimulated && (
        <div className="bg-amber-500/10 dark:bg-amber-950/20 border-b border-amber-500/20 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-400">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
              <span className="font-bold">Simulation Mode Active:</span>
              <span className="bg-amber-500/20 px-2 py-0.5 rounded-full font-mono text-amber-900 dark:text-amber-300">
                {simDayName}, {simTime.simulatedDate} at {simTime.simulatedTime}
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
              <div className="flex items-center space-x-1">
                <label className="font-semibold mr-1">Date:</label>
                <input
                  type="date"
                  value={simTime.simulatedDate}
                  onChange={e => setSimTime({ ...simTime, simulatedDate: e.target.value })}
                  className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/50 rounded px-1.5 py-0.5 text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="flex items-center space-x-1">
                <label className="font-semibold mr-1">Time:</label>
                <input
                  type="time"
                  value={simTime.simulatedTime}
                  onChange={e => setSimTime({ ...simTime, simulatedTime: e.target.value })}
                  className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/50 rounded px-1.5 py-0.5 text-slate-800 dark:text-slate-100 font-medium font-mono"
                />
              </div>

              <button
                onClick={() => {
                  // Jump simulated clock by 5 minutes
                  const [h, m] = simTime.simulatedTime.split(':').map(Number);
                  const totalMinutes = h * 60 + m + 5;
                  const nextH = Math.floor(totalMinutes / 60) % 24;
                  const nextM = totalMinutes % 60;
                  const paddedH = String(nextH).padStart(2, '0');
                  const paddedM = String(nextM).padStart(2, '0');
                  setSimTime({ ...simTime, simulatedTime: `${paddedH}:${paddedM}` });
                }}
                className="bg-amber-500 text-white font-bold px-2 py-1 rounded hover:bg-amber-600 active:scale-95 transition-all shadow-sm"
                title="Simulate passing of 5 minutes"
              >
                +5 Mins
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT / EXPORT BACKUP MODAL */}
      {showImportExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-indigo-500" />
                <span>Backup & Restore System</span>
              </h3>
              <button 
                onClick={() => setShowImportExport(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                UniAttend is completely offline and private! Your data never leaves your browser. You can export your timetable & logs as a JSON file, or restore it below.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={exportData}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 dark:shadow-none transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export JSON Backup
                </button>
                
                <button
                  onClick={resetAllData}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 text-sm font-semibold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-all border border-rose-100 dark:border-rose-900/50"
                >
                  Reset to Mock Data
                </button>
              </div>

              <div className="relative border-t border-slate-100 dark:border-slate-700 pt-4 mt-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Paste Backup JSON content to Import
                </label>
                <textarea
                  rows={5}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder='{"courses": [...], "slots": [...], "records": [...]}'
                  className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>

                {importError && (
                  <div className="text-xs text-rose-500 font-semibold mt-2">
                    ⚠️ {importError}
                  </div>
                )}
                {importSuccess && (
                  <div className="text-xs text-emerald-500 font-semibold mt-2">
                    ✓ Data restored successfully!
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowImportExport(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-4 py-2 text-sm bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 font-bold transition-all"
              >
                Import Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP INFO MODAL */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span>How UniAttend Works</span>
              </h3>
              <button 
                onClick={() => setShowInfo(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-sm text-slate-600 dark:text-slate-300 overflow-y-auto max-h-[70vh]">
              <div>
                <h4 className="font-bold text-slate-950 dark:text-white text-base mb-1">📅 Offline Timetable Grid</h4>
                <p>Click on any schedule slot in the weekly grid to open its card, or click "Add Slot" to customize your timetable. You can fully adjust code names, venues, and instructor details offline!</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-950 dark:text-white text-base mb-1">🔔 10-Minute Prior Alerts</h4>
                <p>The app schedules timers. When a class is starting in exactly 10 minutes, the app will fire a local push notification and record it in the app's internal notification history so you never miss a class!</p>
                <div className="mt-1.5 p-2 bg-amber-500/10 border border-amber-200 rounded text-amber-800 dark:text-amber-400 text-xs">
                  <strong>Testing tip:</strong> Turn on <strong>Time Travel</strong> in the header and jump to 10 minutes prior to any slot (e.g., if you have a class at 09:00 AM, travel to 08:50 AM) to see notifications fire instantly!
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-950 dark:text-white text-base mb-1">✅ Three Attendance States</h4>
                <ul className="list-disc list-inside space-y-1 ml-1 mt-1">
                  <li><strong className="text-emerald-500">Attended</strong>: Counts towards your attended classes & total held.</li>
                  <li><strong className="text-rose-500">Absent</strong>: Missed class. Decreases your attendance percentage.</li>
                  <li><strong className="text-indigo-500">Cancelled / Holiday</strong>: Excluded from calculations completely. Perfect for sudden cancellations!</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-950 dark:text-white text-base mb-1">🎨 Custom Threshold Color Coding</h4>
                <p>You requested custom criteria (e.g. 50%, 75%, 90%). In UniAttend, you can set custom thresholds per class. The status box colors will react dynamically:</p>
                <ul className="list-disc list-inside space-y-1 ml-1 mt-1">
                  <li><span className="text-emerald-600 dark:text-emerald-400 font-semibold">Green:</span> Attendance is at or above your course threshold (e.g. 75%).</li>
                  <li><span className="text-amber-600 dark:text-amber-400 font-semibold">Yellow:</span> Attendance is in warning territory (within 10% below threshold).</li>
                  <li><span className="text-rose-600 dark:text-rose-400 font-semibold">Red:</span> Attendance is critically low (more than 10% below threshold).</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowInfo(false)}
                className="px-6 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all"
              >
                Let's Go!
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
