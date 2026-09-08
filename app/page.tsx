"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  ArrowLeft,
  BarChart3,
  Bell,
  CalendarDays,
  CalendarOff,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  AlertTriangle,
  Download,
  Edit3,
  FilePlus2,
  FileText,
  FolderKanban,
  HardDrive,
  GripVertical,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserPlus,
  UserRound,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast, Toaster } from "sonner";

type View =
  | "dashboard"
  | "projects"
  | "tasks"
  | "finance"
  | "clients"
  | "leads"
  | "contracts"
  | "team"
  | "leaves"
  | "messages"
  | "letters"
  | "calendar"
  | "reports"
  | "logs"
  | "settings";
type TaskStatus =
  "backlog" | "doing" | "stage3" | "stage4" | "stage5" | "done" | "cancelled";
type Subtask = { id: number; title: string; done: boolean };
type TaskComment={id:number;author:string;text:string;time:string;attachment?:Attachment};
type Task = {
  id: number;
  title: string;
  description: string;
  project: string;
  assignee: string;
  due: string;
  startDate?: string;
  endDate?: string;
  archivedAt?: string;
  label: string;
  status: TaskStatus;
  progress: number;
  subtasks?: Subtask[];
  comments?:TaskComment[];
};
type PersonalTask = {
  id: number;
  title: string;
  date: string;
  archivedAt?: string;
  repeat: "بدون تکرار" | "روزانه" | "هفتگی" | "ماهانه";
  status: "active" | "done" | "cancelled";
};
type Transaction = {
  id: number;
  title: string;
  project: string;
  type: "income" | "expense" | "receivable";
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue";
};
type Client = {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  service: string;
};
type Lead = Client & {
  status: "در حال مذاکره" | "منتظر قرارداد" | "پیگیری مجدد";
};
type Contract = {
  id: number;
  title: string;
  client: string;
  date: string;
  fileName: string;
  status: "فعال" | "پیش‌نویس" | "تمام شده";
};
type ProjectTab = {
  id: string;
  title: string;
  kind: "board" | "summary" | "members" | "custom";
};
type WorkflowColumn = {
  id: Exclude<TaskStatus, "done" | "cancelled">;
  title: string;
  color: string;
};
type Project = {
  id: number;
  title: string;
  client: string | null;
  service: string;
  manager: string;
  color: string;
  done: number;
  total: number;
  memberIds?: number[];
  boardLabels?: Partial<Record<TaskStatus, string>>;
  tabs?: ProjectTab[];
  workflowColumns?: WorkflowColumn[];
  logo?: Attachment;
  files?:Attachment[];
  ownerId?:number;
};
type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "فعال" | "غیرفعال";
  permissions: string[];
  avatar?: Attachment;
  lastSeen?:number;
};
type Attachment = { name: string; url: string; type: string };
type CalendarEvent={id:number;title:string;date:string;time:string;type:"جلسه"|"ددلاین"|"یادآوری";project?:string};
type Chat = {
  id: number;
  name: string;
  group: boolean;
  members: string[];
  messages: {
    id: number;
    mine: boolean;
    text: string;
    time: string;
    attachment?: Attachment;
  }[];
};
type Letter = {
  id: number;
  subject: string;
  from: string;
  to: string;
  body: string;
  date: string;
  status: "جدید" | "خوانده شده" | "پاراف شده";
};
type Attendance = {
  id: number;
  memberId: number;
  date: string;
  checkIn: string;
  checkOut?: string;
};
type Leave = {
  id: number;
  memberId: number;
  from: string;
  to: string;
  reason: string;
  status: "در انتظار" | "تأیید شده" | "رد شده";
};
type AuditLog = { id: number; member: string; action: string; time: string };
type AppNotification = {
  id: number;
  text: string;
  time: string;
  kind: "client" | "lead" | "project" | "task";
};
type LabelSettings = { tasks: string[]; clients: string[]; leads: string[] };
type Preferences = { fontScale: number; theme: string; labels?: LabelSettings };
type Workspace = {
  tasks: Task[];
  personalTasks: PersonalTask[];
  notifications: AppNotification[];
  transactions: Transaction[];
  clients: Client[];
  leads: Lead[];
  contracts: Contract[];
  projects: Project[];
  members: Member[];
  chats: Chat[];
  letters: Letter[];
  attendance: Attendance[];
  leaves: Leave[];
  logs: AuditLog[];
  events:CalendarEvent[];
  preferences: Preferences;
};

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "backlog", title: "برای انجام", color: "#90a4ae" },
  { id: "doing", title: "در حال انجام", color: "#42a5f5" },
  { id: "done", title: "انجام شده", color: "#55b77a" },
  { id: "cancelled", title: "لغو شده", color: "#ef5350" },
];
const defaultBoardLabels: Record<TaskStatus, string> = {
  backlog: "برای انجام",
  doing: "در حال انجام",
  stage3: "بررسی",
  stage4: "تأیید نهایی",
  stage5: "آماده تحویل",
  done: "انجام شده",
  cancelled: "لغو شده",
};
const defaultWorkflowColumns: WorkflowColumn[] = [
  { id: "backlog", title: "برای انجام", color: "#90a4ae" },
  { id: "doing", title: "در حال انجام", color: "#42a5f5" },
];
const defaultProjectTabs: ProjectTab[] = [
  { id: "board", title: "کانبان پروژه", kind: "board" },
  { id: "summary", title: "خلاصه وضعیت", kind: "summary" },
  { id: "members", title: "اعضای پروژه", kind: "members" },
];
const defaultLabels: LabelSettings = {
  tasks: ["سئو", "فنی", "طراحی", "گزارش", "عمومی"],
  clients: ["سئو سایت", "طراحی سایت", "گرافیک", "تولید محتوا"],
  leads: ["سئو سایت", "طراحی سایت", "کمپین تبلیغاتی", "شبکه‌های اجتماعی"],
};
const clientsSeed: Client[] = [
  {
    id: 1,
    name: "امیر نقیب",
    company: "شیائومی ایران",
    phone: "۰۹۱۲ ۴۵۶ ۷۸۹۰",
    email: "info@xiaomiiran.ir",
    service: "سئو سایت",
  },
  {
    id: 2,
    name: "کسری احراری",
    company: "پالیزبام",
    phone: "۰۹۱۹ ۶۲۱ ۸۵۸۰",
    email: "info@palizbamco.com",
    service: "طراحی سایت",
  },
  {
    id: 3,
    name: "محسن پارسا",
    company: "آسارا",
    phone: "۰۹۱۲ ۲۲۰ ۳۴۵۶",
    email: "office@asara.ir",
    service: "سئو فروشگاهی",
  },
];
const membersSeed: Member[] = [
  {
    id: 1,
    name: "بهراد یزدان‌پناه",
    email: "behradyzp@gmail.com",
    role: "مدیر کل",
    status: "فعال",
    permissions: ["همه بخش‌ها"],
  },
  {
    id: 2,
    name: "پارسا پورعظیمی",
    email: "parsa@kalameh.agency",
    role: "توسعه‌دهنده",
    status: "فعال",
    permissions: ["پروژه‌ها", "وظایف", "پیام‌ها"],
  },
  {
    id: 3,
    name: "ملیکا احمدی",
    email: "melika@kalameh.agency",
    role: "کارشناس سئو",
    status: "فعال",
    permissions: ["پروژه‌ها", "وظایف", "نامه‌ها"],
  },
  {
    id: 4,
    name: "افشین مرادزاده",
    email: "afshin@kalameh.agency",
    role: "طراح رابط کاربری",
    status: "فعال",
    permissions: ["پروژه‌ها", "وظایف"],
  },
];
const seed: Workspace = {
  events:[{id:1,title:"جلسه گزارش ماهانه شیائومی ایران",date:"۱۴۰۵/۰۶/۲۰",time:"۱۱:۰۰",type:"جلسه",project:"شیائومی ایران"}],
  notifications: [],
  personalTasks: [
    {
      id: 101,
      title: "مرور برنامه روزانه",
      date: "۱۴۰۵/۰۶/۱۷",
      repeat: "روزانه",
      status: "active",
    },
  ],
  clients: clientsSeed,
  leads: [
    {
      id: 11,
      name: "علی بهرام‌فرد",
      company: "نوین‌شاپ",
      phone: "۰۹۱۵ ۱۵۸ ۱۰۳۰",
      email: "ali@novinshop.ir",
      service: "طراحی سایت",
      status: "در حال مذاکره",
    },
    {
      id: 12,
      name: "سجاد مهرانی",
      company: "هورام",
      phone: "۰۹۱۲ ۵۴۴ ۸۷۴۳",
      email: "sajad@hooram.ir",
      service: "سئو سایت",
      status: "منتظر قرارداد",
    },
  ],
  contracts: [
    {
      id: 1,
      title: "قرارداد سئو و تولید محتوا",
      client: "شیائومی ایران",
      date: "۱۴۰۵/۰۶/۰۱",
      fileName: "xiaomi-seo-contract.pdf",
      status: "فعال",
    },
    {
      id: 2,
      title: "قرارداد طراحی وب‌سایت",
      client: "پالیزبام",
      date: "۱۴۰۵/۰۵/۱۸",
      fileName: "palizbam-web-design.pdf",
      status: "فعال",
    },
  ],
  projects: [
    {
      id: 1,
      title: "شیائومی ایران",
      client: "شیائومی ایران",
      service: "سئو سایت",
      manager: "بهراد یزدان‌پناه",
      color: "#ef5350",
      done: 19,
      total: 25,
    },
    {
      id: 2,
      title: "وب‌سایت آژانس کلمه",
      client: null,
      service: "طراحی سایت",
      manager: "پارسا پورعظیمی",
      color: "#7259c9",
      done: 16,
      total: 36,
    },
    {
      id: 3,
      title: "آسارا",
      client: "آسارا",
      service: "سئو فروشگاهی",
      manager: "ملیکا احمدی",
      color: "#26a69a",
      done: 22,
      total: 36,
    },
    {
      id: 4,
      title: "پالیزبام",
      client: "پالیزبام",
      service: "طراحی سایت",
      manager: "افشین مرادزاده",
      color: "#42a5f5",
      done: 8,
      total: 14,
    },
  ],
  tasks: [
    {
      id: 1,
      title: "آپدیت محتوای دسته‌بندی پاوربانک",
      description: "هدینگ‌ها، متا و لینک‌سازی داخلی اصلاح شود.",
      project: "شیائومی ایران",
      assignee: "ملیکا احمدی",
      due: "۱۷ شهریور",
      label: "سئو",
      status: "backlog",
      progress: 15,
    },
    {
      id: 2,
      title: "رفع مشکل نمایش قیمت موبایل",
      description: "قیمت متغیر محصول در موبایل بررسی شود.",
      project: "شیائومی ایران",
      assignee: "پارسا پورعظیمی",
      due: "امروز",
      label: "فنی",
      status: "doing",
      progress: 55,
    },
    {
      id: 3,
      title: "طراحی لندینگ خدمات سئو",
      description: "نسخه موبایل برای تأیید نهایی آماده شود.",
      project: "وب‌سایت آژانس کلمه",
      assignee: "افشین مرادزاده",
      due: "۱۹ شهریور",
      label: "طراحی",
      status: "done",
      progress: 85,
    },
    {
      id: 4,
      title: "گزارش ماهانه سرچ کنسول",
      description: "گزارش KPI و برنامه ماه آینده آماده شد.",
      project: "آسارا",
      assignee: "بهراد یزدان‌پناه",
      due: "۱۵ شهریور",
      label: "گزارش",
      status: "done",
      progress: 100,
    },
  ],
  transactions: [
    {
      id: 1,
      title: "قرارداد سئو شهریور",
      project: "شیائومی ایران",
      type: "income",
      amount: 48000000,
      date: "۱۴۰۵/۰۶/۰۵",
      status: "paid",
    },
    {
      id: 2,
      title: "حقوق تیم محتوا",
      project: "هزینه عمومی",
      type: "expense",
      amount: 23500000,
      date: "۱۴۰۵/۰۶/۱۰",
      status: "paid",
    },
    {
      id: 3,
      title: "قسط دوم طراحی سایت",
      project: "پالیزبام",
      type: "receivable",
      amount: 18000000,
      date: "۱۴۰۵/۰۶/۲۰",
      status: "pending",
    },
    {
      id: 4,
      title: "مانده قرارداد تولید محتوا",
      project: "آسارا",
      type: "receivable",
      amount: 9500000,
      date: "۱۴۰۵/۰۵/۲۸",
      status: "overdue",
    },
  ],
  members: membersSeed,
  chats: [
    {
      id: 1,
      name: "پارسا پورعظیمی",
      group: false,
      members: ["بهراد یزدان‌پناه", "پارسا پورعظیمی"],
      messages: [
        {
          id: 1,
          mine: false,
          text: "مشکل بخش قیمت برطرف شد و روی موبایل هم تست کردم.",
          time: "۱۲:۴۲",
        },
        {
          id: 2,
          mine: true,
          text: "عالیه، نتیجه تست را داخل وظیفه هم ثبت کن.",
          time: "۱۲:۴۵",
        },
      ],
    },
    {
      id: 2,
      name: "گروه سئو",
      group: true,
      members: ["بهراد یزدان‌پناه", "ملیکا احمدی"],
      messages: [
        {
          id: 1,
          mine: false,
          text: "گزارش شهریور داخل پروژه قرار گرفت.",
          time: "۱۱:۳۰",
        },
      ],
    },
  ],
  letters: [
    {
      id: 1,
      subject: "ارسال گزارش عملکرد شهریور",
      from: "ملیکا احمدی",
      to: "بهراد یزدان‌پناه",
      body: "گزارش کامل عملکرد پروژه شیائومی جهت بررسی ارسال شد.",
      date: "۱۴۰۵/۰۶/۱۷",
      status: "جدید",
    },
    {
      id: 2,
      subject: "تأیید صورت‌جلسه پروژه شیائومی",
      from: "بهراد یزدان‌پناه",
      to: "تیم پروژه",
      body: "صورت‌جلسه مورد تأیید است.",
      date: "۱۴۰۵/۰۶/۱۵",
      status: "خوانده شده",
    },
  ],
  attendance: [
    {
      id: 1,
      memberId: 2,
      date: "۱۴۰۵/۰۶/۱۷",
      checkIn: "۰۹:۱۲",
      checkOut: "۱۷:۴۵",
    },
    { id: 2, memberId: 3, date: "۱۴۰۵/۰۶/۱۷", checkIn: "۰۹:۲۸" },
  ],
  leaves: [
    {
      id: 1,
      memberId: 4,
      from: "۱۴۰۵/۰۶/۲۰",
      to: "۱۴۰۵/۰۶/۲۱",
      reason: "امور شخصی",
      status: "در انتظار",
    },
  ],
  logs: [
    {
      id: 1,
      member: "پارسا پورعظیمی",
      action: "وضعیت تسک «رفع مشکل نمایش قیمت موبایل» را تغییر داد",
      time: "امروز، ۱۲:۴۸",
    },
    {
      id: 2,
      member: "ملیکا احمدی",
      action: "گزارش پروژه شیائومی را ثبت کرد",
      time: "امروز، ۱۱:۳۰",
    },
  ],
  preferences: { fontScale: 1, theme: "violet" },
};
const nav = [
  { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { id: "projects", label: "پروژه‌ها", icon: FolderKanban },
  { id: "tasks", label: "وظایف", icon: ListChecks },
  { id: "calendar", label: "تقویم", icon: CalendarRange },
  { id: "reports", label: "مرکز گزارش‌ها", icon: BarChart3 },
  { id: "finance", label: "مالی", icon: WalletCards },
  { id: "clients", label: "مشتریان", icon: UserRoundCheck },
  { id: "leads", label: "لیدها", icon: Users },
  { id: "contracts", label: "قراردادها", icon: FileText },
  { id: "team", label: "اعضای تیم", icon: Users },
  { id: "leaves", label: "مرخصی‌ها", icon: CalendarOff },
  { id: "messages", label: "پیام‌ها", icon: MessageCircle },
  { id: "letters", label: "نامه‌ها", icon: Mail },
  { id: "logs", label: "لاگ مدیریتی", icon: Activity },
  { id: "settings", label: "تنظیمات", icon: Settings },
] as const;
const money = (n: number) =>
  `${new Intl.NumberFormat("fa-IR").format(n)} تومان`;
const now = () =>
  new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("");

type SignedInUser = { id: string; email: string; name: string; role: string };

function LoginScreen({ onLogin }: { onLogin: (user: SignedInUser) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  return (
    <main className="login-screen" dir="rtl">
      <section className="login-card">
        <div className="login-brand">
          <img src="/kalameh-logo.png" alt="آژانس تبلیغاتی کلمه" />
          <span>دفتر کلمه</span>
        </div>
        <div className="login-copy">
          <span className="login-icon"><LockKeyhole /></span>
          <h1>ورود به میزکار</h1>
          <p>با ایمیل و رمز عبوری که مدیر برای شما ساخته است وارد شوید.</p>
        </div>
        <form onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          setError("");
          const form = new FormData(event.currentTarget);
          try {
            const response = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
            });
            const result = await response.json() as { user?: SignedInUser; error?: string };
            if (!response.ok || !result.user) throw new Error(result.error || "ورود انجام نشد.");
            onLogin(result.user);
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "ورود انجام نشد.");
          } finally {
            setSubmitting(false);
          }
        }}>
          <label>ایمیل سازمانی<Input name="email" type="email" autoComplete="email" required placeholder="name@kalameh.agency" /></label>
          <label>رمز عبور<Input name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="رمز عبور" /></label>
          {error && <p className="login-error">{error}</p>}
          <Button type="submit" disabled={submitting}>{submitting ? "در حال ورود..." : "ورود به پنل"}<ArrowLeft /></Button>
        </form>
        <small>دسترسی شما بر اساس نقش تعیین‌شده توسط مدیر نمایش داده می‌شود.</small>
      </section>
    </main>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard"),
    [data, setData] = useState<Workspace>(seed),
    [ready, setReady] = useState(false),
    [query, setQuery] = useState(""),
    [fontScale, setFontScale] = useState(1),
    [theme, setTheme] = useState("violet");
  const [dialog, setDialog] = useState<
      | null
      | "project"
      | "projectSettings"
      | "task"
      | "finance"
      | "client"
      | "lead"
      | "contract"
      | "member"
      | "access"
      | "group"
      | "direct"
      | "letter"
      | "leave"
      | "personal"
    >(null),
    [editing, setEditing] = useState<number | null>(null),
    [selectedProject, setSelectedProject] = useState<Project | null>(null),
    [selectedMember, setSelectedMember] = useState<Member | null>(null),
    [selectedChat, setSelectedChat] = useState(1),
    [message, setMessage] = useState(""),
    [chatFile, setChatFile] = useState<Attachment | null>(null),
    [freeProject, setFreeProject] = useState(false),
    [dragged, setDragged] = useState<number | null>(null),
    [currentEmail,setCurrentEmail]=useState(""),
    [authStatus,setAuthStatus]=useState<"loading"|"authenticated"|"anonymous">("loading"),
    [authUser,setAuthUser]=useState<SignedInUser|null>(null);
  useEffect(() => {
    if(authStatus!=="authenticated")return;
    fetch("/api/workspace")
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (v?.data) {
          const raw = v.data as Partial<Workspace>;
          const normalized: Workspace = {
            ...seed,
            ...raw,
            tasks: (raw.tasks || seed.tasks).map((t) => ({
              ...t,
              status: ((t.status as string) === "review"
                ? "done"
                : t.status) as TaskStatus,
            })),
            projects: (raw.projects || seed.projects).map((p) => ({
              ...p,
              memberIds:
                p.memberIds ||
                membersSeed
                  .filter((m) => m.name === p.manager)
                  .map((m) => m.id),
              boardLabels: { ...defaultBoardLabels, ...p.boardLabels },
              tabs: p.tabs?.length ? p.tabs : defaultProjectTabs,
              workflowColumns: p.workflowColumns?.length
                ? p.workflowColumns
                : defaultWorkflowColumns,
            })),
            attendance: raw.attendance || [],
            leaves: raw.leaves || [],
            logs: raw.logs || [],
            preferences: raw.preferences || seed.preferences,
            personalTasks: raw.personalTasks || seed.personalTasks,
            notifications: raw.notifications || [],
            events:raw.events||seed.events,
          };
          setData(normalized);
          setFontScale(normalized.preferences.fontScale);
          setTheme(normalized.preferences.theme);
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [authStatus]);
  useEffect(()=>{let active=true;const heartbeat=()=>fetch("/api/session").then(r=>r.json()).then(({user})=>{if(!active)return;if(!user?.email){setAuthStatus("anonymous");setAuthUser(null);return}setAuthStatus("authenticated");setAuthUser(user);setCurrentEmail(user.email);setData(d=>({...d,members:d.members.map(m=>m.email.toLowerCase()===user.email.toLowerCase()?{...m,lastSeen:Date.now()}:m)}))}).catch(()=>active&&setAuthStatus("anonymous"));heartbeat();const timer=setInterval(heartbeat,60000);return()=>{active=false;clearInterval(timer)}},[]);
  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
  }, [fontScale]);
  useEffect(() => {
    if (!ready || authStatus!=="authenticated") return;
    const t = setTimeout(
      () =>
        fetch("/api/workspace", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ data }),
        }).catch(() => {}),
      500,
    );
    return () => clearTimeout(t);
  }, [data, ready, authStatus]);
  const patch = <K extends keyof Workspace>(
    key: K,
    value: Workspace[K],
    action?: string,
  ) =>
    setData((d) => ({
      ...d,
      [key]: value,
      logs:
        key === "logs"
          ? d.logs
          : [
              {
                id: Date.now(),
                member: "بهراد یزدان‌پناه",
                action: action || `بخش ${String(key)} را به‌روزرسانی کرد`,
                time: `امروز، ${now()}`,
              },
              ...(d.logs || []),
            ],
    }));
  const openCreate = (name: Exclude<typeof dialog, null>) => {
    setEditing(null);
    setDialog(name);
  };
  const pushNotification = (text: string, kind: AppNotification["kind"]) =>
    setData((d) => ({
      ...d,
      notifications: [
        { id: Date.now(), text, kind, time: `امروز، ${now()}` },
        ...(d.notifications || []),
      ],
    }));
  const totals = useMemo(
    () => ({
      income: data.transactions
        .filter(
          (x) =>
            x.status === "paid" &&
            (x.type === "income" || x.type === "receivable"),
        )
        .reduce((a, b) => a + b.amount, 0),
      expense: data.transactions
        .filter((x) => x.status === "paid" && x.type === "expense")
        .reduce((a, b) => a + b.amount, 0),
      receivable: data.transactions
        .filter(
          (x) =>
            x.status !== "paid" &&
            (x.type === "income" || x.type === "receivable"),
        )
        .reduce((a, b) => a + b.amount, 0),
    }),
    [data.transactions],
  );
  if(authStatus==="loading")return <main className="login-screen" dir="rtl"><div className="login-loading"><img src="/kalameh-logo.png" alt=""/><span>در حال آماده‌سازی میزکار...</span></div></main>;
  if(authStatus==="anonymous")return <LoginScreen onLogin={(user)=>{setAuthUser(user);setCurrentEmail(user.email);setAuthStatus("authenticated")}}/>;
  const moveTask = (id: number, status: TaskStatus) =>
    patch(
      "tasks",
      data.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              progress: status === "done" ? 100 : t.progress,
              archivedAt: ["done", "cancelled"].includes(status)
                ? "۱۴۰۵/۰۶/۱۷"
                : undefined,
            }
          : t,
      ),
    );
  const deleteTask = (id: number) => {
    patch(
      "tasks",
      data.tasks.filter((t) => t.id !== id),
    );
    toast.success("وظیفه حذف شد");
  };
  const sendMessage = () => {
    if (!message.trim() && !chatFile) return;
    patch(
      "chats",
      data.chats.map((c) =>
        c.id === selectedChat
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: Date.now(),
                  mine: true,
                  text: message.trim(),
                  time: now(),
                  attachment: chatFile || undefined,
                },
              ],
            }
          : c,
      ),
      "یک پیام در گفتگو ارسال کرد",
    );
    setMessage("");
    setChatFile(null);
  };
  const uploadChatFile = async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/files", { method: "POST", body });
    if (!response.ok) {
      toast.error("ارسال فایل انجام نشد");
      return;
    }
    setChatFile(await response.json());
    toast.success("فایل آماده ارسال است");
  };
  const currentMember=data.members.find(m=>m.email.toLowerCase()===currentEmail.toLowerCase())||data.members[0],isAdmin=authUser?.role==="admin";
  const viewPermission:Partial<Record<View,string>>={projects:"پروژه‌ها",tasks:"وظایف",finance:"مالی",clients:"مشتریان",leads:"لیدها",contracts:"قراردادها",team:"اعضای تیم",messages:"پیام‌ها",letters:"نامه‌ها",calendar:"تقویم",settings:"تنظیمات"};
  const canView=(next:View)=>isAdmin||["dashboard","leaves","reports"].includes(next)||(viewPermission[next]&&currentMember?.permissions.includes(viewPermission[next]!));
  const visibleProjects=data.projects.filter(p=>isAdmin||!p.ownerId||p.ownerId===currentMember?.id||(p.memberIds||[]).includes(currentMember?.id));
  const visibleProjectNames=new Set(visibleProjects.map(p=>p.title));
  const visibleTasks=data.tasks.filter(t=>visibleProjectNames.has(t.project)&&(isAdmin||t.assignee===currentMember?.name||visibleProjects.some(p=>p.title===t.project&&(p.memberIds||[]).includes(currentMember?.id))));
  const today="۱۴۰۵/۰۶/۱۷",overdueTasks=visibleTasks.filter(t=>!["done","cancelled"].includes(t.status)&&(t.endDate||t.due)>=today?false:true);
  return (
    <div
      dir="rtl"
      className={`crm-app theme-${theme}`}
      style={{ "--ui-scale": fontScale } as React.CSSProperties}
    >
      <Toaster position="top-center" richColors />
      <SidebarProvider
        style={{ "--sidebar-width": "17rem" } as React.CSSProperties}
      >
        <Sidebar side="right" collapsible="offcanvas" className="app-sidebar">
          <SidebarHeader className="sidebar-head">
            <button className="brand" onClick={() => setView("dashboard")}>
              <img
                className="brand-logo"
                src="/kalameh-logo.png"
                alt="آژانس تبلیغاتی کلمه"
              />
            </button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="nav-menu">
                  {nav
                    .filter((item) => canView(item.id as View))
                    .map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          className="nav-button"
                          isActive={view === item.id}
                          onClick={() => setView(item.id as View)}
                        >
                          <item.icon size={20} />
                          <span>{item.label}</span>
                          {item.id === "tasks" && (
                            <b>
                              {
                                data.tasks.filter((t) => t.status !== "done")
                                  .length
                              }
                            </b>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup className="sidebar-team">
              <div className="team-heading">
                <span>همکاران من</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setView("team");
                    openCreate("member");
                  }}
                >
                  <UserPlus size={17} />
                </Button>
              </div>
              {data.members.slice(1, 4).map((m) => (
                <button
                  className="team-row team-row-button"
                  key={m.id}
                  onClick={() => {
                    setView("tasks");
                    setQuery(m.name);
                  }}
                >
                  <Avatar className="avatar">
                    <AvatarFallback>{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <span>
                    <strong>{m.name}</strong>
                    <small>
                      {
                        data.tasks.filter(
                          (t) => t.assignee === m.name && t.status !== "done",
                        ).length
                      }{" "}
                      کار باز
                    </small>
                  </span>
                  <i className="online-dot" />
                </button>
              ))}
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="sidebar-footer">
            <button className="user-card" onClick={() => setView("settings")}>
              <Avatar className="avatar avatar-main">
                <AvatarImage
                  src={data.members.find((m) => m.id === 1)?.avatar?.url}
                />
                <AvatarFallback>ب‌ی</AvatarFallback>
              </Avatar>
              <span>
                <strong>{currentMember?.name || authUser?.name}</strong>
                <small>{currentMember?.role || (isAdmin ? "مدیر کل" : "عضو تیم")}</small>
              </span>
              <Settings size={18} />
            </button>
            <button className="sidebar-logout" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});setAuthUser(null);setAuthStatus("anonymous");setReady(false)}}><LogOut size={17}/> خروج از حساب</button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="main-shell">
          <header className="topbar">
            <div className="topbar-right">
              <SidebarTrigger className="mobile-trigger">
                <Menu />
              </SidebarTrigger>
              <button className="workspace-switch">
                <span className="workspace-dot">ک</span> آژانس تبلیغاتی کلمه{" "}
                <ChevronDown size={16} />
              </button>
            </div>
            <div className={`global-search ${query.trim() ? "searching" : ""}`}>
              <Search size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی پروژه، تسک، مشتری یا عضو..."
              />
              <kbd>⌘ K</kbd>
              {query.trim() && (
                <GlobalSearchResults
                  query={query}
                  data={data}
                  onProject={(project) => {
                    setSelectedProject(project);
                    setView("projects");
                    setQuery("");
                  }}
                  onView={(next) => {
                    setView(next);
                    setQuery("");
                  }}
                  close={() => setQuery("")}
                />
              )}
            </div>
            <div className="topbar-actions">
              <DropdownMenu><DropdownMenuTrigger asChild><button className={overdueTasks.length?"deadline-alarm ringing":"deadline-alarm"} aria-label="هشدار سررسید"><AlertTriangle/>{overdueTasks.length>0&&<b>{faDigits(String(overdueTasks.length))}</b>}</button></DropdownMenuTrigger><DropdownMenuContent align="start" className="deadline-menu"><strong>تسک‌های عقب‌افتاده</strong>{overdueTasks.slice(0,7).map(t=><DropdownMenuItem key={t.id} onClick={()=>setView("tasks")}><AlertTriangle/><span><b>{t.title}</b><small>{t.project} · مهلت {t.endDate||t.due}</small></span></DropdownMenuItem>)}{!overdueTasks.length&&<DropdownMenuItem disabled>تسک عقب‌افتاده‌ای ندارید.</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>
              <button
                aria-label="تسک‌های شخصی"
                title="تسک‌های شخصی"
                onClick={() => setDialog("personal")}
              >
                <ListChecks size={20} />
                <i className="personal-dot" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="اعلان‌ها">
                    <Bell size={20} />
                    <i />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="notifications-menu"
                >
                  <strong>اعلان‌ها</strong>
                  {data.notifications.slice(0, 6).map((note) => (
                    <DropdownMenuItem key={note.id}>
                      <Bell /> {note.text}
                      <small>{note.time}</small>
                    </DropdownMenuItem>
                  ))}
                  {!data.notifications.length && (
                    <DropdownMenuItem disabled>
                      اعلان جدیدی وجود ندارد
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <button aria-label="تنظیمات" onClick={() => setView("settings")}>
                <Settings size={20} />
              </button>
            </div>
          </header>
          <main className="content-area">
            {view === "dashboard" && (
              <DashboardV2
                data={data}
                totals={totals}
                setView={setView}
                onToggle={(id) => {
                  const task = data.tasks.find((t) => t.id === id);
                  if (task)
                    moveTask(id, task.status === "done" ? "backlog" : "done");
                }}
                onPersonalToggle={id=>patch("personalTasks",data.personalTasks.map(t=>t.id===id?{...t,status:"done",archivedAt:today}:t),"تسک شخصی را تکمیل کرد")}
              />
            )}{" "}
            {view === "projects" && (
              <Projects
                projects={visibleProjects}
                tasks={visibleTasks}
                onAdd={() => openCreate("project")}
                onOpen={setSelectedProject}
              />
            )}{" "}
              {view === "tasks" && (
                <TasksTableV3
                tasks={visibleTasks.filter((t) =>
                  `${t.title} ${t.project} ${t.assignee}`.includes(query),
                )}
                onAdd={() => openCreate("task")}
                onMove={moveTask}
                onEdit={(id) => {
                  setEditing(id);
                  setDialog("task");
                }}
                  onDelete={deleteTask}
                  personalTasks={data.personalTasks}
                  onPersonalToggle={id=>patch("personalTasks",data.personalTasks.map(t=>t.id===id?{...t,status:t.status==="done"?"active":"done",archivedAt:t.status==="done"?undefined:"۱۴۰۵/۰۶/۱۷"}:t),"وضعیت تسک شخصی را تغییر داد")}
                  onToggleSubtask={(taskId,subtaskId)=>patch("tasks",data.tasks.map(t=>{if(t.id!==taskId)return t;const subtasks=t.subtasks?.map(s=>s.id===subtaskId?{...s,done:!s.done}:s);const allDone=Boolean(subtasks?.length&&subtasks.every(s=>s.done));return {...t,subtasks,status:allDone?"done":t.status==="done"?"backlog":t.status,archivedAt:allDone?today:undefined}}),"زیرتسک را تغییر داد")}
                dragged={dragged}
                setDragged={setDragged}
              />
            )}{" "}
            {view === "finance" && (
              <FinanceV2
                rows={data.transactions}
                totals={totals}
                onAdd={() => openCreate("finance")}
                onEdit={(id) => {
                  setEditing(id);
                  setDialog("finance");
                }}
                onDelete={(id) =>
                  patch(
                    "transactions",
                    data.transactions.filter((x) => x.id !== id),
                  )
                }
                onStatus={(id, status) =>
                  patch(
                    "transactions",
                    data.transactions.map((x) =>
                      x.id === id ? { ...x, status } : x,
                    ),
                  )
                }
              />
            )}{" "}
            {view==="calendar"&&<CalendarCenter tasks={visibleTasks} events={data.events} projects={visibleProjects} onSave={event=>patch("events",[event,...data.events],"رویداد تقویم ثبت کرد")}/>} {view==="reports"&&<ReportsCenter data={{...data,projects:visibleProjects,tasks:visibleTasks}}/>}
            {view === "clients" && (
              <ClientsV2
                clients={data.clients}
                projects={data.projects}
                transactions={data.transactions}
                contracts={data.contracts}
                onAdd={() => openCreate("client")}
              />
            )}{" "}
            {view === "leads" && (
              <LeadsV2
                leads={data.leads}
                labels={data.preferences.labels?.leads || defaultLabels.leads}
                onAdd={() => openCreate("lead")}
                onConvert={(lead) => {
                  patch("clients", [
                    {
                      id: Date.now(),
                      name: lead.name,
                      company: lead.company,
                      phone: lead.phone,
                      email: lead.email,
                      service: lead.service,
                    },
                    ...data.clients,
                  ]);
                  patch(
                    "leads",
                    data.leads.filter((l) => l.id !== lead.id),
                  );
                }}
              />
            )}{" "}
            {view === "contracts" && (
              <Contracts
                contracts={data.contracts}
                onAdd={() => openCreate("contract")}
              />
            )}{" "}
            {view === "team" && (
              <TeamV2
                members={data.members}
                tasks={data.tasks}
                attendance={data.attendance}
                leaves={data.leaves}
                logs={data.logs}
                onAdd={() => openCreate("member")}
                onAccess={(m) => {
                  setSelectedMember(m);
                  setDialog("access");
                }}
                onDelete={(id) =>
                  patch(
                    "members",
                    data.members.filter((m) => m.id !== id),
                    "یک همکار را حذف کرد",
                  )
                }
                onCheckIn={() =>
                  patch(
                    "attendance",
                    [
                      {
                        id: Date.now(),
                        memberId: 1,
                        date: "۱۴۰۵/۰۶/۱۷",
                        checkIn: now(),
                      },
                      ...data.attendance,
                    ],
                    "ورود خود را ثبت کرد",
                  )
                }
                onCheckOut={() =>
                  patch(
                    "attendance",
                    data.attendance.map((a, i) =>
                      a.memberId === 1 &&
                      !a.checkOut &&
                      i ===
                        data.attendance.findIndex(
                          (x) => x.memberId === 1 && !x.checkOut,
                        )
                        ? { ...a, checkOut: now() }
                        : a,
                    ),
                    "خروج خود را ثبت کرد",
                  )
                }
                onLeave={(leave) =>
                  patch(
                    "leaves",
                    [leave, ...data.leaves],
                    "درخواست مرخصی ثبت کرد",
                  )
                }
                onLeaveStatus={(id, status) =>
                  patch(
                    "leaves",
                    data.leaves.map((l) =>
                      l.id === id ? { ...l, status } : l,
                    ),
                    "وضعیت درخواست مرخصی تغییر کرد",
                  )
                }
              />
            )}{" "}
            {view === "leaves" && (
              <LeaveCenter
                members={data.members}
                leaves={data.leaves}
                onSubmit={(leave) =>
                  patch(
                    "leaves",
                    [leave, ...data.leaves],
                    "درخواست مرخصی ثبت کرد",
                  )
                }
                onStatus={(id, status) =>
                  patch(
                    "leaves",
                    data.leaves.map((l) =>
                      l.id === id ? { ...l, status } : l,
                    ),
                    "وضعیت درخواست مرخصی تغییر کرد",
                  )
                }
              />
            )}{" "}
            {view === "messages" && (
              <MessagesV2
                chats={data.chats}
                selected={selectedChat}
                setSelected={setSelectedChat}
                message={message}
                setMessage={setMessage}
                send={sendMessage}
                onGroup={() => openCreate("group")}
                onDirect={() => openCreate("direct")}
                upload={uploadChatFile}
                file={chatFile}
              />
            )}{" "}
            {view === "letters" && (
              <LettersV2
                letters={data.letters}
                onAdd={() => openCreate("letter")}
                onRead={(id) =>
                  patch(
                    "letters",
                    data.letters.map((l) =>
                      l.id === id ? { ...l, status: "خوانده شده" } : l,
                    ),
                  )
                }
              />
            )}{" "}
            {view === "logs" && <AdminLogs logs={data.logs} />}{" "}
            {view === "settings" && (
              <SettingsV3
                member={data.members.find((m) => m.id === 1) || data.members[0]}
                onAvatar={(avatar) =>
                  patch(
                    "members",
                    data.members.map((m) =>
                      m.id === 1 ? { ...m, avatar } : m,
                    ),
                    "عکس پروفایل را تغییر داد",
                  )
                }
                fontScale={fontScale}
                setFontScale={setFontScale}
                theme={theme}
                setTheme={setTheme}
                labels={data.preferences.labels || defaultLabels}
                onSave={(labels) => {
                  patch(
                    "preferences",
                    { fontScale, theme, labels },
                    "تنظیمات میزکار را ذخیره کرد",
                  );
                  toast.success("تنظیمات ذخیره شد");
                }}
              />
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <PersonalTasksPanelV2
        open={dialog === "personal"}
        close={() => setDialog(null)}
        tasks={data.personalTasks}
        save={(tasks) =>
          patch("personalTasks", tasks, "تسک‌های شخصی را به‌روزرسانی کرد")
        }
      />
      <ProjectDialogPro
        open={dialog === "project"}
        close={() => setDialog(null)}
        clients={data.clients}
        members={data.members}
        free={freeProject}
        setFree={setFreeProject}
        save={(p) => {
          const owned={...p,ownerId:currentMember?.id||1,memberIds:Array.from(new Set([...(p.memberIds||[]),currentMember?.id||1]))};
          patch("projects", [owned, ...data.projects]);
          pushNotification("پروژه «" + p.title + "» ایجاد شد", "project");
          setDialog(null);
          setFreeProject(false);
        }}
      />
      <ClientDialogV2
        labels={data.preferences.labels?.clients || defaultLabels.clients}
        open={dialog === "client"}
        close={() => setDialog(null)}
        save={(c) => {
          patch("clients", [c, ...data.clients]);
          pushNotification("مشتری «" + c.name + "» تعریف شد", "client");
          setDialog(null);
        }}
      />
      <LeadDialogV2
        labels={data.preferences.labels?.leads || defaultLabels.leads}
        open={dialog === "lead"}
        close={() => setDialog(null)}
        save={(l) => {
          patch("leads", [l, ...data.leads]);
          pushNotification("لید جدید «" + l.name + "» ثبت شد", "lead");
          setDialog(null);
        }}
      />
      <ContractDialog
        open={dialog === "contract"}
        close={() => setDialog(null)}
        clients={data.clients}
        save={(c) => {
          patch("contracts", [c, ...data.contracts]);
          setDialog(null);
        }}
      />
      <TaskDialogV4
        labels={data.preferences.labels?.tasks || defaultLabels.tasks}
        defaultProject={selectedProject?.title}
        open={dialog === "task"}
        close={() => setDialog(null)}
        task={data.tasks.find((t) => t.id === editing)}
        projects={data.projects}
        members={data.members}
        save={(t) => {
          patch(
            "tasks",
            editing
              ? data.tasks.map((x) => (x.id === editing ? t : x))
              : [t, ...data.tasks],
          );
          if (!editing)
            pushNotification("تسک «" + t.title + "» اضافه شد", "task");
          setDialog(null);
        }}
      />
      <FinanceDialog
        open={dialog === "finance"}
        close={() => setDialog(null)}
        row={data.transactions.find((t) => t.id === editing)}
        projects={data.projects}
        save={(t) => {
          patch(
            "transactions",
            editing
              ? data.transactions.map((x) => (x.id === editing ? t : x))
              : [t, ...data.transactions],
          );
          setDialog(null);
        }}
      />
      <MemberDialogV2
        open={dialog === "member"}
        close={() => setDialog(null)}
        save={async(m,password) => {
          const response=await fetch("/api/auth/users",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:m.name,email:m.email,role:m.role,password})});
          const result=await response.json() as {error?:string};
          if(!response.ok){toast.error(result.error||"ساخت حساب انجام نشد");return false}
          patch("members", [m, ...data.members]);
          setDialog(null);
          toast.success("همکار جدید ثبت شد");
          return true;
        }}
      />
      <AccessDialog
        open={dialog === "access"}
        close={() => setDialog(null)}
        member={selectedMember}
        save={(m) => {
          patch(
            "members",
            data.members.map((x) => (x.id === m.id ? m : x)),
          );
          setDialog(null);
        }}
      />
      <DirectMessageDialog
        open={dialog === "direct"}
        close={() => setDialog(null)}
        members={data.members}
        save={(c) => {
          patch("chats", [c, ...data.chats]);
          setSelectedChat(c.id);
          setDialog(null);
          toast.success("گفتگوی مستقیم ساخته شد");
        }}
      />
      <GroupDialog
        open={dialog === "group"}
        close={() => setDialog(null)}
        members={data.members}
        save={(c) => {
          patch("chats", [c, ...data.chats]);
          setSelectedChat(c.id);
          setDialog(null);
        }}
      />
      <LetterDialog
        open={dialog === "letter"}
        close={() => setDialog(null)}
        members={data.members}
        save={(l) => {
          patch("letters", [l, ...data.letters]);
          setDialog(null);
          toast.success("نامه ارسال شد");
        }}
      />
      <ProjectPanelV3
        project={selectedProject}
        tasks={data.tasks}
        members={data.members}
        close={() => setSelectedProject(null)}
        onSettings={() => setDialog("projectSettings")}
        onAddTask={() => {
          setEditing(null);
          setDialog("task");
        }}
        onMove={moveTask}
        onToggleSubtask={(taskId, subtaskId) => patch("tasks", data.tasks.map(t=>{if(t.id!==taskId)return t;const subtasks=t.subtasks?.map(s=>s.id===subtaskId?{...s,done:!s.done}:s);const allDone=Boolean(subtasks?.length&&subtasks.every(s=>s.done));return {...t,subtasks,status:allDone?"done":t.status==="done"?"backlog":t.status,progress:allDone?100:0,archivedAt:allDone?"۱۴۰۵/۰۶/۱۷":undefined}}), "وضعیت یک زیرتسک را تغییر داد")}
        onUpdateTask={updated=>patch("tasks",data.tasks.map(t=>t.id===updated.id?updated:t),"دیدگاه یا فایل تسک را به‌روزرسانی کرد")}
        onUpdateProject={updated=>{patch("projects",data.projects.map(p=>p.id===updated.id?updated:p),"فایل پروژه را به‌روزرسانی کرد");setSelectedProject(updated)}}
      />
      <ProjectSettingsV3
        open={dialog === "projectSettings"}
        close={() => setDialog(null)}
        project={selectedProject}
        clients={data.clients}
        members={data.members}
        save={(p) => {
          patch(
            "projects",
            data.projects.map((x) => (x.id === p.id ? p : x)),
            "تنظیمات پروژه را تغییر داد",
          );
          if (selectedProject && selectedProject.title !== p.title)
            patch(
              "tasks",
              data.tasks.map((t) =>
                t.project === selectedProject.title
                  ? { ...t, project: p.title }
                  : t,
              ),
            );
          setSelectedProject(p);
          setDialog(null);
        }}
      />
    </div>
  );
}

