import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Briefcase, Menu, X, Search, Clock, Bell, AlertCircle, CalendarDays } from 'lucide-react';
import { useCRMStore } from './store';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import TaskBoard from './components/TaskBoard';
import Reminders from './components/Reminders';
import WeeklyPlanner from './components/WeeklyPlanner';

function GlobalLiveTimer({ startTime, initialSeconds, estimatedMinutes, colorClass = "text-indigo-700 border-indigo-100" }: { startTime: number, initialSeconds: number, estimatedMinutes?: number, colorClass?: string }) {
  const [seconds, setSeconds] = useState(initialSeconds + Math.floor((Date.now() - startTime) / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(initialSeconds + Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, initialSeconds]);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const formatMinutes = (mins: number) => {
    const eh = Math.floor(mins / 60);
    const em = mins % 60;
    return eh > 0 ? (em > 0 ? `${eh}ч ${em}м` : `${eh}ч`) : `${em}м`;
  };

  return (
    <div className={`text-lg font-mono font-medium mb-3 text-center bg-white py-2 rounded-lg border ${colorClass}`}>
      {h > 0 ? `${h}ч ` : ''}{m}м {s}с
      {estimatedMinutes ? (
        <div className="text-xs text-gray-500 font-sans mt-1">
          План: {formatMinutes(estimatedMinutes)}
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const store = useCRMStore();
  const [currentView, setCurrentView] = useState<'dashboard' | 'projects' | 'reminders' | 'planner'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (store.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!store.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SEO CRM</h1>
          <p className="text-gray-500 mb-8">Войдите, чтобы продолжить работу с проектами и задачами</p>
          <button
            onClick={store.signIn}
            className="w-full bg-indigo-600 text-white font-medium py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Войти через Google
          </button>
        </div>
      </div>
    );
  }

  const navigateToProject = (id: string) => {
    setSelectedProjectId(id);
    setCurrentView('projects');
    setIsMobileMenuOpen(false);
  };

  const navigateToView = (view: 'dashboard' | 'projects' | 'reminders' | 'planner') => {
    setCurrentView(view);
    if (view !== 'projects') setSelectedProjectId(null);
    setIsMobileMenuOpen(false);
  };

  const activeTask = store.activeTimer ? store.tasks.find(t => t.id === store.activeTimer?.taskId) : null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = store.tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today).length;

  const renderNavLinks = () => (
    <>
      <button
        onClick={() => navigateToView('dashboard')}
        className={`flex items-center w-full px-4 py-3 rounded-xl mb-2 transition-colors ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
      >
        <LayoutDashboard className="w-5 h-5 mr-3" />
        Дашборд
      </button>
      <button
        onClick={() => navigateToView('projects')}
        className={`flex items-center w-full px-4 py-3 rounded-xl mb-2 transition-colors ${currentView === 'projects' && !selectedProjectId ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
      >
        <Briefcase className="w-5 h-5 mr-3" />
        Проекты
      </button>
      <button
        onClick={() => navigateToView('planner')}
        className={`flex items-center w-full px-4 py-3 rounded-xl mb-2 transition-colors ${currentView === 'planner' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
      >
        <CalendarDays className="w-5 h-5 mr-3" />
        Планирование
      </button>
      <button
        onClick={() => navigateToView('reminders')}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-colors ${currentView === 'reminders' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
      >
        <div className="flex items-center">
          <Bell className="w-5 h-5 mr-3" />
          Напоминания
        </div>
        {overdueCount > 0 && (
          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {overdueCount}
          </span>
        )}
      </button>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center text-indigo-600 font-bold text-xl tracking-tight">
            <Search className="w-6 h-6 mr-2" />
            SEO CRM
          </div>
          <button className="lg:hidden text-gray-500" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-4">
          {renderNavLinks()}
        </nav>
        
        {activeTask && (
          <div className="m-4 p-4 border border-indigo-100 rounded-xl bg-indigo-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Задача в работе
              </span>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            </div>
            <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-3" title={activeTask.title}>{activeTask.title}</p>
            <GlobalLiveTimer 
              startTime={store.activeTimer!.startTime} 
              initialSeconds={activeTask.actualTime || 0} 
              estimatedMinutes={activeTask.estimatedTime} 
            />
            <button onClick={() => store.toggleTimer(activeTask.id)} className="w-full py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-50 transition-colors">
              Остановить
            </button>
          </div>
        )}

        {store.activeProjectTimer && (
          <div className="m-4 mt-0 p-4 border border-amber-100 rounded-xl bg-amber-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Таймер проекта
              </span>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            </div>
            <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-3" title={store.projects.find(p => p.id === store.activeProjectTimer?.projectId)?.name}>
              {store.projects.find(p => p.id === store.activeProjectTimer?.projectId)?.name || 'Проект'}
            </p>
            <GlobalLiveTimer 
              startTime={store.activeProjectTimer.startTime} 
              initialSeconds={0} 
              colorClass="text-amber-700 border-amber-100"
            />
            <button onClick={() => store.toggleProjectTimer(store.activeProjectTimer!.projectId)} className="w-full py-1.5 bg-white border border-amber-200 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-50 transition-colors">
              Остановить
            </button>
          </div>
        )}

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center">
              {store.user?.photoURL ? (
                <img src={store.user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full mr-3" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mr-3">
                  {store.user?.displayName?.charAt(0) || 'A'}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{store.user?.displayName || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{store.user?.email}</p>
              </div>
            </div>
            <button onClick={store.logOut} className="text-gray-400 hover:text-red-600 transition-colors ml-2" title="Выйти">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between lg:hidden">
          <div className="flex items-center text-indigo-600 font-bold text-lg">
            <Search className="w-5 h-5 mr-2" />
            SEO CRM
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600 hover:text-gray-900">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Global Notification Banner */}
        {overdueCount > 0 && currentView !== 'reminders' && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center text-red-700 text-sm font-medium">
              <AlertCircle className="w-4 h-4 mr-2" />
              У вас есть просроченные задачи ({overdueCount})
            </div>
            <button onClick={() => navigateToView('reminders')} className="text-sm text-red-700 hover:text-red-800 underline font-medium">
              Посмотреть
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto h-full">
            {currentView === 'dashboard' && <Dashboard store={store} onSelectProject={navigateToProject} />}
            {currentView === 'projects' && !selectedProjectId && <ProjectList store={store} onSelectProject={navigateToProject} />}
            {currentView === 'projects' && selectedProjectId && <TaskBoard store={store} projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />}
            {currentView === 'reminders' && <Reminders store={store} onSelectProject={navigateToProject} />}
            {currentView === 'planner' && <WeeklyPlanner />}
          </div>
        </div>
      </main>
    </div>
  );
}
