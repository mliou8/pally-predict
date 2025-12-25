import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2, Plus, CheckCircle2, Send, Users, HelpCircle, 
  DollarSign, TrendingUp, Clock, Play, Eye, ArrowLeft
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Get admin key from localStorage or prompt
const getAdminKey = (): string => {
  let key = localStorage.getItem('telegram_admin_key');
  if (!key) {
    key = prompt('Enter Telegram Admin Key:') || '';
    if (key) {
      localStorage.setItem('telegram_admin_key', key);
    }
  }
  return key;
};

const apiRequest = async (url: string, options: RequestInit = {}) => {
  const adminKey = getAdminKey();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
      ...options.headers,
    },
  });
  
  if (response.status === 401) {
    localStorage.removeItem('telegram_admin_key');
    throw new Error('Unauthorized - Invalid admin key');
  }
  
  return response;
};

interface TelegramQuestion {
  id: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | null;
  context: string | null;
  scheduledFor: string;
  expiresAt: string;
  isActive: boolean;
  isRevealed: boolean;
  resultsSentAt: string | null;
  createdAt: string;
  stats?: {
    totalBets: number;
    totalAmount: number;
    votesA: number;
    votesB: number;
    votesC: number;
    votesD: number;
    amountA: number;
    amountB: number;
    amountC: number;
    amountD: number;
  };
}

interface TelegramUser {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  balance: string;
  totalWagered: string;
  totalWon: string;
  correctPredictions: number;
  totalPredictions: number;
  currentStreak: number;
  maxStreak: number;
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;
  totalQuestions: number;
  activeQuestions: number;
  revealedQuestions: number;
  pendingQuestions: number;
  currentActiveQuestion: string | null;
  totalBalance: string;
  totalWagered: string;
}

interface NewQuestionData {
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  context: string;
  scheduledFor: string;
  expiresAt: string;
}

function getTomorrowSchedule(): { scheduledFor: string; expiresAt: string } {
  const now = new Date();
  
  // Tomorrow at 9 AM ET
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  
  // Expires at 9 PM ET same day
  const expires = new Date(tomorrow);
  expires.setHours(21, 0, 0, 0);
  
  return {
    scheduledFor: tomorrow.toISOString().slice(0, 16),
    expiresAt: expires.toISOString().slice(0, 16),
  };
}

