import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Play, Square, Clock, Calendar, Edit2, Download, BookOpen, ListTodo, Bell, Video, MessageSquare, Send, AlertCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCRMStore } from '../store';
import { Task, TaskStatus, TaskPriority, DiaryEntry, ProjectTimeLog } from '../types';
import Modal from './Modal';
import MeetingProtocols from './MeetingProtocols';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'К выполнению', color: 'bg-slate-100 text-slate-700' },
  { id: 'in-progress', title: 'В работе', color: 'bg-blue-100 text-blue-700' },
  { id: 'review', title: 'На проверке', color: 'bg-amber-100 text-amber-700' },
  { id: 'done', title: 'Готово', color: 'bg-emerald-100 text-emerald-700' }
];

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-red-100 text-red-700'
};

const PRIORITY_LABELS = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий'
};

const formatSeconds = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}ч ${m}м` : `${m}м`;
};

const formatMinutes = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}ч ${m}м` : `${h}ч`) : `${m}м`;
};

function LiveTimer({ startTime, initialSeconds }: { startTime: number, initialSeconds: number }) {
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
  return <span>{h > 0 ? `${h}ч ` : ''}{m}м {s}с</span>;
}

export default function TaskList({ store, projectId, onBack }: { store: ReturnType<typeof useCRMStore>, projectId: string, onBack: () => void }) {
  const project = store.projects.find(p => p.id === projectId);
  const projectTasks = store.tasks
    .filter(t => t.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [activeTab, setActiveTab] = useState<'tasks' | 'diary' | 'protocols' | 'time'>('tasks');
  const [selectedTaskId, setSelectedTaskId] = useState<string | 'new' | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForComments, setTaskForComments] = useState<Task | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [formData, setFormData] = useState<Partial<Task>>({ status: 'todo', priority: 'medium' });
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (taskForComments) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [taskForComments?.comments]);

  if (!project) return null;

  const openNewTaskModal = () => {
    setEditingTask(null);
    setFormData({ status: 'todo', priority: 'medium', projectId });
    setSelectedTaskId('new');
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setFormData(task);
    setSelectedTaskId(task.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title) {
      if (editingTask) {
        store.updateTask(editingTask.id, formData);
      } else {
        store.addTask(formData as Omit<Task, 'id' | 'createdAt'>);
      }
      setSelectedTaskId(null);
    }
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      store.deleteTask(taskToDelete);
      setTaskToDelete(null);
    }
  };

  const exportToExcel = () => {
    const data = projectTasks.map(task => ({
      'Название': task.title,
      'Описание': task.description || '',
      'Статус': COLUMNS.find(c => c.id === task.status)?.title || task.status,
      'Приоритет': PRIORITY_LABELS[task.priority],
      'Создана': new Date(task.createdAt).toLocaleDateString('ru-RU'),
      'Дедлайн': task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru-RU') : '',
      'План. время (м)': task.estimatedTime || '',
      'Факт. время (ч)': task.actualTime ? (task.actualTime / 3600).toFixed(2) : '',
      'Ключевые слова': task.keywords || '',
      'Целевой URL': task.targetUrl || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Задачи");
    XLSX.writeFile(wb, `Задачи_${project.name.replace(/\s+/g, '_')}.xlsx`);
  };

  const projectDiary = store.diaryEntries
    .filter(e => e.projectId === projectId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [newDiaryContent, setNewDiaryContent] = useState('');
  const [newDiaryDate, setNewDiaryDate] = useState(new Date().toISOString().split('T')[0]);

  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [newLogDuration, setNewLogDuration] = useState('');
  const [newLogDescription, setNewLogDescription] = useState('');
  const [editingLog, setEditingLog] = useState<ProjectTimeLog | null>(null);

  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!store.activeTimer) return;
    
    const interval = setInterval(() => {
      const task = store.tasks.find(t => t.id === store.activeTimer!.taskId);
      if (task && task.estimatedTime) {
        const elapsed = Math.floor((Date.now() - store.activeTimer.startTime) / 1000);
        const totalSeconds = (task.actualTime || 0) + elapsed;
        const estimatedSeconds = task.estimatedTime * 60;
        
        if (totalSeconds > estimatedSeconds && !notifiedTasks.has(task.id)) {
          setToastMessage(`Внимание: Время по задаче "${task.title}" превысило план!`);
          setNotifiedTasks(prev => new Set(prev).add(task.id));
          setTimeout(() => setToastMessage(null), 8000);
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [store.activeTimer, store.tasks, notifiedTasks]);

  const handleAddDiaryEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDiaryContent.trim()) {
      store.addDiaryEntry({
        projectId,
        date: newDiaryDate,
        content: newDiaryContent.trim()
      });
      setNewDiaryContent('');
    }
  };

  const handleAddTimeLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLogDuration && newLogDescription.trim()) {
      store.addProjectTimeLog({
        projectId,
        date: newLogDate,
        duration: Math.round(parseFloat(newLogDuration) * 3600),
        description: newLogDescription.trim()
      });
      setNewLogDuration('');
      setNewLogDescription('');
    }
  };

  const projectLogs = store.projectTimeLogs?.filter(l => l.projectId === projectId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
  const isProjectTimerActive = store.activeProjectTimer?.projectId === projectId;

  return (
    <div className="flex flex-col h-full space-y-6 relative">
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-up">
          <AlertCircle className="w-5 h-5 mr-2" />
          {toastMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500">Управление проектом</p>
          </div>
        </div>
        {activeTab === 'tasks' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToExcel}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </button>
            <button
              onClick={openNewTaskModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить задачу
            </button>
          </div>
        )}
      </div>

      <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tasks' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <ListTodo className="w-4 h-4 mr-2" />
          Список задач
        </button>
        <button
          onClick={() => setActiveTab('diary')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'diary' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Дневник проекта
        </button>
        <button
          onClick={() => setActiveTab('protocols')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'protocols' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <Video className="w-4 h-4 mr-2" />
          Протоколы созвонов
        </button>
        <button
          onClick={() => setActiveTab('time')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'time' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <Clock className="w-4 h-4 mr-2" />
          Учет времени
        </button>
      </div>

      {activeTab === 'tasks' ? (
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          <div className={`flex-1 w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${selectedTaskId ? 'hidden xl:block' : 'block'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                    <th className="p-3 font-medium w-1/3 min-w-[200px]">Название</th>
                    <th className={`p-3 font-medium ${selectedTaskId ? 'hidden' : 'hidden md:table-cell'}`}>Создана</th>
                    <th className="p-3 font-medium whitespace-nowrap">Статус</th>
                    <th className={`p-3 font-medium ${selectedTaskId ? 'hidden' : 'hidden sm:table-cell'}`}>Приоритет</th>
                    <th className="p-3 font-medium whitespace-nowrap">Дедлайн</th>
                    <th className={`p-3 font-medium ${selectedTaskId ? 'hidden' : 'hidden lg:table-cell'}`}>Время (Ф/П)</th>
                    <th className="p-3 font-medium text-right whitespace-nowrap">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projectTasks.map(task => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0)) && task.status !== 'done';
                    const isActiveTimer = store.activeTimer?.taskId === task.id;

                    return (
                      <tr key={task.id} className={`hover:bg-gray-50 transition-colors group ${selectedTaskId === task.id ? 'bg-indigo-50/50' : ''}`}>
                        <td className="p-3">
                          <div className="font-medium text-gray-900 mb-1 cursor-pointer hover:text-indigo-600" onClick={() => openEditTaskModal(task)}>{task.title}</div>
                          {task.description && <div className="text-xs text-gray-500 line-clamp-1">{task.description}</div>}
                        </td>
                        <td className={`p-3 text-sm text-gray-500 ${selectedTaskId ? 'hidden' : 'hidden md:table-cell'}`}>
                          {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <select 
                            className={`text-xs font-medium px-2 py-1 rounded-full border-none outline-none cursor-pointer appearance-none ${COLUMNS.find(c => c.id === task.status)?.color}`}
                            value={task.status}
                            onChange={(e) => store.updateTask(task.id, { status: e.target.value as TaskStatus })}
                          >
                            {COLUMNS.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </td>
                        <td className={`p-3 ${selectedTaskId ? 'hidden' : 'hidden sm:table-cell'}`}>
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {task.dueDate ? (
                            <div className={`flex items-center text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              <Calendar className="w-4 h-4 mr-1.5 flex-shrink-0" />
                              <span className="whitespace-nowrap">{new Date(task.dueDate).toLocaleDateString('ru-RU')}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                          {task.reminderDate && (
                            <div className="flex items-center text-xs text-amber-600 mt-1 whitespace-nowrap" title="Напоминание">
                              <Bell className="w-3 h-3 mr-1 flex-shrink-0" />
                              {new Date(task.reminderDate).toLocaleString('ru-RU', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </td>
                        <td className={`p-3 ${selectedTaskId ? 'hidden' : 'hidden lg:table-cell'}`}>
                          <div className="flex items-center text-sm text-gray-600 whitespace-nowrap">
                            <Clock className={`w-4 h-4 mr-1.5 flex-shrink-0 ${isActiveTimer ? 'text-indigo-600' : ''}`} />
                            <span className={isActiveTimer ? 'text-indigo-600 font-medium' : ''}>
                              {isActiveTimer
                                ? <LiveTimer startTime={store.activeTimer!.startTime} initialSeconds={task.actualTime || 0} />
                                : (task.actualTime ? formatSeconds(task.actualTime) : '0м')}
                            </span>
                            {task.estimatedTime ? (
                              <>
                                <span className="mx-1 text-gray-400">/</span>
                                <span className="text-gray-500">{formatMinutes(task.estimatedTime)}</span>
                              </>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                            <button
                              onClick={() => store.toggleTimer(task.id)}
                              className={`p-1.5 rounded-full transition-colors ${isActiveTimer ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                              title={isActiveTimer ? "Остановить таймер" : "Запустить таймер"}
                            >
                              {isActiveTimer ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                            </button>
                            <button
                              onClick={() => setTaskForComments(task)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors relative"
                              title="Комментарии"
                            >
                              <MessageSquare className="w-4 h-4" />
                              {task.comments && task.comments.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center">
                                  {task.comments.length}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => openEditTaskModal(task)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="Редактировать"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTaskToDelete(task.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {projectTasks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        В этом проекте пока нет задач.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedTaskId && (
            <div className="w-full xl:w-[450px] 2xl:w-[500px] flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col sticky top-6">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedTaskId === 'new' ? 'Новая задача' : 'Редактировать задачу'}
                </h2>
                <button onClick={() => setSelectedTaskId(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[calc(100vh-200px)]">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                    <input required type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                    <textarea rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                      <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as TaskStatus})}>
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                      <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}>
                        <option value="low">Низкий</option>
                        <option value="medium">Средний</option>
                        <option value="high">Высокий</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Дедлайн</label>
                      <input type="date" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Напоминание</label>
                      <input type="datetime-local" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.reminderDate || ''} onChange={e => setFormData({...formData, reminderDate: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">План. время (минут)</label>
                      <input type="number" min="0" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Например: 30" value={formData.estimatedTime || ''} onChange={e => setFormData({...formData, estimatedTime: e.target.value ? parseInt(e.target.value) : undefined})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Факт. время (часов)</label>
                      <input type="number" step="0.1" min="0" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Например: 1.5" value={formData.actualTime !== undefined ? Number((formData.actualTime / 3600).toFixed(2)) : ''} onChange={e => setFormData({...formData, actualTime: e.target.value ? Math.round(parseFloat(e.target.value) * 3600) : 0})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ключевые слова</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="через запятую" value={formData.keywords || ''} onChange={e => setFormData({...formData, keywords: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Целевой URL</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="/category/slony" value={formData.targetUrl || ''} onChange={e => setFormData({...formData, targetUrl: e.target.value})} />
                  </div>
                  <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={() => setSelectedTaskId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Отмена</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">Сохранить</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'diary' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Новая запись</h2>
            <form onSubmit={handleAddDiaryEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                <input 
                  type="date" 
                  required 
                  className="w-48 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={newDiaryDate} 
                  onChange={e => setNewDiaryDate(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Заметка</label>
                <textarea 
                  required 
                  rows={4} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[100px]" 
                  placeholder="Что было сделано сегодня? Какие результаты?"
                  value={newDiaryContent} 
                  onChange={e => setNewDiaryContent(e.target.value)} 
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Добавить запись
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">История проекта</h2>
            {projectDiary.length > 0 ? (
              <div className="space-y-4">
                {projectDiary.map(entry => (
                  <div key={entry.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 relative group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center text-indigo-600 font-medium">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(entry.date).toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <button 
                        onClick={() => store.deleteDiaryEntry(entry.id)}
                        className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Удалить запись"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 border-dashed p-8 text-center text-gray-500">
                В дневнике пока нет записей. Добавьте первую заметку выше.
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'protocols' ? (
        <MeetingProtocols store={store} projectId={projectId} />
      ) : activeTab === 'time' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Таймер проекта</h2>
              <p className="text-sm text-gray-500">Замеряйте время работы над проектом в целом</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-3xl font-mono font-medium text-gray-700 w-48 text-right">
                {isProjectTimerActive ? (
                  <LiveTimer startTime={store.activeProjectTimer!.startTime} initialSeconds={0} />
                ) : (
                  "0ч 0м 0с"
                )}
              </div>
              <button
                onClick={() => store.toggleProjectTimer(projectId)}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-colors shadow-sm ${
                  isProjectTimerActive 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isProjectTimerActive ? (
                  <><Square className="w-5 h-5 mr-2 fill-current" /> Остановить</>
                ) : (
                  <><Play className="w-5 h-5 mr-2 fill-current" /> Начать работу</>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Добавить время вручную</h2>
            <form onSubmit={handleAddTimeLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={newLogDate} 
                    onChange={e => setNewLogDate(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Затрачено времени (часов)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    required 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="Например: 1.5"
                    value={newLogDuration} 
                    onChange={e => setNewLogDuration(e.target.value)} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание работ</label>
                <textarea 
                  required 
                  rows={2} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[80px]" 
                  placeholder="Что было сделано по проекту в целом?"
                  value={newLogDescription} 
                  onChange={e => setNewLogDescription(e.target.value)} 
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Добавить запись
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">История учета времени</h2>
            {projectLogs.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                      <th className="p-4 font-medium w-1/6">Дата</th>
                      <th className="p-4 font-medium w-1/6">Время (ч)</th>
                      <th className="p-4 font-medium w-3/6">Описание</th>
                      <th className="p-4 font-medium text-right w-1/6">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projectLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-4 text-sm text-gray-900">
                          {new Date(log.date).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="p-4 text-sm font-medium text-indigo-600">
                          {(log.duration / 3600).toFixed(2)} ч
                        </td>
                        <td className="p-4 text-sm text-gray-700">
                          {log.description}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditingLog(log)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="Редактировать запись"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => store.deleteProjectTimeLog(log.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                              title="Удалить запись"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 border-dashed p-8 text-center text-gray-500">
                Записей учета времени пока нет.
              </div>
            )}
          </div>
        </div>
      ) : null}


      <Modal title="Удаление задачи" isOpen={!!taskToDelete} onClose={() => setTaskToDelete(null)}>
        <div className="space-y-4">
          <p className="text-gray-700">Вы уверены, что хотите удалить эту задачу?</p>
          <div className="pt-4 flex justify-end space-x-3">
            <button onClick={() => setTaskToDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Отмена</button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Удалить</button>
          </div>
        </div>
      </Modal>

      <Modal title="Редактировать запись времени" isOpen={!!editingLog} onClose={() => setEditingLog(null)}>
        {editingLog && (
          <form onSubmit={(e) => {
            e.preventDefault();
            store.updateProjectTimeLog(editingLog.id, {
              date: editingLog.date,
              duration: editingLog.duration,
              description: editingLog.description
            });
            setEditingLog(null);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                <input 
                  type="date" 
                  required 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={editingLog.date} 
                  onChange={e => setEditingLog({...editingLog, date: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Затрачено времени (часов)</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  required 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={Number((editingLog.duration / 3600).toFixed(2))} 
                  onChange={e => setEditingLog({...editingLog, duration: Math.round(parseFloat(e.target.value) * 3600)})} 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание работ</label>
              <textarea 
                required 
                rows={3} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[80px]" 
                value={editingLog.description} 
                onChange={e => setEditingLog({...editingLog, description: e.target.value})} 
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setEditingLog(null)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Отмена</button>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Сохранить
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal title={`Комментарии: ${taskForComments?.title}`} isOpen={!!taskForComments} onClose={() => setTaskForComments(null)}>
        <div className="flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            {taskForComments?.comments && taskForComments.comments.length > 0 ? (
              taskForComments.comments.map(comment => (
                <div key={comment.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <div className="text-gray-800 whitespace-pre-wrap text-sm">{comment.text}</div>
                  <div className="text-[10px] text-gray-400 mt-2 text-right">
                    {new Date(comment.createdAt).toLocaleString('ru-RU', { 
                      year: 'numeric', month: 'long', day: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Нет комментариев. Напишите первый!
              </div>
            )}
            <div ref={commentsEndRef} />
          </div>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (newCommentText.trim() && taskForComments) {
                store.addTaskComment(taskForComments.id, newCommentText.trim());
                setNewCommentText('');
                // Update local state to reflect new comment immediately
                setTaskForComments(prev => {
                  if (!prev) return prev;
                  const newComment = {
                    id: Math.random().toString(),
                    text: newCommentText.trim(),
                    createdAt: new Date().toISOString()
                  };
                  return { ...prev, comments: [...(prev.comments || []), newComment] };
                });
              }
            }}
            className="flex items-end space-x-2"
          >
            <div className="flex-1">
              <textarea
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                placeholder="Написать комментарий..."
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }
                }}
              />
            </div>
            <button 
              type="submit" 
              disabled={!newCommentText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-3 rounded-lg transition-colors flex-shrink-0 mb-1"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}