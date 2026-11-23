import type { IQuemSouEuDataSource } from '@/model/datasources/iQuemSouEuDataSource';
import type {
  QuemSouEuCard,
  QuemSouEuPack,
} from '@/model/entities/quemSouEuCard';
import { DataSourceError } from '@/model/errors';

const DEFAULT_CARDS: QuemSouEuCard[] = [
  // Famosos (8)
  {
    id: 'qse-fam-1',
    name: 'Pelé',
    pack: 'Famosos',
    hint: 'Rei do Futebol brasileiro, tricampeão mundial.',
  },
  {
    id: 'qse-fam-2',
    name: 'Ayrton Senna',
    pack: 'Famosos',
    hint: 'Piloto brasileiro tricampeão de Fórmula 1.',
  },
  {
    id: 'qse-fam-3',
    name: 'Albert Einstein',
    pack: 'Famosos',
    hint: 'Físico alemão autor da teoria da relatividade.',
  },
  {
    id: 'qse-fam-4',
    name: 'Silvio Santos',
    pack: 'Famosos',
    hint: 'Apresentador ícone da TV brasileira e dono do SBT.',
  },
  {
    id: 'qse-fam-5',
    name: 'Michael Jackson',
    pack: 'Famosos',
    hint: 'Rei do Pop, famoso pelo passo moonwalk.',
  },
  {
    id: 'qse-fam-6',
    name: 'Rebeca Andrade',
    pack: 'Famosos',
    hint: 'Ginasta brasileira multimedalhista olímpica.',
  },
  {
    id: 'qse-fam-7',
    name: 'Santos Dumont',
    pack: 'Famosos',
    hint: 'Inventor brasileiro pioneiro da aviação com o 14-Bis.',
  },
  {
    id: 'qse-fam-8',
    name: 'Leonardo da Vinci',
    pack: 'Famosos',
    hint: 'Artista e inventor renascentista que pintou a Mona Lisa.',
  },

  // Animais (8)
  {
    id: 'qse-ani-1',
    name: 'Leão',
    pack: 'Animais',
    hint: 'Felino africano conhecido pela juba e por viver em bandos.',
  },
  {
    id: 'qse-ani-2',
    name: 'Pinguim',
    pack: 'Animais',
    hint: 'Ave que não voa, excelente nadadora de regiões frias.',
  },
  {
    id: 'qse-ani-3',
    name: 'Canguru',
    pack: 'Animais',
    hint: 'Marsupial australiano que se locomove saltando.',
  },
  {
    id: 'qse-ani-4',
    name: 'Polvo',
    pack: 'Animais',
    hint: 'Animal marinho inteligente com oito tentáculos.',
  },
  {
    id: 'qse-ani-5',
    name: 'Girafa',
    pack: 'Animais',
    hint: 'Mamífero terrestre mais alto do mundo, de pescoço longo.',
  },
  {
    id: 'qse-ani-6',
    name: 'Capivara',
    pack: 'Animais',
    hint: 'Maior roedor do mundo, muito comum perto de rios no Brasil.',
  },
  {
    id: 'qse-ani-7',
    name: 'Camaleão',
    pack: 'Animais',
    hint: 'Réptil famoso pela capacidade de mudar de cor.',
  },
  {
    id: 'qse-ani-8',
    name: 'Coruja',
    pack: 'Animais',
    hint: 'Ave noturna que gira a cabeça em grande ângulo.',
  },

  // Filmes e Séries (8)
  {
    id: 'qse-fil-1',
    name: 'Homem-Aranha',
    pack: 'Filmes e Séries',
    hint: 'Herói que lança teias e escala prédios em Nova York.',
  },
  {
    id: 'qse-fil-2',
    name: 'Harry Potter',
    pack: 'Filmes e Séries',
    hint: 'Jovem bruxo de óculos redondos e cicatriz de raio.',
  },
  {
    id: 'qse-fil-3',
    name: 'Darth Vader',
    pack: 'Filmes e Séries',
    hint: 'Vilão de armadura preta e respiração pesada em Star Wars.',
  },
  {
    id: 'qse-fil-4',
    name: 'Chaves',
    pack: 'Filmes e Séries',
    hint: 'Garoto da vila que gosta de sanduíche de presunto.',
  },
  {
    id: 'qse-fil-5',
    name: 'Batman',
    pack: 'Filmes e Séries',
    hint: 'Herói bilionário de Gotham City vestido de morcego.',
  },
  {
    id: 'qse-fil-6',
    name: 'Sherlock Holmes',
    pack: 'Filmes e Séries',
    hint: 'Detetive britânico famoso pelo raciocínio dedutivo.',
  },
  {
    id: 'qse-fil-7',
    name: 'Titanic',
    pack: 'Filmes e Séries',
    hint: 'Filme clássico sobre o navio que colidiu com um iceberg.',
  },
  {
    id: 'qse-fil-8',
    name: 'Jurassic Park',
    pack: 'Filmes e Séries',
    hint: 'Parque temático onde dinossauros voltam à vida.',
  },

  // Desenhos e Animações (8)
  {
    id: 'qse-des-1',
    name: 'Bob Esponja',
    pack: 'Desenhos e Animações',
    hint: 'Esponja amarela que mora num abacaxi no fundo do mar.',
  },
  {
    id: 'qse-des-2',
    name: 'Shrek',
    pack: 'Desenhos e Animações',
    hint: 'Ogro verde que vive em um pântano e tem um amigo burro.',
  },
  {
    id: 'qse-des-3',
    name: 'Scooby-Doo',
    pack: 'Desenhos e Animações',
    hint: 'Cachorro medroso que resolve mistérios com seus amigos.',
  },
  {
    id: 'qse-des-4',
    name: 'Mickey Mouse',
    pack: 'Desenhos e Animações',
    hint: 'Camundongo clássico de orelhas grandes criado por Walt Disney.',
  },
  {
    id: 'qse-des-5',
    name: 'Woody',
    pack: 'Desenhos e Animações',
    hint: 'Boneco caubói protagonista de Toy Story.',
  },
  {
    id: 'qse-des-6',
    name: 'Pica-Pau',
    pack: 'Desenhos e Animações',
    hint: 'Pássaro travesso famoso pela risada inconfundível.',
  },
  {
    id: 'qse-des-7',
    name: 'Simba',
    pack: 'Desenhos e Animações',
    hint: 'Filhote de leão que se torna rei em O Rei Leão.',
  },
  {
    id: 'qse-des-8',
    name: 'Mônica',
    pack: 'Desenhos e Animações',
    hint: 'Personagem brasileira de vestido vermelho dona do coelho Sansão.',
  },

  // Profissões (8)
  {
    id: 'qse-pro-1',
    name: 'Bombeiro',
    pack: 'Profissões',
    hint: 'Profissional que combate incêndios e realiza resgates.',
  },
  {
    id: 'qse-pro-2',
    name: 'Astronauta',
    pack: 'Profissões',
    hint: 'Viaja em missões espaciais fora da atmosfera terrestre.',
  },
  {
    id: 'qse-pro-3',
    name: 'Chef de Cozinha',
    pack: 'Profissões',
    hint: 'Comanda a cozinha e cria receitas em restaurantes.',
  },
  {
    id: 'qse-pro-4',
    name: 'Dentista',
    pack: 'Profissões',
    hint: 'Especialista que cuida da saúde dos dentes e da boca.',
  },
  {
    id: 'qse-pro-5',
    name: 'Professor',
    pack: 'Profissões',
    hint: 'Ensina alunos em escolas ou universidades.',
  },
  {
    id: 'qse-pro-6',
    name: 'Piloto de Avião',
    pack: 'Profissões',
    hint: 'Conduz aeronaves levando passageiros entre cidades.',
  },
  {
    id: 'qse-pro-7',
    name: 'Veterinário',
    pack: 'Profissões',
    hint: 'Médico dedicado a cuidar da saúde dos animais.',
  },
  {
    id: 'qse-pro-8',
    name: 'Fotógrafo',
    pack: 'Profissões',
    hint: 'Registra momentos e paisagens usando câmera e lentes.',
  },

  // Comidas (8)
  {
    id: 'qse-com-1',
    name: 'Pizza',
    pack: 'Comidas',
    hint: 'Massa redonda assada com molho de tomate, queijo e coberturas.',
  },
  {
    id: 'qse-com-2',
    name: 'Brigadeiro',
    pack: 'Comidas',
    hint: 'Doce brasileiro de leite condensado, chocolate e granulado.',
  },
  {
    id: 'qse-com-3',
    name: 'Feijoada',
    pack: 'Comidas',
    hint: 'Prato típico brasileiro feito com feijão preto e carnes.',
  },
  {
    id: 'qse-com-4',
    name: 'Pão de Queijo',
    pack: 'Comidas',
    hint: 'Quitanda mineira quentinha feita com polvilho e queijo.',
  },
  {
    id: 'qse-com-5',
    name: 'Açaí',
    pack: 'Comidas',
    hint: 'Creme roxo gelado de fruto amazônico servido na tigela.',
  },
  {
    id: 'qse-com-6',
    name: 'Pipoca',
    pack: 'Comidas',
    hint: 'Milho estourado indispensável para assistir a filmes.',
  },
  {
    id: 'qse-com-7',
    name: 'Hambúrguer',
    pack: 'Comidas',
    hint: 'Sanduíche com pão redondo, carne grelhada e acompanhamentos.',
  },
  {
    id: 'qse-com-8',
    name: 'Cuscuz',
    pack: 'Comidas',
    hint: 'Prato nordestino feito de flocos de milho cozidos no vapor.',
  },

  // Objetos do Dia a Dia (8)
  {
    id: 'qse-obj-1',
    name: 'Guarda-Chuva',
    pack: 'Objetos do Dia a Dia',
    hint: 'Abre sobre a cabeça para proteger da chuva ou do sol.',
  },
  {
    id: 'qse-obj-2',
    name: 'Escova de Dentes',
    pack: 'Objetos do Dia a Dia',
    hint: 'Usada todos os dias na higiene bucal após as refeições.',
  },
  {
    id: 'qse-obj-3',
    name: 'Chave de Casa',
    pack: 'Objetos do Dia a Dia',
    hint: 'Objeto metálico pequeno usado para abrir fechaduras.',
  },
  {
    id: 'qse-obj-4',
    name: 'Controle Remoto',
    pack: 'Objetos do Dia a Dia',
    hint: 'Muda de canal e ajusta o volume da TV à distância.',
  },
  {
    id: 'qse-obj-5',
    name: 'Mochila',
    pack: 'Objetos do Dia a Dia',
    hint: 'Bolsa levada nas costas com livros, cadernos ou roupas.',
  },
  {
    id: 'qse-obj-6',
    name: 'Relógio de Pulso',
    pack: 'Objetos do Dia a Dia',
    hint: 'Acessório usado no braço para conferir as horas.',
  },
  {
    id: 'qse-obj-7',
    name: 'Óculos de Sol',
    pack: 'Objetos do Dia a Dia',
    hint: 'Protege os olhos da claridade em dias ensolarados.',
  },
  {
    id: 'qse-obj-8',
    name: 'Liquidificador',
    pack: 'Objetos do Dia a Dia',
    hint: 'Eletrodoméstico com lâminas usado para fazer sucos e vitaminas.',
  },

  // Lugares do Mundo (8)
  {
    id: 'qse-lug-1',
    name: 'Torre Eiffel',
    pack: 'Lugares do Mundo',
    hint: 'Monumento de ferro símbolo de Paris, na França.',
  },
  {
    id: 'qse-lug-2',
    name: 'Cristo Redentor',
    pack: 'Lugares do Mundo',
    hint: 'Estátua no alto do Corcovado, no Rio de Janeiro.',
  },
  {
    id: 'qse-lug-3',
    name: 'Pirâmides do Egito',
    pack: 'Lugares do Mundo',
    hint: 'Construções antigas monumentais no deserto de Gizé.',
  },
  {
    id: 'qse-lug-4',
    name: 'Muralha da China',
    pack: 'Lugares do Mundo',
    hint: 'Fortificação histórica gigantesca construída na Ásia.',
  },
  {
    id: 'qse-lug-5',
    name: 'Coliseu',
    pack: 'Lugares do Mundo',
    hint: 'Anfiteatro romano antigo localizado em Roma, na Itália.',
  },
  {
    id: 'qse-lug-6',
    name: 'Machu Picchu',
    pack: 'Lugares do Mundo',
    hint: 'Cidade histórica inca no alto das montanhas do Peru.',
  },
  {
    id: 'qse-lug-7',
    name: 'Estátua da Liberdade',
    pack: 'Lugares do Mundo',
    hint: 'Monumento com tocha na entrada do porto de Nova York.',
  },
  {
    id: 'qse-lug-8',
    name: 'Cataratas do Iguaçu',
    pack: 'Lugares do Mundo',
    hint: 'Conjunto espetacular de quedas-d’água no sul do Brasil.',
  },
];

export class MemoryQuemSouEuDataSource implements IQuemSouEuDataSource {
  private cards: QuemSouEuCard[];

  constructor(initialCards: QuemSouEuCard[] = DEFAULT_CARDS) {
    this.cards = initialCards.map((card) => ({ ...card }));
  }

  async listCards(packs?: QuemSouEuPack[]): Promise<QuemSouEuCard[]> {
    try {
      if (!packs || packs.length === 0) {
        return this.cards.map((card) => ({ ...card }));
      }
      const allowed = new Set(packs);
      return this.cards
        .filter((card) => allowed.has(card.pack))
        .map((card) => ({ ...card }));
    } catch {
      throw new DataSourceError(
        'Não foi possível carregar as cartas de Quem Sou Eu?.'
      );
    }
  }
}
