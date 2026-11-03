import React, { useState, useEffect } from 'react';
import { Plus, Search, X, Calendar, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useApriDaRicerca } from '../hooks/useApriDaRicerca';
import { useAuthStore } from '../store/authStore';
import type { Scadenza } from '../types';
import toast from 'react-hot-toast';
import { sincronizzaTasseInSpese, isSpesaTasseAutomatica, isAccontoFuturo, categoriaSpesa, isVoceSoggettivoMaternita, ordineVariabile, annoMaturazioneSaldo, type CategoriaSpesa } from '../utils/tasseSync';
import { annoSpesa, riproponiCostiFissi } from '../utils/speseRicorrenti';
import { StatoPagamentoStepper, statoPagamentoDi, type StatoPagamento } from '../components/StatoPagamentoStepper';

const GRUPPI: { id: CategoriaSpesa; titolo: string }[] = [
  { id: 'fissi', titolo: 'Costi fissi' },
  { id: 'variabili', titolo: 'Costi variabili' },
];

export const Spese: React.FC = () => {
  const [spese, setSpese] = useState<Scadenza[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtriAttivi, setFiltriAttivi] = useState({
    nonPagate: false,
    pronteDaPagare: false
  });
  const [dataDa, setDataDa] = useState('');
  const [dataA, setDataA] = useState('');
  const [annoFiltro, setAnnoFiltro] = useState(() => new Date().getFullYear().toString());
  const [showModal, setShowModal] = useState(false);
  const [editingSpesa, setEditingSpesa] = useState<Scadenza | null>(null);
  const [formData, setFormData] = useState({
    descrizione: '',
    spese: '',
    data_scadenza: '',
    pagamento: false,
    data_pagamento: '',
    pagamento_pronto: false,
    categoria: 'fissi' as CategoriaSpesa,
    maternita: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();

  const fetchSpese = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        await sincronizzaTasseInSpese(user.id).catch((err) => console.error('Errore sync tasse:', err));
        await riproponiCostiFissi(user.id).catch((err) => console.error('Errore costi fissi:', err));
      }
      let query = supabase
        .from('scadenze')
        .select('*')
        .eq('user_id', user?.id)
        .order('data_scadenza', { ascending: false });

      // Filtro per testo di ricerca
      if (searchTerm) {
        query = query.ilike('descrizione', `%${searchTerm}%`);
      }

      // Filtro solo non pagate
      if (filtriAttivi.nonPagate) {
        query = query.eq('pagamento', false).neq('stato_id', 1);
      }

      // Filtro solo pronte da pagare
      if (filtriAttivi.pronteDaPagare) {
        query = query.eq('pagamento_pronto', true);
      }

      // Filtro data da
      if (dataDa) {
        query = query.gte('data_scadenza', dataDa);
      }

      // Filtro data a
      if (dataA) {
        query = query.lte('data_scadenza', dataA);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Errore nel caricamento spese:', error);
        toast.error('Errore nel caricamento delle spese');
        return;
      }

      const ordinaSpese = (a: Scadenza, b: Scadenza) => {
        const ordine = (s: Scadenza) => {
          if (s.data_pagamento) return 4;
          if (!s.data_scadenza) return 0;
          const oggi = new Date();
          const scadenza = new Date(s.data_scadenza);
          if (scadenza < oggi) return 1;
          if (scadenza <= new Date(oggi.getTime() + 7 * 24 * 60 * 60 * 1000)) return 2;
          return 3;
        };
        return ordine(a) - ordine(b);
      };

      setSpese((data || []).filter((s) => !isAccontoFuturo(s.descrizione)).sort(ordinaSpese));
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSpese();
    }
  }, [user?.id, searchTerm, filtriAttivi.nonPagate, filtriAttivi.pronteDaPagare, dataDa, dataA]);



  const handleClearSearch = () => {
    setSearchTerm('');
    setFiltriAttivi({
      nonPagate: false,
      pronteDaPagare: false
    });
    setDataDa('');
    setDataA('');
    setAnnoFiltro(new Date().getFullYear().toString());
    fetchSpese();
  };

  const handleFilterToggle = (filterName: keyof typeof filtriAttivi) => {
    const newFiltriAttivi = {
      ...filtriAttivi,
      [filterName]: !filtriAttivi[filterName]
    };

    setFiltriAttivi(newFiltriAttivi);
  };

  const handleDeleteSpesa = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa spesa?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('scadenze')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        toast.error('Errore nell\'eliminazione della spesa');
        return;
      }

      toast.success('Spesa eliminata con successo');
      fetchSpese();
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  useApriDaRicerca<Scadenza>('scadenze', (r) => handleEditSpesa(r));

  const handleEditSpesa = (spesa: Scadenza) => {
    setEditingSpesa(spesa);
    setFormData({
      descrizione: spesa.descrizione,
      spese: (isVoceSoggettivoMaternita(spesa.descrizione)
        ? Math.round((Number(spesa.spese) - (Number(spesa.maternita) || 0)) * 100) / 100
        : spesa.spese).toString(),
      data_scadenza: spesa.data_scadenza || '',
      pagamento: spesa.pagamento,
      data_pagamento: spesa.data_pagamento || '',
      pagamento_pronto: spesa.pagamento_pronto || false,
      categoria: categoriaSpesa(spesa),
      maternita: String(spesa.maternita ?? 0)
    });
    setShowModal(true);
  };

  const campiStato = (stato: StatoPagamento, dataAttuale?: string | null) => ({
    pagamento_pronto: stato !== 'da_pagare',
    pagamento: stato === 'pagata',
    data_pagamento: stato === 'pagata' ? dataAttuale || new Date().toISOString().split('T')[0] : null
  });

  const MESSAGGI_STATO: Record<StatoPagamento, string> = {
    da_pagare: 'Spesa segnata da pagare',
    pronta: 'Spesa pronta per il pagamento',
    pagata: 'Pagamento registrato'
  };

  const handleCambiaStato = async (spesa: Scadenza, stato: StatoPagamento) => {
    const { error } = await supabase
      .from('scadenze')
      .update(campiStato(stato, spesa.data_pagamento))
      .eq('id', spesa.id)
      .eq('user_id', user?.id);
    if (error) {
      toast.error('Errore nell\'aggiornamento del pagamento');
      return;
    }
    toast.success(MESSAGGI_STATO[stato]);
    fetchSpese();
  };

  const resetForm = () => {
    setFormData({
      descrizione: '',
      spese: '',
      data_scadenza: '',
      pagamento: false,
      data_pagamento: '',
      pagamento_pronto: false,
      categoria: 'fissi',
      maternita: ''
    });
    setEditingSpesa(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descrizione.trim()) {
      toast.error('La descrizione è obbligatoria');
      return;
    }

    if (!formData.spese || parseFloat(formData.spese) <= 0) {
      toast.error('L\'importo deve essere maggiore di 0');
      return;
    }

    setSubmitting(true);
    try {
      const conMaternita = !!editingSpesa && isVoceSoggettivoMaternita(editingSpesa.descrizione);
      const maternita = parseFloat(formData.maternita) || 0;
      const spesaData = {
        descrizione: formData.descrizione.trim(),
        spese: conMaternita
          ? Math.round(((parseFloat(formData.spese) || 0) + maternita) * 100) / 100
          : parseFloat(formData.spese),
        ...(conMaternita ? { maternita } : {}),
        data_scadenza: formData.data_scadenza || null,
        pagamento: formData.pagamento,
        data_pagamento: formData.pagamento && formData.data_pagamento ? formData.data_pagamento : null,
        pagamento_pronto: formData.pagamento_pronto,
        categoria: formData.categoria
      };

      if (editingSpesa) {
        // Modifica spesa esistente
        const { error } = await supabase
          .from('scadenze')
          .update(spesaData)
          .eq('id', editingSpesa.id)
          .eq('user_id', user?.id);

        if (error) {
          console.error('Errore nella modifica:', error);
          toast.error('Errore nella modifica della scadenza');
          return;
        }

        toast.success('Scadenza modificata con successo');
      } else {
        // Crea nuova spesa
        const { error } = await supabase
          .from('scadenze')
          .insert([spesaData]);

        if (error) {
          console.error('Errore nella creazione:', error);
          toast.error('Errore nella creazione della scadenza');
          return;
        }

        toast.success('Scadenza creata con successo');
      }

      setShowModal(false);
      resetForm();
      fetchSpese();
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nell\'operazione');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const calculateTotal = () => {
    return speseAnno.reduce((total, spesa) => total + spesa.spese, 0);
  };

  const anniDisponibili = [...new Set([new Date().getFullYear(), ...spese.map(annoSpesa)])].sort((a, b) => b - a);
  const speseAnno = annoFiltro
    ? spese.filter((s) => annoSpesa(s) === Number(annoFiltro) || annoMaturazioneSaldo(s.descrizione) === Number(annoFiltro))
    : spese;
  const ORDINE_STATO: Record<StatoPagamento, number> = { da_pagare: 0, pronta: 1, pagata: 2 };
  const speseOrdinate = GRUPPI.flatMap((g) =>
    speseAnno
      .filter((s) => categoriaSpesa(s) === g.id)
      .sort((a, b) =>
        ORDINE_STATO[statoPagamentoDi(a)] - ORDINE_STATO[statoPagamentoDi(b)] ||
        (g.id === 'variabili' ? ordineVariabile(a.descrizione) - ordineVariabile(b.descrizione) : 0)
      )
  );
  const gruppoDi = (i: number) => categoriaSpesa(speseOrdinate[i] || {});
  const totaleGruppo = (g: CategoriaSpesa) =>
    speseAnno.filter((s) => categoriaSpesa(s) === g).reduce((t, s) => t + s.spese, 0);

  const intestazioneGruppo = (i: number) => {
    if (i > 0 && gruppoDi(i - 1) === gruppoDi(i)) return null;
    const g = GRUPPI.find((x) => x.id === gruppoDi(i))!;
    return (
      <tr className="bg-ink-100 dark:bg-gray-900" data-testid={`spese-gruppo-${g.id}`}>
        <td colSpan={7} className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-gray-200 border-l-4 border-ink-500">
          {g.titolo}
        </td>
      </tr>
    );
  };

  const subtotaleGruppo = (i: number) => {
    if (i < speseOrdinate.length - 1 && gruppoDi(i + 1) === gruppoDi(i)) return null;
    const g = GRUPPI.find((x) => x.id === gruppoDi(i))!;
    return (
      <tr className="bg-gray-50 dark:bg-gray-700/60" data-testid={`spese-subtotale-${g.id}`}>
        <td colSpan={2} className="px-6 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
          Totale {g.titolo.toLowerCase()}:
        </td>
        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
          {formatCurrency(totaleGruppo(g.id))}
        </td>
        <td colSpan={4}></td>
      </tr>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const getStatoClass = (dataScadenza: string | null, dataPagamento: string | null) => {
    if (dataPagamento) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    }
    
    if (!dataScadenza) {
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }

    const oggi = new Date();
    const scadenza = new Date(dataScadenza);
    
    if (scadenza < oggi) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    } else if (scadenza <= new Date(oggi.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    }
    
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
  };

  const getStatoText = (dataScadenza: string | null, dataPagamento: string | null) => {
    if (dataPagamento) {
      return 'Pagata';
    }
    
    if (!dataScadenza) {
      return 'N/A';
    }

    const oggi = new Date();
    const scadenza = new Date(dataScadenza);
    
    if (scadenza < oggi) {
      return 'Scaduta';
    } else if (scadenza <= new Date(oggi.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return 'In scadenza';
    }
    
    return 'Da pagare';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Spese</h1>
          <p className="text-gray-600 dark:text-gray-300">Gestione spese</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuova Scadenza
        </button>
      </div>

      {/* Filtri */}
      <div className="card space-y-4 dark:bg-gray-800 dark:border-gray-700">
        {/* Prima riga - Ricerca e date */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Anno:
            </label>
            <select
              value={annoFiltro}
              onChange={(e) => setAnnoFiltro(e.target.value)}
              className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              data-testid="spese-filtro-anno"
            >
              <option value="">Tutti gli anni</option>
              {anniDisponibili.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Campo di ricerca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cerca:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchSpese()}
                placeholder="Cerca descrizione..."
                className="input pl-10 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <button
                onClick={fetchSpese}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-1 rounded"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Data Da */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Da:
            </label>
            <div className="relative">
              <input
                type="date"
                value={dataDa}
                onChange={(e) => setDataDa(e.target.value)}
                className="input pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* Data A */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              A:
            </label>
            <div className="relative">
              <input
                type="date"
                value={dataA}
                onChange={(e) => setDataA(e.target.value)}
                className="input pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* Pulsante Reset */}
          <div className="flex items-end">
            <button
              onClick={handleClearSearch}
              className="btn btn-outline flex items-center gap-2 w-full justify-center"
            >
              <X className="w-4 h-4" />
              Resetta filtri
            </button>
          </div>
        </div>

        {/* Seconda riga - Filtri toggle */}
        <div className="flex flex-wrap gap-4">
          <label className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 ${filtriAttivi.nonPagate
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}>
            <input
              type="checkbox"
              checked={filtriAttivi.nonPagate}
              onChange={() => handleFilterToggle('nonPagate')}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${filtriAttivi.nonPagate
                ? 'border-white bg-white'
                : 'border-gray-400 dark:border-gray-500 bg-transparent'
              }`}>
              {filtriAttivi.nonPagate && (
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">Solo non pagate</span>
          </label>

          <label className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 ${filtriAttivi.pronteDaPagare
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}>
            <input
              type="checkbox"
              checked={filtriAttivi.pronteDaPagare}
              onChange={() => handleFilterToggle('pronteDaPagare')}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${filtriAttivi.pronteDaPagare
                ? 'border-white bg-white'
                : 'border-gray-400 dark:border-gray-500 bg-transparent'
              }`}>
              {filtriAttivi.pronteDaPagare && (
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">Solo pronte</span>
          </label>
        </div>
      </div>

      {/* Tabella Spese */}
      <div className="card p-0" data-testid="spese-elenco">
        <div className="md:overflow-x-auto">
          <table className="w-full tabella-mobile">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descrizione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Importo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data Scadenza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stato pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Caricamento...</span>
                    </div>
                  </td>
                </tr>
              ) : speseAnno.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nessuna scadenza trovata
                  </td>
                </tr>
              ) : (
                speseOrdinate.map((spesa, i) => (
                  <React.Fragment key={spesa.id}>
                  {intestazioneGruppo(i)}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer select-none" onDoubleClick={() => handleEditSpesa(spesa)} title="Doppio clic per modificare" data-testid={`spesa-riga-${spesa.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatoClass(spesa.data_scadenza || null, spesa.data_pagamento || null)}`}>
                        {getStatoText(spesa.data_scadenza || null, spesa.data_pagamento || null)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {spesa.descrizione}
                      {isSpesaTasseAutomatica(spesa.descrizione) && (
                        <span className="ml-2 inline-flex items-center rounded-full border border-ink-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500" data-testid={`spesa-tasse-auto-${spesa.id}`}>
                          Automatica
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(spesa.spese)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(spesa.data_scadenza || null)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <StatoPagamentoStepper
                        valore={statoPagamentoDi(spesa)}
                        onChange={(stato) => handleCambiaStato(spesa, stato)}
                        testId={`spesa-stato-pagamento-${spesa.id}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(spesa.data_pagamento || null)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSpesa(spesa)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                          title="Modifica"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSpesa(spesa.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {subtotaleGruppo(i)}
                  </React.Fragment>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-300 dark:border-gray-600">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                  Totale:
                </td>
                <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                  {formatCurrency(calculateTotal())}
                </td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Nuova/Modifica Scadenza */}
      {showModal && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingSpesa ? 'Modifica Scadenza' : 'Nuova Scadenza'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Descrizione */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrizione <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="descrizione"
                  value={formData.descrizione}
                  onChange={handleInputChange}
                  placeholder="Descrizione della scadenza"
                  className="input w-full"
                  disabled={isSpesaTasseAutomatica(editingSpesa?.descrizione)}
                  required
                />
                {isSpesaTasseAutomatica(editingSpesa?.descrizione) && (
                  <p className="mt-1 text-xs text-ink-500">Importo calcolato e aggiornato automaticamente dalle fatture in Contabilità.</p>
                )}
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo di costo <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2" role="radiogroup">
                  {GRUPPI.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      role="radio"
                      aria-checked={formData.categoria === g.id}
                      onClick={() => setFormData((prev) => ({ ...prev, categoria: g.id }))}
                      data-testid={`spesa-form-categoria-${g.id}`}
                      className={`rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                        formData.categoria === g.id
                          ? 'border-ink-800 bg-ink-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                          : 'border-ink-200 text-ink-700 hover:border-ink-400 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {g.titolo}
                      <span className="block text-xs font-normal opacity-70">
                        {g.id === 'fissi' ? 'Riproposto in automatico ogni anno' : 'Importo che varia di anno in anno'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spese */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isVoceSoggettivoMaternita(editingSpesa?.descrizione) ? 'Contributo soggettivo' : 'Spese'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">€</span>
                  <input
                    type="number"
                    name="spese"
                    value={formData.spese}
                    onChange={handleInputChange}
                    placeholder="Importo spese"
                    step="0.01"
                    min="0"
                    disabled={isSpesaTasseAutomatica(editingSpesa?.descrizione)}
                    className="input w-full pl-8"
                  />
                </div>
              </div>

              {isVoceSoggettivoMaternita(editingSpesa?.descrizione) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maternità
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">€</span>
                    <input
                      type="number"
                      name="maternita"
                      value={formData.maternita}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="input w-full pl-8"
                      data-testid="spesa-form-maternita"
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink-500" data-testid="spesa-form-totale-soggettivo">
                    Totale della voce: {formatCurrency(Math.round(((parseFloat(formData.spese) || 0) + (parseFloat(formData.maternita) || 0)) * 100) / 100)} (contributo soggettivo + maternità)
                  </p>
                </div>
              )}

              {/* Data Scadenza */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Scadenza
                </label>
                <input
                  type="date"
                  name="data_scadenza"
                  value={formData.data_scadenza}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>

              {/* Stato pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stato pagamento
                </label>
                <StatoPagamentoStepper
                  valore={statoPagamentoDi(formData)}
                  onChange={(stato) => setFormData((prev) => ({ ...prev, ...campiStato(stato, prev.data_pagamento), data_pagamento: campiStato(stato, prev.data_pagamento).data_pagamento || '' }))}
                  testId="spesa-form-stato-pagamento"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Da pagare: spesa da sostenere · Pronta: i fondi sono disponibili · Pagata: pagamento effettuato
                </p>
              </div>

              {/* Data Pagamento */}
              {formData.pagamento && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Pagamento
                  </label>
                  <input
                    type="date"
                    name="data_pagamento"
                    value={formData.data_pagamento}
                    onChange={handleInputChange}
                    className="input w-full"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Lo stato della scadenza verrà determinato automaticamente in base alla data
                  </p>
                </div>
              )}

              {/* Note informative */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-medium">* Campo obbligatorio</span><br />
                  Lo stato della scadenza verrà determinato automaticamente in base alla data
                </p>
              </div>

              {/* Pulsanti */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingSpesa ? 'Modifica...' : 'Salvataggio...'}
                    </div>
                  ) : (
                    editingSpesa ? 'Modifica' : 'Salva'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 