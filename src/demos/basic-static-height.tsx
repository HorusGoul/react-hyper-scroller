import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HyperScroller, { useHyperScrollerController } from '../lib';
import { createItems } from '../utils';

const items = createItems();

function App() {
  const controller = useHyperScrollerController({
    estimatedItemHeight: 50,
    measureItems: false,
  });

  return (
    <>
      <HyperScroller controller={controller}>
        {items.map((item, index) => (
          <div data-testid={`item-${item.id}`} key={item.id}>
            <div style={{ height: 50 }}>Item {index}. Height 50.</div>
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
