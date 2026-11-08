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

export class GyDB extends Dexie {
  perfil!: Table<Perfil, number>;

  constructor() {
    super('GyDB');
    this.version(1).stores({
      perfil: '++id'
    });
  }
}

export const db = new GyDB();