import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, CheckCircle2, Calendar } from 'lucide-react';
import type { Question, QuestionType, User } from '@shared/schema';

interface SingleQuestionData {
  type: QuestionType;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  context: string;
}

function getTomorrowNoonET(): { dropsAt: Date; revealsAt: Date } {
  const now = new Date();
  
  // Get tomorrow's date in ET timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const parts = formatter.formatToParts(tomorrow);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  
  // Determine if we're in EDT or EST for tomorrow
  const testDate = new Date(`${year}-${month}-${day}T12:00:00`);
  const tzString = testDate.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'short'
  });
  const isDST = tzString.includes('EDT');
  const offset = isDST ? '-04:00' : '-05:00';
  
  // Tomorrow noon ET
  const dropsAt = new Date(`${year}-${month}-${day}T12:00:00${offset}`);
  
  // Day after tomorrow noon ET (reveal time)
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  const parts2 = formatter.formatToParts(dayAfterTomorrow);
  const year2 = parts2.find(p => p.type === 'year')?.value;
  const month2 = parts2.find(p => p.type === 'month')?.value;
  const day2 = parts2.find(p => p.type === 'day')?.value;
  
  const revealsAt = new Date(`${year2}-${month2}-${day2}T12:00:00${offset}`);
  
  return { dropsAt, revealsAt };
}

