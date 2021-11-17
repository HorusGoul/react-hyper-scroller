import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HyperScroller, {
  HyperScrollerCache,
  useHyperScrollerController,
} from '../lib';
import { createItems, PRECALCULATED_ITEM_HEIGHT } from '../utils';

const items = createItems();

function App() {
  const [itemId, setItemId] = React.useState('id-0');

  const controller = useHyperScrollerController({
    estimatedItemHeight: PRECALCULATED_ITEM_HEIGHT,
    targetView: window,
    cache: HyperScrollerCache.getOrCreateCache('scroll-to-item'),
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
          onClick={() => controller.scrollToItem(itemId)}
        >
          Scroll to item
        </button>
      </div>

      <HyperScroller controller={controller}>
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
