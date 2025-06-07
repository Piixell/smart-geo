import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, ChevronDown, Edit, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import type { Ape, StatoApe } from '../types';
import toast from 'react-hot-toast';

export const ApePage: React.FC = () => {
  const [pratiche, setPratiche] = useState<Ape[]>([]);
  const [stati, setStati] = useState<StatoApe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataDa, setDataDa] = useState('');
  const [dataA, setDataA] = useState('');
  const [filtroStato, setFiltroStato] = useState('');
  const [filtriAttivi, setFiltriAttivi] = useState({
    soloNonPagate: false,
    completateNonPagate: false
  });
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuthStore();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Carica pratiche APE con relazioni
      let query = supabase
        .from('ape')
        .select(`
          *,
          registrazione_info:stati_ape(id, descrizione, colore)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Applica filtri
      if (searchTerm) {
        query = query.or(`committente.ilike.%${searchTerm}%,proprieta.ilike.%${searchTerm}%,indirizzo.ilike.%${searchTerm}%,progressivo.ilike.%${searchTerm}%`);
      }

      if (dataDa) {
        query = query.gte('created_at', dataDa);
      }

      if (dataA) {
        query = query.lte('created_at', dataA + 'T23:59:59.999Z');
      }

      if (filtroStato) {
        query = query.eq('registrazione', parseInt(filtroStato));
      }

      if (filtriAttivi.soloNonPagate) {
        query = query.eq('pagamento', false);
      }

      if (filtriAttivi.completateNonPagate) {
        // Assumiamo che "completate" significhi che hanno uno stato di registrazione diverso da null/vuoto
        query = query.not('registrazione', 'is', null).eq('pagamento', false);
      }

      const { data: praticheData, error: praticheError } = await query;

      if (praticheError) {
        console.error('Errore nel caricamento pratiche APE:', praticheError);
        toast.error('Errore nel caricamento delle pratiche APE');
        return;
      }

      // Carica stati APE per il dropdown
      const { data: statiData, error: statiError } = await supabase
        .from('stati_ape')
        .select('*')
        .order('ordinamento');

      if (statiError) {
        console.error('Errore caricamento stati APE:', statiError);
      } else {
        setStati(statiData || []);
      }

      setPratiche(praticheData || []);
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const handleSearch = () => {
    fetchData();
  };

  const handleFilterToggle = (filterName: keyof typeof filtriAttivi) => {
    setFiltriAttivi(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const handleDeletePratica = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa pratica APE?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ape')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        toast.error('Errore nell\'eliminazione della pratica');
        return;
      }

      toast.success('Pratica APE eliminata con successo');
      fetchData();
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Errore nell\'eliminazione');
    }
  };

  const getStatoStyle = (stato: StatoApe | undefined) => {
    if (!stato) return 'bg-gray-100 text-gray-800';
    
    // Mappiamo i colori comuni a classi Tailwind
    const colorMap: { [key: string]: string } = {
      '#10b981': 'bg-green-500 text-white',
      '#22c55e': 'bg-green-500 text-white', 
      '#ef4444': 'bg-red-500 text-white',
      '#f59e0b': 'bg-yellow-500 text-white',
      '#3b82f6': 'bg-blue-500 text-white',
      '#8b5cf6': 'bg-purple-500 text-white',
      '#06b6d4': 'bg-cyan-500 text-white',
      '#84cc16': 'bg-lime-500 text-white',
      'green': 'bg-green-500 text-white',
      'red': 'bg-red-500 text-white',
      'blue': 'bg-blue-500 text-white',
      'yellow': 'bg-yellow-500 text-white',
      'purple': 'bg-purple-500 text-white',
    };
    
    return colorMap[stato.colore] || 'bg-gray-500 text-white';
  };

  const renderCheckIcon = (value: boolean) => {
    return value ? (
      <Check className="w-4 h-4 text-green-600" />
    ) : (
      <X className="w-4 h-4 text-gray-400" />
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestione APE</h1>
          <p className="text-gray-600 dark:text-gray-300">Gestione pratiche APE</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuova Pratica APE
        </button>
      </div>

      {/* Filtri */}
      <div className="card space-y-4 dark:bg-gray-800 dark:border-gray-700">
        {/* Prima riga - Ricerca, date e dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Campo di ricerca */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cerca..."
              className="input pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-500 text-white p-1 rounded"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Data Da */}
          <div className="relative">
            <input
              type="date"
              value={dataDa}
              onChange={(e) => setDataDa(e.target.value)}
              placeholder="gg/mm/aaaa"
              className="input pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>

          {/* Data A */}
          <div className="relative">
            <input
              type="date"
              value={dataA}
              onChange={(e) => setDataA(e.target.value)}
              placeholder="gg/mm/aaaa"
              className="input pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>

          {/* Filtro Stati APE */}
          <div className="relative">
            <select
              value={filtroStato}
              onChange={(e) => setFiltroStato(e.target.value)}
              className="input pr-8 appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">-- Tutti gli stati APE --</option>
              {stati.map((stato) => (
                <option key={stato.id} value={stato.id}>
                  {stato.descrizione}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {/* Seconda riga - Filtri toggle */}
        <div className="flex flex-wrap gap-4">
          <label className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
            filtriAttivi.soloNonPagate 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}>
            <input
              type="checkbox"
              checked={filtriAttivi.soloNonPagate}
              onChange={() => handleFilterToggle('soloNonPagate')}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${
              filtriAttivi.soloNonPagate 
                ? 'border-white bg-white' 
                : 'border-gray-400 dark:border-gray-500 bg-transparent'
            }`}>
              {filtriAttivi.soloNonPagate && (
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">Solo non pagate</span>
          </label>

          <label className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
            filtriAttivi.completateNonPagate 
              ? 'bg-green-600 text-white shadow-md' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}>
            <input
              type="checkbox"
              checked={filtriAttivi.completateNonPagate}
              onChange={() => handleFilterToggle('completateNonPagate')}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${
              filtriAttivi.completateNonPagate 
                ? 'border-white bg-white' 
                : 'border-gray-400 dark:border-gray-500 bg-transparent'
            }`}>
              {filtriAttivi.completateNonPagate && (
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">Completate non pagate</span>
          </label>
        </div>
      </div>

      {/* Contenuto principale */}
      {loading ? (
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500 dark:text-gray-400">Caricamento...</span>
          </div>
        </div>
      ) : pratiche.length === 0 ? (
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-300 text-center">Nessuna pratica APE trovata.</p>
          </div>
        </div>
      ) : (
        /* Tabella */
        <div className="card p-0 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Committente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Proprietà
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Indirizzo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Città
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Mail
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Telefono
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Progressivo
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data Creazione
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pratiche.map((pratica) => (
                  <tr key={pratica.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getStatoStyle(pratica.registrazione_info)}`}>
                        {pratica.registrazione_info?.descrizione || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {pratica.committente}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {pratica.proprieta || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {pratica.indirizzo || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {pratica.citta || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {pratica.mail || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {pratica.telefono || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                      {pratica.note || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {pratica.progressivo || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderCheckIcon(pratica.pagamento)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(pratica.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {/* TODO: Implementa modifica */}}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors p-1"
                          title="Modifica"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePratica(pratica.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors p-1"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nuova Pratica APE - TODO: Implementare */}
      {showModal && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Nuova Pratica APE</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Modal per creare nuova pratica APE - da implementare
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Annulla
              </button>
              <button className="btn btn-primary">
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 