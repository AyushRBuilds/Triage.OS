import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Stethoscope, Clock, Plus, X, Calendar } from 'lucide-react';
import { getTasks, updateTaskStatus, createTask, getPatients } from '../api/services';
import './KanbanBoard.css';

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientFilter, setPatientFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    patientId: '',
    priority: 'Routine',
    deadline: '',
    assignedTo: '',
  });

  useEffect(() => {
    async function load() {
      const [t, p] = await Promise.all([getTasks(), getPatients()]);
      setTasks(t);
      setPatients(p);
    }
    load();
  }, []);

  const filteredTasks = patientFilter === 'all'
    ? tasks
    : tasks.filter((t) => t.patientId === patientFilter || t.patientName === patients.find((p) => p.id === patientFilter)?.name);

  const getColumnTasks = (columnId) => filteredTasks.filter((t) => t.status === columnId);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    await updateTaskStatus(taskId, newStatus);
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    setSaving(true);
    try {
      const patient = patients.find((p) => p.id === newTask.patientId);
      const payload = {
        title: newTask.title,
        description: newTask.description || null,
        patient_id: newTask.patientId || null,
        priority: newTask.priority,
        status: 'todo',
        type: 'nursing',
      };
      const saved = await createTask(payload);
      const taskForUI = {
        ...saved,
        patientName: patient?.name || 'Unassigned',
        createdBy: 'Current User',
        createdAt: new Date(saved.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        deadline: newTask.deadline,
        assignedTo: newTask.assignedTo,
      };
      setTasks((prev) => [taskForUI, ...prev]);
      setNewTask({ title: '', description: '', patientId: '', priority: 'Routine', deadline: '', assignedTo: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to save task:', err);
      alert('Could not save task. Check Supabase RLS policies.');
    } finally {
      setSaving(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const map = { STAT: 'badge-stat', Urgent: 'badge-urgent', High: 'badge-urgent', Medium: 'badge-p3', Low: 'badge-routine', Routine: 'badge-routine' };
    return map[priority] || 'badge-routine';
  };

  return (
    <div className="kanban-page" id="kanban-page">
      <div className="kanban-header">
        <h3 className="text-section-title">Tasks</h3>
        <div className="kanban-toolbar">
          {/* Patient filter */}
          <select
            className="kanban-filter"
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
          >
            <option value="all">All Patients</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.bed}</option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="kanban-modal-backdrop" onClick={() => setShowAddForm(false)}>
          <div className="kanban-modal card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="kanban-modal-header">
              <h4 className="text-card-title">New Task</h4>
              <button className="kanban-modal-close" onClick={() => setShowAddForm(false)}><X size={18} /></button>
            </div>
            <div className="kanban-form">
              <div className="kanban-form-field">
                <label className="text-label">Task Title *</label>
                <input className="input" placeholder="e.g., ECG for Bed 7" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
              </div>
              <div className="kanban-form-field">
                <label className="text-label">Description</label>
                <textarea className="input kanban-textarea" placeholder="Additional details..." value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
              </div>
              <div className="kanban-form-row">
                <div className="kanban-form-field">
                  <label className="text-label">Patient</label>
                  <select className="input" value={newTask.patientId} onChange={(e) => setNewTask({ ...newTask, patientId: e.target.value })}>
                    <option value="">Select patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="kanban-form-field">
                  <label className="text-label">Priority</label>
                  <select className="input" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                    <option value="STAT">STAT</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="Routine">Routine</option>
                  </select>
                </div>
              </div>
              <div className="kanban-form-row">
                <div className="kanban-form-field">
                  <label className="text-label">Deadline</label>
                  <input className="input" type="date" value={newTask.deadline} onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })} />
                </div>
                <div className="kanban-form-field">
                  <label className="text-label">Assigned Staff</label>
                  <input className="input" placeholder="e.g., Nurse Priya" value={newTask.assignedTo} onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })} />
                </div>
              </div>
              <div className="kanban-form-actions">
                <button className="btn btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddTask} disabled={!newTask.title.trim() || saving}>
                  <Plus size={14} /> {saving ? 'Saving...' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-columns">
          {columns.map((col) => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className="kanban-column">
                <div className="kanban-column-header">
                  <span className="kanban-column-title">{col.title}</span>
                  <span className="badge badge-p4">{colTasks.length}</span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      className={`kanban-cards ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              className={`kanban-card card ${snapshot.isDragging ? 'dragging' : ''}`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                            >
                              <div className="kanban-card-top">
                                <span className={`badge ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                                <div className="kanban-drag-handle" {...provided.dragHandleProps}>
                                  <GripVertical size={14} />
                                </div>
                              </div>
                              <span className="kanban-card-title">{task.title}</span>
                              {task.description && <p className="kanban-card-desc text-body">{task.description}</p>}
                              <div className="kanban-card-footer">
                                <span className="kanban-card-creator"><Stethoscope size={10} /> {task.assignedTo || task.createdBy}</span>
                                {task.deadline && <span className="kanban-card-time"><Calendar size={10} /> {task.deadline}</span>}
                                {!task.deadline && <span className="kanban-card-time"><Clock size={10} /> {task.createdAt}</span>}
                              </div>
                              {task.patientName && task.patientName !== 'Unassigned' && (
                                <span className="badge badge-available kanban-patient-badge">{task.patientName}</span>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}