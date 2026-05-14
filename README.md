# eq-scroller

A React + TypeScript demo app that includes a reusable `ScrollSections` component for stacked, sticky, scroll-driven sections with a rail navigator.

## What the component does

`ScrollSections` renders:

- A sticky left rail with section icons and status dots
- A sticky content area with collapsible section bodies
- Active-section tracking while scrolling
- Click-to-scroll navigation from the rail

It is useful for checklist-style UIs, verification workflows, or long multi-part review screens.

## Project setup

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Component API

The component is exported from:

- `src/components/ScrollSections/index.ts`

Types:

```ts
type ScrollSection = {
  id: string;
  icon?: ReactNode;
  blockCount?: number;
  dotTone?: "green" | "blue" | "red";
  eyebrow?: ReactNode;
  title: ReactNode;
  body: ReactNode;
};

type ScrollSectionsProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  sections: ScrollSection[];
  stickyTop?: number;
};
```

## Usage

```tsx
import PendingActionsOutlined from "@mui/icons-material/PendingActionsOutlined";
import FingerprintOutlined from "@mui/icons-material/FingerprintOutlined";
import { ScrollSections, type ScrollSection } from "./components/ScrollSections";

const sections: ScrollSection[] = [
  {
    id: "pending-reviews",
    icon: <PendingActionsOutlined sx={{ fontSize: 20 }} />,
    blockCount: 3,
    dotTone: "red",
    eyebrow: "3 items awaiting action",
    title: "Pending Reviews",
    body: <section>{/* custom content */}</section>,
  },
  {
    id: "identity",
    icon: <FingerprintOutlined sx={{ fontSize: 20 }} />,
    blockCount: 2,
    dotTone: "green",
    eyebrow: "2 checks complete",
    title: "Identity Checks",
    body: <section>{/* custom content */}</section>,
  },
];

export function App() {
  return (
    <main className="case-shell">
      <ScrollSections sections={sections} stickyTop={14} />
    </main>
  );
}
```

## Styling

Base styles live in:

- `src/components/ScrollSections/ScrollSections.css`

App-level screen and card styles live in:

- `src/styles.css`

The component uses CSS custom properties (for example `--sticky-top`, `--section-gap`, and dynamic section progress vars) to coordinate scroll behavior and spacing.

## Notes

- Keep each `sections[i].id` unique (used for keys and section anchors).
- `stickyTop` should match your page header offset (in px).
- Section `body` content can be any React node; internal layout is entirely customizable.
