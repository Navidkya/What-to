import type { Category, DataItem, WhyReason } from '../types';

// ══════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════
export const CATS: Category[] = [
  { id: 'watch', icon: '🎬', name: 'Ver', color: '#6ab4e0', trackable: true, expensive: false, moods: ['Tudo', 'Série', 'Filme', 'Documentário', 'Drama', 'Suspense', 'Sci-Fi', 'Comédia', 'Crime', 'Romance'] },
  { id: 'eat', icon: '🍽️', name: 'Comer', color: '#e8a07a', trackable: false, expensive: true, moods: ['Tudo', 'Receita', 'Restaurante', 'Delivery', 'Vegetariano', 'Rápido', 'Especial', 'Italiano', 'Japonês', 'Português'] },
  { id: 'read', icon: '📚', name: 'Ler', color: '#a07ae8', trackable: true, expensive: false, moods: ['Tudo', 'Livro', 'Romance', 'Ensaio', 'Sci-Fi', 'Biografia', 'Artigo'] },
  { id: 'listen', icon: '🎵', name: 'Ouvir', color: '#e87ac4', trackable: false, expensive: false, moods: ['Tudo', 'Álbum', 'Podcast', 'Pop', 'Hip-Hop', 'Jazz', 'Electrónica'] },
  { id: 'play', icon: '🎮', name: 'Jogar', color: '#5ec97a', trackable: true, expensive: false, moods: ['Tudo', 'Videojogo', 'Tabuleiro', 'RPG', 'Ação', 'Puzzle', 'Estratégia'] },
  { id: 'learn', icon: '🧠', name: 'Aprender', color: '#e8e07a', trackable: false, expensive: false, moods: ['Tudo', 'Tecnologia', 'Arte', 'Negócios', 'Ciência', 'Línguas', 'Design'] },
  { id: 'visit', icon: '📍', name: 'Visitar', color: '#e07070', trackable: false, expensive: true, moods: ['Tudo', 'Restaurante', 'Bar', 'Museu', 'Experiência', 'Natureza', 'Miradouro'] },
  { id: 'do', icon: '🎯', name: 'Fazer', color: '#5ec9c4', trackable: false, expensive: false, moods: ['Tudo', 'A dois', 'Em família', 'Solo', 'Interior', 'Exterior', 'Criativo'] },
];

// ══════════════════════════════════════
// GRADIENTS
// ══════════════════════════════════════
export const GRAD: Record<string, string> = {
  watch: '135deg,#0a1628,#1a2a4a',
  eat: '135deg,#2a0f05,#1a1205',
  read: '135deg,#0f0a28,#1a1235',
  listen: '135deg,#28051a,#1a0512',
  play: '135deg,#052812,#081a0a',
  learn: '135deg,#28250a,#1a1805',
  visit: '135deg,#280a0a,#1a0505',
  do: '135deg,#052828,#051a1a',
};

// ══════════════════════════════════════
// GENRES
// ══════════════════════════════════════
export const GENRES: Record<string, string[]> = {
  watch: ['Drama', 'Suspense', 'Sci-Fi', 'Crime', 'Romance', 'Documentário'],
  eat: ['Italiano', 'Japonês', 'Português', 'Mexicano', 'Mediterrânico'],
  read: ['Psicologia', 'História', 'Sci-Fi', 'Romance'],
  listen: ['Hip-Hop', 'Pop', 'Jazz', 'Ciência'],
  play: ['Roguelite', 'Plataforma', 'RPG', 'Estratégia'],
  learn: ['IA', 'Arte', 'Meditação', 'Línguas'],
  visit: ['Histórico', 'Arte', 'Bar', 'Cultural'],
  do: ['Natureza', 'Bem-estar', 'Criativo'],
};

// ══════════════════════════════════════
// TRACKING STATES
// ══════════════════════════════════════
export const TSTATE = [
  { id: 'watching', l: 'A ver', i: '▶️' },
  { id: 'paused', l: 'Pausado', i: '⏸' },
  { id: 'done', l: 'Terminado', i: '✅' },
  { id: 'dropped', l: 'Desisti', i: '🚫' },
  { id: 'want', l: 'Quero', i: '⭐' },
];

export const TCOLOR: Record<string, string> = {
  watching: '#6ab4e0',
  paused: '#e8e07a',
  done: '#5ec97a',
  dropped: '#e07070',
  want: '#d4a84b',
};

// ══════════════════════════════════════
// PLATFORMS
// ══════════════════════════════════════
export const ALL_PLATFORMS = [
  { id: 'netflix', n: 'Netflix', c: '#E50914' },
  { id: 'disney', n: 'Disney+', c: '#113CCF' },
  { id: 'hbo', n: 'HBO Max', c: '#5822b4' },
  { id: 'apple', n: 'Apple TV+', c: '#555' },
  { id: 'prime', n: 'Prime Video', c: '#00A8E0' },
  { id: 'spotify', n: 'Spotify', c: '#1DB954' },
  { id: 'steam', n: 'Steam', c: '#c6d4df' },
  { id: 'playstation', n: 'PlayStation', c: '#003087' },
  { id: 'youtube', n: 'YouTube', c: '#FF0000' },
  { id: 'crunchyroll', n: 'Crunchyroll', c: '#F47521' },
];

export function getPlatformId(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes('netflix')) return 'netflix';
  if (n.includes('disney')) return 'disney';
  if (n.includes('hbo') || n.includes('max')) return 'hbo';
  if (n.includes('apple')) return 'apple';
  if (n.includes('prime')) return 'prime';
  if (n.includes('spotify')) return 'spotify';
  if (n.includes('steam')) return 'steam';
  if (n.includes('playstation') || n.includes('ps')) return 'playstation';
  if (n.includes('youtube')) return 'youtube';
  return null;
}

