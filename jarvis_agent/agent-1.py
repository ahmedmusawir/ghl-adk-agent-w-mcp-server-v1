import os
from dotenv import load_dotenv
# 1. Import the necessary base library and ADK components.
from google.adk.agents import Agent
from google.adk.tools import google_search
from google import genai

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# DEBUG: Print to see what's actually loaded
print(f"[DEBUG] GOOGLE_PROJECT_ID: {os.getenv('GOOGLE_PROJECT_ID')}")
print(f"[DEBUG] GOOGLE_LOCATION: {os.getenv('GOOGLE_LOCATION')}")
print(f"[DEBUG] GOOGLE_APPLICATION_CREDENTIALS: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS')}")

# 2. Configure the global genai session for Vertex AI.
#    This is the crucial step. We run it for its side effect.
#    Any subsequent ADK action will use these settings.
genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_PROJECT_ID"),
    location=os.getenv("GOOGLE_LOCATION"), # "us-east1" or "global" 
)

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

    our focus will be Google Agent Development Kit based coding. you must go online and 
    search the google online docs before you answer questions. make sure the info is
    fresh, accurate and dependable. it's best if you let Tony know that you're 
    going online to fetch latest info when you actually use your google search tool.
    """,
    tools=[google_search],
)