function CalendarCenter({tasks,events,projects,onSave}:{tasks:Task[];events:CalendarEvent[];projects:Project[];onSave:(event:CalendarEvent)=>void}){const [open,setOpen]=useState(false);const days=Array.from({length:31},(_,i)=>i+1);const dayKey=(day:number)=>`۱۴۰۵/۰۶/${faDigits(String(day).padStart(2,"0"))}`;return <><PageTitle title="تقویم یکپارچه" subtitle="نمای ماهانه تسک‌ها، جلسات و ددلاین‌ها"><Button onClick={()=>setOpen(true)}><Plus/> رویداد جدید</Button></PageTitle><div className="calendar-toolbar"><button><ChevronDown/> شهریور ۱۴۰۵</button><div><span className="task-dot"/> ددلاین تسک <span className="meeting-dot"/> جلسه و رویداد</div></div><section className="agency-calendar"><header>{["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه"].map(x=><span key={x}>{x}</span>)}</header><div>{days.map(day=>{const key=dayKey(day),dayTasks=tasks.filter(t=>(t.endDate||t.due)===key),dayEvents=events.filter(e=>e.date===key);return <article key={day} className={day===17?"today":""}><b>{faDigits(String(day))}</b>{dayEvents.slice(0,2).map(e=><span className="calendar-event meeting" key={e.id}>{e.time} {e.title}</span>)}{dayTasks.slice(0,2).map(t=><span className="calendar-event task" key={t.id}>{t.title}</span>)}{dayTasks.length+dayEvents.length>4&&<small>+{faDigits(String(dayTasks.length+dayEvents.length-4))} مورد</small>}</article>})}</div></section><Modal open={open} close={()=>setOpen(false)} title="افزودن رویداد تقویم" submit="ثبت در تقویم" onSubmit={e=>{e.preventDefault();const d=fd(e);onSave({id:Date.now(),title:d.title,date:d.date,time:d.time,type:d.type as CalendarEvent['type'],project:d.project});setOpen(false)}}><div className="form-grid"><Field label="عنوان رویداد" name="title" wide required/><Field label="تاریخ شمسی" name="date" defaultValue="۱۴۰۵/۰۶/۱۷"/><Field label="ساعت" name="time" defaultValue="۱۰:۰۰"/><Field label="نوع رویداد" name="type"><select name="type"><option>جلسه</option><option>ددلاین</option><option>یادآوری</option></select></Field><Field label="پروژه" name="project"><select name="project"><option value="">بدون پروژه</option>{projects.map(p=><option key={p.id}>{p.title}</option>)}</select></Field></div></Modal></>}

function ReportsCenter({data}:{data:Workspace}){const [section,setSection]=useState("projects");const done=data.tasks.filter(t=>t.status==="done"),active=data.tasks.filter(t=>!["done","cancelled"].includes(t.status));return <><PageTitle title="مرکز گزارش‌گیری" subtitle="گزارش یکپارچه مشتریان، پروژه‌ها، تسک‌ها، تیم و امور مالی"><Button variant="outline" onClick={()=>toast.success("گزارش برای خروجی آماده شد")}><Download/> خروجی گزارش</Button></PageTitle><div className="report-tabs">{[["projects","پروژه‌ها"],["clients","مشتریان"],["tasks","وظایف"],["team","اعضا"],["finance","مالی"]].map(([id,title])=><button className={section===id?"active":""} onClick={()=>setSection(id)} key={id}>{title}</button>)}</div><section className="report-kpis"><article><FolderKanban/><span><strong>{faDigits(String(data.projects.length))}</strong><small>پروژه قابل مشاهده</small></span></article><article><CheckCircle2/><span><strong>{faDigits(String(done.length))}</strong><small>تسک تکمیل‌شده</small></span></article><article><Clock3/><span><strong>{faDigits(String(active.length))}</strong><small>تسک در جریان</small></span></article><article><Users/><span><strong>{faDigits(String(data.clients.length))}</strong><small>مشتری ثبت‌شده</small></span></article></section><section className="panel report-table">{section==="projects"&&data.projects.map(p=><div key={p.id}><strong>{p.title}</strong><span>{p.client||"پروژه آزاد"}</span><span>{data.tasks.filter(t=>t.project===p.title&&t.status==="done").length} انجام‌شده</span><span>{data.tasks.filter(t=>t.project===p.title&&!['done','cancelled'].includes(t.status)).length} باز</span></div>)}{section==="clients"&&data.clients.map(c=><div key={c.id}><strong>{c.name}</strong><span>{c.company}</span><span>{c.service}</span><span>{data.projects.filter(p=>p.client===c.company).length} پروژه</span></div>)}{section==="tasks"&&done.map(t=><div key={t.id}><strong>{t.title}</strong><span>{t.project}</span><span>{t.assignee}</span><span>{t.archivedAt||t.endDate}</span></div>)}{section==="team"&&data.members.map(m=><div key={m.id}><strong>{m.name}</strong><span>{m.role}</span><span>{data.tasks.filter(t=>t.assignee===m.name&&t.status==="done").length} تکمیل‌شده</span><span>{data.attendance.filter(a=>a.memberId===m.id).length} روز حضور</span></div>)}{section==="finance"&&data.transactions.map(t=><div key={t.id}><strong>{t.title}</strong><span>{t.project}</span><span>{money(t.amount)}</span><span>{t.status==="paid"?"پرداخت‌شده":"باز"}</span></div>)}</section></>}

function GlobalSearchResults({query,data,onProject,onView,close}:{query:string;data:Workspace;onProject:(project:Project)=>void;onView:(view:View)=>void;close:()=>void}) {
  const clean=(value:string)=>value.toLocaleLowerCase("fa").replace(/[يى]/g,"ی").replace(/ك/g,"ک").replace(/\s+/g," ").trim();
  const needle=clean(query);
  const projects=data.projects.filter(p=>clean(`${p.title} ${p.client||""} ${p.service} ${p.manager}`).includes(needle)).slice(0,4);
  const tasks=data.tasks.filter(t=>clean(`${t.title} ${t.description} ${t.project} ${t.assignee} ${t.label}`).includes(needle)).slice(0,5);
  const clients=data.clients.filter(c=>clean(`${c.name} ${c.company} ${c.phone} ${c.service}`).includes(needle)).slice(0,3);
  const members=data.members.filter(m=>clean(`${m.name} ${m.email} ${m.role}`).includes(needle)).slice(0,3);
  const total=projects.length+tasks.length+clients.length+members.length;
  return <div className="smart-search-results">
    <header><span><Search/> نتایج جست‌وجو</span><button onClick={close}><X/></button></header>
    {!total&&<div className="search-empty">نتیجه‌ای پیدا نشد؛ نام پروژه، مشتری، تسک یا همکار را کامل‌تر بنویسید.</div>}
    {projects.length>0&&<section><h4>پروژه‌ها</h4>{projects.map(p=><button key={p.id} onClick={()=>onProject(p)}><span className="search-result-icon project"><FolderKanban/></span><span><strong>{p.title}</strong><small>{p.client||"پروژه آزاد"} · {p.service}</small></span><ArrowLeft/></button>)}</section>}
    {tasks.length>0&&<section><h4>تسک‌ها</h4>{tasks.map(t=><button key={t.id} onClick={()=>onView("tasks")}><span className="search-result-icon task"><ListChecks/></span><span><strong>{t.title}</strong><small>{t.project} · {t.assignee}</small></span><ArrowLeft/></button>)}</section>}
    {(clients.length>0||members.length>0)&&<section><h4>افراد و مشتریان</h4>{clients.map(c=><button key={`c-${c.id}`} onClick={()=>onView("clients")}><span className="search-result-icon client"><UserRoundCheck/></span><span><strong>{c.name}</strong><small>{c.company} · {c.service}</small></span><ArrowLeft/></button>)}{members.map(m=><button key={`m-${m.id}`} onClick={()=>onView("team")}><span className="search-result-icon member"><Users/></span><span><strong>{m.name}</strong><small>{m.role}</small></span><ArrowLeft/></button>)}</section>}
  </div>
}

