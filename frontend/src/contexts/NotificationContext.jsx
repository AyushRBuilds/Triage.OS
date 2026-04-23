import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../api/supabaseClient';
import { useAuth } from './AuthContext';
import { toast } from '../components/Toast';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState({
    criticalAlerts: true,
    statMeds: true,
    shiftSwaps: true,
    soapNotes: false,
  });

  const pendingCriticalRef = useRef(new Map());
  const criticalTimerRef = useRef(null);

  // Load preferences from DB on mount/user change
  useEffect(() => {
    async function loadPrefs() {
      if (!user?.email) return;
      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.email)
          .single();
        if (data) {
          setPreferences({
            criticalAlerts: data.critical_alerts ?? true,
            statMeds: data.stat_meds ?? true,
            shiftSwaps: data.shift_swaps ?? true,
            soapNotes: data.soap_notes ?? false,
          });
        }
      } catch (err) {
        console.warn('Could not load user preferences:', err.message);
      }
    }
    loadPrefs();
  }, [user]);

  const isPatientAssignedToUser = (patient) => {
    if (!patient) return false;
    if (user.role === 'admin' || user.role === 'doctor') return true;
    if (user.role === 'nurse') {
      if (patient.assigned_nurse_id === user.id) return true;
      if (patient.patient_assignments?.some(a => a.nurse_id === user.id)) return true;
    }
    return false;
  };

  // Real-time subscriptions for clinical alerts
  useEffect(() => {
    if (!user) return;

    // 1. Subscribe to vitals changes for critical alerts
    const vitalsChannel = supabase
      .channel('vitals-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vitals' }, async (payload) => {
        if (!preferences.criticalAlerts) return;
        
        const vital = payload.new;
        if (!vital) return;

        // Threshold check
        const isCritical = vital.spo2 < 90 || vital.heart_rate > 140 || vital.heart_rate < 40 || vital.temperature > 39 || vital.temperature < 35;
        
        if (isCritical) {
          const { data: p } = await supabase
            .from('patients')
            .select('name, assigned_nurse_id, patient_assignments(nurse_id)')
            .eq('id', vital.patient_id)
            .single();
            
          if (!isPatientAssignedToUser(p)) return;

          const patientName = p?.name || 'Unknown Patient';
          
          // Batching Toasts & Notifications
          pendingCriticalRef.current.set(vital.patient_id, { name: patientName, id: vital.patient_id });
          if (!criticalTimerRef.current) {
            criticalTimerRef.current = setTimeout(() => {
              const patients = Array.from(pendingCriticalRef.current.values());
              
              if (patients.length === 1) {
                const text = `CRITICAL: ${patients[0].name} - Unstable vitals detected`;
                toast.error(text, { duration: 8000 });
                setNotifications(prev => [{
                  id: `v-${patients[0].id}-${Date.now()}`,
                  type: 'critical',
                  text: text,
                  time: 'Just now',
                  link: `/patients?patient=${patients[0].id}`
                }, ...prev]);
                
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('triage.os - Critical Alert', { body: text });
                }
              } else if (patients.length > 1) {
                const text = `CRITICAL: Unstable vitals in ${patients.length} patients`;
                toast.error(text, { duration: 8000 });
                setNotifications(prev => [{
                  id: `v-batch-${Date.now()}`,
                  type: 'critical',
                  text: text,
                  time: 'Just now',
                  link: `/patients` // general link since multiple patients
                }, ...prev]);
                
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('triage.os - Critical Alert', { body: text });
                }
              }
              
              pendingCriticalRef.current.clear();
              criticalTimerRef.current = null;
            }, 2500); // Increased window to 2.5s to ensure loop finishes
          }
        }
      })
      .subscribe();

    // 2. Subscribe to medications for STAT meds
    const medsChannel = supabase
      .channel('meds-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'medications' }, async (payload) => {
        if (!preferences.statMeds) return;
        
        const med = payload.new;
        if (med.urgency === 'STAT') {
          const { data: p } = await supabase
            .from('patients')
            .select('name, assigned_nurse_id, patient_assignments(nurse_id)')
            .eq('id', med.patient_id)
            .single();
            
          if (!isPatientAssignedToUser(p)) return;
          const patientName = p?.name || 'Unknown Patient';

          const newNotif = {
            id: `m-${Date.now()}`,
            type: 'stat',
            text: `STAT MED: ${med.name} due for ${patientName}`,
            time: 'Just now',
            link: `/patients?patient=${med.patient_id}`
          };
          setNotifications(prev => [newNotif, ...prev]);
          toast.warning(newNotif.text, { duration: 6000 });
        }
      })
      .subscribe();

    // 3. Subscribe to shift swaps
    const swapChannel = supabase
      .channel('swap-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shift_swap_requests' }, async (payload) => {
        if (!preferences.shiftSwaps) return;
        
        const swap = payload.new;
        // Only notify if user is NOT the requestor (they already know)
        if (swap.requestor_id !== user.id) {
          const newNotif = {
            id: `s-${Date.now()}`,
            type: 'info',
            text: `Shift Swap: New request received for your ward.`,
            time: 'Just now',
            link: '/shift-swap'
          };
          setNotifications(prev => [newNotif, ...prev]);
          toast.info(newNotif.text);
        }
      })
      .subscribe();

    // 4. Subscribe to SOAP notes
    const soapChannel = supabase
      .channel('soap-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'soap_notes' }, async (payload) => {
        if (!preferences.soapNotes) return;
        
        const note = payload.new;
        if (note.urgency_level === 'Critical' || note.urgency_level === 'Stat') {
          const { data: p } = await supabase
            .from('patients')
            .select('name, assigned_nurse_id, patient_assignments(nurse_id)')
            .eq('id', note.patient_id)
            .single();
            
          if (!isPatientAssignedToUser(p)) return;
          const patientName = p?.name || 'Unknown Patient';
          
          const newNotif = {
            id: `soap-${Date.now()}`,
            type: 'info',
            text: `New ${note.urgency_level} Note for ${patientName}`,
            time: 'Just now',
            link: `/patients?patient=${note.patient_id}`
          };
          setNotifications(prev => [newNotif, ...prev]);
          toast.info(newNotif.text);
        }
      })
      .subscribe();

    // 5. Subscribe to tasks
    const tasksChannel = supabase
      .channel('task-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, async (payload) => {
        const task = payload.new;
        if (task.priority === 'STAT' || task.priority === 'Urgent') {
          const { data: p } = await supabase
            .from('patients')
            .select('name, assigned_nurse_id, patient_assignments(nurse_id)')
            .eq('id', task.patient_id)
            .single();
            
          if (!isPatientAssignedToUser(p)) return;

          const newNotif = {
            id: `task-${Date.now()}`,
            type: 'stat',
            text: `New ${task.priority} Task: ${task.title}`,
            time: 'Just now',
            link: '/tasks'
          };
          setNotifications(prev => [newNotif, ...prev]);
          toast.warning(newNotif.text);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(vitalsChannel);
      supabase.removeChannel(medsChannel);
      supabase.removeChannel(swapChannel);
      supabase.removeChannel(soapChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [user, preferences]);

  // Initial fetch for existing pending notifications
  useEffect(() => {
    async function fetchInitialNotifications() {
      if (!user) return;
      try {
        const initialNotifs = [];

        // 1. Fetch pending STAT medications
        const { data: meds } = await supabase
          .from('medications')
          .select('*, patient:patients(name, assigned_nurse_id, patient_assignments(nurse_id))')
          .eq('urgency', 'STAT')
          .eq('status', 'pending');
        
        if (meds) {
          meds.forEach(m => {
            if (isPatientAssignedToUser(m.patient)) {
              initialNotifs.push({
                id: `m-${m.id}`,
                type: 'stat',
                text: `STAT MED: ${m.name} due for ${m.patient?.name || 'Unknown'}`,
                time: 'Pending',
                link: `/patients?patient=${m.patient_id}`
              });
            }
          });
        }

        // 2. Fetch pending high-priority tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*, patient:patients(name, assigned_nurse_id, patient_assignments(nurse_id))')
          .in('priority', ['STAT', 'Urgent'])
          .eq('status', 'todo');
        
        if (tasks) {
          tasks.forEach(t => {
            if (isPatientAssignedToUser(t.patient)) {
              initialNotifs.push({
                id: `task-${t.id}`,
                type: 'stat',
                text: `URGENT TASK: ${t.title}`,
                time: 'Incomplete',
                link: '/tasks'
              });
            }
          });
        }

        // 3. Fetch critical vitals
        const { data: vitals } = await supabase
          .from('vitals')
          .select('*, patient:patients(name, assigned_nurse_id, patient_assignments(nurse_id))');
        
        if (vitals) {
          vitals.forEach(v => {
            const isCritical = v.spo2 < 90 || v.heart_rate > 140 || v.heart_rate < 40 || v.temperature > 39 || v.temperature < 35;
            if (isCritical && isPatientAssignedToUser(v.patient)) {
              initialNotifs.push({
                id: `v-${v.id}`,
                type: 'critical',
                text: `CRITICAL: ${v.patient?.name || 'Patient'} - Unstable vitals detected`,
                time: 'Live',
                link: `/patients?patient=${v.patient_id}`
              });
            }
          });
        }

        setNotifications(initialNotifs);
      } catch (err) {
        console.warn('Failed to fetch initial notifications:', err);
      }
    }
    fetchInitialNotifications();
  }, [user]);

  const clearAll = () => setNotifications([]);
  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <NotificationContext.Provider value={{ notifications, preferences, setPreferences, clearAll, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
