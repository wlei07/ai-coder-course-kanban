export type Card = { id: string; title: string; details: string };
export type Column = { id: string; title: string; cards: Card[] };
export type BoardAction =
  | { type: "restore"; columns: Column[] }
  | { type: "add"; columnId: string; card: Card }
  | { type: "delete"; cardId: string }
  | { type: "rename"; columnId: string; title: string }
  | { type: "move"; cardId: string; columnId: string; index: number };

export function createInitialBoard(): Column[] {
  return [
    { id: "backlog", title: "Backlog", cards: [
      { id: "journey", title: "Map the customer journey", details: "Connect the dots between the first hello and that happy-customer moment." },
      { id: "onboarding", title: "Explore onboarding ideas", details: "A warm welcome goes a long way. Find a few ways to make the first steps feel effortless." },
      { id: "inspiration", title: "Gather visual inspiration", details: "Collect references for a product that feels clear, considered, and a little different." },
    ] },
    { id: "todo", title: "To do", cards: [
      { id: "concepts", title: "Sketch the first concepts", details: "Put pen to paper. Explore a few directions before getting into the details." },
      { id: "essentials", title: "Define the essentials", details: "Decide what belongs in the first release. Keep it useful. Keep it simple." },
    ] },
    { id: "progress", title: "In progress", cards: [
      { id: "experience", title: "Design the core experience", details: "Bring the main flow to life, one thoughtful interaction at a time." },
      { id: "components", title: "Build the component library", details: "Lay the foundations with a small, consistent set of reusable building blocks." },
    ] },
    { id: "review", title: "In review", cards: [
      { id: "prototype", title: "Review the prototype", details: "Walk through the experience together. Note what works and what needs a second look." },
      { id: "details", title: "Fine-tune the details", details: "A final look at spacing, language, and all the little things that add up." },
    ] },
    { id: "done", title: "Done", cards: [
      { id: "kickoff", title: "Kick things off", details: "A shared vision, a clear direction, and a fresh board. We’re on our way." },
    ] },
  ];
}

export function boardReducer(state: Column[], action: BoardAction): Column[] {
  switch (action.type) {
    case "restore":
      return action.columns;
    case "add":
      return state.map((column) => column.id === action.columnId
        ? { ...column, cards: [...column.cards, action.card] } : column);
    case "delete":
      return state.map((column) => ({ ...column, cards: column.cards.filter((card) => card.id !== action.cardId) }));
    case "rename":
      return state.map((column) => column.id === action.columnId ? { ...column, title: action.title } : column);
    case "move": {
      const source = state.find((column) => column.cards.some((card) => card.id === action.cardId))!;
      const card = source.cards.find((card) => card.id === action.cardId)!;
      return state.map((column) => {
        if (column.id === action.columnId) {
          const cards = column.cards.filter((item) => item.id !== action.cardId);
          cards.splice(action.index, 0, card);
          return { ...column, cards };
        }
        if (column.id === source.id) {
          return { ...column, cards: column.cards.filter((item) => item.id !== action.cardId) };
        }
        return column;
      });
    }
  }
}
