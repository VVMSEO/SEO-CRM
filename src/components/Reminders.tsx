import React from 'react';
import { Calendar, AlertCircle, Clock, ArrowRight, Bell } from 'lucide-react';
import { useCRMStore } from '../store';

export default function Reminders({ store, onSelectProject }: { store: ReturnType<typeof useCRMStore>, onSelectProject: (id: string) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasksWithDeadlines = store.tasks
    .filter(t => t.status !== 'done' && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const overdueTasks = tasksWithDeadlines.filter(t => new Date(t.dueDate!) < today);
  const todayTasks = tasksWithDeadlines.filter(t => new Date(t.dueDate!).getTime() === today.getTime());
  const upcomingTasks = tasksWithDeadlines.filter(t => new Date(t.dueDate!) > today);

  const TaskCard: React.FC<{ task: any, type: 'overdue' | 'today' | 'upcoming' }> = ({ task, type }) => {
    const project = store.projects.find(p => p.id === task.projectId);
    
    const colors = {
      overdue: 'border-red-200 bg-red-50',
      today: 'border-amber-200 bg-amber-50',
      upcoming: 'border-blue-200 bg-blue-50'
    };

    const textColors = {
      overdue: 'text-red-700',
      today: 'text-amber-700',
      upcoming: 'text-blue-700'
    };

    return (
      <div 
        onClick={() => onSelectProject(task.projectId)}
        className={`p-4 rounded-xl border ${colors[type]} cursor-pointer hover:shadow-md transition-all group`}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className={`font-semibold ${textColors[type]} group-hover:underline`}>{task.title}</h3>
          <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/60 ${textColors[type]}`}>
            {new Date(task.dueDate!).toLocaleDateString('ru-RU')}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-3 flex items-center">
          <span className="font-medium mr-2">Проект:</span> {project?.name || 'Неизвестный проект'}
        </p>
        {task.reminderDate && (
          <div className="flex items-center text-xs text-amber-600 mb-3 bg-amber-100 w-fit px-2 py-1 rounded-md">
            <Bell className="w-3 h-3 mr-1" />
            Напоминание: {new Date(task.reminderDate).toLocaleString('ru-RU', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {task.estimatedTime ? `${task.estimatedTime} мин. план` : 'Время не задано'}
          </span>
          <ArrowRight className={`w-4 h-4 ${textColors[type]} opacity-0 group-hover:opacity-100 transition-opacity`} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-indigo-600" />
          Напоминания и Дедлайны
        </h1>
        <p className="text-gray-500 mt-1">Управление сроками выполнения задач</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Просроченные */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
            Просрочено ({overdueTasks.length})
          </h2>
          <div className="space-y-3">
            {overdueTasks.length > 0 ? (
              overdueTasks.map(task => <TaskCard key={task.id} task={task} type="overdue" />)
            ) : (
              <p className="text-sm text-gray-500 italic">Нет просроченных задач</p>
            )}
          </div>
        </div>

        {/* На сегодня */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-amber-500" />
            На сегодня ({todayTasks.length})
          </h2>
          <div className="space-y-3">
            {todayTasks.length > 0 ? (
              todayTasks.map(task => <TaskCard key={task.id} task={task} type="today" />)
            ) : (
              <p className="text-sm text-gray-500 italic">На сегодня задач нет</p>
            )}
          </div>
        </div>

        {/* Предстоящие */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" />
            Предстоящие ({upcomingTasks.length})
          </h2>
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map(task => <TaskCard key={task.id} task={task} type="upcoming" />)
            ) : (
              <p className="text-sm text-gray-500 italic">Нет предстоящих задач</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}