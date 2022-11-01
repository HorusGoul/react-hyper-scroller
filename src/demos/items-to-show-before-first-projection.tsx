import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HyperScroller from '../lib';
import { createItems, PRECALCULATED_ITEM_HEIGHT } from '../utils';

const items = createItems();

function App() {
  const itemRenderer = (item: typeof items[number]) => (
    <div data-testid={`item-${item.id}`} key={item.id}>
      <div style={{ height: item.height }}>{item.text}</div>
    </div>
  );

  return (
    <>
      <HyperScroller
        estimatedItemHeight={PRECALCULATED_ITEM_HEIGHT}
        itemsToShowBeforeFirstProjection={10}
      >
        {items.map(itemRenderer)}
      </HyperScroller>
    </>
  );
}

render(<App />);

export function render(root: JSX.Element) {
  ReactDOM.render(root, document.getElementById('root'));
}
