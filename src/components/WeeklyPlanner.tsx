import React, { useState } from 'react';
import { Settings as SettingsIcon, Calendar, Clock, Edit2, Check, X, Plus, ListChecks } from 'lucide-react';
import { useCRMStore } from '../store';
import { Project } from '../types';
import Modal from './Modal';

export default function WeeklyPlanner() {
  const store = useCRMStore();
  const [activeTab, setActiveTab] = useState<'budgets' | 'schedule' | 'plan' | 'report'>('budgets');
  
  // Settings edit state
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(store.settings);

  // Project budget edit state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [tempProject, setTempProject] = useState<{ name: string, budget: string, overhead: string }>({ name: '', budget: '', overhead: '' });

  // Report modal state
  const [reportProjectId, setReportProjectId] = useState<string | null>(null);

  const handleSaveSettings = () => {
    store.setSettings(tempSettings);
    setIsEditingSettings(false);
  };

  const startEditingProject = (project: Project) => {
    setEditingProjectId(project.id);
    setTempProject({
      name: project.name,
      budget: project.budget?.toString() || '0',
      overhead: project.overhead?.toString() || '0'
    });
  };

  const saveProjectBudget = (project: Project) => {
    store.updateProject(project.id, {
      name: tempProject.name,
      budget: parseFloat(tempProject.budget) || 0,
      overhead: parseFloat(tempProject.overhead) || 0
    });
    setEditingProjectId(null);
  };

  const calculateWeeklyMinutes = (budget: number = 0, overhead: number = 0) => {
    const hoursPerMonth = budget / store.settings.hourlyRate;
    const netHoursPerMonth = Math.max(0, hoursPerMonth - overhead);
    const weeklyHours = netHoursPerMonth / store.settings.weeksPerMonth;
    return Math.round(weeklyHours * 60);
  };

  const formatMinutes = (totalMinutes: number) => {
    if (isNaN(totalMinutes) || totalMinutes < 0) return '0 ч 00 мин';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours} ч ${minutes.toString().padStart(2, '0')} мин`;
  };

  const daysOfWeek = [
    { id: 'monday', label: 'ПОНЕДЕЛЬНИК' },
    { id: 'tuesday', label: 'ВТОРНИК' },
    { id: 'wednesday', label: 'СРЕДА' },
    { id: 'thursday', label: 'ЧЕТВЕРГ' },
    { id: 'friday', label: 'ПЯТНИЦА' }
  ];

  const toggleProjectDay = (dayId: keyof typeof store.weeklySchedule, projectId: string) => {
    const currentDaySchedule = store.weeklySchedule[dayId];
    let newDaySchedule;
    if (currentDaySchedule.includes(projectId)) {
      newDaySchedule = currentDaySchedule.filter(id => id !== projectId);
    } else {
      newDaySchedule = [...currentDaySchedule, projectId];
    }
    store.setWeeklySchedule({
      ...store.weeklySchedule,
      [dayId]: newDaySchedule
    });
  };

  const getProjectDaysCount = (projectId: string) => {
    return daysOfWeek.reduce((count, day) => {
      return count + (store.weeklySchedule[day.id as keyof typeof store.weeklySchedule].includes(projectId) ? 1 : 0);
    }, 0);
  };

  const totalBudget = store.projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalOverhead = store.projects.reduce((sum, p) => sum + (p.overhead || 0), 0);
  const totalWeeklyMinutes = store.projects.reduce((sum, p) => sum + calculateWeeklyMinutes(p.budget, p.overhead), 0);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Планирование недели</h1>
        <p className="text-gray-500 mt-1">Бюджеты, расписание и отчеты</p>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('budgets')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'budgets' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Настройки и Бюджеты
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'schedule' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Расписание по дням
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'plan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          План на неделю
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'report' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Отчет клиентам
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-12">
        {activeTab === 'budgets' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <SettingsIcon className="w-5 h-5 mr-2 text-gray-500" />
                  Настройки
                </h2>
                {!isEditingSettings && (
                  <button onClick={() => setIsEditingSettings(true)} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center">
                    <Edit2 className="w-4 h-4 mr-1" /> Изменить
                  </button>
                )}
              </div>
              
              {isEditingSettings ? (
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ставка (руб/час)</label>
                    <input type="number" value={tempSettings.hourlyRate} onChange={e => setTempSettings({...tempSettings, hourlyRate: Number(e.target.value)})} className="w-full p-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Неделя (текст)</label>
                    <input type="text" value={tempSettings.currentWeek} onChange={e => setTempSettings({...tempSettings, currentWeek: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div className="flex items-end space-x-2">
                    <button onClick={handleSaveSettings} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex-1">Сохранить</button>
                    <button onClick={() => setIsEditingSettings(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300">Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Ставка (руб/час)</p>
                    <p className="text-lg font-medium text-gray-900">{store.settings.hourlyRate.toLocaleString('ru-RU')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Текущая неделя</p>
                    <p className="text-lg font-medium text-gray-900">{store.settings.currentWeek}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Бюджеты проектов</h2>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="p-4 font-medium border-b border-gray-200">Проект</th>
                    <th className="p-4 font-medium border-b border-gray-200">Бюджет (руб)</th>
                    <th className="p-4 font-medium border-b border-gray-200">Overhead (ч)</th>
                    <th className="p-4 font-medium border-b border-gray-200">Ч/нед</th>
                    <th className="p-4 font-medium border-b border-gray-200 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {store.projects.map(project => (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                      {editingProjectId === project.id ? (
                        <>
                          <td className="p-4">
                            <input type="text" value={tempProject.name} onChange={e => setTempProject({...tempProject, name: e.target.value})} className="w-full p-1 border border-gray-300 rounded" />
                          </td>
                          <td className="p-4">
                            <input type="number" value={tempProject.budget} onChange={e => setTempProject({...tempProject, budget: e.target.value})} className="w-full p-1 border border-gray-300 rounded" />
                          </td>
                          <td className="p-4">
                            <input type="number" step="0.1" value={tempProject.overhead} onChange={e => setTempProject({...tempProject, overhead: e.target.value})} className="w-full p-1 border border-gray-300 rounded" />
                          </td>
                          <td className="p-4 text-gray-500">
                            {formatMinutes(calculateWeeklyMinutes(parseFloat(tempProject.budget) || 0, parseFloat(tempProject.overhead) || 0))}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button onClick={() => saveProjectBudget(project)} className="text-green-600 hover:text-green-700 p-1"><Check className="w-5 h-5" /></button>
                              <button onClick={() => setEditingProjectId(null)} className="text-red-600 hover:text-red-700 p-1"><X className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 font-medium text-gray-900">{project.name}</td>
                          <td className="p-4 text-gray-700">{(project.budget || 0).toLocaleString('ru-RU')}</td>
                          <td className="p-4 text-gray-700">{project.overhead || 0}</td>
                          <td className="p-4 text-gray-900 font-medium">{formatMinutes(calculateWeeklyMinutes(project.budget, project.overhead))}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => startEditingProject(project)} className="text-gray-400 hover:text-indigo-600 p-1 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold text-gray-900">
                    <td className="p-4">ИТОГО</td>
                    <td className="p-4">{totalBudget.toLocaleString('ru-RU')}</td>
                    <td className="p-4">{totalOverhead}</td>
                    <td className="p-4">{formatMinutes(totalWeeklyMinutes)}</td>
                    <td className="p-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Расписание по дням</h2>
              <p className="text-sm text-gray-500 mb-6">Выберите проекты для каждого дня недели. Часы распределятся автоматически.</p>
              
              <div className="space-y-8">
                {daysOfWeek.map(day => {
                  const dayProjects = store.weeklySchedule[day.id as keyof typeof store.weeklySchedule];
                  
                  return (
                    <div key={day.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">{day.label}</h3>
                        <div className="text-sm text-gray-500">
                          {dayProjects.length} проектов
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {store.projects.map(project => {
                            const isSelected = dayProjects.includes(project.id);
                            return (
                              <button
                                key={project.id}
                                onClick={() => toggleProjectDay(day.id as keyof typeof store.weeklySchedule, project.id)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                                  isSelected 
                                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                                }`}
                              >
                                {project.name}
                              </button>
                            );
                          })}
                        </div>
                        
                        {dayProjects.length > 0 && (
                          <table className="w-full text-left text-sm mt-4">
                            <thead>
                              <tr className="text-gray-500 border-b border-gray-100">
                                <th className="pb-2 font-medium">Проект</th>
                                <th className="pb-2 font-medium text-right">Часы</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {dayProjects.map(projectId => {
                                const project = store.projects.find(p => p.id === projectId);
                                if (!project) return null;
                                const totalMins = calculateWeeklyMinutes(project.budget, project.overhead);
                                const daysCount = getProjectDaysCount(project.id);
                                const dailyMins = daysCount > 0 ? Math.round(totalMins / daysCount) : 0;
                                
                                return (
                                  <tr key={projectId}>
                                    <td className="py-2 text-gray-900">{project.name}</td>
                                    <td className="py-2 text-right font-medium text-indigo-600">{formatMinutes(dailyMins)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Расписание недели</h2>
                  <p className="text-sm text-gray-500">Неделя: {store.settings.currentWeek}</p>
                </div>
              </div>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="p-4 font-medium border-b border-gray-200">Проект</th>
                    <th className="p-4 font-medium border-b border-gray-200">Время</th>
                    <th className="p-4 font-medium border-b border-gray-200">Задача</th>
                    <th className="p-4 font-medium border-b border-gray-200">Статус</th>
                    <th className="p-4 font-medium border-b border-gray-200">Результат</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {daysOfWeek.map(day => {
                    const dayProjects = store.weeklySchedule[day.id as keyof typeof store.weeklySchedule];
                    if (dayProjects.length === 0) return null;
                    
                    return (
                      <React.Fragment key={day.id}>
                        <tr className="bg-indigo-50/50">
                          <td colSpan={5} className="p-4 font-semibold text-indigo-900">{day.label}</td>
                        </tr>
                        {dayProjects.map(projectId => {
                          const project = store.projects.find(p => p.id === projectId);
                          if (!project) return null;
                          const totalMins = calculateWeeklyMinutes(project.budget, project.overhead);
                          const daysCount = getProjectDaysCount(project.id);
                          const dailyMins = daysCount > 0 ? Math.round(totalMins / daysCount) : 0;
                          
                          // Find active tasks for this project
                          const projectTasks = store.tasks.filter(t => t.projectId === projectId && t.status !== 'done');
                          const taskName = projectTasks.length > 0 ? projectTasks[0].title : '';
                          const taskStatus = projectTasks.length > 0 ? (projectTasks[0].status === 'in-progress' ? 'В работе' : 'Не начата') : 'Не начата';
                          
                          return (
                            <tr key={`${day.id}-${projectId}`} className="hover:bg-gray-50">
                              <td className="p-4 font-medium text-gray-900">{project.name}</td>
                              <td className="p-4 text-gray-700">{formatMinutes(dailyMins)}</td>
                              <td className="p-4 text-gray-600">{taskName}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  taskStatus === 'В работе' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {taskStatus}
                                </span>
                              </td>
                              <td className="p-4 text-gray-600"></td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Отчет клиентам</h2>
              </div>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="p-4 font-medium border-b border-gray-200 w-1/4">Проект</th>
                    <th className="p-4 font-medium border-b border-gray-200 w-1/4">Что сделано</th>
                    <th className="p-4 font-medium border-b border-gray-200 w-1/4">Что дальше</th>
                    <th className="p-4 font-medium border-b border-gray-200 w-1/4">От клиента</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {store.projects.map(project => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-gray-900 mb-2">{project.name}</div>
                        <button 
                          onClick={() => setReportProjectId(project.id)}
                          className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <ListChecks className="w-3 h-3 mr-1" />
                          Выполненные задачи
                        </button>
                      </td>
                      <td className="p-4"><textarea className="w-full bg-transparent resize-y outline-none text-gray-700 min-h-[60px]" rows={2} placeholder="..."></textarea></td>
                      <td className="p-4"><textarea className="w-full bg-transparent resize-y outline-none text-gray-700 min-h-[60px]" rows={2} placeholder="..."></textarea></td>
                      <td className="p-4"><textarea className="w-full bg-transparent resize-y outline-none text-gray-700 min-h-[60px]" rows={2} placeholder="..."></textarea></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal 
        title={`Выполненные задачи: ${store.projects.find(p => p.id === reportProjectId)?.name || ''}`} 
        isOpen={!!reportProjectId} 
        onClose={() => setReportProjectId(null)}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {reportProjectId && (() => {
            const completedTasks = store.tasks
              .filter(t => t.projectId === reportProjectId && t.status === 'done')
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            if (completedTasks.length === 0) {
              return <p className="text-gray-500 text-center py-4">Нет выполненных задач.</p>;
            }

            return (
              <div className="divide-y divide-gray-100">
                {completedTasks.map(task => (
                  <div key={task.id} className="py-3">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Добавлена: {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            onClick={() => setReportProjectId(null)} 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </Modal>
    </div>
  );
}
