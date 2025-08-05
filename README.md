## Project Structure & Standards

### Component Documentation

For each component:
- **Purpose:** Briefly describe what the component does.
- **Props:** List all props and their types.
- **Edge Cases:** Mention any edge cases handled or to consider.

**Example:**

```tsx
// Component: TaskCard
// Purpose: Renders a task with a checkbox and due date.
// Props: 
//   - task (TaskObject): The task data to display.
// Edge Cases: 
//   - Handles missing due date.
//   - TODO: Add delete confirmation.
```

---

### Code Standards

- **Formatting:** Uses `.prettierrc` for consistent code style (indentation, quotes, semicolons).
- **Linting:** Uses ESLint for rules (e.g., no unused variables).
- **TypeScript:** Enforced via TSLint/ESLint.
- **Logic Separation:**
  - UI in `/components`
  - Data-fetching in `/services`
  - Firebase setup in `firebase.js`
  - Context/state logic in `/contexts`

---

### Scripts

Add these to your `package.json`:

```json
"scripts": {
  "start": "react-scripts start",
  "build": "react-scripts build",
  "lint": "eslint ./src",
  "format": "prettier --write ."
}
```

---

**How to use:**
- `npm start` — Run development server
- `npm run build` — Build for production
- `npm run lint` — Check code for lint errors
- `npm run format` — Format code with Prettier

---

**Tip:**  
Document each component with purpose, props, and edge cases in code comments for maintainability.