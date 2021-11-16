import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useVirtualScroller, VirtualScroller } from '../lib/index';
import {
  createItems,
  createRowRenderer,
  PRECALCULATED_ITEM_HEIGHT,
} from '../utils';

const items = createItems();
const rowRenderer = createRowRenderer(items);

function App() {
  const [showing, setShowing] = React.useState(true);
  const [cacheKey, setCacheKey] = React.useState('test-scroller');

  function toggle() {
    setShowing(!showing);
  }

  const targetView = React.useRef<HTMLDivElement>(null);

  const scroller = useVirtualScroller({
    itemCount: items.length,
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
          <VirtualScroller {...scroller} itemRenderer={rowRenderer} />
        )}
      </div>
    </>
  );
}

render(<App />);

export function render(root: JSX.Element) {
  ReactDOM.render(root, document.getElementById('root'));
}
