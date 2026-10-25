import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Kanban board", () => {
  it("renders the seeded board and five columns", () => {
    render(<Home />);

    expect(screen.getByDisplayValue("Backlog")).toBeInTheDocument();
    expect(screen.getByText("Research")).toBeInTheDocument();
    expect(screen.getByDisplayValue("In Progress")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Review")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Done")).toBeInTheDocument();
  });

  it("uses a stable accessibility description id for sortable cards", () => {
    const { container } = render(<Home />);
    const sortableCards = container.querySelectorAll('[aria-roledescription="sortable"]');

    expect(sortableCards).toHaveLength(6);
    expect(Array.from(sortableCards).every((card) => card.getAttribute("aria-describedby") === "kanban-dnd-context")).toBe(true);
  });

  it("adds a new card to the selected column", () => {
    render(<Home />);

    const titleInputs = screen.getAllByPlaceholderText("Card title");
    const detailInputs = screen.getAllByPlaceholderText("Card details");
    const addButtons = screen.getAllByRole("button", { name: /add card/i });

    fireEvent.change(titleInputs[0], { target: { value: "Launch checklist" } });
    fireEvent.change(detailInputs[0], { target: { value: "Prepare the final QA pass." } });
    fireEvent.click(addButtons[0]);

    expect(screen.getByText("Launch checklist")).toBeInTheDocument();
    expect(screen.getByText("Prepare the final QA pass.")).toBeInTheDocument();
  });
});
