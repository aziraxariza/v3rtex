import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getHealthCheckQueryKey, useHealthCheck, useSendAiChat } from '@workspace/api-client-react';
import {
  ArrowRight, BarChart3, Bell, BookOpen, Bot, Check, CheckCircle2, ChevronDown, ChevronLeft,
  Circle, Clock3, Code2, Filter, Flame, GitBranch, History, Home as HomeIcon, Lightbulb,
  LibraryBig, LockKeyhole, Menu, MessageCircle, Moon, Play, RotateCcw, Search, Send,
  SlidersHorizontal, Sparkles, Sun, Terminal, Trophy, UserRound, X, Zap,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import type { AiChatResponse } from '@workspace/api-client-react';

const queryClient = new QueryClient();

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Problem = {
  id: number; title: string; difficulty: Difficulty; topic: string; description: string;
  examples: { input: string; output: string; note?: string }[];
  constraints: string[]; starterCode: string; functionSignature: string; tags: string[]; testCases: string[];
};
type Submission = {
  id: number; problemId: number; problemTitle: string; status: 'Accepted' | 'Needs review' | 'Wrong answer';
  timeComplexity: string; spaceComplexity: string; score: number; approach: string; createdAt: string; attemptNumber: number;
};

const seedProblems: Problem[] = [
  {
    id: 1, title: 'Balanced Brackets', difficulty: 'Easy', topic: 'Stack',
    description: 'Given a string containing brackets, determine if the input is balanced. A bracket is balanced when every opening bracket is closed by the same type in the correct order.',
    examples: [{ input: 's = "{[()]}"', output: 'true' }, { input: 's = "([)]"', output: 'false', note: 'The closing parenthesis arrives before the bracket is closed.' }],
    constraints: ['1 ≤ s.length ≤ 10⁴', 's consists of parentheses, braces, and square brackets.'],
    starterCode: `function isBalanced(s: string): boolean {\n  // Your solution here\n}`, functionSignature: 'isBalanced(s: string) → boolean', tags: ['stack', 'string', 'parsing'],
    testCases: ['{[()]}', '([)]', '((()))', ''],
  },
  {
    id: 2, title: 'First Repeated Character', difficulty: 'Easy', topic: 'Hash Map',
    description: 'Find the first character that appears more than once in a string. Return an empty string if every character is unique.',
    examples: [{ input: 's = "swiss"', output: '"s"' }, { input: 's = "lamp"', output: '""' }],
    constraints: ['1 ≤ s.length ≤ 10⁵', 's contains lowercase English letters.'],
    starterCode: `function firstRepeat(s: string): string {\n  // Your solution here\n}`, functionSignature: 'firstRepeat(s: string) → string', tags: ['hash-map', 'string'],
    testCases: ['swiss', 'lamp', 'teammate'],
  },
  {
    id: 3, title: 'Merge Intervals', difficulty: 'Medium', topic: 'Intervals',
    description: 'Given an array of intervals where intervals[i] = [startᵢ, endᵢ], merge all overlapping intervals and return an array of the non-overlapping intervals.',
    examples: [{ input: '[[1,3],[2,6],[8,10],[9,12]]', output: '[[1,6],[8,12]]' }, { input: '[[1,4],[4,5]]', output: '[[1,5]]' }],
    constraints: ['1 ≤ intervals.length ≤ 10⁴', 'intervals[i].length = 2', '0 ≤ startᵢ ≤ endᵢ ≤ 10⁴'],
    starterCode: `function merge(intervals: number[][]): number[][] {\n  // Your solution here\n}`, functionSignature: 'merge(intervals: number[][]) → number[][]', tags: ['sorting', 'intervals', 'greedy'],
    testCases: ['[[1,3],[2,6],[8,10],[9,12]]', '[[1,4],[4,5]]'],
  },
  {
    id: 4, title: 'Longest Substring Without Repeats', difficulty: 'Medium', topic: 'Sliding Window',
    description: 'Given a string, find the length of the longest substring without repeating characters.',
    examples: [{ input: 's = "abcabcbb"', output: '3', note: 'The answer is "abc".' }, { input: 's = "bbbbb"', output: '1' }],
    constraints: ['0 ≤ s.length ≤ 5 × 10⁴', 's consists of English letters, digits, symbols, and spaces.'],
    starterCode: `function lengthOfLongest(s: string): number {\n  // Your solution here\n}`, functionSignature: 'lengthOfLongest(s: string) → number', tags: ['two-pointers', 'string', 'window'],
    testCases: ['abcabcbb', 'bbbbb', 'pwwkew'],
  },
  {
    id: 5, title: 'Binary Tree Level Order', difficulty: 'Medium', topic: 'Trees',
    description: 'Return the level order traversal of a binary tree as a list of lists, reading each level from left to right.',
    examples: [{ input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]' }],
    constraints: ['The number of nodes is in the range [0, 2000].', '-1000 ≤ Node.val ≤ 1000'],
    starterCode: `function levelOrder(root: TreeNode | null): number[][] {\n  // Your solution here\n}`, functionSignature: 'levelOrder(root: TreeNode | null) → number[][]', tags: ['bfs', 'trees', 'queue'],
    testCases: ['[3,9,20,null,null,15,7]', '[]'],
  },
  {
    id: 6, title: 'Minimum Coins', difficulty: 'Hard', topic: 'Dynamic Programming',
    description: 'Given coin denominations and a target amount, return the fewest coins needed to make that amount. Return -1 if it cannot be made.',
    examples: [{ input: 'coins = [1,2,5], amount = 11', output: '3' }, { input: 'coins = [2], amount = 3', output: '-1' }],
    constraints: ['1 ≤ coins.length ≤ 12', '1 ≤ coins[i] ≤ 2³¹ - 1', '0 ≤ amount ≤ 10⁴'],
    starterCode: `function minCoins(coins: number[], amount: number): number {\n  // Your solution here\n}`, functionSignature: 'minCoins(coins: number[], amount: number) → number', tags: ['dp', 'bottom-up', 'optimization'],
    testCases: ['[1,2,5], 11', '[2], 3', '[1], 0'],
  },
];

const catalogTopics = [
  { topic: 'Arrays & Hashing', stems: ['Frequency Map', 'Prefix Ledger', 'Distinct Window', 'Array Balance'] },
  { topic: 'Two Pointers', stems: ['Pair Sweep', 'Opposite Ends', 'Sorted Pairing', 'Partition Pass'] },
  { topic: 'Sliding Window', stems: ['Window Minimum', 'Longest Segment', 'Window Budget', 'Unique Window'] },
  { topic: 'Stack', stems: ['Monotonic Stack', 'Bracket Ledger', 'Next Greater', 'Stack Simulation'] },
  { topic: 'Binary Search', stems: ['Boundary Search', 'Rotated Lookup', 'Answer Search', 'Peak Finder'] },
  { topic: 'Linked List', stems: ['List Reversal', 'Cycle Check', 'Node Merge', 'Pointer Walk'] },
  { topic: 'Trees', stems: ['Tree Traversal', 'Path Sum', 'Subtree Check', 'Tree Builder'] },
  { topic: 'Tries', stems: ['Prefix Dictionary', 'Word Paths', 'Trie Search', 'Autocomplete'] },
  { topic: 'Heap / Priority Queue', stems: ['Top K Items', 'Priority Merge', 'Running Median', 'Heap Scheduler'] },
  { topic: 'Backtracking', stems: ['Choice Builder', 'Board Search', 'Subset Explorer', 'Path Generator'] },
  { topic: 'Graphs', stems: ['Graph Walk', 'Component Count', 'Route Finder', 'Island Mapper'] },
  { topic: 'Advanced Graphs', stems: ['Weighted Routes', 'Union Find', 'Network Flow', 'Dependency Order'] },
  { topic: '1-D Dynamic Programming', stems: ['Step Planner', 'Sequence Memory', 'Robust Stairs', 'State Compression'] },
  { topic: '2-D Dynamic Programming', stems: ['Grid Planner', 'Matrix Paths', 'Two-Row Memory', 'Table States'] },
  { topic: 'Greedy', stems: ['Local Choice', 'Schedule Builder', 'Reachability Plan', 'Resource Split'] },
  { topic: 'Intervals', stems: ['Interval Sweep', 'Room Planner', 'Range Merge', 'Meeting Calendar'] },
  { topic: 'Math & Geometry', stems: ['Coordinate Scan', 'Shape Measure', 'Number Pattern', 'Grid Geometry'] },
  { topic: 'Bit Manipulation', stems: ['Bit Counter', 'Mask Builder', 'XOR Pairing', 'Binary State'] },
];

const generatedCatalog: Problem[] = Array.from({ length: 494 }, (_, index) => {
  const blueprint = catalogTopics[index % catalogTopics.length];
  const variant = Math.floor(index / catalogTopics.length) + 1;
  const id = index + seedProblems.length + 1;
  const difficulty: Difficulty = index % 7 < 3 ? 'Easy' : index % 7 < 6 ? 'Medium' : 'Hard';
  const stem = blueprint.stems[index % blueprint.stems.length];
  return {
    id,
    title: `${stem} ${variant}`,
    difficulty,
    topic: blueprint.topic,
    description: `Practice the ${blueprint.topic.toLowerCase()} pattern by designing a clear solution for ${stem.toLowerCase()} on a compact input.`,
    examples: [
      { input: `sample = [${(id % 4) + 1}, ${((id + 2) % 7) + 1}]`, output: 'a valid result for the sample' },
      { input: 'sample = []', output: 'the neutral result for an empty input' },
    ],
    constraints: ['Use a solution that scales with the input size.', 'Keep the returned value deterministic for every valid input.'],
    starterCode: `function solve(input: unknown): unknown {\n  // Build your ${blueprint.topic.toLowerCase()} solution here\n}`,
    functionSignature: 'solve(input: unknown) → unknown',
    tags: [blueprint.topic.toLowerCase(), difficulty.toLowerCase(), 'practice'],
    testCases: ['small input', 'empty input', 'repeated values', 'boundary input'],
  };
});

const problems: Problem[] = [...seedProblems, ...generatedCatalog];

const initialSubmissions: Submission[] = [
  { id: 100, problemId: 1, problemTitle: 'Balanced Brackets', status: 'Accepted', timeComplexity: 'O(n)', spaceComplexity: 'O(n)', score: 96, approach: 'Used a stack to pair each closing bracket with its opener.', createdAt: 'Today, 9:42 AM', attemptNumber: 2 },
  { id: 99, problemId: 4, problemTitle: 'Longest Substring Without Repeats', status: 'Needs review', timeComplexity: 'O(n)', spaceComplexity: 'O(k)', score: 78, approach: 'Sliding window is on the right track; revisit when the left pointer should move.', createdAt: 'Yesterday, 6:18 PM', attemptNumber: 1 },
  { id: 98, problemId: 3, problemTitle: 'Merge Intervals', status: 'Accepted', timeComplexity: 'O(n log n)', spaceComplexity: 'O(n)', score: 91, approach: 'Sorted by start and merged into the last interval when ranges touched.', createdAt: 'Mon, 4:05 PM', attemptNumber: 1 },
  { id: 97, problemId: 2, problemTitle: 'First Repeated Character', status: 'Wrong answer', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', score: 52, approach: 'The scan returns the most recent duplicate rather than the first duplicate.', createdAt: 'Sun, 11:30 AM', attemptNumber: 1 },
];

const navItems = [
  { href: '/', label: 'Overview', icon: HomeIcon },
  { href: '/problems', label: 'Problem library', icon: LibraryBig },
  { href: '/daily', label: 'Daily ritual', icon: Sparkles },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/submissions', label: 'Submissions', icon: History },
  { href: '/assistant', label: 'Study assistant', icon: Bot },
];

function cn(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(' '); }
function formatCurrentDate() {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
}

function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('quietbyte-theme') === 'dark');
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 30000 } });
  const activeHref = location === '/' ? '/' : navItems.find((item) => location.startsWith(item.href) && item.href !== '/')?.href;
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); window.localStorage.setItem('quietbyte-theme', dark ? 'dark' : 'light'); }, [dark]);
  const toggleTheme = () => { setDark((value) => !value); };
  return (
    <div className="noise app-shell min-h-[100dvh] text-foreground">
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-[256px] flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 transition-transform duration-300 md:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between">
          <Link href="/" data-testid="link-brand" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-primary text-primary-foreground shadow-sm"><GitBranch size={21} strokeWidth={2.3} /></span>
            <span><span className="serif block text-[19px] font-bold leading-none tracking-[-.03em]">v3r<span className="text-accent">tex</span></span><span className="mono mt-1 block text-[9px] uppercase tracking-[.2em] text-muted-foreground">dsa practice lab</span></span>
          </Link>
          <button className="rounded-md p-1 text-muted-foreground md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X size={18} /></button>
        </div>
        <div className="mt-11">
          <p className="eyebrow mb-3 px-3">Your workspace</p>
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors', activeHref === href ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}>
                <Icon size={17} strokeWidth={activeHref === href ? 2.4 : 1.8} /><span>{label}</span>{href === '/daily' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto">
          <div className="mb-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4">
            <div className="flex items-center justify-between"><span className="eyebrow text-sidebar-foreground/60">Current rhythm</span><Flame size={15} className="text-accent" /></div>
            <p className="serif mt-3 text-[25px] font-bold text-sidebar-foreground">7 days</p>
            <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/60">A little practice, kept warm.</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sidebar-border"><div className="bar-fill h-full w-[72%] rounded-full bg-accent" /></div>
          </div>
          <div className="flex items-center justify-between border-t border-sidebar-border pt-4">
            <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">MC</span><div><p className="text-xs font-semibold text-sidebar-foreground">Maya Chen</p><p className="text-[10px] text-sidebar-foreground/55">Steady learner</p></div></div>
            <button aria-label="Toggle theme" onClick={toggleTheme} data-testid="button-toggle-theme" className="rounded-lg p-2 text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground">{dark ? <Sun size={15} /> : <Moon size={15} />}</button>
          </div>
        </div>
      </aside>
      <div className="md:pl-[256px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/80 px-5 backdrop-blur-md md:px-10">
          <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden" data-testid="button-open-menu"><Menu size={20} /></button><div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{health?.status === 'ok' ? 'Your workspace is synced' : 'Local-first workspace'}</div></div>
          <div className="flex items-center gap-2"><button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted" data-testid="button-notifications"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" /></button><Link href="/assistant" data-testid="link-header-assistant" className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:border-primary/40 sm:flex"><MessageCircle size={14} className="text-primary" /> Ask a question</Link></div>
        </header>
        <main className="page-enter mx-auto max-w-[1440px] px-5 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">{eyebrow}</p><h1 className="serif mt-1 text-[32px] font-bold tracking-[-.035em] md:text-[40px]">{title}</h1>{copy && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{copy}</p>}</div>{action}</div>;
}

function DifficultyPill({ level }: { level: Difficulty }) {
  return <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide', level === 'Easy' ? 'bg-primary/10 text-primary' : level === 'Medium' ? 'bg-[hsl(var(--chart-3)/.18)] text-[hsl(var(--chart-3))]' : 'bg-accent/20 text-[hsl(8_49%_42%)]')}>{level}</span>;
}

function StatCard({ label, value, caption, icon: Icon, tone = 'primary' }: { label: string; value: string; caption: string; icon: typeof Flame; tone?: 'primary' | 'accent' | 'gold' }) {
  return <div className="paper-card rounded-2xl p-5"><div className="flex items-start justify-between"><p className="eyebrow">{label}</p><span className={cn('rounded-lg p-2', tone === 'accent' ? 'bg-accent/20 text-[hsl(8_49%_42%)]' : tone === 'gold' ? 'bg-[hsl(var(--chart-3)/.18)] text-[hsl(var(--chart-3))]' : 'bg-primary/10 text-primary')}><Icon size={16} /></span></div><p className="serif mt-4 text-[30px] font-bold leading-none">{value}</p><p className="mt-2 text-xs text-muted-foreground">{caption}</p></div>;
}

function HomePage({ solvedIds, submissions }: { solvedIds: number[]; submissions: Submission[] }) {
  const daily = problems[2];
  const topicProgress = [{ name: 'Arrays & strings', solved: 12, total: 18, color: 'bg-primary' }, { name: 'Trees & graphs', solved: 8, total: 16, color: 'bg-[hsl(var(--chart-4))]' }, { name: 'Dynamic programming', solved: 4, total: 12, color: 'bg-accent' }, { name: 'Stacks & queues', solved: 9, total: 11, color: 'bg-[hsl(var(--chart-3))]' }];
  return <div>
    <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="eyebrow">{formatCurrentDate()}</p><h1 className="serif mt-2 text-[42px] font-bold leading-[1.02] tracking-[-.05em] md:text-[58px]">Make room for<br /><span className="text-primary">one good problem.</span></h1><p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">Welcome back, Maya. Your progress is not a race — it is a trail of small, repeatable choices.</p></div><Link href="/daily" data-testid="link-continue-daily" className="group flex w-fit items-center gap-3 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_7px_20px_hsl(var(--primary)/.2)] transition-transform hover:-translate-y-0.5">Continue today <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link></div>
    <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Current streak" value="7 days" caption="Best: 12 days this month" icon={Flame} tone="accent" /><StatCard label="Solved this month" value={`${Math.max(18, solvedIds.length + 18)}`} caption="4 more than last month" icon={CheckCircle2} /><StatCard label="Focus time" value="6h 42m" caption="Across 23 practice sessions" icon={Clock3} tone="gold" /></div>
    <div className="mt-10 grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
      <section className="paper-card relative overflow-hidden rounded-2xl p-6 md:p-8"><div className="absolute -right-8 -top-12 h-44 w-44 rounded-full border-[22px] border-accent/15" /><div className="flex items-center justify-between"><div><p className="eyebrow">Today’s invitation</p><h2 className="serif mt-2 text-2xl font-bold">A gentle warm-up</h2></div><span className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-bold text-muted-foreground">10–15 min</span></div><div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><DifficultyPill level={daily.difficulty} /><span className="text-xs text-muted-foreground">{daily.topic}</span></div><h3 className="mt-3 text-xl font-bold">{daily.title}</h3><p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{daily.description}</p></div><Link href={`/problem/${daily.id}`} data-testid="link-daily-problem" className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10">Open problem <ArrowRight size={15} /></Link></div><div className="mt-7 flex items-center gap-3 border-t border-border/70 pt-5"><div className="flex -space-x-1.5">{['AL', 'JR', 'SK'].map((initials) => <span key={initials} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-secondary text-[9px] font-bold text-secondary-foreground">{initials}</span>)}</div><p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">82 learners</span> made time for this one today</p></div></section>
      <section className="rounded-2xl bg-[hsl(var(--primary))] p-6 text-primary-foreground shadow-[0_12px_35px_hsl(var(--primary)/.2)]"><div className="flex items-center justify-between"><p className="eyebrow text-primary-foreground/65">Your level</p><Trophy size={20} className="text-[hsl(var(--chart-3))]" /></div><p className="serif mt-8 text-[42px] font-bold leading-none">Sprout</p><p className="mt-3 max-w-[240px] text-sm leading-relaxed text-primary-foreground/70">You are building reliable instincts. Keep showing up for the patterns that feel almost familiar.</p><div className="mt-9 flex items-end justify-between text-xs"><span className="text-primary-foreground/70">1,240 / 1,500 XP</span><span className="font-bold text-[hsl(var(--chart-3))]">260 to Canopy</span></div><div className="mt-2 h-2 rounded-full bg-primary-foreground/15"><div className="bar-fill h-full w-[82%] rounded-full bg-[hsl(var(--chart-3))]" /></div></section>
    </div>
    <div className="mt-10 grid gap-6 xl:grid-cols-[1fr_1fr]">
      <section className="paper-card rounded-2xl p-6"><div className="flex items-end justify-between"><div><p className="eyebrow">Practice map</p><h2 className="serif mt-1 text-2xl font-bold">Topic progress</h2></div><Link href="/progress" className="text-xs font-semibold text-primary hover:underline" data-testid="link-view-progress">View all</Link></div><div className="mt-6 space-y-5">{topicProgress.map((item) => <div key={item.name}><div className="mb-2 flex justify-between text-xs"><span className="font-semibold">{item.name}</span><span className="mono text-muted-foreground">{item.solved}/{item.total}</span></div><div className="h-2 rounded-full bg-muted"><div className={cn('bar-fill h-full rounded-full', item.color)} style={{ width: `${(item.solved / item.total) * 100}%` }} /></div></div>)}</div></section>
      <section className="paper-card rounded-2xl p-6"><div className="flex items-end justify-between"><div><p className="eyebrow">Latest notes</p><h2 className="serif mt-1 text-2xl font-bold">Recent submissions</h2></div><Link href="/submissions" className="text-xs font-semibold text-primary hover:underline" data-testid="link-view-submissions">View history</Link></div><div className="mt-4 divide-y divide-border/70">{submissions.slice(0, 3).map((submission) => <SubmissionRow key={submission.id} submission={submission} />)}</div></section>
    </div>
  </div>;
}

function SubmissionRow({ submission }: { submission: Submission }) {
  return <Link href={`/problem/${submission.problemId}`} data-testid={`link-submission-${submission.id}`} className="flex items-center gap-3 py-4 transition-colors hover:bg-muted/40"><span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', submission.status === 'Accepted' ? 'bg-primary/10 text-primary' : submission.status === 'Needs review' ? 'bg-[hsl(var(--chart-3)/.18)] text-[hsl(var(--chart-3))]' : 'bg-destructive/10 text-destructive')}>{submission.status === 'Accepted' ? <Check size={15} /> : submission.status === 'Needs review' ? <Lightbulb size={15} /> : <RotateCcw size={14} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{submission.problemTitle}</span><span className="mt-1 block text-[11px] text-muted-foreground">{submission.createdAt} · attempt {submission.attemptNumber}</span></span><span className="text-right"><span className={cn('block text-xs font-bold', submission.status === 'Accepted' ? 'text-primary' : submission.status === 'Needs review' ? 'text-[hsl(var(--chart-3))]' : 'text-destructive')}>{submission.status}</span><span className="mono mt-1 block text-[10px] text-muted-foreground">{submission.score}/100</span></span></Link>;
}

function ProblemsPage({ solvedIds }: { solvedIds: number[] }) {
  const [search, setSearch] = useState(''); const [topic, setTopic] = useState('All topics'); const [difficulty, setDifficulty] = useState('All levels'); const [status, setStatus] = useState('All status'); const [sort, setSort] = useState('Roadmap order'); const [showFilters, setShowFilters] = useState(false);
  const [, setLocation] = useLocation();
  const attemptedIds = initialSubmissions.map((submission) => submission.problemId);
  const filtered = problems.filter((problem) => (problem.title.toLowerCase().includes(search.toLowerCase()) || problem.topic.toLowerCase().includes(search.toLowerCase()) || problem.tags.some((tag) => tag.includes(search.toLowerCase()))) && (topic === 'All topics' || problem.topic === topic) && (difficulty === 'All levels' || problem.difficulty === difficulty) && (status === 'All status' || (status === 'Solved' && solvedIds.includes(problem.id)) || (status === 'Unsolved' && !solvedIds.includes(problem.id)) || (status === 'Attempted' && attemptedIds.includes(problem.id)))).sort((a, b) => sort === 'Title' ? a.title.localeCompare(b.title) : sort === 'Difficulty' ? ['Easy', 'Medium', 'Hard'].indexOf(a.difficulty) - ['Easy', 'Medium', 'Hard'].indexOf(b.difficulty) : a.id - b.id);
  const randomProblem = () => { const candidate = filtered[Math.floor(Math.random() * Math.max(filtered.length, 1))] ?? problems[0]; setLocation(`/problem/${candidate.id}`); };
  return <div><SectionHeading eyebrow="Problem library" title="A shelf of good problems." copy="Choose a pattern, settle in, and let the first few minutes be about noticing." action={<span className="mono text-xs text-muted-foreground">{filtered.length} of {problems.length} problems</span>} />
    <div className="mb-5 flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, topic, or pattern..." data-testid="input-search-problems" className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground/70 focus:ring-4" /></div><button onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted"><SlidersHorizontal size={16} /> Filters <ChevronDown size={15} className={cn('transition-transform', showFilters && 'rotate-180')} /></button><button onClick={randomProblem} data-testid="button-random-problem" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-105"><Sparkles size={15} /> Surprise me</button></div>
    {showFilters && <div className="mb-5 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4"><FilterSelect label="Topic" value={topic} options={['All topics', ...Array.from(new Set(problems.map((item) => item.topic)))]} onChange={setTopic} /><FilterSelect label="Level" value={difficulty} options={['All levels', 'Easy', 'Medium', 'Hard']} onChange={setDifficulty} /><FilterSelect label="Status" value={status} options={['All status', 'Solved', 'Unsolved', 'Attempted']} onChange={setStatus} /><FilterSelect label="Sort" value={sort} options={['Roadmap order', 'Title', 'Difficulty']} onChange={setSort} /><button onClick={() => { setTopic('All topics'); setDifficulty('All levels'); setStatus('All status'); setSort('Roadmap order'); setSearch(''); }} className="mt-auto h-9 px-2 text-xs font-semibold text-primary hover:underline" data-testid="button-clear-filters">Clear filters</button></div>}
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_35px_hsl(30_22%_26%/.04)]"><div className="hidden grid-cols-[1.5fr_.65fr_.75fr_1.1fr_auto] gap-4 border-b border-border bg-muted/45 px-5 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground md:grid"><span>Problem</span><span>Level</span><span>Topic</span><span>Patterns</span><span /></div>{filtered.map((problem) => <Link href={`/problem/${problem.id}`} key={problem.id} data-testid={`link-problem-${problem.id}`} className="grid gap-3 border-b border-border/70 px-5 py-5 transition-colors last:border-0 hover:bg-muted/35 md:grid-cols-[1.5fr_.65fr_.75fr_1.1fr_auto] md:items-center md:gap-4"><div className="flex items-center gap-3"><span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', solvedIds.includes(problem.id) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>{solvedIds.includes(problem.id) ? <Check size={15} /> : <span className="mono text-[10px]">{String(problem.id).padStart(2, '0')}</span>}</span><span><span className="block text-sm font-bold">{problem.title}</span><span className="mt-1 block text-xs text-muted-foreground md:hidden">{problem.topic} · {problem.tags.slice(0, 2).join(' · ')}</span></span></div><span><DifficultyPill level={problem.difficulty} /></span><span className="hidden text-xs text-muted-foreground md:block">{problem.topic}</span><span className="hidden gap-1.5 md:flex">{problem.tags.slice(0, 2).map((tag) => <span key={tag} className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">{tag}</span>)}</span><ArrowRight size={16} className="hidden text-muted-foreground md:block" /></Link>)}{filtered.length === 0 && <div className="px-6 py-16 text-center"><Search className="mx-auto text-muted-foreground" size={24} /><h3 className="serif mt-3 text-xl font-bold">Nothing on this shelf</h3><p className="mt-1 text-sm text-muted-foreground">Try a different phrase or clear your filters.</p></div>}</div>
  </div>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return <label className="flex min-w-[170px] flex-1 flex-col gap-1.5"><span className="eyebrow text-[9px]">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} data-testid={`select-${label.toLowerCase()}`} className="h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/30">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

