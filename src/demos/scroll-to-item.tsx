import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HyperScroller, { HyperScrollerCache, useHyperScrollerRef } from '../lib';
import { createItems, PRECALCULATED_ITEM_HEIGHT } from '../utils';

const items = createItems();

function App() {
  const [itemId, setItemId] = React.useState('id-99');
  const hyperScrollerRef = useHyperScrollerRef();

  return (
    <>
      <div
        style={{
          position: 'sticky',
          background: '#cecece',
          padding: 8,
          top: 0,
        }}
      >
        <input
          id="item-id"
          data-testid="item-id"
          onChange={(e) => setItemId(e.target.value)}
          defaultValue="id-99"
          placeholder="Item ID"
        />
        <button
          id="scroll-to-item-btn"
          data-testid="scroll-to-item-btn"
          onClick={() =>
            hyperScrollerRef.current?.scrollToItem(itemId, { top: 100 })
          }
        >
          Scroll to item
        </button>
      </div>

      <HyperScroller
        ref={hyperScrollerRef}
        estimatedItemHeight={PRECALCULATED_ITEM_HEIGHT}
        cache={HyperScrollerCache.getOrCreateCache('scroll-to-item')}
      >
        {items.map((item) => (
          <div data-testid={`item-${item.id}`} key={item.id}>
            <div style={{ height: item.height }}>{item.text}</div>
          </div>
        ))}
      </HyperScroller>
    </>
  );
}

render(<App />);

export function render(root: JSX.Element) {
  ReactDOM.render(root, document.getElementById('root'));
}
