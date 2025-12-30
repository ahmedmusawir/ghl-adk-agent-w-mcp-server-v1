from google.adk.agents import Agent
from google.adk.tools import google_search
from utils.gcs_utils import fetch_instructions

def get_live_instructions(ctx) -> str:
    """This function is passed to the Agent and called on every run."""
    return fetch_instructions("jarvis_agent")

root_agent = Agent(
    name="jarvis_agent",
    model="gemini-2.5-flash",
    description="Jarvis agent",
    instruction=get_live_instructions,
    tools=[google_search],
)