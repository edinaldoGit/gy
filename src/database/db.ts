import Dexie, { type Table } from 'dexie';

export interface Perfil {
  id?: number;
  nome: string;
  idade: number;
  peso: number;
  altura: number;
  fotoPerfil?: string;
  criadoEm: Date;
}

export interface ExercicioCatalogo {
  id?: number;
  exercicioCanonicoId?: string;
  nome: string;
  grupoMuscular: string;
  equipamento: string;
  videoUrl: string;
  defaultSeries: number;
  defaultReps: string;
}

export interface ExercicioNaFicha {
  exercicioId: number;
  ordem: number;
  series: number;
  repsAlvo: string;
  taxaAumentoKg: number;
  descansoSegundos: number;
  pesoBaseAtual: number;
  substitutosIds: number[];
  temDescanso?: boolean;
}

/** Programa que agrupa os treinos e guarda a configuração semanal completa. */
export interface Ficha {
  id?: number;
  nome: string;
  foco: string;
  corTema: string;
  descricao?: string;
  origem: 'local' | 'importada';
  criadoEm: Date;
  atualizadoEm: Date;
}

/** Treino individual dentro de uma ficha. Os dias pertencem a este treino. */
export interface Treino {
  corTema?: string;
  id?: number;
  fichaId: number;
  nome: string;
  foco: string;
  ordem: number;
  diasDaSemana: number[];
  exercicios: ExercicioNaFicha[];
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface FichaCompleta extends Ficha {
  treinos: Treino[];
}

export interface ConfiguracaoApp {
  chave: 'principal';
  fichaAtivaId: number | null;
}

/** Registro imutável da ficha/programação vigente a partir de uma data. */
export interface ProgramacaoVigente {
  id?: number;
  fichaId: number | null;
  efetivaEm: Date;
  diaLocalVigencia?: string;
  fusoHorario?: string;
  offsetMinutos?: number;
  motivo: 'ativacao' | 'troca' | 'edicao' | 'desativacao' | 'deslocamento';
  agenda?: AgendaEfetiva;
  fichaNome: string | null;
  treinos: Array<{ treinoId: number; treinoNome: string; diasDaSemana: number[] }>;
}

export interface AgendaEfetiva {
  inicio: string;
  fim: string;
  itens: Array<{ dia: string; treinoId: number; treinoNome: string }>;
}

export interface HistoricoTreino {
  id?: number;
  fichaId: number | null;
  treinoId: number | null;
  fichaNome: string;
  treinoNome: string;
  fichaFoco?: string;
  fichaCorTema?: string;
  dataInicio: Date;
  dataFim?: Date;
  diaConclusaoLocal?: string;
  fusoConclusao?: string;
  offsetConclusaoMinutos?: number;
  estado: 'em_andamento' | 'finalizado' | 'cancelado';
  duracaoMinutos: number;
  /** Snapshot completo do treino e dos exercícios no início da sessão. */
  exerciciosRealizados: ExercicioRealizado[];
}

export interface MedidaCorporal {
  id?: number;
  dataLocal: string;
  pesoKg?: number;
  cinturaCm?: number;
  quadrilCm?: number;
  peitoralCm?: number;
  bracoEsquerdoCm?: number;
  bracoDireitoCm?: number;
  coxaEsquerdaCm?: number;
  coxaDireitaCm?: number;
  panturrilhaEsquerdaCm?: number;
  panturrilhaDireitaCm?: number;
}

export interface ExercicioRealizado {
  exercicioId: number;
  exercicioCanonicoId?: string;
  planejado?: ExercicioPlanejadoSnapshot;
  registrosEditados?: boolean;
  nome: string;
  grupoMuscular: string;
  videoUrl?: string;
  ordem: number;
  seriesPlanejadas: number;
  repsAlvo: string;
  pesoBasePlanejado: number;
  taxaAumentoKg: number;
  temDescanso: boolean;
  descansoSegundos: number;
  seriesRealizadas: SerieRealizada[];
}

export interface ExercicioPlanejadoSnapshot {
  exercicioId: number;
  exercicioCanonicoId?: string;
  nome: string;
  grupoMuscular: string;
  videoUrl?: string;
  pesoBasePlanejado?: number;
  taxaAumentoKg?: number;
}

export interface SerieRealizada {
  numeroDaSerie: number;
  peso: number;
  reps: number | string;
  finalizada?: boolean;
}

export class GyDB extends Dexie {
  perfil!: Table<Perfil, number>;
  catalogo!: Table<ExercicioCatalogo, number>;
  fichas!: Table<Ficha, number>;
  treinos!: Table<Treino, number>;
  configuracoes!: Table<ConfiguracaoApp, string>;
  programacoes!: Table<ProgramacaoVigente, number>;
  historico!: Table<HistoricoTreino, number>;
  medidasCorporais!: Table<MedidaCorporal, number>;

  constructor() {
    super('GyDB');
    this.version(2).stores({
      perfil: '++id', catalogo: '++id, grupoMuscular', fichas: '++id', historico: '++id, fichaId, dataFim'
    });
    this.version(3).stores({
      perfil: '++id', catalogo: '++id, grupoMuscular', fichas: '++id', historico: '++id, fichaId, dataFim, estado, dataInicio'
    });
    this.version(4).stores({
      perfil: '++id',
      catalogo: '++id, grupoMuscular',
      fichas: '++id, origem, atualizadoEm',
      treinos: '++id, fichaId, ordem, *diasDaSemana',
      configuracoes: '&chave',
      programacoes: '++id, fichaId, efetivaEm',
      historico: '++id, fichaId, treinoId, dataFim, estado, dataInicio'
    });
    this.version(5).stores({
      perfil: '++id',
      catalogo: '++id, grupoMuscular',
      fichas: '++id, origem, atualizadoEm',
      treinos: '++id, fichaId, ordem, *diasDaSemana',
      configuracoes: '&chave',
      programacoes: '++id, fichaId, efetivaEm',
      historico: '++id, fichaId, treinoId, dataFim, estado, dataInicio',
      medidasCorporais: '++id, &dataLocal'
    });
    this.version(6).stores({ programacoes: '++id, fichaId, efetivaEm' });
  }
}

export const db = new GyDB();
