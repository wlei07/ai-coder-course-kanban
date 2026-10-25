# Kanban

One board, five renameable columns, and cards with titles and details. Add, delete, and drag cards between stages. Sample data resets on reload; nothing is persisted.

Requires Node.js 24.x.

ESLint 10 uses scoped npm overrides for three Next.js plugins whose peer ranges still stop at ESLint 9. Remove the overrides when those plugins declare ESLint 10 support.

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000. Drag anywhere on a card to move it; on touch screens, press and hold first. Or focus the card and press Space, arrow keys, and Space again. Escape cancels. The delete button removes the card. Click a column name to rename it.

```sh
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

Browser tests start a production server on port 3100. For a production preview, run `npm run build && npm start`.
