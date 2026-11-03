interface PaginaRighe<TRiga> {
  data: TRiga[] | null;
  error: unknown;
  count?: number | null;
}

// Ogni factory deve usare gli stessi filtri e un ordinamento con chiave univoca.
// Il conteggio iniziale impedisce di scambiare una risposta troncata per tutti i dati.
export const leggiTutteLeRighe = async <TRiga>(
  caricaPagina: (da: number, a: number, conta: boolean) => PromiseLike<PaginaRighe<TRiga>>,
): Promise<TRiga[]> => {
  const righe: TRiga[] = [];
  let totale: number | null = null;

  for (;;) {
    const { data, error, count } = await caricaPagina(righe.length, righe.length + 999, totale === null);
    if (error) throw error;
    if (totale === null) {
      if (count === null || count === undefined || !Number.isSafeInteger(count) || count < 0) {
        throw new Error('Impossibile verificare la completezza dei dati');
      }
      totale = count;
    }
    const pagina = data || [];
    if (pagina.length === 0 && righe.length < totale) {
      throw new Error('Lettura incompleta: i dati sono cambiati durante il caricamento. Riprova.');
    }
    righe.push(...pagina);
    if (righe.length >= totale) return righe;
    // Il limite del server può essere inferiore a 1.000: non saltare le righe mancanti.
  }
};
