import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";

export type RenderWithRootResult = {
  container: HTMLElement;
  root: Root;
};

export async function renderWithRoot(
  element: ReactElement,
): Promise<RenderWithRootResult> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(element);
  });

  return { container, root };
}

export async function clickElement(target: Element | null): Promise<void> {
  await act(async () => {
    target?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

export async function unmountRoot(root: Root): Promise<void> {
  await act(async () => {
    root.unmount();
  });
}

export function clearBody(): void {
  document.body.innerHTML = "";
}
