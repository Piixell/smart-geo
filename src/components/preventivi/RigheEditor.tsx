import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, GripVertical, CornerDownRight } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  value: string;
  onChange: (v: string) => void;
  testId: string;
  placeholder?: string;
  aggiungi?: string;
  sottovoci?: boolean;
}

interface Riga { id: number; testo: string; sotto: boolean }

let seq = 0;
// Una riga per voce, salvate come testo separato da a capo; le sottovoci iniziano con "- "
const dividi = (v: string, sottovoci: boolean): Riga[] => (v === '' ? [] : v.split('\n').map((r) => {
  const sotto = sottovoci && /^\s*-/.test(r);
  return { id: ++seq, testo: sotto ? r.replace(/^\s*-\s?/, '') : r, sotto };
}));
const unisci = (r: Riga[]) => r.map((x, i) => (x.sotto && i > 0 ? `- ${x.testo}` : x.testo)).join('\n');

const etichette = (righe: Riga[]) => {
  let n = 0;
  let s = 0;
  return righe.map((r) => {
    if (r.sotto && n > 0) return `${String.fromCharCode(97 + s++)})`;
    s = 0;
    return `${++n}.`;
  });
};

const TestoEspandibile: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string; testId: string }> = ({ value, onChange, placeholder, testId }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [aperto, setAperto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = aperto ? `${el.scrollHeight + 2}px` : '2rem';
  }, [aperto, value]);
  return (
    <textarea ref={ref} rows={1} value={value} placeholder={placeholder} onFocus={() => setAperto(true)} onBlur={() => setAperto(false)}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
      className={`input min-w-0 flex-1 resize-none px-2 py-1 text-sm leading-6 ${aperto ? 'whitespace-pre-wrap' : 'overflow-hidden truncate whitespace-nowrap'}`} data-testid={testId} />
  );
};

const RigaOrdinabile: React.FC<{ riga: Riga; etichetta: string; testId: string; i: number; placeholder: string; sottovoci: boolean; onTesto: (t: string) => void; onSotto: () => void; onElimina: () => void }> = ({ riga, etichetta, testId, i, placeholder, sottovoci, onTesto, onSotto, onElimina }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: riga.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-start gap-1.5 ${riga.sotto ? 'pl-8' : ''} ${isDragging ? 'relative z-10 opacity-80' : ''}`} data-testid={`${testId}-voce-${i}${riga.sotto ? '-sotto' : ''}`}>
      <button type="button" {...attributes} {...listeners} className="mt-1.5 cursor-grab touch-none text-ink-300 hover:text-ink-600 active:cursor-grabbing" title="Trascina per riordinare" data-testid={`${testId}-trascina-${i}`}><GripVertical className="h-4 w-4" /></button>
      <span className="mt-1.5 w-5 shrink-0 text-right text-xs tabular-nums text-ink-400">{etichetta}</span>
      <TestoEspandibile value={riga.testo} onChange={onTesto} placeholder={placeholder} testId={`${testId}-riga-${i}`} />
      {sottovoci && (
        <button type="button" onClick={onSotto} className={`mt-1.5 ${riga.sotto ? 'text-ink-800' : 'text-ink-300'} hover:text-ink-900`} title={riga.sotto ? 'Rendi condizione principale' : 'Rendi sottovoce'} data-testid={`${testId}-sotto-${i}`}><CornerDownRight className="h-4 w-4" /></button>
      )}
      <button type="button" onClick={onElimina} className="mt-1.5 text-red-400 hover:text-red-600" title="Elimina riga" data-testid={`${testId}-elimina-${i}`}><Trash2 className="h-4 w-4" /></button>
    </div>
  );
};

export const RigheEditor: React.FC<Props> = ({ value, onChange, testId, placeholder = 'descrizione attività', aggiungi = 'Aggiungi attività', sottovoci = false }) => {
  const [righe, setRighe] = useState(() => dividi(value, sottovoci));
  useEffect(() => {
    setRighe((r) => (unisci(r) === value ? r : dividi(value, sottovoci)));
  }, [value, sottovoci]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const salva = (r: Riga[]) => {
    setRighe(r);
    onChange(unisci(r));
  };
  const modifica = (id: number, cambi: Partial<Riga>) => salva(righe.map((x) => (x.id === id ? { ...x, ...cambi } : x)));
  const fineTrascina = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    salva(arrayMove(righe, righe.findIndex((r) => r.id === active.id), righe.findIndex((r) => r.id === over.id)));
  };
  const nomi = etichette(righe);
  const bottone = 'inline-flex items-center gap-1 text-xs font-semibold text-ink-600 hover:text-ink-900';

  return (
    <div className="space-y-1" data-testid={testId}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={fineTrascina}>
        <SortableContext items={righe.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {righe.map((r, i) => (
            <RigaOrdinabile key={r.id} riga={i === 0 ? { ...r, sotto: false } : r} etichetta={nomi[i]} testId={testId} i={i} placeholder={placeholder} sottovoci={sottovoci}
              onTesto={(testo) => modifica(r.id, { testo })} onSotto={() => modifica(r.id, { sotto: !r.sotto })} onElimina={() => salva(righe.filter((x) => x.id !== r.id))} />
          ))}
        </SortableContext>
      </DndContext>
      <div className="ml-12 flex flex-wrap gap-4">
        <button type="button" onClick={() => salva([...righe, { id: ++seq, testo: '', sotto: false }])} className={bottone} data-testid={`${testId}-aggiungi`}>
          <Plus className="h-3.5 w-3.5" /> {aggiungi}
        </button>
        {sottovoci && (
          <button type="button" onClick={() => salva([...righe, { id: ++seq, testo: '', sotto: true }])} className={bottone} data-testid={`${testId}-aggiungi-sotto`}>
            <CornerDownRight className="h-3.5 w-3.5" /> Aggiungi sottovoce
          </button>
        )}
      </div>
    </div>
  );
};
