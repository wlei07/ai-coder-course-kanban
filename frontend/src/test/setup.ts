import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

// Happy DOM has no animation timeline; browser tests exercise real animations.
document.getAnimations = () => [];
Element.prototype.getAnimations = () => [];
