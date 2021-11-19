import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HyperScroller from '../lib';
import { createItems } from '../utils';

const items = createItems();

function App() {
  return (
    <HyperScroller estimatedItemHeight={50} measureItems={false}>
      {items.map((item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>
          <div style={{ height: 50 }}>Item {index}. Height 50.</div>
        </div>
      ))}
    </HyperScroller>
  );
}

render(<App />);

export function render(root: JSX.Element) {
  ReactDOM.render(root, document.getElementById('root'));
}
