import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { listDatabaseDocuments } from "@/config/api";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle,
  FileText,
  FolderOpen,
  GitGraph,
  Languages,
  Loader2,
  Scale,
  Settings,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    user,
    plan,
    tokensRemaining,
    monthlyLimit,
    tokensUsed,
    isAdmin,
  } = useAuth();
  const [docCount, setDocCount] = useState<number | null>(null);
  const [docCountLoading, setDocCountLoading] = useState(true);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "there";

  const isUnlimited = monthlyLimit === Number.POSITIVE_INFINITY;
  const progressValue = isUnlimited
    ? 100
    : Math.min((tokensUsed / Math.max(monthlyLimit, 1)) * 100, 100);

  const lockedModules = useMemo(() => {
    if (plan !== "free") return [];
    return ["translation", "classification"];
  }, [plan]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setDocCountLoading(true);
        const res = await listDatabaseDocuments(1, 0);
        if (!cancelled) setDocCount(typeof res.count === "number" ? res.count : res.documents?.length ?? 0);
      } catch {
        if (!cancelled) setDocCount(null);
      } finally {
        if (!cancelled) setDocCountLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleModuleChange = (module: string) => {
    if (lockedModules.includes(module)) {
      toast.message("Upgrade required", {
        description: "This tool is available on paid plans.",
      });
      navigate("/membership");
      return;
    }
    if (module === "dashboard") {
      navigate("/dashboard");
      return;
    }
    if (module === "clause") {
      navigate("/clause");
      return;
    }
    if (module === "cases") {
      navigate("/cases");
      return;
    }
    if (module === "translation" || module === "classification" || module === "legalLineage") {
      navigate(`/?module=${module}`);
      return;
    }
  };

  const handleLockedModule = () => {
    toast.message("Upgrade required", {
      description: "Upgrade your plan to unlock this tool.",
    });
    navigate("/membership");
  };

  const tools = [
    {
      id: "clause",
      title: "Document analysis",
      description: "Upload contracts and extract clauses with AI-assisted review.",
      icon: CheckCircle,
      href: "/clause",
      locked: false,
    },
    {
      id: "translation",
      title: "Multilingual translation",
      description: "Translate legal text across languages with consistent terminology.",
      icon: Languages,
      href: "/?module=translation",
      locked: lockedModules.includes("translation"),
    },
    {
      id: "classification",
      title: "Risk classification",
      description: "Classify documents and surface compliance and risk signals.",
      icon: AlertCircle,
      href: "/?module=classification",
      locked: lockedModules.includes("classification"),
    },
    {
      id: "legalLineage",
      title: "Legal lineage",
      description: "Trace relationships across acts, cases, and references.",
      icon: GitGraph,
      href: "/?module=legalLineage",
      locked: false,
    },
  ] as const;

  const openTool = (href: string, locked: boolean) => {
    if (locked) {
      handleLockedModule();
      return;
    }
    navigate(href);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeModule="dashboard"
        onModuleChange={handleModuleChange}
        lockedModules={lockedModules}
        onLockedModule={handleLockedModule}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "ml-20" : "ml-64",
        )}
      >
        <div className="p-8 max-w-6xl mx-auto space-y-10">
          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Scale className="w-4 h-4 text-primary" />
              <span>Overview</span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {displayName}
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Start with document analysis or jump into translation, classification, and lineage tools.
              Your usage and saved case files are summarized below.
            </p>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Plan</CardDescription>
                <CardTitle className="text-lg capitalize flex items-center gap-2">
                  {plan}
                  <Badge variant="secondary" className="font-normal">
                    Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate("/membership")}>
                  Manage membership
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>

            {!isAdmin && (
              <Card className="border-border/80 shadow-sm sm:col-span-2">
                <CardHeader className="pb-2">
                  <CardDescription>Token usage</CardDescription>
                  <CardTitle className="text-lg">
                    {isUnlimited ? "Unlimited" : `${tokensRemaining} remaining`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!isUnlimited && (
                    <>
                      <Progress value={progressValue} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {tokensUsed} / {monthlyLimit} used this billing period
                      </p>
                    </>
                  )}
                  {isUnlimited && (
                    <p className="text-xs text-muted-foreground">No monthly token cap on your plan.</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Case files</CardDescription>
                <CardTitle className="text-lg flex items-center gap-2">
                  {docCountLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    docCount ?? "—"
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate("/cases")}>
                  <FolderOpen className="w-3 h-3" />
                  View library
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl font-semibold">AI tools</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {tools.map((tool) => (
                <Card
                  key={tool.id}
                  className={cn(
                    "border-border/80 shadow-sm transition-shadow hover:shadow-md",
                    tool.locked && "opacity-90",
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <tool.icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-base">{tool.title}</CardTitle>
                        <CardDescription>{tool.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      size="sm"
                      variant={tool.locked ? "outline" : "default"}
                      className="gap-1"
                      onClick={() => openTool(tool.href, tool.locked)}
                    >
                      {tool.locked ? "Upgrade to unlock" : "Open"}
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card className="border-dashed border-border/80 bg-muted/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-base">Cases & documents</CardTitle>
                </div>
                <CardDescription>
                  Browse documents saved from clause workflows and download when needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" size="sm" className="gap-2" onClick={() => navigate("/cases")}>
                  <FileText className="w-4 h-4" />
                  Go to case files
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed border-border/80 bg-muted/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-base">Account</CardTitle>
                </div>
                <CardDescription>Profile, preferences, and membership in one place.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                  Profile
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                  Settings
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Toaster />
    </div>
  );
}
