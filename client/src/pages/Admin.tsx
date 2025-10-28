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
import { Trash2, Plus } from 'lucide-react';
import type { Question, QuestionType, User } from '@shared/schema';

interface QuestionFormData {
  type: QuestionType;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  context: string;
  dropsAt: string;
  revealsAt: string;
}

export default function Admin() {
  const { user } = usePrivy();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<QuestionFormData>({
    type: 'consensus',
    prompt: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    context: '',
    dropsAt: '',
    revealsAt: '',
  });

  // Check if user is admin
  const { data: userProfile, isLoading: profileLoading } = useQuery<User>({
    queryKey: ['/api/user/me'],
    enabled: !!user?.id,
  });

  // Fetch all questions (only if admin)
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/admin/questions'],
    enabled: !!user?.id && userProfile?.isAdmin === true,
  });

  // Create question mutation
  const createMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Convert form data to API format
      const payload = {
        type: data.type,
        prompt: data.prompt,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC || null,
        optionD: data.optionD || null,
        context: data.context || null,
        dropsAt: new Date(data.dropsAt).toISOString(),
        revealsAt: new Date(data.revealsAt).toISOString(),
        isActive: true,
        isRevealed: false,
      };

      const response = await apiRequest('/api/admin/questions', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, user.id);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      toast({
        title: 'Question created!',
        description: 'The question has been added successfully.',
      });
      // Reset form
      setFormData({
        type: 'consensus',
        prompt: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        context: '',
        dropsAt: '',
        revealsAt: '',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create question',
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
    
    // Validation
    if (!formData.prompt || !formData.optionA || !formData.optionB) {
      toast({
        title: 'Missing required fields',
        description: 'Prompt and at least options A and B are required.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.dropsAt || !formData.revealsAt) {
      toast({
        title: 'Missing dates',
        description: 'Both drops at and reveals at dates are required.',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(formData);
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
          <p className="text-muted-foreground mt-2">Create and manage daily questions</p>
        </div>

        {/* Create Question Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Question
            </CardTitle>
            <CardDescription>Schedule a new question for the community</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Question Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as QuestionType })}
                  >
                    <SelectTrigger id="type" data-testid="select-question-type">
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
                  <Label htmlFor="context">Context (optional)</Label>
                  <Input
                    id="context"
                    value={formData.context}
                    onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                    placeholder="e.g., Crypto Market"
                    data-testid="input-context"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Question Prompt *</Label>
                <Textarea
                  id="prompt"
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="What will most traders predict about BTC this week?"
                  rows={3}
                  required
                  data-testid="input-prompt"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="optionA">Option A *</Label>
                  <Input
                    id="optionA"
                    value={formData.optionA}
                    onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                    placeholder="Bullish pump incoming"
                    required
                    data-testid="input-option-a"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="optionB">Option B *</Label>
                  <Input
                    id="optionB"
                    value={formData.optionB}
                    onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                    placeholder="Bearish dump expected"
                    required
                    data-testid="input-option-b"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="optionC">Option C (optional)</Label>
                  <Input
                    id="optionC"
                    value={formData.optionC}
                    onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                    placeholder="Sideways crab market"
                    data-testid="input-option-c"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="optionD">Option D (optional)</Label>
                  <Input
                    id="optionD"
                    value={formData.optionD}
                    onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                    placeholder="Volatility explosion"
                    data-testid="input-option-d"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dropsAt">Drops At (Question becomes visible) *</Label>
                  <Input
                    id="dropsAt"
                    type="datetime-local"
                    value={formData.dropsAt}
                    onChange={(e) => setFormData({ ...formData, dropsAt: e.target.value })}
                    required
                    data-testid="input-drops-at"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revealsAt">Reveals At (Results revealed) *</Label>
                  <Input
                    id="revealsAt"
                    type="datetime-local"
                    value={formData.revealsAt}
                    onChange={(e) => setFormData({ ...formData, revealsAt: e.target.value })}
                    required
                    data-testid="input-reveals-at"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full"
                data-testid="button-create-question"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Question'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Questions</CardTitle>
            <CardDescription>Manage existing questions</CardDescription>
          </CardHeader>
          <CardContent>
            {questionsLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No questions yet. Create your first one above!
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
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