export default function Admin() {
  const { user } = usePrivy();
  const { toast } = useToast();
  
  const emptyQuestion: SingleQuestionData = {
    type: 'consensus',
    prompt: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    context: '',
  };

  const [questions, setQuestions] = useState<SingleQuestionData[]>([
    { ...emptyQuestion },
    { ...emptyQuestion },
    { ...emptyQuestion },
  ]);

  // Check if user is admin
  const { data: userProfile, isLoading: profileLoading } = useQuery<User>({
    queryKey: ['/api/user/me'],
    enabled: !!user?.id,
  });

  // Fetch all questions (only if admin)
  const { data: allQuestions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/admin/questions'],
    enabled: !!user?.id && userProfile?.isAdmin === true,
  });

  // Check if tomorrow's questions already exist
  const tomorrowSchedule = getTomorrowNoonET();
  const tomorrowQuestions = allQuestions.filter(q => {
    const dropDate = new Date(q.dropsAt);
    return dropDate.getTime() === tomorrowSchedule.dropsAt.getTime();
  });
  const hasTomorrowQuestions = tomorrowQuestions.length >= 3;

  // Fast-track mutation
  const fastTrackMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const response = await apiRequest('/api/admin/fast-track', {
        method: 'POST',
      }, user.id);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/revealed'] });
      toast({
        title: 'Questions fast-tracked!',
        description: `${data.updatedCount} questions are now available today.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to fast-track questions',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create questions mutation
  const createMutation = useMutation({
    mutationFn: async (questionsData: SingleQuestionData[]) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { dropsAt, revealsAt } = getTomorrowNoonET();
      
      const createdQuestions = [];
      for (const q of questionsData) {
        const payload = {
          type: q.type,
          prompt: q.prompt.trim(),
          optionA: q.optionA.trim(),
          optionB: q.optionB.trim(),
          optionC: q.optionC.trim() || null,
          optionD: q.optionD.trim() || null,
          context: q.context.trim() || null,
          dropsAt: dropsAt.toISOString(),
          revealsAt: revealsAt.toISOString(),
          isActive: true,
          isRevealed: false,
        };

        const response = await apiRequest('/api/admin/questions', {
          method: 'POST',
          body: JSON.stringify(payload),
        }, user.id);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create question');
        }
        
        const created = await response.json();
        createdQuestions.push(created);
      }
      
      return createdQuestions;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      toast({
        title: 'Questions created!',
        description: `All 3 questions added for tomorrow at noon ET.`,
      });
      // Reset form
      setQuestions([
        { ...emptyQuestion },
        { ...emptyQuestion },
        { ...emptyQuestion },
      ]);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create questions',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete question mutation
  const deleteMutation = useMutation({
    mutationFn: async (questionId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const response = await apiRequest(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
      }, user.id);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      toast({
        title: 'Question deleted',
        description: 'The question has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete question',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt || !q.optionA || !q.optionB) {
        toast({
          title: 'Missing required fields',
          description: `Question ${i + 1}: Prompt and at least options A and B are required.`,
          variant: 'destructive',
        });
        return;
      }
    }

    createMutation.mutate(questions);
  };

  const updateQuestion = (index: number, field: keyof SingleQuestionData, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = userProfile?.isAdmin || false;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page. Admin privileges are required.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D9FF] to-[#FF00E5] bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Add tomorrow's questions (all 3 at once)</p>
        </div>

        {/* Tomorrow's Schedule Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tomorrow's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasTomorrowQuestions ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">
                    Tomorrow's questions are ready! ({tomorrowQuestions.length}/3 scheduled)
                  </span>
                </div>
                <Button 
                  onClick={() => fastTrackMutation.mutate()}
                  disabled={fastTrackMutation.isPending}
                  variant="default"
                  className="w-full sm:w-auto"
                  data-testid="button-fast-track"
                >
                  {fastTrackMutation.isPending ? 'Fast-tracking...' : '⚡ Fast-Track to Today'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  This will move tomorrow's questions to today's schedule (drops immediately, reveals tomorrow at noon ET)
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  No questions scheduled for tomorrow yet. Add 3 questions below.
                </p>
                <p className="text-sm text-muted-foreground">
                  Questions will drop at: <span className="font-mono font-semibold">{tomorrowSchedule.dropsAt.toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' })}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Questions Form (only show if tomorrow not scheduled) */}
        {!hasTomorrowQuestions && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((question, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Question {index + 1} of 3
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor={`type-${index}`}>Question Type</Label>
                      <Select
                        value={question.type}
                        onValueChange={(value) => updateQuestion(index, 'type', value)}
                      >
                        <SelectTrigger id={`type-${index}`} data-testid={`select-question-type-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consensus">Consensus</SelectItem>
                          <SelectItem value="prediction">Prediction</SelectItem>
                          <SelectItem value="preference">Preference</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`context-${index}`}>Context (optional)</Label>
                      <Input
                        id={`context-${index}`}
                        value={question.context}
                        onChange={(e) => updateQuestion(index, 'context', e.target.value)}
                        placeholder="e.g., Crypto Market"
                        data-testid={`input-context-${index}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`prompt-${index}`}>Question Prompt *</Label>
                    <Textarea
                      id={`prompt-${index}`}
                      value={question.prompt}
                      onChange={(e) => updateQuestion(index, 'prompt', e.target.value)}
                      placeholder="What will most traders predict about BTC this week?"
                      rows={3}
                      required
                      data-testid={`input-prompt-${index}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`optionA-${index}`}>Option A *</Label>
                      <Input
                        id={`optionA-${index}`}
                        value={question.optionA}
                        onChange={(e) => updateQuestion(index, 'optionA', e.target.value)}
                        placeholder="Bullish pump incoming"
                        required
                        data-testid={`input-option-a-${index}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`optionB-${index}`}>Option B *</Label>
                      <Input
                        id={`optionB-${index}`}
                        value={question.optionB}
                        onChange={(e) => updateQuestion(index, 'optionB', e.target.value)}
                        placeholder="Bearish dump expected"
                        required
                        data-testid={`input-option-b-${index}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`optionC-${index}`}>Option C (optional)</Label>
                      <Input
                        id={`optionC-${index}`}
                        value={question.optionC}
                        onChange={(e) => updateQuestion(index, 'optionC', e.target.value)}
                        placeholder="Sideways crab market"
                        data-testid={`input-option-c-${index}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`optionD-${index}`}>Option D (optional)</Label>
                      <Input
                        id={`optionD-${index}`}
                        value={question.optionD}
                        onChange={(e) => updateQuestion(index, 'optionD', e.target.value)}
                        placeholder="Volatility explosion"
                        data-testid={`input-option-d-${index}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-create-questions"
            >
              {createMutation.isPending ? 'Creating Questions...' : 'Add All 3 Questions for Tomorrow'}
            </Button>
          </form>
        )}

        {/* Questions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Questions</CardTitle>
            <CardDescription>Manage existing questions</CardDescription>
          </CardHeader>
          <CardContent>
            {questionsLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading questions...</div>
            ) : allQuestions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No questions yet. Create your first set above!
              </div>
            ) : (
              <div className="space-y-4">
                {allQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="border border-border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{question.type}</Badge>
                          {question.isRevealed && <Badge>Revealed</Badge>}
                          {!question.isActive && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <p className="font-semibold text-lg mb-2">{question.prompt}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>A: {question.optionA}</div>
                          <div>B: {question.optionB}</div>
                          {question.optionC && <div>C: {question.optionC}</div>}
                          {question.optionD && <div>D: {question.optionD}</div>}
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground space-y-1">
                          <div>Drops: {new Date(question.dropsAt).toLocaleString()}</div>
                          <div>Reveals: {new Date(question.revealsAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(question.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${question.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