// ══════════════════════════════════════
// DATA
// ══════════════════════════════════════
export const DATA: Record<string, DataItem[]> = {
  watch: [
    { title: 'Severance', year: '2022– · Apple TV+', type: 'Série', genre: 'Suspense', rating: 8.7, desc: 'O que acontece quando separas a tua memória de trabalho da pessoal? Uma das séries mais originais dos últimos anos.', emoji: '🏢', dur: 'curto', peso: 'medio', platforms: [{ n: 'Apple TV+', url: 'https://tv.apple.com/show/severance/0hr5vh1atp5sxtl83p5q6l58k', c: '#555' }] },
    { title: 'The Bear', year: '2022– · Disney+', type: 'Série', genre: 'Drama', rating: 8.7, desc: 'Chef de fine dining volta a gerir a tasca da família. Caótico, tenso, absolutamente brilhante.', emoji: '👨‍🍳', dur: 'curto', peso: 'pesado', platforms: [{ n: 'Disney+', url: 'https://www.disneyplus.com/series/the-bear/55XyNMdFIiGM', c: '#113CCF' }] },
    { title: 'Shōgun', year: '2024 · Disney+', type: 'Série', genre: 'Drama', rating: 8.9, desc: 'Japão feudal, 1600. Um navegador inglês entre guerras de poder e honra. Épico e intimíssimo.', emoji: '⚔️', dur: 'longo', peso: 'pesado', platforms: [{ n: 'Disney+', url: 'https://www.disneyplus.com/series/shogun/3PiRa7GELfDz', c: '#113CCF' }] },
    { title: 'The Last of Us', year: '2023– · HBO Max', type: 'Série', genre: 'Drama', rating: 8.8, desc: 'Num mundo pós-apocalíptico, um homem atravessa o país com uma rapariga imune. Devastador.', emoji: '🍄', dur: 'medio', peso: 'pesado', platforms: [{ n: 'HBO Max', url: 'https://www.max.com/shows/the-last-of-us', c: '#5822b4' }] },
    { title: 'Succession', year: '2018–2023 · HBO', type: 'Série', genre: 'Drama', rating: 8.8, desc: 'Uma família disfuncional luta pelo controlo de um império mediático. Shakespeare no séc XXI.', emoji: '👔', dur: 'longo', peso: 'pesado', platforms: [{ n: 'HBO Max', url: 'https://www.max.com/shows/succession', c: '#5822b4' }] },
    { title: 'Ripley', year: '2024 · Netflix', type: 'Série', genre: 'Suspense', rating: 8.3, desc: 'Tom Ripley nos anos 60 italianos. A preto e branco perturbante. Andrew Scott hipnótico.', emoji: '🎭', dur: 'medio', peso: 'medio', platforms: [{ n: 'Netflix', url: 'https://www.netflix.com/title/81678109', c: '#E50914' }] },
    { title: 'The Penguin', year: '2024 · HBO Max', type: 'Série', genre: 'Crime', rating: 8.4, desc: 'Oz Cobb ascende ao poder criminal em Gotham. Surpreendentemente humano e brutal.', emoji: '🐧', dur: 'curto', peso: 'medio', platforms: [{ n: 'HBO Max', url: 'https://www.max.com/shows/the-penguin', c: '#5822b4' }] },
    { title: 'Oppenheimer', year: '2023 · Filme', type: 'Filme', genre: 'Drama', rating: 8.3, desc: 'A história do homem que criou a bomba. Nolan épico e íntimo ao mesmo tempo.', emoji: '☢️', dur: 'longo', peso: 'pesado', platforms: [{ n: 'Netflix →', url: 'https://www.netflix.com/search?q=Oppenheimer', c: '#E50914' }, { n: 'Prime →', url: 'https://www.primevideo.com/search/ref=atv_nb_sr?phrase=Oppenheimer', c: '#00A8E0' }] },
    { title: 'Past Lives', year: '2023 · Filme', type: 'Filme', genre: 'Romance', rating: 7.9, desc: 'Dois amigos de infância reencontram-se décadas depois. Sobre escolhas, destino, e o amor que ficou.', emoji: '🌙', dur: 'curto', peso: 'medio', platforms: [{ n: 'Netflix →', url: 'https://www.netflix.com/search?q=Past+Lives', c: '#E50914' }] },
    { title: 'Dune: Part Two', year: '2024 · Filme', type: 'Filme', genre: 'Sci-Fi', rating: 8.5, desc: 'Paul une-se aos Fremen. Visualmente deslumbrante e épico.', emoji: '🏜️', dur: 'longo', peso: 'pesado', platforms: [{ n: 'Netflix →', url: 'https://www.netflix.com/search?q=Dune+Part+Two', c: '#E50914' }] },
    { title: 'Poor Things', year: '2023 · Filme', type: 'Filme', genre: 'Drama', rating: 8.0, desc: 'Bella Baxter renasce com a mente de criança num corpo adulto. Yorgos Lanthimos magistral.', emoji: '🧪', dur: 'medio', peso: 'medio', platforms: [{ n: 'Disney+', url: 'https://www.disneyplus.com/search?q=Poor+Things', c: '#113CCF' }] },
    { title: 'Free Solo', year: '2018', type: 'Documentário', genre: 'Documentário', rating: 8.2, desc: 'Alex Honnold sobe 900m sem cordas. Prende literalmente a respiração.', emoji: '🧗', dur: 'curto', peso: 'leve', platforms: [{ n: 'Disney+', url: 'https://www.disneyplus.com/search?q=Free+Solo', c: '#113CCF' }] },
    { title: 'All of Us Strangers', year: '2023 · Filme', type: 'Filme', genre: 'Romance', rating: 7.7, desc: 'Um escritor reconecta-se com os pais que morreram. Fantasmático e devastador.', emoji: '👻', dur: 'curto', peso: 'pesado', platforms: [{ n: 'Disney+', url: 'https://www.disneyplus.com/movies/all-of-us-strangers', c: '#113CCF' }] },
    { title: 'Alien: Romulus', year: '2024 · Filme', type: 'Filme', genre: 'Sci-Fi', rating: 7.3, desc: 'Jovens colonizadores encontram a forma de vida mais aterradora do universo.', emoji: '👽', dur: 'curto', peso: 'medio', platforms: [{ n: 'Disney+', url: 'https://www.disneyplus.com/search?q=Alien+Romulus', c: '#113CCF' }] },
  ],
  eat: [
    { title: 'Risotto de Cogumelos', year: '45 min · Casa', type: 'Receita', genre: 'Italiano', rating: 9.2, desc: 'Cremoso, reconfortante. Parmesão, cogumelos shiitake, vinho branco.', emoji: '🍄', peso: 'pesado', carne: false, comp: 'medio', custo: 'baixo', local: 'casa', platforms: [] },
    { title: 'Tacos de Camarão', year: '25 min · Casa', type: 'Receita', genre: 'Mexicano', rating: 9.0, desc: 'Camarão com pimentão fumado, guacamole fresco, crema de lima.', emoji: '🌮', peso: 'medio', carne: false, comp: 'simples', custo: 'baixo', local: 'casa', platforms: [] },
    { title: 'Pasta Cacio e Pepe', year: '20 min · Casa', type: 'Receita', genre: 'Italiano', rating: 9.1, desc: 'Três ingredientes: esparguete, Pecorino, pimenta. A mais simples e difícil de fazer bem.', emoji: '🧀', peso: 'pesado', carne: false, comp: 'simples', custo: 'baixo', local: 'casa', platforms: [] },
    { title: 'Bowl de Salmão Teriyaki', year: '30 min · Casa', type: 'Receita', genre: 'Japonês', rating: 8.9, desc: 'Salmão glaceado, arroz, pepino, edamame, sésamo.', emoji: '🐟', peso: 'leve', carne: false, comp: 'simples', custo: 'medio', local: 'casa', platforms: [] },
    { title: 'Pizza Napoletana', year: '35 min · Casa', type: 'Receita', genre: 'Italiano', rating: 9.3, desc: 'Massa de 24h, San Marzano, mozzarella di bufala. Frigideira + grill faz milagres.', emoji: '🍕', peso: 'pesado', carne: false, comp: 'medio', custo: 'baixo', local: 'casa', platforms: [] },
    { title: 'Salada Niçoise', year: '20 min · Casa', type: 'Receita', genre: 'Francês', rating: 8.5, desc: 'Atum, ovos, azeitonas, tomate, feijão verde. Leve e saciante.', emoji: '🥗', peso: 'leve', carne: false, comp: 'simples', custo: 'baixo', local: 'casa', platforms: [] },
    { title: 'Frango com Limão e Alho', year: '50 min · Casa', type: 'Receita', genre: 'Mediterrânico', rating: 8.8, desc: 'Coxas marinadas em alho, limão, tomilho. Douradas e estaladiças.', emoji: '🍋', peso: 'medio', carne: true, comp: 'simples', custo: 'baixo', local: 'casa', platforms: [] },
    { title: 'Wok de Legumes', year: '20 min · Casa', type: 'Receita', genre: 'Asiático', rating: 8.4, desc: 'Salteados a alta temperatura com soja, gengibre, alho.', emoji: '🥦', peso: 'leve', carne: false, comp: 'simples', custo: 'baixo', local: 'casa', platforms: [] },
    { title: 'Belcanto', year: 'Chiado, Lisboa', type: 'Restaurante', genre: 'Fine Dining', rating: 9.5, desc: '2 estrelas Michelin de José Avillez. Uma refeição que conta uma história de Portugal.', emoji: '⭐', peso: 'pesado', carne: true, comp: 'especial', custo: 'alto', local: 'fora', platforms: [{ n: 'Reservar', url: 'https://www.belcanto.pt/reservas', c: '#8B7355' }, { n: 'Maps', url: 'https://maps.google.com/?q=Belcanto+Lisboa', c: '#4285F4' }] },
    { title: 'Tasca do Chico', year: 'Bairro Alto', type: 'Restaurante', genre: 'Petiscos', rating: 8.8, desc: 'Fado ao vivo, petiscos de autor. Reserva obrigatória.', emoji: '🍷', peso: 'medio', carne: true, comp: 'medio', custo: 'medio', local: 'fora', platforms: [{ n: 'Maps', url: 'https://maps.google.com/?q=Tasca+do+Chico+Lisboa', c: '#4285F4' }] },
    { title: 'Taberna da Rua das Flores', year: 'Lisboa', type: 'Restaurante', genre: 'Português', rating: 8.6, desc: 'Cozinha portuguesa honesta, menu que muda com a época.', emoji: '🌸', peso: 'medio', carne: true, comp: 'medio', custo: 'medio', local: 'fora', platforms: [{ n: 'Maps', url: 'https://maps.google.com/?q=Taberna+Rua+das+Flores+Lisboa', c: '#4285F4' }] },
    { title: 'Sushi Delivery', year: '40 min · Delivery', type: 'Delivery', genre: 'Japonês', rating: 8.7, desc: 'Noite de sushi sem sair. Nigiri, maki, temaki de um dos melhores de Lisboa.', emoji: '🍣', peso: 'leve', carne: false, comp: 'simples', custo: 'medio', local: 'casa', platforms: [{ n: 'Uber Eats', url: 'https://www.ubereats.com/pt/category/lisbon-pt/japanese', c: '#06C167' }, { n: 'Glovo', url: 'https://glovoapp.com/pt/en/lisbon/food/', c: '#FFC244' }] },
  ],
  read: [
    { title: 'Dune', year: 'Frank Herbert', type: 'Ficção Científica', genre: 'Sci-Fi', rating: 9.3, desc: 'Épico espacial: política, religião e ecologia num planeta deserto. A saga de Paul Atreides.', emoji: '🏜️', dur: 'longo', isbn: '9780441013593', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/44767458', c: '#553B08' }] },
    { title: '1984', year: 'George Orwell', type: 'Distopia', genre: 'Ficção', rating: 9.2, desc: 'Sociedade totalitária onde o Grande Irmão controla tudo. Mais relevante do que nunca.', emoji: '👁️', dur: 'medio', isbn: '9780451524935', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/5470', c: '#553B08' }] },
    { title: 'Sapiens', year: 'Yuval Noah Harari', type: 'Ensaio', genre: 'História', rating: 9.1, desc: 'A história da humanidade de forma que não consegues parar de ler.', emoji: '🦴', dur: 'longo', isbn: '9780062316097', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/23692271', c: '#553B08' }] },
    { title: 'Atomic Habits', year: 'James Clear', type: 'Ensaio', genre: 'Autodesenvolvimento', rating: 8.7, desc: 'Pequenas mudanças de 1% que constroem bons hábitos. Prático e funciona.', emoji: '⚛️', dur: 'medio', isbn: '9780735211292', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/40121378', c: '#553B08' }] },
    { title: 'Project Hail Mary', year: 'Andy Weir', type: 'Ficção Científica', genre: 'Sci-Fi', rating: 9.4, desc: 'Um homem acorda sozinho no espaço sem saber quem é. O sci-fi mais emocionante dos últimos anos.', emoji: '🚀', dur: 'longo', isbn: '9780593135204', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/54493401', c: '#553B08' }] },
    { title: 'The Midnight Library', year: 'Matt Haig', type: 'Romance', genre: 'Ficção', rating: 8.5, desc: 'Entre a vida e a morte existe uma biblioteca com livros que mostram vidas alternativas.', emoji: '🌌', dur: 'medio', isbn: '9780525559474', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/52578297', c: '#553B08' }] },
    { title: 'O Senhor dos Anéis', year: 'J.R.R. Tolkien', type: 'Fantasia', genre: 'Fantasia', rating: 9.5, desc: 'A demanda do Anel Único e a Guerra do Anel. A fantasia que criou o género moderno.', emoji: '💍', dur: 'longo', isbn: '9780618640157', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/33', c: '#553B08' }] },
    { title: 'Thinking, Fast and Slow', year: 'Daniel Kahneman', type: 'Ensaio', genre: 'Psicologia', rating: 9.0, desc: 'Dois sistemas que guiam o pensamento. Muda como te vês a tomar decisões.', emoji: '🧩', dur: 'longo', isbn: '9780374533557', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/11468377', c: '#553B08' }] },
    { title: 'Gone Girl', year: 'Gillian Flynn', type: 'Thriller', genre: 'Thriller', rating: 8.6, desc: 'Amy desaparece. Nick é o principal suspeito. Nenhum é quem parece. Narrador não confiável magistral.', emoji: '🔪', dur: 'medio', isbn: '9780307588371', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/19288043', c: '#553B08' }] },
    { title: 'O Alquimista', year: 'Paulo Coelho', type: 'Ficção', genre: 'Ficção', rating: 8.2, desc: 'A jornada de um pastor andaluz em busca do seu tesouro pessoal. Uma fábula atemporal.', emoji: '✨', dur: 'curto', isbn: '9780061122415', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/865', c: '#553B08' }] },
    { title: 'Normal People', year: 'Sally Rooney', type: 'Romance', genre: 'Romance', rating: 8.4, desc: 'Connell e Marianne, do liceu à universidade. Sobre poder, linguagem, invisibilidade.', emoji: '💙', dur: 'medio', isbn: '9781984822178', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/41057294', c: '#553B08' }] },
    { title: 'Educated', year: 'Tara Westover', type: 'Biografia', genre: 'Biografia', rating: 9.1, desc: 'Uma mulher criada por sobrevivencialistas que chegou a Cambridge. Devastador e inspirador.', emoji: '📖', dur: 'longo', isbn: '9780399590504', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/35133922', c: '#553B08' }] },
    { title: 'The Hitchhiker\'s Guide to the Galaxy', year: 'Douglas Adams', type: 'Comédia', genre: 'Comédia', rating: 8.9, desc: 'A Terra é demolida. A resposta é 42. O livro mais hilariante e filosófico do género.', emoji: '🌍', dur: 'curto', isbn: '9780345391803', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/11', c: '#553B08' }] },
    { title: 'Meditações', year: 'Marco Aurélio', type: 'Ensaio', genre: 'Filosofia', rating: 9.0, desc: 'O diário do imperador mais poderoso de Roma. Estoicismo puro e aplicável hoje.', emoji: '🏛️', dur: 'curto', isbn: '9780812968255', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/30659', c: '#553B08' }] },
    { title: 'The Remains of the Day', year: 'Kazuo Ishiguro', type: 'Romance', genre: 'Drama', rating: 8.9, desc: 'Um mordomo reflete sobre as escolhas que não fez. Silencioso e devastador.', emoji: '🏡', dur: 'longo', isbn: '9780679731726', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/28921', c: '#553B08' }] },
    { title: 'The Kite Runner', year: 'Khaled Hosseini', type: 'Drama', genre: 'Drama', rating: 9.0, desc: 'Amizade, traição e redenção no Afeganistão. Devastadoramente belo.', emoji: '🪁', dur: 'longo', isbn: '9781594631931', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/77203', c: '#553B08' }] },
    { title: 'Uma Breve História do Tempo', year: 'Stephen Hawking', type: 'Ensaio', genre: 'Ciência', rating: 8.8, desc: 'Do Big Bang aos buracos negros. Física explicada para quem não é físico.', emoji: '🌌', dur: 'medio', isbn: '9780553380163', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/3869', c: '#553B08' }] },
    { title: 'The Subtle Art of Not Giving a F*ck', year: 'Mark Manson', type: 'Ensaio', genre: 'Autodesenvolvimento', rating: 7.9, desc: 'Escolhe o que realmente importa. Honesto, irreverente e surpreendentemente profundo.', emoji: '🖕', dur: 'curto', isbn: '9780062457714', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/28257707', c: '#553B08' }] },
    { title: 'Tudo é Rio', year: 'Carla Madeira', type: 'Romance', genre: 'Romance', rating: 8.7, desc: 'Uma história de amor, ciúme e perdão da autora portuguesa mais lida da atualidade.', emoji: '🌊', dur: 'medio', isbn: '9789897568473', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/18889047', c: '#553B08' }] },
    { title: 'Bad Science', year: 'Ben Goldacre', type: 'Ensaio', genre: 'Ciência', rating: 8.6, desc: 'Como a indústria farmacêutica, media e charlatões distorcem a ciência. Essencial.', emoji: '🔬', dur: 'medio', isbn: '9780007240197', platforms: [{ n: 'Goodreads', url: 'https://www.goodreads.com/book/show/3272165', c: '#553B08' }] },
  ],
  listen: [
    { title: 'GNX', year: '2024 · Kendrick Lamar', type: 'Álbum', genre: 'Hip-Hop', rating: 9.1, desc: 'Surpresa de fim de ano. Um rapper no absoluto auge da forma.', emoji: '🎤', platforms: [{ n: 'Spotify', url: 'https://open.spotify.com/search/GNX%20Kendrick%20Lamar', c: '#1DB954' }, { n: 'Apple Music', url: 'https://music.apple.com/search?term=GNX+Kendrick', c: '#FA243C' }] },
    { title: 'Cowboy Carter', year: '2024 · Beyoncé', type: 'Álbum', genre: 'Pop', rating: 8.8, desc: 'Um álbum de country que não soa a nenhum country. Audacioso e irresistível.', emoji: '🤠', platforms: [{ n: 'Spotify', url: 'https://open.spotify.com/search/Cowboy%20Carter', c: '#1DB954' }] },
    { title: 'Kind of Blue', year: 'Miles Davis', type: 'Álbum', genre: 'Jazz', rating: 9.8, desc: 'O álbum de jazz mais vendido de sempre. Para as noites em que precisas de fundo.', emoji: '🎷', platforms: [{ n: 'Spotify', url: 'https://open.spotify.com/search/Kind%20of%20Blue%20Miles%20Davis', c: '#1DB954' }] },
    { title: 'Huberman Lab', year: 'Podcast · Ciência', type: 'Podcast', genre: 'Ciência', rating: 8.7, desc: 'Protocolos de sono, luz e cognição. 90 minutos que mudam hábitos.', emoji: '🧬', platforms: [{ n: 'Spotify', url: 'https://open.spotify.com/search/huberman%20lab', c: '#1DB954' }, { n: 'YouTube', url: 'https://www.youtube.com/@hubermanlab', c: '#FF0000' }] },
    { title: "Short n' Sweet", year: '2024 · Sabrina Carpenter', type: 'Álbum', genre: 'Pop', rating: 8.6, desc: 'Pop com precisão cirúrgica. O álbum de verão que toda a gente precisava.', emoji: '🍬', platforms: [{ n: 'Spotify', url: 'https://open.spotify.com/search/Short+Sweet+Sabrina', c: '#1DB954' }] },
  ],
  play: [
    { title: 'Elden Ring', year: '2022 · PC/PS5/Xbox', type: 'Videojogo', genre: 'RPG', rating: 9.6, desc: 'Mundo aberto épico de FromSoftware. Cada área esconde segredos e batalhas memoráveis.', emoji: '⚔️', steamId: 1245620, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/1245620/ELDEN_RING/', c: '#c6d4df' }, { n: 'PS', url: 'https://store.playstation.com/search/Elden%20Ring', c: '#003087' }] },
    { title: 'God of War Ragnarök', year: '2022 · PS5/PS4', type: 'Videojogo', genre: 'Ação', rating: 9.4, desc: 'Kratos e Atreus enfrentam o fim do mundo nórdico. Narrativa e combate perfeitos.', emoji: '🪓', steamId: 1593500, platforms: [{ n: 'PS5', url: 'https://store.playstation.com/search/god+of+war+ragnarok', c: '#003087' }] },
    { title: 'Red Dead Redemption 2', year: '2018 · PC/Console', type: 'Videojogo', genre: 'Aventura', rating: 9.7, desc: 'O mais épico western em mundo aberto. Arthur Morgan, 1899. Inesquecível.', emoji: '🤠', steamId: 1174180, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/1174180/', c: '#c6d4df' }] },
    { title: 'Cyberpunk 2077', year: '2020 · PC/PS5/Xbox', type: 'Videojogo', genre: 'RPG', rating: 8.8, desc: 'Night City, futuro distópico. Melhorou muito — agora é um dos melhores RPGs.', emoji: '🤖', steamId: 1091500, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/1091500/Cyberpunk_2077/', c: '#c6d4df' }] },
    { title: 'The Witcher 3', year: '2015 · PC/Console', type: 'Videojogo', genre: 'RPG', rating: 9.8, desc: 'Geralt de Rívia em busca da filha adotiva. O melhor RPG ocidental de todos os tempos.', emoji: '🗡️', steamId: 292030, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/292030/', c: '#c6d4df' }] },
    { title: 'Balatro', year: '2024 · PC/Console', type: 'Videojogo', genre: 'Roguelite', rating: 9.5, desc: 'Poker com curingas e poderes. Combinações infinitas. Impossível de parar.', emoji: '🃏', steamId: 2379780, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/2379780/Balatro/', c: '#c6d4df' }] },
    { title: 'Hades', year: '2020 · PC/Switch', type: 'Videojogo', genre: 'Roguelite', rating: 9.5, desc: 'Foge do Submundo grego com poderes dos deuses. Cada morte melhora a personagem.', emoji: '🔱', steamId: 1145360, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/1145360/Hades/', c: '#c6d4df' }] },
    { title: 'Stardew Valley', year: '2016 · PC/Switch/Mobile', type: 'Videojogo', genre: 'Simulação', rating: 9.3, desc: 'Herda uma quinta e reconstrói a tua vida. Relaxante, profundo e infinitamente recompensador.', emoji: '🌾', steamId: 413150, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/413150/Stardew_Valley/', c: '#c6d4df' }] },
    { title: 'Portal 2', year: '2011 · PC', type: 'Videojogo', genre: 'Puzzle', rating: 9.7, desc: 'Puzzles com portais e física. Humor brilhante, co-op fantástico. O melhor puzzle de sempre.', emoji: '🌀', steamId: 620, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/620/Portal_2/', c: '#c6d4df' }] },
    { title: 'Hollow Knight', year: '2017 · PC/Switch', type: 'Videojogo', genre: 'Ação', rating: 9.2, desc: 'Cavaleiro inseto explora reino subterrâneo. Arte lindíssima, desafiante e recompensador.', emoji: '🦋', steamId: 367520, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/367520/Hollow_Knight/', c: '#c6d4df' }] },
    { title: 'Celeste', year: '2018 · PC/Switch', type: 'Videojogo', genre: 'Plataformas', rating: 9.3, desc: 'Plataformas perfeitas + história sobre saúde mental. Difícil mas sempre justo.', emoji: '🏔️', steamId: 504230, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/504230/Celeste/', c: '#c6d4df' }] },
    { title: 'Disco Elysium', year: '2019 · PC', type: 'Videojogo', genre: 'RPG', rating: 9.0, desc: 'RPG de detetive onde a narrativa é tudo. A escrita mais brilhante num videojogo.', emoji: '🕵️', steamId: 632470, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/632470/Disco_Elysium/', c: '#c6d4df' }] },
    { title: 'Sekiro', year: '2019 · PC/Console', type: 'Videojogo', genre: 'Ação', rating: 9.1, desc: 'Samurai japonês no Sengoku. Combate mais exigente de FromSoftware. Brutal e viciante.', emoji: '🎌', steamId: 814380, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/814380/Sekiro/', c: '#c6d4df' }] },
    { title: 'Astro Bot', year: '2024 · PS5', type: 'Videojogo', genre: 'Plataformas', rating: 9.4, desc: 'O jogo de plataforma mais alegre e criativo dos últimos anos. Exclusivo PS5.', emoji: '🤖', steamId: null, platforms: [{ n: 'PlayStation', url: 'https://store.playstation.com/search/astro%20bot', c: '#003087' }] },
    { title: 'Undertale', year: '2015 · PC/Switch', type: 'Videojogo', genre: 'RPG', rating: 9.4, desc: 'RPG onde não precisas de matar ninguém. Subverte todas as expectativas do género.', emoji: '❤️', steamId: 391540, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/391540/Undertale/', c: '#c6d4df' }] },
    { title: 'GTA V', year: '2013 · PC/PS5/Xbox', type: 'Videojogo', genre: 'Ação', rating: 8.8, desc: 'Crime e caos em Los Santos. Mundo aberto enorme com história e multiplayer imbatíveis.', emoji: '🚗', steamId: 271590, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/271590/', c: '#c6d4df' }] },
    { title: 'Return of the Obra Dinn', year: '2018 · PC', type: 'Videojogo', genre: 'Puzzle', rating: 9.1, desc: 'Investiga o destino de 60 tripulantes de um navio fantasma. Visual único, detetive puro.', emoji: '⚓', steamId: 653530, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/653530/', c: '#c6d4df' }] },
    { title: 'Minecraft', year: '2011 · PC/Console/Mobile', type: 'Videojogo', genre: 'Sandbox', rating: 9.0, desc: 'Constrói, explora, sobrevive. O jogo mais vendido de sempre por boas razões.', emoji: '⛏️', steamId: null, platforms: [{ n: 'Loja', url: 'https://www.minecraft.net/pt-pt/store', c: '#555' }] },
    { title: 'Wingspan', year: 'Tabuleiro · 1-5 jog', type: 'Tabuleiro', genre: 'Estratégia', rating: 8.8, desc: 'Colecionas pássaros, construís habitats. Bonito, relaxado e profundo.', emoji: '🦜', steamId: null, platforms: [{ n: 'BGA', url: 'https://boardgamearena.com/gamepanel?game=wingspan', c: '#4a90d9' }] },
    { title: 'Among Us', year: '2018 · PC/Mobile', type: 'Videojogo', genre: 'Social', rating: 8.3, desc: 'Encontra o impostor a bordo da nave. Perfeito para grupos. Mentira e dedução.', emoji: '🔪', steamId: 945360, platforms: [{ n: 'Steam', url: 'https://store.steampowered.com/app/945360/', c: '#c6d4df' }] },
  ],
  learn: [
    { title: 'Como funciona a IA', year: '2-3h · YouTube', type: 'Tecnologia', genre: 'IA', rating: 9.0, desc: 'Introdução visual a LLMs sem matemática.', emoji: '🤖', platforms: [{ n: '3Blue1Brown', url: 'https://www.youtube.com/watch?v=wjZofJX0v4M', c: '#FF0000' }] },
    { title: 'Fotografia com telemóvel', year: '3h · YouTube', type: 'Arte', genre: 'Fotografia', rating: 8.8, desc: 'Composição, luz natural, edição apenas com o telemóvel.', emoji: '📷', platforms: [{ n: 'YouTube', url: 'https://www.youtube.com/results?search_query=phone+photography+composition', c: '#FF0000' }] },
    { title: 'Meditação — 10 dias', year: '10 min/dia', type: 'Bem-estar', genre: 'Meditação', rating: 9.2, desc: 'Headspace para iniciantes. 10 minutos que mudam a relação com o teu cérebro.', emoji: '🧘', platforms: [{ n: 'Headspace', url: 'https://www.headspace.com/meditation/10-day-beginners', c: '#FF6B6B' }] },
    { title: 'Espanhol em 30 dias', year: '15 min/dia', type: 'Línguas', genre: 'Línguas', rating: 8.5, desc: 'Com o português que tens, em 3 meses estás a ter conversas básicas.', emoji: '🇪🇸', platforms: [{ n: 'Duolingo', url: 'https://www.duolingo.com/course/es/pt/Learn-Spanish', c: '#58CC02' }] },
  ],
  visit: [
    { title: 'Quinta da Regaleira', year: 'Sintra', type: 'Experiência', genre: 'Histórico', rating: 9.3, desc: 'Palácio e jardins com poços iniciáticos. A 40 min de Lisboa.', emoji: '🏰', custo: 'baixo', platforms: [{ n: 'Bilhetes', url: 'https://www.regaleira.pt/pt/visitar', c: '#228B22' }, { n: 'Maps', url: 'https://maps.google.com/?q=Quinta+da+Regaleira', c: '#4285F4' }] },
    { title: 'Museu do Azulejo', year: 'Lisboa', type: 'Museu', genre: 'Arte', rating: 9.0, desc: 'O painel panorâmico do séc. XVIII justifica a visita. Raramente cheio.', emoji: '🔵', custo: 'baixo', platforms: [{ n: 'Maps', url: 'https://maps.google.com/?q=Museu+do+Azulejo+Lisboa', c: '#4285F4' }] },
    { title: 'Park Bar', year: 'Bairro Alto', type: 'Bar', genre: 'Bar', rating: 8.8, desc: 'No topo de um parque de estacionamento. Gin tónico com vista ao pôr do sol.', emoji: '🌅', custo: 'medio', platforms: [{ n: 'Maps', url: 'https://maps.google.com/?q=Park+Bar+Lisboa', c: '#4285F4' }] },
    { title: 'LX Factory', year: 'Alcântara', type: 'Experiência', genre: 'Cultural', rating: 8.7, desc: 'Fábrica reconvertida. Mercado ao domingo, restaurantes, lojas, concertos.', emoji: '🏭', custo: 'baixo', platforms: [{ n: 'Maps', url: 'https://maps.google.com/?q=LX+Factory+Lisboa', c: '#4285F4' }] },
    { title: 'Time Out Market', year: 'Cais do Sodré', type: 'Restaurante', genre: 'Gastronomia', rating: 8.5, desc: 'Dezenas de chefs numa sala histórica. Para quando não decides.', emoji: '🏪', custo: 'medio', platforms: [{ n: 'Maps', url: 'https://maps.google.com/?q=Time+Out+Market+Lisboa', c: '#4285F4' }] },
  ],
  do: [
    { title: 'Sunset no Miradouro da Graça', year: 'Gratuito', type: 'Exterior', genre: 'Natureza', rating: 9.4, desc: 'Manta, vinho, ver Lisboa mudar de cor. Grátis e perfeito.', emoji: '🌆', custo: 'gratuito', local: 'exterior', platforms: [{ n: 'Maps', url: 'https://maps.google.com/?q=Miradouro+da+Graca+Lisboa', c: '#4285F4' }] },
    { title: 'Sauna + Mergulho Frio', year: '1-2h · A dois', type: 'A dois', genre: 'Bem-estar', rating: 9.0, desc: 'Contraste de calor e frio que repõe energias. Vários espaços em Lisboa.', emoji: '🧖', custo: 'pago', local: 'exterior', platforms: [{ n: 'Pesquisar', url: 'https://www.google.com/search?q=sauna+mergulho+frio+Lisboa', c: '#4285F4' }] },
    { title: 'Cozinha uma receita nova', year: '1-2h · Casa', type: 'Interior', genre: 'Criativo', rating: 9.1, desc: 'Uma receita que nenhum dos dois conhece, feita juntos.', emoji: '👨‍🍳', custo: 'gratuito', local: 'interior', platforms: [] },
    { title: 'Trilho de Monsanto', year: '2h · Gratuito', type: 'Exterior', genre: 'Natureza', rating: 8.6, desc: 'A 20 min do centro. Mais natureza do que alguma vez esperavas.', emoji: '🌲', custo: 'gratuito', local: 'exterior', platforms: [{ n: 'Maps', url: 'https://maps.google.com/?q=Parque+Florestal+Monsanto+Lisboa', c: '#4285F4' }] },
    { title: 'Cinema em casa com estilo', year: '2-3h · Casa', type: 'Interior', genre: 'Criativo', rating: 8.8, desc: 'Luzes apagadas, pipocas, telemóveis off. Simples e quantas vezes o fazem mesmo?', emoji: '🍿', custo: 'gratuito', local: 'interior', platforms: [] },
  ],
};

// ══════════════════════════════════════
// WHY REASONS
// ══════════════════════════════════════
export const WHY_EXTRA: Record<string, WhyReason[]> = {
  watch: [
    { icon: '⏱', l: 'Muito curto', s: 'Prefiro algo mais longo', p: 'dur', v: 'longo' },
    { icon: '⏰', l: 'Muito longo', s: 'Prefiro algo mais curto', p: 'dur', v: 'curto' },
    { icon: '💥', l: 'Muita ação', s: 'Quero algo mais calmo', p: 'peso', v: 'leve' },
    { icon: '😢', l: 'Muito pesado', s: 'Prefiro algo mais leve', p: 'peso', v: 'leve' },
    { icon: '😂', l: 'Quero algo leve', s: 'Comédia ou entretenimento', p: 'peso', v: 'leve' },
    { icon: '🔁', l: 'Já vi', s: 'Quero algo diferente', p: 'dif', v: true, block: true },
    { icon: '📺', l: 'Não tenho esta plataforma', s: 'Bloquear esta plataforma', p: 'plat', v: 'block', blockPlat: true },
    { icon: '🌍', l: 'Não é o meu género', s: 'Sugere outro', p: 'outro', v: true },
    { icon: '⭐', l: 'Quero algo mais bem avaliado', s: 'Rating mais alto', p: 'minRating', v: 8.5 },
    { icon: '🎬', l: 'Prefiro filme', s: 'Não série', p: 'type', v: 'Filme' },
    { icon: '📺', l: 'Prefiro série', s: 'Não filme', p: 'type', v: 'Série' },
  ],
  eat: [
    { icon: '🥗', l: 'Quero mais leve', s: 'Menos calorias', p: 'peso', v: 'leve' },
    { icon: '🔥', l: 'Quero algo reconfortante', s: 'Com substância', p: 'peso', v: 'pesado' },
    { icon: '🐄', l: 'Sem carne', s: 'Vegetariano ou peixe', p: 'carne', v: false },
    { icon: '⚡', l: 'Muito elaborado', s: 'Algo mais simples', p: 'comp', v: 'simples' },
    { icon: '🛒', l: 'Não tenho os ingredientes', s: 'Algo mais básico', p: 'comp', v: 'simples' },
    { icon: '💸', l: 'Muito caro', s: 'Algo mais acessível', p: 'custo', v: 'baixo' },
    { icon: '🚗', l: 'Não quero sair de casa', s: 'Ficar em casa', p: 'local', v: 'casa' },
    { icon: '🍴', l: 'Prefiro sair', s: 'Restaurante ou delivery', p: 'local', v: 'fora' },
    { icon: '🌍', l: 'Não é este estilo', s: 'Outro tipo de cozinha', p: 'outro', v: true },
    { icon: '👨‍🍳', l: 'Muito trabalho a cozinhar', s: 'Algo mais rápido', p: 'comp', v: 'simples' },
    { icon: '🔁', l: 'Já comi isto recentemente', s: 'Quero variar', p: 'dif', v: true, block: true },
  ],
  read: [
    { icon: '⏱', l: 'Muito longo', s: 'Algo mais curto', p: 'dur', v: 'curto' },
    { icon: '📖', l: 'Muito curto', s: 'Prefiro algo mais extenso', p: 'dur', v: 'longo' },
    { icon: '🧠', l: 'Muito denso/académico', s: 'Leitura mais leve', p: 'peso', v: 'leve' },
    { icon: '😊', l: 'Quero algo mais leve', s: 'Entretenimento', p: 'peso', v: 'leve' },
    { icon: '🌍', l: 'Não é o género', s: 'Outro tema', p: 'outro', v: true },
    { icon: '🔁', l: 'Já li algo assim', s: 'Tema diferente', p: 'dif', v: true, block: true },
    { icon: '📰', l: 'Prefiro não ficção', s: 'Factual e real', p: 'type', v: 'Ensaio' },
    { icon: '📚', l: 'Prefiro ficção', s: 'Narrativa e história', p: 'type', v: 'Livro' },
  ],
  listen: [
    { icon: '🎵', l: 'Não é o meu estilo', s: 'Outro género', p: 'outro', v: true },
    { icon: '⏱', l: 'Muito longo', s: 'Algo mais curto', p: 'dur', v: 'curto' },
    { icon: '🔋', l: 'Preciso de algo energético', s: 'Batidas mais rápidas', p: 'energia', v: 'alto' },
    { icon: '😌', l: 'Preciso de algo relaxante', s: 'Calmo e tranquilo', p: 'energia', v: 'baixo' },
    { icon: '🎙', l: 'Não me apetece podcast', s: 'Prefiro música', p: 'type', v: 'Álbum' },
    { icon: '🎶', l: 'Não me apetece música', s: 'Prefiro podcast', p: 'type', v: 'Podcast' },
    { icon: '🔁', l: 'Já conheço bem', s: 'Algo novo', p: 'dif', v: true, block: true },
  ],
  play: [
    { icon: '⏱', l: 'Muito longo/complexo', s: 'Algo mais rápido', p: 'dur', v: 'curto' },
    { icon: '🎮', l: 'Não tenho esta plataforma', s: 'Bloquear plataforma', p: 'plat', v: 'block', blockPlat: true },
    { icon: '🧠', l: 'Muito difícil/complexo', s: 'Algo mais casual', p: 'comp', v: 'simples' },
    { icon: '🏃', l: 'Quero algo mais desafiante', s: 'Mais dificuldade', p: 'comp', v: 'dificil' },
    { icon: '👥', l: 'Quero multijogador', s: 'Jogar com alguém', p: 'multi', v: true },
    { icon: '🃏', l: 'Prefiro tabuleiro', s: 'Algo físico', p: 'type', v: 'Tabuleiro' },
    { icon: '🔁', l: 'Já joguei/joguei muito', s: 'Algo novo', p: 'dif', v: true, block: true },
  ],
  learn: [
    { icon: '⏱', l: 'Muito longo', s: 'Algo mais rápido', p: 'dur', v: 'curto' },
    { icon: '📚', l: 'Quero algo mais aprofundado', s: 'Mais detalhe', p: 'dur', v: 'longo' },
    { icon: '🌍', l: 'Outro tema', s: 'Sugere diferente', p: 'outro', v: true },
    { icon: '💻', l: 'Prefiro texto/artigo', s: 'Não vídeo', p: 'formato', v: 'texto' },
    { icon: '📹', l: 'Prefiro vídeo', s: 'Não leitura', p: 'formato', v: 'video' },
  ],
  visit: [
    { icon: '💸', l: 'Muito caro', s: 'Algo mais acessível', p: 'custo', v: 'gratuito' },
    { icon: '📍', l: 'Muito longe', s: 'Algo mais perto', p: 'dist', v: 'perto' },
    { icon: '🌧', l: 'Não quero sair', s: 'Fica para outro dia', p: 'local', v: 'casa' },
    { icon: '👥', l: 'Muito cheio', s: 'Algo mais sossegado', p: 'lot', v: 'ss' },
    { icon: '🔁', l: 'Já fui recentemente', s: 'Algo diferente', p: 'dif', v: true, block: true },
    { icon: '🌙', l: 'É muito cedo/tarde', s: 'Horário diferente', p: 'horario', v: 'outro' },
  ],
  do: [
    { icon: '💸', l: 'Tem custo', s: 'Algo gratuito', p: 'custo', v: 'gratuito' },
    { icon: '🌧', l: 'Não quero sair de casa', s: 'Atividade interior', p: 'local', v: 'interior' },
    { icon: '☀️', l: 'Quero sair', s: 'Atividade exterior', p: 'local', v: 'exterior' },
    { icon: '👤', l: 'Prefiro sozinho', s: 'Atividade solo', p: 'grupo', v: 'solo' },
    { icon: '👫', l: 'Prefiro a dois', s: 'Para casal', p: 'grupo', v: 'a_dois' },
    { icon: '👨‍👩‍👧', l: 'Quero fazer em grupo', s: 'Atividade de grupo', p: 'grupo', v: 'grupo' },
    { icon: '🔁', l: 'Já fiz isto recentemente', s: 'Algo diferente', p: 'dif', v: true, block: true },
    { icon: '⏱', l: 'Não tenho muito tempo', s: 'Algo rápido', p: 'dur', v: 'curto' },
  ],
};
