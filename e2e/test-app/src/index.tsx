import * as React from "react";
import * as ReactDOM from "react-dom";
import { VirtualScroller } from "react-hyper-scroller";
import { createItems, createRowRenderer, PRECALCULATED_ITEM_HEIGHT } from "./utils";

const items = createItems();
const rowRenderer = createRowRenderer(items);

function App() {
  return (
    <VirtualScroller
      rowCount={items.length}
      defaultRowHeight={PRECALCULATED_ITEM_HEIGHT}
      rowRenderer={rowRenderer}
      targetView={window}
    />
  );
}

render(<App />);

export function render(root: JSX.Element) {
  ReactDOM.render(root, document.getElementById("root"));
}
