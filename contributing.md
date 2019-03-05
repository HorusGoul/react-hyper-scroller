# Contributing to react-hyper-scroller

## How to create new commits

Our release system is automated in a way that the version number of the library is related to the nature of the previous changes made to the code. Because of that, developers must specify the type of changes at the time of contributing new code to the repository.

To help ensuring that the version number keeps synchronized with the nature of the changes, we **require** the use of [Commitizen](https://github.com/commitizen/cz-cli), a tool that makes it easy for developers to create new commits with the format we use.

You only need to run `npm run commit` to create a new commit because Commitizen is a development dependency of the project.

## Creating Issues / Pull Requests

At the moment there are no guidelines for this, just be clear and explain the issue or the contribution you're publishing.

## Testing

### Integration and Unit testing

This suite of tests can be executed with the following commands:

```bash
# Install all dependencies
npm install

# Execute the suite
npm run test
```

### End-to-End (e2e)

With these tests, we make sure that the components of the library work as expected running them in a real browser.

The End-to-End test suite can be executed with the following commands:

```bash
# Install all dependencies and build the project
npm install && npm run build

# Then run the e2e testing script
./tools/e2e.sh

# You may also run it in debug mode specifying it with the NODE_ENV variable
NODE_ENV=debug ./tools/e2e.sh
```
