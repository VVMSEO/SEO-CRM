import React from 'react';
import { Briefcase, CheckSquare, Clock, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { useCRMStore } from '../store';

export default function Dashboard({ store, onSelectProject }: { store: ReturnType<typeof useCRMStore>, onSelectProject: (id: string) => void }) {
  const activeProjects = store.projects.filter(p => p.status === 'active').length;
  const completedTasks = store.tasks.filter(t => t.status === 'done').length;
  const pendingTasks = store.tasks.filter(t => t.status !== 'done').length;

  const upcomingTasks = store.tasks
    .filter(t => t.status !== 'done' && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const stats = [
    { label: 'Всего проектов', value: store.projects.length, icon: Briefcase, color: 'bg-blue-500' },
    { label: 'Активных проектов', value: activeProjects, icon: TrendingUp, color: 'bg-indigo-500' },
    { label: 'Задач в ожидании', value: pendingTasks, icon: Clock, color: 'bg-amber-500' },
    { label: 'Выполнено задач', value: completedTasks, icon: CheckSquare, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Обзор</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className={`${stat.color} p-3 rounded-lg text-white`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Недавние проекты</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {store.projects.slice(0, 6).map(project => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    project.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    project.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status === 'active' ? 'Активен' : project.status === 'paused' ? 'Пауза' : 'Завершен'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{project.client}</p>
                <div className="flex items-center text-xs text-gray-400">
                  <span>{new Date(project.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
            Напоминания
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {upcomingTasks.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {upcomingTasks.map(task => {
                  const project = store.projects.find(p => p.id === task.projectId);
                  const isOverdue = new Date(task.dueDate!) < new Date(new Date().setHours(0,0,0,0));
                  return (
                    <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onSelectProject(task.projectId)}>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{task.title}</h4>
                        {isOverdue && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{project?.name}</p>
                      <div className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-indigo-600'}`}>
                        {isOverdue ? 'Просрочено: ' : 'Дедлайн: '}
                        {new Date(task.dueDate!).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                Нет предстоящих дедлайнов
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
