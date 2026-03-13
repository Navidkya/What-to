import { useState, useEffect } from 'react';
import type { DataItem } from '../../types';
import { fetchMeal, type MealResult } from '../../services/mealdb';

interface RecipePanelProps {
  item: DataItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecipePanel({ item, isOpen, onClose }: RecipePanelProps) {
  const [mealData, setMealData] = useState<MealResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    setLoading(true);
    setMealData(null);
    fetchMeal(item.title)
      .then(d => { setMealData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isOpen, item?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen || !item) return null;

  const steps = mealData?.instructions
    ? mealData.instructions
        .split(/\r\n|\n|\r/)
        .map(s => s.trim())
        .filter(s => s.length > 10)
        .slice(0, 8)
    : [];

  const extUrl = mealData?.youtubeUrl || item.platforms?.[0]?.url;

  return (
    <div className="ov on" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel recipe-panel">
        <div className="panel-drag" />

        {mealData?.photoUrl ? (
          <div className="recipe-photo" style={{ backgroundImage: `url(${mealData.photoUrl})` }} />
        ) : (
          <div className="recipe-photo-em">{item.emoji}</div>
        )}

        <div className="recipe-title">{item.title}</div>
        <div className="recipe-meta">{item.year} · {item.genre}</div>

        {loading && <div className="recipe-loading">A carregar receita…</div>}

        {!loading && !mealData && (
          <div className="recipe-desc">{item.desc}</div>
        )}

        {mealData?.ingredients && mealData.ingredients.length > 0 && (
          <div className="recipe-section">
            <div className="recipe-section-lbl">Ingredientes</div>
            <div className="recipe-ing-list">
              {mealData.ingredients.map((ing, i) => (
                <div key={i} className="recipe-ing-item">
                  <span className="recipe-ing-dot" />
                  {ing}
                </div>
              ))}
            </div>
          </div>
        )}

        {steps.length > 0 && (
          <div className="recipe-section">
            <div className="recipe-section-lbl">Preparação</div>
            <div className="recipe-steps">
              {steps.map((step, i) => (
                <div key={i} className="recipe-step">
                  <span className="recipe-step-num">{i + 1}</span>
                  <span className="recipe-step-txt">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {extUrl && (
          <button
            className="recipe-ext-btn"
            onClick={() => window.open(extUrl, '_blank', 'noopener,noreferrer')}
          >
            🔗 Ver no site original
          </button>
        )}

        <button className="btn-x" style={{ marginTop: 8 }} onClick={onClose}>fechar</button>
      </div>
    </div>
  );
}
