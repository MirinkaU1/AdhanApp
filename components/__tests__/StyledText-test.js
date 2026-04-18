import * as React from "react";
import renderer from "react-test-renderer";
import { act } from "react-test-renderer";

jest.mock("../Themed");

import { MonoText } from "../StyledText";

it(`renders correctly`, () => {
  let tree;

  act(() => {
    tree = renderer.create(<MonoText>Snapshot test!</MonoText>).toJSON();
  });

  expect(tree).toMatchSnapshot();
});
