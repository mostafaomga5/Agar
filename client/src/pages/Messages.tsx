import { ArrowLeft, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import SiteHeader from "@/components/SiteHeader";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function Messages() {
  const auth = useAuth();
  const dashboard = trpc.marketplace.dashboard.useQuery(undefined, { enabled: auth.isAuthenticated });
  const conversations = dashboard.data?.bookings ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeId = selectedId ?? conversations[0]?.id ?? null;
  const messages = trpc.marketplace.messages.useQuery({ requestId: activeId ?? 1 }, { enabled: auth.isAuthenticated && activeId !== null });
  const [body, setBody] = useState("");
  const utils = trpc.useUtils();
  const send = trpc.marketplace.sendMessage.useMutation({ onSuccess: () => { setBody(""); void utils.marketplace.messages.invalidate(); }, onError: error => toast.error(error.message) });
  const active = useMemo(() => conversations.find(item => item.id === activeId), [activeId, conversations]);
  const onSubmit = (event: FormEvent) => { event.preventDefault(); if (activeId && body.trim()) send.mutate({ requestId: activeId, content: body }); };

  if (auth.loading) return <div className="page-shell"><SiteHeader /><div className="loading-state">نجهز رسائلك…</div></div>;
  if (!auth.isAuthenticated) return <div className="page-shell"><SiteHeader /><main className="page-container auth-prompt"><span className="auth-icon"><ShieldCheck size={28} /></span><span className="eyebrow">محادثات أجاري</span><h1>تواصل مباشر<br /><span className="text-accent">وبكل وضوح.</span></h1><p>سجّل الدخول لمتابعة الرسائل المرتبطة بطلبات الاستئجار.</p><button className="button button-dark" onClick={startLogin}>سجّل الدخول <ArrowLeft size={16} /></button></main></div>;

  return <div className="page-shell"><SiteHeader /><main className="page-container messages-page"><div className="breadcrumb"><Link href="/">الرئيسية</Link><span>/</span><Link href="/dashboard">حسابي</Link><span>/</span><span>الرسائل</span></div><div className="section-head"><div><span className="eyebrow">كل التفاصيل في مكان واحد</span><h1>رسائلك <span className="text-accent">ومحادثاتك</span></h1></div></div>
    <div className="messages-layout"><aside className="conversation-list"><div className="conversation-list-heading">طلبات الاستئجار</div>{conversations.map(item => <button type="button" key={item.id} className={`conversation-item ${activeId === item.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}><span className="conversation-avatar"><MessageCircle size={18} /></span><span><strong>{item.listingTitle}</strong><small>طلب #{item.id} · {item.status === "pending" ? "بانتظار الموافقة" : "متابعة الطلب"}</small></span></button>)}{!conversations.length && <p className="conversation-empty">لا توجد محادثات بعد. ابدأ بطلب استئجار.</p>}</aside>
      <section className="conversation-view">{active ? <><header><span className="conversation-avatar"><MessageCircle size={18} /></span><div><strong>{active.listingTitle}</strong><small>المراسلة مرتبطة بطلب الاستئجار #{active.id}</small></div></header><div className="message-stream">{messages.data?.map(message => <div className={`message-bubble ${message.senderId === auth.user?.id ? "mine" : "theirs"}`} key={message.id}><small>{message.senderName || "عضو أجاري"}</small><p>{message.content}</p><time>{new Date(message.createdAt).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}</time></div>)}{!messages.data?.length && <div className="empty-inline"><MessageCircle size={25} /><p>ابدأ المحادثة لتنسيق تفاصيل الاستلام والإرجاع.</p></div>}</div><form className="message-composer" onSubmit={onSubmit}><input value={body} onChange={e => setBody(e.target.value)} placeholder="اكتب رسالتك هنا…" maxLength={4000} /><button className="button button-dark" type="submit" disabled={!body.trim() || send.isPending} aria-label="إرسال الرسالة"><Send size={16} /></button></form></> : <div className="empty-inline"><MessageCircle size={29} /><p>اختر طلبًا من القائمة لمشاهدة المحادثة.</p></div>}</section>
    </div>
  </main></div>;
}
