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
  nome: string;
  grupoMuscular: string; 
  equipamento: string; 
  videoUrl: string; 
  defaultSeries: number;
  defaultReps: string;
}

export interface Ficha {
  id?: number;
  nome: string; 
  foco: string; 
  exercicios: ExercicioNaFicha[];
  criadoEm: Date;
}

export interface ExercicioNaFicha {
  exercicioId: number; 
  ordem: number; 
  series: number; 
  repsAlvo: string; 
  taxaAumentoKg: number; 
  pesoBaseAtual: number;
  substitutosIds: number[]; 
}

export interface HistoricoTreino {
  id?: number;
  fichaId: number;
  dataFim: Date;
  duracaoMinutos: number;
  exerciciosRealizados: ExercicioRealizado[];
}

export interface ExercicioRealizado {
  exercicioId: number; 
  seriesRealizadas: SerieRealizada[];
}

export interface SerieRealizada {
  numeroDaSerie: number;
  peso: number;
  reps: number; 
}

// --- Configuração do Banco ---
export class GyDB extends Dexie {
  perfil!: Table<Perfil, number>;
  catalogo!: Table<ExercicioCatalogo, number>;
  fichas!: Table<Ficha, number>;
  historico!: Table<HistoricoTreino, number>;

  constructor() {
    super('GyDB');
    this.version(2).stores({
      perfil: '++id',
      catalogo: '++id, grupoMuscular',
      fichas: '++id',
      historico: '++id, fichaId, dataFim'
    });
  }
}

export const db = new GyDB();