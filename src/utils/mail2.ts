// Invia mail2 solo se valorizzata (o da svuotare), così il salvataggio funziona anche prima della migrazione DB
export const conMail2 = <T extends { mail2?: string }>(dati: T, precedente?: string | null) => {
  const { mail2, ...resto } = dati;
  const valore = mail2?.trim() || null;
  return (valore || precedente ? { ...resto, mail2: valore } : resto) as Omit<T, 'mail2'> & { mail2?: string | null };
};

export const mail2Opzionale = (mail2: string) => (mail2.trim() ? { mail2: mail2.trim() } : {});
