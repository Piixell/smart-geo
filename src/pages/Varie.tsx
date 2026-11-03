import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, Trash2, X, Copy, User, Search } from 'lucide-react';
import { PagamentoToggle, statoPagamento } from '../components/PagamentoToggle';
import { FiltroSelect } from '../components/FiltroSelect';
import { supabase } from '../services/supabase';
import { cfg } from '../services/impostazioni';
import { useApriDaRicerca } from '../hooks/useApriDaRicerca';
import { useFiltroDashboard, filtroDashboardInUrl } from '../hooks/useFiltroDashboard';
import { useAuthStore } from '../store/authStore';
import { syncRubricaFromPratica } from '../utils/rubricaSync';
import { conMail2, mail2Opzionale } from '../utils/mail2';
import { ContattiPratica, RUBRICA_DEFAULT, type RubricaFlags } from '../components/ContattiPratica';
import { useConfermaRubrica } from '../components/ConfermaRubrica';
import { ContextMenu } from '../components/ContextMenu';
import { CommittenteSelect } from '../components/CommittenteSelect';
import type { Varie, StatoVarie, TipoIncarico } from '../types';
import toast from 'react-hot-toast';

import { caricaTipiIncaricoVarie, type TipoIncaricoVarie } from '../components/TipiIncaricoVarieSection';
import { ContattiPraticaModal } from '../components/ContattiPraticaModal';


