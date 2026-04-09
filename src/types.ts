export type ProjectStatus = 'active' | 'paused' | 'completed';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  name: string;
  client: string;
  url: string;
  status: ProjectStatus;
  createdAt: string;
  budget?: number;
  overhead?: number;
}

export interface Settings {
  hourlyRate: number;
  weeksPerMonth: number;
  currentWeek: string;
}

export interface WeeklySchedule {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
}

export interface ProjectTimeLog {
  id: string;
  projectId: string;
  date: string;
  duration: number; // in seconds
  description: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  projectId: string;
  date: string;
  content: string;
  createdAt: string;
}

export interface MeetingTask {
  id: string;
  description: string;
  assignee: 'SEO' | 'Разработчик' | 'Клиент';
  deadline: string;
  status: 'Открыто' | 'В работе' | 'Готово';
}

export interface MeetingProtocol {
  id: string;
  projectId: string;
  date: string;
  participants: string;
  format: 'Zoom' | 'Телефон' | 'Личная встреча';
  recordingUrl?: string;
  
  clientConcerns: string;
  clientProgress: string;
  clientQuestions: string;

  doneSinceLastMeeting: string;
  notDoneAndWhy: string;
  barriers: string;

  tasks: MeetingTask[];

  nextMeetingDate: string;
  nextMeetingTime: string;
  nextMeetingUrl: string;
  nextPeriodFocus: string;

  createdAt: string;
}

export interface TaskComment {
  id: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  dueDate?: string;
  reminderDate?: string;
  estimatedTime?: number; // in minutes
  actualTime?: number; // in seconds
  comments?: TaskComment[];
}