function PageTitle({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}
function Stat({
  icon: Icon,
  title,
  value,
  hint,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  hint: string;
  color: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}17`, color }}>
        <Icon size={23} />
      </div>
      <div className="stat-copy">
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </div>
  );
}
function Dashboard({
  data,
  totals,
  setView,
}: {
  data: Workspace;
  totals: { income: number; expense: number; receivable: number };
  setView: (v: View) => void;
}) {
  return (
    <>
      <PageTitle
        title="سلام بهراد، روز بخیر"
        subtitle="خلاصه وضعیت امروز آژانس تبلیغاتی کلمه"
      >
        <Button onClick={() => setView("tasks")}>
          <Plus size={17} /> وظیفه جدید
        </Button>
      </PageTitle>
      <section className="stats-grid">
        <Stat
          icon={FolderKanban}
          title="پروژه فعال"
          value={String(data.projects.length)}
          hint="در حال اجرا"
          color="#6a58c7"
        />
        <Stat
          icon={ListChecks}
          title="کارهای باز"
          value={String(data.tasks.filter((t) => t.status !== "done").length)}
          hint="در همه پروژه‌ها"
          color="#2786d8"
        />
        <Stat
          icon={Clock3}
          title="وظایف لغوشده"
          value={String(
            data.tasks.filter((t) => t.status === "cancelled").length,
          )}
          hint="قابل بازگردانی"
          color="#f29b36"
        />
        <Stat
          icon={CircleDollarSign}
          title="مطالبات"
          value={money(totals.receivable)}
          hint="ثبت‌شده این ماه"
          color="#e95a57"
        />
      </section>
      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>کارهای امروز</h2>
              <span>وظایف مهم تیم</span>
            </div>
            <Button variant="ghost" onClick={() => setView("tasks")}>
              مشاهده همه <ArrowLeft size={15} />
            </Button>
          </div>
          {data.tasks.slice(0, 5).map((t) => (
            <div className="compact-task" key={t.id}>
              <span
                className={`task-check ${t.status === "done" ? "checked" : ""}`}
              >
                {t.status === "done" && <Check size={14} />}
              </span>
              <span className="compact-copy">
                <strong>{t.title}</strong>
                <small>
                  {t.project} · {t.assignee}
                </small>
              </span>
              <Badge className={`status status-${t.status}`}>
                {columns.find((c) => c.id === t.status)?.title}
              </Badge>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>جریان مالی</h2>
              <span>شهریور ۱۴۰۵</span>
            </div>
          </div>
          <div className="finance-mini">
            <span>
              <TrendingUp />
              درآمد <b>{money(totals.income)}</b>
            </span>
            <span>
              <TrendingDown />
              هزینه <b>{money(totals.expense)}</b>
            </span>
            <span>
              <WalletCards />
              مانده <b>{money(totals.income - totals.expense)}</b>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
function Projects({
  projects,
  tasks,
  onAdd,
  onOpen,
}: {
  projects: Project[];
  tasks: Task[];
  onAdd: () => void;
  onOpen: (p: Project) => void;
}) {
  return (
    <>
      <PageTitle title="پروژه‌ها" subtitle={`${projects.length} پروژه فعال`}>
        <Button onClick={onAdd}>
          <Plus size={17} /> افزودن پروژه
        </Button>
      </PageTitle>
      <div className="projects-overview"><span><FolderKanban/><b>{faDigits(String(projects.length))}</b><small>پروژه فعال</small></span><span><ListChecks/><b>{faDigits(String(tasks.filter(t=>!["done","cancelled"].includes(t.status)).length))}</b><small>تسک باز</small></span><span><CheckCircle2/><b>{faDigits(String(tasks.filter(t=>t.status==="done").length))}</b><small>تکمیل‌شده</small></span></div>
      <div className="projects-grid">
        {projects.map((p) => {
          const related = tasks.filter((t) => t.project === p.title),
            done = related.filter((t) => t.status === "done").length,
            pct = related.length
              ? Math.round((done / related.length) * 100)
              : Math.round((p.done / p.total) * 100);
          return (
            <button
              className="project-card"
              style={{"--project-color":p.color} as React.CSSProperties}
              key={p.id}
              onClick={() => onOpen(p)}
            >
              <div className="project-card-top">
                <span
                  className="project-avatar"
                  style={{ background: p.color }}
                >
                  {p.logo?<img src={p.logo.url} alt={`لوگوی ${p.title}`}/>:p.title[0]}
                </span>
                <span className="project-title">
                  <strong>{p.title}</strong>
                  <small>
                    {p.client || "پروژه آزاد"} · {p.service}
                  </small>
                </span>
                <span className="project-state">فعال</span>
              </div>
              <div className="project-progress">
                <span>
                  پیشرفت پروژه <em>{pct}٪</em>
                </span>
                <Progress value={pct} />
              </div>
              <footer className="project-card-foot">
                <span><ListChecks/> <b>{faDigits(String(related.filter(t=>!["done","cancelled"].includes(t.status)).length))}</b> کار باز</span>
                <span><UserRound/> {p.manager}</span>
                <ArrowLeft className="project-open-arrow"/>
              </footer>
            </button>
          );
        })}
      </div>
    </>
  );
}
function Tasks({
  tasks,
  onAdd,
  onMove,
  onEdit,
  onDelete,
  dragged,
  setDragged,
}: {
  tasks: Task[];
  onAdd: () => void;
  onMove: (id: number, s: TaskStatus) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  dragged: number | null;
  setDragged: (id: number | null) => void;
}) {
  return (
    <>
      <PageTitle title="وظایف" subtitle="وظایف محول‌شده به اعضای تیم">
        <Button onClick={onAdd}>
          <Plus size={17} /> افزودن وظیفه
        </Button>
      </PageTitle>
      <div className="kanban board-page">
        {columns.map((col) => (
          <section
            className="kanban-column"
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragged && onMove(dragged, col.id)}
          >
            <header>
              <span>
                <i style={{ background: col.color }} />
                {col.title}
              </span>
              <b>{tasks.filter((t) => t.status === col.id).length}</b>
            </header>
            <div className="kanban-cards">
              {tasks
                .filter((t) => t.status === col.id)
                .map((t) => (
                  <article
                    className="kanban-card"
                    key={t.id}
                    draggable
                    onDragStart={() => setDragged(t.id)}
                  >
                    <div className="card-grip">
                      <GripVertical size={16} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="icon-button">
                            <MoreVertical size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(t.id)}>
                            <Edit3 /> ویرایش وظیفه
                          </DropdownMenuItem>
                          {t.status !== "done" && (
                            <DropdownMenuItem
                              onClick={() => onMove(t.id, "done")}
                            >
                              <CheckCircle2 /> انتقال به انجام شده
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="danger-item"
                            onClick={() => onDelete(t.id)}
                          >
                            <Trash2 /> حذف وظیفه
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3>{t.title}</h3>
                    <p>{t.description}</p>
                    <Badge variant="outline">{t.project}</Badge>
                    <footer>
                      <span className="task-meta">
                        <Avatar className="avatar">
                          <AvatarFallback>
                            {initials(t.assignee)}
                          </AvatarFallback>
                        </Avatar>
                        {t.assignee}
                      </span>
                      <span>{t.due}</span>
                    </footer>
                  </article>
                ))}
            </div>
            <button className="add-card" onClick={onAdd}>
              <Plus size={16} /> افزودن وظیفه
            </button>
          </section>
        ))}
      </div>
    </>
  );
}
function Finance({
  rows,
  totals,
  onAdd,
  onEdit,
  onDelete,
  onStatus,
}: {
  rows: Transaction[];
  totals: { income: number; expense: number; receivable: number };
  onAdd: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatus: (id: number, s: Transaction["status"]) => void;
}) {
  return (
    <>
      <PageTitle title="مدیریت مالی" subtitle="ثبت، ویرایش و پیگیری اسناد مالی">
        <Button variant="outline">
          <FileText size={16} /> خروجی گزارش
        </Button>
        <Button onClick={onAdd}>
          <Plus size={17} /> ثبت سند
        </Button>
      </PageTitle>
      <section className="stats-grid">
        <Stat
          icon={TrendingUp}
          title="درآمد"
          value={money(totals.income)}
          hint="این ماه"
          color="#2eaf74"
        />
        <Stat
          icon={TrendingDown}
          title="هزینه"
          value={money(totals.expense)}
          hint="این ماه"
          color="#ef5350"
        />
        <Stat
          icon={WalletCards}
          title="مطالبات"
          value={money(totals.receivable)}
          hint="نیازمند پیگیری"
          color="#ff9800"
        />
        <Stat
          icon={BarChart3}
          title="مانده خالص"
          value={money(totals.income - totals.expense)}
          hint="درآمد منهای هزینه"
          color="#5c6bc0"
        />
      </section>
      <section className="panel table-panel">
        <div className="panel-head">
          <div>
            <h2>آخرین اسناد مالی</h2>
            <span>{rows.length} سند ثبت شده</span>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>شرح</TableHead>
              <TableHead>پروژه</TableHead>
              <TableHead>نوع</TableHead>
              <TableHead>تاریخ</TableHead>
              <TableHead>مبلغ</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <strong>{t.title}</strong>
                </TableCell>
                <TableCell>{t.project}</TableCell>
                <TableCell>
                  <Badge className={`transaction type-${t.type}`}>
                    {t.type === "income"
                      ? "درآمد"
                      : t.type === "expense"
                        ? "هزینه"
                        : "طلب"}
                  </Badge>
                </TableCell>
                <TableCell>{t.date}</TableCell>
                <TableCell
                  className={t.type === "expense" ? "amount expense" : "amount"}
                >
                  {money(t.amount)}
                </TableCell>
                <TableCell>
                  <select
                    className={`status-select pay-${t.status}`}
                    value={t.status}
                    onChange={(e) =>
                      onStatus(t.id, e.target.value as Transaction["status"])
                    }
                  >
                    <option value="paid">پرداخت شده</option>
                    <option value="pending">در انتظار</option>
                    <option value="overdue">سررسید گذشته</option>
                  </select>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="icon-button">
                        <MoreVertical size={17} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(t.id)}>
                        <Edit3 /> ویرایش سند
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="danger-item"
                        onClick={() => onDelete(t.id)}
                      >
                        <Trash2 /> حذف سند
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}
function Clients({ clients, onAdd }: { clients: Client[]; onAdd: () => void }) {
  return (
    <>
      <PageTitle
        title="مشتریان"
        subtitle={String(clients.length) + " مشتری ثبت شده"}
      >
        <Button onClick={onAdd}>
          <Plus size={17} /> ثبت مشتری جدید
        </Button>
      </PageTitle>
      <section className="panel table-panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>مشتری</TableHead>
              <TableHead>شرکت</TableHead>
              <TableHead>تلفن</TableHead>
              <TableHead>ایمیل</TableHead>
              <TableHead>خدمت</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="client-name">
                    <Avatar className="avatar">
                      <AvatarFallback>{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <strong>{c.name}</strong>
                  </div>
                </TableCell>
                <TableCell>{c.company}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{c.service}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}
function Team({
  members,
  tasks,
  onAdd,
  onAccess,
  onDelete,
}: {
  members: Member[];
  tasks: Task[];
  onAdd: () => void;
  onAccess: (m: Member) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <>
      <PageTitle title="اعضای تیم" subtitle="ساخت کاربر، نقش‌ها و سطح دسترسی">
        <Button onClick={onAdd}>
          <UserPlus size={17} /> ساخت کاربر جدید
        </Button>
      </PageTitle>
      <section className="team-grid">
        {members.map((m) => (
          <article className="member-card" key={m.id}>
            <div className="member-top">
              <Avatar className="member-avatar">
                <AvatarImage src={m.avatar?.url} />
                <AvatarFallback>{initials(m.name)}</AvatarFallback>
              </Avatar>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="icon-button">
                    <MoreVertical size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAccess(m)}>
                    <ShieldCheck /> ویرایش دسترسی
                  </DropdownMenuItem>
                  {m.id !== 1 && (
                    <DropdownMenuItem
                      className="danger-item"
                      onClick={() => onDelete(m.id)}
                    >
                      <Trash2 /> حذف کاربر
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <h3>{m.name}</h3>
            <p>{m.email}</p>
            <div className="member-meta">
              <span>{m.role}</span>
              <span>
                {
                  tasks.filter(
                    (t) => t.assignee === m.name && t.status !== "done",
                  ).length
                }{" "}
                کار باز
              </span>
            </div>
            <div className="member-actions">
              <Button variant="outline" onClick={() => onAccess(m)}>
                <LockKeyhole size={15} /> دسترسی‌ها
              </Button>
              <Badge variant={m.status === "فعال" ? "default" : "outline"}>
                {m.status}
              </Badge>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
function Messages({
  chats,
  selected,
  setSelected,
  message,
  setMessage,
  send,
  onGroup,
}: {
  chats: Chat[];
  selected: number;
  setSelected: (n: number) => void;
  message: string;
  setMessage: (s: string) => void;
  send: () => void;
  onGroup: () => void;
}) {
  const chat = chats.find((c) => c.id === selected) || chats[0];
  return (
    <>
      <PageTitle title="پیام‌ها" subtitle="گفت‌وگوی مستقیم و گروه‌های کاری">
        <Button onClick={onGroup}>
          <Plus size={17} /> گروه جدید
        </Button>
      </PageTitle>
      <section className="messages-layout">
        <aside className="panel chat-list">
          <div className="search-box compact">
            <Search size={16} />
            <input placeholder="جستجوی گفتگو..." />
          </div>
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`chat-person ${c.id === selected ? "active" : ""}`}
            >
              <Avatar className="avatar">
                <AvatarFallback>
                  {c.group ? "گ" : initials(c.name)}
                </AvatarFallback>
              </Avatar>
              <span>
                <strong>{c.name}</strong>
                <small>{c.messages.at(-1)?.text || "گفتگوی جدید"}</small>
              </span>
              <em>{c.group ? `${c.members.length} عضو` : ""}</em>
            </button>
          ))}
        </aside>
        <div className="panel conversation">
          <header>
            <Avatar className="avatar">
              <AvatarFallback>
                {chat?.group ? "گ" : initials(chat?.name || "")}
              </AvatarFallback>
            </Avatar>
            <span>
              <strong>{chat?.name}</strong>
              <small>
                {chat?.group ? `${chat.members.length} عضو` : "آنلاین"}
              </small>
            </span>
            <button className="icon-button">
              <MoreVertical size={18} />
            </button>
          </header>
          <div className="conversation-body">
            {chat?.messages.map((m) => (
              <div key={m.id} className={`bubble ${m.mine ? "mine" : "other"}`}>
                {m.text}
                <small>{m.time}</small>
              </div>
            ))}
          </div>
          <footer>
            <Button variant="ghost" size="icon">
              <Paperclip />
            </Button>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="پیام خود را بنویسید..."
            />
            <Button size="icon" onClick={send}>
              <Send size={17} />
            </Button>
          </footer>
        </div>
      </section>
    </>
  );
}
function Letters({
  letters,
  onAdd,
  onRead,
}: {
  letters: Letter[];
  onAdd: () => void;
  onRead: (id: number) => void;
}) {
  return (
    <>
      <PageTitle title="نامه‌ها" subtitle="کارتابل حرفه‌ای مکاتبات داخلی">
        <Button onClick={onAdd}>
          <FilePlus2 size={17} /> ایجاد نامه
        </Button>
      </PageTitle>
      <Tabs defaultValue="in" className="main-tabs">
        <TabsList variant="line">
          <TabsTrigger value="in">
            <Inbox /> صندوق ورودی
          </TabsTrigger>
          <TabsTrigger value="out">
            <Send /> ارسالی‌ها
          </TabsTrigger>
          <TabsTrigger value="archive">
            <Archive /> آرشیو
          </TabsTrigger>
        </TabsList>
        <TabsContent value="in">
          <section className="panel table-panel">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>موضوع</TableHead>
                  <TableHead>فرستنده</TableHead>
                  <TableHead>گیرنده</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {letters.map((l) => (
                  <TableRow
                    key={l.id}
                    className={l.status === "جدید" ? "unread-row" : ""}
                  >
                    <TableCell>
                      <span className="letter-title">
                        <Mail size={17} />
                        <strong>{l.subject}</strong>
                      </span>
                    </TableCell>
                    <TableCell>{l.from}</TableCell>
                    <TableCell>{l.to}</TableCell>
                    <TableCell>{l.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRead(l.id)}
                      >
                        مشاهده
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </TabsContent>
        <TabsContent value="out">
          <div className="panel empty-state">
            نامه‌های ارسال‌شده در همین کارتابل قابل پیگیری هستند.
          </div>
        </TabsContent>
        <TabsContent value="archive">
          <div className="panel empty-state">
            هنوز نامه‌ای بایگانی نشده است.
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
function SettingsView({
  fontScale,
  setFontScale,
  theme,
  setTheme,
}: {
  fontScale: number;
  setFontScale: (n: number) => void;
  theme: string;
  setTheme: (s: string) => void;
}) {
  return (
    <>
      <PageTitle
        title="تنظیمات میزکار"
        subtitle="ظاهر، خوانایی و تنظیمات عمومی"
      />
      <div className="settings-grid">
        <section className="panel setting-card">
          <div className="setting-icon">
            <Settings />
          </div>
          <div>
            <h2>اندازه نوشته‌ها</h2>
            <p>
              اندازه متن همه بخش‌های پنل را متناسب با نمایشگر خود تنظیم کنید.
            </p>
          </div>
          <div className="font-options">
            {[
              [0.94, "کوچک"],
              [1, "استاندارد"],
              [1.1, "درشت"],
              [1.18, "خیلی درشت"],
            ].map(([v, l]) => (
              <button
                key={String(v)}
                className={fontScale === v ? "active" : ""}
                onClick={() => setFontScale(v as number)}
              >
                {l}
              </button>
            ))}
          </div>
        </section>
        <section className="panel setting-card">
          <div className="setting-icon">
            <SlidersHorizontal />
          </div>
          <div>
            <h2>رنگ‌بندی پنل</h2>
            <p>
              تم انتخابی فقط ظاهر پنل را تغییر می‌دهد و اطلاعات دست‌نخورده
              می‌ماند.
            </p>
          </div>
          <div className="theme-options">
            {[
              ["violet", "آبی سازمانی", "#012BF9"],
              ["blue", "آبی روشن", "#3156ff"],
              ["teal", "سبزآبی", "#168b85"],
              ["dark", "تیره", "#232638"],
            ].map(([v, l, c]) => (
              <button
                key={v}
                className={theme === v ? "active" : ""}
                onClick={() => setTheme(v)}
              >
                <i style={{ background: c }} />
                {l}
              </button>
            ))}
          </div>
        </section>
        <section className="panel setting-row">
          <div>
            <h3>اعلان وظایف نزدیک سررسید</h3>
            <p>دو روز قبل از مهلت انجام یادآوری نمایش داده شود.</p>
          </div>
          <Switch defaultChecked />
        </section>
        <section className="panel setting-row">
          <div>
            <h3>نمایش فعالیت آنلاین همکاران</h3>
            <p>وضعیت حضور اعضای تیم در منوی کناری دیده شود.</p>
          </div>
          <Switch defaultChecked />
        </section>
      </div>
    </>
  );
}

function Modal({
  open,
  close,
  title,
  description,
  children,
  onSubmit,
  submit = "ذخیره",
}: {
  open: boolean;
  close: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submit?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="entity-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              انصراف
            </Button>
            <Button type="submit">{submit}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
const fd = (e: FormEvent<HTMLFormElement>) =>
  Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<
    string,
    string
  >;
function Field({
  label,
  name,
  defaultValue,
  children,
  wide = false,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children?: React.ReactNode;
  wide?: boolean;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className={wide ? "wide" : ""}>
      {label}
      {children || (
        <Input
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
        />
      )}
    </label>
  );
}
function ProjectDialog({
  open,
  close,
  clients,
  members,
  free,
  setFree,
  save,
}: {
  open: boolean;
  close: () => void;
  clients: Client[];
  members: Member[];
  free: boolean;
  setFree: (v: boolean) => void;
  save: (p: Project) => void;
}) {
  return (
    <Modal
      open={open}
      close={close}
      title="ایجاد پروژه جدید"
      description="پروژه را به یک مشتری متصل کنید یا به‌صورت پروژه آزاد بسازید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          id: Date.now(),
          title: d.title,
          color: "#012BF9",
          client: free ? null : d.client,
          service: d.service,
          manager: d.manager,
          done: 0,
          total: 0,
        });
      }}
    >
      <div className="free-project">
        <Checkbox checked={free} onCheckedChange={(v) => setFree(Boolean(v))} />
        <span>
          <strong>پروژه آزاد است</strong>
          <small>این پروژه مشتری ندارد.</small>
        </span>
      </div>
      <div className="form-grid">
        <Field label="عنوان پروژه" name="title" required />
        <Field label="مشتری" name="client">
          <select name="client" disabled={free} required={!free}>
            {clients.map((c) => (
              <option key={c.id} value={c.company}>
                {c.company} — {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="نوع خدمت" name="service">
          <select name="service">
            <option>سئو سایت</option>
            <option>طراحی سایت</option>
            <option>گرافیک</option>
            <option>تولید محتوا</option>
            <option>پشتیبانی سایت</option>
          </select>
        </Field>
        <Field label="مدیر پروژه" name="manager">
          <select name="manager">
            {members.map((m) => (
              <option key={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}
function ProjectSettings({
  open,
  close,
  project,
  clients,
  members,
  save,
}: {
  open: boolean;
  close: () => void;
  project: Project | null;
  clients: Client[];
  members: Member[];
  save: (p: Project) => void;
}) {
  if (!project) return null;
  return (
    <Modal
      open={open}
      close={close}
      title="تنظیمات پروژه"
      description="اطلاعات پایه، مشتری و مدیر پروژه را ویرایش کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          ...project,
          title: d.title,
          client: d.client || null,
          service: d.service,
          manager: d.manager,
        });
      }}
    >
      <div className="form-grid">
        <Field label="عنوان پروژه" name="title" defaultValue={project.title} />
        <Field label="مشتری" name="client">
          <select name="client" defaultValue={project.client || ""}>
            <option value="">پروژه آزاد</option>
            {clients.map((c) => (
              <option key={c.id} value={c.company}>
                {c.company}
              </option>
            ))}
          </select>
        </Field>
        <Field label="خدمت" name="service" defaultValue={project.service} />
        <Field label="مدیر پروژه" name="manager">
          <select name="manager" defaultValue={project.manager}>
            {members.map((m) => (
              <option key={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}
function TaskDialog({
  open,
  close,
  task,
  projects,
  members,
  save,
  defaultProject,
}: {
  open: boolean;
  close: () => void;
  task?: Task;
  projects: Project[];
  members: Member[];
  save: (t: Task) => void;
  defaultProject?: string;
}) {
  return (
    <Modal
      open={open}
      close={close}
      title={task ? "ویرایش وظیفه" : "افزودن وظیفه"}
      description="وظیفه را به پروژه و مسئول انجام محول کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e),
          status = d.status as TaskStatus;
        save({
          id: task?.id || Date.now(),
          title: d.title,
          description: d.description,
          project: d.project,
          assignee: d.assignee,
          due: d.due,
          label: d.label,
          status,
          progress: status === "done" ? 100 : Number(d.progress || 0),
        });
      }}
    >
      <div className="form-grid">
        <Field
          label="عنوان وظیفه"
          name="title"
          defaultValue={task?.title}
          wide
          required
        />
        <Field label="پروژه" name="project">
          <select name="project" defaultValue={task?.project || defaultProject}>
            {projects.map((p) => (
              <option key={p.id}>{p.title}</option>
            ))}
          </select>
        </Field>
        <Field label="مسئول انجام" name="assignee">
          <select name="assignee" defaultValue={task?.assignee}>
            {members
              .filter((m) => m.status === "فعال")
              .map((m) => (
                <option key={m.id}>{m.name}</option>
              ))}
          </select>
        </Field>
        <Field
          label="مهلت انجام"
          name="due"
          defaultValue={task?.due || "۲۵ شهریور"}
        />
        <Field
          label="برچسب"
          name="label"
          defaultValue={task?.label || "عمومی"}
        />
        <Field label="وضعیت" name="status">
          <select name="status" defaultValue={task?.status || "backlog"}>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="درصد پیشرفت"
          name="progress"
          type="number"
          defaultValue={String(task?.progress || 0)}
        />
        <label className="wide">
          توضیحات
          <Textarea name="description" defaultValue={task?.description} />
        </label>
      </div>
    </Modal>
  );
}
function FinanceDialog({
  open,
  close,
  row,
  projects,
  save,
}: {
  open: boolean;
  close: () => void;
  row?: Transaction;
  projects: Project[];
  save: (t: Transaction) => void;
}) {
  return (
    <Modal
      open={open}
      close={close}
      title={row ? "ویرایش سند مالی" : "ثبت سند مالی"}
      description="اطلاعات سند و وضعیت پرداخت را ثبت کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          id: row?.id || Date.now(),
          title: d.title,
          project: d.project,
          type: d.type as Transaction["type"],
          amount: Number(d.amount),
          date: d.date,
          status: d.status as Transaction["status"],
        });
      }}
    >
      <div className="form-grid">
        <Field
          label="شرح سند"
          name="title"
          defaultValue={row?.title}
          required
        />
        <Field label="پروژه / دسته" name="project">
          <select name="project" defaultValue={row?.project}>
            <option>هزینه عمومی</option>
            {projects.map((p) => (
              <option key={p.id}>{p.title}</option>
            ))}
          </select>
        </Field>
        <Field label="نوع سند" name="type">
          <select name="type" defaultValue={row?.type || "income"}>
            <option value="income">درآمد</option>
            <option value="expense">هزینه</option>
            <option value="receivable">طلب</option>
          </select>
        </Field>
        <Field
          label="مبلغ (تومان)"
          name="amount"
          type="number"
          defaultValue={String(row?.amount || "")}
          required
        />
        <Field
          label="تاریخ شمسی"
          name="date"
          defaultValue={row?.date || "۱۴۰۵/۰۶/۱۷"}
        />
        <Field label="وضعیت" name="status">
          <select name="status" defaultValue={row?.status || "pending"}>
            <option value="paid">پرداخت شده</option>
            <option value="pending">در انتظار</option>
            <option value="overdue">سررسید گذشته</option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}
function MemberDialog({
  open,
  close,
  save,
}: {
  open: boolean;
  close: () => void;
  save: (m: Member) => void;
}) {
  return (
    <Modal
      open={open}
      close={close}
      title="ثبت همکار جدید"
      description="اطلاعات همکار و نقش سازمانی را تعریف کنید."
      submit="ثبت همکار"
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          id: Date.now(),
          name: d.name,
          email: d.email,
          role: d.role,
          status: "فعال",
          permissions: ["وظایف", "پیام‌ها"],
        });
      }}
    >
      <div className="form-grid">
        <Field label="نام و نام خانوادگی" name="name" required />
        <Field label="ایمیل ورود" name="email" type="email" required />
        <Field label="نقش سازمانی" name="role">
          <select name="role">
            <option>کارشناس سئو</option>
            <option>توسعه‌دهنده</option>
            <option>طراح</option>
            <option>مدیر پروژه</option>
            <option>حسابدار</option>
          </select>
        </Field>
      </div>
      <div className="security-note">
        <ShieldCheck />
        <span>
          <strong>آماده اتصال ورود امن</strong>
          <small>
            ورود با ایمیل و رمز در نسخه نهایی cPanel به بک‌اند امن متصل می‌شود.
          </small>
        </span>
      </div>
    </Modal>
  );
}
function AccessDialog({
  open,
  close,
  member,
  save,
}: {
  open: boolean;
  close: () => void;
  member: Member | null;
  save: (m: Member) => void;
}) {
  const [perms, setPerms] = useState<string[]>([]);
  useEffect(() => setPerms(member?.permissions || []), [member]);
  if (!member) return null;
  const all = [
    "داشبورد",
    "پروژه‌ها",
    "وظایف",
    "مالی",
    "مشتریان",
    "لیدها",
    "قراردادها",
    "اعضای تیم",
    "حضور و غیاب",
    "مرخصی‌ها",
    "پیام‌ها",
    "نامه‌ها",
    "تنظیمات",
  ];
  return (
    <Modal
      open={open}
      close={close}
      title={`دسترسی‌های ${member.name}`}
      description="بخش‌هایی که این کاربر اجازه مشاهده و ویرایش دارد."
      onSubmit={(e) => {
        e.preventDefault();
        save({ ...member, permissions: perms });
      }}
    >
      <div className="permission-grid">
        {all.map((p) => (
          <label key={p}>
            <Checkbox
              checked={perms.includes(p)}
              onCheckedChange={(v) =>
                setPerms((x) => (v ? [...x, p] : x.filter((a) => a !== p)))
              }
            />
            <span>{p}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}
function GroupDialog({
  open,
  close,
  members,
  save,
}: {
  open: boolean;
  close: () => void;
  members: Member[];
  save: (c: Chat) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <Modal
      open={open}
      close={close}
      title="ساخت گروه جدید"
      description="یک گروه کاری بسازید و همکاران را عضو کنید."
      submit="ساخت گروه"
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          id: Date.now(),
          name: d.name,
          group: true,
          members: ["بهراد یزدان‌پناه", ...picked],
          messages: [],
        });
        setPicked([]);
      }}
    >
      <Field label="نام گروه" name="name" required />
      <div className="member-picker">
        {members
          .filter((m) => m.id !== 1)
          .map((m) => (
            <label key={m.id}>
              <Checkbox
                checked={picked.includes(m.name)}
                onCheckedChange={(v) =>
                  setPicked((x) =>
                    v ? [...x, m.name] : x.filter((a) => a !== m.name),
                  )
                }
              />
              <Avatar className="avatar">
                <AvatarFallback>{initials(m.name)}</AvatarFallback>
              </Avatar>
              <span>
                <strong>{m.name}</strong>
                <small>{m.role}</small>
              </span>
            </label>
          ))}
      </div>
    </Modal>
  );
}
function LetterDialog({
  open,
  close,
  members,
  save,
}: {
  open: boolean;
  close: () => void;
  members: Member[];
  save: (l: Letter) => void;
}) {
  return (
    <Modal
      open={open}
      close={close}
      title="ایجاد نامه داخلی"
      description="نامه را برای یک همکار یا همه اعضای تیم ارسال کنید."
      submit="ارسال نامه"
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          id: Date.now(),
          subject: d.subject,
          from: "بهراد یزدان‌پناه",
          to: d.to,
          body: d.body,
          date: "۱۴۰۵/۰۶/۱۷",
          status: "جدید",
        });
      }}
    >
      <div className="form-grid">
        <Field label="موضوع نامه" name="subject" wide required />
        <Field label="گیرنده" name="to" wide>
          <select name="to">
            <option>همه اعضای تیم</option>
            {members
              .filter((m) => m.id !== 1)
              .map((m) => (
                <option key={m.id}>{m.name}</option>
              ))}
          </select>
        </Field>
        <label className="wide">
          متن نامه
          <Textarea
            name="body"
            rows={7}
            required
            placeholder="متن نامه را بنویسید..."
          />
        </label>
        <label className="upload-inline">
          <Paperclip /> افزودن پیوست
          <input type="file" />
        </label>
      </div>
    </Modal>
  );
}
function ProjectPanel({
  project,
  tasks,
  members,
  close,
  onSettings,
  onAddTask,
  onMove,
  onToggleSubtask,
  onUpdateTask,
  onUpdateProject,
}: {
  project: Project | null;
  tasks: Task[];
  members: Member[];
  close: () => void;
  onSettings: () => void;
  onAddTask: () => void;
  onMove: (id: number, s: TaskStatus) => void;
  onToggleSubtask: (taskId:number, subtaskId:number) => void;
  onUpdateTask:(task:Task)=>void;
  onUpdateProject:(project:Project)=>void;
}) {
  if (!project) return null;
  const list = tasks.filter((t) => t.project === project.title);
  return (
    <Dialog open={Boolean(project)} onOpenChange={(v) => !v && close()}>
      <DialogContent className="project-dialog" showCloseButton={false}>
        <div className="project-dialog-head">
          <button className="icon-button" onClick={close}>
            <X size={20} />
          </button>
          <div className="project-avatar" style={{ background: project.color }}>
            {project.logo?<img src={project.logo.url} alt={`لوگوی ${project.title}`}/>:project.title[0]}
          </div>
          <div>
            <h2>{project.title}</h2>
            <span>
              {project.client || "پروژه آزاد"} · {list.length} وظیفه
            </span>
          </div>
          <Button
            variant="outline"
            className="project-settings"
            onClick={onSettings}
          >
            <Settings size={16} /> تنظیمات پروژه
          </Button>
          <Button onClick={onAddTask}>
            <Plus size={16} /> افزودن وظیفه
          </Button>
        </div>
        <Tabs defaultValue="board" className="project-tabs">
          <TabsList variant="line">
            <TabsTrigger value="board">بورد پروژه</TabsTrigger>
            <TabsTrigger value="members">اعضای پروژه</TabsTrigger>
          </TabsList>
          <TabsContent value="board">
            <div className="kanban">
              {columns.map((c) => (
                <section className="kanban-column" key={c.id}>
                  <header>
                    <span>
                      <i style={{ background: c.color }} />
                      {c.title}
                    </span>
                    <b>{list.filter((t) => t.status === c.id).length}</b>
                  </header>
                  {list
                    .filter((t) => t.status === c.id)
                    .map((t) => (
                      <article className="kanban-card" key={t.id}>
                        <h3>{t.title}</h3>
                        <p>{t.assignee}</p>
                        {t.status !== "done" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onMove(t.id, "done")}
                          >
                            <Check /> انجام شد
                          </Button>
                        )}
                      </article>
                    ))}
                </section>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="members">
            <div className="project-member-list">
              {members
                .filter(
                  (m) =>
                    list.some((t) => t.assignee === m.name) ||
                    m.name === project.manager,
                )
                .map((m) => (
                  <div key={m.id}>
                    <Avatar>
                      <AvatarFallback>{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <span>
                      <strong>{m.name}</strong>
                      <small>{m.role}</small>
                    </span>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Leads({
  leads,
  onAdd,
  onConvert,
}: {
  leads: Lead[];
  onAdd: () => void;
  onConvert: (l: Lead) => void;
}) {
  return (
    <>
      <PageTitle title="لیدها" subtitle={`${leads.length} فرصت فروش`}>
        <Button onClick={onAdd}>
          <Plus /> افزودن لید
        </Button>
      </PageTitle>
      <section className="panel table-panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام</TableHead>
              <TableHead>شرکت</TableHead>
              <TableHead>تماس</TableHead>
              <TableHead>خدمت</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <strong>{l.name}</strong>
                </TableCell>
                <TableCell>{l.company}</TableCell>
                <TableCell>{l.phone}</TableCell>
                <TableCell>{l.service}</TableCell>
                <TableCell>
                  <Badge variant="outline">{l.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => onConvert(l)}>
                    تبدیل به مشتری
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}
function Contracts({
  contracts,
  onAdd,
}: {
  contracts: Contract[];
  onAdd: () => void;
}) {
  return (
    <>
      <PageTitle
        title="قراردادها"
        subtitle={`${contracts.length} قرارداد ثبت شده`}
      >
        <Button onClick={onAdd}>
          <Plus /> ثبت قرارداد
        </Button>
      </PageTitle>
      <section className="contracts-grid">
        {contracts.map((c) => (
          <article className="contract-card" key={c.id}>
            <div className="contract-icon">
              <FileText />
              <span>PDF</span>
            </div>
            <div className="contract-content">
              <Badge variant="outline">{c.status}</Badge>
              <h3>{c.title}</h3>
              <p>
                {c.client} · {c.date}
              </p>
              <button className="file-row">
                <Paperclip />
                {c.fileName}
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
function ClientDialog({
  open,
  close,
  save,
}: {
  open: boolean;
  close: () => void;
  save: (c: Client) => void;
}) {
  return (
    <Modal
      open={open}
      close={close}
      title="ثبت مشتری جدید"
      description="اطلاعات تماس و خدمت مشتری را وارد کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          id: Date.now(),
          name: d.name,
          company: d.company,
          phone: d.phone,
          email: d.email,
          service: d.service,
        });
      }}
    >
      <div className="form-grid">
        <Field label="نام و نام خانوادگی" name="name" required />
        <Field label="نام شرکت" name="company" required />
        <Field label="شماره تلفن" name="phone" required />
        <Field label="ایمیل" name="email" type="email" />
        <Field label="خدمت" name="service">
          <select name="service">
            <option>سئو سایت</option>
            <option>طراحی سایت</option>
            <option>گرافیک</option>
            <option>تولید محتوا</option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}
function LeadDialog({
  open,
  close,
  save,
}: {
  open: boolean;
  close: () => void;
  save: (l: Lead) => void;
}) {
  return (
    <Modal
      open={open}
      close={close}
      title="افزودن لید"
      description="اطلاعات سرنخ فروش و مرحله پیگیری را ثبت کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          id: Date.now(),
          name: d.name,
          company: d.company,
          phone: d.phone,
          email: d.email,
          service: d.service,
          status: d.status as Lead["status"],
        });
      }}
    >
      <div className="form-grid">
        <Field label="نام و نام خانوادگی" name="name" required />
        <Field label="نام شرکت" name="company" required />
        <Field label="شماره تلفن" name="phone" required />
        <Field label="ایمیل" name="email" type="email" />
        <Field label="خدمت" name="service" />
        <Field label="وضعیت" name="status">
          <select name="status">
            <option>در حال مذاکره</option>
            <option>منتظر قرارداد</option>
            <option>پیگیری مجدد</option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}
function ContractDialog({
  open,
  close,
  clients,
  save,
}: {
  open: boolean;
  close: () => void;
  clients: Client[];
  save: (c: Contract) => void;
}) {
  const [file, setFile] = useState("");
  return (
    <Modal
      open={open}
      close={close}
      title="ثبت قرارداد"
      description="عنوان، مشتری و فایل قرارداد را ثبت کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          id: Date.now(),
          title: d.title,
          client: d.client,
          date: d.date,
          fileName: file || "contract.pdf",
          status: d.status as Contract["status"],
        });
        setFile("");
      }}
    >
      <div className="form-grid">
        <Field label="عنوان قرارداد" name="title" required />
        <Field label="مشتری" name="client">
          <select name="client">
            {clients.map((c) => (
              <option key={c.id}>{c.company}</option>
            ))}
          </select>
        </Field>
        <Field label="تاریخ شمسی" name="date" defaultValue="۱۴۰۵/۰۶/۱۷" />
        <Field label="وضعیت" name="status">
          <select name="status">
            <option>فعال</option>
            <option>پیش‌نویس</option>
            <option>تمام شده</option>
          </select>
        </Field>
        <label className="upload-inline wide">
          <Paperclip />
          {file || "انتخاب فایل PDF"}
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0]?.name || "")}
          />
        </label>
      </div>
    </Modal>
  );
}

const faDigits = (value: string) =>
  value.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

function ClientsPro({
  clients,
  onAdd,
}: {
  clients: Client[];
  onAdd: () => void;
}) {
  return (
    <>
      <PageTitle title="مشتریان" subtitle={`${clients.length} مشتری ثبت شده`}>
        <Button onClick={onAdd}>
          <Plus size={17} /> ثبت مشتری جدید
        </Button>
      </PageTitle>
      <section className="client-showcase">
        {clients.slice(0, 3).map((c) => (
          <article key={c.id} className="client-profile-card">
            <div className="client-profile-head">
              <Avatar className="member-avatar">
                <AvatarFallback>{initials(c.name)}</AvatarFallback>
              </Avatar>
              <span>
                <strong>{c.name}</strong>
                <small>{c.company}</small>
              </span>
              <Badge>{c.service}</Badge>
            </div>
            <div className="client-contact-grid">
              <span>
                <small>شماره تماس</small>
                <b className="phone-number">{faDigits(c.phone)}</b>
              </span>
              <span>
                <small>ایمیل</small>
                <b>{c.email}</b>
              </span>
            </div>
          </article>
        ))}
      </section>
      <section className="panel table-panel clients-table">
        <div className="panel-head">
          <div>
            <h2>فهرست مشتریان</h2>
            <span>اطلاعات تماس و خدمات فعال</span>
          </div>
          <div className="search-box compact">
            <Search size={16} />
            <input placeholder="جستجوی مشتری..." />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام مشتری</TableHead>
              <TableHead>شرکت</TableHead>
              <TableHead>خدمت</TableHead>
              <TableHead>شماره تماس</TableHead>
              <TableHead>ایمیل</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="client-name">
                    <Avatar className="avatar">
                      <AvatarFallback>{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <strong>{c.name}</strong>
                  </div>
                </TableCell>
                <TableCell>{c.company}</TableCell>
                <TableCell>
                  <Badge variant="outline">{c.service}</Badge>
                </TableCell>
                <TableCell>
                  <span className="phone-number">{faDigits(c.phone)}</span>
                </TableCell>
                <TableCell>
                  <span className="latin-data">{c.email}</span>
                </TableCell>
                <TableCell>
                  <button className="icon-button">
                    <MoreVertical />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}

function SettingsPro({
  fontScale,
  setFontScale,
  theme,
  setTheme,
  onSave,
}: {
  fontScale: number;
  setFontScale: (n: number) => void;
  theme: string;
  setTheme: (s: string) => void;
  onSave: () => void;
}) {
  return (
    <>
      <PageTitle
        title="تنظیمات میزکار"
        subtitle="ظاهر، خوانایی و تنظیمات عمومی"
      >
        <Button onClick={onSave}>
          <Check size={17} /> ذخیره تنظیمات
        </Button>
      </PageTitle>
      <div className="settings-grid">
        <section className="panel setting-card">
          <div className="setting-icon">
            <Settings />
          </div>
          <div>
            <h2>اندازه نوشته‌ها</h2>
            <p>اندازه متن تمام بخش‌های پنل را انتخاب کنید.</p>
          </div>
          <div className="font-options">
            {[
              [0.94, "کوچک"],
              [1, "استاندارد"],
              [1.1, "درشت"],
              [1.18, "خیلی درشت"],
            ].map(([v, l]) => (
              <button
                key={String(v)}
                className={fontScale === v ? "active" : ""}
                onClick={() => setFontScale(v as number)}
              >
                {l}
              </button>
            ))}
          </div>
        </section>
        <section className="panel setting-card">
          <div className="setting-icon">
            <SlidersHorizontal />
          </div>
          <div>
            <h2>رنگ‌بندی پنل</h2>
            <p>تم دلخواه میزکار را انتخاب و سپس ذخیره کنید.</p>
          </div>
          <div className="theme-options">
            {[
              ["violet", "آبی سازمانی", "#012BF9"],
              ["blue", "آبی روشن", "#3156ff"],
              ["teal", "سبزآبی", "#168b85"],
              ["dark", "تیره", "#232638"],
            ].map(([v, l, c]) => (
              <button
                key={v}
                className={theme === v ? "active" : ""}
                onClick={() => setTheme(v)}
              >
                <i style={{ background: c }} />
                {l}
              </button>
            ))}
          </div>
        </section>
        <section className="panel setting-row">
          <div>
            <h3>اعلان سررسید وظایف</h3>
            <p>دو روز قبل از موعد، اعلان نمایش داده شود.</p>
          </div>
          <Switch defaultChecked />
        </section>
        <section className="panel setting-row">
          <div>
            <h3>نمایش وضعیت آنلاین</h3>
            <p>حضور همکاران در منوی کناری نمایش داده شود.</p>
          </div>
          <Switch defaultChecked />
        </section>
      </div>
      <div className="settings-save-bar">
        <span>بعد از تغییرات، تنظیمات را ذخیره کنید.</span>
        <Button onClick={onSave}>
          <Check /> ذخیره تغییرات
        </Button>
      </div>
    </>
  );
}

function MessagesPro({
  chats,
  selected,
  setSelected,
  message,
  setMessage,
  send,
  onGroup,
  upload,
  file,
}: {
  chats: Chat[];
  selected: number;
  setSelected: (n: number) => void;
  message: string;
  setMessage: (s: string) => void;
  send: () => void;
  onGroup: () => void;
  upload: (f: File) => void;
  file: Attachment | null;
}) {
  const chat = chats.find((c) => c.id === selected) || chats[0];
  return (
    <>
      <PageTitle title="پیام‌ها" subtitle="گفت‌وگوی مستقیم و گروه‌های کاری">
        <Button onClick={onGroup}>
          <Plus size={17} /> گروه جدید
        </Button>
      </PageTitle>
      <section className="messages-layout">
        <aside className="panel chat-list">
          <div className="search-box compact">
            <Search />
            <input placeholder="جستجوی گفتگو..." />
          </div>
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`chat-person ${c.id === selected ? "active" : ""}`}
            >
              <Avatar className="avatar">
                <AvatarFallback>
                  {c.group ? "گ" : initials(c.name)}
                </AvatarFallback>
              </Avatar>
              <span>
                <strong>{c.name}</strong>
                <small>
                  {c.messages.at(-1)?.attachment?.name ||
                    c.messages.at(-1)?.text ||
                    "گفتگوی جدید"}
                </small>
              </span>
              <em>{c.group ? `${c.members.length} عضو` : ""}</em>
            </button>
          ))}
        </aside>
        <div className="panel conversation">
          <header>
            <Avatar className="avatar">
              <AvatarFallback>
                {chat?.group ? "گ" : initials(chat?.name || "")}
              </AvatarFallback>
            </Avatar>
            <span>
              <strong>{chat?.name}</strong>
              <small>
                {chat?.group ? `${chat.members.length} عضو` : "آنلاین"}
              </small>
            </span>
          </header>
          <div className="conversation-body">
            {chat?.messages.map((m) => (
              <div key={m.id} className={`bubble ${m.mine ? "mine" : "other"}`}>
                {m.text}
                {m.attachment && (
                  <a
                    className="chat-attachment"
                    href={m.attachment.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText />
                    <span>
                      <strong>{m.attachment.name}</strong>
                      <small>
                        {m.attachment.type.startsWith("image/")
                          ? "تصویر"
                          : "فایل پیوست"}
                      </small>
                    </span>
                    <Download />
                  </a>
                )}
                <small>{m.time}</small>
              </div>
            ))}
          </div>
          {file && (
            <div className="pending-file">
              <Paperclip />
              <span>{file.name}</span>
              <small>آماده ارسال</small>
            </div>
          )}
          <footer>
            <label className="chat-upload" title="ارسال عکس یا فایل">
              <Paperclip />
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                onChange={(e) =>
                  e.target.files?.[0] && upload(e.target.files[0])
                }
              />
            </label>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="پیام خود را بنویسید..."
            />
            <Button size="icon" onClick={send}>
              <Send />
            </Button>
          </footer>
        </div>
      </section>
    </>
  );
}

function LettersPro({
  letters,
  onAdd,
  onRead,
}: {
  letters: Letter[];
  onAdd: () => void;
  onRead: (id: number) => void;
}) {
  const [selected, setSelected] = useState<Letter | null>(null);
  const open = (l: Letter) => {
    setSelected(l);
    onRead(l.id);
  };
  return (
    <>
      <PageTitle title="نامه‌ها" subtitle="کارتابل مکاتبات داخلی">
        <Button onClick={onAdd}>
          <FilePlus2 /> ایجاد نامه
        </Button>
      </PageTitle>
      <Tabs defaultValue="in" className="main-tabs">
        <TabsList variant="line">
          <TabsTrigger value="in">
            <Inbox /> صندوق ورودی
          </TabsTrigger>
          <TabsTrigger value="out">
            <Send /> ارسالی‌ها
          </TabsTrigger>
          <TabsTrigger value="archive">
            <Archive /> آرشیو
          </TabsTrigger>
        </TabsList>
        <TabsContent value="in">
          <section className="panel table-panel letters-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>موضوع نامه</TableHead>
                  <TableHead>فرستنده</TableHead>
                  <TableHead>گیرنده</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="letter-action-head">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {letters.map((l) => (
                  <TableRow
                    key={l.id}
                    className={l.status === "جدید" ? "unread-row" : ""}
                  >
                    <TableCell>
                      <span className="letter-title">
                        <Mail />
                        <strong>{l.subject}</strong>
                      </span>
                    </TableCell>
                    <TableCell>{l.from}</TableCell>
                    <TableCell>{l.to}</TableCell>
                    <TableCell>{l.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.status}</Badge>
                    </TableCell>
                    <TableCell className="letter-action">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => open(l)}
                      >
                        مشاهده
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </TabsContent>
        <TabsContent value="out">
          <div className="panel empty-state">
            نامه‌های ارسال‌شده در همین کارتابل قابل پیگیری هستند.
          </div>
        </TabsContent>
        <TabsContent value="archive">
          <div className="panel empty-state">
            هنوز نامه‌ای بایگانی نشده است.
          </div>
        </TabsContent>
      </Tabs>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(v) => !v && setSelected(null)}
      >
        <DialogContent className="letter-dialog" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
            <DialogDescription>
              از {selected?.from} برای {selected?.to} · {selected?.date}
            </DialogDescription>
          </DialogHeader>
          <article className="letter-paper">
            <div className="letter-brand">
              <span>ک</span>
              <strong>آژانس تبلیغاتی کلمه</strong>
            </div>
            <p>{selected?.body}</p>
            <footer>
              با احترام
              <br />
              {selected?.from}
            </footer>
          </article>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              بستن
            </Button>
            <Button>پاراف و تأیید</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TeamPro({
  members,
  tasks,
  attendance,
  leaves,
  logs,
  onAdd,
  onAccess,
  onDelete,
  onCheckIn,
  onCheckOut,
  onLeave,
  onLeaveStatus,
}: {
  members: Member[];
  tasks: Task[];
  attendance: Attendance[];
  leaves: Leave[];
  logs: AuditLog[];
  onAdd: () => void;
  onAccess: (m: Member) => void;
  onDelete: (id: number) => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onLeave: (l: Leave) => void;
  onLeaveStatus: (id: number, s: Leave["status"]) => void;
}) {
  const [leaveOpen, setLeaveOpen] = useState(false),[reportMember,setReportMember]=useState<Member|null>(null);
  const member = (id: number) => members.find((m) => m.id === id);
  const currentOpen = attendance.some((a) => a.memberId === 1 && !a.checkOut);
  return (
    <>
      <PageTitle
        title="اعضای تیم"
        subtitle="اعضا، حضور و غیاب، مرخصی و گزارش فعالیت"
      >
        <Button
          variant="outline"
          onClick={currentOpen ? onCheckOut : onCheckIn}
        >
          {currentOpen ? (
            <>
              <LogOut /> ثبت خروج من
            </>
          ) : (
            <>
              <LogIn /> ثبت ورود من
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => setLeaveOpen(true)}>
          <CalendarOff /> درخواست مرخصی
        </Button>
        <Button onClick={onAdd}>
          <UserPlus /> عضو جدید
        </Button>
      </PageTitle>
      <Tabs defaultValue="members" className="main-tabs team-tabs">
        <TabsList variant="line">
          <TabsTrigger value="members">اعضا</TabsTrigger>
          <TabsTrigger value="attendance">حضور و غیاب</TabsTrigger>
          <TabsTrigger value="leave">مرخصی‌ها</TabsTrigger>
          <TabsTrigger value="monthly">گزارش ماهانه</TabsTrigger>
          <TabsTrigger value="logs">لاگ فعالیت‌ها</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <section className="team-grid">
            {members.map((m) => (
              <article className="member-card" key={m.id}>
                <div className="member-top">
                  <Avatar className="member-avatar">
                    <AvatarImage src={m.avatar?.url} />
                    <AvatarFallback>{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="icon-button">
                        <MoreVertical />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onAccess(m)}>
                        <ShieldCheck /> شخصی‌سازی دسترسی
                      </DropdownMenuItem>
                      {m.id !== 1 && (
                        <DropdownMenuItem
                          className="danger-item"
                          onClick={() => onDelete(m.id)}
                        >
                          <Trash2 /> حذف عضو
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3>{m.name}</h3>
                <p>{m.email}</p>
                <div className={`presence ${m.lastSeen&&Date.now()-m.lastSeen<120000?"online":"offline"}`}><i/>{m.lastSeen&&Date.now()-m.lastSeen<120000?"آنلاین":m.lastSeen?`آخرین فعالیت ${new Intl.DateTimeFormat("fa-IR",{hour:"2-digit",minute:"2-digit"}).format(new Date(m.lastSeen))}`:"هنوز وارد نشده"}</div>
                <div className="member-meta">
                  <span>{m.role}</span>
                  <span>
                    {
                      tasks.filter(
                        (t) => t.assignee === m.name && t.status !== "done",
                      ).length
                    }{" "}
                    کار باز
                  </span>
                </div>
                <Button variant="outline" onClick={() => onAccess(m)}>
                  <LockKeyhole /> تنظیم دسترسی‌ها
                </Button>
                <Button variant="ghost" onClick={()=>setReportMember(m)}><BarChart3/> گزارش عملکرد ماهانه</Button>
              </article>
            ))}
          </section>
        </TabsContent>
        <TabsContent value="attendance">
          <section className="panel table-panel">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>همکار</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>ورود</TableHead>
                  <TableHead>خروج</TableHead>
                  <TableHead>وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{member(a.memberId)?.name}</TableCell>
                    <TableCell>{a.date}</TableCell>
                    <TableCell>{a.checkIn}</TableCell>
                    <TableCell>{a.checkOut || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {a.checkOut ? "تکمیل شده" : "در محل کار"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </TabsContent>
        <TabsContent value="leave">
          <section className="panel table-panel">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>متقاضی</TableHead>
                  <TableHead>از تاریخ</TableHead>
                  <TableHead>تا تاریخ</TableHead>
                  <TableHead>دلیل</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>تصمیم مدیر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{member(l.memberId)?.name}</TableCell>
                    <TableCell>{l.from}</TableCell>
                    <TableCell>{l.to}</TableCell>
                    <TableCell>{l.reason}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {l.status === "در انتظار" ? (
                        <div className="decision-actions">
                          <Button
                            size="sm"
                            onClick={() => onLeaveStatus(l.id, "تأیید شده")}
                          >
                            تأیید
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onLeaveStatus(l.id, "رد شده")}
                          >
                            رد
                          </Button>
                        </div>
                      ) : (
                        "ثبت شده"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </TabsContent>
        <TabsContent value="monthly">
          <section className="monthly-grid">
            {members.map((m) => {
              const rows = attendance.filter((a) => a.memberId === m.id);
              return (
                <article className="panel monthly-card" key={m.id}>
                  <Avatar>
                    <AvatarFallback>{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <strong>{m.name}</strong>
                    <small>شهریور ۱۴۰۵</small>
                  </div>
                  <b>{rows.length} روز حضور</b>
                  <span>
                    {
                      tasks.filter(
                        (t) => t.assignee === m.name && t.status === "done",
                      ).length
                    }{" "}
                    تسک تکمیل‌شده
                  </span>
                </article>
              );
            })}
          </section>
        </TabsContent>
        <TabsContent value="logs">
          <section className="panel audit-list">
            {logs.length ? (
              logs.map((log) => (
                <div key={log.id}>
                  <span className="audit-icon">
                    <Activity />
                  </span>
                  <p>
                    <strong>{log.member}</strong>
                    {log.action}
                  </p>
                  <time>{log.time}</time>
                </div>
              ))
            ) : (
              <div className="empty-state">هنوز فعالیتی ثبت نشده است.</div>
            )}
          </section>
        </TabsContent>
      </Tabs>
      <Dialog open={Boolean(reportMember)} onOpenChange={v=>!v&&setReportMember(null)}><DialogContent className="member-report-dialog"><DialogHeader><DialogTitle>گزارش عملکرد {reportMember?.name}</DialogTitle><DialogDescription>شهریور ۱۴۰۵ · گزارش اختصاصی مدیر کل</DialogDescription></DialogHeader>{reportMember&&<div className="member-report-kpis"><span><strong>{tasks.filter(t=>t.assignee===reportMember.name&&t.status==="done").length}</strong><small>تسک تکمیل‌شده</small></span><span><strong>{tasks.filter(t=>t.assignee===reportMember.name&&!['done','cancelled'].includes(t.status)).length}</strong><small>تسک باز</small></span><span><strong>{attendance.filter(a=>a.memberId===reportMember.id).length}</strong><small>روز حضور</small></span><span><strong>{leaves.filter(l=>l.memberId===reportMember.id&&l.status==="تأیید شده").length}</strong><small>مرخصی تأییدشده</small></span></div>}</DialogContent></Dialog>
      <Modal
        open={leaveOpen}
        close={() => setLeaveOpen(false)}
        title="درخواست مرخصی"
        description="بازه مرخصی و علت درخواست را ثبت کنید."
        submit="ارسال برای مدیر"
        onSubmit={(e) => {
          e.preventDefault();
          const d = fd(e);
          onLeave({
            id: Date.now(),
            memberId: 1,
            from: d.from,
            to: d.to,
            reason: d.reason,
            status: "در انتظار",
          });
          setLeaveOpen(false);
        }}
      >
        <div className="form-grid">
          <Field
            label="از تاریخ"
            name="from"
            defaultValue="۱۴۰۵/۰۶/۲۰"
            required
          />
          <Field
            label="تا تاریخ"
            name="to"
            defaultValue="۱۴۰۵/۰۶/۲۰"
            required
          />
          <label className="wide">
            علت درخواست
            <Textarea name="reason" required />
          </label>
        </div>
      </Modal>
    </>
  );
}

function MemberPicker({
  members,
  value,
  onChange,
}: {
  members: Member[];
  value: number[];
  onChange: (v: number[]) => void;
}) {
  return (
    <div className="project-member-picker">
      {members.map((m) => (
        <label key={m.id}>
          <Checkbox
            checked={value.includes(m.id)}
            onCheckedChange={(checked) =>
              onChange(
                checked ? [...value, m.id] : value.filter((id) => id !== m.id),
              )
            }
          />
          <Avatar className="avatar">
            <AvatarFallback>{initials(m.name)}</AvatarFallback>
          </Avatar>
          <span>{m.name}</span>
        </label>
      ))}
    </div>
  );
}
function ProjectDialogPro({
  open,
  close,
  clients,
  members,
  free,
  setFree,
  save,
}: {
  open: boolean;
  close: () => void;
  clients: Client[];
  members: Member[];
  free: boolean;
  setFree: (v: boolean) => void;
  save: (p: Project) => void;
}) {
  const [picked, setPicked] = useState<number[]>([1]),[logo,setLogo]=useState<Attachment|undefined>();
  const uploadLogo=async(file:File)=>{const body=new FormData();body.append("file",file);const response=await fetch("/api/files",{method:"POST",body});if(!response.ok){toast.error("بارگذاری لوگو انجام نشد");return}setLogo(await response.json());toast.success("لوگوی پروژه آماده شد")};
  return (
    <Modal
      open={open}
      close={close}
      title="ایجاد پروژه جدید"
      description="مشتری، مدیر و اعضای پروژه را مشخص کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          id: Date.now(),
          title: d.title,
          color: "#012BF9",
          client: free ? null : d.client,
          service: d.service,
          manager: d.manager,
          done: 0,
          total: 0,
          memberIds: picked,
          boardLabels: { ...defaultBoardLabels },
          workflowColumns: defaultWorkflowColumns,
          logo,
        });
      }}
    >
      <div className="free-project">
        <Checkbox checked={free} onCheckedChange={(v) => setFree(Boolean(v))} />
        <span>
          <strong>پروژه آزاد است</strong>
          <small>این پروژه مشتری ندارد.</small>
        </span>
      </div>
      <div className="form-grid">
        <label className="project-logo-upload wide"><span className="project-logo-preview">{logo?<img src={logo.url} alt="پیش‌نمایش لوگوی پروژه"/>:<FolderKanban/>}</span><span><strong>لوگوی پروژه</strong><small>PNG، JPG یا WEBP؛ پیشنهاد: تصویر مربعی</small></span><Button type="button" variant="outline">انتخاب لوگو</Button><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>e.target.files?.[0]&&uploadLogo(e.target.files[0])}/></label>
        <Field label="عنوان پروژه" name="title" required />
        <Field label="مشتری" name="client">
          <select name="client" disabled={free} required={!free}>
            {clients.map((c) => (
              <option key={c.id} value={c.company}>
                {c.company} — {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="نوع خدمت" name="service">
          <select name="service">
            <option>سئو سایت</option>
            <option>طراحی سایت</option>
            <option>گرافیک</option>
            <option>تولید محتوا</option>
          </select>
        </Field>
        <Field label="مدیر پروژه" name="manager">
          <select name="manager">
            {members.map((m) => (
              <option key={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <div>
        <h3 className="form-section-title">اعضای پروژه</h3>
        <MemberPicker members={members} value={picked} onChange={setPicked} />
      </div>
    </Modal>
  );
}
function ProjectSettingsPro({
  open,
  close,
  project,
  clients,
  members,
  save,
}: {
  open: boolean;
  close: () => void;
  project: Project | null;
  clients: Client[];
  members: Member[];
  save: (p: Project) => void;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  useEffect(() => setPicked(project?.memberIds || []), [project]);
  if (!project) return null;
  const labels = { ...defaultBoardLabels, ...project.boardLabels };
  return (
    <Modal
      open={open}
      close={close}
      title="تنظیمات پروژه"
      description="اعضا و نام ستون‌های کانبان را برای همین پروژه تنظیم کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          ...project,
          title: d.title,
          client: d.client || null,
          service: d.service,
          manager: d.manager,
          memberIds: picked,
          boardLabels: {
            backlog: d.backlog,
            doing: d.doing,
            done: d.done,
            cancelled: d.cancelled,
          },
        });
      }}
    >
      <div className="form-grid">
        <Field label="عنوان پروژه" name="title" defaultValue={project.title} />
        <Field label="مشتری" name="client">
          <select name="client" defaultValue={project.client || ""}>
            <option value="">پروژه آزاد</option>
            {clients.map((c) => (
              <option key={c.id}>{c.company}</option>
            ))}
          </select>
        </Field>
        <Field label="خدمت" name="service" defaultValue={project.service} />
        <Field label="مدیر پروژه" name="manager">
          <select name="manager" defaultValue={project.manager}>
            {members.map((m) => (
              <option key={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <h3 className="form-section-title">عنوان ستون‌های کانبان</h3>
      <div className="form-grid">
        <Field label="ستون اول" name="backlog" defaultValue={labels.backlog} />
        <Field label="ستون دوم" name="doing" defaultValue={labels.doing} />
        <Field label="ستون سوم" name="done" defaultValue={labels.done} />
        <Field
          label="ستون چهارم"
          name="cancelled"
          defaultValue={labels.cancelled}
        />
      </div>
      <h3 className="form-section-title">اعضای پروژه</h3>
      <MemberPicker members={members} value={picked} onChange={setPicked} />
    </Modal>
  );
}
function ProjectPanelPro({
  project,
  tasks,
  members,
  close,
  onSettings,
  onAddTask,
  onMove,
}: {
  project: Project | null;
  tasks: Task[];
  members: Member[];
  close: () => void;
  onSettings: () => void;
  onAddTask: () => void;
  onMove: (id: number, s: TaskStatus) => void;
}) {
  if (!project) return null;
  const list = tasks.filter((t) => t.project === project.title),
    labels = { ...defaultBoardLabels, ...project.boardLabels };
  return (
    <Dialog open={Boolean(project)} onOpenChange={(v) => !v && close()}>
      <DialogContent className="project-dialog" showCloseButton={false}>
        <div className="project-dialog-head">
          <button className="icon-button" onClick={close}>
            <X />
          </button>
          <div className="project-avatar" style={{ background: project.color }}>
            {project.logo?<img src={project.logo.url} alt={`لوگوی ${project.title}`}/>:project.title[0]}
          </div>
          <div>
            <h2>{project.title}</h2>
            <span>
              {project.client || "پروژه آزاد"} · {list.length} وظیفه
            </span>
          </div>
          <Button
            variant="outline"
            className="project-settings"
            onClick={onSettings}
          >
            <Settings /> تنظیمات پروژه
          </Button>
          <Button onClick={onAddTask}>
            <Plus /> افزودن وظیفه
          </Button>
        </div>
        <Tabs defaultValue="board" className="project-tabs">
          <TabsList variant="line">
            <TabsTrigger value="board">کانبان پروژه</TabsTrigger>
            <TabsTrigger value="members">اعضای پروژه</TabsTrigger>
          </TabsList>
          <TabsContent value="board">
            <div className="kanban">
              {columns.map((c) => (
                <section className="kanban-column" key={c.id}>
                  <header>
                    <span>
                      <i style={{ background: c.color }} />
                      {labels[c.id]}
                    </span>
                    <b>{list.filter((t) => t.status === c.id).length}</b>
                  </header>
                  <div className="kanban-cards">
                    {list
                      .filter((t) => t.status === c.id)
                      .map((t) => (
                        <article
                          className={`kanban-card project-task-card ${t.status === "done" ? "completed" : ""}`}
                          key={t.id}
                        >
                          <button
                            className={`task-checkbox ${t.status === "done" ? "checked" : ""}`}
                            onClick={() =>
                              onMove(
                                t.id,
                                t.status === "done" ? "backlog" : "done",
                              )
                            }
                            aria-label={
                              t.status === "done"
                                ? "بازگرداندن وظیفه"
                                : "تکمیل وظیفه"
                            }
                          >
                            {t.status === "done" && <Check />}
                          </button>
                          <div>
                            <h3>{t.title}</h3>
                            <p>
                              {t.assignee} · {t.due}
                            </p>
                          </div>
                        </article>
                      ))}
                  </div>
                </section>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="members">
            <div className="project-member-list">
              {members
                .filter((m) => (project.memberIds || []).includes(m.id))
                .map((m) => (
                  <div key={m.id}>
                    <Avatar>
                      <AvatarFallback>{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <span>
                      <strong>{m.name}</strong>
                      <small>{m.role}</small>
                    </span>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ClientsV2({
  clients,
  projects,
  transactions,
  contracts,
  onAdd,
}: {
  clients: Client[];
  projects:Project[];transactions:Transaction[];contracts:Contract[];
  onAdd: () => void;
}) {
  const [search, setSearch] = useState(""),[selected,setSelected]=useState<Client|null>(null);
  const visible = clients.filter((c) =>
    `${c.name} ${c.company} ${c.service} ${c.phone}`.includes(search),
  );
  const services = new Set(clients.map((c) => c.service)).size;
  return (
    <>
      <PageTitle title="مشتریان" subtitle="پرونده مشتریان و خدمات فعال">
        <Button onClick={onAdd}>
          <UserPlus /> افزودن مشتری
        </Button>
      </PageTitle>
      <div className="client-kpis">
        <article>
          <span className="client-kpi-icon purple">
            <Users />
          </span>
          <div>
            <strong>{clients.length}</strong>
            <small>مشتری فعال</small>
          </div>
        </article>
        <article>
          <span className="client-kpi-icon blue">
            <FolderKanban />
          </span>
          <div>
            <strong>{clients.length}</strong>
            <small>پروژه متصل</small>
          </div>
        </article>
        <article>
          <span className="client-kpi-icon green">
            <CheckCircle2 />
          </span>
          <div>
            <strong>{services}</strong>
            <small>نوع خدمت</small>
          </div>
        </article>
      </div>
      <section className="panel client-directory">
        <div className="directory-head">
          <div>
            <h2>فهرست مشتریان</h2>
            <span>اطلاعات تماس، شرکت و سرویس‌های فعال</span>
          </div>
          <label className="directory-search">
            <Search />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام، شرکت یا خدمت..."
            />
          </label>
        </div>
        <div className="client-table-head">
          <span>مشتری</span>
          <span>شرکت</span>
          <span>خدمت</span>
          <span>شماره تماس</span>
          <span>ایمیل</span>
          <span>عملیات</span>
        </div>
        <div className="client-rows">
          {visible.map((c, i) => (
            <article className="client-modern-row" key={c.id} onDoubleClick={()=>setSelected(c)}>
              <div className="client-identity">
                <Avatar className="client-avatar">
                  <AvatarFallback>{initials(c.name)}</AvatarFallback>
                </Avatar>
                <span>
                  <strong>{c.name}</strong>
                  <small>شناسه مشتری {faDigits(String(1020 + i))}</small>
                </span>
              </div>
              <div className="client-company">
                <span className="company-mark">{c.company[0]}</span>
                <strong>{c.company}</strong>
              </div>
              <div>
                <Badge
                  className={`service-pill service-${i % 3}`}
                  variant="outline"
                >
                  {c.service}
                </Badge>
              </div>
              <a
                className="contact-value phone-number"
                href={`tel:${c.phone.replace(/\s/g, "")}`}
              >
                {faDigits(c.phone)}
              </a>
              <a
                className="contact-value latin-data"
                href={`mailto:${c.email}`}
              >
                {c.email}
              </a>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="row-menu" aria-label={`عملیات ${c.name}`}>
                    <MoreVertical />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>
                    <Edit3 /> ویرایش اطلاعات
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FolderKanban /> مشاهده پروژه‌ها
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={()=>setSelected(c)}><UserRoundCheck/> پروفایل کامل مشتری</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="danger-item">
                    <Trash2 /> حذف مشتری
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </article>
          ))}
        </div>
        {!visible.length && (
          <div className="empty-state">مشتری‌ای با این عبارت پیدا نشد.</div>
        )}
      </section>
      <Dialog open={Boolean(selected)} onOpenChange={v=>!v&&setSelected(null)}><DialogContent className="client-profile-dialog"><DialogHeader><DialogTitle>پروفایل مشتری</DialogTitle><DialogDescription>نمای کامل همکاری، قراردادها و وضعیت مالی</DialogDescription></DialogHeader>{selected&&<><header className="client-profile-head"><Avatar><AvatarFallback>{initials(selected.name)}</AvatarFallback></Avatar><div><h2>{selected.name}</h2><span>{selected.company} · {selected.service}</span></div><a href={`tel:${selected.phone.replace(/\s/g,"")}`}>{selected.phone}</a></header><div className="client-profile-kpis"><span><strong>{projects.filter(p=>p.client===selected.company).length}</strong><small>پروژه</small></span><span><strong>{contracts.filter(c=>c.client===selected.company).length}</strong><small>قرارداد</small></span><span><strong>{money(transactions.filter(t=>projects.some(p=>p.client===selected.company&&p.title===t.project)&&t.type==="income"&&t.status==="paid").reduce((s,t)=>s+t.amount,0))}</strong><small>دریافتی</small></span></div><section className="client-profile-projects"><h3>پروژه‌های مشتری</h3>{projects.filter(p=>p.client===selected.company).map(p=><div key={p.id}><span className="project-avatar" style={{background:p.color}}>{p.logo?<img src={p.logo.url} alt=""/>:p.title[0]}</span><span><strong>{p.title}</strong><small>{p.service} · مدیر {p.manager}</small></span></div>)}</section></>}</DialogContent></Dialog>
    </>
  );
}

function MessagesV2({
  chats,
  selected,
  setSelected,
  message,
  setMessage,
  send,
  onGroup,
  onDirect,
  upload,
  file,
}: {
  chats: Chat[];
  selected: number;
  setSelected: (n: number) => void;
  message: string;
  setMessage: (s: string) => void;
  send: () => void;
  onGroup: () => void;
  onDirect: () => void;
  upload: (f: File) => void;
  file: Attachment | null;
}) {
  const chat = chats.find((c) => c.id === selected) || chats[0];
  const [filter, setFilter] = useState("");
  const visible = chats.filter((c) => c.name.includes(filter));
  return (
    <>
      <PageTitle title="پیام‌ها" subtitle="گفت‌وگوهای مستقیم و گروه‌های کاری">
        <Button variant="outline" onClick={onGroup}>
          <Users /> گروه جدید
        </Button>
        <Button onClick={onDirect}>
          <MessageCircle /> پیام جدید
        </Button>
      </PageTitle>
      <section className="messages-layout messages-v2">
        <aside className="panel chat-list">
          <div className="chat-list-title">
            <div>
              <strong>گفت‌وگوها</strong>
              <small>{chats.length} مکالمه فعال</small>
            </div>
            <button className="icon-button" onClick={onDirect}>
              <Plus />
            </button>
          </div>
          <label className="search-box compact">
            <Search />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="جستجوی گفتگو..."
            />
          </label>
          {visible.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`chat-person ${c.id === selected ? "active" : ""}`}
            >
              <Avatar className="avatar">
                <AvatarFallback>
                  {c.group ? "گ" : initials(c.name)}
                </AvatarFallback>
              </Avatar>
              <span>
                <strong>{c.name}</strong>
                <small>
                  {c.messages.at(-1)?.attachment?.name ||
                    c.messages.at(-1)?.text ||
                    "گفتگوی جدید"}
                </small>
              </span>
              <em>{c.group ? `${c.members.length} عضو` : "مستقیم"}</em>
            </button>
          ))}
        </aside>
        <div className="panel conversation">
          <header>
            <Avatar className="avatar">
              <AvatarFallback>
                {chat?.group ? "گ" : initials(chat?.name || "")}
              </AvatarFallback>
            </Avatar>
            <span>
              <strong>{chat?.name}</strong>
              <small>
                <i className="online-dot" />
                {chat?.group
                  ? `${chat.members.length} عضو`
                  : "آنلاین · گفتگوی مستقیم"}
              </small>
            </span>
            <button className="icon-button">
              <MoreVertical />
            </button>
          </header>
          <div className="conversation-body">
            {chat?.messages.map((m) => (
              <div key={m.id} className={`bubble ${m.mine ? "mine" : "other"}`}>
                {m.text}
                {m.attachment && (
                  <a
                    className="chat-attachment"
                    href={m.attachment.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText />
                    <span>
                      <strong>{m.attachment.name}</strong>
                      <small>
                        {m.attachment.type.startsWith("image/")
                          ? "تصویر"
                          : "فایل پیوست"}
                      </small>
                    </span>
                    <Download />
                  </a>
                )}
                <small>{m.time}</small>
              </div>
            ))}
          </div>
          {file && (
            <div className="pending-file">
              <Paperclip />
              <span>{file.name}</span>
              <small>آماده ارسال</small>
            </div>
          )}
          <footer>
            <label className="chat-upload" title="ارسال عکس یا فایل">
              <Paperclip />
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                onChange={(e) =>
                  e.target.files?.[0] && upload(e.target.files[0])
                }
              />
            </label>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="پیام خود را بنویسید..."
            />
            <Button size="icon" onClick={send}>
              <Send />
            </Button>
          </footer>
        </div>
      </section>
    </>
  );
}

function DirectMessageDialog({
  open,
  close,
  members,
  save,
}: {
  open: boolean;
  close: () => void;
  members: Member[];
  save: (c: Chat) => void;
}) {
  return (
    <Modal
      open={open}
      close={close}
      title="شروع گفتگوی مستقیم"
      description="یک همکار را انتخاب کنید و اولین پیام را بفرستید."
      submit="ایجاد گفتگو"
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          id: Date.now(),
          name: d.member,
          group: false,
          members: ["بهراد یزدان‌پناه", d.member],
          messages: d.message
            ? [{ id: Date.now(), mine: true, text: d.message, time: now() }]
            : [],
        });
      }}
    >
      <div className="direct-message-form">
        <label>
          همکار
          <select name="member" required>
            {members
              .filter((m) => m.id !== 1)
              .map((m) => (
                <option key={m.id}>{m.name}</option>
              ))}
          </select>
        </label>
        <label>
          پیام آغاز گفتگو
          <Textarea name="message" placeholder="سلام، درباره پروژه..." />
        </label>
      </div>
    </Modal>
  );
}

function LettersV2({
  letters,
  onAdd,
  onRead,
}: {
  letters: Letter[];
  onAdd: () => void;
  onRead: (id: number) => void;
}) {
  const [selected, setSelected] = useState<Letter | null>(null);
  const openLetter = (l: Letter) => {
    setSelected(l);
    onRead(l.id);
  };
  return (
    <>
      <PageTitle title="نامه‌ها" subtitle="کارتابل مکاتبات داخلی">
        <Button onClick={onAdd}>
          <FilePlus2 /> ایجاد نامه
        </Button>
      </PageTitle>
      <Tabs defaultValue="in" className="main-tabs">
        <TabsList variant="line">
          <TabsTrigger value="in">
            <Inbox /> صندوق ورودی
          </TabsTrigger>
          <TabsTrigger value="out">
            <Send /> ارسالی‌ها
          </TabsTrigger>
          <TabsTrigger value="archive">
            <Archive /> آرشیو
          </TabsTrigger>
        </TabsList>
        <TabsContent value="in">
          <section className="panel letters-directory">
            <div className="letters-grid-head">
              <span>موضوع نامه</span>
              <span>فرستنده</span>
              <span>گیرنده</span>
              <span>تاریخ</span>
              <span>وضعیت</span>
              <span>عملیات</span>
            </div>
            {letters.map((l) => (
              <article
                key={l.id}
                className={`letter-modern-row ${l.status === "جدید" ? "unread-row" : ""}`}
              >
                <div className="letter-subject">
                  <span className="letter-icon">
                    <Mail />
                  </span>
                  <strong>{l.subject}</strong>
                </div>
                <span>{l.from}</span>
                <span>{l.to}</span>
                <time>{l.date}</time>
                <Badge variant="outline">{l.status}</Badge>
                <Button
                  className="letter-view-button"
                  size="sm"
                  variant="outline"
                  onClick={() => openLetter(l)}
                >
                  مشاهده
                </Button>
              </article>
            ))}
          </section>
        </TabsContent>
        <TabsContent value="out">
          <div className="panel empty-state">
            نامه‌های ارسال‌شده در همین کارتابل قابل پیگیری هستند.
          </div>
        </TabsContent>
        <TabsContent value="archive">
          <div className="panel empty-state">
            هنوز نامه‌ای بایگانی نشده است.
          </div>
        </TabsContent>
      </Tabs>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(v) => !v && setSelected(null)}
      >
        <DialogContent className="letter-dialog rtl-dialog" dir="rtl">
          <DialogHeader className="letter-dialog-header">
            <DialogTitle>{selected?.subject}</DialogTitle>
            <DialogDescription>
              از {selected?.from} برای {selected?.to} · {selected?.date}
            </DialogDescription>
          </DialogHeader>
          <article className="letter-paper">
            <div className="letter-brand">
              <span>ک</span>
              <strong>آژانس تبلیغاتی کلمه</strong>
            </div>
            <p>{selected?.body}</p>
            <footer>
              با احترام
              <br />
              {selected?.from}
            </footer>
          </article>
          <DialogFooter className="letter-dialog-footer">
            <Button variant="outline" onClick={() => setSelected(null)}>
              بستن
            </Button>
            <Button>پاراف و تأیید</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProjectSettingsV2({
  open,
  close,
  project,
  clients,
  members,
  save,
}: {
  open: boolean;
  close: () => void;
  project: Project | null;
  clients: Client[];
  members: Member[];
  save: (p: Project) => void;
}) {
  const [picked, setPicked] = useState<number[]>([]),
    [tabs, setTabs] = useState<ProjectTab[]>(defaultProjectTabs),
    [newTab, setNewTab] = useState("");
  useEffect(() => {
    setPicked(project?.memberIds || []);
    setTabs(project?.tabs?.length ? project.tabs : defaultProjectTabs);
  }, [project]);
  if (!project) return null;
  const labels = { ...defaultBoardLabels, ...project.boardLabels };
  const renameTab = (id: string, title: string) =>
    setTabs((v) => v.map((t) => (t.id === id ? { ...t, title } : t)));
  return (
    <Modal
      open={open}
      close={close}
      title="تنظیمات پروژه"
      description="تب‌ها، ستون‌های کار و اعضای این پروژه را شخصی‌سازی کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          ...project,
          title: d.title,
          client: d.client || null,
          service: d.service,
          manager: d.manager,
          memberIds: picked,
          tabs,
          boardLabels: {
            backlog: d.backlog,
            doing: d.doing,
            done: d.done,
            cancelled: d.cancelled,
          },
        });
      }}
    >
      <div className="form-grid">
        <Field label="عنوان پروژه" name="title" defaultValue={project.title} />
        <Field label="مشتری" name="client">
          <select name="client" defaultValue={project.client || ""}>
            <option value="">پروژه آزاد</option>
            {clients.map((c) => (
              <option key={c.id}>{c.company}</option>
            ))}
          </select>
        </Field>
        <Field label="خدمت" name="service" defaultValue={project.service} />
        <Field label="مدیر پروژه" name="manager">
          <select name="manager" defaultValue={project.manager}>
            {members.map((m) => (
              <option key={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <section className="project-settings-section">
        <div className="section-title-row">
          <div>
            <h3>تب‌های بالای پروژه</h3>
            <p>نام تب‌های اصلی را تغییر دهید یا تب تازه بسازید.</p>
          </div>
        </div>
        <div className="tab-editor-list">
          {tabs.map((tab) => (
            <div className="tab-editor-row" key={tab.id}>
              <span>
                {tab.kind === "custom" ? <Plus /> : <LayoutDashboard />}
              </span>
              <Input
                value={tab.title}
                onChange={(e) => renameTab(tab.id, e.target.value)}
                aria-label="عنوان تب"
              />
              {tab.kind === "custom" && (
                <button
                  type="button"
                  className="remove-tab"
                  onClick={() =>
                    setTabs((v) => v.filter((t) => t.id !== tab.id))
                  }
                >
                  <Trash2 />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="add-tab-row">
          <Input
            value={newTab}
            onChange={(e) => setNewTab(e.target.value)}
            placeholder="مثلاً فایل‌ها، یادداشت‌ها یا گزارش هفتگی"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const title = newTab.trim();
              if (!title) return;
              setTabs((v) => [
                ...v,
                { id: `custom-${Date.now()}`, title, kind: "custom" },
              ]);
              setNewTab("");
            }}
          >
            <Plus /> افزودن تب
          </Button>
        </div>
      </section>
      <section className="project-settings-section">
        <h3>عنوان وضعیت‌های وظایف</h3>
        <div className="form-grid">
          <Field
            label="ستون اول کانبان"
            name="backlog"
            defaultValue={labels.backlog}
          />
          <Field
            label="ستون دوم کانبان"
            name="doing"
            defaultValue={labels.doing}
          />
          <Field
            label="عنوان تکمیل‌شده‌ها"
            name="done"
            defaultValue={labels.done}
          />
          <Field
            label="عنوان لغوشده‌ها"
            name="cancelled"
            defaultValue={labels.cancelled}
          />
        </div>
      </section>
      <section className="project-settings-section">
        <h3>اعضای پروژه</h3>
        <MemberPicker members={members} value={picked} onChange={setPicked} />
      </section>
    </Modal>
  );
}

function ProjectPanelV2({
  project,
  tasks,
  members,
  close,
  onSettings,
  onAddTask,
  onMove,
}: {
  project: Project | null;
  tasks: Task[];
  members: Member[];
  close: () => void;
  onSettings: () => void;
  onAddTask: () => void;
  onMove: (id: number, s: TaskStatus) => void;
}) {
  const [draggedTask, setDraggedTask] = useState<number | null>(null);
  if (!project) return null;
  const list = tasks.filter((t) => t.project === project.title),
    labels = { ...defaultBoardLabels, ...project.boardLabels },
    tabs = project.tabs?.length ? project.tabs : defaultProjectTabs;
  const activeColumns = columns.filter(
    (c) => c.id === "backlog" || c.id === "doing",
  );
  const archived = (status: TaskStatus) =>
    list.filter((t) => t.status === status);
  return (
    <Dialog open={Boolean(project)} onOpenChange={(v) => !v && close()}>
      <DialogContent
        className="project-dialog project-dialog-v2"
        showCloseButton={false}
      >
        <div className="project-dialog-head">
          <button className="icon-button" onClick={close}>
            <X />
          </button>
          <div className="project-avatar" style={{ background: project.color }}>
            {project.logo?<img src={project.logo.url} alt={`لوگوی ${project.title}`}/>:project.title[0]}
          </div>
          <div>
            <h2>{project.title}</h2>
            <span>
              {project.client || "پروژه آزاد"} ·{" "}
              {
                list.filter(
                  (t) => t.status !== "done" && t.status !== "cancelled",
                ).length
              }{" "}
              کار باز
            </span>
          </div>
          <Button
            variant="outline"
            className="project-settings"
            onClick={onSettings}
          >
            <Settings /> تنظیمات پروژه
          </Button>
          <Button onClick={onAddTask}>
            <Plus /> افزودن وظیفه
          </Button>
        </div>
        <Tabs defaultValue={tabs[0]?.id || "board"} className="project-tabs">
          <TabsList variant="line" className="project-top-tabs">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.kind === "board" && (
                <div className="kanban project-active-board">
                  {activeColumns.map((c) => (
                    <section
                      className="kanban-column"
                      key={c.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedTask) onMove(draggedTask, c.id);
                        setDraggedTask(null);
                      }}
                    >
                      <header>
                        <span>
                          <i style={{ background: c.color }} />
                          {labels[c.id]}
                        </span>
                        <b>{list.filter((t) => t.status === c.id).length}</b>
                      </header>
                      <div className="kanban-cards">
                        {list
                          .filter((t) => t.status === c.id)
                          .map((t) => (
                            <article
                              draggable
                              onDragStart={() => setDraggedTask(t.id)}
                              className="kanban-card project-task-card"
                              key={t.id}
                            >
                              <button
                                className="task-checkbox"
                                onClick={() => onMove(t.id, "done")}
                                aria-label="تکمیل وظیفه"
                              />
                              <div>
                                <h3>{t.title}</h3>
                                <p>
                                  {t.assignee} · {t.due}
                                </p>
                              </div>
                              <GripVertical className="task-grip" />
                            </article>
                          ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
              {tab.kind === "summary" && (
                <div className="project-status-summary">
                  <div className="summary-strip">
                    <article>
                      <strong>{list.length}</strong>
                      <span>کل وظایف</span>
                    </article>
                    <article>
                      <strong>{archived("done").length}</strong>
                      <span>{labels.done}</span>
                    </article>
                    <article>
                      <strong>{archived("cancelled").length}</strong>
                      <span>{labels.cancelled}</span>
                    </article>
                    <article>
                      <strong>
                        {list.filter((t) => t.status === "doing").length}
                      </strong>
                      <span>{labels.doing}</span>
                    </article>
                  </div>
                  <div className="archive-columns">
                    {(["done", "cancelled"] as TaskStatus[]).map((status) => (
                      <section
                        key={status}
                        className={`archive-column archive-${status}`}
                      >
                        <header>
                          <div>
                            <i />
                            <strong>{labels[status]}</strong>
                          </div>
                          <Badge variant="outline">
                            {archived(status).length}
                          </Badge>
                        </header>
                        {archived(status).map((t) => (
                          <article key={t.id}>
                            <button
                              className={`task-checkbox ${status === "done" ? "checked" : "cancelled"}`}
                              onClick={() => onMove(t.id, "backlog")}
                              aria-label="بازگرداندن به کانبان"
                            >
                              {status === "done" ? <Check /> : <X />}
                            </button>
                            <span>
                              <strong>{t.title}</strong>
                              <small>
                                {t.assignee} · {t.due}
                              </small>
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onMove(t.id, "backlog")}
                            >
                              بازگردانی
                            </Button>
                          </article>
                        ))}
                      </section>
                    ))}
                  </div>
                </div>
              )}
              {tab.kind === "members" && (
                <div className="project-member-list">
                  {members
                    .filter((m) => (project.memberIds || []).includes(m.id))
                    .map((m) => (
                      <div key={m.id}>
                        <Avatar>
                          <AvatarFallback>{initials(m.name)}</AvatarFallback>
                        </Avatar>
                        <span>
                          <strong>{m.name}</strong>
                          <small>{m.role}</small>
                        </span>
                      </div>
                    ))}
                </div>
              )}
              {tab.kind === "custom" && (
                <section className="custom-project-tab">
                  <div className="custom-tab-icon">
                    <FolderKanban />
                  </div>
                  <h3>{tab.title}</h3>
                  <p>
                    نمای سفارشی این پروژه برای دسترسی سریع به وظایف و اطلاعات
                    مرتبط.
                  </p>
                  <div className="custom-task-list">
                    {list.slice(0, 5).map((t) => (
                      <div key={t.id}>
                        <span className={`custom-status status-${t.status}`} />
                        <strong>{t.title}</strong>
                        <small>{t.assignee}</small>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function TasksV2({
  tasks,
  onAdd,
  onMove,
  onEdit,
  onDelete,
  dragged,
  setDragged,
}: {
  tasks: Task[];
  onAdd: () => void;
  onMove: (id: number, s: TaskStatus) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  dragged: number | null;
  setDragged: (id: number | null) => void;
}) {
  const standard = columns;
  const inColumn = (task: Task, id: TaskStatus) =>
    task.status === id ||
    (id === "doing" && ["stage3", "stage4", "stage5"].includes(task.status));
  return (
    <>
      <PageTitle title="وظایف" subtitle="وظایف محول‌شده به اعضای تیم">
        <Button onClick={onAdd}>
          <Plus size={17} /> افزودن وظیفه
        </Button>
      </PageTitle>
      <div className="kanban board-page">
        {standard.map((col) => (
          <section
            className="kanban-column"
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragged) onMove(dragged, col.id);
              setDragged(null);
            }}
          >
            <header>
              <span>
                <i style={{ background: col.color }} />
                {col.title}
              </span>
              <b>{tasks.filter((t) => inColumn(t, col.id)).length}</b>
            </header>
            <div className="kanban-cards">
              {tasks
                .filter((t) => inColumn(t, col.id))
                .map((t) => (
                  <article
                    className="kanban-card"
                    key={t.id}
                    draggable
                    onDragStart={() => setDragged(t.id)}
                  >
                    <div className="card-grip">
                      <GripVertical size={16} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="icon-button">
                            <MoreVertical size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(t.id)}>
                            <Edit3 /> ویرایش وظیفه
                          </DropdownMenuItem>
                          {t.status !== "done" && (
                            <DropdownMenuItem
                              onClick={() => onMove(t.id, "done")}
                            >
                              <CheckCircle2 /> انتقال به انجام‌شده
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="danger-item"
                            onClick={() => onDelete(t.id)}
                          >
                            <Trash2 /> حذف وظیفه
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3>{t.title}</h3>
                    <p>{t.description}</p>
                    <Badge variant="outline">{t.project}</Badge>
                    <footer>
                      <span className="task-meta">
                        <Avatar className="avatar">
                          <AvatarFallback>
                            {initials(t.assignee)}
                          </AvatarFallback>
                        </Avatar>
                        {t.assignee}
                      </span>
                      <span>{t.due}</span>
                    </footer>
                  </article>
                ))}
            </div>
            <button className="add-card" onClick={onAdd}>
              <Plus size={16} /> افزودن وظیفه
            </button>
          </section>
        ))}
      </div>
    </>
  );
}

function ProjectSettingsV3({
  open,
  close,
  project,
  clients,
  members,
  save,
}: {
  open: boolean;
  close: () => void;
  project: Project | null;
  clients: Client[];
  members: Member[];
  save: (p: Project) => void;
}) {
  const palette = ["#90a4ae", "#42a5f5", "#8b6ee8", "#f2a93b", "#26a69a"];
  const [picked, setPicked] = useState<number[]>([]),
    [tabs, setTabs] = useState<ProjectTab[]>(defaultProjectTabs),
    [workflow, setWorkflow] = useState<WorkflowColumn[]>(
      defaultWorkflowColumns,
    ),
    [newTab, setNewTab] = useState(""),[logo,setLogo]=useState<Attachment|undefined>();
  useEffect(() => {
    setPicked(project?.memberIds || []);
    setTabs(project?.tabs?.length ? project.tabs : defaultProjectTabs);
    setWorkflow(
      project?.workflowColumns?.length
        ? project.workflowColumns
        : defaultWorkflowColumns,
    );
    setLogo(project?.logo);
  }, [project]);
  if (!project) return null;
  const labels = { ...defaultBoardLabels, ...project.boardLabels };
  const renameTab = (id: string, title: string) =>
    setTabs((v) => v.map((t) => (t.id === id ? { ...t, title } : t)));
  const addWorkflow = () => {
    if (workflow.length >= 5) {
      toast.error("حداکثر ۵ ستون می‌توانید بسازید");
      return;
    }
    const id = (["stage3", "stage4", "stage5"] as WorkflowColumn["id"][]).find(
      (x) => !workflow.some((c) => c.id === x),
    );
    if (id)
      setWorkflow((v) => [
        ...v,
        {
          id,
          title: `مرحله ${faDigits(String(v.length + 1))}`,
          color: palette[v.length],
        },
      ]);
  };
  const uploadLogo=async(file:File)=>{const body=new FormData();body.append("file",file);const response=await fetch("/api/files",{method:"POST",body});if(!response.ok){toast.error("بارگذاری لوگو انجام نشد");return}setLogo(await response.json());toast.success("لوگوی پروژه تغییر کرد")};
  return (
    <Modal
      open={open}
      close={close}
      title="تنظیمات پروژه"
      description="ستون‌های کانبان، تب‌ها و اعضای همین پروژه را شخصی‌سازی کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          ...project,
          title: d.title,
          client: d.client || null,
          service: d.service,
          manager: d.manager,
          memberIds: picked,
          tabs,
          workflowColumns: workflow,
          logo,
          boardLabels: {
            ...project.boardLabels,
            done: d.done,
            cancelled: d.cancelled,
          },
        });
      }}
    >
      <div className="form-grid">
        <label className="project-logo-upload wide"><span className="project-logo-preview">{logo?<img src={logo.url} alt="لوگوی پروژه"/>:<FolderKanban/>}</span><span><strong>لوگوی پروژه</strong><small>برای جایگزینی لوگو، تصویر جدید انتخاب کنید.</small></span><Button type="button" variant="outline">تغییر لوگو</Button><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>e.target.files?.[0]&&uploadLogo(e.target.files[0])}/></label>
        <Field label="عنوان پروژه" name="title" defaultValue={project.title} />
        <Field label="مشتری" name="client">
          <select name="client" defaultValue={project.client || ""}>
            <option value="">پروژه آزاد</option>
            {clients.map((c) => (
              <option key={c.id}>{c.company}</option>
            ))}
          </select>
        </Field>
        <Field label="خدمت" name="service" defaultValue={project.service} />
        <Field label="مدیر پروژه" name="manager">
          <select name="manager" defaultValue={project.manager}>
            {members.map((m) => (
              <option key={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <section className="project-settings-section workflow-editor">
        <div className="section-title-row">
          <div>
            <h3>ستون‌های کانبان پروژه</h3>
            <p>بین ۱ تا ۵ ستون بسازید و عنوان هر مرحله را تغییر دهید.</p>
          </div>
          <Badge variant="outline">
            {faDigits(String(workflow.length))} از ۵ ستون
          </Badge>
        </div>
        <div className="workflow-editor-list">
          {workflow.map((column, index) => (
            <div className="workflow-editor-row" key={column.id}>
              <input
                className="workflow-color-input"
                type="color"
                value={column.color}
                onChange={(e) =>
                  setWorkflow((v) =>
                    v.map((c) =>
                      c.id === column.id ? { ...c, color: e.target.value } : c,
                    ),
                  )
                }
              />
              <GripVertical />
              <Input
                value={column.title}
                onChange={(e) =>
                  setWorkflow((v) =>
                    v.map((c) =>
                      c.id === column.id ? { ...c, title: e.target.value } : c,
                    ),
                  )
                }
              />
              <small>ستون {faDigits(String(index + 1))}</small>
              {workflow.length > 1 && (
                <button
                  type="button"
                  className="remove-tab"
                  onClick={() =>
                    setWorkflow((v) => v.filter((c) => c.id !== column.id))
                  }
                  aria-label="حذف ستون"
                >
                  <Trash2 />
                </button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addWorkflow}
          disabled={workflow.length >= 5}
        >
          <Plus /> افزودن ستون جدید
        </Button>
      </section>
      <section className="project-settings-section">
        <div className="section-title-row">
          <div>
            <h3>تب‌های بالای پروژه</h3>
            <p>نام تب‌های اصلی را تغییر دهید یا تب تازه بسازید.</p>
          </div>
        </div>
        <div className="tab-editor-list">
          {tabs.map((tab) => (
            <div className="tab-editor-row" key={tab.id}>
              <span>
                {tab.kind === "custom" ? <Plus /> : <LayoutDashboard />}
              </span>
              <Input
                value={tab.title}
                onChange={(e) => renameTab(tab.id, e.target.value)}
                aria-label="عنوان تب"
              />
              {tab.kind === "custom" && (
                <button
                  type="button"
                  className="remove-tab"
                  onClick={() =>
                    setTabs((v) => v.filter((t) => t.id !== tab.id))
                  }
                >
                  <Trash2 />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="add-tab-row">
          <Input
            value={newTab}
            onChange={(e) => setNewTab(e.target.value)}
            placeholder="مثلاً فایل‌ها یا گزارش هفتگی"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const title = newTab.trim();
              if (!title) return;
              setTabs((v) => [
                ...v,
                { id: `custom-${Date.now()}`, title, kind: "custom" },
              ]);
              setNewTab("");
            }}
          >
            <Plus /> افزودن تب
          </Button>
        </div>
      </section>
      <section className="project-settings-section">
        <h3>عنوان وضعیت‌های بایگانی</h3>
        <div className="form-grid">
          <Field label="تکمیل‌شده‌ها" name="done" defaultValue={labels.done} />
          <Field
            label="لغوشده‌ها"
            name="cancelled"
            defaultValue={labels.cancelled}
          />
        </div>
      </section>
      <section className="project-settings-section">
        <h3>اعضای پروژه</h3>
        <MemberPicker members={members} value={picked} onChange={setPicked} />
      </section>
    </Modal>
  );
}

function ProjectPanelV3({
  project,
  tasks,
  members,
  close,
  onSettings,
  onAddTask,
  onMove,
  onToggleSubtask,
  onUpdateTask,
  onUpdateProject,
}: {
  project: Project | null;
  tasks: Task[];
  members: Member[];
  close: () => void;
  onSettings: () => void;
  onAddTask: () => void;
  onMove: (id: number, s: TaskStatus) => void;
  onToggleSubtask:(taskId:number,subtaskId:number)=>void;
  onUpdateTask:(task:Task)=>void;
  onUpdateProject:(project:Project)=>void;
}) {
  const [draggedTask, setDraggedTask] = useState<number | null>(null),[detailTask,setDetailTask]=useState<number|null>(null),
    [archiveMonth, setArchiveMonth] = useState("۱۴۰۵/۰۶");
  if (!project) return null;
  const list = tasks.filter((t) => t.project === project.title),
    labels = { ...defaultBoardLabels, ...project.boardLabels },
    tabs = project.tabs?.length ? project.tabs : defaultProjectTabs,
    workflow = project.workflowColumns?.length
      ? project.workflowColumns
      : defaultWorkflowColumns;
  const activeIds = workflow.map((c) => c.id),
    allArchived = list.filter((t) => ["done", "cancelled"].includes(t.status)),
    archiveKey = (t: Task) => {
      const value = t.archivedAt || t.endDate || t.due;
      return /^.{4}\/.{2}/.test(value) ? value.slice(0, 7) : "۱۴۰۵/۰۶";
    },
    archiveMonths = Array.from(new Set(allArchived.map(archiveKey)))
      .sort()
      .reverse();
  const tasksIn = (id: WorkflowColumn["id"]) =>
    list.filter(
      (t) =>
        t.status === id ||
        (id === workflow[0].id &&
          !activeIds.includes(t.status as WorkflowColumn["id"]) &&
          !["done", "cancelled"].includes(t.status)),
    );
  const archived = (status: "done" | "cancelled") =>
    allArchived.filter(
      (t) => t.status === status && archiveKey(t) === archiveMonth,
    );
  const uploadProjectFile=async(file:File)=>{const body=new FormData();body.append("file",file);const response=await fetch("/api/files",{method:"POST",body});if(!response.ok){toast.error("بارگذاری فایل انجام نشد");return}const attachment=await response.json() as Attachment;onUpdateProject({...project,files:[attachment,...(project.files||[])]});toast.success("فایل به پروژه اضافه شد")};
  return (
    <Dialog open={Boolean(project)} onOpenChange={(v) => !v && close()}>
      <DialogContent
        className="project-dialog project-dialog-v3"
        showCloseButton={false}
      >
        <div className="project-dialog-head">
          <button className="icon-button" onClick={close}>
            <X />
          </button>
          <div className="project-avatar" style={{ background: project.color }}>
            {project.logo?<img src={project.logo.url} alt={`لوگوی ${project.title}`}/>:project.title[0]}
          </div>
          <div>
            <h2>{project.title}</h2>
            <span>
              {project.client || "پروژه آزاد"} ·{" "}
              {
                list.filter((t) => !["done", "cancelled"].includes(t.status))
                  .length
              }{" "}
              کار باز
            </span>
          </div>
          <Button
            variant="outline"
            className="project-settings"
            onClick={onSettings}
          >
            <Settings /> تنظیمات پروژه
          </Button>
          <Button onClick={onAddTask}>
            <Plus /> افزودن وظیفه
          </Button>
        </div>
        <Tabs defaultValue={tabs[0]?.id || "board"} className="project-tabs">
          <TabsList variant="line" className="project-top-tabs">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.title}
              </TabsTrigger>
            ))}
            <TabsTrigger value="project-files"><HardDrive/> فایل‌های پروژه</TabsTrigger>
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.kind === "board" && (
                <div
                  className={`kanban workflow-board columns-${workflow.length}`}
                >
                  {workflow.map((column) => (
                    <section
                      className="kanban-column"
                      key={column.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedTask) onMove(draggedTask, column.id);
                        setDraggedTask(null);
                      }}
                    >
                      <header>
                        <span>
                          <i style={{ background: column.color }} />
                          {column.title}
                        </span>
                        <b>{tasksIn(column.id).length}</b>
                      </header>
                      <div className="kanban-cards">
                        {tasksIn(column.id).map((t) => (
                          <article
                            draggable
                            onDragStart={() => setDraggedTask(t.id)}
                            className="kanban-card project-task-card"
                            key={t.id}
                          >
                            <button
                              className="task-checkbox"
                              onClick={() => onMove(t.id, "done")}
                              aria-label="تکمیل وظیفه"
                            />
                            <div>
                              <button className="task-detail-link" onClick={()=>setDetailTask(t.id)}><h3>{t.title}</h3></button>
                              <p>
                                {t.assignee} · {t.due}
                              </p>
                              {t.subtasks?.length ? <div className="project-subtasks" onPointerDown={e=>e.stopPropagation()} onDragStart={e=>e.stopPropagation()}>{t.subtasks.map(s=><button type="button" draggable={false} key={s.id} className={s.done?"done":""} onClick={e=>{e.preventDefault();e.stopPropagation();onToggleSubtask(t.id,s.id)}}><span>{s.done&&<Check/>}</span><em>{s.title}</em></button>)}</div>:null}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="task-more">
                                  <MoreVertical />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                  onClick={() => onMove(t.id, "done")}
                                >
                                  <CheckCircle2 /> تکمیل وظیفه
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="danger-item"
                                  onClick={() => onMove(t.id, "cancelled")}
                                >
                                  <X /> لغو وظیفه
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
              {tab.kind === "summary" && (
                <div className="project-status-summary">
                  <div className="summary-strip">
                    <article>
                      <strong>{list.length}</strong>
                      <span>کل وظایف</span>
                    </article>
                    <article>
                      <strong>{archived("done").length}</strong>
                      <span>{labels.done}</span>
                    </article>
                    <article>
                      <strong>{archived("cancelled").length}</strong>
                      <span>{labels.cancelled}</span>
                    </article>
                    <article>
                      <strong>
                        {
                          list.filter(
                            (t) => !["done", "cancelled"].includes(t.status),
                          ).length
                        }
                      </strong>
                      <span>در جریان</span>
                    </article>
                  </div>
                  <ArchiveMonthPicker
                    months={archiveMonths.length ? archiveMonths : ["۱۴۰۵/۰۶"]}
                    value={archiveMonth}
                    onChange={setArchiveMonth}
                  />
                  <div className="archive-columns">
                    {(["done", "cancelled"] as const).map((status) => (
                      <section
                        key={status}
                        className={`archive-column archive-${status}`}
                      >
                        <header>
                          <div>
                            <i />
                            <strong>{labels[status]}</strong>
                          </div>
                          <Badge variant="outline">
                            {archived(status).length}
                          </Badge>
                        </header>
                        {archived(status).map((t) => (
                          <article key={t.id}>
                            <button
                              className={`task-checkbox ${status === "done" ? "checked" : "cancelled"}`}
                              onClick={() => onMove(t.id, workflow[0].id)}
                            >
                              {status === "done" ? <Check /> : <X />}
                            </button>
                            <span onClick={()=>setDetailTask(t.id)} className="archive-task-copy">
                              <strong>{t.title}</strong>
                              <small>
                                {t.assignee} · {t.due}
                              </small>
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onMove(t.id, workflow[0].id)}
                            >
                              بازگردانی
                            </Button>
                          </article>
                        ))}
                      </section>
                    ))}
                  </div>
                </div>
              )}
              {tab.kind === "members" && (
                <div className="project-member-list">
                  {members
                    .filter((m) => (project.memberIds || []).includes(m.id))
                    .map((m) => (
                      <div key={m.id}>
                        <Avatar>
                          <AvatarFallback>{initials(m.name)}</AvatarFallback>
                        </Avatar>
                        <span>
                          <strong>{m.name}</strong>
                          <small>{m.role}</small>
                        </span>
                      </div>
                    ))}
                </div>
              )}
              {tab.kind === "custom" && (
                <section className="custom-project-tab">
                  <div className="custom-tab-icon">
                    <FolderKanban />
                  </div>
                  <h3>{tab.title}</h3>
                  <p>نمای سفارشی این پروژه برای دسترسی سریع به وظایف مرتبط.</p>
                  <div className="custom-task-list">
                    {list.slice(0, 5).map((t) => (
                      <div key={t.id}>
                        <span className={`custom-status status-${t.status}`} />
                        <strong>{t.title}</strong>
                        <small>{t.assignee}</small>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </TabsContent>
          ))}
          <TabsContent value="project-files"><section className="project-file-center"><header><div><h3>مرکز فایل پروژه</h3><p>گزارش‌ها، تصاویر، قراردادها و فایل‌های تحویلی این پروژه</p></div><label><Plus/> افزودن فایل<input type="file" onChange={e=>e.target.files?.[0]&&uploadProjectFile(e.target.files[0])}/></label></header><div className="project-files-grid">{(project.files||[]).map((file,index)=><a key={`${file.name}-${index}`} href={file.url} target="_blank" rel="noreferrer"><span>{file.type.startsWith("image/")?<img src={file.url} alt=""/>:<FileText/>}</span><strong>{file.name}</strong><small>{file.type.startsWith("image/")?"تصویر":"فایل پروژه"}</small><Download/></a>)}{!project.files?.length&&<div className="file-empty"><HardDrive/><strong>هنوز فایلی ثبت نشده</strong><span>اولین فایل پروژه را بارگذاری کنید.</span></div>}</div></section></TabsContent>
        </Tabs>
        <TaskDetailsModal task={tasks.find(t=>t.id===detailTask)} open={detailTask!==null} close={()=>setDetailTask(null)} save={onUpdateTask}/>
      </DialogContent>
    </Dialog>
  );
}

function TaskDetailsModal({task,open,close,save}:{task?:Task;open:boolean;close:()=>void;save:(task:Task)=>void}){
 const [comment,setComment]=useState(""); if(!task)return null;
 const upload=async(file:File)=>{const body=new FormData();body.append("file",file);const response=await fetch("/api/files",{method:"POST",body});if(!response.ok){toast.error("فایل ارسال نشد");return}const attachment=await response.json() as Attachment;save({...task,comments:[...(task.comments||[]),{id:Date.now(),author:"بهراد یزدان‌پناه",text:"فایل پیوست شد",time:`امروز، ${now()}`,attachment}]})};
 const submit=()=>{if(!comment.trim())return;save({...task,comments:[...(task.comments||[]),{id:Date.now(),author:"بهراد یزدان‌پناه",text:comment.trim(),time:`امروز، ${now()}`}]});setComment("")};
 return <Dialog open={open} onOpenChange={v=>!v&&close()}><DialogContent className="task-detail-dialog"><DialogHeader><DialogTitle>{task.title}</DialogTitle><DialogDescription>{task.project} · {task.assignee}</DialogDescription></DialogHeader><div className="task-detail-summary"><span><small>وضعیت</small><strong>{defaultBoardLabels[task.status]}</strong></span><span><small>شروع</small><strong>{task.startDate||"—"}</strong></span><span><small>مهلت پایان</small><strong>{task.endDate||task.due||"—"}</strong></span><span><small>برچسب</small><strong>{task.label}</strong></span></div><section className="task-description-box"><h3>توضیحات وظیفه</h3><p>{task.description||"برای این وظیفه توضیحی ثبت نشده است."}</p></section>{task.subtasks?.length?<section className="detail-subtasks"><h3>مراحل انجام</h3>{task.subtasks.map(s=><div className={s.done?"done":""} key={s.id}><span>{s.done&&<Check/>}</span>{s.title}</div>)}</section>:null}<section className="task-comments"><h3>دیدگاه‌ها و فعالیت‌ها</h3><div>{(task.comments||[]).map(c=><article key={c.id}><Avatar><AvatarFallback>{initials(c.author)}</AvatarFallback></Avatar><span><strong>{c.author}<small>{c.time}</small></strong><p>{c.text}</p>{c.attachment&&<a href={c.attachment.url} target="_blank" rel="noreferrer"><Paperclip/>{c.attachment.name}</a>}</span></article>)}{!task.comments?.length&&<p className="no-comments">هنوز دیدگاهی ثبت نشده است.</p>}</div><footer><Input value={comment} onChange={e=>setComment(e.target.value)} placeholder="دیدگاه یا گزارش انجام کار را بنویسید..."/><label><Paperclip/><input type="file" onChange={e=>e.target.files?.[0]&&upload(e.target.files[0])}/></label><Button type="button" onClick={submit}><Send/></Button></footer></section></DialogContent></Dialog>
}

function DashboardV2({
  data,
  totals,
  setView,
  onToggle,
  onPersonalToggle,
}: {
  data: Workspace;
  totals: { income: number; expense: number; receivable: number };
  setView: (v: View) => void;
  onToggle: (id: number) => void;
  onPersonalToggle:(id:number)=>void;
}) {
  const openTasks = data.tasks
      .filter((t) => !["done", "cancelled"].includes(t.status))
      .slice(0, 4),personalToday=data.personalTasks.filter(t=>t.status==="active"&&t.date==="۱۴۰۵/۰۶/۱۷").slice(0,3),
    balance = totals.income - totals.expense,
    max = Math.max(totals.income, totals.expense, totals.receivable, 1);
  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span>دوشنبه، ۱۷ شهریور</span>
          <h1>سلام بهراد، روز بخیر 👋</h1>
          <p>
            امروز {faDigits(String(openTasks.length))} کار مهم برای پیگیری داری.
          </p>
        </div>
        <Button onClick={() => setView("tasks")}>
          <Plus /> وظیفه جدید
        </Button>
      </div>
      <section className="dashboard-kpis">
        <article className="kpi-v2 purple">
          <div className="kpi-icon">
            <FolderKanban />
          </div>
          <span>
            <small>پروژه‌های فعال</small>
            <strong>{faDigits(String(data.projects.length))}</strong>
            <em>در حال اجرا</em>
          </span>
        </article>
        <article className="kpi-v2 blue">
          <div className="kpi-icon">
            <ListChecks />
          </div>
          <span>
            <small>کارهای باز</small>
            <strong>
              {faDigits(
                String(
                  data.tasks.filter(
                    (t) => !["done", "cancelled"].includes(t.status),
                  ).length,
                ),
              )}
            </strong>
            <em>در تمام پروژه‌ها</em>
          </span>
        </article>
        <article className="kpi-v2 amber">
          <div className="kpi-icon">
            <Clock3 />
          </div>
          <span>
            <small>در انتظار پیگیری</small>
            <strong>{faDigits(String(data.leads.length))}</strong>
            <em>فرصت فروش فعال</em>
          </span>
        </article>
        <article className="kpi-v2 coral">
          <div className="kpi-icon">
            <CircleDollarSign />
          </div>
          <span>
            <small>مطالبات</small>
            <strong>{money(totals.receivable)}</strong>
            <em>ثبت‌شده این ماه</em>
          </span>
        </article>
      </section>
      <section className="dashboard-main-grid">
        <div className="panel today-panel">
          <div className="panel-head">
            <div>
              <h2>کارهای امروز</h2>
              <span>اولویت‌های مهم تیم</span>
            </div>
            <Button variant="ghost" onClick={() => setView("tasks")}>
              مشاهده همه <ArrowLeft />
            </Button>
          </div>
          <div className="today-list">
            {openTasks.map((t) => (
              <article key={t.id}>
                <button
                  className="today-check"
                  onClick={() => onToggle(t.id)}
                  aria-label="تکمیل وظیفه"
                />
                <div>
                  <strong>{t.title}</strong>
                  <small>
                    {t.project} · {t.assignee}
                  </small>
                </div>
                <Badge variant="outline">{t.label}</Badge>
                <time>{t.due}</time>
              </article>
            ))}
            {personalToday.map(t=><article key={`personal-${t.id}`} className="today-personal"><button className="today-check" onClick={()=>onPersonalToggle(t.id)} aria-label="تکمیل تسک شخصی"/><div><strong>{t.title}</strong><small><LockKeyhole/> تسک شخصی · {t.repeat}</small></div><Badge variant="outline">شخصی</Badge><time>{t.date}</time></article>)}
            {!openTasks.length&&!personalToday.length && (
              <div className="empty-state">
                کار بازی برای امروز باقی نمانده است.
              </div>
            )}
          </div>
        </div>
        <div className="panel finance-dashboard-card">
          <header>
            <div>
              <h2>خلاصه مالی</h2>
              <span>شهریور ۱۴۰۵</span>
            </div>
            <button onClick={() => setView("finance")}>
              گزارش کامل <ArrowLeft />
            </button>
          </header>
          <div className="balance-box">
            <span>مانده خالص</span>
            <strong>{money(balance)}</strong>
            <small className={balance >= 0 ? "positive" : "negative"}>
              {balance >= 0 ? <TrendingUp /> : <TrendingDown />} وضعیت نقدینگی
              این ماه
            </small>
          </div>
          <div className="finance-bars">
            {[
              ["درآمد", totals.income, "income"],
              ["هزینه", totals.expense, "expense"],
              ["مطالبات", totals.receivable, "receivable"],
            ].map(([label, value, kind]) => (
              <div key={String(label)}>
                <span>
                  <b>{label}</b>
                  <em>{money(value as number)}</em>
                </span>
                <i>
                  <u
                    className={String(kind)}
                    style={{
                      width: `${Math.max(8, ((value as number) / max) * 100)}%`,
                    }}
                  />
                </i>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function LeadsV2({
  leads,
  labels,
  onAdd,
  onConvert,
}: {
  leads: Lead[];
  labels: string[];
  onAdd: () => void;
  onConvert: (l: Lead) => void;
}) {
  const statusCount = (s: Lead["status"]) =>
    leads.filter((l) => l.status === s).length;
  return (
    <>
      <PageTitle
        title="لیدها"
        subtitle={`${faDigits(String(leads.length))} فرصت فروش فعال`}
      >
        <Button onClick={onAdd}>
          <Plus /> افزودن لید
        </Button>
      </PageTitle>
      <section className="lead-kpis-v2">
        <article>
          <span className="lead-kpi-dot negotiation" />
          <div>
            <small>در حال مذاکره</small>
            <strong>{faDigits(String(statusCount("در حال مذاکره")))}</strong>
          </div>
        </article>
        <article>
          <span className="lead-kpi-dot contract" />
          <div>
            <small>منتظر قرارداد</small>
            <strong>{faDigits(String(statusCount("منتظر قرارداد")))}</strong>
          </div>
        </article>
        <article>
          <span className="lead-kpi-dot follow" />
          <div>
            <small>پیگیری مجدد</small>
            <strong>{faDigits(String(statusCount("پیگیری مجدد")))}</strong>
          </div>
        </article>
      </section>
      <section className="lead-grid-v2">
        {leads.map((l) => (
          <article className="lead-card-v2" key={l.id}>
            <header>
              <Avatar className="lead-avatar">
                <AvatarFallback>{initials(l.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3>{l.name}</h3>
                <span>{l.company}</span>
              </div>
              <Badge
                className={`lead-stage lead-${l.status.replaceAll(" ", "-")}`}
              >
                {l.status}
              </Badge>
            </header>
            <div className="lead-info-v2">
              <a href={`tel:${l.phone.replace(/\s/g, "")}`}>
                <span>شماره تماس</span>
                <strong className="phone-number">{faDigits(l.phone)}</strong>
              </a>
              <div>
                <span>خدمت موردنظر</span>
                <strong>{l.service}</strong>
              </div>
            </div>
            <div className="lead-labels">
              {labels.slice(0, 3).map((x) => (
                <Badge
                  key={x}
                  variant="outline"
                  className={x === l.service ? "active" : ""}
                >
                  {x}
                </Badge>
              ))}
            </div>
            <footer>
              <Button variant="outline" size="sm">
                <MessageCircle /> پیام
              </Button>
              <Button size="sm" onClick={() => onConvert(l)}>
                <UserRoundCheck /> تبدیل به مشتری
              </Button>
            </footer>
          </article>
        ))}
      </section>
    </>
  );
}

function SettingsV2({
  fontScale,
  setFontScale,
  theme,
  setTheme,
  labels,
  onSave,
}: {
  fontScale: number;
  setFontScale: (n: number) => void;
  theme: string;
  setTheme: (s: string) => void;
  labels: LabelSettings;
  onSave: (labels: LabelSettings) => void;
}) {
  const [draft, setDraft] = useState<LabelSettings>(labels),
    [inputs, setInputs] = useState<LabelSettings>({
      tasks: [],
      clients: [],
      leads: [],
    });
  useEffect(() => setDraft(labels), [labels]);
  const add = (section: keyof LabelSettings) => {
    const value = (inputs[section][0] || "").trim();
    if (!value || draft[section].includes(value)) return;
    setDraft((d) => ({ ...d, [section]: [...d[section], value] }));
    setInputs((i) => ({ ...i, [section]: [] }));
  };
  const meta: {
    key: keyof LabelSettings;
    title: string;
    hint: string;
    icon: typeof ListChecks;
  }[] = [
    {
      key: "tasks",
      title: "برچسب‌های تسک‌ها",
      hint: "برای دسته‌بندی وظایف",
      icon: ListChecks,
    },
    {
      key: "clients",
      title: "برچسب‌های مشتریان",
      hint: "خدمات فعال مشتری",
      icon: UserRoundCheck,
    },
    {
      key: "leads",
      title: "برچسب‌های لیدها",
      hint: "خدمت موردنظر سرنخ فروش",
      icon: TrendingUp,
    },
  ];
  return (
    <>
      <PageTitle title="تنظیمات میزکار" subtitle="ظاهر و اطلاعات پایه سیستم">
        <Button onClick={() => onSave(draft)}>
          <Check /> ذخیره تنظیمات
        </Button>
      </PageTitle>
      <div className="settings-grid">
        <section className="panel setting-card">
          <div className="setting-icon">
            <Settings />
          </div>
          <div>
            <h2>اندازه نوشته‌ها</h2>
            <p>اندازه متن تمام بخش‌های پنل را انتخاب کنید.</p>
          </div>
          <div className="font-options">
            {[
              [0.94, "کوچک"],
              [1, "استاندارد"],
              [1.1, "درشت"],
              [1.18, "خیلی درشت"],
            ].map(([v, l]) => (
              <button
                key={String(v)}
                className={fontScale === v ? "active" : ""}
                onClick={() => setFontScale(v as number)}
              >
                {l}
              </button>
            ))}
          </div>
        </section>
        <section className="panel setting-card">
          <div className="setting-icon">
            <SlidersHorizontal />
          </div>
          <div>
            <h2>رنگ‌بندی پنل</h2>
            <p>تم دلخواه میزکار را انتخاب کنید.</p>
          </div>
          <div className="theme-options">
            {[
              ["violet", "آبی سازمانی", "#012BF9"],
              ["blue", "آبی روشن", "#3156ff"],
              ["teal", "سبزآبی", "#168b85"],
              ["dark", "تیره", "#232638"],
            ].map(([v, l, c]) => (
              <button
                key={v}
                className={theme === v ? "active" : ""}
                onClick={() => setTheme(v)}
              >
                <i style={{ background: c }} />
                {l}
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="labels-settings">
        <div className="labels-settings-head">
          <div>
            <h2>مدیریت برچسب‌ها</h2>
            <p>
              برچسب‌های هر بخش را اینجا بسازید؛ همان گزینه‌ها در فرم‌های ثبت
              استفاده می‌شوند.
            </p>
          </div>
          <Badge variant="outline">تنظیمات سراسری</Badge>
        </div>
        <div className="label-manager-grid">
          {meta.map((item) => (
            <article className="panel label-manager" key={item.key}>
              <header>
                <span>
                  <item.icon />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.hint}</p>
                </div>
              </header>
              <div className="editable-tags">
                {draft[item.key].map((tag) => (
                  <span key={tag}>
                    {tag}
                    <button
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          [item.key]: d[item.key].filter((x) => x !== tag),
                        }))
                      }
                    >
                      <X />
                    </button>
                  </span>
                ))}
              </div>
              <div className="tag-add">
                <Input
                  value={inputs[item.key][0] || ""}
                  onChange={(e) =>
                    setInputs((i) => ({ ...i, [item.key]: [e.target.value] }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      add(item.key);
                    }
                  }}
                  placeholder="عنوان برچسب جدید"
                />
                <Button variant="outline" onClick={() => add(item.key)}>
                  <Plus /> افزودن
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="settings-save-bar">
        <span>تغییرات ظاهر و برچسب‌ها را ذخیره کنید.</span>
        <Button onClick={() => onSave(draft)}>
          <Check /> ذخیره تغییرات
        </Button>
      </div>
    </>
  );
}

function TaskDialogV2({
  open,
  close,
  task,
  projects,
  members,
  save,
  defaultProject,
  labels,
}: {
  open: boolean;
  close: () => void;
  task?: Task;
  projects: Project[];
  members: Member[];
  save: (t: Task) => void;
  defaultProject?: string;
  labels: string[];
}) {
  return (
    <Modal
      open={open}
      close={close}
      title={task ? "ویرایش وظیفه" : "افزودن وظیفه"}
      description="وظیفه را به پروژه و مسئول انجام محول کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e),
          status = d.status as TaskStatus;
        save({
          id: task?.id || Date.now(),
          title: d.title,
          description: d.description,
          project: d.project,
          assignee: d.assignee,
          due: d.due,
          label: d.label,
          status,
          progress: status === "done" ? 100 : Number(d.progress || 0),
        });
      }}
    >
      <div className="form-grid">
        <Field
          label="عنوان وظیفه"
          name="title"
          defaultValue={task?.title}
          wide
          required
        />
        <Field label="پروژه" name="project">
          <select name="project" defaultValue={task?.project || defaultProject}>
            {projects.map((p) => (
              <option key={p.id}>{p.title}</option>
            ))}
          </select>
        </Field>
        <Field label="مسئول انجام" name="assignee">
          <select name="assignee" defaultValue={task?.assignee}>
            {members
              .filter((m) => m.status === "فعال")
              .map((m) => (
                <option key={m.id}>{m.name}</option>
              ))}
          </select>
        </Field>
        <Field
          label="مهلت انجام"
          name="due"
          defaultValue={task?.due || "۲۵ شهریور"}
        />
        <Field label="برچسب" name="label">
          <select name="label" defaultValue={task?.label || labels[0]}>
            {labels.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="وضعیت" name="status">
          <select name="status" defaultValue={task?.status || "backlog"}>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="درصد پیشرفت"
          name="progress"
          type="number"
          defaultValue={String(task?.progress || 0)}
        />
        <label className="wide">
          توضیحات
          <Textarea name="description" defaultValue={task?.description} />
        </label>
      </div>
    </Modal>
  );
}
function ClientDialogV2({
  open,
  close,
  save,
  labels,
}: {
  open: boolean;
  close: () => void;
  save: (c: Client) => void;
  labels: string[];
}) {
  return (
    <Modal
      open={open}
      close={close}
      title="ثبت مشتری جدید"
      description="اطلاعات تماس و خدمت مشتری را وارد کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          id: Date.now(),
          name: d.name,
          company: d.company,
          phone: d.phone,
          email: d.email,
          service: d.service,
        });
      }}
    >
      <div className="form-grid">
        <Field label="نام و نام خانوادگی" name="name" required />
        <Field label="نام شرکت" name="company" required />
        <Field label="شماره تلفن" name="phone" required />
        <Field label="ایمیل" name="email" type="email" />
        <Field label="برچسب خدمت" name="service">
          <select name="service">
            {labels.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}
function LeadDialogV2({
  open,
  close,
  save,
  labels,
}: {
  open: boolean;
  close: () => void;
  save: (l: Lead) => void;
  labels: string[];
}) {
  return (
    <Modal
      open={open}
      close={close}
      title="افزودن لید"
      description="اطلاعات سرنخ فروش و مرحله پیگیری را ثبت کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e);
        save({
          id: Date.now(),
          name: d.name,
          company: d.company,
          phone: d.phone,
          email: d.email,
          service: d.service,
          status: d.status as Lead["status"],
        });
      }}
    >
      <div className="form-grid">
        <Field label="نام و نام خانوادگی" name="name" required />
        <Field label="نام شرکت" name="company" required />
        <Field label="شماره تلفن" name="phone" required />
        <Field label="ایمیل" name="email" type="email" />
        <Field label="برچسب خدمت" name="service">
          <select name="service">
            {labels.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="وضعیت" name="status">
          <select name="status">
            <option>در حال مذاکره</option>
            <option>منتظر قرارداد</option>
            <option>پیگیری مجدد</option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}

function MemberDialogV2({
  open,
  close,
  save,
}: {
  open: boolean;
  close: () => void;
  save: (m: Member, password: string) => Promise<boolean>;
}) {
  const [avatar, setAvatar] = useState<Attachment | null>(null),
    [uploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/files", { method: "POST", body });
    if (response.ok) {
      setAvatar(await response.json());
      toast.success("عکس همکار آماده شد");
    } else toast.error("آپلود عکس انجام نشد");
    setUploading(false);
  };
  return (
    <Modal
      open={open}
      close={close}
      title="ثبت همکار جدید"
      description="اطلاعات همکار، نقش و تصویر پروفایل را تعریف کنید."
      submit="ثبت همکار"
      onSubmit={async(e) => {
        e.preventDefault();
        const d = fd(e);
        const saved=await save({
          id: Date.now(),
          name: d.name,
          email: d.email,
          role: d.role,
          status: "فعال",
          permissions: ["وظایف", "پیام‌ها"],
          avatar: avatar || undefined,
        },d.password);
        if(saved)setAvatar(null);
      }}
    >
      <label className="member-avatar-upload">
        <Avatar>
          <AvatarImage src={avatar?.url} />
          <AvatarFallback>
            <UserPlus />
          </AvatarFallback>
        </Avatar>
        <span>
          <strong>
            {uploading ? "در حال آپلود..." : "انتخاب عکس پروفایل"}
          </strong>
          <small>JPG یا PNG، حداکثر ۵ مگابایت</small>
        </span>
        <Button type="button" variant="outline">
          انتخاب تصویر
        </Button>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </label>
      <div className="form-grid">
        <Field label="نام و نام خانوادگی" name="name" required />
        <Field label="ایمیل ورود" name="email" type="email" required />
        <Field label="رمز عبور اولیه" name="password" type="password" required />
        <Field label="نقش سازمانی" name="role">
          <select name="role">
            <option>کارشناس سئو</option>
            <option>توسعه‌دهنده</option>
            <option>طراح</option>
            <option>مدیر پروژه</option>
            <option>حسابدار</option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}
function TeamV2(props: Parameters<typeof TeamPro>[0]) {
  return <TeamPro {...props} />;
}

function PersonalTasksPanel({
  open,
  close,
  tasks,
  save,
}: {
  open: boolean;
  close: () => void;
  tasks: PersonalTask[];
  save: (tasks: PersonalTask[]) => void;
}) {
  const [title, setTitle] = useState(""),
    [date, setDate] = useState("۱۴۰۵/۰۶/۱۷"),
    [repeat, setRepeat] = useState<PersonalTask["repeat"]>("بدون تکرار");
  const active = tasks.filter((t) => t.status === "active"),
    archived = tasks.filter((t) => t.status !== "active");
  const add = () => {
    if (!title.trim()) return;
    save([
      { id: Date.now(), title: title.trim(), date, repeat, status: "active" },
      ...tasks,
    ]);
    setTitle("");
    toast.success("تسک شخصی ثبت شد");
  };
  const status = (id: number, value: PersonalTask["status"]) =>
    save(tasks.map((t) => (t.id === id ? { ...t, status: value } : t)));
  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="personal-tasks-dialog" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسک‌های شخصی من</DialogTitle>
          <DialogDescription>
            برنامه‌های روزانه و یادآوری‌های خصوصی شما
          </DialogDescription>
        </DialogHeader>
        <div className="personal-add-box">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="مثلاً تماس با مشتری یا بررسی گزارش..."
          />
          <div>
            <label>
              <CalendarDays />
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                inputMode="numeric"
                placeholder="۱۴۰۵/۰۶/۱۷"
              />
            </label>
            <select
              value={repeat}
              onChange={(e) =>
                setRepeat(e.target.value as PersonalTask["repeat"])
              }
            >
              <option>بدون تکرار</option>
              <option>روزانه</option>
              <option>هفتگی</option>
              <option>ماهانه</option>
            </select>
            <Button onClick={add}>
              <Plus /> افزودن
            </Button>
          </div>
        </div>
        <Tabs defaultValue="active" className="personal-tabs">
          <TabsList variant="line">
            <TabsTrigger value="active">
              برنامه‌ها <Badge>{active.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archive">
              آرشیو <Badge variant="outline">{archived.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <div className="personal-task-list">
              {active.map((t) => (
                <article key={t.id}>
                  <button
                    className="personal-check"
                    onClick={() => status(t.id, "done")}
                  />
                  <span>
                    <strong>{t.title}</strong>
                    <small>
                      {t.date} · {t.repeat}
                    </small>
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="icon-button">
                        <MoreVertical />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => status(t.id, "done")}>
                        <Check /> تکمیل شد
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="danger-item"
                        onClick={() => status(t.id, "cancelled")}
                      >
                        <X /> لغو شد
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </article>
              ))}
              {!active.length && (
                <div className="empty-state">برنامه فعالی باقی نمانده است.</div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="archive">
            <div className="personal-task-list archive">
              {archived.map((t) => (
                <article key={t.id}>
                  <span className={`archive-state ${t.status}`}>
                    {t.status === "done" ? <Check /> : <X />}
                  </span>
                  <span>
                    <strong>{t.title}</strong>
                    <small>
                      {t.status === "done" ? "تکمیل‌شده" : "لغوشده"} · {t.date}
                    </small>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => status(t.id, "active")}
                  >
                    بازگردانی
                  </Button>
                </article>
              ))}
              {!archived.length && (
                <div className="empty-state">آرشیو هنوز خالی است.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function FinanceV2({
  rows,
  onAdd,
  onEdit,
  onDelete,
  onStatus,
}: {
  rows: Transaction[];
  totals: { income: number; expense: number; receivable: number };
  onAdd: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatus: (id: number, s: Transaction["status"]) => void;
}) {
  const months = Array.from(new Set(rows.map((r) => r.date.slice(0, 7))))
      .sort()
      .reverse(),
    [month, setMonth] = useState(months[0] || "۱۴۰۵/۰۶");
  const filtered = rows.filter((r) => r.date.startsWith(month));
  const income = filtered
      .filter(
        (r) =>
          r.status === "paid" &&
          (r.type === "income" || r.type === "receivable"),
      )
      .reduce((s, r) => s + r.amount, 0),
    expense = filtered
      .filter((r) => r.status === "paid" && r.type === "expense")
      .reduce((s, r) => s + r.amount, 0),
    receivable = filtered
      .filter(
        (r) =>
          r.status !== "paid" &&
          (r.type === "income" || r.type === "receivable"),
      )
      .reduce((s, r) => s + r.amount, 0),
    balance = income - expense;
  const monthName = (value: string) => {
    const names = [
      "فروردین",
      "اردیبهشت",
      "خرداد",
      "تیر",
      "مرداد",
      "شهریور",
      "مهر",
      "آبان",
      "آذر",
      "دی",
      "بهمن",
      "اسفند",
    ];
    const parts = value.split("/");
    const index =
      Number(
        parts[1]?.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()),
      ) - 1;
    return `${names[index] || value} ${parts[0] || ""}`;
  };
  return (
    <>
      <PageTitle
        title="مدیریت مالی"
        subtitle="گزارش دقیق درآمد، هزینه و مطالبات به تفکیک ماه"
      >
        <Button variant="outline">
          <FileText /> خروجی گزارش
        </Button>
        <Button onClick={onAdd}>
          <Plus /> ثبت سند
        </Button>
      </PageTitle>
      <div className="finance-month-bar">
        <div>
          <CalendarDays />
          <span>
            <small>ماه گزارش</small>
            <strong>{monthName(month)}</strong>
          </span>
        </div>
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthName(m)}
            </option>
          ))}
        </select>
      </div>
      <section className="finance-kpis-v2">
        <article className="income">
          <span>
            <TrendingUp />
          </span>
          <div>
            <small>درآمد ماه</small>
            <strong>{money(income)}</strong>
          </div>
        </article>
        <article className="expense">
          <span>
            <TrendingDown />
          </span>
          <div>
            <small>هزینه ماه</small>
            <strong>{money(expense)}</strong>
          </div>
        </article>
        <article className="receivable">
          <span>
            <WalletCards />
          </span>
          <div>
            <small>مطالبات ماه</small>
            <strong>{money(receivable)}</strong>
          </div>
        </article>
        <article className="balance">
          <span>
            <BarChart3 />
          </span>
          <div>
            <small>مانده خالص</small>
            <strong>{money(balance)}</strong>
          </div>
        </article>
      </section>
      <section className="panel finance-ledger">
        <div className="finance-ledger-head">
          <div>
            <h2>اسناد {monthName(month)}</h2>
            <span>
              {faDigits(String(filtered.length))} سند ثبت‌شده و ذخیره‌شده
            </span>
          </div>
          <Badge variant="outline">گزارش ماهانه</Badge>
        </div>
        <div className="finance-grid-head">
          <span>شرح سند</span>
          <span>پروژه</span>
          <span>نوع</span>
          <span>تاریخ</span>
          <span>مبلغ</span>
          <span>وضعیت</span>
          <span />
        </div>
        {filtered.map((t) => (
          <article className="finance-modern-row" key={t.id}>
            <div className="finance-title">
              <span className={`finance-doc-icon ${t.type}`}>
                {t.type === "income" ? (
                  <TrendingUp />
                ) : t.type === "expense" ? (
                  <TrendingDown />
                ) : (
                  <WalletCards />
                )}
              </span>
              <strong>{t.title}</strong>
            </div>
            <span>{t.project}</span>
            <Badge className={`transaction type-${t.type}`}>
              {t.type === "income"
                ? "درآمد"
                : t.type === "expense"
                  ? "هزینه"
                  : "طلب"}
            </Badge>
            <time>{t.date}</time>
            <strong className={`finance-amount ${t.type}`}>
              {money(t.amount)}
            </strong>
            <select
              className={`status-select pay-${t.status}`}
              value={t.status}
              onChange={(e) =>
                onStatus(t.id, e.target.value as Transaction["status"])
              }
            >
              <option value="paid">پرداخت‌شده</option>
              <option value="pending">در انتظار</option>
              <option value="overdue">سررسید گذشته</option>
            </select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="row-menu">
                  <MoreVertical />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => onEdit(t.id)}>
                  <Edit3 /> ویرایش سند
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="danger-item"
                  onClick={() => onDelete(t.id)}
                >
                  <Trash2 /> حذف سند
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </article>
        ))}
        {!filtered.length && (
          <div className="empty-state">برای این ماه سندی ثبت نشده است.</div>
        )}
      </section>
    </>
  );
}

function TaskDialogV3({
  open,
  close,
  task,
  projects,
  members,
  save,
  defaultProject,
  labels,
}: {
  open: boolean;
  close: () => void;
  task?: Task;
  projects: Project[];
  members: Member[];
  save: (t: Task) => void;
  defaultProject?: string;
  labels: string[];
}) {
  return (
    <Modal
      open={open}
      close={close}
      title={task ? "ویرایش وظیفه" : "افزودن وظیفه"}
      description="بازه زمانی، پروژه و مسئول انجام را مشخص کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e),
          status = d.status as TaskStatus,
          endDate = d.endDate || task?.endDate || "";
        save({
          id: task?.id || Date.now(),
          title: d.title,
          description: d.description,
          project: d.project,
          assignee: d.assignee,
          startDate: d.startDate,
          endDate,
          due: endDate || task?.due || "",
          label: d.label,
          status,
          progress: status === "done" ? 100 : Number(d.progress || 0),
        });
      }}
    >
      <div className="form-grid">
        <Field
          label="عنوان وظیفه"
          name="title"
          defaultValue={task?.title}
          wide
          required
        />
        <Field label="پروژه" name="project">
          <select name="project" defaultValue={task?.project || defaultProject}>
            {projects.map((p) => (
              <option key={p.id}>{p.title}</option>
            ))}
          </select>
        </Field>
        <Field label="مسئول انجام" name="assignee">
          <select name="assignee" defaultValue={task?.assignee}>
            {members
              .filter((m) => m.status === "فعال")
              .map((m) => (
                <option key={m.id}>{m.name}</option>
              ))}
          </select>
        </Field>
        <label>
          تاریخ شروع شمسی
          <div className="persian-date-input">
            <CalendarDays />
            <input
              name="startDate"
              defaultValue={task?.startDate || "۱۴۰۵/۰۶/۱۷"}
              inputMode="numeric"
              placeholder="۱۴۰۵/۰۶/۱۷"
              required
            />
          </div>
        </label>
        <label>
          مهلت پایان شمسی
          <div className="persian-date-input">
            <CalendarDays />
            <input
              name="endDate"
              defaultValue={task?.endDate || task?.due || "۱۴۰۵/۰۶/۲۵"}
              inputMode="numeric"
              placeholder="۱۴۰۵/۰۶/۲۵"
              required
            />
          </div>
        </label>
        <Field label="برچسب" name="label">
          <select name="label" defaultValue={task?.label || labels[0]}>
            {labels.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="وضعیت" name="status">
          <select name="status" defaultValue={task?.status || "backlog"}>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="درصد پیشرفت"
          name="progress"
          type="number"
          defaultValue={String(task?.progress || 0)}
        />
        <label className="wide">
          توضیحات
          <Textarea name="description" defaultValue={task?.description} />
        </label>
      </div>
    </Modal>
  );
}

function TaskDialogV4({
  open,
  close,
  task,
  projects,
  members,
  save,
  defaultProject,
  labels,
}: {
  open: boolean;
  close: () => void;
  task?: Task;
  projects: Project[];
  members: Member[];
  save: (t: Task) => void;
  defaultProject?: string;
  labels: string[];
}) {
  const [multi, setMulti] = useState(false),
    [subtasks, setSubtasks] = useState<Subtask[]>([]),
    [subtaskTitle, setSubtaskTitle] = useState("");
  useEffect(() => {
    setMulti(Boolean(task?.subtasks?.length));
    setSubtasks(task?.subtasks || []);
  }, [task, open]);
  const addSubtask = () => {
    if (!subtaskTitle.trim()) return;
    setSubtasks((v) => [
      ...v,
      { id: Date.now(), title: subtaskTitle.trim(), done: false },
    ]);
    setSubtaskTitle("");
  };
  return (
    <Modal
      open={open}
      close={close}
      title={task ? "ویرایش وظیفه" : "افزودن وظیفه جدید"}
      description="تسک ساده یا چندبخشی را با زمان‌بندی دقیق ثبت کنید."
      onSubmit={(e) => {
        e.preventDefault();
        const d = fd(e),
          status = d.status as TaskStatus,
          endDate = d.endDate || task?.endDate || "";
        save({
          id: task?.id || Date.now(),
          title: d.title,
          description: d.description,
          project: d.project,
          assignee: d.assignee,
          startDate: d.startDate,
          endDate,
          due: endDate || task?.due || "",
          label: d.label,
          status,
          progress: status === "done" ? 100 : 0,
          subtasks: multi ? subtasks : undefined,
        });
      }}
    >
      <div className="task-type-switch">
        <div>
          <span className="task-type-icon">
            <ListChecks />
          </span>
          <span>
            <strong>تسک چندبخشی</strong>
            <small>برای این وظیفه چند زیرتسک تعریف کنید.</small>
          </span>
        </div>
        <Switch checked={multi} onCheckedChange={setMulti} />
      </div>
      <div className="task-primary-title">
        <Field
          label="عنوان وظیفه اصلی"
          name="title"
          defaultValue={task?.title}
          required
        />
      </div>
      {multi && (
        <section className="subtask-builder subtask-builder-top">
          <div><h3>زیرتسک‌ها</h3><Badge variant="outline">{faDigits(String(subtasks.length))} مورد</Badge></div>
          <div className="subtask-add"><Input value={subtaskTitle} onChange={(e)=>setSubtaskTitle(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault();addSubtask()}}} placeholder="زیرتسک بعدی را همین‌جا بنویسید..."/><Button type="button" variant="outline" onClick={addSubtask}><Plus/> افزودن</Button></div>
          <div className="subtask-builder-list">{subtasks.map((s,index)=><article key={s.id}><GripVertical/><span>{faDigits(String(index+1))}</span><Input value={s.title} onChange={(e)=>setSubtasks(v=>v.map(x=>x.id===s.id?{...x,title:e.target.value}:x))}/><button type="button" onClick={()=>setSubtasks(v=>v.filter(x=>x.id!==s.id))}><Trash2/></button></article>)}{!subtasks.length&&<p>زیرتسک اول را وارد کنید؛ مثلاً «تحقیق کلمات کلیدی».</p>}</div>
        </section>
      )}
      <div className="form-grid">
        <Field label="پروژه" name="project">
          <select name="project" defaultValue={task?.project || defaultProject}>
            {projects.map((p) => (
              <option key={p.id}>{p.title}</option>
            ))}
          </select>
        </Field>
        <Field label="مسئول انجام" name="assignee">
          <select name="assignee" defaultValue={task?.assignee}>
            {members
              .filter((m) => m.status === "فعال")
              .map((m) => (
                <option key={m.id}>{m.name}</option>
              ))}
          </select>
        </Field>
        <label>
          تاریخ شروع شمسی
          <div className="persian-date-input">
            <CalendarDays />
            <input
              name="startDate"
              defaultValue={task?.startDate || "۱۴۰۵/۰۶/۱۷"}
              inputMode="numeric"
              placeholder="۱۴۰۵/۰۶/۱۷"
              required
            />
          </div>
        </label>
        <label>
          مهلت پایان شمسی
          <div className="persian-date-input">
            <CalendarDays />
            <input
              name="endDate"
              defaultValue={task?.endDate || task?.due || "۱۴۰۵/۰۶/۲۵"}
              inputMode="numeric"
              placeholder="۱۴۰۵/۰۶/۲۵"
              required
            />
          </div>
        </label>
        <Field label="برچسب" name="label">
          <select name="label" defaultValue={task?.label || labels[0]}>
            {labels.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="وضعیت" name="status">
          <select name="status" defaultValue={task?.status || "backlog"}>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        <label className="wide">
          توضیحات
          <Textarea name="description" defaultValue={task?.description} />
        </label>
      </div>
    </Modal>
  );
}

function TasksTableV3({
  tasks,
  personalTasks,
  onPersonalToggle,
  onToggleSubtask,
  onAdd,
  onMove,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  personalTasks: PersonalTask[];
  onPersonalToggle:(id:number)=>void;
  onToggleSubtask:(taskId:number,subtaskId:number)=>void;
  onAdd: () => void;
  onMove: (id: number, s: TaskStatus) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  dragged: number | null;
  setDragged: (id: number | null) => void;
}) {
  const [person, setPerson] = useState("همه"),
    [statusFilter, setStatusFilter] = useState("active");
  const people = Array.from(new Set(tasks.map((t) => t.assignee))),
    visible = tasks.filter(
      (t) =>
        (person === "همه" || t.assignee === person) &&
        (statusFilter === "all" ||
          (statusFilter === "active"
            ? !["done", "cancelled"].includes(t.status)
            : t.status === statusFilter)),
    );
  const grouped = people
    .map((name) => ({
      name,
      tasks: visible.filter((t) => t.assignee === name),
    }))
    .filter((g) => g.tasks.length);
  const statusName = (s: TaskStatus) => defaultBoardLabels[s] || "در جریان";
  return (
    <>
      <PageTitle
        title="وظایف تیم"
        subtitle="نمای ردیفی وظایف همه اعضا در تمام پروژه‌ها"
      >
        <Button onClick={onAdd}>
          <Plus /> افزودن وظیفه
        </Button>
      </PageTitle>
      <div className="task-table-toolbar">
        <label>
          <Users />
          <select value={person} onChange={(e) => setPerson(e.target.value)}>
            <option>همه</option>
            {people.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          <SlidersHorizontal />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="active">وظایف باز</option>
            <option value="done">تکمیل‌شده</option>
            <option value="cancelled">لغوشده</option>
            <option value="all">همه وضعیت‌ها</option>
          </select>
        </label>
        <div>
          <span>{faDigits(String(visible.length))}</span> وظیفه نمایش داده
          می‌شود
        </div>
      </div>
      <section className="personal-tasks-inbox panel"><header><div className="personal-inbox-icon"><LockKeyhole/></div><div><h2>تسک‌های شخصی من</h2><span>فقط برای شما · برنامه‌های روزانه و یادآوری‌ها</span></div><Badge>{faDigits(String(personalTasks.filter(t=>t.status==="active").length))} شخصی</Badge></header><div className="personal-inbox-list">{personalTasks.filter(t=>t.status==="active").slice(0,5).map(t=><article key={t.id}><button className="personal-check" onClick={()=>onPersonalToggle(t.id)} aria-label="تکمیل تسک شخصی"/><span><strong>{t.title}</strong><small>{t.repeat} · {t.date}</small></span><Badge variant="outline" className="private-task-badge"><LockKeyhole/> شخصی</Badge></article>)}{!personalTasks.some(t=>t.status==="active")&&<p>تسک شخصی فعالی ندارید.</p>}</div></section>
      <div className="assignee-task-groups">
        {grouped.map((group) => (
          <section className="panel assignee-task-group" key={group.name}>
            <header>
              <Avatar>
                <AvatarFallback>{initials(group.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2>{group.name}</h2>
                <span>
                  {faDigits(String(group.tasks.length))} وظیفه در پروژه‌های
                  مختلف
                </span>
              </div>
              <Badge variant="outline">
                {faDigits(
                  String(
                    group.tasks.filter(
                      (t) => !["done", "cancelled"].includes(t.status),
                    ).length,
                  ),
                )}{" "}
                کار باز
              </Badge>
            </header>
            <div className="task-list-head">
              <span>وظیفه</span>
              <span>پروژه</span>
              <span>زمان‌بندی</span>
              <span>برچسب</span>
              <span>وضعیت</span>
              <span />
            </div>
            {group.tasks.map((t) => (
              <article className="task-table-row" key={t.id}>
                <div className="task-row-title">
                  <button
                    className={`task-checkbox ${t.status === "done" ? "checked" : ""}`}
                    onClick={() =>
                      onMove(t.id, t.status === "done" ? "backlog" : "done")
                    }
                  >
                    {t.status === "done" && <Check />}
                  </button>
                  <span>
                    <strong>{t.title}</strong>
                    {t.subtasks?.length ? (
                      <div className="table-subtasks">{t.subtasks.map(s=><button key={s.id} className={s.done?"done":""} onClick={e=>{e.stopPropagation();onToggleSubtask(t.id,s.id)}}><i>{s.done&&<Check/>}</i><em>{s.title}</em></button>)}</div>
                    ) : (
                      <small>{t.description || "بدون توضیحات"}</small>
                    )}
                  </span>
                </div>
                <Badge variant="outline" className="project-chip">
                  {t.project}
                </Badge>
                <div className="task-dates">
                  <small>{t.startDate || "—"}</small>
                  <ArrowLeft />
                  <strong>{t.endDate || t.due}</strong>
                </div>
                <Badge variant="outline">{t.label}</Badge>
                <span className={`task-status-pill status-${t.status}`}>
                  {statusName(t.status)}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="row-menu">
                      <MoreVertical />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => onEdit(t.id)}>
                      <Edit3 /> ویرایش وظیفه
                    </DropdownMenuItem>
                    {t.status !== "done" && (
                      <DropdownMenuItem onClick={() => onMove(t.id, "done")}>
                        <CheckCircle2 /> تکمیل وظیفه
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="danger-item"
                      onClick={() => onDelete(t.id)}
                    >
                      <Trash2 /> حذف وظیفه
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </article>
            ))}
          </section>
        ))}
        {!grouped.length && (
          <div className="panel empty-state">
            وظیفه‌ای با این فیلتر پیدا نشد.
          </div>
        )}
      </div>
    </>
  );
}

function LeaveCenter({
  members,
  leaves,
  onSubmit,
  onStatus,
}: {
  members: Member[];
  leaves: Leave[];
  onSubmit: (leave: Leave) => void;
  onStatus: (id: number, status: Leave["status"]) => void;
}) {
  const [open, setOpen] = useState(false),
    [tab, setTab] = useState("pending");
  const member = (id: number) => members.find((m) => m.id === id),
    pending = leaves.filter((l) => l.status === "در انتظار"),
    approved = leaves.filter((l) => l.status === "تأیید شده"),
    rejected = leaves.filter((l) => l.status === "رد شده"),
    shown =
      tab === "pending"
        ? pending
        : tab === "approved"
          ? approved
          : tab === "rejected"
            ? rejected
            : leaves;
  return (
    <>
      <PageTitle
        title="مدیریت مرخصی‌ها"
        subtitle="ثبت درخواست و تصمیم‌گیری مدیر"
      >
        <Button onClick={() => setOpen(true)}>
          <CalendarOff /> درخواست مرخصی
        </Button>
      </PageTitle>
      <section className="leave-kpis">
        <article>
          <span className="pending">
            <Clock3 />
          </span>
          <div>
            <small>در انتظار بررسی</small>
            <strong>{faDigits(String(pending.length))}</strong>
          </div>
        </article>
        <article>
          <span className="approved">
            <CheckCircle2 />
          </span>
          <div>
            <small>تأییدشده</small>
            <strong>{faDigits(String(approved.length))}</strong>
          </div>
        </article>
        <article>
          <span className="rejected">
            <X />
          </span>
          <div>
            <small>ردشده</small>
            <strong>{faDigits(String(rejected.length))}</strong>
          </div>
        </article>
      </section>
      <div className="leave-filter-tabs">
        <button
          className={tab === "pending" ? "active" : ""}
          onClick={() => setTab("pending")}
        >
          در انتظار
        </button>
        <button
          className={tab === "approved" ? "active" : ""}
          onClick={() => setTab("approved")}
        >
          تأییدشده
        </button>
        <button
          className={tab === "rejected" ? "active" : ""}
          onClick={() => setTab("rejected")}
        >
          ردشده
        </button>
        <button
          className={tab === "all" ? "active" : ""}
          onClick={() => setTab("all")}
        >
          همه درخواست‌ها
        </button>
      </div>
      <section className="leave-request-grid">
        {shown.map((l) => (
          <article className="leave-request-card" key={l.id}>
            <header>
              <Avatar>
                <AvatarFallback>
                  {initials(member(l.memberId)?.name || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3>{member(l.memberId)?.name}</h3>
                <span>{member(l.memberId)?.role}</span>
              </div>
              <span className={`leave-status leave-${l.status}`}>
                {l.status}
              </span>
            </header>
            <div className="leave-range">
              <div>
                <small>از تاریخ</small>
                <strong>{l.from}</strong>
              </div>
              <ArrowLeft />
              <div>
                <small>تا تاریخ</small>
                <strong>{l.to}</strong>
              </div>
            </div>
            <p>
              <strong>علت درخواست:</strong> {l.reason}
            </p>
            {l.status === "در انتظار" ? (
              <footer>
                <Button
                  variant="outline"
                  onClick={() => onStatus(l.id, "رد شده")}
                >
                  <X /> رد درخواست
                </Button>
                <Button onClick={() => onStatus(l.id, "تأیید شده")}>
                  <Check /> تأیید مرخصی
                </Button>
              </footer>
            ) : (
              <footer>
                <Button
                  variant="ghost"
                  onClick={() => onStatus(l.id, "در انتظار")}
                >
                  بازگردانی برای بررسی
                </Button>
              </footer>
            )}
          </article>
        ))}
      </section>
      <Modal
        open={open}
        close={() => setOpen(false)}
        title="ثبت درخواست مرخصی"
        description="مدیر یا هر عضو تیم می‌تواند درخواست خود را ثبت کند."
        submit="ارسال درخواست"
        onSubmit={(e) => {
          e.preventDefault();
          const d = fd(e);
          onSubmit({
            id: Date.now(),
            memberId: Number(d.memberId),
            from: d.from,
            to: d.to,
            reason: d.reason,
            status: "در انتظار",
          });
          setOpen(false);
          toast.success("درخواست برای مدیر ارسال شد");
        }}
      >
        <div className="form-grid">
          <Field label="درخواست برای" name="memberId">
            <select name="memberId">
              {members
                .filter((m) => m.status === "فعال")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.role}
                  </option>
                ))}
            </select>
          </Field>
          <label>
            نوع مرخصی
            <select name="type">
              <option>استحقاقی</option>
              <option>ساعتی</option>
              <option>استعلاجی</option>
              <option>بدون حقوق</option>
            </select>
          </label>
          <label>
            از تاریخ
            <div className="persian-date-input">
              <CalendarDays />
              <input
                name="from"
                defaultValue="۱۴۰۵/۰۶/۲۰"
                inputMode="numeric"
                required
              />
            </div>
          </label>
          <label>
            تا تاریخ
            <div className="persian-date-input">
              <CalendarDays />
              <input
                name="to"
                defaultValue="۱۴۰۵/۰۶/۲۰"
                inputMode="numeric"
                required
              />
            </div>
          </label>
          <label className="wide">
            علت درخواست
            <Textarea name="reason" required />
          </label>
        </div>
      </Modal>
    </>
  );
}

function SettingsV3({
  member,
  onAvatar,
  ...settings
}: {
  member: Member;
  onAvatar: (avatar: Attachment) => void;
  fontScale: number;
  setFontScale: (n: number) => void;
  theme: string;
  setTheme: (s: string) => void;
  labels: LabelSettings;
  onSave: (labels: LabelSettings) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/files", { method: "POST", body });
    if (response.ok) {
      onAvatar(await response.json());
      toast.success("عکس پروفایل ذخیره شد");
    } else toast.error("آپلود عکس انجام نشد");
    setUploading(false);
  };
  return (
    <>
      <SettingsV2 {...settings} />
      <section className="panel own-profile-settings">
        <div className="own-profile-copy">
          <span className="setting-icon">
            <UserRoundCheck />
          </span>
          <div>
            <h2>پروفایل من</h2>
            <p>عکس نمایشی حساب مدیر را از این بخش تغییر دهید.</p>
          </div>
        </div>
        <div className="own-profile-preview">
          <Avatar>
            <AvatarImage src={member.avatar?.url} />
            <AvatarFallback>{initials(member.name)}</AvatarFallback>
          </Avatar>
          <span>
            <strong>{member.name}</strong>
            <small>{member.email}</small>
          </span>
        </div>
        <label className="profile-upload-button">
          <Edit3 />
          {uploading ? "در حال آپلود..." : "تغییر عکس پروفایل"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
      </section>
    </>
  );
}

function monthTitle(value: string) {
  const names = [
      "فروردین",
      "اردیبهشت",
      "خرداد",
      "تیر",
      "مرداد",
      "شهریور",
      "مهر",
      "آبان",
      "آذر",
      "دی",
      "بهمن",
      "اسفند",
    ],
    p = value.split("/"),
    n =
      Number(
        p[1]?.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()),
      ) - 1;
  return `${names[n] || value} ${p[0] || ""}`;
}
function ArchiveMonthPicker({
  months,
  value,
  onChange,
}: {
  months: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="archive-month-picker">
      <div>
        <CalendarDays />
        <span>
          <small>آرشیو ماه</small>
          <strong>{monthTitle(value)}</strong>
        </span>
      </div>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {months.map((m) => (
          <option key={m} value={m}>
            {monthTitle(m)}
          </option>
        ))}
      </select>
    </div>
  );
}

function PersonalTasksPanelV2({
  open,
  close,
  tasks,
  save,
}: {
  open: boolean;
  close: () => void;
  tasks: PersonalTask[];
  save: (tasks: PersonalTask[]) => void;
}) {
  const [title, setTitle] = useState(""),
    [date, setDate] = useState("۱۴۰۵/۰۶/۱۷"),
    [repeat, setRepeat] = useState<PersonalTask["repeat"]>("بدون تکرار"),
    [archiveMonth, setArchiveMonth] = useState("۱۴۰۵/۰۶");
  const active = tasks.filter((t) => t.status === "active"),
    allArchived = tasks.filter((t) => t.status !== "active"),
    key = (t: PersonalTask) => (t.archivedAt || t.date).slice(0, 7),
    months = Array.from(new Set(allArchived.map(key)))
      .sort()
      .reverse(),
    archived = allArchived.filter((t) => key(t) === archiveMonth);
  const add = () => {
    if (!title.trim()) return;
    save([
      { id: Date.now(), title: title.trim(), date, repeat, status: "active" },
      ...tasks,
    ]);
    setTitle("");
    toast.success("تسک شخصی ثبت شد");
  };
  const status = (id: number, value: PersonalTask["status"]) =>
    save(
      tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: value,
              archivedAt: value === "active" ? undefined : "۱۴۰۵/۰۶/۱۷",
            }
          : t,
      ),
    );
  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="personal-tasks-dialog personal-v2" dir="rtl">
        <DialogHeader>
          <span className="personal-header-icon">
            <ListChecks />
          </span>
          <DialogTitle>تسک‌های شخصی من</DialogTitle>
          <DialogDescription>
            برنامه‌های روزانه و یادآوری‌های خصوصی شما
          </DialogDescription>
        </DialogHeader>
        <div className="personal-add-box">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="عنوان برنامه یا یادآوری را بنویسید..."
          />
          <div>
            <label>
              <CalendarDays />
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                inputMode="numeric"
              />
            </label>
            <select
              value={repeat}
              onChange={(e) =>
                setRepeat(e.target.value as PersonalTask["repeat"])
              }
            >
              <option>بدون تکرار</option>
              <option>روزانه</option>
              <option>هفتگی</option>
              <option>ماهانه</option>
            </select>
            <Button onClick={add}>
              <Plus /> افزودن تسک
            </Button>
          </div>
        </div>
        <Tabs defaultValue="active" className="personal-tabs">
          <TabsList>
            <TabsTrigger value="active">
              <ListChecks /> برنامه‌ها <Badge>{active.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archive">
              <Archive /> آرشیو{" "}
              <Badge variant="outline">{allArchived.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <div className="personal-task-list">
              {active.map((t) => (
                <article key={t.id}>
                  <button
                    className="personal-check"
                    onClick={() => status(t.id, "done")}
                  />
                  <span>
                    <strong>{t.title}</strong>
                    <small>
                      {t.date} · {t.repeat}
                    </small>
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="icon-button">
                        <MoreVertical />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => status(t.id, "done")}>
                        <Check /> تکمیل شد
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="danger-item"
                        onClick={() => status(t.id, "cancelled")}
                      >
                        <X /> لغو شد
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </article>
              ))}
              {!active.length && (
                <div className="empty-state">برنامه فعالی باقی نمانده است.</div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="archive">
            <ArchiveMonthPicker
              months={months.length ? months : ["۱۴۰۵/۰۶"]}
              value={archiveMonth}
              onChange={setArchiveMonth}
            />
            <div className="personal-task-list archive">
              {archived.map((t) => (
                <article key={t.id}>
                  <span className={`archive-state ${t.status}`}>
                    {t.status === "done" ? <Check /> : <X />}
                  </span>
                  <span>
                    <strong>{t.title}</strong>
                    <small>
                      {t.status === "done" ? "تکمیل‌شده" : "لغوشده"} ·{" "}
                      {t.archivedAt || t.date}
                    </small>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => status(t.id, "active")}
                  >
                    بازگردانی
                  </Button>
                </article>
              ))}
              {!archived.length && (
                <div className="empty-state">
                  در این ماه موردی بایگانی نشده است.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function AdminLogs({ logs }: { logs: AuditLog[] }) {
  return (
    <>
      <PageTitle
        title="لاگ مدیریتی سیستم"
        subtitle="تاریخچه فعالیت کاربران؛ فقط قابل مشاهده برای مدیر کل"
      >
        <Badge variant="outline">
          <LockKeyhole /> دسترسی مدیر کل
        </Badge>
      </PageTitle>
      <section className="panel admin-log-panel">
        <div className="admin-log-head">
          <div>
            <span>
              <ShieldCheck />
            </span>
            <div>
              <h2>فعالیت‌های ثبت‌شده</h2>
              <p>تمام تغییرات مهم اعضا به‌ترتیب زمان نگهداری می‌شود.</p>
            </div>
          </div>
          <Badge>{faDigits(String(logs.length))} رویداد</Badge>
        </div>
        <div className="admin-log-list">
          {logs.map((log) => (
            <article key={log.id}>
              <span className="audit-icon">
                <Activity />
              </span>
              <div>
                <strong>{log.member}</strong>
                <p>{log.action}</p>
              </div>
              <time>{log.time}</time>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
