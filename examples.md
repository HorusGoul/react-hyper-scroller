# Examples

## Window Virtual Scroller with unknown items' sizes

This example shows how to render a list of 5000 elements with unknown height.

You can edit and preview this example in CodeSandbox:

[![Edit Window Virtual Scroller Example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/4wn983lzrw)

```jsx
import React from "react";
import ReactDOM from "react-dom";

import { VirtualScroller } from "react-hyper-scroller";

let items = [];

for (let i = 0; i < 5000; i++) {
  const height = Math.floor(Math.random() * (300 - 50)) + 50;

  items = [
    ...items,
    {
      id: i,
      text: `Item ${i}. Height: ${height}`,
      height,
    },
  ];
}

class App extends React.Component {
  render() {
    return (
      <div className="item-container">
        <h1>Virtual Scroller example</h1>

        <p>This example shows how to render a list of 5000 elements with dynamic height.</p>

        <VirtualScroller
          rowCount={items.length}
          defaultRowHeight={175}
          rowRenderer={this.rowRenderer}
        />
      </div>
    );
  }

  rowRenderer = (index, rowRef) => {
    const item = items[index];

    return (
      <div key={item.id} ref={rowRef}>
        <div className="item" style={{ height: item.height }}>
          {item.text}
        </div>
      </div>
    );
  };
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
```
