export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const POST = async (req: NextRequest) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key não configurada" }, { status: 500 });
    }

    const { question, prompt } = await req.json();

    if (!question || !prompt) {
      return NextResponse.json({ error: "Parâmetros obrigatórios: question, prompt" }, { status: 400 });
    }

    if (prompt.length > 500) {
      return NextResponse.json({ error: "Resposta muito longa, máximo 500 caracteres" }, { status: 400 });
    }

    const fullPrompt = `Você é um especialista em Web3. Avalie se a resposta do aluno responde corretamente à pergunta: ${question}\n\nResposta do aluno: ${prompt}\n\nRetorne um objeto JSON com os campos:\n- valido: true se a resposta estiver correta, false caso contrário\n- explicacao: explicação concisa`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const modelResponse = await model.generateContent(fullPrompt);
    const result = modelResponse.response.text();
    return NextResponse.json({ body: result }, { status: 201 });
  } catch (error: any) {
    console.error("Erro no endpoint AI:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao validar resposta" },
      { status: 500 }
    );
  }
};
