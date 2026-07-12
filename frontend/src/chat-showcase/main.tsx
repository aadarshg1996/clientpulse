import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "../index.css"
import { ChatShowcase } from "./ChatShowcase"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChatShowcase />
  </StrictMode>,
)
