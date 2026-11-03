// Suggerimenti di vie e comuni dal servizio mappe gratuito Photon (OpenStreetMap), centrati su Torino
import { cfg } from './impostazioni';

const TORINO = () => ({ lat: cfg().pagine.mappaLat, lon: cfg().pagine.mappaLon });

export interface SuggerimentoMappa { nome: string; citta: string; provincia: string; cap: string }

const SIGLE: Record<string, string> = { torino: 'TO', cuneo: 'CN', asti: 'AT', alessandria: 'AL', biella: 'BI', novara: 'NO', vercelli: 'VC', aosta: 'AO', milano: 'MI', genova: 'GE', roma: 'RM', 'verbano-cusio-ossola': 'VB' };
export const siglaProvincia = (p: string) => SIGLE[p.toLowerCase()] || p;

export const cercaSuMappa = async (testo: string, tipo: 'indirizzo' | 'citta', segnale?: AbortSignal): Promise<SuggerimentoMappa[]> => {
  const q = testo.replace(/\s+n[°º.]?\s*\d+.*$/i, '').replace(/[\s,]+\d+\w*\s*$/, '').trim();
  if (q.length < 3) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${TORINO().lat}&lon=${TORINO().lon}&limit=10&layer=${tipo === 'indirizzo' ? 'street' : 'city'}&lang=default`;
  const r = await fetch(url, { signal: segnale });
  if (!r.ok) return [];
  const { features = [] } = await r.json();
  const visti = new Set<string>();
  return features
    .map((f: { properties: Record<string, string> }) => f.properties)
    .filter((p: Record<string, string>) => p.countrycode === 'IT' && p.name)
    .map((p: Record<string, string>) => ({ nome: p.name, citta: tipo === 'citta' ? p.name : p.city || p.town || p.village || p.district || '', provincia: p.county || '', cap: p.postcode || '' }))
    .filter((s: SuggerimentoMappa) => {
      const k = `${s.nome}|${s.citta}`.toLowerCase();
      if (visti.has(k)) return false;
      visti.add(k);
      return true;
    })
    .slice(0, 6);
};

// Conserva il numero civico gi\u00e0 scritto: "via monte grappa 7" + "Via Monte Grappa" -> "Via Monte Grappa n\u00b0 7"
export const conCivico = (scritto: string, via: string) => {
  const m = scritto.match(/(?:n[°º.]?\s*)?(\d+\s*[/a-z]*)\s*$/i);
  return m ? `${via} n\u00b0 ${m[1].replace(/\s+/g, '')}` : via;
};
