# /ghl_mcp_agent/agent.py
import os
from google.adk.agents import Agent
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StreamableHTTPConnectionParams
from google.adk.models.lite_llm import LiteLlm

# GHL Private Integration credentials
GHL_API_TOKEN = os.getenv("GHL_API_TOKEN", "your_token_here")
GHL_LOCATION_ID = os.getenv("GHL_LOCATION_ID", "your_location_id_here")

# 1. Create the configured LiteLLM client instance with OpenRouter
lite_llm_client = LiteLlm(
    model="openrouter/qwen/qwen-plus-2025-07-28",  # Or any OpenRouter model
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# lite_llm_client = LiteLlm(
#     model="openrouter/anthropic/claude-3.5-sonnet",  # Or any OpenRouter model
#     api_key=os.getenv("OPENROUTER_API_KEY"),
# )

# TEST WITH OPENAI DIRECT
# lite_llm_client = LiteLlm(
#     model="gpt-5-mini",  # or "gpt-4o-mini" for cheaper testing
#     api_key=os.getenv("OPENAI_API_KEY"),
# )

# 2. Dynamic instruction function
def get_rico_instructions(ctx) -> str:
    return """
    Your name is Rico! You are a friendly and funny assistant with full access to GoHighLevel CRM data.
    You always ask the user's name first and then answer them using their name, making you more personable.
    You have a light-hearted sense of humor and occasionally share jokes to lighten the mood.
    
    IMPORTANT: The locationId is already configured in your system - you do NOT need to ask users for it.
    You have direct access to the GHL location and can fetch data immediately.
    
    You can access GHL data including:
    - Contacts (search, get, create, update, add/remove tags)
    
    
    When users ask about CRM data, use your GHL tools to fetch real information immediately.
    Always be helpful and never ask for locationId - it's already set up!
    
    BE PROACTIVE: When users ask vague questions, suggest specific things you can help with.
    
    CRITICAL: TOOL EXECUTION RULES
    - Execute tools ONE AT A TIME, never in parallel
    - Wait for each tool response before calling the next tool
    - If operating on multiple contacts, process them sequentially
    - If a tool fails, acknowledge it and ask the user what to do next
    - NEVER retry failed tool calls automatically without asking first
    """

# 3. Create the Agent with LiteLLM client
root_agent = Agent(
    name="ghl_mcp_agent",
    model=lite_llm_client,  # Use the LiteLLM client instead of string
    description="Rico - Your friendly GHL-connected assistant powered by OpenRouter",
    instruction=get_rico_instructions,
    tools=[
        MCPToolset(
            connection_params=StreamableHTTPConnectionParams(
                url="http://localhost:9000/mcp",
                # headers={
                #     "Authorization": f"Bearer {GHL_API_TOKEN}",
                #     "locationId": GHL_LOCATION_ID
                # }
            ),
            # Optional: Uncomment to filter specific tools
            # tool_filter=['contacts_get-contact', 'contacts_create-contact', 'conversations_send-a-new-message']
        )
    ],
)