import * as React from "react";
import * as ReactDOM from "react-dom";
import { useVirtualScroller, VirtualScroller } from "react-hyper-scroller";
import { createItems, createRowRenderer, PRECALCULATED_ITEM_HEIGHT } from "./utils";

const items = createItems();
const rowRenderer = createRowRenderer(items);

function App() {
  const [showing, setShowing] = React.useState(true);

  function toggle() {
    setShowing(!showing);
  }

  const scroller = useVirtualScroller({
    rowCount: items.length,
    estimatedRowHeight: PRECALCULATED_ITEM_HEIGHT,
    rowRenderer,
    targetView: window,
    scrollRestoration: true,
    cacheKey: "test-scroller",
  });

  return (
    <>
      <button id="toggle-btn" data-testid="toggle-btn" onClick={toggle}>
        Show/Hide scroller
      </button>

      {showing && <VirtualScroller {...scroller} />}
    </>
  );
}

render(<App />);

export function render(root: JSX.Element) {
  ReactDOM.render(root, document.getElementById("root"));
}
