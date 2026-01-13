/**
 * GoHighLevel Utility Tools
 * Domain-agnostic utilities for date/time, formatting, and validation
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register utility tools (date/time, formatting, validation)
 * These tools are domain-agnostic and useful across all tool categories
 */
export function registerUtilityTools(server: McpServer): void {
  // Tool 1: Calculate future datetime
  server.tool(
    "calculate_future_datetime",
    "Calculate a future date/time from now. Returns ISO 8601 formatted string for use with GHL API. Handles relative dates (tomorrow, next week) and specific times (4pm, 9:30am).",
    {
      days: z
        .number()
        .default(0)
        .describe("Days from now (1 = tomorrow, 7 = next week)"),
      hours: z
        .number()
        .default(0)
        .describe(
          "Hour of day in 24hr format (16 = 4pm) when useAbsoluteTime=true, or hours to add when false"
        ),
      minutes: z
        .number()
        .default(0)
        .describe("Minutes (0-59) or minutes to add"),
      useAbsoluteTime: z
        .boolean()
        .default(true)
        .describe(
          "If true, hours is time of day. If false, hours are added to current time"
        ),
    },
    async ({ days, hours, minutes, useAbsoluteTime }) => {
      try {
        const now = new Date();
        let targetDate: Date;

        if (useAbsoluteTime) {
          // Set to specific time of day
          targetDate = new Date(now);
          targetDate.setDate(targetDate.getDate() + days);
          targetDate.setHours(hours, minutes, 0, 0);
        } else {
          // Add relative time
          targetDate = new Date(
            now.getTime() +
              days * 24 * 60 * 60 * 1000 +
              hours * 60 * 60 * 1000 +
              minutes * 60 * 1000
          );
        }

        const result = {
          isoString: targetDate.toISOString(),
          humanReadable: targetDate.toLocaleString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          }),
          timestamp: targetDate.getTime(),
          date: targetDate.toLocaleDateString("en-US"),
          time: targetDate.toLocaleTimeString("en-US"),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          calculation: {
            daysAdded: days,
            hoursSet: useAbsoluteTime ? hours : null,
            hoursAdded: !useAbsoluteTime ? hours : null,
            minutesSet: useAbsoluteTime ? minutes : null,
            minutesAdded: !useAbsoluteTime ? minutes : null,
            mode: useAbsoluteTime ? "absolute" : "relative",
          },
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`[Utility Tools] Error calculating datetime:`, error);

        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${errorMessage}`,
            },
          ],
          structuredContent: {
            error: errorMessage,
            tool: "calculate_future_datetime",
          },
          isError: true,
        };
      }
    }
  );

  // Tool 2: Mathematical calculator
  server.tool(
    "calculate",
    "Perform mathematical calculations safely. Supports basic operations (+, -, *, /, %), advanced functions (sqrt, pow, sin, cos, log), percentages, and complex expressions. Returns result with specified decimal precision.",
    {
      expression: z
        .string()
        .describe(
          'Math expression to evaluate. Examples: "15% of 5000", "sqrt(144)", "(299 * 0.8) + 50", "23 / 150 * 100"'
        ),
      precision: z
        .number()
        .default(2)
        .describe("Decimal places for result (default: 2)"),
    },
    async ({ expression, precision }) => {
      try {
        let processedExpr = expression.toLowerCase().trim();

        // Handle "X% of Y" pattern
        const percentOfMatch = processedExpr.match(
          /(\d+\.?\d*)%\s+of\s+(\d+\.?\d*)/
        );
        if (percentOfMatch) {
          const percent = parseFloat(percentOfMatch[1]);
          const value = parseFloat(percentOfMatch[2]);
          const result = (percent / 100) * value;

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    expression: expression,
                    result: parseFloat(result.toFixed(precision)),
                    formatted: `${result.toFixed(precision)}`,
                  },
                  null,
                  2
                ),
              },
            ],
            structuredContent: {
              expression: expression,
              result: parseFloat(result.toFixed(precision)),
              formatted: `${result.toFixed(precision)}`,
            },
          };
        }

        // Safe math evaluator
        const safeEval = (expr: string): number => {
          expr = expr.replace(/\s+/g, "");

          // Replace functions with Math equivalents
          const replacements: Record<string, string> = {
            sqrt: "Math.sqrt",
            pow: "Math.pow",
            abs: "Math.abs",
            floor: "Math.floor",
            ceil: "Math.ceil",
            round: "Math.round",
            sin: "Math.sin",
            cos: "Math.cos",
            log: "Math.log",
            pi: "Math.PI",
          };

          let processed = expr;
          for (const [key, value] of Object.entries(replacements)) {
            processed = processed.replace(new RegExp(key, "gi"), value);
          }

          // Safe evaluation
          const result = new Function(`"use strict"; return (${processed})`)();

          if (typeof result !== "number" || !isFinite(result)) {
            throw new Error("Invalid calculation result");
          }

          return result;
        };

        const result = safeEval(processedExpr);
        const rounded = parseFloat(result.toFixed(precision));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  expression: expression,
                  result: rounded,
                  formatted: rounded.toLocaleString("en-US", {
                    minimumFractionDigits: precision,
                    maximumFractionDigits: precision,
                  }),
                },
                null,
                2
              ),
            },
          ],
          structuredContent: {
            expression: expression,
            result: rounded,
            formatted: rounded.toLocaleString("en-US", {
              minimumFractionDigits: precision,
              maximumFractionDigits: precision,
            }),
          },
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`[Utility Tools] Calculation error:`, error);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: "Calculation failed",
                  message: errorMessage,
                  expression: expression,
                },
                null,
                2
              ),
            },
          ],
          structuredContent: {
            error: "Calculation failed",
            message: errorMessage,
            expression: expression,
          },
          isError: true,
        };
      }
    }
  );
}
