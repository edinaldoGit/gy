import { db } from './db'

const exerciciosSeed = [
  { id: 1, nome: "Supino Reto com Barra", grupoMuscular: "Peito", equipamento: "Barra", videoUrl: "https://www.youtube.com/results?search_query=execucao+supino+reto+com+barra", defaultSeries: 4, defaultReps: "8-12" },
  { id: 2, nome: "Supino Inclinado com Halteres", grupoMuscular: "Peito", equipamento: "Halter", videoUrl: "https://www.youtube.com/results?search_query=execucao+supino+inclinado+com+halteres", defaultSeries: 4, defaultReps: "8-12" },
  { id: 3, nome: "Supino Declinado com Barra", grupoMuscular: "Peito", equipamento: "Barra", videoUrl: "https://www.youtube.com/results?search_query=execucao+supino+declinado+com+barra", defaultSeries: 3, defaultReps: "10-12" },
  { id: 4, nome: "Crucifixo Reto com Halteres", grupoMuscular: "Peito", equipamento: "Halter", videoUrl: "https://www.youtube.com/results?search_query=execucao+crucifixo+reto+com+halteres", defaultSeries: 3, defaultReps: "10-15" },
  { id: 5, nome: "Voador Peitoral (Peck Deck)", grupoMuscular: "Peito", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+voador+peitoral+peck+deck", defaultSeries: 3, defaultReps: "12-15" },
  { id: 6, nome: "Crossover na Polia", grupoMuscular: "Peito", equipamento: "Polia", videoUrl: "https://www.youtube.com/results?search_query=execucao+crossover+na+polia", defaultSeries: 3, defaultReps: "12-15" },
  { id: 7, nome: "Puxada Frontal na Polia", grupoMuscular: "Costas", equipamento: "Polia", videoUrl: "https://www.youtube.com/results?search_query=execucao+puxada+frontal+na+polia", defaultSeries: 4, defaultReps: "8-12" },
  { id: 8, nome: "Remada Curvada com Barra", grupoMuscular: "Costas", equipamento: "Barra", videoUrl: "https://www.youtube.com/results?search_query=execucao+remada+curvada+com+barra", defaultSeries: 4, defaultReps: "8-12" },
  { id: 9, nome: "Remada Baixa na Polia", grupoMuscular: "Costas", equipamento: "Polia", videoUrl: "https://www.youtube.com/results?search_query=execucao+remada+baixa+na+polia", defaultSeries: 3, defaultReps: "10-12" },
  { id: 10, nome: "Remada Unilateral com Halter", grupoMuscular: "Costas", equipamento: "Halter", videoUrl: "https://www.youtube.com/results?search_query=execucao+remada+unilateral+com+halter", defaultSeries: 3, defaultReps: "10-12" },
  { id: 11, nome: "Barra Fixa", grupoMuscular: "Costas", equipamento: "Peso Corporal", videoUrl: "https://www.youtube.com/results?search_query=execucao+barra+fixa", defaultSeries: 3, defaultReps: "6-12" },
  { id: 12, nome: "Puxada com Braços Estendidos na Polia", grupoMuscular: "Costas", equipamento: "Polia", videoUrl: "https://www.youtube.com/results?search_query=execucao+puxada+com+bracos+estendidos+na+polia", defaultSeries: 3, defaultReps: "12-15" },
  { id: 13, nome: "Agachamento Livre com Barra", grupoMuscular: "Pernas", equipamento: "Barra", videoUrl: "https://www.youtube.com/results?search_query=execucao+agachamento+livre+com+barra", defaultSeries: 4, defaultReps: "8-12" },
  { id: 14, nome: "Leg Press 45 Graus", grupoMuscular: "Pernas", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+leg+press+45+graus", defaultSeries: 4, defaultReps: "10-12" },
  { id: 15, nome: "Cadeira Extensora", grupoMuscular: "Pernas", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+cadeira+extensora", defaultSeries: 3, defaultReps: "12-15" },
  { id: 16, nome: "Mesa Flexora", grupoMuscular: "Pernas", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+mesa+flexora", defaultSeries: 3, defaultReps: "10-15" },
  { id: 17, nome: "Stiff com Barra", grupoMuscular: "Pernas", equipamento: "Barra", videoUrl: "https://www.youtube.com/results?search_query=execucao+stiff+com+barra", defaultSeries: 4, defaultReps: "8-12" },
  { id: 18, nome: "Afundo com Halteres", grupoMuscular: "Pernas", equipamento: "Halter", videoUrl: "https://www.youtube.com/results?search_query=execucao+afundo+com+halteres", defaultSeries: 3, defaultReps: "10-12" },
  { id: 19, nome: "Elevação de Panturrilhas em Pé na Máquina", grupoMuscular: "Pernas", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+elevacao+de+panturrilhas+em+pe+na+maquina", defaultSeries: 4, defaultReps: "12-20" },
  { id: 20, nome: "Cadeira Abdutora", grupoMuscular: "Pernas", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+cadeira+abdutora", defaultSeries: 3, defaultReps: "12-15" },
  { id: 21, nome: "Desenvolvimento com Halteres", grupoMuscular: "Ombros", equipamento: "Halter", videoUrl: "https://www.youtube.com/results?search_query=execucao+desenvolvimento+com+halteres", defaultSeries: 4, defaultReps: "8-12" },
  { id: 22, nome: "Desenvolvimento Militar com Barra", grupoMuscular: "Ombros", equipamento: "Barra", videoUrl: "https://www.youtube.com/results?search_query=execucao+desenvolvimento+militar+com+barra", defaultSeries: 4, defaultReps: "8-12" },
  { id: 23, nome: "Elevação Lateral com Halteres", grupoMuscular: "Ombros", equipamento: "Halter", videoUrl: "https://www.youtube.com/results?search_query=execucao+elevacao+lateral+com+halteres", defaultSeries: 3, defaultReps: "12-15" },
  { id: 24, nome: "Elevação Frontal com Halteres", grupoMuscular: "Ombros", equipamento: "Halter", videoUrl: "https://www.youtube.com/results?search_query=execucao+elevacao+frontal+com+halteres", defaultSeries: 3, defaultReps: "10-15" },
  { id: 25, nome: "Crucifixo Inverso na Máquina", grupoMuscular: "Ombros", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+crucifixo+inverso+na+maquina", defaultSeries: 3, defaultReps: "12-15" },
  { id: 26, nome: "Face Pull na Polia", grupoMuscular: "Ombros", equipamento: "Polia", videoUrl: "https://www.youtube.com/results?search_query=execucao+face+pull+na+polia", defaultSeries: 3, defaultReps: "12-15" },
  { id: 27, nome: "Rosca Direta com Barra", grupoMuscular: "Bíceps", equipamento: "Barra", videoUrl: "https://www.youtube.com/results?search_query=execucao+rosca+direta+com+barra", defaultSeries: 4, defaultReps: "8-12" },
  { id: 28, nome: "Rosca Alternada com Halteres", grupoMuscular: "Bíceps", equipamento: "Halter", videoUrl: "https://www.youtube.com/results?search_query=execucao+rosca+alternada+com+halteres", defaultSeries: 3, defaultReps: "10-12" },
  { id: 29, nome: "Rosca Martelo com Halteres", grupoMuscular: "Bíceps", equipamento: "Halter", videoUrl: "https://www.youtube.com/results?search_query=execucao+rosca+martelo+com+halteres", defaultSeries: 3, defaultReps: "10-12" },
  { id: 30, nome: "Rosca Scott na Máquina", grupoMuscular: "Bíceps", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+rosca+scott+na+maquina", defaultSeries: 3, defaultReps: "10-12" },
  { id: 31, nome: "Rosca Concentrada com Halter", grupoMuscular: "Bíceps", equipamento: "Halter", videoUrl: "https://www.youtube.com/results?search_query=execucao+rosca+concentrada+com+halter", defaultSeries: 3, defaultReps: "10-15" },
  { id: 32, nome: "Rosca Direta na Polia", grupoMuscular: "Bíceps", equipamento: "Polia", videoUrl: "https://www.youtube.com/results?search_query=execucao+rosca+direta+na+polia", defaultSeries: 3, defaultReps: "12-15" },
  { id: 33, nome: "Tríceps na Polia com Corda", grupoMuscular: "Tríceps", equipamento: "Polia", videoUrl: "https://www.youtube.com/results?search_query=execucao+triceps+na+polia+com+corda", defaultSeries: 3, defaultReps: "10-15" },
  { id: 34, nome: "Tríceps Testa com Barra", grupoMuscular: "Tríceps", equipamento: "Barra", videoUrl: "https://www.youtube.com/results?search_query=execucao+triceps+testa+com+barra", defaultSeries: 3, defaultReps: "10-12" },
  { id: 35, nome: "Tríceps Francês com Halter", grupoMuscular: "Tríceps", equipamento: "Halter", videoUrl: "https://www.youtube.com/results?search_query=execucao+triceps+frances+com+halter", defaultSeries: 3, defaultReps: "10-12" },
  { id: 36, nome: "Tríceps no Banco", grupoMuscular: "Tríceps", equipamento: "Peso Corporal", videoUrl: "https://www.youtube.com/results?search_query=execucao+triceps+no+banco", defaultSeries: 3, defaultReps: "10-15" },
  { id: 37, nome: "Tríceps Coice com Halter", grupoMuscular: "Tríceps", equipamento: "Halter", videoUrl: "https://www.youtube.com/results?search_query=execucao+triceps+coice+com+halter", defaultSeries: 3, defaultReps: "12-15" },
  { id: 38, nome: "Supino Fechado com Barra", grupoMuscular: "Tríceps", equipamento: "Barra", videoUrl: "https://www.youtube.com/results?search_query=execucao+supino+fechado+com+barra", defaultSeries: 4, defaultReps: "8-12" },
  { id: 39, nome: "Abdominal Supra", grupoMuscular: "Abdômen", equipamento: "Peso Corporal", videoUrl: "https://www.youtube.com/results?search_query=execucao+abdominal+supra", defaultSeries: 3, defaultReps: "15-20" },
  { id: 40, nome: "Abdominal Infra", grupoMuscular: "Abdômen", equipamento: "Peso Corporal", videoUrl: "https://www.youtube.com/results?search_query=execucao+abdominal+infra", defaultSeries: 3, defaultReps: "12-20" },
  { id: 41, nome: "Prancha Frontal", grupoMuscular: "Abdômen", equipamento: "Peso Corporal", videoUrl: "https://www.youtube.com/results?search_query=execucao+prancha+frontal", defaultSeries: 3, defaultReps: "30-60 s" },
  { id: 42, nome: "Elevação de Pernas na Barra Fixa", grupoMuscular: "Abdômen", equipamento: "Peso Corporal", videoUrl: "https://www.youtube.com/results?search_query=execucao+elevacao+de+pernas+na+barra+fixa", defaultSeries: 3, defaultReps: "10-15" },
  { id: 43, nome: "Abdominal na Máquina", grupoMuscular: "Abdômen", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+abdominal+na+maquina", defaultSeries: 3, defaultReps: "12-15" },
  { id: 44, nome: "Abdominal Crunch na Polia", grupoMuscular: "Abdômen", equipamento: "Polia", videoUrl: "https://www.youtube.com/results?search_query=execucao+abdominal+crunch+na+polia", defaultSeries: 3, defaultReps: "12-15" },
  { id: 45, nome: "Caminhada na Esteira", grupoMuscular: "Cardio", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+caminhada+na+esteira", defaultSeries: 1, defaultReps: "20-30 min" },
  { id: 46, nome: "Corrida na Esteira", grupoMuscular: "Cardio", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+corrida+na+esteira", defaultSeries: 1, defaultReps: "15-30 min" },
  { id: 47, nome: "Bicicleta Ergométrica", grupoMuscular: "Cardio", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+bicicleta+ergometrica", defaultSeries: 1, defaultReps: "20-30 min" },
  { id: 48, nome: "Elíptico", grupoMuscular: "Cardio", equipamento: "Máquina", videoUrl: "https://www.youtube.com/results?search_query=execucao+eliptico", defaultSeries: 1, defaultReps: "15-30 min" },
  { id: 49, nome: "Polichinelos", grupoMuscular: "Cardio", equipamento: "Peso Corporal", videoUrl: "https://www.youtube.com/results?search_query=execucao+polichinelos", defaultSeries: 3, defaultReps: "30-60 s" },
  { id: 50, nome: "Corrida Estacionária", grupoMuscular: "Cardio", equipamento: "Peso Corporal", videoUrl: "https://www.youtube.com/results?search_query=execucao+corrida+estacionaria", defaultSeries: 3, defaultReps: "30-60 s" }
];

export async function popularCatalogoSeVazio() {
  try {
    const contagem = await db.catalogo.count();
    if (contagem === 0) {
      const dadosLimpados = exerciciosSeed.map(({ id, ...resto }) => resto);
      await db.catalogo.bulkAdd(dadosLimpados);
      console.log('✅ Catálogo de 50 exercícios inserido no banco com sucesso!');
    } else {
      console.log(`ℹ️ Catálogo já possui ${contagem} exercícios.`);
    }
  } catch (error) {
    console.error('Erro ao popular o catálogo:', error);
  }
}