type EditorLanguage = 'C++' | 'Java' | 'Python' | 'JavaScript';
const editorLanguages: EditorLanguage[] = ['C++', 'Java', 'Python', 'JavaScript'];

function starterFor(problem: Problem, language: EditorLanguage) {
  const starters: Record<number, Record<EditorLanguage, string>> = {
    1: {
      'C++': `class Solution {
public:
    bool isBalanced(string s) {
        // Your solution here
    }
};`,
      Java: `class Solution {
    public boolean isBalanced(String s) {
        // Your solution here
    }
}`,
      Python: `class Solution:
    def is_balanced(self, s: str) -> bool:
        # Your solution here
        pass`,
      JavaScript: `function isBalanced(s) {
  // Your solution here
}`,
    },
    2: {
      'C++': `class Solution {
public:
    char firstRepeat(string s) {
        // Your solution here
    }
};`,
      Java: `class Solution {
    public char firstRepeat(String s) {
        // Your solution here
    }
}`,
      Python: `class Solution:
    def first_repeat(self, s: str) -> str:
        # Your solution here
        pass`,
      JavaScript: `function firstRepeat(s) {
  // Your solution here
}`,
    },
    3: {
      'C++': `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        // Your solution here
    }
};`,
      Java: `class Solution {
    public int[][] merge(int[][] intervals) {
        // Your solution here
    }
}`,
      Python: `class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        # Your solution here
        pass`,
      JavaScript: `function merge(intervals) {
  // Your solution here
}`,
    },
    4: {
      'C++': `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Your solution here
    }
};`,
      Java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Your solution here
    }
}`,
      Python: `class Solution:
    def length_of_longest(self, s: str) -> int:
        # Your solution here
        pass`,
      JavaScript: `function lengthOfLongestSubstring(s) {
  // Your solution here
}`,
    },
    5: {
      'C++': `class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        // Your solution here
    }
};`,
      Java: `class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        // Your solution here
    }
}`,
      Python: `class Solution:
    def level_order(self, root: TreeNode | None) -> list[list[int]]:
        # Your solution here
        pass`,
      JavaScript: `function levelOrder(root) {
  // Your solution here
}`,
    },
    6: {
      'C++': `class Solution {
public:
    int minCoins(vector<int>& coins, int amount) {
        // Your solution here
    }
};`,
      Java: `class Solution {
    public int minCoins(int[] coins, int amount) {
        // Your solution here
    }
}`,
      Python: `class Solution:
    def min_coins(self, coins: list[int], amount: int) -> int:
        # Your solution here
        pass`,
      JavaScript: `function minCoins(coins, amount) {
  // Your solution here
}`,
    },
  };
  return starters[problem.id]?.[language] ?? {
    'C++': `class Solution {
public:
    auto solve(/* input */) {
        // Build your ${problem.topic.toLowerCase()} solution here
    }
};`,
    Java: `class Solution {
    public Object solve(Object input) {
        // Build your ${problem.topic.toLowerCase()} solution here
        return null;
    }
}`,
    Python: `class Solution:
    def solve(self, input):
        # Build your ${problem.topic.toLowerCase()} solution here
        pass`,
    JavaScript: `function solve(input) {
  // Build your ${problem.topic.toLowerCase()} solution here
}`,
  }[language];
}

function editorFilename(language: EditorLanguage) {
  return language === 'Java' ? 'Solution.java' : language === 'C++' ? 'solution.cpp' : language === 'Python' ? 'solution.py' : 'solution.js';
}

function editorIndent(language: EditorLanguage) {
  return language === 'Python' || language === 'JavaScript' ? '  ' : '    ';
}

function handleEditorIndentation(event: KeyboardEvent, editor: HTMLTextAreaElement, code: string, language: EditorLanguage, setCode: (value: string) => void) {
  if (event.metaKey || event.ctrlKey || (event.altKey && event.key !== 'Tab')) return;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const unit = editorIndent(language);

  const updateSelection = (indent: boolean) => {
    const lineStart = code.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const lineEndIndex = code.indexOf('\n', end);
    const lineEnd = lineEndIndex === -1 ? code.length : lineEndIndex;
    const selected = code.slice(lineStart, lineEnd);
    const lines = selected.split('\n');
    const transformed = lines.map((line) => {
      if (indent) return unit + line;
      if (line.startsWith('\t')) return line.slice(1);
      if (line.startsWith(unit)) return line.slice(unit.length);
      return line.replace(/^ +/, (spaces) => spaces.slice(Math.min(unit.length, spaces.length)));
    }).join('\n');
    const next = code.slice(0, lineStart) + transformed + code.slice(lineEnd);
    event.preventDefault();
    setCode(next);
    requestAnimationFrame(() => editor.setSelectionRange(lineStart, lineStart + transformed.length));
  };

  if (event.key === 'Tab') {
    if (start === end && event.shiftKey) {
      const lineStart = code.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      const line = code.slice(lineStart, start);
      const removeLength = line.startsWith('\t') ? 1 : line.startsWith(unit) ? unit.length : Math.min(unit.length, (line.match(/^ +/)?.[0].length ?? 0));
      if (!removeLength) return;
      const next = code.slice(0, lineStart) + code.slice(lineStart + removeLength);
      event.preventDefault();
      setCode(next);
      requestAnimationFrame(() => editor.setSelectionRange(Math.max(lineStart, start - removeLength), Math.max(lineStart, start - removeLength)));
      return;
    }
    if (start === end) {
      const next = code.slice(0, start) + unit + code.slice(start);
      event.preventDefault();
      setCode(next);
      requestAnimationFrame(() => editor.setSelectionRange(start + unit.length, start + unit.length));
      return;
    }
    updateSelection(!event.shiftKey);
    return;
  }

  if (event.key === 'Enter' && start === end) {
    const lineStart = code.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const currentLine = code.slice(lineStart, start);
    const leading = currentLine.match(/^[\t ]*/)?.[0] ?? '';
    const extra = /[{:]\s*$/.test(currentLine.trimEnd()) ? unit : '';
    const next = code.slice(0, start) + '\n' + leading + extra + code.slice(end);
    event.preventDefault();
    setCode(next);
    const caret = start + 1 + leading.length + extra.length;
    requestAnimationFrame(() => editor.setSelectionRange(caret, caret));
  }
}

function InEditorAssistant({ problem, code }: { problem: Problem; code: string }) {
  const [message, setMessage] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string }>>([
    { role: 'assistant', text: `I’m looking at ${problem.title} with you. Ask about the approach, an edge case, or a line of code — I’ll nudge without taking the keyboard away.` },
  ]);
  const [provider, setProvider] = useState<AiChatResponse['provider'] | null>(null);
  const sendChat = useSendAiChat();
  const prompts = ['What should I notice first?', 'Can you review this approach?', 'Give me a stronger hint'];

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sendChat.isPending) return;
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setMessage('');
    const nextHintLevel = Math.min(3, hintLevel + 1);
    sendChat.mutate(
      { data: { message: trimmed, hintLevel: nextHintLevel, problemTitle: problem.title, problemTopic: problem.topic, code } },
      {
        onSuccess: (response) => {
          setProvider(response.provider);
          setHintLevel(response.hintLevel);
          setMessages((current) => [...current, { role: 'assistant', text: response.reply }]);
        },
        onError: () => setMessages((current) => [...current, { role: 'assistant', text: 'I lost the thread for a moment. Try again — your code is still right here.' }]),
      },
    );
  };

  return (
    <div className="border-t border-white/10 bg-[hsl(220_20%_13%)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Bot size={15} className="text-[hsl(var(--accent))]" />
        <span className="text-xs font-semibold text-white/85">Ask v3rtex AI</span>
        <span className="text-[10px] text-white/40">{provider ? `· ${provider}` : '· code-aware hints'}</span>
        <span className="ml-auto rounded-full bg-white/8 px-2 py-1 text-[9px] text-white/45">hint {hintLevel}/3</span>
      </div>
      <div className="max-h-52 space-y-3 overflow-y-auto px-4 py-3">
        {messages.slice(-4).map((item, index) => (
          <div key={`${item.role}-${index}`} className={cn('flex gap-2 text-xs leading-relaxed', item.role === 'user' && 'flex-row-reverse')}>
            <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', item.role === 'assistant' ? 'bg-primary/20 text-[hsl(var(--accent))]' : 'bg-white/10 text-white/70')}>{item.role === 'assistant' ? <Bot size={12} /> : <UserRound size={12} />}</span>
            <p className={cn('max-w-[84%] rounded-xl px-3 py-2', item.role === 'assistant' ? 'bg-white/6 text-white/70' : 'bg-primary text-primary-foreground')}>{item.text}</p>
          </div>
        ))}
        {sendChat.isPending && <div className="flex items-center gap-2 text-[11px] text-white/45"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--accent))]" />Thinking beside you…</div>}
      </div>
      <div className="border-t border-white/10 px-4 py-3">
        {messages.length === 1 && <div className="mb-2 flex flex-wrap gap-1.5">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => send(prompt)} className="rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] text-white/55 hover:border-[hsl(var(--accent)/.55)] hover:text-white/85">{prompt}</button>)}</div>}
        <form onSubmit={(event) => { event.preventDefault(); send(message); }} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/15 p-1.5 focus-within:border-[hsl(var(--accent)/.55)]">
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about this solution…" className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-xs text-white outline-none placeholder:text-white/30" />
          <button type="submit" disabled={!message.trim() || sendChat.isPending} className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-35"><Send size={13} /></button>
        </form>
      </div>
    </div>
  );
}

function ProblemPage({ onSubmit, solvedIds, submissions }: { onSubmit: (problem: Problem, code: string, status: Submission['status']) => void; solvedIds: number[]; submissions: Submission[] }) {
  const params = useParams<{ id: string }>();
  const problem = problems.find((item) => item.id === Number(params.id));
  const [, setLocation] = useLocation();
  const [language, setLanguage] = useState<EditorLanguage>('C++');
  const [codeByLanguage, setCodeByLanguage] = useState<Record<string, string>>(() => {
    if (!problem) return {} as Record<string, string>;
    return { 'C++': starterFor(problem, 'C++') } as Record<string, string>;
  });
  const [activeTab, setActiveTab] = useState<'problem' | 'hints' | 'history'>('problem');
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [runState, setRunState] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [hintLevel, setHintLevel] = useState(0);
  const [analysis, setAnalysis] = useState<{ score: number; time: string; space: string; reaction: string; approach: string } | null>(null);
  const updateCode = (value: string) => setCodeByLanguage((current) => ({ ...current, [language]: value }));

  useEffect(() => {
    if (!problem) return;
    const editor = document.querySelector<HTMLTextAreaElement>('[data-testid="textarea-code-editor"]');
    if (!editor) return;
    const onKeyDown = (event: KeyboardEvent) => handleEditorIndentation(event, editor, codeByLanguage[language] ?? starterFor(problem, language), language, updateCode);
    editor.addEventListener('keydown', onKeyDown);
    return () => editor.removeEventListener('keydown', onKeyDown);
  }, [problem, language, codeByLanguage, updateCode]);

  if (!problem) return <EmptyPage title="Problem not found" copy="This problem may have moved off the shelf." action={<Link href="/problems" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="link-back-library">Back to library</Link>} />;
  const code = codeByLanguage[language] ?? starterFor(problem, language);
  const history = submissions.filter((submission) => submission.problemId === problem.id);
  const setCode = (value: string) => setCodeByLanguage((current) => ({ ...current, [language]: value }));
  const selectLanguage = (next: EditorLanguage) => {
    setLanguage(next);
    setCodeByLanguage((current) => current[next] ? current : ({ ...current, [next]: starterFor(problem, next) }));
    setAnalysis(null);
    setRunState('idle');
  };
  const run = () => {
    setRunState('running');
    setConsoleOpen(true);
    window.setTimeout(() => setRunState(code.includes('return') || code.includes('return ') ? 'passed' : 'failed'), 650);
  };
  const submit = () => {
    const correct = code.includes('return') || code.includes('return ');
    const inefficient = (code.match(/\b(for|while)\b/g) ?? []).length > 1;
    const status: Submission['status'] = correct ? inefficient ? 'Needs review' : 'Accepted' : 'Wrong answer';
    const score = correct ? inefficient ? 78 : 94 : 42;
    setAnalysis({ score, time: inefficient ? 'O(n²)' : 'O(n)', space: 'O(n)', reaction: correct ? inefficient ? 'Good first pass. Now make the hot path lighter.' : 'That was beautiful work.' : 'Almost there. Read the failing case once more, then try again.', approach: inefficient ? 'Nested iteration detected. Consider storing context so the inner lookup becomes constant time.' : 'A focused pass through the input with a small amount of remembered state.' });
    onSubmit(problem, code, status);
    setConsoleOpen(true);
    setRunState(correct ? 'passed' : 'failed');
  };

  return <div className="-mx-5 -my-8 flex min-h-[calc(100dvh-72px)] flex-col md:-mx-10 md:-my-10 lg:flex-row">
    <section className="w-full border-b border-border bg-card px-5 py-7 lg:w-[44%] lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
      <button onClick={() => setLocation('/problems')} data-testid="button-back-problems" className="mb-7 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><ChevronLeft size={15} /> Problem library</button>
      <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><DifficultyPill level={problem.difficulty} /><span className="text-xs text-muted-foreground">{problem.topic}</span>{solvedIds.includes(problem.id) && <span className="flex items-center gap-1 text-[10px] font-bold text-primary"><CheckCircle2 size={13} /> Solved</span>}</div><h1 className="serif mt-3 text-[32px] font-bold leading-tight tracking-[-.035em]">{problem.title}</h1><p className="mono mt-2 text-xs text-muted-foreground">{problem.functionSignature}</p></div><button className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" data-testid="button-bookmark-problem"><BookOpen size={16} /></button></div>
      <div className="mt-7 flex border-b border-border"><button onClick={() => setActiveTab('problem')} data-testid="tab-problem" className={cn('mr-5 border-b-2 px-1 pb-3 text-xs font-bold', activeTab === 'problem' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>Problem</button><button onClick={() => setActiveTab('hints')} data-testid="tab-hints" className={cn('mr-5 border-b-2 px-1 pb-3 text-xs font-bold', activeTab === 'hints' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>Hints <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px]">{hintLevel}/3</span></button><button onClick={() => setActiveTab('history')} data-testid="tab-history" className={cn('border-b-2 px-1 pb-3 text-xs font-bold', activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>History</button></div>
      {activeTab === 'problem' && <div className="space-y-7 pt-7 text-sm leading-relaxed"><div><p>{problem.description}</p></div><div><p className="eyebrow mb-3">Examples</p><div className="space-y-3">{problem.examples.map((example, index) => <div key={index} className="rounded-xl border border-border bg-muted/35 p-4"><p className="mono text-xs"><span className="text-muted-foreground">Input</span> {example.input}</p><p className="mono mt-2 text-xs"><span className="text-muted-foreground">Output</span> {example.output}</p>{example.note && <p className="mt-2 text-xs text-muted-foreground">{example.note}</p>}</div>)}</div></div><div><p className="eyebrow mb-3">Constraints</p><ul className="space-y-2 text-xs text-muted-foreground">{problem.constraints.map((constraint) => <li key={constraint} className="flex gap-2"><span className="text-primary">•</span>{constraint}</li>)}</ul></div><div className="flex flex-wrap gap-2">{problem.tags.map((tag) => <span key={tag} className="rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold text-muted-foreground">#{tag}</span>)}</div></div>}
      {activeTab === 'hints' && <div className="space-y-3 pt-7">{[0, 1, 2].map((level) => <button key={level} onClick={() => setHintLevel(Math.max(hintLevel, level + 1))} className="flex w-full items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left hover:border-primary/35"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Lightbulb size={14} /></span><span><span className="block text-xs font-bold">Hint {level + 1}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{level === 0 ? 'What information would help you decide whether a closing bracket matches?' : level === 1 ? 'Try remembering only the unmatched opening brackets, in order.' : 'A last-in-first-out structure mirrors the order that brackets must close.'}</span></span></button>)}</div>}
      {activeTab === 'history' && <div className="space-y-3 pt-7">{history.length ? history.map((item) => <div key={item.id} className="rounded-xl border border-border bg-muted/30 p-4"><div className="flex items-center justify-between"><span className={cn('text-xs font-bold', item.status === 'Accepted' ? 'text-primary' : item.status === 'Wrong answer' ? 'text-destructive' : 'text-[hsl(var(--chart-3))]')}>{item.status}</span><span className="mono text-[10px] text-muted-foreground">{item.createdAt}</span></div><p className="mt-2 text-xs text-muted-foreground">{item.timeComplexity} time · {item.spaceComplexity} space · {item.score}/100</p></div>) : <p className="pt-4 text-sm text-muted-foreground">No attempts yet. Your first run will appear here.</p>}</div>}
    </section>
    <section className="flex min-h-[680px] flex-1 flex-col bg-[hsl(220_20%_16%)] text-[hsl(40_30%_94%)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-5"><div className="flex items-center gap-2"><Code2 size={16} className="text-[hsl(var(--accent))]" /><span className="mono text-[11px] text-white/65">{editorFilename(language)}</span><select value={language} onChange={(event) => selectLanguage(event.target.value as EditorLanguage)} data-testid="select-language" className="rounded bg-white/10 px-2 py-1 text-[10px] text-white/75 outline-none"><option className="bg-[hsl(220_20%_16%)]">C++</option><option className="bg-[hsl(220_20%_16%)]">Java</option><option className="bg-[hsl(220_20%_16%)]">Python</option><option className="bg-[hsl(220_20%_16%)]">JavaScript</option></select><span className="hidden rounded bg-emerald-400/10 px-2 py-1 text-[9px] text-emerald-300 sm:inline">LeetCode-style editor</span></div><button onClick={() => { setCodeByLanguage((current) => ({ ...current, [language]: starterFor(problem, language) })); setAnalysis(null); setRunState('idle'); }} data-testid="button-reset-code" className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white"><RotateCcw size={13} /> Reset</button></div>
      <div className="relative flex flex-1 flex-col"><div className="relative flex-1"><div className="pointer-events-none absolute left-0 top-0 w-10 select-none border-r border-white/5 py-5 text-right mono text-[11px] leading-[1.7] text-white/20">{code.split('\n').map((_, index) => <div key={index} className="pr-3">{index + 1}</div>)}</div><textarea value={code} onChange={(event) => setCode(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); event.shiftKey ? submit() : run(); } }} data-testid="textarea-code-editor" spellCheck={false} aria-label={`${language} solution editor`} className="code-editor h-full min-h-[330px] w-full resize-none bg-transparent py-5 pl-14 pr-5 text-[13px] text-[hsl(40_30%_92%)] outline-none" /></div>
        {consoleOpen && <div className="border-t border-white/10 bg-black/10 px-4 py-4 md:px-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Terminal size={14} className="text-white/45" /><span className="mono text-[10px] uppercase tracking-[.12em] text-white/45">Testcase console</span></div><button onClick={() => setConsoleOpen(false)} className="text-[10px] text-white/35 hover:text-white/80">Hide</button></div><div className="mt-3 flex flex-wrap gap-2">{problem.testCases.slice(0, 3).map((testCase, index) => <span key={index} className="mono rounded bg-white/6 px-2 py-1 text-[10px] text-white/50">case {index + 1}: {testCase || 'empty'}</span>)}</div><div className="mt-3 flex items-center gap-2 text-xs">{runState === 'running' ? <><span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" /> Running against sample cases…</> : runState === 'passed' ? <><CheckCircle2 size={14} className="text-emerald-300" /> All visible cases passed</> : runState === 'failed' ? <><X size={14} className="text-rose-300" /> Check the return value and try again</> : <span className="text-white/40">Run your solution to see sample output here.</span>}</div>{analysis && <div className="mt-4 grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-3"><div><p className="eyebrow text-white/35">Quality score</p><p className="serif mt-1 text-2xl font-bold">{analysis.score}<span className="text-sm text-white/35">/100</span></p></div><div><p className="eyebrow text-white/35">Complexity</p><p className="mono mt-2 text-[11px] text-white/70">{analysis.time} · {analysis.space}</p></div><div><p className="eyebrow text-white/35">Coach note</p><p className="mt-1 text-[11px] leading-relaxed text-white/55">{analysis.reaction}</p></div></div>}</div>}
        {!consoleOpen && <button onClick={() => setConsoleOpen(true)} className="border-t border-white/10 px-5 py-3 text-left text-[11px] text-white/45 hover:text-white/80"><Terminal size={13} className="mr-2 inline" />Show testcase console</button>}
      </div>
      {assistantOpen && <InEditorAssistant problem={problem} code={code} />}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 md:px-5"><div className="flex items-center gap-3 text-[10px] text-white/35"><span><kbd className="rounded bg-white/10 px-1.5 py-0.5 text-white/55">⌘/Ctrl</kbd> + Enter to run</span><span className="hidden sm:inline"><kbd className="rounded bg-white/10 px-1.5 py-0.5 text-white/55">Shift</kbd> + Enter to submit</span></div><div className="flex items-center gap-2"><button onClick={() => setAssistantOpen((value) => !value)} className="rounded-lg border border-white/12 px-3 py-2 text-[11px] font-semibold text-white/65 hover:border-white/30 hover:text-white"><Bot size={13} className="mr-1.5 inline" />{assistantOpen ? 'Hide AI' : 'Ask AI'}</button><button onClick={run} data-testid="button-run-code" className="rounded-lg border border-white/15 px-4 py-2 text-[11px] font-bold text-white/75 hover:bg-white/8"><Play size={13} className="mr-1.5 inline" />Run</button><button onClick={submit} data-testid="button-submit-code" className="rounded-lg bg-[hsl(var(--accent))] px-4 py-2 text-[11px] font-bold text-[hsl(220_20%_16%)] hover:brightness-105"><Zap size={13} className="mr-1.5 inline" />Submit</button></div></div>
    </section>
  </div>;
}

function LegacyProblemPage({ onSubmit, solvedIds, submissions }: { onSubmit: (problem: Problem, code: string, status: Submission['status']) => void; solvedIds: number[]; submissions: Submission[] }) {
  const params = useParams<{ id: string }>(); const problem = problems.find((item) => item.id === Number(params.id)); const [, setLocation] = useLocation(); const [code, setCode] = useState(problem?.starterCode ?? ''); const [activeTab, setActiveTab] = useState<'problem' | 'hints' | 'history'>('problem'); const [consoleOpen, setConsoleOpen] = useState(false); const [runState, setRunState] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle'); const [hintLevel, setHintLevel] = useState(0); const [language, setLanguage] = useState('C++'); const [analysis, setAnalysis] = useState<{ score: number; time: string; space: string; reaction: string; approach: string } | null>(null);
  if (!problem) return <EmptyPage title="Problem not found" copy="This problem may have moved off the shelf." action={<Link href="/problems" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground" data-testid="link-back-library">Back to library</Link>} />;
  const history = submissions.filter((submission) => submission.problemId === problem.id);
  const run = () => { setRunState('running'); setConsoleOpen(true); window.setTimeout(() => setRunState(code.includes('return') ? 'passed' : 'failed'), 650); };
  const submit = () => { const correct = code.includes('return'); const inefficient = (code.match(/\b(for|while)\b/g) ?? []).length > 1; const status: Submission['status'] = correct ? inefficient ? 'Needs review' : 'Accepted' : 'Wrong answer'; const score = correct ? inefficient ? 78 : 94 : 42; setAnalysis({ score, time: inefficient ? 'O(n²)' : 'O(n)', space: 'O(n)', reaction: correct ? inefficient ? 'Okayyy, we got it. Keep polishing.' : 'That was beautiful work.' : 'Almost there. Your next pass will be stronger.', approach: inefficient ? 'Nested iteration detected. Look for a way to store context and make the inner lookup constant time.' : 'A focused pass through the input with a small amount of remembered state.' }); onSubmit(problem, code, status); setConsoleOpen(true); setRunState(correct ? 'passed' : 'failed'); };
  return <div className="-mx-5 -my-8 flex min-h-[calc(100dvh-72px)] flex-col md:-mx-10 md:-my-10 lg:flex-row">
    <section className="w-full border-b border-border bg-card px-5 py-7 lg:w-[47%] lg:border-b-0 lg:border-r lg:px-8 lg:py-8 xl:w-[46%]"><button onClick={() => setLocation('/problems')} data-testid="button-back-problems" className="mb-7 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><ChevronLeft size={15} /> Problem library</button><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><DifficultyPill level={problem.difficulty} /><span className="text-xs text-muted-foreground">{problem.topic}</span>{solvedIds.includes(problem.id) && <span className="flex items-center gap-1 text-[10px] font-bold text-primary"><CheckCircle2 size={13} /> Solved</span>}</div><h1 className="serif mt-3 text-[32px] font-bold leading-tight tracking-[-.035em]">{problem.title}</h1><p className="mono mt-2 text-xs text-muted-foreground">{problem.functionSignature}</p></div><button className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" data-testid="button-bookmark-problem"><BookOpen size={16} /></button></div><div className="mt-7 flex border-b border-border"><button onClick={() => setActiveTab('problem')} data-testid="tab-problem" className={cn('border-b-2 px-1 pb-3 mr-5 text-xs font-bold', activeTab === 'problem' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>Problem</button><button onClick={() => setActiveTab('hints')} data-testid="tab-hints" className={cn('border-b-2 px-1 pb-3 mr-5 text-xs font-bold', activeTab === 'hints' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>Hints {hintLevel > 0 && <span className="ml-1 rounded-full bg-accent/20 px-1.5 text-[9px] text-[hsl(8_49%_42%)]">{hintLevel}</span>}</button><button onClick={() => setActiveTab('history')} data-testid="tab-history" className={cn('border-b-2 px-1 pb-3 text-xs font-bold', activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>History</button></div>{activeTab === 'problem' && <div className="mt-7 space-y-7 text-sm leading-relaxed"><p className="text-foreground/80">{problem.description}</p><div><h2 className="mb-3 text-sm font-bold">Examples</h2><div className="space-y-3">{problem.examples.map((example, index) => <div key={index} className="rounded-xl bg-muted/55 p-4"><p className="eyebrow mb-2 text-[9px]">Example {index + 1}</p><p className="mono text-xs"><span className="text-muted-foreground">Input  </span>{example.input}</p><p className="mono mt-2 text-xs"><span className="text-muted-foreground">Output </span>{example.output}</p>{example.note && <p className="mt-3 text-xs italic text-muted-foreground">{example.note}</p>}</div>)}</div></div><div><h2 className="mb-3 text-sm font-bold">Constraints</h2><ul className="space-y-2 text-xs text-muted-foreground">{problem.constraints.map((constraint) => <li key={constraint} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />{constraint}</li>)}</ul></div><div className="flex flex-wrap gap-2">{problem.tags.map((tag) => <span key={tag} className="rounded-md border border-border px-2.5 py-1 text-[10px] text-muted-foreground">#{tag}</span>)}</div></div>}{activeTab === 'hints' && <HintPanel problem={problem} hintLevel={hintLevel} setHintLevel={setHintLevel} />}{activeTab === 'history' && <div className="mt-6">{history.length ? history.map((entry) => <SubmissionRow key={entry.id} submission={entry} />) : <div className="rounded-xl bg-muted/50 p-6 text-center"><History className="mx-auto text-muted-foreground" size={22} /><p className="mt-2 text-sm font-semibold">No attempts yet</p><p className="mt-1 text-xs text-muted-foreground">Your notes will appear here after a run.</p></div>}</div>}</section>
     <section className="flex min-h-[620px] flex-1 flex-col bg-[hsl(220_20%_16%)] text-[hsl(40_30%_94%)]"><div className="flex items-center justify-between border-b border-white/10 px-5 py-3"><div className="flex items-center gap-2"><Code2 size={16} className="text-[hsl(var(--accent))]" /><span className="mono text-[11px] text-white/65">solution.cpp</span><select value={language} onChange={(e) => setLanguage(e.target.value)} data-testid="select-language" className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-white/65 outline-none"><option className="bg-[hsl(220_20%_16%)]">C++</option><option className="bg-[hsl(220_20%_16%)]">Python</option><option className="bg-[hsl(220_20%_16%)]">JavaScript</option></select></div><button onClick={() => { setCode(problem.starterCode); setAnalysis(null); }} data-testid="button-reset-code" className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white"><RotateCcw size={13} /> Reset</button></div><div className="flex flex-1 flex-col"><div className="relative flex-1"><div className="pointer-events-none absolute left-0 top-0 w-10 select-none border-r border-white/5 py-5 text-right mono text-[11px] leading-[1.7] text-white/20">{code.split('\n').map((_, index) => <div key={index} className="pr-3">{index + 1}</div>)}</div><textarea value={code} onChange={(e) => setCode(e.target.value)} data-testid="textarea-code-editor" spellCheck={false} className="code-editor h-full min-h-[370px] w-full resize-none bg-transparent py-5 pl-14 pr-5 text-[13px] text-[hsl(40_30%_92%)] outline-none" /></div>{consoleOpen && <div className="border-t border-white/10 bg-black/10 px-5 py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Terminal size={14} className="text-white/45" /><span className="mono text-[10px] uppercase tracking-[.14em] text-white/45">Test run</span></div><button onClick={() => setConsoleOpen(false)} className="text-white/35 hover:text-white" data-testid="button-close-console"><X size={14} /></button></div><div className="mt-3 flex items-center gap-2 text-xs">{runState === 'running' ? <><span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--chart-3))]" />Checking test cases...</> : runState === 'passed' ? <><CheckCircle2 size={15} className="text-primary" /><span className="text-primary">All {problem.testCases.length} test cases passed.</span></> : <><Circle size={14} className="text-accent" /><span className="text-white/65">Add a return statement to run the test cases.</span></>}</div></div>}{analysis && <div className="border-t border-white/10 bg-primary/10 px-5 py-4"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow text-white/45">Solution quality</p><p className="mt-1 text-2xl font-bold text-white">{analysis.score}<span className="text-sm text-white/45">/100</span></p></div><div className="max-w-sm"><p className="text-sm font-bold text-[hsl(var(--accent))]">{analysis.reaction}</p><p className="mt-1 text-xs leading-relaxed text-white/60">{analysis.approach}</p></div><div className="flex gap-5 text-xs"><span><span className="block text-white/40">Time</span><b>{analysis.time}</b></span><span><span className="block text-white/40">Space</span><b>{analysis.space}</b></span></div></div></div>}<div className="flex items-center justify-between border-t border-white/10 px-5 py-4"><span className="hidden text-[11px] text-white/35 sm:block">{code.length} characters · autosaved locally</span><div className="ml-auto flex gap-2"><button onClick={run} disabled={runState === 'running'} data-testid="button-run-code" className="flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-xs font-bold text-white/75 hover:bg-white/10 disabled:opacity-50"><Play size={14} /> Run</button><button onClick={submit} data-testid="button-submit-code" className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-[hsl(220_20%_16%)] hover:brightness-105"><Zap size={14} /> Submit</button></div></div></div></section>
  </div>;
}

function HintPanel({ problem, hintLevel, setHintLevel }: { problem: Problem; hintLevel: number; setHintLevel: (value: number) => void }) {
  const hints = [`Start by asking what needs to be remembered between characters. A one-pass scan can keep the important context.`, `A stack is a natural fit: the most recently opened bracket must be the first one closed.`, `Use a map from closing brackets to their expected opener, then compare as you pop.`];
  return <div className="mt-7"><div className="rounded-2xl border border-accent/25 bg-accent/10 p-5"><div className="flex items-start gap-3"><span className="rounded-lg bg-accent/20 p-2 text-[hsl(8_49%_42%)]"><Lightbulb size={17} /></span><div><p className="text-sm font-bold">A nudge, not the answer</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Reveal one layer at a time. The best insight is the one you still remember tomorrow.</p></div></div>{hintLevel > 0 && <div className="mt-5 border-t border-accent/20 pt-4"><p className="eyebrow text-[9px]">Hint {hintLevel}</p><p className="mt-2 text-sm leading-relaxed">{hints[hintLevel - 1]}</p></div>}<button onClick={() => setHintLevel(Math.min(3, hintLevel + 1))} disabled={hintLevel >= 3} data-testid="button-reveal-hint" className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent/80 px-3 py-2.5 text-xs font-bold text-[hsl(8_49%_25%)] hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50">{hintLevel >= 3 ? 'All hints revealed' : <><Lightbulb size={14} /> Reveal hint {hintLevel + 1} of 3</>}</button></div><div className="mt-8 rounded-xl bg-muted/50 p-5"><p className="eyebrow text-[9px]">Thinking prompt</p><p className="mt-2 text-sm leading-relaxed">What is the smallest piece of state that lets you decide whether the next character is valid?</p></div></div>;
}

function DailyPage() {
  const daily = problems[2]; const [completed, setCompleted] = useState(() => window.localStorage.getItem('quietbyte-daily') === new Date().toISOString().slice(0, 10)); const toggleDaily = () => { const next = !completed; setCompleted(next); if (next) window.localStorage.setItem('quietbyte-daily', new Date().toISOString().slice(0, 10)); else window.localStorage.removeItem('quietbyte-daily'); };
  return <div className="mx-auto max-w-[1050px]"><div className="rounded-[26px] border border-border bg-card p-6 shadow-[0_14px_45px_hsl(30_22%_26%/.06)] md:p-10"><div className="flex flex-col justify-between gap-8 md:flex-row"><div><p className="eyebrow flex items-center gap-2"><Sparkles size={12} className="text-accent" /> Daily ritual · Today</p><h1 className="serif mt-4 max-w-xl text-[44px] font-bold leading-[1.04] tracking-[-.05em] md:text-[61px]">One problem.<br /><span className="text-primary">A little more clarity.</span></h1><p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">Today’s problem is picked to stretch a familiar muscle without asking you to sprint. Give it a quiet 20 minutes.</p></div><div className="flex shrink-0 flex-row gap-3 md:flex-col"><div className="rounded-2xl bg-muted/60 p-4 md:w-36"><p className="eyebrow">Ritual</p><p className="serif mt-2 text-2xl font-bold">07:24</p><p className="mt-1 text-[11px] text-muted-foreground">average focus</p></div><div className="rounded-2xl bg-primary p-4 text-primary-foreground md:w-36"><p className="eyebrow text-primary-foreground/60">Streak</p><p className="serif mt-2 text-2xl font-bold">{completed ? '8 days' : '7 days'}</p><p className="mt-1 text-[11px] text-primary-foreground/65">still growing</p></div></div></div><div className="mt-10 border-t border-border pt-8"><div className="flex flex-wrap items-center gap-2"><DifficultyPill level={daily.difficulty} /><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-secondary-foreground">{daily.topic}</span><span className="ml-auto text-xs text-muted-foreground">3 patterns · 4 test cases</span></div><h2 className="serif mt-4 text-3xl font-bold">{daily.title}</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{daily.description}</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href={`/problem/${daily.id}`} data-testid="link-start-daily" className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:brightness-105"><Play size={15} /> Begin focus session</Link><button onClick={toggleDaily} data-testid="button-mark-daily" className={cn('flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold', completed ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:bg-muted')}>{completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}{completed ? 'Added to your rhythm' : 'Mark as complete'}</button></div></div></div><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="paper-card rounded-2xl p-5"><Clock3 size={17} className="text-primary" /><p className="mt-5 text-sm font-bold">Set a timer</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Try 20 minutes before reaching for a hint.</p></div><div className="paper-card rounded-2xl p-5"><Lightbulb size={17} className="text-accent" /><p className="mt-5 text-sm font-bold">Name the pattern</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Say what you notice before writing code.</p></div><div className="paper-card rounded-2xl p-5"><BookOpen size={17} className="text-[hsl(var(--chart-3))]" /><p className="mt-5 text-sm font-bold">Leave a note</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Future-you will thank you for the context.</p></div></div></div>;
}

function ProgressPage({ solvedIds }: { solvedIds: number[] }) {
  const topics = [{ name: 'Arrays & strings', value: 67, count: '12 / 18', color: 'bg-primary' }, { name: 'Stacks & queues', value: 82, count: '9 / 11', color: 'bg-[hsl(var(--chart-3))]' }, { name: 'Trees & graphs', value: 50, count: '8 / 16', color: 'bg-[hsl(var(--chart-4))]' }, { name: 'Dynamic programming', value: 33, count: '4 / 12', color: 'bg-accent' }, { name: 'Intervals & greedy', value: 44, count: '4 / 9', color: 'bg-[hsl(var(--chart-5))]' }];
  const bars = [32, 44, 38, 52, 47, 65, 72, 61, 78, 69, 84, 76, 90, 82];
  return <div><SectionHeading eyebrow="Your progress" title="The shape of showing up." copy="Progress is more useful when it tells a story. Here is yours, in patterns and small upward lines." action={<button data-testid="button-export-progress" className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold hover:bg-muted"><BookOpen size={14} /> Study summary</button>} /><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Problems solved" value={`${27 + solvedIds.length}`} caption="+6 from your previous month" icon={CheckCircle2} /><StatCard label="Average score" value="82.4" caption="Across 31 reviewed attempts" icon={Trophy} tone="gold" /><StatCard label="Best rhythm" value="12 days" caption="Your longest active streak" icon={Flame} tone="accent" /></div><div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.8fr]"><section className="paper-card rounded-2xl p-6"><div className="flex items-end justify-between"><div><p className="eyebrow">Last 14 days</p><h2 className="serif mt-1 text-2xl font-bold">Practice momentum</h2></div><span className="mono text-xs text-primary">+18% focus time</span></div><div className="mt-8 flex h-48 items-end gap-2 border-b border-l border-border px-3 pb-0 pt-4">{bars.map((height, index) => <div key={index} className="group flex h-full flex-1 items-end"><div className={cn('bar-fill w-full rounded-t-md transition-opacity group-hover:opacity-70', index > 10 ? 'bg-primary' : index > 6 ? 'bg-primary/65' : 'bg-secondary')} style={{ height: `${height}%` }} /></div>)}</div><div className="mt-3 flex justify-between pl-3 text-[10px] text-muted-foreground"><span>Oct 09</span><span>Oct 16</span><span>Today</span></div></section><section className="paper-card rounded-2xl p-6"><div className="flex items-end justify-between"><div><p className="eyebrow">Difficulty mix</p><h2 className="serif mt-1 text-2xl font-bold">Healthy stretch</h2></div><BarChart3 size={18} className="text-primary" /></div><div className="mt-8 flex items-center justify-center"><div className="relative flex h-40 w-40 items-center justify-center rounded-full" style={{ background: 'conic-gradient(hsl(var(--primary)) 0 48%, hsl(var(--chart-3)) 48% 82%, hsl(var(--accent)) 82% 100%)' }}><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-card"><span className="serif text-3xl font-bold">31</span><span className="text-[10px] text-muted-foreground">attempts</span></div></div></div><div className="mt-7 space-y-3 text-xs"><Legend color="bg-primary" label="Easy" value="15 · 48%" /><Legend color="bg-[hsl(var(--chart-3))]" label="Medium" value="11 · 34%" /><Legend color="bg-accent" label="Hard" value="5 · 16%" /></div></section></div><section className="paper-card mt-6 rounded-2xl p-6"><div className="flex items-end justify-between"><div><p className="eyebrow">Patterns</p><h2 className="serif mt-1 text-2xl font-bold">Where your instincts are growing</h2></div><Link href="/problems" className="text-xs font-bold text-primary hover:underline" data-testid="link-practice-more">Practice more</Link></div><div className="mt-6 grid gap-x-10 gap-y-5 md:grid-cols-2">{topics.map((topic) => <div key={topic.name}><div className="mb-2 flex justify-between text-xs"><span className="font-semibold">{topic.name}</span><span className="mono text-muted-foreground">{topic.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn('bar-fill h-full rounded-full', topic.color)} style={{ width: `${topic.value}%` }} /></div></div>)}</div></section></div>;
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <div className="flex items-center gap-2"><span className={cn('h-2.5 w-2.5 rounded-full', color)} /><span className="flex-1">{label}</span><span className="mono text-muted-foreground">{value}</span></div>; }

function SubmissionsPage({ submissions }: { submissions: Submission[] }) {
  const [filter, setFilter] = useState('All attempts'); const displayed = filter === 'All attempts' ? submissions : submissions.filter((item) => item.status === filter);
  return <div><SectionHeading eyebrow="Submission history" title="Notes from the trail." copy="Reviewing an attempt is part of solving it. Notice what got clearer, not only what passed." action={<FilterSelect label="Showing" value={filter} options={['All attempts', 'Accepted', 'Needs review', 'Wrong answer']} onChange={setFilter} />} /><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Accepted" value="18" caption="58% of your attempts" icon={CheckCircle2} /><StatCard label="Needs review" value="9" caption="Good candidates to revisit" icon={Lightbulb} tone="gold" /><StatCard label="Avg. attempt" value="1.7" caption="You rarely need a third try" icon={GitBranch} tone="accent" /></div><div className="paper-card mt-6 overflow-hidden rounded-2xl"><div className="hidden grid-cols-[1.3fr_.8fr_.7fr_.7fr_auto] gap-4 border-b border-border bg-muted/45 px-6 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground md:grid"><span>Problem</span><span>Result</span><span>Complexity</span><span>Score</span><span /></div>{displayed.map((submission) => <Link href={`/problem/${submission.problemId}`} key={submission.id} data-testid={`link-history-${submission.id}`} className="grid gap-3 border-b border-border/70 px-6 py-5 last:border-0 hover:bg-muted/30 md:grid-cols-[1.3fr_.8fr_.7fr_.7fr_auto] md:items-center md:gap-4"><div className="flex items-center gap-3"><span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', submission.status === 'Accepted' ? 'bg-primary/10 text-primary' : submission.status === 'Needs review' ? 'bg-[hsl(var(--chart-3)/.18)] text-[hsl(var(--chart-3))]' : 'bg-destructive/10 text-destructive')}>{submission.status === 'Accepted' ? <Check size={15} /> : <Lightbulb size={15} />}</span><span><span className="block text-sm font-bold">{submission.problemTitle}</span><span className="mt-1 block text-xs text-muted-foreground">{submission.createdAt} · attempt {submission.attemptNumber}</span></span></div><span className={cn('text-xs font-bold', submission.status === 'Accepted' ? 'text-primary' : submission.status === 'Needs review' ? 'text-[hsl(var(--chart-3))]' : 'text-destructive')}>{submission.status}</span><span className="mono text-xs text-muted-foreground">{submission.timeComplexity} / {submission.spaceComplexity}</span><span className="mono text-xs font-bold">{submission.score}/100</span><ArrowRight size={15} className="hidden text-muted-foreground md:block" /></Link>)}{displayed.length === 0 && <div className="p-14 text-center text-sm text-muted-foreground">No attempts in this view yet.</div>}</div></div>;
}

function AssistantPage() {
  const problem = problems[2];
  return <div className="mx-auto max-w-[930px]"><SectionHeading eyebrow="v3rtex AI" title="Think beside someone." copy="A code-aware DSA coach that gives you the next useful nudge, not a shortcut." action={<span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-bold text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Ready for your code</span>} /><div className="paper-card overflow-hidden rounded-2xl bg-[hsl(220_20%_16%)]"><InEditorAssistant problem={problem} code={starterFor(problem, 'C++')} /></div><p className="mt-3 text-center text-[10px] text-muted-foreground">Open any problem to keep the assistant beside your editor while you solve.</p></div>;
}

function LegacyAssistantPage() {
  const [message, setMessage] = useState(''); const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string }>>([{ role: 'assistant', text: 'Hi Maya. I’m here to help you think out loud. Bring me a problem, a half-formed idea, or a bug — I’ll meet you where you are.' }]); const sendChat = useSendAiChat(); const [providerReply, setProviderReply] = useState<AiChatResponse | null>(null);
  const submitMessage = (event: React.FormEvent) => { event.preventDefault(); const trimmed = message.trim(); if (!trimmed || sendChat.isPending) return; setMessages((current) => [...current, { role: 'user', text: trimmed }]); setMessage(''); sendChat.mutate({ data: { message: trimmed, hintLevel: 1, problemTitle: null, problemTopic: null, code: null } }, { onSuccess: (response) => { setProviderReply(response); setMessages((current) => [...current, { role: 'assistant', text: response.reply }]); }, onError: () => setMessages((current) => [...current, { role: 'assistant', text: 'The study assistant is taking a quiet moment. Your local workspace is still here — try again, or use one of the prompts below.' }]) }); };
  const prompts = ['Give me a hint for Merge Intervals', 'How do I spot a sliding window?', 'Help me review my last attempt'];
  return <div className="mx-auto max-w-[930px]"><SectionHeading eyebrow="Study assistant" title="Think beside someone." copy="Ask for a nudge, not a shortcut. The assistant is designed to keep the reasoning yours." action={<span className={cn('flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold', providerReply ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground')}><span className={cn('h-1.5 w-1.5 rounded-full', providerReply ? 'bg-primary' : 'bg-muted-foreground')} />{providerReply ? `Connected · ${providerReply.provider}` : 'Local-first mode'}</span>} /><div className="paper-card overflow-hidden rounded-2xl"><div className="flex items-center gap-3 border-b border-border bg-muted/35 px-5 py-4"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Bot size={17} /></span><div><p className="text-sm font-bold">Quietbyte guide</p><p className="text-[11px] text-muted-foreground">Socratic hints · no spoilers</p></div><LockKeyhole size={14} className="ml-auto text-muted-foreground" /></div><div className="min-h-[390px] space-y-5 p-5 md:p-8">{messages.map((item, index) => <div key={index} className={cn('flex gap-3', item.role === 'user' && 'flex-row-reverse')}><span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', item.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-accent/20 text-[hsl(8_49%_42%)]')}>{item.role === 'assistant' ? <Bot size={15} /> : <UserRound size={15} />}</span><div className={cn('max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed', item.role === 'assistant' ? 'rounded-tl-sm bg-muted/60' : 'rounded-tr-sm bg-primary text-primary-foreground')}>{item.text}</div></div>)}{sendChat.isPending && <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Bot size={15} /></span><div className="flex gap-1 rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-4"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:100ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:200ms]" /></div></div>}</div><div className="border-t border-border px-5 py-4 md:px-8">{messages.length === 1 && <div className="mb-4 flex flex-wrap gap-2">{prompts.map((prompt) => <button key={prompt} onClick={() => setMessage(prompt)} data-testid={`button-prompt-${prompt.slice(0, 5)}`} className="rounded-full border border-border bg-background px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary">{prompt}</button>)}</div>}<form onSubmit={submitMessage} className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:ring-2 focus-within:ring-primary/20"><textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitMessage(e); } }} placeholder="Ask about a pattern, not just an answer..." rows={1} data-testid="textarea-assistant-message" className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground/70" /><button type="submit" disabled={!message.trim() || sendChat.isPending} data-testid="button-send-assistant" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"><Send size={16} /></button></form><p className="mt-2 text-center text-[10px] text-muted-foreground">The assistant can be configured by your workspace administrator.</p></div></div></div>;
}

function EmptyPage({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) { return <div className="flex min-h-[60vh] flex-col items-center justify-center text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen size={22} /></span><h1 className="serif mt-5 text-3xl font-bold">{title}</h1><p className="mt-2 max-w-sm text-sm text-muted-foreground">{copy}</p>{action && <div className="mt-6">{action}</div>}</div>; }
function NotFound() { return <EmptyPage title="This page wandered off" copy="The trail ends here. Let’s get you back to a useful place." action={<Link href="/" data-testid="link-not-found-home" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Return home</Link>} />; }

function Router({ solvedIds, submissions, onSubmit }: { solvedIds: number[]; submissions: Submission[]; onSubmit: (problem: Problem, code: string, status: Submission['status']) => void }) {
  return <Switch><Route path="/" component={() => <HomePage solvedIds={solvedIds} submissions={submissions} />} /><Route path="/problems" component={() => <ProblemsPage solvedIds={solvedIds} />} /><Route path="/problem/:id" component={() => <ProblemPage onSubmit={onSubmit} solvedIds={solvedIds} submissions={submissions} />} /><Route path="/daily" component={DailyPage} /><Route path="/progress" component={() => <ProgressPage solvedIds={solvedIds} />} /><Route path="/submissions" component={() => <SubmissionsPage submissions={submissions} />} /><Route path="/assistant" component={AssistantPage} /><Route component={NotFound} /></Switch>;
}

function App() {
  const [solvedIds, setSolvedIds] = useState<number[]>(() => { try { const stored = window.localStorage.getItem('quietbyte-solved'); return stored ? JSON.parse(stored) as number[] : [1, 3]; } catch { return [1, 3]; } }); const [submissions, setSubmissions] = useState<Submission[]>(() => { try { const stored = window.localStorage.getItem('quietbyte-submissions'); return stored ? JSON.parse(stored) as Submission[] : initialSubmissions; } catch { return initialSubmissions; } });
  useEffect(() => { window.localStorage.setItem('quietbyte-solved', JSON.stringify(solvedIds)); }, [solvedIds]);
  useEffect(() => { window.localStorage.setItem('quietbyte-submissions', JSON.stringify(submissions)); }, [submissions]);
  const onSubmit = (problem: Problem, code: string, status: Submission['status']) => { const next: Submission = { id: Date.now(), problemId: problem.id, problemTitle: problem.title, status, timeComplexity: problem.id === 3 ? 'O(n log n)' : 'O(n)', spaceComplexity: 'O(n)', score: status === 'Accepted' ? 94 : 71, approach: code.includes('return') ? 'Captured a clear first pass and left a useful note for the next review.' : 'The shape is emerging. Add a return value and run the cases again.', createdAt: 'Just now', attemptNumber: submissions.filter((item) => item.problemId === problem.id).length + 1 }; setSubmissions((current) => [next, ...current]); if (status === 'Accepted' && !solvedIds.includes(problem.id)) setSolvedIds((current) => [...current, problem.id]); };
  const state = useMemo(() => ({ solvedIds, submissions }), [solvedIds, submissions]);
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><AppShell><RoutedErrorBoundary><Router {...state} onSubmit={onSubmit} /></RoutedErrorBoundary></AppShell></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }

export default App;