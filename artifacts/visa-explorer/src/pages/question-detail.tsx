import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetQuestion,
  getGetQuestionQueryKey,
  usePostAnswer,
  getGetQuestionAnswersQueryKey,
  useToggleQuestionFollow,
  useGetAnswerReplies,
  getGetAnswerRepliesQueryKey,
  usePostAnswerReply,
  getGetFollowedQuestionsQueryKey,
} from "@workspace/api-client-react";
import type { Answer } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Loader2, MessageSquare, CheckCircle2, Bell, BellOff,
  Send, ImageIcon, X, Reply, ChevronDown, ChevronUp, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function userName(user: { firstName?: string | null; lastName?: string | null } | null | undefined) {
  if (!user) return "Anonymous";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || "Traveler";
}

function Avatar({ user }: { user: { firstName?: string | null; profileImageUrl?: string | null } | null | undefined }) {
  if (user?.profileImageUrl) {
    return <img src={user.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />;
  }
  const initials = user?.firstName?.[0]?.toUpperCase() ?? "T";
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
      {initials}
    </div>
  );
}

function GifPreview({ url }: { url: string }) {
  const src = url
    .replace("https://giphy.com/gifs/", "https://media.giphy.com/media/")
    .replace(/^(https:\/\/media\.giphy\.com\/media\/[^/]+)(\/giphy\.gifv?)?$/, "$1/giphy.gif")
    .replace("https://tenor.com/view/", "");

  const isValidGif = url.includes("giphy.com") || url.includes("tenor.com") || url.match(/\.(gif)(\?.*)?$/i);
  if (!isValidGif) return null;

  return (
    <div className="mt-3 rounded-xl overflow-hidden max-w-sm">
      <img src={src.includes("giphy.com") || src.includes("tenor.com") || src.match(/\.gif/i) ? url : src} alt="GIF" className="w-full max-h-64 object-contain bg-black/20" />
    </div>
  );
}

function GifInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ImageIcon className="w-3.5 h-3.5" />
        {open ? "Hide GIF" : "Add GIF"}
      </button>
      {open && (
        <div className="mt-2 flex gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste a Giphy or direct .gif URL…"
            className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {value && (
            <button type="button" onClick={() => onChange("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      {value && <GifPreview url={value} />}
    </div>
  );
}

function ReplyThread({ answerId, isAuthenticated, login }: { answerId: number; isAuthenticated: boolean; login: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [body, setBody] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const qc = useQueryClient();

  const { data: replies = [], isLoading } = useGetAnswerReplies(answerId, {
    query: { queryKey: getGetAnswerRepliesQueryKey(answerId) },
  });

  const { mutate: postReply, isPending } = usePostAnswerReply({
    mutation: {
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: getGetAnswerRepliesQueryKey(answerId) });
        setBody("");
        setGifUrl("");
        setShowForm(false);
      },
    },
  });

  if (isLoading) return <div className="py-2"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mt-3 pl-3 border-l border-border/60 space-y-3">
      {replies.map((r) => (
        <div key={r.id} className="flex gap-2.5">
          <Avatar user={r.user} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm font-medium">{userName(r.user)}</span>
              {r.user?.homeCountry && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {r.user.homeCountry}
                </span>
              )}
              <span className="text-xs text-muted-foreground">· {timeAgo(r.createdAt)}</span>
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{r.body}</p>
            {r.gifUrl && <GifPreview url={r.gifUrl} />}
          </div>
        </div>
      ))}

      {showForm ? (
        <div className="space-y-2 pt-1">
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a reply…"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <GifInput value={gifUrl} onChange={setGifUrl} />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={isPending || !body.trim()}
              onClick={() => postReply({ id: answerId, data: { body: body.trim(), gifUrl: gifUrl || undefined } })}
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
              Reply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setBody(""); setGifUrl(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => isAuthenticated ? setShowForm(true) : login()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Reply className="w-3.5 h-3.5" /> Reply
        </button>
      )}
    </div>
  );
}

function AnswerCard({ answer, isAuthenticated, login, questionOwnerId, onAccept }: {
  answer: Answer;
  isAuthenticated: boolean;
  login: () => void;
  questionOwnerId?: string;
  onAccept?: (answerId: number) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const { user: authUser } = useAuth();

  return (
    <div className={`bg-card border rounded-2xl p-5 transition-all ${answer.isAccepted ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-border"}`}>
      {answer.isAccepted && (
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" /> Accepted Answer
        </div>
      )}
      <div className="flex items-start gap-3">
        <Avatar user={answer.user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="font-medium text-sm">{userName(answer.user)}</span>
            {answer.user?.homeCountry && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                <Globe className="w-3 h-3" /> {answer.user.homeCountry}
              </span>
            )}
            <span className="text-xs text-muted-foreground">· {timeAgo(answer.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{answer.body}</p>
          {answer.gifUrl && <GifPreview url={answer.gifUrl} />}

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => setShowReplies((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {(answer.repliesCount ?? 0) > 0
                ? `${answer.repliesCount} ${answer.repliesCount === 1 ? "reply" : "replies"}`
                : "Replies"}
            </button>
            {onAccept && authUser?.id === questionOwnerId && !answer.isAccepted && (
              <button
                onClick={() => onAccept(answer.id)}
                className="text-xs text-muted-foreground hover:text-emerald-400 transition-colors"
              >
                ✓ Accept as best answer
              </button>
            )}
          </div>

          {showReplies && (
            <ReplyThread answerId={answer.id} isAuthenticated={isAuthenticated} login={login} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const questionId = Number(id);
  const { user, isAuthenticated, login } = useAuth();
  const qc = useQueryClient();

  const [answerBody, setAnswerBody] = useState("");
  const [answerGif, setAnswerGif] = useState("");

  const { data: question, isLoading } = useGetQuestion(questionId, {
    query: { queryKey: getGetQuestionQueryKey(questionId), enabled: !!questionId },
  });

  const { mutate: toggleFollow, isPending: isFollowing } = useToggleQuestionFollow({
    mutation: {
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: getGetQuestionQueryKey(questionId) });
        void qc.invalidateQueries({ queryKey: getGetFollowedQuestionsQueryKey() });
      },
    },
  });

  const { mutate: postAnswer, isPending: isPosting } = usePostAnswer({
    mutation: {
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: getGetQuestionQueryKey(questionId) });
        void qc.invalidateQueries({ queryKey: getGetQuestionAnswersQueryKey(questionId) });
        setAnswerBody("");
        setAnswerGif("");
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Question not found.</p>
        <Button variant="outline" asChild><Link href="/community">Back to community</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back */}
        <Link href={`/country/${question.countryCode}`}>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {question.countryFlag} {question.countryName ?? question.countryCode}
          </button>
        </Link>

        {/* Question card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {question.resolved && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
                  </Badge>
                )}
                {question.passportCode && (
                  <Badge variant="secondary" className="text-xs border-none">
                    🛂 {question.passportCode}
                  </Badge>
                )}
              </div>
              <h1 className="text-xl font-bold leading-tight mb-4">{question.title}</h1>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap mb-5">{question.body}</p>
            </div>
          </div>

          {/* Author row */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-border/60">
            <div className="flex items-center gap-2.5">
              <Avatar user={question.user} />
              <div>
                <span className="text-sm font-medium">{userName(question.user)}</span>
                {question.user?.homeCountry && (
                  <span className="text-xs text-muted-foreground ml-2">
                    <Globe className="w-3 h-3 inline mr-0.5" />{question.user.homeCountry}
                  </span>
                )}
                <p className="text-xs text-muted-foreground">{timeAgo(question.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> {question.answersCount} {question.answersCount === 1 ? "answer" : "answers"}
              </span>
              <button
                onClick={() => isAuthenticated ? toggleFollow({ id: questionId }) : login()}
                disabled={isFollowing}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-all ${
                  question.isFollowing
                    ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
                }`}
              >
                {question.isFollowing ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                {question.isFollowing ? "Following" : "Follow"}
                <span className="text-xs opacity-70">{question.followersCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Answers */}
        <h2 className="text-lg font-semibold mb-4">
          {question.answersCount === 0 ? "No answers yet — be the first!" : `${question.answersCount} ${question.answersCount === 1 ? "Answer" : "Answers"}`}
        </h2>

        {question.answers && question.answers.length > 0 && (
          <div className="space-y-4 mb-8">
            {question.answers.map((a) => (
              <AnswerCard
                key={a.id}
                answer={a}
                isAuthenticated={isAuthenticated}
                login={login}
                questionOwnerId={question.user ? undefined : undefined}
              />
            ))}
          </div>
        )}

        {/* Answer form */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-4">
            {isAuthenticated ? "Write your answer" : "Sign in to answer"}
          </h3>
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                <Avatar user={user} />
                <textarea
                  value={answerBody}
                  onChange={(e) => setAnswerBody(e.target.value)}
                  placeholder="Share your experience, knowledge, or advice…"
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm resize-none h-28 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <GifInput value={answerGif} onChange={setAnswerGif} />
              <div className="flex justify-end">
                <Button
                  disabled={isPosting || !answerBody.trim()}
                  onClick={() => postAnswer({ id: questionId, data: { body: answerBody.trim(), gifUrl: answerGif || undefined } })}
                >
                  {isPosting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
                  Post Answer
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={login}>Sign in to answer</Button>
          )}
        </div>
      </div>
    </div>
  );
}
