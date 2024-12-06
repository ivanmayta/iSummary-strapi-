import { NextRequest } from "next/server"
import { getUserMeLoader } from "@/services/auth/gete-user-me-loader"
import { getAuthToken } from "@/services/auth/get-token"
import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { generateGeminiSummary } from "@/services/ai/geminiService"
const TEMPLATE = `
INSTRUCTIONS: 
  For the this {text} complete the following steps.
  Generate the title for based on the content provided
  Summarize the following content and include 5 key topics, writing in first person using normal tone of voice.
  
  Write a youtube video description
    - Include heading and sections.  
    - Incorporate keywords and key takeaways

  Generate bulleted list of key points and benefits

  Return possible and best recommended key words
`

export const generateSummary = async (content: string, template: string) => {
    const prompt = PromptTemplate.fromTemplate(template)
    const model = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: process.env.OPENAI_MODEL,
        temperature: process.env.OPENAI_TEMPERATURE
            ? parseFloat(process.env.OPENAI_TEMPERATURE)
            : 0.7,
        maxTokens: process.env.OPENAI_MAX_TOKENS
            ? parseInt(process.env.OPENAI_MAX_TOKENS)
            : 4000,
    })
    const outputParser = new StringOutputParser()
    const chain = prompt.pipe(model).pipe(outputParser)
    try {
        const summary = await chain.invoke({ text: content })
        return summary
    } catch (error) {
        if (error instanceof Error) {
            return new Response(JSON.stringify({ error: error.message }))
        }
        return new Response(
            JSON.stringify({ error: "Failed yo generate Summmary" })
        )
    }
}

export async function POST(req: NextRequest) {
    const user = await getUserMeLoader()
    const token = getAuthToken()
    if (!user || !token) {
        return new Response(
            JSON.stringify({ data: null, error: "Not authenticated" }),
            { status: 401 }
        )
    }
    if (user.data.credits < 1) {
        return new Response(
            JSON.stringify({ data: null, error: "Insufficient credits" }),
            { status: 402 }
        )
    }
    //console.log("FROM OUR ROUTE HANDLER:", req.body)
    const body = await req.json()
    const { videoId } = body
    const url = `https://deserving-harmony-9f5ca04daf.strapiapp.com/utilai/yt-transcript/${videoId}`
    let transcriptData
    try {
        const transcript = await fetch(url)
        transcriptData = await transcript.text()
    } catch (error) {
        console.error("Error processing request:", error)
        if (error instanceof Error)
            return new Response(JSON.stringify({ error: error.message }))
        return new Response(JSON.stringify({ error: "Unknown error" }))
    }
    let summary: Awaited<ReturnType<typeof generateGeminiSummary>>
    try {
        summary = await generateGeminiSummary(transcriptData, TEMPLATE)
        console.log(summary, "Summary from route handler")
        return new Response(JSON.stringify({ data: summary, error: null }))
    } catch (error) {
        console.error("Error processing request", error)
        if (error instanceof Error)
            return new Response(JSON.stringify({ error: error.message }))
        return new Response(
            JSON.stringify({ error: "Error generating Summary" })
        )
    }
}