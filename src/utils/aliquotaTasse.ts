import { cfg } from '../services/impostazioni';

export const aliquotaTasse = (anno: number) => {
  const f = cfg().fisco;
  return (anno >= f.annoCambio ? f.aliquotaDal : f.aliquotaFino) / 100;
};
export const coefficienteRedditivita = () => cfg().fisco.coefficiente / 100;
export const quotaCassa = () => cfg().fisco.cassa / 100;
