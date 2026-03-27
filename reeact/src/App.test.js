import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders hotel title", async () => {
  render(<App />);
  const title = await screen.findByText(/Hotel Quinta Dalam/i);
  expect(title).toBeInTheDocument();
});
