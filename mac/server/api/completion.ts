import OpenAI from "openai";
import { createError, defineEventHandler, readBody } from "h3";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event);
  // console.log("messages in server", messages)

  if (!useRuntimeConfig().chatgpt.apiKey) {
    throw createError({
      statusCode: 403,
      message: "Missing OpenAI API Key",
    });
  }

  const openai = new OpenAI({
    apiKey: useRuntimeConfig().openai_key,
  });

  const requestOptions = {
    messages,
    model: "gpt-3.5-turbo",
  };

  try {
    const chatCompletion = await openai.chat.completions.create(requestOptions);
    return (chatCompletion.choices[0] as { message: { content: string } })
      .message?.content;
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Failed to forward request to OpenAI API",
    });
  }
});
