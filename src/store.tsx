import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, Task, DiaryEntry, MeetingProtocol, ProjectTimeLog, Settings, WeeklySchedule } from './types';
import { db, auth } from './firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, writeBatch, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';

interface CRMContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  
  projects: Project[];
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  tasks: Task[];
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addTaskComment: (taskId: string, text: string) => void;

  diaryEntries: DiaryEntry[];
  addDiaryEntry: (e: Omit<DiaryEntry, 'id' | 'createdAt'>) => void;
  updateDiaryEntry: (id: string, content: string) => void;
  deleteDiaryEntry: (id: string) => void;

  meetingProtocols: MeetingProtocol[];
  addMeetingProtocol: (p: Omit<MeetingProtocol, 'id' | 'createdAt'>) => void;
  updateMeetingProtocol: (id: string, updates: Partial<MeetingProtocol>) => void;
  deleteMeetingProtocol: (id: string) => void;

  projectTimeLogs: ProjectTimeLog[];
  addProjectTimeLog: (l: Omit<ProjectTimeLog, 'id' | 'createdAt'>) => void;
  updateProjectTimeLog: (id: string, updates: Partial<ProjectTimeLog>) => void;
  deleteProjectTimeLog: (id: string) => void;

  activeTimer: {taskId: string, startTime: number} | null;
  toggleTimer: (taskId: string) => void;

  activeProjectTimer: {projectId: string, startTime: number} | null;
  toggleProjectTimer: (projectId: string) => void;

  settings: Settings;
  setSettings: (s: Settings) => void;

  weeklySchedule: WeeklySchedule;
  setWeeklySchedule: (s: WeeklySchedule) => void;
}

