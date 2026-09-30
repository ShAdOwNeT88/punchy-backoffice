/** Material Symbols drawn for a business category or logo emblem. Cosmetic only. */

const CATEGORY_ICONS: Record<string, string> = {
  pool: 'pool',
  gym: 'fitness_center',
  studio: 'self_improvement',
  cafe: 'local_cafe',
  restaurant: 'restaurant',
  shop: 'storefront',
  beauty: 'content_cut',
  other: 'confirmation_number',
};

const EMBLEM_ICONS: Record<string, string> = {
  leaf: 'eco',
  wave: 'waves',
  star: 'star',
  heart: 'favorite',
  bolt: 'bolt',
  crown: 'workspace_premium',
};

export function categoryIcon(category: string | null | undefined): string {
  return CATEGORY_ICONS[category ?? ''] ?? CATEGORY_ICONS['other'];
}

/** The emblem's symbol, or the category's when the business has no emblem. */
export function emblemIcon(emblem: string | null | undefined, category?: string | null): string {
  return (emblem && EMBLEM_ICONS[emblem]) || categoryIcon(category);
}

export const CATEGORIES = Object.keys(CATEGORY_ICONS);
export const EMBLEMS = Object.keys(EMBLEM_ICONS);
export const CARD_STYLES = ['ocean', 'ember', 'violet', 'forest', 'coffee', 'rose'];
