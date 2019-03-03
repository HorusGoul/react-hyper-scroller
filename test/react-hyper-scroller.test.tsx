import * as React from "react";
import { VirtualScroller } from "../src/react-hyper-scroller";
import { render, cleanup, waitForElement } from "react-testing-library";

interface ListItem {
  id: number;
  height: number;
  text: string;
}

window.scrollTo = jest.fn((x, y) => {
  Object.defineProperty(window, "scrollY", { value: y });
  Object.defineProperty(window, "scrollX", { value: x });

  window.dispatchEvent(new Event("scroll"));
});

describe("VirtualScroller", () => {
  const items: ListItem[] = [];
  const MAX_HEIGHT = 300;
  const MIN_HEIGHT = 50;
  const ITEMS_TO_GENERATE = 100;
  const PRECALCULATED_ITEM_HEIGHT = (MAX_HEIGHT + MIN_HEIGHT) / 2;

  function rowRenderer(index: number, rowRef: React.Ref<any>) {
    const item = items[index];

    return (
      <div data-testid={`item-${item.id}`} key={item.id} ref={rowRef}>
        <div style={{ height: item.height }}>{item.text}</div>
      </div>
    );
  }

  beforeAll(() => {
    for (let i = 0; i < ITEMS_TO_GENERATE; i++) {
      const height = Math.floor(Math.random() * (MAX_HEIGHT - MIN_HEIGHT)) + MIN_HEIGHT;

      items.push({
        id: i,
        text: `Item ${i}. Height: ${height}`,
        height,
      });
    }
  });

  afterEach(cleanup);

  it("renders a list of items with unknown height", async () => {
    const { getByTestId } = render(
      <VirtualScroller
        rowCount={items.length}
        defaultRowHeight={PRECALCULATED_ITEM_HEIGHT}
        rowRenderer={rowRenderer}
        targetView={window}
      />,
    );

    const item1 = await waitForElement(() => getByTestId("item-1"));
    expect(item1).toBeTruthy();
  });

  it("scrolls through the list", async () => {
    const { getByTestId } = render(
      <VirtualScroller
        rowCount={items.length}
        defaultRowHeight={PRECALCULATED_ITEM_HEIGHT}
        rowRenderer={rowRenderer}
        targetView={window}
      />,
    );

    let y = 0;

    for (const item of items) {
      window.scrollTo(0, y);

      const itemElement = await waitForElement(() => getByTestId(`item-${item.id}`));
      expect(itemElement).toBeTruthy();

      y += PRECALCULATED_ITEM_HEIGHT;
    }
  });
});