const CRMContext = createContext<CRMContextType | null>(null);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [meetingProtocols, setMeetingProtocols] = useState<MeetingProtocol[]>([]);
  const [projectTimeLogs, setProjectTimeLogs] = useState<ProjectTimeLog[]>([]);
  
  const [activeTimer, setActiveTimer] = useState<{taskId: string, startTime: number} | null>(null);
  const [activeProjectTimer, setActiveProjectTimer] = useState<{projectId: string, startTime: number} | null>(null);
  
  const [settings, setSettingsState] = useState<Settings>({ hourlyRate: 1720, weeksPerMonth: 4.33, currentWeek: '23.03 — 29.03' });
  const [weeklySchedule, setWeeklyScheduleState] = useState<WeeklySchedule>({ monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await migrateLocalDataToFirestore(currentUser.uid);
      } else {
        setProjects([]);
        setTasks([]);
        setDiaryEntries([]);
        setMeetingProtocols([]);
        setProjectTimeLogs([]);
        setActiveTimer(null);
        setActiveProjectTimer(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const migrateLocalDataToFirestore = async (userId: string) => {
    const migrated = localStorage.getItem('seo-crm-migrated');
    if (migrated === 'true') return;

    try {
      const batch = writeBatch(db);
      
      const localProjects = JSON.parse(localStorage.getItem('seo-crm-projects') || '[]');
      localProjects.forEach((p: any) => {
        batch.set(doc(db, `users/${userId}/projects/${p.id}`), p);
      });

      const localTasks = JSON.parse(localStorage.getItem('seo-crm-tasks') || '[]');
      localTasks.forEach((t: any) => {
        batch.set(doc(db, `users/${userId}/tasks/${t.id}`), t);
      });

      const localDiary = JSON.parse(localStorage.getItem('seo-crm-diary') || '[]');
      localDiary.forEach((d: any) => {
        batch.set(doc(db, `users/${userId}/diaryEntries/${d.id}`), d);
      });

      const localMeetings = JSON.parse(localStorage.getItem('seo-crm-meetings') || '[]');
      localMeetings.forEach((m: any) => {
        batch.set(doc(db, `users/${userId}/meetingProtocols/${m.id}`), m);
      });

      const localTimeLogs = JSON.parse(localStorage.getItem('seo-crm-time-logs') || '[]');
      localTimeLogs.forEach((l: any) => {
        batch.set(doc(db, `users/${userId}/projectTimeLogs/${l.id}`), l);
      });

      const localSettings = JSON.parse(localStorage.getItem('seo-crm-settings') || 'null');
      if (localSettings) {
        batch.set(doc(db, `users/${userId}/settings/default`), localSettings);
      }

      const localSchedule = JSON.parse(localStorage.getItem('seo-crm-weekly-schedule') || 'null');
      if (localSchedule) {
        batch.set(doc(db, `users/${userId}/weeklySchedule/default`), localSchedule);
      }

      const localTimer = JSON.parse(localStorage.getItem('seo-crm-timer') || 'null');
      if (localTimer) {
        batch.set(doc(db, `users/${userId}/timers/activeTimer`), localTimer);
      }

      const localProjectTimer = JSON.parse(localStorage.getItem('seo-crm-project-timer') || 'null');
      if (localProjectTimer) {
        batch.set(doc(db, `users/${userId}/timers/activeProjectTimer`), localProjectTimer);
      }

      await batch.commit();
      localStorage.setItem('seo-crm-migrated', 'true');
    } catch (e) {
      console.error("Migration failed", e);
    }
  };

  useEffect(() => {
    if (!user) return;

    const unsubProjects = onSnapshot(collection(db, `users/${user.uid}/projects`), (snap) => {
      setProjects(snap.docs.map(d => d.data() as Project));
    });
    const unsubTasks = onSnapshot(collection(db, `users/${user.uid}/tasks`), (snap) => {
      setTasks(snap.docs.map(d => d.data() as Task));
    });
    const unsubDiary = onSnapshot(collection(db, `users/${user.uid}/diaryEntries`), (snap) => {
      setDiaryEntries(snap.docs.map(d => d.data() as DiaryEntry));
    });
    const unsubMeetings = onSnapshot(collection(db, `users/${user.uid}/meetingProtocols`), (snap) => {
      setMeetingProtocols(snap.docs.map(d => d.data() as MeetingProtocol));
    });
    const unsubTimeLogs = onSnapshot(collection(db, `users/${user.uid}/projectTimeLogs`), (snap) => {
      setProjectTimeLogs(snap.docs.map(d => d.data() as ProjectTimeLog));
    });
    
    const unsubSettings = onSnapshot(doc(db, `users/${user.uid}/settings/default`), (docSnap) => {
      if (docSnap.exists()) setSettingsState(docSnap.data() as Settings);
    });
    const unsubSchedule = onSnapshot(doc(db, `users/${user.uid}/weeklySchedule/default`), (docSnap) => {
      if (docSnap.exists()) setWeeklyScheduleState(docSnap.data() as WeeklySchedule);
    });
    const unsubTimer = onSnapshot(doc(db, `users/${user.uid}/timers/activeTimer`), (docSnap) => {
      if (docSnap.exists()) setActiveTimer(docSnap.data() as {taskId: string, startTime: number});
      else setActiveTimer(null);
    });
    const unsubProjectTimer = onSnapshot(doc(db, `users/${user.uid}/timers/activeProjectTimer`), (docSnap) => {
      if (docSnap.exists()) setActiveProjectTimer(docSnap.data() as {projectId: string, startTime: number});
      else setActiveProjectTimer(null);
    });

    return () => {
      unsubProjects(); unsubTasks(); unsubDiary(); unsubMeetings(); unsubTimeLogs();
      unsubSettings(); unsubSchedule(); unsubTimer(); unsubProjectTimer();
    };
  }, [user]);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    if (!user) return;
    const id = Math.random().toString(36).substring(2, 9);
    const newProject = { ...project, id, createdAt: new Date().toISOString() };
    setDoc(doc(db, `users/${user.uid}/projects/${id}`), newProject);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    if (!user) return;
    updateDoc(doc(db, `users/${user.uid}/projects/${id}`), updates);
  };

  const deleteProject = (id: string) => {
    if (!user) return;
    deleteDoc(doc(db, `users/${user.uid}/projects/${id}`));
    tasks.filter(t => t.projectId === id).forEach(t => {
      deleteDoc(doc(db, `users/${user.uid}/tasks/${t.id}`));
    });
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) return;
    const id = Math.random().toString(36).substring(2, 9);
    const newTask = { ...task, id, createdAt: new Date().toISOString() };
    setDoc(doc(db, `users/${user.uid}/tasks/${id}`), newTask);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    if (!user) return;
    updateDoc(doc(db, `users/${user.uid}/tasks/${id}`), updates);
  };

  const addTaskComment = (taskId: string, text: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newComment = {
        id: Math.random().toString(36).substring(2, 9),
        text,
        createdAt: new Date().toISOString()
      };
      updateDoc(doc(db, `users/${user.uid}/tasks/${taskId}`), {
        comments: [...(task.comments || []), newComment]
      });
    }
  };

  const deleteTask = (id: string) => {
    if (!user) return;
    deleteDoc(doc(db, `users/${user.uid}/tasks/${id}`));
    if (activeTimer?.taskId === id) {
      deleteDoc(doc(db, `users/${user.uid}/timers/activeTimer`));
    }
  };

  const addDiaryEntry = (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => {
    if (!user) return;
    const id = Math.random().toString(36).substring(2, 9);
    const newEntry = { ...entry, id, createdAt: new Date().toISOString() };
    setDoc(doc(db, `users/${user.uid}/diaryEntries/${id}`), newEntry);
  };

  const updateDiaryEntry = (id: string, content: string) => {
    if (!user) return;
    updateDoc(doc(db, `users/${user.uid}/diaryEntries/${id}`), { content });
  };

  const deleteDiaryEntry = (id: string) => {
    if (!user) return;
    deleteDoc(doc(db, `users/${user.uid}/diaryEntries/${id}`));
  };

  const addMeetingProtocol = (protocol: Omit<MeetingProtocol, 'id' | 'createdAt'>) => {
    if (!user) return;
    const id = Math.random().toString(36).substring(2, 9);
    const newProtocol = { ...protocol, id, createdAt: new Date().toISOString() };
    setDoc(doc(db, `users/${user.uid}/meetingProtocols/${id}`), newProtocol);
  };

  const updateMeetingProtocol = (id: string, updates: Partial<MeetingProtocol>) => {
    if (!user) return;
    updateDoc(doc(db, `users/${user.uid}/meetingProtocols/${id}`), updates);
  };

  const deleteMeetingProtocol = (id: string) => {
    if (!user) return;
    deleteDoc(doc(db, `users/${user.uid}/meetingProtocols/${id}`));
  };

  const addProjectTimeLog = (log: Omit<ProjectTimeLog, 'id' | 'createdAt'>) => {
    if (!user) return;
    const id = Math.random().toString(36).substring(2, 9);
    const newLog = { ...log, id, createdAt: new Date().toISOString() };
    setDoc(doc(db, `users/${user.uid}/projectTimeLogs/${id}`), newLog);
  };

  const updateProjectTimeLog = (id: string, updates: Partial<ProjectTimeLog>) => {
    if (!user) return;
    updateDoc(doc(db, `users/${user.uid}/projectTimeLogs/${id}`), updates);
  };

  const deleteProjectTimeLog = (id: string) => {
    if (!user) return;
    deleteDoc(doc(db, `users/${user.uid}/projectTimeLogs/${id}`));
  };

  const toggleTimer = (taskId: string) => {
    if (!user) return;
    if (activeTimer) {
      const elapsedSeconds = Math.floor((Date.now() - activeTimer.startTime) / 1000);
      const task = tasks.find(t => t.id === activeTimer.taskId);
      if (task) {
        updateDoc(doc(db, `users/${user.uid}/tasks/${task.id}`), {
          actualTime: (task.actualTime || 0) + elapsedSeconds
        });
      }
      if (activeTimer.taskId === taskId) {
        deleteDoc(doc(db, `users/${user.uid}/timers/activeTimer`));
        return;
      }
    }
    setDoc(doc(db, `users/${user.uid}/timers/activeTimer`), { taskId, startTime: Date.now() });
  };

  const toggleProjectTimer = (projectId: string) => {
    if (!user) return;
    if (activeProjectTimer) {
      const elapsedSeconds = Math.floor((Date.now() - activeProjectTimer.startTime) / 1000);
      if (elapsedSeconds > 0) {
        const id = Math.random().toString(36).substring(2, 9);
        const newLog = {
          id,
          projectId: activeProjectTimer.projectId,
          date: new Date().toISOString().split('T')[0],
          duration: elapsedSeconds,
          description: 'Рабочая сессия',
          createdAt: new Date().toISOString()
        };
        setDoc(doc(db, `users/${user.uid}/projectTimeLogs/${id}`), newLog);
      }
      if (activeProjectTimer.projectId === projectId) {
        deleteDoc(doc(db, `users/${user.uid}/timers/activeProjectTimer`));
        return;
      }
    }
    setDoc(doc(db, `users/${user.uid}/timers/activeProjectTimer`), { projectId, startTime: Date.now() });
  };

  const setSettings = (s: Settings) => {
    if (!user) return;
    setDoc(doc(db, `users/${user.uid}/settings/default`), s);
  };

  const setWeeklySchedule = (s: WeeklySchedule) => {
    if (!user) return;
    setDoc(doc(db, `users/${user.uid}/weeklySchedule/default`), s);
  };

  return (
    <CRMContext.Provider value={{
      user, loading, signIn, logOut,
      projects, addProject, updateProject, deleteProject,
      tasks, addTask, updateTask, deleteTask, addTaskComment,
      diaryEntries, addDiaryEntry, updateDiaryEntry, deleteDiaryEntry,
      meetingProtocols, addMeetingProtocol, updateMeetingProtocol, deleteMeetingProtocol,
      projectTimeLogs, addProjectTimeLog, updateProjectTimeLog, deleteProjectTimeLog,
      activeTimer, toggleTimer,
      activeProjectTimer, toggleProjectTimer,
      settings, setSettings,
      weeklySchedule, setWeeklySchedule
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRMStore() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRMStore must be used within a CRMProvider');
  }
  return context;
}
