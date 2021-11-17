import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HyperScroller, { useVirtualScrollerController } from '../lib/index';
import { createItems, PRECALCULATED_ITEM_HEIGHT } from '../utils';

const items = createItems();

function App() {
  const [showing, setShowing] = React.useState(true);
  const [cacheKey, setCacheKey] = React.useState('test-scroller');

  function toggle() {
    setShowing(!showing);
  }

  const targetView = React.useRef<HTMLDivElement>(null);

  const controller = useVirtualScrollerController({
    estimatedItemHeight: PRECALCULATED_ITEM_HEIGHT,
    targetView,
    scrollRestoration: true,
    cacheKey,
  });

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
        <button id="toggle-btn" data-testid="toggle-btn" onClick={toggle}>
          Show/Hide scroller
        </button>

        <input
          id="cache-key"
          data-testid="cache-key"
          onChange={(e) => setCacheKey(e.target.value)}
          defaultValue="test-scroller"
          placeholder="Cache key"
        />
      </div>

      <div
        id="target-view"
        style={{ height: 200, overflowY: 'scroll' }}
        ref={targetView}
      >
        {showing && (
          <HyperScroller controller={controller}>
            {items.map((item) => (
              <div data-testid={`item-${item.id}`} key={item.id}>
                <div style={{ height: item.height }}>{item.text}</div>
              </div>
            ))}
          </HyperScroller>
        )}
      </div>
    </>
  );
}

render(<App />);

export function render(root: JSX.Element) {
  ReactDOM.render(root, document.getElementById('root'));
}
