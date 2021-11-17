# API

Example:

```tsx
function List() {
  const listController = useHyperScroller({
    estimatedItemHeight: 50,
  });

  return (
    <HyperScroller {...listController}>
      <HyperScroller.Item as="div" id="heading-1">
        <h1>Heading</h1>

        <p>Paragraph</p>
      </HyperScroller.Item>

      {items.map((item) => (
        <HyperScroller.Item id={item.id}>
          <p>{item.text}</p>
        </HyperScroller.Item>
      ))}

      <HyperScroller.Item as="h2">Sub-heading</HyperScroller.Item>

      <HyperScroller.Item as="p">Paragraph</HyperScroller.Item>
    </HyperScroller>
  );
}
```
