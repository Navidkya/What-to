const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
const CACHE_PREFIX = 'wt_meal_';

export interface MealResult {
  photoUrl: string | null;
  ingredients: string[];
  instructions: string | null;
  youtubeUrl: string | null;
}

function cacheGet(key: string): MealResult | null {
  try {
    const v = localStorage.getItem(CACHE_PREFIX + key);
    return v ? JSON.parse(v) as MealResult : null;
  } catch { return null; }
}

function cacheSet(key: string, v: MealResult) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(v)); } catch {}
}

type MealApiResult = Record<string, string | null>;

export async function fetchMeal(name: string): Promise<MealResult | null> {
  const cacheKey = name.toLowerCase().replace(/\s+/g, '_');
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  // Try exact name first, then first word
  const queries = [name, name.split(' ')[0]];

  for (const q of queries) {
    try {
      const res = await fetch(`${MEALDB_BASE}/search.php?s=${encodeURIComponent(q)}`);
      if (!res.ok) continue;
      const data = await res.json() as { meals?: MealApiResult[] };
      const meal = data.meals?.[0];
      if (!meal) continue;

      // Extract ingredients (up to 10 non-empty)
      const ingredients: string[] = [];
      for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ing && ing.trim()) {
          ingredients.push(`${measure ? measure.trim() + ' ' : ''}${ing.trim()}`);
          if (ingredients.length >= 10) break;
        }
      }

      const instructions = meal['strInstructions'];
      const result: MealResult = {
        photoUrl: meal['strMealThumb'] || null,
        ingredients,
        instructions: instructions ? instructions.substring(0, 300) + '...' : null,
        youtubeUrl: meal['strYoutube'] || null,
      };

      cacheSet(cacheKey, result);
      return result;
    } catch { continue; }
  }

  return null;
}

export interface MealDiscoverItem {
  id: string;
  title: string;
  coverUrl: string | null;
  category: string;
  area: string;
  ingredients: string[];
  youtubeUrl: string | null;
  type: 'Receita';
}

export interface MealFilters {
  local: string[];        // 'casa', 'sair', 'takeaway'
  fome: string;           // 'leve', 'normal', 'pesado'
  budget: string;
  restrictions: string[]; // 'vegetariano', 'vegan', 'sem-gluten'
  tempo: string;          // 'rapido', 'normal', 'demorado'
}

// Categorias MealDB por contexto
const CATEGORY_MAP: Record<string, string[]> = {
  'leve': ['Salad', 'Seafood', 'Vegan', 'Vegetarian'],
  'normal': ['Chicken', 'Pasta', 'Beef', 'Pork'],
  'pesado': ['Beef', 'Lamb', 'Miscellaneous', 'Side'],
  'vegetariano': ['Vegetarian', 'Vegan', 'Salad'],
  'vegan': ['Vegan', 'Vegetarian'],
  'rapido': ['Starter', 'Salad', 'Pasta'],
  'demorado': ['Beef', 'Lamb', 'Pork', 'Miscellaneous'],
};

const MEAL_DISCOVER_CACHE = 'wt_meal_disc_';

export async function discoverMeals(filters: MealFilters): Promise<MealDiscoverItem[]> {
  const cacheKey = JSON.stringify(filters);
  try {
    const v = localStorage.getItem(MEAL_DISCOVER_CACHE + cacheKey);
    if (v) {
      const parsed = JSON.parse(v) as { ts: number; data: MealDiscoverItem[] };
      if (Date.now() - parsed.ts < 2 * 60 * 60 * 1000) return parsed.data;
    }
  } catch {}

  // Determina categorias com base nos filtros
  let categories: string[] = [];

  if (filters.restrictions.includes('vegetariano') || filters.restrictions.includes('vegan')) {
    categories = CATEGORY_MAP['vegetariano'];
  } else if (filters.fome) {
    categories = CATEGORY_MAP[filters.fome] || CATEGORY_MAP['normal'];
  } else {
    categories = CATEGORY_MAP['normal'];
  }

  const results: MealDiscoverItem[] = [];

  // Busca por cada categoria, max 5 categorias
  for (const cat of categories.slice(0, 5)) {
    try {
      const res = await fetch(`${MEALDB_BASE}/filter.php?c=${encodeURIComponent(cat)}`);
      if (!res.ok) continue;
      const data = await res.json() as {
        meals?: Array<{ idMeal: string; strMeal: string; strMealThumb: string }>;
      };
      const meals = (data.meals || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, 20);

      for (const meal of meals) {
        results.push({
          id: meal.idMeal,
          title: meal.strMeal,
          coverUrl: meal.strMealThumb || null,
          category: cat,
          area: '',
          ingredients: [],
          youtubeUrl: null,
          type: 'Receita',
        });
      }
    } catch { continue; }
  }

  const shuffled = results.sort(() => Math.random() - 0.5).slice(0, 100);

  try {
    localStorage.setItem(MEAL_DISCOVER_CACHE + cacheKey, JSON.stringify({ ts: Date.now(), data: shuffled }));
  } catch {}

  return shuffled;
}
