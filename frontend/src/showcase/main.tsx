import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import ChartShowcase from "./ChartShowcase"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChartShowcase />
  </StrictMode>,
)
