import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "../index.css"
import { UiShowcase } from "./UiShowcase"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UiShowcase />
  </StrictMode>,
)
