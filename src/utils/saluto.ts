const FEMMINILI = new Set('maria anna giulia francesca chiara sara laura valentina alessandra elena federica silvia paola martina elisa roberta simona cristina barbara monica daniela stefania claudia giovanna antonella marina patrizia rita rosa teresa lucia angela carla franca grazia luisa marta michela nadia sabrina serena tiziana veronica viviana alice aurora beatrice camilla carlotta caterina cecilia emma erika giorgia ilaria irene lisa ludovica manuela marisa mirella noemi ornella raffaella rossella sofia vanessa vittoria anastasia arianna benedetta debora deborah eleonora emanuela fabiola gabriella gloria ida ivana jessica letizia lorena loredana luciana marilena mariangela milena nicoletta pamela piera pierina rachele samanta samantha sonia susanna tatiana tamara wanda annamaria mariarosa margherita agnese adele ada alba alessia bianca carolina chiara cinzia concetta donatella edda enrica erica fiorella flavia gemma ginevra giuseppina immacolata ines iolanda lidia lina liliana loretta maddalena mara marcella mariella marzia matilde miriam nella oriana palmira pia rebecca rosanna rosaria sandra stella vera assunta carmela filomena olga elisabetta elisabeth giuliana'.split(' '));
const MASCHILI = new Set('andrea luca nicola mattia elia enea tobia giuseppe mario giovanni marco francesco antonio paolo luigi roberto stefano alessandro davide matteo lorenzo simone fabio massimo riccardo claudio sergio maurizio daniele federico gabriele giorgio pietro carlo alberto enrico emanuele franco gianluca giancarlo vincenzo salvatore michele angelo bruno renato walter dario diego edoardo emilio ettore fabrizio filippo flavio gianni guido ivan leonardo lucio manuel marcello mauro mirko nicolò omar oscar piero raffaele rocco samuele silvio tommaso umberto valerio vittorio domenico cristian christian cristiano adriano aldo alessio armando arturo attilio benito camillo cesare corrado dino elio enzo ernesto fausto felice gino giulio ugo marino oreste osvaldo pasquale rino sandro tiziano valter alfredo gaetano giacomo ignazio luciano nazareno orlando ottavio rolando ruggero settimio sebastiano tullio aurelio battista gianpaolo pierluigi giampiero gianfranco'.split(' '));

const titolo = (s: string) => s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());

const genere = (nome: string): 'F' | 'M' | null => {
  for (const t of nome.toLowerCase().split(/[\s.]+/)) {
    if (FEMMINILI.has(t)) return 'F';
    if (MASCHILI.has(t)) return 'M';
  }
  return null;
};

export const soggetti = (cliente: string) =>
  (cliente.includes('\n') ? cliente.split('\n') : cliente.split(/\s+-\s+|\s*[,;/&]\s*|\s+e\s+/i)).map((s) => s.trim()).filter(Boolean);

export const nomeCliente = (cliente: string) => soggetti(cliente).join(' - ');

const conTitolo = (nome: string) => `${genere(nome) === 'F' ? 'Sig.ra' : 'Sig.'} ${nome}`;

export const oggettoAutomatico = (citta: string, indirizzo: string) => {
  const luogo = [citta.trim(), indirizzo.trim()].filter(Boolean).join(', ');
  return luogo ? `prestazioni professionali relative all'immobile sito in ${luogo}.` : '';
};

const societa = (nome: string) => /^soc(\.|iet|\s)/i.test(nome.trim());

export const salutoAutomatico = (cliente: string) => {
  const nomi = soggetti(cliente).map((n) => (societa(n) ? n : titolo(n)));
  if (nomi.length === 0) return '';
  const elenco = nomi.length === 1 ? nomi[0] : `${nomi.slice(0, -1).join(', ')} e ${nomi[nomi.length - 1]}`;
  if (nomi.some(societa)) return `Spett.le ${elenco}`;
  if (nomi.length === 1) return `Gentile ${conTitolo(nomi[0])}`;
  return `Gentili Sigg. ${elenco}`;
};


export const nomeFilePreventivo = (cliente: string) =>
  `Preventivo ${salutoAutomatico(cliente).replace(/^(Gentile|Gentili|Spett\.le)\s+/, '')}`.replace(/[\\/:*?"<>|]/g, '').trim();
