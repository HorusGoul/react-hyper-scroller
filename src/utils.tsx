interface ListItem {
  id: string;
  height: number;
  text: string;
}

export const MAX_ITEM_HEIGHT = 300;
export const MIN_ITEM_HEIGHT = 50;
export const DEFAULT_ITEMS_TO_GENERATE = 100;
export const PRECALCULATED_ITEM_HEIGHT =
  (MAX_ITEM_HEIGHT + MIN_ITEM_HEIGHT) / 2;

export function createItems(itemsToGenerate = DEFAULT_ITEMS_TO_GENERATE) {
  const items: ListItem[] = [];

  for (let i = 0; i < itemsToGenerate; i++) {
    const height =
      Math.floor(Math.random() * (MAX_ITEM_HEIGHT - MIN_ITEM_HEIGHT)) +
      MIN_ITEM_HEIGHT;

    items.push({
      id: 'id-' + i,
      text: `Item ${i}. Height: ${height}`,
      height,
    });
  }

  return items;
}