export const VariePage: React.FC = () => {
  const [varie, setVarie] = useState<Varie[]>([]);
  const [stati, setStati] = useState<StatoVarie[]>([]);
  const [tipiIncarico, setTipiIncarico] = useState<TipoIncarico[]>([]);
  const [tipiVarie, setTipiVarie] = useState<TipoIncaricoVarie[]>([]);
  useEffect(() => {
    caricaTipiIncaricoVarie().then(setTipiVarie);
  }, []);
  const TIPI_INCARICO_VARIE = tipiVarie.map((t) => t.descrizione);
  const conApe = (tipo: string) => !!tipiVarie.find((t) => t.descrizione === tipo)?.ape;
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
const [columnFilters, setColumnFilters] = useState<{
    stato: string;
    tipo_incarico: string;
    committente: string;
    proprieta: string;
    indirizzo: string;
    citta: string;
    note: string;
    acconto: 'all' | 'yes' | 'no';
    saldo: 'all' | 'yes' | 'no';
  }>({
    stato: '',
    tipo_incarico: '',
    committente: '',
    proprieta: '',
    indirizzo: '',
    citta: '',
    note: '',
    acconto: 'all',
    saldo: 'all'
  });
  const [presetFilters, setPresetFilters] = useState({
    nonPagate: false,
    omaggio: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(() => {
    const saved = localStorage.getItem('varie-records-per-page-v2');
    if (saved) {
      const parsed = parseInt(saved);
      if ([25, 50, 100, 200, 500, 1000].includes(parsed)) {
        return parsed;
      }
    }
    return cfg().pagine.righePratiche;
  });
  const [totalRecords, setTotalRecords] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingVaria, setEditingVaria] = useState<Varie | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; varia: Varie | null }>({ x: 0, y: 0, varia: null });
  const [showContextMenuActionModal, setShowContextMenuActionModal] = useState<'status' | 'contatto' | null>(null);
  const [selectedVariaForContextMenu, setSelectedVariaForContextMenu] = useState<Varie | null>(null);
  const [newStatusForContextMenu, setNewStatusForContextMenu] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    committente: '',
    proprieta: '',
    proprieta2: '',
    indirizzo: '',
    citta: '',
    telefono: '',
    telefono2: '',
    mail: '',
    mail2: '',
    registrazione: '',
    tipo_incarico: '',
    acconto: false,
    saldo: false,
    omaggio: false,
    note: ''
  });
  const { user, loading: authLoading } = useAuthStore();

  const activeFilterCount = Object.values(columnFilters).filter(val => val !== '' && val !== 'all').length + Object.values(presetFilters).filter(Boolean).length;

  // Protezione contro errori delle estensioni del browser
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.filename && (
        event.filename.includes('chrome-extension://') ||
        event.filename.includes('moz-extension://') ||
        event.filename.includes('safari-extension://') ||
        event.message?.includes('UltraWide') ||
        event.message?.includes('newValue')
      )) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason === 'string' && (
        event.reason.includes('chrome-extension://') ||
        event.reason.includes('UltraWide') ||
        event.reason.includes('newValue')
      )) {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Chiusura menu contestuale al click esterno o tasto ESC
  useEffect(() => {
    if (!contextMenu.varia) return;

    const handleClick = () => setContextMenu({ x: 0, y: 0, varia: null });
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu({ x: 0, y: 0, varia: null });
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu.varia]);

  const ultimaRichiesta = React.useRef(0);
  const fetchData = async (customFilters?: {
    columnFilters?: typeof columnFilters;
    presetFilters?: typeof presetFilters;
    page?: number;
    perPage?: number;
  }) => {
    const mia = ++ultimaRichiesta.current;
    try {
      setLoading(true);

      if (!user?.id) {
        console.warn('Utente non autenticato, impossibile caricare i dati');
        setLoading(false);
        return;
      }

      const currentFilters = customFilters?.columnFilters ?? columnFilters;
      const currentPresetFilters = customFilters?.presetFilters ?? presetFilters;
      const currentPageParam = customFilters?.page ?? currentPage;
      const currentPerPage = customFilters?.perPage ?? recordsPerPage;

      const searchParts: string[] = [];
      if (currentFilters.committente.trim()) {
        searchParts.push(`committente.ilike.%${currentFilters.committente}%`);
      }
      if (currentFilters.proprieta.trim()) {
        searchParts.push(`proprieta.ilike.%${currentFilters.proprieta}%,proprieta2.ilike.%${currentFilters.proprieta}%`);
      }
      if (currentFilters.indirizzo.trim()) {
        searchParts.push(`indirizzo.ilike.%${currentFilters.indirizzo}%`);
      }
      if (currentFilters.citta.trim()) {
        searchParts.push(`citta.ilike.%${currentFilters.citta}%`);
      }
      if (currentFilters.note.trim()) {
        searchParts.push(`note.ilike.%${currentFilters.note}%`);
      }
      if (currentFilters.tipo_incarico.trim()) {
        searchParts.push(`tipo_incarico.ilike.%${currentFilters.tipo_incarico}%`);
      }

      let countQuery = supabase
        .from('varie')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (searchParts.length > 0) {
        countQuery = countQuery.or(searchParts.join(','));
      }

      if (currentFilters.stato) {
        countQuery = countQuery.eq('registrazione', parseInt(currentFilters.stato));
      }

      if (currentFilters.acconto === 'yes') {
        countQuery = countQuery.eq('acconto', true).not('omaggio', 'is', true);
      } else if (currentFilters.acconto === 'no') {
        countQuery = countQuery.eq('acconto', false);
      }

      if (currentFilters.saldo === 'yes') {
        countQuery = countQuery.eq('saldo', true).not('omaggio', 'is', true);
      } else if (currentFilters.saldo === 'no') {
        countQuery = countQuery.eq('saldo', false);
      }

      if (currentPresetFilters.omaggio) {
        countQuery = countQuery.eq('omaggio', true);
      }

      if (currentPresetFilters.nonPagate) {
        const { data: statiNonPagata } = await supabase
          .from('stati_varie')
          .select('id')
          .eq('filtro_non_pagata', 1);
        const ids = (statiNonPagata || []).map(s => s.id);
        countQuery = countQuery.eq('saldo', false).not('omaggio', 'is', true).neq('registrazione', 4);
        if (ids.length > 0) {
          countQuery = countQuery.in('registrazione', ids);
        }
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('Errore nel conteggio:', countError);
        if (countError.message?.includes('JWT') || countError.message?.includes('session')) {
          toast.error('Sessione scaduta. Effettua nuovamente il login.');
        }
      } else {
        if (mia === ultimaRichiesta.current) setTotalRecords(count || 0);
      }

      let query = supabase
        .from('varie')
        .select(`
          *,
          registrazione_info:stati_varie(id, descrizione, colore, ordinamento)
        `)
        .eq('user_id', user?.id)
        .order('registrazione_info(ordinamento)', { ascending: true })
        .order('stato_modificato_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (searchParts.length > 0) {
        query = query.or(searchParts.join(','));
      }

      if (currentFilters.stato) {
        query = query.eq('registrazione', parseInt(currentFilters.stato));
      }

      if (currentFilters.acconto === 'yes') {
        query = query.eq('acconto', true).not('omaggio', 'is', true);
      } else if (currentFilters.acconto === 'no') {
        query = query.eq('acconto', false);
      }

      if (currentFilters.saldo === 'yes') {
        query = query.eq('saldo', true).not('omaggio', 'is', true);
      } else if (currentFilters.saldo === 'no') {
        query = query.eq('saldo', false);
      }

      if (currentPresetFilters.omaggio) {
        query = query.eq('omaggio', true);
      }

      if (currentPresetFilters.nonPagate) {
        const { data: statiNonPagata } = await supabase
          .from('stati_varie')
          .select('id')
          .eq('filtro_non_pagata', 1);
        const ids = (statiNonPagata || []).map(s => s.id);
        query = query.eq('saldo', false).not('omaggio', 'is', true).neq('registrazione', 4);
        if (ids.length > 0) {
          query = query.in('registrazione', ids);
        }
      }

      const from = (currentPageParam - 1) * currentPerPage;
      const to = from + currentPerPage - 1;
      query = query.range(from, to);

      const { data: varieData, error: varieError } = await query;

      if (varieError) {
        console.error('Errore nel caricamento varie:', varieError);
        if (varieError.message?.includes('JWT') || varieError.message?.includes('session')) {
          toast.error('Sessione scaduta. Effettua nuovamente il login.');
        } else {
          toast.error('Errore nel caricamento delle varie');
        }
        return;
      }

      const { data: statiData, error: statiError } = await supabase
        .from('stati_varie')
        .select('*')
        .order('ordinamento');

      if (statiError) {
        console.error('Errore caricamento stati:', statiError);
      } else {
        setStati(statiData || []);
      }

      const { data: tipiData, error: tipiError } = await supabase
        .from('tipi_incarico')
        .select('*')
        .order('descrizione');

      if (tipiError) {
        console.error('Errore caricamento tipi incarico:', tipiError);
      } else {
        setTipiIncarico(tipiData || []);
      }

      // una risposta più vecchia non deve sovrascrivere quella dell'ultimo filtro scelto
      if (mia !== ultimaRichiesta.current) return;
      setVarie(varieData || []);
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const daDashboard = React.useRef(filtroDashboardInUrl());
  useEffect(() => {
    // Aspetta che l'autenticazione sia inizializzata
    const initializeData = async () => {
      // Attende che l'autenticazione sia completata
      if (authLoading) {
        console.log('Autenticazione in corso...');
        return;
      }

      // Se c'è un user, carica i dati
      if (user?.id) {
        console.log('User autenticato, caricamento dati...');
        if (!daDashboard.current) await fetchData();
      }
      // Se l'user è null ma lo store ha finito di caricare, significa che non è autenticato
      else if (user === null) {
        console.warn('User non autenticato');
        setLoading(false);
      }
    };

    initializeData();
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('varie-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'varie',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          setLastUpdateTime(new Date());

          if (payload.eventType === 'INSERT') {
            const { data: newRecord, error } = await supabase
              .from('varie')
              .select(`
                *,
                registrazione_info:stati_varie(id, descrizione, colore)
              `).eq('user_id', user?.id)
              .eq('id', payload.new.id)
              .single();

            if (!error && newRecord) {
              setVarie(prev => {
                if (prev.some(v => v.id === newRecord.id)) {
                  return prev;
                }
                return [newRecord, ...prev];
              });
              setTotalRecords(prev => prev + 1);
              toast.success('Nuova varia aggiunta');
            }
          }
          else if (payload.eventType === 'UPDATE') {
            const { data: updatedRecord, error } = await supabase
              .from('varie')
              .select(`
                *,
                registrazione_info:stati_varie(id, descrizione, colore)
              `).eq('user_id', user?.id)
              .eq('id', payload.new.id)
              .single();

            if (!error && updatedRecord) {
              setVarie(prev =>
                prev.map(v =>
                  v.id === updatedRecord.id ? updatedRecord : v
                )
              );

              const oldVaria = payload.old as Varie;
              const messaggiToast: string[] = [];

              if (oldVaria.acconto !== updatedRecord.acconto) {
                messaggiToast.push(updatedRecord.acconto ? 'Acconto marcato come ricevuto' : 'Acconto marcato come non ricevuto');
              }
              if (oldVaria.saldo !== updatedRecord.saldo) {
                messaggiToast.push(updatedRecord.saldo ? 'Saldo marcato come ricevuto' : 'Saldo marcato come non ricevuto');
              }
              if (oldVaria.omaggio !== updatedRecord.omaggio) {
                messaggiToast.push(updatedRecord.omaggio ? 'Omaggio marcato come consegnato' : 'Omaggio marcato come non consegnato');
              }
              if (oldVaria.registrazione !== updatedRecord.registrazione) {
                const oldStato = stati.find(s => s.id === oldVaria.registrazione)?.descrizione || 'N/A';
                const newStato = stati.find(s => s.id === updatedRecord.registrazione)?.descrizione || 'N/A';
                messaggiToast.push(`Stato cambiato da "${oldStato}" a "${newStato}"`);
              }

              if (messaggiToast.length > 0) {
                toast.success(messaggiToast[0]);
              }
            }
          }
          else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setVarie(prev => prev.filter(v => v.id !== deletedId));
            setTotalRecords(prev => Math.max(0, prev - 1));
            toast.success('Varia eliminata');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setRealtimeConnected(false);
    };
  }, [user?.id, stati]);

  const handleColumnFilterChange = useCallback((key: keyof typeof columnFilters, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleApplyFilter = (overrides: Partial<typeof columnFilters>) => {
    const newFilters = { ...columnFilters, ...overrides };
    setColumnFilters(newFilters);
    setCurrentPage(1);
    fetchData({ columnFilters: newFilters, page: 1 });
  };

  const handlePresetFilterToggle = (filterName: keyof typeof presetFilters) => {
    const newPresetFilters = {
      ...presetFilters,
      [filterName]: !presetFilters[filterName]
    };
    setPresetFilters(newPresetFilters);
    setCurrentPage(1);
    fetchData({ columnFilters, presetFilters: newPresetFilters, page: 1 });
  };

  const handleResetFilters = () => {
    const defaultFilters: typeof columnFilters = {
      stato: '', tipo_incarico: '', committente: '', proprieta: '', indirizzo: '', citta: '', note: '',
      acconto: 'all', saldo: 'all'
    };
    const defaultPresetFilters = { nonPagate: false, omaggio: false };
    setColumnFilters(defaultFilters);
    setPresetFilters(defaultPresetFilters);
    setCurrentPage(1);
    fetchData({ columnFilters: defaultFilters, presetFilters: defaultPresetFilters, page: 1 });
  };

  const handleContextMenu = (e: React.MouseEvent, varia: Varie) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, varia });
  };

  const handleContextMenuAction = (action: 'edit' | 'status' | 'contact' | 'duplicate' | 'delete', varia: Varie) => {
    setContextMenu({ x: 0, y: 0, varia: null });
    if (action === 'edit') {
      openModal(varia);
    } else if (action === 'status') {
      setSelectedVariaForContextMenu(varia);
      setNewStatusForContextMenu(varia.registrazione?.toString() || '');
      setShowContextMenuActionModal('status');
    } else if (action === 'contact') {
      setSelectedVariaForContextMenu(varia);
      setShowContextMenuActionModal('contatto');
    } else if (action === 'duplicate') {
      handleDuplicateVaria(varia);
    } else if (action === 'delete') {
      handleDeleteVaria(varia.id);
    }
  };

  const handleChangeStatusFromContextMenu = async () => {
    if (!selectedVariaForContextMenu || !newStatusForContextMenu) return;
    
    const { error } = await supabase
      .from('varie')
      .update({ registrazione: parseInt(newStatusForContextMenu) })
      .eq('id', selectedVariaForContextMenu.id)
      .eq('user_id', user?.id);
      
    if (error) {
      toast.error('Errore nel cambio stato');
    } else {
      toast.success('Stato aggiornato con successo');
      setShowContextMenuActionModal(null);
      setSelectedVariaForContextMenu(null);
    }
  };

  const handleDuplicateVaria = async (varia: Varie) => {
    try {
      const { id, created_at, updated_at, progressivo, registrazione_info, ...variaData } = varia as Varie & { updated_at?: string; progressivo?: string; registrazione_info?: unknown };
      
      const duplicatedData = {
        ...variaData,
        committente: `${variaData.committente}`,
        registrazione: 1,
        acconto: false,
        saldo: false,
        created_at: new Date().toISOString(),
        user_id: user?.id
      };

      const { error } = await supabase
        .from('varie')
        .insert([duplicatedData]);

      if (error) {
        console.error('Errore duplicazione varia:', error);
        toast.error('Errore nella duplicazione della varia');
        return;
      }

      toast.success('Varia duplicata con successo');
      fetchData();
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nella duplicazione della varia');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData({ page });
  };

  const handleRecordsPerPageChange = (newRecordsPerPage: number) => {
    setRecordsPerPage(newRecordsPerPage);
    localStorage.setItem('varie-records-per-page-v2', newRecordsPerPage.toString());
    setCurrentPage(1);
    fetchData({
      perPage: newRecordsPerPage,
      page: 1
    });
  };

  const getTotalPages = () => {
    return Math.ceil(totalRecords / recordsPerPage);
  };

  const handleCiclaPagamento = async (varia: Varie) => {
    if (varia.omaggio) return;
    const prossimo = (statoPagamento(varia.acconto, varia.saldo) + 1) % 3;
    const updateData = { acconto: prossimo >= 1, saldo: prossimo === 2 };
    try {
      const { error } = await supabase
        .from('varie')
        .update(updateData)
        .eq('id', varia.id)
        .eq('user_id', user?.id);

      if (error) {
        toast.error('Errore nell\'aggiornamento del pagamento');
        return;
      }

      setVarie(prev => prev.map(v => (v.id === varia.id ? { ...v, ...updateData } as Varie : v)));
      toast.success(['Pagamento azzerato', 'Acconto segnato', 'Saldo segnato'][prossimo]);
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nell\'aggiornamento');
    }
  };

  const handleDeleteVaria = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa varia?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('varie')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        toast.error('Errore nell\'eliminazione della varia');
        return;
      }

      toast.success('Varia eliminata con successo');
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nell\'eliminazione');
    }
  };

  const formatTelefono = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    const limitedValue = numericValue.slice(0, 10);

    if (limitedValue.length <= 3) {
      return limitedValue;
    } else if (limitedValue.length <= 6) {
      return `${limitedValue.slice(0, 3)} ${limitedValue.slice(3)}`;
    } else {
      return `${limitedValue.slice(0, 3)} ${limitedValue.slice(3, 6)} ${limitedValue.slice(6)}`;
    }
  };

  // Funzione per combinare i telefoni
  // Funzione per combinare le proprietà
  const combineProprieta = (proprieta1: string | null | undefined, proprieta2: string | null | undefined): React.ReactNode => {
    if (!proprieta1 && !proprieta2) return '-';
    if (!proprieta2) return proprieta1 || '-';
    if (!proprieta1) return proprieta2 || '-';

    return <><span className="block">{proprieta1}</span><span className="block">{proprieta2}</span></>;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!e || !e.target) {
      console.warn('Evento malformato ignorato');
      return;
    }

    const { name, value, type } = e.target;

    if (!name) {
      console.warn('Nome campo non definito');
      return;
    }

    let processedValue = value;

    if (name === 'telefono' && type !== 'checkbox') {
      processedValue = formatTelefono(value);
    }

    if (name === 'telefono2' && type !== 'checkbox') {
      processedValue = formatTelefono(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : processedValue
    }));
  };

  const [rubricaFlags, setRubricaFlags] = useState<RubricaFlags>(RUBRICA_DEFAULT);
  const { chiedi: chiediConfermaRubrica, dialog: dialogRubrica } = useConfermaRubrica();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.committente.trim()) {
      toast.error('Il campo committente è obbligatorio');
      return;
    }

    const campiMancanti = [
      !formData.proprieta?.trim() && 'Proprietario 1',
      !formData.indirizzo?.trim() && 'Indirizzo',
      !formData.citta?.trim() && 'Città',
      !formData.registrazione && 'Stato',
      !formData.tipo_incarico?.trim() && 'Tipo Incarico',
    ].filter(Boolean);
    if (campiMancanti.length > 0) {
      toast.error(`Campi obbligatori mancanti: ${campiMancanti.join(', ')}`);
      return;
    }

    const flagsRubrica = await chiediConfermaRubrica(formData, rubricaFlags);
    if (!flagsRubrica) return;
    setRubricaFlags(flagsRubrica);

    setSubmitting(true);
    try {
      const dataToSave = conMail2({
        ...formData,
        registrazione: formData.registrazione ? parseInt(formData.registrazione) : null,
        tipo_incarico: formData.tipo_incarico.trim() || null,
        proprieta2: formData.proprieta2.trim() || null,
        telefono2: formData.telefono2.trim() || null,
        user_id: user?.id
      }, editingVaria?.mail2);

      if (editingVaria) {
        const { error } = await supabase
          .from('varie')
          .update(dataToSave)
          .eq('id', editingVaria.id)
          .eq('user_id', user?.id);

        if (error) {
          console.error('Errore modifica:', error);
          toast.error('Errore nella modifica della varia');
          return;
        }

        toast.success('Varia modificata con successo');
      } else {
        const { error } = await supabase
          .from('varie')
          .insert([dataToSave]);

        if (error) {
          console.error('Errore inserimento:', error);
          toast.error('Errore nel salvataggio della varia');
          return;
        }

        toast.success('Varia creata con successo');

        // Creazione automatica pratica APE se il tipo di incarico ha il flag ape
        if (dataToSave.tipo_incarico) {
          const tipoIncaricoTrovato = tipiIncarico.find(
            t => t.descrizione.toLowerCase() === dataToSave.tipo_incarico!.toLowerCase()
          );
          if (tipoIncaricoTrovato?.ape || conApe(dataToSave.tipo_incarico)) {
            try {
              const { error: apeError } = await supabase
                .from('ape')
                .insert([{
                  committente: formData.committente.trim(),
                  proprieta: formData.proprieta.trim() || null,
                  proprieta2: formData.proprieta2.trim() || null,
                  indirizzo: formData.indirizzo.trim() || null,
                  citta: formData.citta.trim() || null,
                  mail: formData.mail.trim() || null,
                  telefono: formData.telefono.trim() || null,
                  telefono2: formData.telefono2.trim() || null,
                  ...mail2Opzionale(formData.mail2),
                  note: formData.note.trim() || null,
                  registrazione: 1,
                  progressivo: '',
                  user_id: user?.id
                }]);

              if (apeError) {
                console.error('Errore creazione pratica APE:', apeError);
                toast.error('Varia creata ma errore nella creazione della pratica APE');
              } else {
                toast.success('Pratica APE creata automaticamente');
              }
            } catch (apeError) {
              console.error('Errore creazione pratica APE:', apeError);
            }
          }
        }
      }

      // Sync contatto con rubrica
      await syncRubricaFromPratica(
        flagsRubrica.p1 ? formData.proprieta : null,
        formData.telefono,
        formData.mail,
        formData.committente,
        flagsRubrica.p2 ? formData.proprieta2 : null,
        formData.telefono2,
        formData.mail2
      );

      closeModal();
      fetchData();
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setSubmitting(false);
    }
  };

  useApriDaRicerca<Varie>('varie', (r) => openModal(r));
  useFiltroDashboard(!!user?.id && !authLoading, ({ stato, incassare, nuovo }) => {
    if (nuovo) {
      openModal();
      return;
    }
    const cf = { ...columnFilters, stato };
    const pf = { ...presetFilters, nonPagate: incassare };
    setColumnFilters(cf);
    setPresetFilters(pf);
    setCurrentPage(1);
    fetchData({ columnFilters: cf, presetFilters: pf, page: 1 });
  });

  const openModal = (varia?: Varie) => {
    if (varia) {
      setEditingVaria(varia);
      setFormData({
        committente: varia.committente,
        proprieta: varia.proprieta || '',
        proprieta2: varia.proprieta2 || '',
        indirizzo: varia.indirizzo || '',
        citta: varia.citta || '',
        telefono: varia.telefono || '',
        telefono2: varia.telefono2 || '',
        mail: varia.mail || '',
        mail2: varia.mail2 || '',
        registrazione: varia.registrazione?.toString() || '',
        tipo_incarico: varia.tipo_incarico || '',
        acconto: varia.acconto,
        saldo: varia.saldo,
        omaggio: varia.omaggio,
        note: varia.note || ''
      });
    } else {
      setEditingVaria(null);
      setFormData({
        committente: '',
        proprieta: '',
        proprieta2: '',
        indirizzo: '',
        citta: '',
        telefono: '',
        telefono2: '',
        mail: '',
        mail2: '',
        registrazione: '',
        tipo_incarico: '',
        acconto: false,
        saldo: false,
        omaggio: false,
        note: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVaria(null);
    setFormData({
      committente: '',
      proprieta: '',
      proprieta2: '',
      indirizzo: '',
      citta: '',
      telefono: '',
      telefono2: '',
      mail: '',
      mail2: '',
      registrazione: '',
      tipo_incarico: '',
      acconto: false,
      saldo: false,
      omaggio: false,
      note: ''
    });
  };

  const handleSaldoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuovoSaldo = e.target.checked;

    setFormData(prev => ({
      ...prev,
      saldo: nuovoSaldo,
      acconto: nuovoSaldo ? true : prev.acconto
    }));
  };

  const getStatoStyle = (stato: StatoVarie | undefined) => {
    if (!stato || !stato.colore) return 'bg-ink-100 text-ink-800';
    return 'text-white';
  };

  const getStatoBackgroundColor = (stato: StatoVarie | undefined) => {
    if (!stato || !stato.colore) return '#6b7280';
    return stato.colore;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-3 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-ink-700">Varie</h1>
            <p className="text-ink-500">Gestione pratiche varie</p>
            {realtimeConnected && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-topo-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-topo-600">
                  Aggiornamenti in tempo reale attivi
                  {lastUpdateTime && (
                    <span className="ml-1 text-ink-400">
                      (ultimo: {lastUpdateTime.toLocaleTimeString('it-IT')})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink-600 bg-ink-100 rounded-md hover:bg-ink-200 transition-colors"
              >
                <X className="w-4 h-4" />
                Reset filtri
                <span className="bg-signal-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => openModal()}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuova Varia
            </button>
          </div>
        </div>

      {/* Filtri preimpostati */}
      <div className="flex flex-wrap gap-3">
        <label className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-150 ${
          presetFilters.nonPagate
            ? 'bg-red-500 text-white shadow-md'
            : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
        }`}>
          <input
            type="checkbox"
            checked={presetFilters.nonPagate}
            onChange={() => handlePresetFilterToggle('nonPagate')}
            className="sr-only"
          />
          Non pagate
        </label>
        <label className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-150 ${
          presetFilters.omaggio
            ? 'bg-warning-500 text-white shadow-md'
            : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
        }`}>
          <input
            type="checkbox"
            checked={presetFilters.omaggio}
            onChange={() => handlePresetFilterToggle('omaggio')}
            className="sr-only"
          />
          Omaggio
        </label>
      </div>

      {/* Tabella */}
      <div className="card card-flush p-0 flex-1" style={{ height: 'calc(100vh - 300px)', overflow: 'hidden' }}>
        <div className="overflow-x-auto h-full overflow-y-auto">
          <table className="w-full tabella-distesa" style={{ minHeight: '400px' }}>
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left">Stato</th>
                <th className="table-cell text-left">Committente</th>
                <th className="table-cell text-left">Proprietario</th>
                <th className="table-cell text-left">Tipo Incarico</th>
                <th className="table-cell text-left">Città</th>
                <th className="table-cell text-left">Indirizzo</th>
                <th className="table-cell text-left">Note</th>
                <th className="table-cell text-center">Pagamento</th>
              </tr>
              {/* Riga filtri inline */}
              <tr className="bg-ink-100 border-b border-ink-200">
                <td className="px-2 py-1.5">
                  <div className="relative">
                    <select
                      value={columnFilters.stato}
                      onChange={(e) => handleApplyFilter({ stato: e.target.value })}
                      className="w-full text-xs px-2 py-1.5 border border-ink-300 rounded-md bg-white text-ink-700 appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-signal-500/20 focus:border-signal-500"
                    >
                      <option value="" className="bg-white">Tutti</option>
                      {stati.map((stato) => (
                        <option key={stato.id} value={stato.id} className="bg-white">
                          {stato.descrizione}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-ink-400 pointer-events-none" />
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={columnFilters.committente}
                      onChange={(e) => handleColumnFilterChange('committente', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                          handleApplyFilter({ committente: (e.target as HTMLInputElement).value });
                        }
                      }}
                      placeholder="Cerca..."
                      className="w-full text-xs px-2 py-1.5 pr-7 border border-ink-300 rounded-md bg-white text-ink-700 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-signal-500/20 focus:border-signal-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyFilter({ committente: columnFilters.committente })}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-200 transition-colors"
                      title="Cerca"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={columnFilters.proprieta}
                      onChange={(e) => handleColumnFilterChange('proprieta', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                          handleApplyFilter({ proprieta: (e.target as HTMLInputElement).value });
                        }
                      }}
                      placeholder="Cerca..."
                      className="w-full text-xs px-2 py-1.5 pr-7 border border-ink-300 rounded-md bg-white text-ink-700 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-signal-500/20 focus:border-signal-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyFilter({ proprieta: columnFilters.proprieta })}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-200 transition-colors"
                      title="Cerca"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={columnFilters.tipo_incarico}
                      onChange={(e) => handleColumnFilterChange('tipo_incarico', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                          handleApplyFilter({ tipo_incarico: (e.target as HTMLInputElement).value });
                        }
                      }}
                      placeholder="Cerca..."
                      className="w-full text-xs px-2 py-1.5 pr-7 border border-ink-300 rounded-md bg-white text-ink-700 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-signal-500/20 focus:border-signal-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyFilter({ tipo_incarico: columnFilters.tipo_incarico })}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-200 transition-colors"
                      title="Cerca"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={columnFilters.citta}
                      onChange={(e) => handleColumnFilterChange('citta', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                          handleApplyFilter({ citta: (e.target as HTMLInputElement).value });
                        }
                      }}
                      placeholder="Cerca..."
                      className="w-full text-xs px-2 py-1.5 pr-7 border border-ink-300 rounded-md bg-white text-ink-700 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-signal-500/20 focus:border-signal-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyFilter({ citta: columnFilters.citta })}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-200 transition-colors"
                      title="Cerca"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={columnFilters.indirizzo}
                      onChange={(e) => handleColumnFilterChange('indirizzo', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                          handleApplyFilter({ indirizzo: (e.target as HTMLInputElement).value });
                        }
                      }}
                      placeholder="Cerca..."
                      className="w-full text-xs px-2 py-1.5 pr-7 border border-ink-300 rounded-md bg-white text-ink-700 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-signal-500/20 focus:border-signal-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyFilter({ indirizzo: columnFilters.indirizzo })}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-200 transition-colors"
                      title="Cerca"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={columnFilters.note}
                      onChange={(e) => handleColumnFilterChange('note', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                          handleApplyFilter({ note: (e.target as HTMLInputElement).value });
                        }
                      }}
                      placeholder="Cerca..."
                      className="w-full text-xs px-2 py-1.5 pr-7 border border-ink-300 rounded-md bg-white text-ink-700 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-signal-500/20 focus:border-signal-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyFilter({ note: columnFilters.note })}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-200 transition-colors"
                      title="Cerca"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <FiltroSelect
                    value={columnFilters.saldo === 'yes' ? 'saldato' : columnFilters.acconto === 'yes' ? 'acconto' : columnFilters.acconto === 'no' ? 'da_pagare' : 'all'}
                    onChange={(v) => handleApplyFilter(
                      v === 'saldato' ? { acconto: 'all', saldo: 'yes' }
                        : v === 'acconto' ? { acconto: 'yes', saldo: 'no' }
                        : v === 'da_pagare' ? { acconto: 'no', saldo: 'no' }
                        : { acconto: 'all', saldo: 'all' }
                    )}
                    options={[
                      { value: 'all', label: 'Tutti' },
                      { value: 'da_pagare', label: 'Da pagare' },
                      { value: 'acconto', label: 'Acconto' },
                      { value: 'saldato', label: 'Saldato' },
                    ]}
                    testId="varie-filtro-pagamento-select"
                  />
                </td>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-ink-100">
              {loading || authLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-ink-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-signal-500"></div>
                      <span className="ml-2">
                        {authLoading ? 'Verifica autenticazione...' : 'Caricamento...'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : varie.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-ink-500">
                    Nessuna varia trovata
                  </td>
                </tr>
              ) : (
                varie.map((varia) => (
                  <tr key={varia.id} className="table-row cursor-pointer hover:bg-ink-50" onContextMenu={(e) => handleContextMenu(e, varia)} onDoubleClick={(e) => { if (!(e.target as HTMLElement).closest('button, a, input, select, textarea')) openModal(varia); }} title="Doppio clic per modificare" data-testid={`riga-varia-${varia.id}`}>
                    <td className="table-cell">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getStatoStyle(varia.registrazione_info)}`}
                        style={{ backgroundColor: getStatoBackgroundColor(varia.registrazione_info) }}
                      >
                        {varia.registrazione_info?.descrizione || 'N/A'}
                      </span>
                    </td>
                    <td className="table-cell text-ink-600">{varia.committente}</td>
                    <td className="table-cell text-ink-600">{combineProprieta(varia.proprieta, varia.proprieta2)}</td>
                    <td className="table-cell text-ink-600">{varia.tipo_incarico || '-'}</td>
                    <td className="table-cell text-ink-600 max-w-xs truncate">{varia.citta || '-'}</td>
                    <td className="table-cell text-ink-600 max-w-xs truncate">{varia.indirizzo || '-'}</td>
                    <td className="table-cell text-ink-600 max-w-xs truncate">{varia.note || '-'}</td>
                    <td className="table-cell text-center">
                      <PagamentoToggle
                        stato={statoPagamento(varia.acconto, varia.saldo)}
                        omaggio={varia.omaggio}
                        onClick={() => handleCiclaPagamento(varia)}
                        testId={`varie-pagamento-${varia.id}`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Controlli Paginazione */}
        {varie.length > 0 && (
          <div className="px-6 py-4 border-t border-ink-200 bg-ink-50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-ink-500">
                Mostrando {Math.min((currentPage - 1) * recordsPerPage + 1, totalRecords)} - {Math.min(currentPage * recordsPerPage, totalRecords)} di {totalRecords} varie
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-ink-500">Record:</span>
                  <select
                    value={recordsPerPage}
                    onChange={(e) => handleRecordsPerPageChange(parseInt(e.target.value))}
                    className="input py-1 px-2 text-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                  </select>
                </div>

                {getTotalPages() > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-ink-300 rounded-md hover:bg-ink-100 disabled:opacity-50 disabled:cursor-not-allowed text-ink-600"
                    >
                      ««
                    </button>

                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-ink-300 rounded-md hover:bg-ink-100 disabled:opacity-50 disabled:cursor-not-allowed text-ink-600"
                    >
                      ‹
                    </button>

                    {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                      let pageNum;
                      if (getTotalPages() <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= getTotalPages() - 2) {
                        pageNum = getTotalPages() - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-md ${currentPage === pageNum
                              ? 'bg-signal-500 text-white border-signal-500'
                              : 'border-ink-300 hover:bg-ink-100 text-ink-600'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === getTotalPages()}
                      className="px-3 py-1 text-sm border border-ink-300 rounded-md hover:bg-ink-100 disabled:opacity-50 disabled:cursor-not-allowed text-ink-600"
                    >
                      ›
                    </button>

                    <button
                      onClick={() => handlePageChange(getTotalPages())}
                      disabled={currentPage === getTotalPages()}
                      className="px-3 py-1 text-sm border border-ink-300 rounded-md hover:bg-ink-100 disabled:opacity-50 disabled:cursor-not-allowed text-ink-600"
                    >
                      »»
                    </button>
                  </div>
                )}
              </div>

              {getTotalPages() > 1 && (
                <div className="text-sm text-ink-500">
                  Pagina {currentPage} di {getTotalPages()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      </div>

      {/* Modal */}
      {dialogRubrica}
      {showModal && (
        <div className="modal-overlay">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVaria ? 'Modifica Varia' : 'Nuova Varia'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <ContattiPratica
                className="mb-6"
                valori={formData}
                onInputChange={handleInputChange}
                onPatch={(patch) => setFormData(prev => ({ ...prev, ...patch }))}
                rubrica={rubricaFlags}
                onRubricaChange={setRubricaFlags}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Committente *
                    </label>
                    <CommittenteSelect
                      value={formData.committente}
                      onChange={(v) => setFormData((prev) => ({ ...prev, committente: v }))}
                      testId="varie-committente-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Indirizzo *
                    </label>
                    <CommittenteSelect
                      campo="indirizzo"
                      value={formData.indirizzo}
                      onChange={(v) => setFormData((prev) => ({ ...prev, indirizzo: v }))}
                      onCitta={(c) => setFormData((prev) => ({ ...prev, citta: c }))}
                      testId="varie-indirizzo-input"
                      placeholder="Indirizzo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Città *
                    </label>
                    <CommittenteSelect
                      campo="citta"
                      value={formData.citta}
                      onChange={(v) => setFormData((prev) => ({ ...prev, citta: v }))}
                      testId="varie-citta-input"
                      placeholder="Città"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note
                    </label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      placeholder="Note aggiuntive"
                      rows={4}
                      className="input w-full resize-none"
                    />
                  </div>

                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stato *
                    </label>
                    <div className="relative">
                      <select
                        name="registrazione"
                        value={formData.registrazione}
                        onChange={handleInputChange}
                        required
                        data-testid="varie-stato-select"
                        className="input w-full pr-8 appearance-none"
                      >
                        <option value="">-- Seleziona stato --</option>
                        {stati.map((stato) => (
                          <option key={stato.id} value={stato.id}>
                            {stato.descrizione}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo Incarico *
                    </label>
                    <div className="relative">
                      <select
                        name="tipo_incarico"
                        required
                        data-testid="varie-tipo-incarico-input"
                        value={formData.tipo_incarico}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tipo_incarico: e.target.value }))}
                        className="input w-full appearance-none pr-8"
                      >
                        <option value="">Seleziona tipo incarico</option>
                        {formData.tipo_incarico && !TIPI_INCARICO_VARIE.includes(formData.tipo_incarico) && (
                          <option value={formData.tipo_incarico}>{formData.tipo_incarico}</option>
                        )}
                        {TIPI_INCARICO_VARIE.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border-2 ${formData.acconto
                        ? 'bg-blue-50 border-blue-500 text-blue-700 cursor-pointer'
                        : formData.saldo
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer'
                      }`}>
                      <input
                        type="checkbox"
                        name="acconto"
                        checked={formData.acconto}
                        onChange={handleInputChange}
                        disabled={formData.saldo}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${formData.acconto
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 bg-transparent'
                        }`}>
                        {formData.acconto && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium">Acconto</span>
                    </label>
                  </div>

                  <div>
                    <label className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border-2 ${formData.saldo
                      ? 'bg-green-50 border-green-500 text-green-700 cursor-pointer'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer'
                    }`}>
                    <input
                      type="checkbox"
                      name="saldo"
                      checked={formData.saldo}
                      onChange={handleSaldoChange}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${formData.saldo
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 bg-transparent'
                      }`}>
                      {formData.saldo && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium">Saldo</span>
                  </label>
                </div>

                <div>
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border-2 ${formData.omaggio
                        ? 'bg-blue-50 border-blue-500 text-blue-700 cursor-pointer'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer'
                      }`}>
                      <input
                        type="checkbox"
                        name="omaggio"
                        checked={formData.omaggio}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${formData.omaggio
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 bg-transparent'
                        }`}>
                        {formData.omaggio && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium">Omaggio</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  <p>* Campo obbligatorio</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {editingVaria ? 'Modifica...' : 'Salvataggio...'}
                      </div>
                    ) : (
                      editingVaria ? 'Modifica' : 'Salva'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Contestuale */}
      {contextMenu.varia && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y}>
          <button
            onClick={() => handleContextMenuAction('contact', contextMenu.varia!)}
            className="context-menu-item"
          >
            <User className="w-4 h-4 text-info-500" />
            Contatto
          </button>
          <div className="context-menu-separator" />
          <button
            onClick={() => handleContextMenuAction('duplicate', contextMenu.varia!)}
            className="context-menu-item"
          >
            <Copy className="w-4 h-4 text-topo-500" />
            Duplica
          </button>
          <div className="context-menu-separator" />
          <button
            onClick={() => handleContextMenuAction('delete', contextMenu.varia!)}
            className="context-menu-item context-menu-danger"
          >
            <Trash2 className="w-4 h-4" />
            Elimina
          </button>
        </ContextMenu>
      )}

      {/* Modal Cambia Stato da Menu Contestuale */}
      {showContextMenuActionModal === 'status' && selectedVariaForContextMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cambia Stato - {selectedVariaForContextMenu.committente}
            </h3>
            <select
              value={newStatusForContextMenu}
              onChange={(e) => setNewStatusForContextMenu(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleziona stato</option>
              {stati.map((stato) => (
                <option key={stato.id} value={stato.id}>
                  {stato.descrizione}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowContextMenuActionModal(null);
                  setSelectedVariaForContextMenu(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleChangeStatusFromContextMenu}
                disabled={!newStatusForContextMenu}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Contatto da Menu Contestuale */}
      {showContextMenuActionModal === 'contatto' && selectedVariaForContextMenu && (
        <ContattiPraticaModal pratica={selectedVariaForContextMenu} onClose={() => { setShowContextMenuActionModal(null); setSelectedVariaForContextMenu(null); }} />
      )}
    </div>
  );
}; 
