"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "react-toastify";
import { authHeaders } from "@/lib/getIdToken";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import {
  LessonQuestion,
  QuestionReply,
  QuestionThreadModal,
} from "./QuestionThreadModal";

interface LessonQnAProps {
  trailId: string;
  sectionId: string;
}

export const LessonQnA = ({ trailId, sectionId }: LessonQnAProps) => {
  const { googleUserInfo, userDbInfo } = useWeb3AuthContext();
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<LessonQuestion | null>(null);
  const [replies, setReplies] = useState<QuestionReply[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [sendingQuestion, setSendingQuestion] = useState(false);
  const [askAi, setAskAi] = useState(true);
  const [loading, setLoading] = useState(true);
  const [realtimeUnavailable, setRealtimeUnavailable] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState("");

  const currentUid = googleUserInfo?.uid || "";
  const isAdmin =
    (userDbInfo as any)?.isAdmin === true ||
    ((userDbInfo as any)?.role || "").toLowerCase() === "admin";

  const fetchQuestions = useCallback(async () => {
    if (!trailId || !sectionId) return;
    try {
      const response = await fetch(`/api/lesson-qna?trailId=${trailId}&sectionId=${sectionId}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Erro ao carregar perguntas.");
      setQuestions(data?.questions || []);
    } catch {
      // Evita erro visual agressivo; mantém a aba utilizável.
    } finally {
      setLoading(false);
    }
  }, [trailId, sectionId]);

  const fetchReplies = useCallback(
    async (questionId: string) => {
      try {
        const response = await fetch(
          `/api/lesson-qna?trailId=${trailId}&sectionId=${sectionId}&questionId=${questionId}&includeReplies=true`,
          { method: "GET", cache: "no-store" }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || "Erro ao carregar respostas.");
        setReplies(data?.question?.replies || []);
      } catch {
        setReplies([]);
      }
    },
    [trailId, sectionId]
  );

  useEffect(() => {
    if (!trailId || !sectionId) return;
    setLoading(true);
    fetchQuestions();

    const q = query(
      collection(db, "trails", trailId, "contents", sectionId, "qnaQuestions"),
      orderBy("lastActivityAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: LessonQuestion[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as any),
        }));
        setQuestions(list);
        setLoading(false);
      },
      () => {
        setRealtimeUnavailable(true);
        fetchQuestions();
      }
    );

    return () => unsub();
  }, [trailId, sectionId, fetchQuestions]);

  useEffect(() => {
    if (!selectedQuestion || !trailId || !sectionId) return;
    fetchReplies(selectedQuestion.id);

    const q = query(
      collection(
        db,
        "trails",
        trailId,
        "contents",
        sectionId,
        "qnaQuestions",
        selectedQuestion.id,
        "replies"
      ),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: QuestionReply[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as any),
        }));
        setReplies(list);
      },
      () => fetchReplies(selectedQuestion.id)
    );

    return () => unsub();
  }, [trailId, sectionId, selectedQuestion, fetchReplies]);

  const sendQuestion = async () => {
    const content = questionText.trim();
    if (!content) return;
    try {
      setSendingQuestion(true);
      const response = await fetch("/api/lesson-qna", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          trailId,
          sectionId,
          content,
          type: "question",
          askAi,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data?.reason) {
          throw new Error(`${data.message}: ${data.reason}`);
        }
        throw new Error(data?.message || "Erro ao enviar pergunta.");
      }
      if (process.env.NODE_ENV === "development" && data?.askAiDebug) {
        console.info("[lesson-qna] debug (dev): veja também o terminal onde roda next dev", data.askAiDebug);
      }
      setQuestionText("");
      toast.success("Pergunta publicada com sucesso.");
      fetchQuestions();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao publicar pergunta.");
    } finally {
      setSendingQuestion(false);
    }
  };

  const updateQuestion = async () => {
    const content = editingQuestionText.trim();
    if (!editingQuestionId || !content) return;
    try {
      const response = await fetch("/api/lesson-qna", {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({
          trailId,
          sectionId,
          questionId: editingQuestionId,
          content,
          type: "question",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Erro ao editar pergunta.");
      setEditingQuestionId(null);
      setEditingQuestionText("");
      toast.success("Pergunta atualizada.");
      fetchQuestions();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao editar pergunta.");
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      const response = await fetch(
        `/api/lesson-qna?trailId=${trailId}&sectionId=${sectionId}&questionId=${questionId}&type=question`,
        {
          method: "DELETE",
          headers: await authHeaders(),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Erro ao excluir pergunta.");
      toast.success("Pergunta excluída.");
      fetchQuestions();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao excluir pergunta.");
    }
  };

  const emptyStateText = useMemo(() => {
    if (loading) return "Carregando perguntas...";
    if (questions.length === 0) return "Nenhuma pergunta ainda. Seja o primeiro a perguntar.";
    return "";
  }, [loading, questions.length]);

  return (
    <div className="w-full h-full bg-cgray rounded-box p-6 flex flex-col gap-5 overflow-y-auto">
      <div className="border border-ddblue/30 bg-base-100 rounded-box p-4 flex flex-col gap-3">
        <p className="font-semibold text-neutral">Faça uma pergunta sobre esta aula</p>
        <textarea
          className="textarea textarea-bordered w-full bg-white text-neutral"
          rows={3}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Descreva sua dúvida..."
          maxLength={600}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              checked={askAi}
              onChange={(e) => setAskAi(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm"
            />
            <span className="label-text">Perguntar à IA sobre o assunto</span>
          </label>
          <button
            className="btn btn-primary text-white"
            onClick={sendQuestion}
            disabled={sendingQuestion || !questionText.trim()}
          >
            Publicar pergunta
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-semibold text-neutral">Todas as perguntas desta aula ({questions.length})</p>
        {realtimeUnavailable && (
          <p className="text-xs text-neutral/60">
            Atualização em tempo real indisponível no momento. Exibindo dados sincronizados via API.
          </p>
        )}
        {emptyStateText && <p className="text-sm text-neutral/60">{emptyStateText}</p>}
        {questions.map((question) => {
          const canManage = isAdmin || question.authorUid === currentUid;
          const isEditing = editingQuestionId === question.id;
          return (
            <div key={question.id} className="bg-base-100 rounded-box border border-neutral/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral/50">
                    {question.authorName} {question.authorRole === "admin" ? "(ADMIN)" : ""}
                  </p>
                  {isEditing ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <textarea
                        value={editingQuestionText}
                        onChange={(e) => setEditingQuestionText(e.target.value)}
                        className="textarea textarea-bordered w-full bg-white text-neutral"
                        rows={3}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={() => {
                            setEditingQuestionId(null);
                            setEditingQuestionText("");
                          }}
                        >
                          Cancelar
                        </button>
                        <button className="btn btn-xs btn-primary text-white" onClick={updateQuestion}>
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="text-left w-full"
                      onClick={() => setSelectedQuestion(question)}
                    >
                      <p className="font-medium text-neutral mt-1">{question.content}</p>
                    </button>
                  )}
                </div>
                {canManage && !isEditing && (
                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs text-cblue"
                      onClick={() => {
                        setEditingQuestionId(question.id);
                        setEditingQuestionText(question.content);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="text-xs text-red-500"
                      onClick={() => deleteQuestion(question.id)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-neutral/50">
                {(question as any).replyCount || 0} resposta(s) - clique para abrir conversa
              </div>
            </div>
          );
        })}
      </div>

      <QuestionThreadModal
        open={Boolean(selectedQuestion)}
        question={selectedQuestion}
        replies={replies}
        isAdmin={isAdmin}
        currentUid={currentUid}
        trailId={trailId}
        sectionId={sectionId}
        onMutate={() => {
          fetchQuestions();
          if (selectedQuestion?.id) fetchReplies(selectedQuestion.id);
        }}
        onClose={() => {
          setSelectedQuestion(null);
          setReplies([]);
        }}
      />
    </div>
  );
};
