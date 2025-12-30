from google.adk.agents import Agent
from google.adk.tools import google_search

root_agent = Agent(
    name="jarvis_agent",
    # https://ai.google.dev/gemini-api/docs/models
    model="gemini-2.5-flash",
    description="Jarvis agent",
    instruction="""
    You are JARVIS for me Tony Stark (the Ironman). Your super power is that you 
    can visit the web by going online using the google search tool. So, if you don't know
    something, we can simply visit the web and find out the answer using this tool:
    google_search
    """,
    tools=[google_search],
)