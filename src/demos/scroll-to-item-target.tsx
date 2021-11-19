import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HyperScroller, { HyperScrollerCache, useHyperScrollerRef } from '../lib';
import { createItems, PRECALCULATED_ITEM_HEIGHT } from '../utils';

const items = createItems();

function App() {
  const [itemId, setItemId] = React.useState('id-0');

  const targetViewRef = React.useRef<HTMLDivElement>(null);
  const hyperScroller = useHyperScrollerRef();

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
          defaultValue="id-0"
          placeholder="Item ID"
        />
        <button
          id="scroll-to-item-btn"
          data-testid="scroll-to-item-btn"
          onClick={() =>
            hyperScroller.current?.scrollToItem(itemId, { top: 100 })
          }
        >
          Scroll to item
        </button>
      </div>

      <div ref={targetViewRef} style={{ overflow: 'auto', height: 400 }}>
        <HyperScroller
          ref={hyperScroller}
          estimatedItemHeight={PRECALCULATED_ITEM_HEIGHT}
          targetView={targetViewRef}
          cache={HyperScrollerCache.getOrCreateCache('scroll-to-item')}
        >
          {items.map((item) => (
            <div data-testid={`item-${item.id}`} key={item.id}>
              <div style={{ height: item.height }}>{item.text}</div>
            </div>
          ))}
        </HyperScroller>
      </div>
    </>
  );
}

render(<App />);

export function render(root: JSX.Element) {
  ReactDOM.render(root, document.getElementById('root'));
}
