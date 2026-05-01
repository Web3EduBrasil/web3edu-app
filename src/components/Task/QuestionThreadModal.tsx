"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { authHeaders } from "@/lib/getIdToken";

export interface QuestionReply {
  id: string;
  content: string;
  authorUid: string;
  authorName: string;
  authorPhotoURL?: string;
  authorRole: "student" | "admin" | "ai";
  createdAt?: any;
}

export interface LessonQuestion {
  id: string;
  content: string;
  authorUid: string;
  authorName: string;
  authorPhotoURL?: string;
  authorRole: "student" | "admin" | "ai";
  createdAt?: any;
}

interface QuestionThreadModalProps {
  open: boolean;
  question: LessonQuestion | null;
  replies: QuestionReply[];
  isAdmin: boolean;
  currentUid: string;
  trailId: string;
  sectionId: string;
  onClose: () => void;
  onMutate?: () => void;
}

export const QuestionThreadModal = ({
  open,
  question,
  replies,
  isAdmin,
  currentUid,
  trailId,
  sectionId,
  onClose,
  onMutate,
}: QuestionThreadModalProps) => {
  const [replyText, setReplyText] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyText, setEditingReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const canEditQuestion = useMemo(() => {
    if (!question) return false;
    return isAdmin || question.authorUid === currentUid;
  }, [question, isAdmin, currentUid]);

  const sendReply = async () => {
    const content = replyText.trim();
    if (!question || !content) return;

    try {
      setSending(true);
      const response = await fetch("/api/lesson-qna", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          trailId,
          sectionId,
          questionId: question.id,
          content,
          type: "reply",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Erro ao responder.");
      }
      setReplyText("");
      toast.success("Resposta enviada.");
      onMutate?.();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao responder.");
    } finally {
      setSending(false);
    }
  };

  const deleteQuestion = async () => {
    if (!question) return;
    try {
      const response = await fetch(
        `/api/lesson-qna?trailId=${trailId}&sectionId=${sectionId}&questionId=${question.id}&type=question`,
        {
          method: "DELETE",
          headers: await authHeaders(),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Erro ao remover pergunta.");
      }
      toast.success("Pergunta removida.");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao remover pergunta.");
    }
  };

  const startReplyEdit = (reply: QuestionReply) => {
    setEditingReplyId(reply.id);
    setEditingReplyText(reply.content);
  };

  const saveReplyEdit = async () => {
    const content = editingReplyText.trim();
    if (!question || !editingReplyId || !content) return;
    try {
      const response = await fetch("/api/lesson-qna", {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({
          trailId,
          sectionId,
          questionId: question.id,
          replyId: editingReplyId,
          content,
          type: "reply",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Erro ao editar resposta.");
      }
      setEditingReplyId(null);
      setEditingReplyText("");
      toast.success("Resposta atualizada.");
      onMutate?.();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao editar resposta.");
    }
  };

  const removeReply = async (replyId: string) => {
    if (!question) return;
    try {
      const response = await fetch(
        `/api/lesson-qna?trailId=${trailId}&sectionId=${sectionId}&questionId=${question.id}&replyId=${replyId}&type=reply`,
        {
          method: "DELETE",
          headers: await authHeaders(),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Erro ao remover resposta.");
      }
      toast.success("Resposta removida.");
      onMutate?.();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao remover resposta.");
    }
  };

  if (!open || !question) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl max-h-[85vh] bg-cgray rounded-box shadow-2xl flex flex-col">
        <div className="border-b border-neutral/20 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-neutral/60">Pergunta</p>
            <h3 className="font-semibold text-neutral">{question.content}</h3>
            <p className="text-xs text-neutral/50 mt-1">por {question.authorName}</p>
          </div>
          <div className="flex items-center gap-2">
            {canEditQuestion && (
              <button onClick={deleteQuestion} className="btn btn-xs btn-error text-white">
                Excluir
              </button>
            )}
            <button onClick={onClose} className="btn btn-xs btn-ghost">
              Fechar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
          {replies.length === 0 && (
            <p className="text-sm text-neutral/50">Ainda não há respostas.</p>
          )}
          {replies.map((reply) => {
            const canManageReply = isAdmin || reply.authorUid === currentUid;
            const alignRight = reply.authorUid === currentUid;
            return (
              <div
                key={reply.id}
                className={`max-w-[80%] rounded-box px-4 py-3 border border-neutral/20 ${
                  alignRight ? "self-end bg-blue/10" : "self-start bg-base-100"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-neutral/60">
                    {reply.authorName} {reply.authorRole === "ai" ? "(IA)" : ""}
                  </p>
                  {canManageReply && (
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs text-cblue"
                        onClick={() => startReplyEdit(reply)}
                      >
                        Editar
                      </button>
                      <button
                        className="text-xs text-red-500"
                        onClick={() => removeReply(reply.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
                {editingReplyId === reply.id ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <textarea
                      value={editingReplyText}
                      onChange={(e) => setEditingReplyText(e.target.value)}
                      className="textarea textarea-bordered w-full bg-white text-neutral"
                      rows={3}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => {
                          setEditingReplyId(null);
                          setEditingReplyText("");
                        }}
                      >
                        Cancelar
                      </button>
                      <button className="btn btn-xs btn-primary text-white" onClick={saveReplyEdit}>
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-neutral mt-1">{reply.content}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-neutral/20 p-4 flex items-end gap-3">
          <textarea
            rows={2}
            className="textarea textarea-bordered w-full bg-white text-neutral"
            placeholder="Escreva sua resposta..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button
            onClick={sendReply}
            className="btn btn-primary text-white"
            disabled={sending || !replyText.trim()}
          >
            Responder
          </button>
        </div>
      </div>
    </div>
  );
};
