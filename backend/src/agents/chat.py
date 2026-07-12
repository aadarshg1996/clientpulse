"""Account-scoped conversational agent — grounded Q&A over one account's evidence."""

from __future__ import annotations

from agents import Agent, FileSearchTool

from ..llm import config

CHAT_INSTRUCTIONS = """\
You are ClientPulse Assistant, answering questions about ONE client account for its
delivery/account manager. Use the File Search tool to read this account's documents
(contract, SOW, SLA schedule, weekly status, QBR notes) and the account facts provided
below. Ground every answer in the evidence and name the source document when you can.
Be concise and specific. If the evidence does not cover the question, say so plainly
rather than guessing. You are an internal analyst — never draft client-facing messages
unless explicitly asked, and flag that they need human review.
"""


def build_chat_agent(account_uid: str, vid: str, facts: str) -> Agent:
    return Agent(
        name="ClientPulse Assistant",
        model=config.model_mini(),
        instructions=CHAT_INSTRUCTIONS + f"\n\nAccount facts (ground truth):\n{facts}\n",
        tools=[
            FileSearchTool(
                vector_store_ids=[vid],
                max_num_results=5,
                filters={"type": "eq", "key": "account_uid", "value": account_uid},
            )
        ],
    )
