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
