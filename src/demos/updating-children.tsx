import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HyperScroller from '../lib/index';
import { createItems, PRECALCULATED_ITEM_HEIGHT, createItem } from '../utils';

function App() {
  const [showing, setShowing] = React.useState(true);
  const [items, setItems] = React.useState(() => createItems());

  function toggle() {
    setShowing(!showing);
  }

  const targetView = React.useRef<HTMLDivElement>(null);

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

        <button
          id="update-items"
          data-testid="update-items"
          onClick={() =>
            setItems((items) => [...items, createItem(items.length)])
          }
        >
          Update items
        </button>

        <button
          id="replace-last"
          data-testid="replace-last"
          onClick={() =>
            setItems((items) => [
              ...items.slice(0, items.length - 1),
              createItem(items.length - 1),
            ])
          }
        >
          Replace last item
        </button>
      </div>

      <div
        id="target-view"
        style={{ height: 400, overflowY: 'scroll' }}
        ref={targetView}
      >
        {showing && (
          <HyperScroller
            targetView={targetView}
            estimatedItemHeight={PRECALCULATED_ITEM_HEIGHT}
          >
            <div>aaa</div>
            {items
              .slice()
              .reverse()
              .map((item) => (
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
