import * as React from "react";

interface ListItem {
  id: number;
  height: number;
  text: string;
}

export const MAX_ITEM_HEIGHT = 300;
export const MIN_ITEM_HEIGHT = 50;
export const ITEMS_TO_GENERATE = 100;
export const PRECALCULATED_ITEM_HEIGHT = (MAX_ITEM_HEIGHT + MIN_ITEM_HEIGHT) / 2;

export function createItems() {
  const items: ListItem[] = [];

  for (let i = 0; i < ITEMS_TO_GENERATE; i++) {
    const height =
      Math.floor(Math.random() * (MAX_ITEM_HEIGHT - MIN_ITEM_HEIGHT)) + MIN_ITEM_HEIGHT;

    items.push({
      id: i,
      text: `Item ${i}. Height: ${height}`,
      height,
    });
  }

  return items;
}

export function createRowRenderer(items: ListItem[]) {
  return function rowRenderer(index: number, rowRef: React.Ref<any>) {
    const item = items[index];

    return (
      <div data-testid={`item-${item.id}`} key={item.id} ref={rowRef}>
        <div style={{ height: item.height }}>{item.text}</div>
      </div>
    );
  };
}
