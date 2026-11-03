import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  X,
  Columns3,
  LayoutGrid,
  Forward,
  Check
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// Interfacce TypeScript
interface PlannerCategory {
  id: number;
  slug: string;
  name: string;
  color: string;
  order_position: number;
  active: boolean;
}

interface PlannerTask {
  id: number;
  description: string;
  day: string; // 'monday', 'tuesday', etc.
  category: number; // ID della categoria
  week_start_date: string; // YYYY-MM-DD
  order_position: number;
  completata: boolean;
}

// Azioni condivise dalle celle: inserimento rapido e spunta «fatta»
interface AgendaAzioni {
  bozza: { categoryId: number; day: string } | null;
  chiudiBozza: () => void;
  salvaRapida: (descrizione: string, categoryId: number, day: string) => Promise<void>;
  toggle: (task: PlannerTask) => void;
  categories: PlannerCategory[];
}
const AgendaCtx = React.createContext<AgendaAzioni | null>(null);
const useAgenda = () => React.useContext(AgendaCtx)!;

// Prima le attività da fare, in fondo quelle completate
const perStato = (a: PlannerTask, b: PlannerTask) => Number(a.completata) - Number(b.completata);

const QuickAdd: React.FC<{ categoryId: number; day: string; scegliCategoria?: boolean }> = ({ categoryId, day, scegliCategoria }) => {
  const { chiudiBozza, salvaRapida, categories } = useAgenda();
  const [testo, setTesto] = useState('');
  const [cat, setCat] = useState(categoryId);
  const salva = async () => {
    const t = testo.trim();
    chiudiBozza();
    if (t) await salvaRapida(t, cat, day);
  };
  return (
    <div onDoubleClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="rounded-md border border-ink-300 bg-white p-1.5 shadow-sm dark:border-gray-500 dark:bg-gray-800" data-testid="planner-rapida">
      <textarea
        autoFocus
        rows={2}
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); salva(); }
          if (e.key === 'Escape') chiudiBozza();
        }}
        onBlur={salva}
        placeholder="Scrivi e premi Invio"
        className="w-full resize-none bg-transparent text-xs leading-relaxed text-ink-900 outline-none placeholder:text-ink-300 dark:text-white"
        data-testid="planner-rapida-testo"
      />
      {scegliCategoria && (
        <div className="mt-1 flex flex-wrap gap-1">
          {categories.map((c) => (
            <button key={c.id} type="button" onMouseDown={(e) => { e.preventDefault(); setCat(c.id); }}
              className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition-colors ${cat === c.id ? 'text-white' : 'border-ink-100 text-ink-500 hover:border-ink-300'}`}
              style={cat === c.id ? { backgroundColor: c.color, borderColor: c.color } : undefined} data-testid={`planner-rapida-cat-${c.id}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Giorni della settimana
const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunedì', short: 'LUN' },
  { key: 'tuesday', label: 'Martedì', short: 'MAR' },
  { key: 'wednesday', label: 'Mercoledì', short: 'MER' },
  { key: 'thursday', label: 'Giovedì', short: 'GIO' },
  { key: 'friday', label: 'Venerdì', short: 'VEN' },
  { key: 'saturday', label: 'Sabato', short: 'SAB' },
];

// Funzione helper per calcolare il lunedì della settimana
const getMondayOfWeek = (date: Date): Date => {
  const monday = new Date(date);
  const dayOfWeek = monday.getDay();
  
  // Se è domenica (0), torna indietro di 6 giorni
  // Altrimenti torna indietro di (dayOfWeek - 1) giorni
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  monday.setDate(monday.getDate() - daysToSubtract);
  // Imposta sempre a mezzanotte per evitare problemi di fuso orario
  monday.setHours(0, 0, 0, 0);
  
  return monday;
};

// Funzione helper per convertire data in formato YYYY-MM-DD locale
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Vista smartphone: sotto i 768px
const useIsMobile = () => {
  const query = '(max-width: 767px)';
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const aggiorna = () => setMobile(mq.matches);
    mq.addEventListener('change', aggiorna);
    return () => mq.removeEventListener('change', aggiorna);
  }, []);
  return mobile;
};

const giornoDiOggi = () => {
  const idx = (new Date().getDay() + 6) % 7;
  return DAYS_OF_WEEK[Math.min(idx, DAYS_OF_WEEK.length - 1)].key;
};

// Linguetta giorno (smartphone): tocca per vedere il giorno, trascina una task sopra per spostarla
const DayChip: React.FC<{ day: typeof DAYS_OF_WEEK[number]; date: Date; selected: boolean; count: number; dragging: boolean; onSelect: () => void }> = ({ day, date, selected, count, dragging, onSelect }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `daychip-${day.key}` });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      data-testid={`planner-giorno-${day.key}`}
      className={`flex flex-1 flex-col items-center rounded-lg border px-1 py-2 text-xs font-semibold transition-colors ${
        isOver ? 'border-blue-500 bg-blue-100 text-blue-800 ring-2 ring-blue-400' : selected ? 'border-ink-900 bg-ink-900 text-white' : dragging ? 'border-dashed border-blue-400 bg-blue-50 text-ink-700' : 'border-ink-200 bg-white text-ink-700'
      }`}
    >
      <span>{day.short}</span>
      <span className="text-base leading-tight">{date.getDate()}</span>
      <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${count ? (selected ? 'bg-white' : 'bg-blue-500') : 'bg-transparent'}`} />
    </button>
  );
};

// Durante il trascinamento blocca lo scorrimento della pagina
const bloccaScroll = (attivo: boolean) => {
  document.body.classList.toggle('dnd-touch-fix', attivo);
  const main = document.querySelector('main') as HTMLElement | null;
  if (main) main.style.overflow = attivo ? 'hidden' : '';
};

// Componente per le task trascinabili
interface DraggableTaskProps {
  task: PlannerTask;
  category: PlannerCategory;
  onEdit: (task: PlannerTask) => void;
  onDelete: (taskId: number) => void;
}

const DraggableTask: React.FC<DraggableTaskProps & { mostraCategoria?: boolean }> = ({ task, category, onEdit, onDelete, mostraCategoria }) => {
  const agenda = React.useContext(AgendaCtx);
  const isMobile = useIsMobile();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };



  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        touchAction: isDragging ? 'none' : 'manipulation'
      }}
      {...attributes}
      {...listeners}
      data-testid={`planner-task-${task.id}`}
      onClick={(e) => {
        if (!isMobile) return;
        e.stopPropagation();
        onEdit(task);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit(task);
      }}

      className={`
        group rounded-md mb-1 border dark:border-gray-700
        cursor-grab active:cursor-grabbing transition-[box-shadow,border-color,opacity] duration-200 text-xs
        ${task.completata ? 'border-transparent bg-ink-50/70 opacity-70 hover:opacity-90 dark:bg-gray-900/40' : 'border-ink-100 bg-white hover:border-ink-300 hover:shadow-sm dark:bg-gray-800'}
        ${isDragging ? 'opacity-50 rotate-1 scale-105' : ''}
        relative overflow-hidden touch-manipulation select-none
      `}
    >
      {/* Striscetta colorata a sinistra */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: task.completata ? '#d4d4d8' : category.color }}
      ></div>
      
      <div className="flex items-start justify-between gap-1.5 p-2 pl-3">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); agenda?.toggle(task); }}
          className="group/fatta -m-2 flex shrink-0 cursor-pointer items-center justify-center rounded-full p-2 hover:bg-ink-100 dark:hover:bg-gray-700"
          title={task.completata ? 'Segna come da fare' : 'Segna come fatta'}
          data-testid={`planner-task-fatta-${task.id}`}
        >
          <span className={`flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] transition-colors ${task.completata ? 'border-ink-400 bg-ink-400 text-white' : 'border-ink-300 group-hover/fatta:border-ink-700'}`}>
            {task.completata && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        </button>
        <div className="flex-1 min-w-0 pr-2">
          {mostraCategoria && (
            <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider" style={{ color: task.completata ? '#a1a1aa' : category.color }} data-testid={`planner-task-categoria-${task.id}`}>{category.name}</span>
          )}
          <p className={`font-medium text-xs leading-relaxed break-words select-none ${task.completata ? 'text-ink-400 line-through' : 'text-gray-900 dark:text-white'}`}>
            {task.description}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            data-testid={`planner-task-elimina-${task.id}`}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente per le zone di drop laterali per cambio settimana
interface WeekDropZoneProps {
  direction: 'prev' | 'next';
  isOver: boolean;
  canDrop: boolean;
}

const WeekDropZone: React.FC<WeekDropZoneProps> = ({ direction, isOver, canDrop }: WeekDropZoneProps) => {
  const { setNodeRef } = useDroppable({
    id: `week-${direction}`,
  });

  // Posizionamento identico per entrambe le zone all'interno del container
  const positionClasses = direction === 'prev' 
    ? 'fixed top-0 bottom-0 left-0 w-16 z-50' // Lato sinistro del planner
    : 'fixed top-0 bottom-0 right-0 w-16 z-50'; // Lato destro del planner

  return (
    <div
      ref={setNodeRef}
      className={`
        ${positionClasses}
        transition-all duration-200
        ${canDrop ? 'pointer-events-auto' : 'pointer-events-none'}
        ${canDrop ? 'bg-blue-500/30 border-2 border-blue-500 border-dashed' : 'bg-transparent'}
        ${isOver && canDrop ? 'bg-blue-500/50' : ''}
        hidden md:flex flex-col items-center justify-center rounded-lg
      `}
    >
      {canDrop && (
        <div className="text-center text-white bg-blue-500 rounded-lg p-2 shadow-lg">
          <div className="text-xs font-medium">
            {direction === 'prev' ? '← Prec' : 'Succ →'}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente per le celle della griglia
interface GridCellProps {
  category: PlannerCategory;
  day: string;
  tasks: PlannerTask[];
  onEdit: (task: PlannerTask) => void;
  onDelete: (taskId: number) => void;
  compatta?: boolean;
  oggi?: boolean;
}

const GridCell: React.FC<GridCellProps> = ({ category, day, tasks, onEdit, onDelete, compatta, oggi }: GridCellProps) => {
  const { bozza } = useAgenda();
  const inScrittura = bozza?.categoryId === category.id && bozza.day === day;
  const { setNodeRef, isOver, active } = useDroppable({
    id: `${category.id}-${day}`,
  });

  // Controlla se l'elemento che stiamo trascinando può essere droppato qui
  const canDrop = active && active.id !== `${category.id}-${day}`;

  return (
    <div 
      ref={setNodeRef}
      onDoubleClick={() => window.dispatchEvent(new CustomEvent('addTaskToCell', { detail: { categoryId: category.id, day } }))}
      title="Doppio clic per aggiungere un'attività"
      data-testid={`planner-cella-${category.id}-${day}`}
      className={`
        group p-2 border-b border-r border-ink-100 dark:border-gray-700 transition-colors duration-200
        relative flex flex-col
        ${isOver && canDrop ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-inset ring-blue-300' : oggi ? 'bg-ink-100 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-800'}
      `}
      style={{ minHeight: compatta ? Math.max(64, tasks.length * 45 + 48) + 'px' : Math.max(84, tasks.length * 45 + 44) + 'px' }}
    >
      {/* Bottone + per aggiungere task (solo smartphone, dove il doppio clic non è comodo) */}
      {compatta && <button
        onClick={(e) => {
          e.stopPropagation();
          // Chiama la funzione per aggiungere task con categoria e giorno preimpostati
          const addTaskEvent = new CustomEvent('addTaskToCell', {
            detail: { categoryId: category.id, day: day }
          });
          window.dispatchEvent(addTaskEvent);
        }}
        className="
          absolute bottom-2 right-2 w-8 h-8 items-center justify-center
          bg-blue-500 hover:bg-blue-600 active:bg-blue-600 text-white rounded-full text-base font-bold
          transition-all duration-200 shadow-md hover:shadow-lg z-20
          md:w-6 md:h-6 md:text-sm md:opacity-0 md:group-hover:opacity-100
          flex md:flex opacity-100
        "
        title="Aggiungi task"
      >
        +
      </button>}

      <SortableContext items={tasks.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
        <div className="space-y-1 flex-1 min-h-0">
          {tasks.map((task) => (
            <DraggableTask
              key={task.id}
              task={task}
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {inScrittura && <QuickAdd categoryId={category.id} day={day} />}
          
          {/* Area di drop invisibile che occupa tutto lo spazio rimanente */}
          {canDrop && (
            <div className="flex-1 min-h-[20px]" />
          )}
        </div>
      </SortableContext>
    </div>
  );
};

// Vista per giorno: una colonna per giorno, le task portano l'etichetta della categoria
const DayColumn: React.FC<{ day: typeof DAYS_OF_WEEK[number]; date: Date; oggi: boolean; tasks: PlannerTask[]; categories: PlannerCategory[]; onEdit: (t: PlannerTask) => void; onDelete: (id: number) => void; onAdd: () => void }> = ({ day, date, oggi, tasks, categories, onEdit, onDelete, onAdd }) => {
  const { setNodeRef, isOver, active } = useDroppable({ id: `day-${day.key}` });
  const { bozza } = useAgenda();
  return (
    <div ref={setNodeRef} onDoubleClick={onAdd} title="Doppio clic per aggiungere un'attività" className={`flex min-h-[460px] flex-col border-r border-ink-100 last:border-r-0 dark:border-gray-700 ${isOver && active ? 'bg-blue-50 dark:bg-blue-900/20' : oggi ? 'bg-ink-100 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-800'}`} data-testid={`planner-colonna-${day.key}`}>
      <IntestazioneGiorno day={day} date={date} oggi={oggi} conteggio={tasks.filter(t => !t.completata).length} />
      <SortableContext items={tasks.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-1 p-2">
          {tasks.map((task) => (
            <DraggableTask key={task.id} task={task} category={categories.find(c => c.id === task.category) || categories[0]} onEdit={onEdit} onDelete={onDelete} mostraCategoria />
          ))}
          {bozza?.day === day.key && <QuickAdd categoryId={bozza.categoryId} day={day.key} scegliCategoria />}
        </div>
      </SortableContext>
    </div>
  );
};

const IntestazioneGiorno: React.FC<{ day: typeof DAYS_OF_WEEK[number]; date: Date; oggi: boolean; conteggio: number }> = ({ day, date, oggi, conteggio }) => (
  <div className={`flex items-center justify-between border-b border-ink-100 px-3 py-2.5 dark:border-gray-700 ${oggi ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-700 dark:bg-gray-700 dark:text-gray-200'}`}>
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-bold tabular-nums leading-none">{date.getDate()}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider">{day.label}</span>
    </div>
    {conteggio > 0 && <span className={`rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${oggi ? 'bg-white/20' : 'bg-white text-ink-500 dark:bg-gray-800'}`}>{conteggio}</span>}
  </div>
);

export const Planner: React.FC = () => {
  const { user } = useAuthStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const monday = getMondayOfWeek(today);
    return monday;
  });

  // Aggiunge CSS per migliorare il touch handling
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .dnd-touch-fix * {
        touch-action: none !important;
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
      }
      
      /* Previeni selezione testo su mobile per il planner */
      @media (max-width: 768px) {
        .planner-container * {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -khtml-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        
        .planner-container {
          -webkit-overflow-scrolling: touch;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const [categories, setCategories] = useState<PlannerCategory[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    category: 0,
    day: 'monday',
  });
  const [activeId, setActiveId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    })
  );
  const isMobile = useIsMobile();
  const [giornoMobile, setGiornoMobile] = useState(giornoDiOggi);
  const [vista, setVista] = useState<'giorni' | 'categorie'>(() => (localStorage.getItem('agenda-vista') === 'categorie' ? 'categorie' : 'giorni'));
  const cambiaVista = (v: 'giorni' | 'categorie') => {
    setVista(v);
    localStorage.setItem('agenda-vista', v);
  };
  const [spostando, setSpostando] = useState(false);

  // Carica categorie dal database
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('planner_categories')
        .select('*')
        .eq('user_id', user?.id)
        .eq('active', true)
        .order('order_position', { ascending: true });

      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Errore caricamento categorie:', error);
      toast.error('Errore nel caricamento delle categorie');
    }
  };

  // Carica task dal database
  const loadTasks = async () => {
    try {
      const weekStartStr = formatDateLocal(currentWeekStart);
      

      
      const { data, error } = await supabase
        .from('planner_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .eq('week_start_date', weekStartStr)
        .order('category', { ascending: true })
        .order('day', { ascending: true })
        .order('order_position', { ascending: true });

      if (error) throw error;
      
      // Verifica e correggi eventuali order_position mancanti o duplicati
      if (data && data.length > 0) {
        await fixOrderPositions(data);
      }
      
      setTasks(data || []);
    } catch (error) {
      console.error('Errore caricamento task:', error);
      toast.error('Errore nel caricamento delle task');
    }
  };

  // Funzione per correggere le posizioni delle task
  const fixOrderPositions = async (tasksData: PlannerTask[]) => {
    const updates = [];
    
    // Raggruppa per categoria e giorno
    const groups = tasksData.reduce((acc, task) => {
      const key = `${task.category}-${task.day}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {} as Record<string, PlannerTask[]>);
    
    // Per ogni gruppo, verifica e correggi le posizioni
    for (const groupTasks of Object.values(groups)) {
      for (let index = 0; index < groupTasks.length; index++) {
        const task = groupTasks[index];
        if (task.order_position !== index) {
          updates.push(
            supabase
              .from('planner_tasks')
              .update({ order_position: index }).eq('user_id', user?.id)
              .eq('id', task.id)
          );
          task.order_position = index; // Aggiorna anche l'oggetto locale
        }
      }
    }
    
    if (updates.length > 0) {
      await Promise.all(updates);
    }
  };

  useEffect(() => {
    if (user) {
      loadCategories();
      loadTasks();
    }
  }, [user, currentWeekStart]);

  // Listener per l'evento di aggiunta task da cella specifica
  useEffect(() => {
    const handleAddTaskToCellEvent = (event: CustomEvent) => {
      const { categoryId, day } = event.detail;
      handleAddTaskToCell(categoryId, day);
    };

    window.addEventListener('addTaskToCell', handleAddTaskToCellEvent as EventListener);
    
    return () => {
      window.removeEventListener('addTaskToCell', handleAddTaskToCellEvent as EventListener);
    };
  }, [categories]);

  // Focus sul campo descrizione quando si apre il modal
  useEffect(() => {
    if (showModal && descriptionRef.current) {
      const timer = setTimeout(() => {
        descriptionRef.current?.focus();
      }, 100); // Piccolo delay per assicurarsi che il modal sia completamente renderizzato
      
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  // Gestione shortcut CTRL + INVIO per salvare
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showModal && event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        handleSaveTask();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showModal, formData]); // Include formData per avere accesso ai dati aggiornati

  // Gestione drag & drop
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
    setDragOver(null);
    
    // Aggiungi classe per bloccare il touch su tutto il documento durante il drag
    bloccaScroll(true);
    
    // Feedback aptico su mobile (vibrazione se supportata)
    if ('vibrate' in navigator && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      navigator.vibrate(50);
    }
  };

  const handleDragOver = (event: any) => {
    const overId = event.over?.id || null;
    setDragOver(overId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setDragOver(null);
      bloccaScroll(false);
      return;
    }

    const activeId = Number(active.id);
    const overId = over.id as string;

    // Vista per giorno: rilascio su un'altra task sposta solo il giorno (la categoria resta)
    const overTaskGiorni = vista === 'giorni' && !isMobile && !overId.includes('-') ? tasks.find(t => t.id === Number(overId)) : undefined;
    const taskAttiva = tasks.find(t => t.id === activeId);
    const versoGiorno = overId.startsWith('daychip-') || overId.startsWith('day-') || (overTaskGiorni && taskAttiva && (overTaskGiorni.day !== taskAttiva.day || overTaskGiorni.category !== taskAttiva.category));
    if (versoGiorno) {
      const nuovoGiorno = overTaskGiorni ? overTaskGiorni.day : overId.replace(/^(daychip|day)-/, '');
      const task = taskAttiva;
      if (task && task.day !== nuovoGiorno) {
        const posizioni = tasks.filter(t => t.category === task.category && t.day === nuovoGiorno).map(t => t.order_position);
        const nextPosition = posizioni.length ? Math.max(...posizioni) + 1 : 0;
        setTasks(prev => prev.map(t => t.id === activeId ? { ...t, day: nuovoGiorno, order_position: nextPosition } : t));
        const { error } = await supabase.from('planner_tasks').update({ day: nuovoGiorno, order_position: nextPosition }).eq('user_id', user?.id).eq('id', activeId);
        if (error) {
          toast.error('Errore nello spostamento della task');
          loadTasks();
        } else {
          toast.success(`Task spostata a ${DAYS_OF_WEEK.find(d => d.key === nuovoGiorno)?.label}`);
        }
      }
      setActiveId(null);
      setDragOver(null);
      bloccaScroll(false);
      return;
    }

    // Gestione cambio settimana
    if (overId === 'week-prev' || overId === 'week-next') {
      const direction = overId === 'week-prev' ? -7 : 7;
      const newWeekDate = new Date(currentWeekStart);
      newWeekDate.setDate(currentWeekStart.getDate() + direction);
      const newWeekStart = getMondayOfWeek(newWeekDate);
      const newWeekStartStr = formatDateLocal(newWeekStart);

      // Sposta la task alla nuova settimana mantenendo categoria e giorno
      const activeTask = tasks.find(t => t.id === activeId);
      if (activeTask) {
        setTasks(tasks => 
          tasks.map(task => 
            task.id === activeId 
              ? { ...task, week_start_date: newWeekStartStr }
              : task
          )
        );

        supabase
          .from('planner_tasks')
          .update({ week_start_date: newWeekStartStr }).eq('user_id', user?.id)
          .eq('id', activeId)
          .then(({ error }) => {
            if (error) {
              console.error('Errore spostamento settimana:', error);
              toast.error('Errore nello spostamento della task');
              loadTasks();
            } else {
              // Cambia settimana e ricarica
              setCurrentWeekStart(newWeekStart);
              toast.success(`Task spostata alla settimana ${direction > 0 ? 'successiva' : 'precedente'}`);
            }
          });
      }

      setActiveId(null);
      setDragOver(null);
      bloccaScroll(false);
      return;
    }

    // Se stiamo trascinando su un'altra task (riordinamento)
    if (!overId.includes('-')) {
      const overTaskId = Number(overId);
      const activeTask = tasks.find(t => t.id === activeId);
      const overTask = tasks.find(t => t.id === overTaskId);
      
      if (activeTask && overTask && activeId !== overTaskId) {
        // Riordinamento all'interno della stessa cella
        if (activeTask.category === overTask.category && activeTask.day === overTask.day) {
          const cellTasks = tasks
            .filter(t => t.category === activeTask.category && t.day === activeTask.day)
            .sort((a, b) => a.order_position - b.order_position);
          
          const activeIndex = cellTasks.findIndex(t => t.id === activeId);
          const overIndex = cellTasks.findIndex(t => t.id === overTaskId);
          
          if (activeIndex !== overIndex) {
            // Riordina le task
            const reorderedTasks = [...cellTasks];
            const [removed] = reorderedTasks.splice(activeIndex, 1);
            reorderedTasks.splice(overIndex, 0, removed);
            
            // Aggiornamento ottimistico
            setTasks(prevTasks => {
              const newTasks = [...prevTasks];
              reorderedTasks.forEach((task, index) => {
                const taskIndex = newTasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                  newTasks[taskIndex] = { ...newTasks[taskIndex], order_position: index };
                }
              });
              return newTasks;
            });

            // Sincronizza con il database
            const updates = reorderedTasks.map((task, index) => 
              supabase
                .from('planner_tasks')
                .update({ order_position: index }).eq('user_id', user?.id)
                .eq('id', task.id)
            );
            
            Promise.all(updates).catch(error => {
              console.error('Errore riordinamento task:', error);
              toast.error('Errore nel riordinamento delle task');
              loadTasks();
            });
          }
        } else {
          // Spostamento su task di cella diversa - sposta nella cella della task target
          const targetCellTasks = tasks.filter(t => 
            t.category === overTask.category && 
            t.day === overTask.day
          );
          const nextPosition = Math.max(...targetCellTasks.map(t => t.order_position)) + 1;

          setTasks(tasks => 
            tasks.map(task => 
              task.id === activeId 
                ? { ...task, category: overTask.category, day: overTask.day, order_position: nextPosition }
                : task
            )
          );

          supabase
            .from('planner_tasks')
            .update({ 
              category: overTask.category, 
              day: overTask.day,
              order_position: nextPosition
            }).eq('user_id', user?.id)
            .eq('id', activeId)
            .then(({ error }) => {
              if (error) {
                console.error('Errore spostamento task:', error);
                toast.error('Errore nello spostamento della task');
                loadTasks();
              }
            });
        }
      }
    } else {
      // Spostamento su cella vuota o area di drop
      const [newCategoryStr, newDay] = overId.split('-');
      const newCategoryId = parseInt(newCategoryStr);
      
      if (newCategoryId && newDay) {
        const targetCellTasks = tasks.filter(t => 
          t.category === newCategoryId && 
          t.day === newDay
        );
        const nextPosition = targetCellTasks.length > 0 
          ? Math.max(...targetCellTasks.map(t => t.order_position)) + 1 
          : 0;

        setTasks(tasks => 
          tasks.map(task => 
            task.id === activeId 
              ? { ...task, category: newCategoryId, day: newDay, order_position: nextPosition }
              : task
          )
        );

        supabase
          .from('planner_tasks')
          .update({ 
            category: newCategoryId, 
            day: newDay,
            order_position: nextPosition
          }).eq('user_id', user?.id)
          .eq('id', activeId)
          .then(({ error }) => {
            if (error) {
              console.error('Errore spostamento task:', error);
              toast.error('Errore nello spostamento della task');
              loadTasks();
            }
          });
      }
    }

    setActiveId(null);
    setDragOver(null);
    bloccaScroll(false);
  };

  // Gestione task
  const handleAddTask = () => {
    setEditingTask(null);
    setFormData({
      description: '',
      category: categories[0]?.id || 0,
      day: 'monday',
    });
    setShowModal(true);
  };

  // Doppio clic su una cella: casella di scrittura rapida al posto della finestra
  const [bozza, setBozza] = useState<{ categoryId: number; day: string } | null>(null);
  const handleAddTaskToCell = (categoryId: number, day: string) => {
    setBozza({ categoryId, day });
  };

  const salvaRapida = async (descrizione: string, categoryId: number, day: string) => {
    const weekStartStr = formatDateLocal(currentWeekStart);
    const posizioni = tasks.filter(t => t.category === categoryId && t.day === day).map(t => t.order_position);
    const { data, error } = await supabase
      .from('planner_tasks')
      .insert([{ description: descrizione, category: categoryId, day, week_start_date: weekStartStr, order_position: posizioni.length ? Math.max(...posizioni) + 1 : 0, user_id: user?.id }])
      .select()
      .single();
    if (error) {
      toast.error('Errore nel salvataggio della task');
      return;
    }
    setTasks(prev => [...prev, data]);
  };

  const toggleFatta = async (task: PlannerTask) => {
    const completata = !task.completata;
    setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, completata } : t)));
    const { error } = await supabase.from('planner_tasks').update({ completata }).eq('id', task.id).eq('user_id', user?.id);
    if (error) {
      toast.error('Errore nel salvataggio');
      loadTasks();
    }
  };

  const handleEditTask = (task: PlannerTask) => {
    setEditingTask(task);
    setFormData({
      description: task.description,
      category: task.category,
      day: task.day,
    });
    setShowModal(true);
  };

  const handleDeleteTask = async (taskId: number) => {
    console.log('🗑️ Tentativo eliminazione task:', taskId);
    if (!confirm('Sei sicuro di voler eliminare questa task?')) return;

    try {
      console.log('🗑️ Eliminazione task dal database...');
      const { error } = await supabase
        .from('planner_tasks')
        .delete().eq('user_id', user?.id)
        .eq('id', taskId);

      if (error) throw error;
      
      console.log('🗑️ Task eliminata dal database, aggiorno stato locale...');
      setTasks(tasks => tasks.filter(t => t.id !== taskId));
      toast.success('Task eliminata con successo');
    } catch (error) {
      console.error('Errore eliminazione task:', error);
      toast.error('Errore nell\'eliminazione della task');
    }
  };

  const handleSaveTask = async () => {
    if (!formData.description.trim()) {
      toast.error('La descrizione è obbligatoria');
      return;
    }

    try {
      const weekStartStr = formatDateLocal(currentWeekStart);
      
      if (editingTask) {
        const taskData = {
          description: formData.description.trim(),
          category: formData.category,
          day: formData.day,
          week_start_date: weekStartStr,
          // Mantieni la posizione esistente quando si modifica
        };

        const { error } = await supabase
          .from('planner_tasks')
          .update(taskData).eq('user_id', user?.id)
          .eq('id', editingTask.id);

        if (error) throw error;
        
        setTasks(tasks => 
          tasks.map(task => 
            task.id === editingTask.id
              ? { ...task, ...taskData }
              : task
          )
        );
        toast.success('Task modificata con successo');
      } else {
        // Calcola la prossima posizione per la nuova task
        const existingTasks = tasks.filter(t => 
          t.category === formData.category && 
          t.day === formData.day && 
          t.week_start_date === weekStartStr
        );
        const nextPosition = existingTasks.length > 0 
          ? Math.max(...existingTasks.map(t => t.order_position)) + 1 
          : 0;

        const taskData = {
          description: formData.description.trim(),
          category: formData.category,
          day: formData.day,
          week_start_date: weekStartStr,
          order_position: nextPosition,
        };

        const { data, error } = await supabase
          .from('planner_tasks')
          .insert([{ ...taskData, user_id: user?.id }])
          .select()
          .single();

        if (error) throw error;
        
        setTasks(tasks => [...tasks, data]);
        toast.success('Task aggiunta con successo');
      }

      setShowModal(false);
    } catch (error) {
      console.error('Errore salvataggio task:', error);
      toast.error('Errore nel salvataggio della task');
    }
  };

  // Porta le attività ancora da fare alla settimana successiva (stesso giorno e categoria, in coda); le completate restano
  const spostaAllaSettimanaDopo = async () => {
    const daFare = tasks.filter(t => !t.completata);
    const n = daFare.length;
    if (!n || !confirm(n === 1 ? "Spostare l'attività rimasta alla settimana successiva?" : `Spostare le ${n} attività rimaste alla settimana successiva?`)) return;
    setSpostando(true);
    try {
      const dopo = new Date(currentWeekStart);
      dopo.setDate(dopo.getDate() + 7);
      const dopoStr = formatDateLocal(dopo);
      const { data: esistenti, error } = await supabase.from('planner_tasks').select('category, day, order_position').eq('user_id', user?.id).eq('week_start_date', dopoStr);
      if (error) throw error;
      const prossima: Record<string, number> = {};
      (esistenti || []).forEach(t => {
        const k = `${t.category}-${t.day}`;
        prossima[k] = Math.max(prossima[k] ?? 0, t.order_position + 1);
      });
      const ordinate = [...daFare].sort((a, b) => a.order_position - b.order_position);
      const risultati = await Promise.all(ordinate.map(t => {
        const k = `${t.category}-${t.day}`;
        const pos = prossima[k] ?? 0;
        prossima[k] = pos + 1;
        return supabase.from('planner_tasks').update({ week_start_date: dopoStr, order_position: pos }).eq('user_id', user?.id).eq('id', t.id);
      }));
      if (risultati.some(r => r.error)) throw risultati.find(r => r.error)!.error;
      toast.success(ordinate.length === 1 ? 'Attività spostata alla settimana successiva' : `${ordinate.length} attività spostate alla settimana successiva`);
      setCurrentWeekStart(dopo);
    } catch (error) {
      console.error('Errore spostamento settimana:', error);
      toast.error('Errore nello spostamento delle attività');
      loadTasks();
    } finally {
      setSpostando(false);
    }
  };

  const dataGiorno = (i: number) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d;
  };
  const oggiStr = formatDateLocal(new Date());
  const tasksDelGiorno = (day: string) => tasks.filter(t => t.day === day).sort((a, b) => {
    const ca = categories.findIndex(c => c.id === a.category);
    const cb = categories.findIndex(c => c.id === b.category);
    return perStato(a, b) || ca - cb || a.order_position - b.order_position;
  });

  // Navigazione settimana
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  // Vai alla settimana corrente
  const goToCurrentWeek = () => {
    const today = new Date();
    const monday = getMondayOfWeek(today);
    setCurrentWeekStart(monday);
  };



  // Ottieni task per categoria e giorno (ordinate per order_position)
  const getTasksForCategoryAndDay = (categoryId: number, day: string) => {
    return tasks
      .filter(task => task.category === categoryId && task.day === day)
      .sort((a, b) => perStato(a, b) || a.order_position - b.order_position);
  };

  const activeTask = activeId ? tasks.find(task => task.id === activeId) : null;

  return (
    <div className="flex flex-col gap-6 planner-container">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda settimanale</h1>
          <p className="text-gray-600 dark:text-gray-300">Organizza le attività della settimana</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isMobile && (
            <div className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-800" data-testid="planner-vista-switch">
              {([['giorni', 'Per giorno', Columns3], ['categorie', 'Per categoria', LayoutGrid]] as const).map(([v, label, Icona]) => (
                <button key={v} onClick={() => cambiaVista(v)} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${vista === v ? 'bg-ink-900 text-white' : 'text-ink-600 hover:text-ink-900 dark:text-gray-300'}`} data-testid={`planner-switch-${v}`}>
                  <Icona className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          )}
          <button onClick={spostaAllaSettimanaDopo} disabled={!tasks.some(t => !t.completata) || spostando} className="btn btn-secondary flex items-center gap-2 disabled:opacity-50" data-testid="planner-sposta-settimana" title="Porta le attività rimaste alla settimana successiva">
            <Forward className="w-4 h-4" />
            {spostando ? 'Spostamento…' : 'Sposta alla settimana dopo'}
          </button>
          <button
            onClick={handleAddTask}
            className="btn btn-primary flex items-center gap-2"
            disabled={categories.length === 0}
            data-testid="planner-aggiungi-task"
          >
            <Plus className="w-4 h-4" />
            Nuova attività
          </button>
        </div>
      </div>

      {/* Controlli settimana */}
      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-gray-700">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={goToCurrentWeek}
              className="rounded-md border border-ink-200 px-3 py-1 text-xs font-semibold text-ink-700 transition-colors hover:bg-ink-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              data-testid="planner-oggi"
            >
              Vai a oggi
            </button>
          </div>
          
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Nessuna categoria trovata. Vai ai Parametri per creare le categorie del planner.
            </p>
          </div>
        ) : (
          <AgendaCtx.Provider value={{ bozza, chiudiBozza: () => setBozza(null), salvaRapida, toggle: toggleFatta, categories }}>
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => { setActiveId(null); setDragOver(null); bloccaScroll(false); }}
          >
            {/* Container con zone di drop */}
            <div className="relative">
              {/* Zone di drop per cambio settimana - fuori dalla griglia */}
              <WeekDropZone 
                direction="prev" 
                isOver={activeId !== null && dragOver === 'week-prev'} 
                canDrop={activeId !== null} 
              />
              <WeekDropZone 
                direction="next" 
                isOver={activeId !== null && dragOver === 'week-next'} 
                canDrop={activeId !== null} 
              />
              
              {/* Griglia planner */}
              {/* Smartphone: un giorno alla volta */}
              {isMobile ? (
                <div data-testid="planner-vista-mobile" className="p-3">
                  <div className="sticky top-0 z-30 -mx-1 mb-3 flex gap-1 bg-white px-1 pb-2 dark:bg-gray-800">
                    {DAYS_OF_WEEK.map((day, i) => {
                      const data = new Date(currentWeekStart);
                      data.setDate(currentWeekStart.getDate() + i);
                      return (
                        <DayChip
                          key={day.key}
                          day={day}
                          date={data}
                          selected={giornoMobile === day.key}
                          count={tasks.filter(t => t.day === day.key && !t.completata).length}
                          dragging={activeId !== null}
                          onSelect={() => setGiornoMobile(day.key)}
                        />
                      );
                    })}
                  </div>
                  <p className="mb-3 text-xs text-ink-500">Tocca una task per modificarla. Tienila premuta e trascinala su un altro giorno per spostarla.</p>
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div key={category.id} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 dark:bg-gray-700">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{category.name}</span>
                        </div>
                        <GridCell
                          category={category}
                          day={giornoMobile}
                          tasks={getTasksForCategoryAndDay(category.id, giornoMobile)}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                          compatta
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : vista === 'giorni' ? (
                <div className="overflow-x-auto" data-testid="planner-vista-giorni">
                  <div className="grid min-w-[900px] grid-cols-6">
                    {DAYS_OF_WEEK.map((day, i) => (
                      <DayColumn key={day.key} day={day} date={dataGiorno(i)} oggi={formatDateLocal(dataGiorno(i)) === oggiStr} tasks={tasksDelGiorno(day.key)} categories={categories}
                        onEdit={handleEditTask} onDelete={handleDeleteTask} onAdd={() => handleAddTaskToCell(categories[0].id, day.key)} />
                    ))}
                  </div>
                </div>
              ) : (
              <div className="overflow-x-auto" data-testid="planner-vista-categorie">
                <div className="min-w-[900px]">
                {/* Header giorni */}
                <div className="grid grid-cols-[11rem_repeat(6,minmax(0,1fr))]">
                  <div className="border-b border-r border-ink-100 bg-ink-50 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:border-gray-700 dark:bg-gray-700">
                    Categoria
                  </div>
                  {DAYS_OF_WEEK.map((day, i) => (
                    <IntestazioneGiorno key={day.key} day={day} date={dataGiorno(i)} oggi={formatDateLocal(dataGiorno(i)) === oggiStr} conteggio={0} />
                  ))}
                </div>

                {/* Righe categorie */}
                {categories.map((category) => (
                  <div key={category.id} className="grid grid-cols-[11rem_repeat(6,minmax(0,1fr))]" data-testid={`planner-riga-${category.id}`}>
                    {/* Nome categoria */}
                    <div className="flex items-center gap-2 border-b border-r border-ink-100 bg-ink-50/60 px-3 py-2 dark:border-gray-700 dark:bg-gray-700" style={{ boxShadow: `inset 3px 0 0 ${category.color}` }}>
                      <span className="text-xs font-semibold uppercase tracking-wider text-ink-800 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                    
                    {/* Celle giorni */}
                    {DAYS_OF_WEEK.map((day, i) => (
                      <GridCell
                        key={`${category.slug}-${day.key}`}
                        category={category}
                        day={day.key}
                        tasks={getTasksForCategoryAndDay(category.id, day.key)}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        oggi={formatDateLocal(dataGiorno(i)) === oggiStr}
                      />
                    ))}
                  </div>
                ))}
                </div>
              </div>
              )}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="transform rotate-3 scale-110 opacity-90 shadow-2xl">
                  <DraggableTask
                    task={activeTask}
                    category={categories.find(c => c.id === activeTask.category) || categories[0]}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    mostraCategoria={vista === 'giorni'}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          </AgendaCtx.Provider>
        )}
      </div>

      {/* Modal per aggiungere/modificare task */}
      {showModal && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingTask ? 'Modifica attività' : 'Nuova attività'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descrizione *
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Ctrl + Invio per salvare
                  </span>
                </div>
                <textarea
                  ref={descriptionRef}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input w-full resize-none"
                  rows={3}
                  placeholder="Descrizione della task"
                  data-testid="planner-modal-descrizione"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: parseInt(e.target.value) }))}
                    className="input w-full"
                    data-testid="planner-modal-categoria"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Giorno
                  </label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
                    className="input w-full"
                    data-testid="planner-modal-giorno"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.key} value={day.key}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>


            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline"
                data-testid="planner-modal-annulla"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveTask}
                className="btn btn-primary"
                disabled={!formData.description.trim()}
                data-testid="planner-modal-salva"
              >
                {editingTask ? 'Modifica' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};