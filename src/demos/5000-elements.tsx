import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HyperScroller from '../lib';
import { createItems, PRECALCULATED_ITEM_HEIGHT } from '../utils';

const items = createItems(5000);

function App() {
  const itemRenderer = (item: typeof items[number]) => (
    <div data-testid={`item-${item.id}`} key={item.id}>
      <div style={{ height: item.height }}>{item.text}</div>
    </div>
  );

  return (
    <>
      <HyperScroller estimatedItemHeight={PRECALCULATED_ITEM_HEIGHT}>
        <h1>Basic Demo of the HyperScroller component</h1>

        <div style={{ padding: '16px 0' }}>
          <p>
            All children of the HyperScroller component will be rendered in a
            virtualized list.
          </p>
        </div>

        {items.slice(0, 2).map(itemRenderer)}

        <div style={{ padding: '16px 0' }}>
          <p>
            Remember that margin is evil and should be avoided when using the
            HyperScroller component.
          </p>
        </div>

        {items.slice(2, items.length).map(itemRenderer)}
      </HyperScroller>
    </>
  );
}

render(<App />);

export function render(root: JSX.Element) {
  ReactDOM.render(root, document.getElementById('root'));
}
