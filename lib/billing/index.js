// Provider-agnostic entry point used by product code (routes, pages).
// Today: Freemius. Swap providers by pointing this at a different adapter —
// nothing outside this file needs to know which provider is behind `billing`.
export { billing } from "./freemius.js";
