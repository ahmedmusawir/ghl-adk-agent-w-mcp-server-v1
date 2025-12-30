from google.adk.agents import Agent
from google.adk.tools import FunctionTool
from utils.gcs_utils import fetch_instructions 
from utils.context_utils import fetch_document 

# 1. Define the tool by wrapping our GCS function in a FunctionTool.
# This line creates the tool.
# It automatically reads the docstring from the imported `fetch_document` function.
resume_reader_tool = FunctionTool(func=fetch_document)

# 1. Define a standalone function to fetch instructions.
#    It must accept one argument (the context), which is passed by the ADK.
def get_live_instructions(ctx) -> str:
    """This function is passed to the Agent and called on every run."""
    print("--- FETCHING LIVE INSTRUCTIONS via callable argument ---")
    
    # We can hardcode the agent name here since this file is specific
    # to the greeting_agent.
    return fetch_instructions("greeting_agent")

# 2. Create the agent and pass the function object itself as the 'instruction'
#    argument. Do not call the function here (e.g., no parentheses).
root_agent = Agent(
    name="greeting_agent",
    model="gemini-2.5-flash",
    description="Greeting agent",
    instruction=get_live_instructions,
    tools=[resume_reader_tool]
)