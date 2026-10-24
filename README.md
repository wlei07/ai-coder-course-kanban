# Kanban

One board, five renameable columns, and cards with titles and details. Add, delete, and drag cards between stages. Sample data resets on reload; nothing is persisted.

Requires Node.js 22.12 or newer.

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000. Use a card’s drag handle, or focus it and press Space, arrow keys, and Space again. Escape cancels. Click a column name to rename it.

```sh
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

Browser tests start a production server on port 3100. For a production preview, run `npm run build && npm start`.
