import React, { useState } from 'react';
import { Plus, Trash2, Calendar, FileText, Users, Video, Edit2, CheckCircle, Circle, MessageSquare, AlertCircle, ArrowRight, ListTodo, Play } from 'lucide-react';
import { useCRMStore } from '../store';
import { MeetingProtocol, MeetingTask } from '../types';
import Modal from './Modal';

export default function MeetingProtocols({ store, projectId }: { store: ReturnType<typeof useCRMStore>, projectId: string }) {
  const protocols = store.meetingProtocols
    .filter(p => p.projectId === projectId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<MeetingProtocol | null>(null);
  const [protocolToDelete, setProtocolToDelete] = useState<string | null>(null);

  const defaultProtocol: Partial<MeetingProtocol> = {
    projectId,
    date: new Date().toISOString().split('T')[0],
    format: 'Zoom',
    participants: '',
    recordingUrl: '',
    clientConcerns: '',
    clientProgress: '',
    clientQuestions: '',
    doneSinceLastMeeting: '',
    notDoneAndWhy: '',
    barriers: '',
    tasks: [],
    nextMeetingDate: '',
    nextMeetingTime: '',
    nextMeetingUrl: '',
    nextPeriodFocus: ''
  };

  const [formData, setFormData] = useState<Partial<MeetingProtocol>>(defaultProtocol);

  const openNewModal = () => {
    setEditingProtocol(null);
    setFormData(defaultProtocol);
    setIsModalOpen(true);
  };

  const openEditModal = (protocol: MeetingProtocol) => {
    setEditingProtocol(protocol);
    setFormData(protocol);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.date && formData.participants) {
      if (editingProtocol) {
        store.updateMeetingProtocol(editingProtocol.id, formData);
      } else {
        store.addMeetingProtocol(formData as Omit<MeetingProtocol, 'id' | 'createdAt'>);
      }
      setIsModalOpen(false);
    }
  };

  const confirmDelete = () => {
    if (protocolToDelete) {
      store.deleteMeetingProtocol(protocolToDelete);
      setProtocolToDelete(null);
    }
  };

  const addTask = () => {
    setFormData({
      ...formData,
      tasks: [...(formData.tasks || []), {
        id: Math.random().toString(36).substring(2, 9),
        description: '',
        assignee: 'SEO',
        deadline: '',
        status: 'Открыто'
      }]
    });
  };

  const updateTask = (taskId: string, updates: Partial<MeetingTask>) => {
    setFormData({
      ...formData,
      tasks: formData.tasks?.map(t => t.id === taskId ? { ...t, ...updates } : t)
    });
  };

  const removeTask = (taskId: string) => {
    setFormData({
      ...formData,
      tasks: formData.tasks?.filter(t => t.id !== taskId)
    });
  };

  const copyToClipboard = (protocol: MeetingProtocol) => {
    const tasksText = protocol.tasks.map((t, i) => `${i + 1}. ${t.description} — ${t.assignee} — срок ${t.deadline ? new Date(t.deadline).toLocaleDateString('ru-RU') : 'не указан'}`).join('\n');
    
    const text = `Добрый день. Фиксирую итоги нашего созвона от ${new Date(protocol.date).toLocaleDateString('ru-RU')}:

Договорились:
${tasksText || 'Нет новых задач'}

Следующий созвон: ${protocol.nextMeetingDate ? new Date(protocol.nextMeetingDate).toLocaleDateString('ru-RU') : 'дата не определена'}${protocol.nextMeetingTime ? `, ${protocol.nextMeetingTime}` : ''}. ${protocol.nextMeetingUrl ? 'Ссылку пришлю за день до встречи.' : ''}

Если что-то упустил — напишите, дополню.`;

    navigator.clipboard.writeText(text);
    alert('Шаблон сообщения скопирован в буфер обмена!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm flex-1 mr-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Зачем нужен протокол?</p>
              <p>Если клиент через месяц скажет «мы же договорились по-другому» — вы открываете протокол и показываете, что было зафиксировано. Это страховка и инструмент доверия. Заполняйте прямо во время разговора.</p>
            </div>
          </div>
        </div>
        <button
          onClick={openNewModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Новый протокол
        </button>
      </div>

      <div className="space-y-4">
        {protocols.length > 0 ? (
          protocols.map(protocol => (
            <div key={protocol.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-indigo-600 font-medium">
                    <Calendar className="w-5 h-5 mr-2" />
                    {new Date(protocol.date).toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Users className="w-4 h-4 mr-1.5" />
                    {protocol.participants}
                  </div>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Video className="w-4 h-4 mr-1.5" />
                    {protocol.format}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(protocol)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center text-sm font-medium"
                    title="Скопировать шаблон для отправки клиенту"
                  >
                    <MessageSquare className="w-4 h-4 mr-1.5" />
                    Шаблон клиенту
                  </button>
                  <button
                    onClick={() => openEditModal(protocol)}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setProtocolToDelete(protocol.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                      Текущая ситуация
                    </h3>
                    <div className="space-y-3 pl-6 border-l-2 border-indigo-100">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Что беспокоит клиента</span>
                        <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{protocol.clientConcerns || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Что видит как прогресс</span>
                        <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{protocol.clientProgress || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Вопросы к нам</span>
                        <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{protocol.clientQuestions || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                      Обсуждение результатов
                    </h3>
                    <div className="space-y-3 pl-6 border-l-2 border-emerald-100">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Что сделано</span>
                        <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{protocol.doneSinceLastMeeting || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Что не сделано и почему</span>
                        <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{protocol.notDoneAndWhy || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Барьеры</span>
                        <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{protocol.barriers || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
                      <ListTodo className="w-4 h-4 mr-2 text-amber-500" />
                      Зафиксированные договорённости
                    </h3>
                    {protocol.tasks && protocol.tasks.length > 0 ? (
                      <div className="space-y-3">
                        {protocol.tasks.map((task, idx) => (
                          <div key={task.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-start">
                              <div className="mt-0.5 mr-2">
                                {task.status === 'Готово' ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : task.status === 'В работе' ? (
                                  <Play className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{task.description}</p>
                                <div className="flex items-center mt-2 space-x-3 text-xs">
                                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                                    task.assignee === 'SEO' ? 'bg-indigo-100 text-indigo-700' :
                                    task.assignee === 'Разработчик' ? 'bg-blue-100 text-blue-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {task.assignee}
                                  </span>
                                  {task.deadline && (
                                    <span className="text-gray-500 flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(task.deadline).toLocaleDateString('ru-RU')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Договорённости не зафиксированы</p>
                    )}
                  </div>

                  <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center">
                      <ArrowRight className="w-4 h-4 mr-2 text-indigo-500" />
                      Следующий шаг
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="w-24 text-indigo-700/70">Дата и время:</span>
                        <span className="font-medium text-indigo-900">
                          {protocol.nextMeetingDate ? new Date(protocol.nextMeetingDate).toLocaleDateString('ru-RU') : '—'}
                          {protocol.nextMeetingTime ? ` в ${protocol.nextMeetingTime}` : ''}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-indigo-700/70">Фокус:</span>
                        <span className="font-medium text-indigo-900">{protocol.nextPeriodFocus || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 text-center text-gray-500">
            <Video className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет протоколов созвонов</h3>
            <p className="max-w-md mx-auto">Фиксируйте итоги встреч с клиентом, чтобы избежать недопониманий и всегда иметь под рукой историю договорённостей.</p>
            <button
              onClick={openNewModal}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Создать первый протокол
            </button>
          </div>
        )}
      </div>

      <Modal title={editingProtocol ? "Редактировать протокол" : "Новый протокол созвона"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-2 pb-4">
          {/* Шапка */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Шапка</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
                <input required type="date" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Формат</label>
                <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.format} onChange={e => setFormData({...formData, format: e.target.value as any})}>
                  <option value="Zoom">Zoom</option>
                  <option value="Телефон">Телефон</option>
                  <option value="Личная встреча">Личная встреча</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Участники (ты + клиент) *</label>
                <input required type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Иван (SEO), Анна (Директор)" value={formData.participants || ''} onChange={e => setFormData({...formData, participants: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на запись (если есть)</label>
              <input type="url" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://zoom.us/..." value={formData.recordingUrl || ''} onChange={e => setFormData({...formData, recordingUrl: e.target.value})} />
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Текущая ситуация */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Текущая ситуация <span className="text-sm font-normal text-gray-500">(со слов клиента)</span></h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Что беспокоит клиента</label>
                <textarea rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={formData.clientConcerns || ''} onChange={e => setFormData({...formData, clientConcerns: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Что клиент видит как прогресс</label>
                <textarea rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={formData.clientProgress || ''} onChange={e => setFormData({...formData, clientProgress: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Вопросы клиента к тебе</label>
                <textarea rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={formData.clientQuestions || ''} onChange={e => setFormData({...formData, clientQuestions: e.target.value})} />
              </div>
            </section>

            {/* Обсуждение результатов */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Обсуждение результатов</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Что сделано с прошлого созвона</label>
                <textarea rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={formData.doneSinceLastMeeting || ''} onChange={e => setFormData({...formData, doneSinceLastMeeting: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Что не сделано и почему</label>
                <textarea rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={formData.notDoneAndWhy || ''} onChange={e => setFormData({...formData, notDoneAndWhy: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Барьеры которые обсуждали</label>
                <textarea rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={formData.barriers || ''} onChange={e => setFormData({...formData, barriers: e.target.value})} />
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Зафиксированные договорённости */}
            <section className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-semibold">Зафиксированные договорённости</h3>
                <button type="button" onClick={addTask} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                  <Plus className="w-4 h-4 mr-1" /> Добавить задачу
                </button>
              </div>
              <div className="space-y-4">
                {formData.tasks?.map((task, index) => (
                  <div key={task.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
                    <button type="button" onClick={() => removeTask(task.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="space-y-3 pr-6">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Что сделать (Задача {index + 1})</label>
                        <input type="text" className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" value={task.description} onChange={e => updateTask(task.id, { description: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Кто делает</label>
                          <select className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" value={task.assignee} onChange={e => updateTask(task.id, { assignee: e.target.value as any })}>
                            <option value="SEO">SEO</option>
                            <option value="Разработчик">Разработчик</option>
                            <option value="Клиент">Клиент</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Дедлайн</label>
                          <input type="date" className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" value={task.deadline} onChange={e => updateTask(task.id, { deadline: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Статус</label>
                          <select className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" value={task.status} onChange={e => updateTask(task.id, { status: e.target.value as any })}>
                            <option value="Открыто">Открыто</option>
                            <option value="В работе">В работе</option>
                            <option value="Готово">Готово</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!formData.tasks || formData.tasks.length === 0) && (
                  <p className="text-sm text-gray-500 italic text-center py-2">Нет задач. Добавьте договорённости.</p>
                )}
              </div>
            </section>

            {/* Следующий созвон и план */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Следующий созвон и план</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата следующего созвона</label>
                  <input type="date" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.nextMeetingDate || ''} onChange={e => setFormData({...formData, nextMeetingDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Время</label>
                  <input type="time" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.nextMeetingTime || ''} onChange={e => setFormData({...formData, nextMeetingTime: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на созвон</label>
                <input type="url" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." value={formData.nextMeetingUrl || ''} onChange={e => setFormData({...formData, nextMeetingUrl: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Главный фокус на следующий период</label>
                <textarea rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={formData.nextPeriodFocus || ''} onChange={e => setFormData({...formData, nextPeriodFocus: e.target.value})} />
              </div>
            </section>
          </div>

          <div className="pt-6 flex justify-end space-x-3 sticky bottom-0 bg-white border-t mt-4 py-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Отмена</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">Сохранить протокол</button>
          </div>
        </form>
      </Modal>

      <Modal title="Удаление протокола" isOpen={!!protocolToDelete} onClose={() => setProtocolToDelete(null)}>
        <div className="space-y-4">
          <p className="text-gray-700">Вы уверены, что хотите удалить этот протокол созвона?</p>
          <div className="pt-4 flex justify-end space-x-3">
            <button onClick={() => setProtocolToDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Отмена</button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Удалить</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
