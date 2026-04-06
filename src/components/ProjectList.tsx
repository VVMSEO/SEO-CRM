import React, { useState } from 'react';
import { Plus, ExternalLink, MoreVertical, Trash2 } from 'lucide-react';
import { useCRMStore } from '../store';
import { Project } from '../types';
import Modal from './Modal';

export default function ProjectList({ store, onSelectProject }: { store: ReturnType<typeof useCRMStore>, onSelectProject: (id: string) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({ status: 'active' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.client) {
      store.addProject(formData as Omit<Project, 'id' | 'createdAt'>);
      setIsModalOpen(false);
      setFormData({ status: 'active' });
    }
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      store.deleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить проект
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
              <th className="p-4 font-medium">Название</th>
              <th className="p-4 font-medium">Клиент</th>
              <th className="p-4 font-medium">URL</th>
              <th className="p-4 font-medium">Статус</th>
              <th className="p-4 font-medium text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {store.projects.map(project => (
              <tr key={project.id} className="hover:bg-gray-50 transition-colors group">
                <td className="p-4">
                  <button onClick={() => onSelectProject(project.id)} className="font-medium text-gray-900 hover:text-indigo-600">
                    {project.name}
                  </button>
                </td>
                <td className="p-4 text-gray-600 text-sm">{project.client}</td>
                <td className="p-4 text-sm">
                  {project.url && (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center">
                      {project.url.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    project.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    project.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status === 'active' ? 'Активен' : project.status === 'paused' ? 'Пауза' : 'Завершен'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setProjectToDelete(project.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    title="Удалить проект"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {store.projects.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Нет проектов. Добавьте свой первый проект.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal title="Новый проект" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название проекта *</label>
            <input required type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Клиент *</label>
            <input required type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={formData.client || ''} onChange={e => setFormData({...formData, client: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL сайта</label>
            <input type="url" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="https://" value={formData.url || ''} onChange={e => setFormData({...formData, url: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
              <option value="active">Активен</option>
              <option value="paused">На паузе</option>
              <option value="completed">Завершен</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Отмена</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">Сохранить</button>
          </div>
        </form>
      </Modal>

      <Modal title="Удаление проекта" isOpen={!!projectToDelete} onClose={() => setProjectToDelete(null)}>
        <div className="space-y-4">
          <p className="text-gray-700">Вы уверены, что хотите удалить этот проект? Все связанные с ним задачи также будут безвозвратно удалены.</p>
          <div className="pt-4 flex justify-end space-x-3">
            <button onClick={() => setProjectToDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Отмена</button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Удалить</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