export default function TelegramAdmin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<TelegramQuestion | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  
  const schedule = getTomorrowSchedule();
  
  const [newQuestion, setNewQuestion] = useState<NewQuestionData>({
    prompt: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    context: '',
    scheduledFor: schedule.scheduledFor,
    expiresAt: schedule.expiresAt,
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/telegram/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/telegram/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Fetch all questions
  const { data: questions = [], isLoading: questionsLoading, refetch: refetchQuestions } = useQuery<TelegramQuestion[]>({
    queryKey: ['/api/telegram/admin/questions'],
    queryFn: async () => {
      const response = await apiRequest('/api/telegram/admin/questions');
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<TelegramUser[]>({
    queryKey: ['/api/telegram/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('/api/telegram/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  // Create question mutation
  const createMutation = useMutation({
    mutationFn: async (data: NewQuestionData) => {
      const response = await apiRequest('/api/telegram/admin/questions', {
        method: 'POST',
        body: JSON.stringify({
          prompt: data.prompt.trim(),
          optionA: data.optionA.trim(),
          optionB: data.optionB.trim(),
          optionC: data.optionC.trim() || null,
          optionD: data.optionD.trim() || null,
          context: data.context.trim() || null,
          scheduledFor: new Date(data.scheduledFor).toISOString(),
          expiresAt: new Date(data.expiresAt).toISOString(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create question');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/admin/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/admin/stats'] });
      toast({ title: 'Question created!', description: 'The question has been scheduled.' });
      
      // Reset form
      const newSchedule = getTomorrowSchedule();
      setNewQuestion({
        prompt: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        context: '',
        scheduledFor: newSchedule.scheduledFor,
        expiresAt: newSchedule.expiresAt,
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create question', description: error.message, variant: 'destructive' });
    },
  });

  // Delete question mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/telegram/admin/questions/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete question');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/admin/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/admin/stats'] });
      toast({ title: 'Question deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete question', description: error.message, variant: 'destructive' });
    },
  });

  // Activate question mutation
  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/telegram/admin/questions/${id}/activate`, { method: 'POST' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate question');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/admin/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/admin/stats'] });
      toast({ title: 'Question activated!', description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to activate question', description: error.message, variant: 'destructive' });
    },
  });

  // Reveal question mutation
  const revealMutation = useMutation({
    mutationFn: async ({ id, correctAnswer }: { id: string; correctAnswer: 'A' | 'B' | 'C' | 'D' }) => {
      const response = await apiRequest(`/api/telegram/admin/questions/${id}/reveal`, {
        method: 'POST',
        body: JSON.stringify({ correctAnswer }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reveal question');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/admin/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/admin/users'] });
      toast({ title: 'Results revealed!', description: data.message });
      setRevealDialogOpen(false);
      setSelectedQuestion(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to reveal results', description: error.message, variant: 'destructive' });
    },
  });

  // Run scheduler mutation
  const schedulerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/telegram/admin/scheduler/run', { method: 'POST' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run scheduler');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/admin/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/admin/stats'] });
      toast({ 
        title: 'Scheduler ran successfully',
        description: `Activated: ${data.questionsActivated}, Revealed: ${data.questionsRevealed}, Results sent: ${data.resultsSent}`,
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Scheduler failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.prompt || !newQuestion.optionA || !newQuestion.optionB) {
      toast({ title: 'Missing fields', description: 'Prompt and options A/B are required', variant: 'destructive' });
      return;
    }
    createMutation.mutate(newQuestion);
  };

  const openRevealDialog = (question: TelegramQuestion) => {
    setSelectedQuestion(question);
    setCorrectAnswer('A');
    setRevealDialogOpen(true);
  };

  const formatMoney = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${num.toFixed(2)}`;
  };

  const getStatusBadge = (question: TelegramQuestion) => {
    if (question.isRevealed) {
      return <Badge className="bg-purple-500">Revealed</Badge>;
    }
    if (question.isActive) {
      return <Badge className="bg-green-500">Active</Badge>;
    }
    return <Badge variant="secondary">Scheduled</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0088cc] to-[#00D9FF] bg-clip-text text-transparent">
                Telegram Bot Admin
              </h1>
            </div>
            <p className="text-muted-foreground">Manage daily prediction questions for Telegram</p>
          </div>
          <Button 
            onClick={() => schedulerMutation.mutate()} 
            disabled={schedulerMutation.isPending}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            {schedulerMutation.isPending ? 'Running...' : 'Run Scheduler'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {statsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading stats...</div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                          <div className="text-2xl font-bold">{stats.totalUsers}</div>
                          <div className="text-sm text-muted-foreground">Total Users</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="h-8 w-8 text-blue-500" />
                        <div>
                          <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                          <div className="text-sm text-muted-foreground">Total Questions</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-8 w-8 text-green-500" />
                        <div>
                          <div className="text-2xl font-bold">{formatMoney(stats.totalBalance)}</div>
                          <div className="text-sm text-muted-foreground">Total Balance</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-orange-500" />
                        <div>
                          <div className="text-2xl font-bold">{formatMoney(stats.totalWagered)}</div>
                          <div className="text-sm text-muted-foreground">Total Wagered</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border-green-500/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        Active
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.activeQuestions}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-500/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        Pending
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.pendingQuestions}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-500/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        Revealed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.revealedQuestions}</div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            {questionsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading questions...</div>
            ) : questions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No questions yet. Create your first question!
                </CardContent>
              </Card>
            ) : (
              questions.map((question) => (
                <Card key={question.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(question)}
                          {question.correctAnswer && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Answer: {question.correctAnswer}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{question.prompt}</CardTitle>
                        {question.context && (
                          <CardDescription className="mt-1">{question.context}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!question.isActive && !question.isRevealed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => activateMutation.mutate(question.id)}
                            disabled={activateMutation.isPending}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                        {question.isActive && !question.isRevealed && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openRevealDialog(question)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Reveal
                          </Button>
                        )}
                        {!question.isActive && !question.isRevealed && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(question.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div className="p-2 rounded bg-muted">
                        <span className="font-medium">A:</span> {question.optionA}
                        {question.stats && (
                          <span className="text-muted-foreground ml-2">
                            ({question.stats.votesA} votes, {formatMoney(question.stats.amountA)})
                          </span>
                        )}
                      </div>
                      <div className="p-2 rounded bg-muted">
                        <span className="font-medium">B:</span> {question.optionB}
                        {question.stats && (
                          <span className="text-muted-foreground ml-2">
                            ({question.stats.votesB} votes, {formatMoney(question.stats.amountB)})
                          </span>
                        )}
                      </div>
                      {question.optionC && (
                        <div className="p-2 rounded bg-muted">
                          <span className="font-medium">C:</span> {question.optionC}
                          {question.stats && (
                            <span className="text-muted-foreground ml-2">
                              ({question.stats.votesC} votes, {formatMoney(question.stats.amountC)})
                            </span>
                          )}
                        </div>
                      )}
                      {question.optionD && (
                        <div className="p-2 rounded bg-muted">
                          <span className="font-medium">D:</span> {question.optionD}
                          {question.stats && (
                            <span className="text-muted-foreground ml-2">
                              ({question.stats.votesD} votes, {formatMoney(question.stats.amountD)})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Scheduled: {new Date(question.scheduledFor).toLocaleString()}
                      </div>
                      <div>
                        Expires: {new Date(question.expiresAt).toLocaleString()}
                      </div>
                      {question.stats && (
                        <div className="ml-auto">
                          <Badge variant="outline">
                            {question.stats.totalBets} bets • {formatMoney(question.stats.totalAmount)} pot
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Question
                </CardTitle>
                <CardDescription>
                  Schedule a new prediction question. Users start with $500 testnet dollars.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Question Prompt *</Label>
                    <Textarea
                      id="prompt"
                      value={newQuestion.prompt}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder="Will BTC close above $100k this week?"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="context">Context (optional)</Label>
                    <Input
                      id="context"
                      value={newQuestion.context}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, context: e.target.value }))}
                      placeholder="Additional context for the question..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="optionA">Option A *</Label>
                      <Input
                        id="optionA"
                        value={newQuestion.optionA}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, optionA: e.target.value }))}
                        placeholder="Yes, definitely"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionB">Option B *</Label>
                      <Input
                        id="optionB"
                        value={newQuestion.optionB}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, optionB: e.target.value }))}
                        placeholder="No way"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionC">Option C (optional)</Label>
                      <Input
                        id="optionC"
                        value={newQuestion.optionC}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, optionC: e.target.value }))}
                        placeholder="Maybe..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionD">Option D (optional)</Label>
                      <Input
                        id="optionD"
                        value={newQuestion.optionD}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, optionD: e.target.value }))}
                        placeholder="Too soon to tell"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledFor">Send At</Label>
                      <Input
                        id="scheduledFor"
                        type="datetime-local"
                        value={newQuestion.scheduledFor}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, scheduledFor: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiresAt">Voting Closes At</Label>
                      <Input
                        id="expiresAt"
                        type="datetime-local"
                        value={newQuestion.expiresAt}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, expiresAt: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Question'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            {usersLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading users...</div>
            ) : users.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No users yet. Users will appear after they start the bot.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Users ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">User</th>
                          <th className="text-right p-2">Balance</th>
                          <th className="text-right p-2">Wagered</th>
                          <th className="text-right p-2">Won</th>
                          <th className="text-right p-2">Record</th>
                          <th className="text-right p-2">Streak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              {user.username ? `@${user.username}` : user.firstName || 'Anonymous'}
                              <div className="text-xs text-muted-foreground">ID: {user.telegramId}</div>
                            </td>
                            <td className="text-right p-2 font-mono font-medium">
                              {formatMoney(user.balance)}
                            </td>
                            <td className="text-right p-2 font-mono text-muted-foreground">
                              {formatMoney(user.totalWagered)}
                            </td>
                            <td className="text-right p-2 font-mono text-green-600">
                              {formatMoney(user.totalWon)}
                            </td>
                            <td className="text-right p-2">
                              {user.correctPredictions}/{user.totalPredictions}
                              {user.totalPredictions > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({Math.round((user.correctPredictions / user.totalPredictions) * 100)}%)
                                </span>
                              )}
                            </td>
                            <td className="text-right p-2">
                              🔥 {user.currentStreak}
                              <span className="text-muted-foreground"> (max: {user.maxStreak})</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Reveal Dialog */}
        <Dialog open={revealDialogOpen} onOpenChange={setRevealDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reveal Results</DialogTitle>
              <DialogDescription>
                Select the correct answer for this question. This will calculate payouts and notify all participants.
              </DialogDescription>
            </DialogHeader>
            
            {selectedQuestion && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="font-medium">{selectedQuestion.prompt}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select value={correctAnswer} onValueChange={(v) => setCorrectAnswer(v as 'A' | 'B' | 'C' | 'D')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A: {selectedQuestion.optionA}</SelectItem>
                      <SelectItem value="B">B: {selectedQuestion.optionB}</SelectItem>
                      {selectedQuestion.optionC && (
                        <SelectItem value="C">C: {selectedQuestion.optionC}</SelectItem>
                      )}
                      {selectedQuestion.optionD && (
                        <SelectItem value="D">D: {selectedQuestion.optionD}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setRevealDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedQuestion && revealMutation.mutate({ id: selectedQuestion.id, correctAnswer })}
                disabled={revealMutation.isPending}
              >
                {revealMutation.isPending ? 'Revealing...' : 'Reveal & Notify Users'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

