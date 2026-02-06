'use client'

import { useState, useEffect } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiThumbsUp,
  FiThumbsDown,
  FiRefreshCw,
  FiEdit3,
  FiCopy,
  FiSave,
  FiX,
  FiTarget,
  FiZap,
  FiBarChart2,
  FiEye,
  FiCalendar,
  FiArrowRight,
  FiCheck,
  FiInstagram,
  FiActivity,
  FiTrendingDown,
  FiClock
} from 'react-icons/fi'

// Agent IDs
const AGENT_IDS = {
  INSIGHT_COACH: '69858743e17e33c11eed19b3',
  BRAINSTORM_PARTNER: '698587582237a2c55706b012',
  VOICE_WRITER: '6985876eb90162af737b1ea1',
  TREND_CONTEXT: '6985878307ec48e3dc90a194',
}

// Types
type Screen = 'onboarding' | 'dashboard' | 'insight-canvas' | 'idea-board' | 'direction-lock' | 'draft-editor' | 'pre-flight' | 'session-complete' | 'content-calendar'
type OnboardingStep = 1 | 2 | 3
type Platform = 'instagram' | 'tiktok' | 'youtube'
type CreatorType = 'creator' | 'educator' | 'brand' | 'manager'
type Goal = 'reach' | 'saves' | 'consistency' | 'brand-deals'
type ContentType = 'reel' | 'carousel' | 'story'
type EffortLevel = 'low' | 'medium' | 'high'
type Tone = 'raw' | 'polished' | 'bold'
type RiskLevel = 'low' | 'medium' | 'high'
type PublishIntent = 'teach' | 'connect' | 'trigger-conversation' | 'test-new'
type ContextAction = 'why-this-works' | 'stress-test' | 'make-riskier' | 'make-safer'

interface InsightCard {
  id: string
  title: string
  confidence: number // 1-4 dots
  selected: boolean
  example?: string
}

interface IdeaCard {
  id: string
  title: string
  whyItWorks: string
  hookPreview: string
  effortLevel: EffortLevel
  basedOn: string[]
  status: 'new' | 'saved' | 'dismissed'
}

interface VoicePreset {
  name: string
  casualness: number
  sharpness: number
  emotional: number
}

interface DraftContent {
  hook: string
  body: string
  cta: string
}

interface CalendarPost {
  id: string
  title: string
  date: string
  format: ContentType
  status: 'draft' | 'scheduled' | 'posted'
  contrail?: string
  intent?: PublishIntent
  performanceNote?: string
}

interface ContextRailState {
  isOpen: boolean
  action: ContextAction | null
  response: string
  selectedIdea: IdeaCard | null
}

interface DirectionLock {
  contrail: string
  ideaSummary: string
  riskLevel: RiskLevel
  approach: 'safe' | 'push-boundaries' | 'experimental'
}

interface ConfidenceIndicators {
  hookStrength: number // 1-4
  clarity: number // 1-4
  savePotential: number // 1-4
}

export default function CreatorPilot() {
  // Screen & Onboarding State
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding')
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(1)
  const [isOnboarded, setIsOnboarded] = useState(false)

  // Onboarding Data
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram')
  const [creatorType, setCreatorType] = useState<CreatorType>('creator')
  const [primaryGoal, setPrimaryGoal] = useState<Goal>('saves')
  const [syncingPosts, setSyncingPosts] = useState(false)

  // Global State
  const [loading, setLoading] = useState(false)

  // Dashboard State
  const [dailyInsight, setDailyInsight] = useState<string>(
    "Your audience saves honesty more than polish"
  )
  const [insightExpanded, setInsightExpanded] = useState(false)

  // Insight Canvas State
  const [insights, setInsights] = useState<InsightCard[]>([
    {
      id: '1',
      title: 'Personal POV increases saves',
      confidence: 4,
      selected: false,
      example: 'Share your perspective, not just tips'
    },
    {
      id: '2',
      title: 'Your audience drops if hook > 7 words',
      confidence: 3,
      selected: false,
      example: 'Keep hooks short and punchy'
    },
    {
      id: '3',
      title: 'Carousels outperform reels for advice',
      confidence: 4,
      selected: false,
      example: 'Break down complex ideas in slides'
    }
  ])
  const [contrail, setContrail] = useState<string>('')
  const [constraints, setConstraints] = useState({
    format: 'carousel' as ContentType,
    effort: 50, // slider 0-100
    tone: 'polished' as Tone,
    faceOn: true,
    timeAvailable: 30 // 15, 30, 60 mins
  })

  // Idea Board State
  const [ideas, setIdeas] = useState<IdeaCard[]>([])
  const [selectedIdea, setSelectedIdea] = useState<IdeaCard | null>(null)
  const [showRefinementPanel, setShowRefinementPanel] = useState(false)
  const [refinementSliders, setRefinementSliders] = useState({
    personalEducational: 50,
    softBold: 50,
    shortStoryLed: 50,
    vulnerability: false,
    controversy: false,
    practicalTakeaway: true
  })

  // Draft Editor State
  const [draft, setDraft] = useState<DraftContent>({
    hook: '',
    body: '',
    cta: ''
  })
  const [voicePreset, setVoicePreset] = useState<VoicePreset>({
    name: 'My Voice',
    casualness: 60,
    sharpness: 50,
    emotional: 70
  })
  const [matchMyPosts, setMatchMyPosts] = useState(true)

  // Calendar State
  const [calendarPosts, setCalendarPosts] = useState<CalendarPost[]>([
    {
      id: '1',
      title: 'The mistake I made before my first brand deal',
      date: '2026-02-08',
      format: 'carousel',
      status: 'draft',
      contrail: 'Saves + Personal Storytelling'
    },
    {
      id: '2',
      title: 'Why I stopped chasing viral content',
      date: '2026-02-10',
      format: 'reel',
      status: 'scheduled',
      contrail: 'Authority + Honesty'
    }
  ])

  // Context Rail State (for Idea Exploration)
  const [contextRail, setContextRail] = useState<ContextRailState>({
    isOpen: false,
    action: null,
    response: '',
    selectedIdea: null
  })

  // Direction Lock State
  const [directionLock, setDirectionLock] = useState<DirectionLock | null>(null)

  // Pre-Flight State
  const [publishIntent, setPublishIntent] = useState<PublishIntent>('teach')

  // Confidence Indicators State
  const [confidence, setConfidence] = useState<ConfidenceIndicators>({
    hookStrength: 3,
    clarity: 3,
    savePotential: 3
  })

  // Performance Reflection State
  const [showReflection, setShowReflection] = useState(false)
  const [lastPostPerformance, setLastPostPerformance] = useState({
    success: true,
    learning: 'Opening with uncertainty created more engagement than expected',
    suggestion: 'Try starting with a question next time'
  })

  // Complete onboarding
  const completeOnboarding = () => {
    setSyncingPosts(true)
    setTimeout(() => {
      setSyncingPosts(false)
      setIsOnboarded(true)
      setCurrentScreen('dashboard')
    }, 2000)
  }

  // Generate contrail from selected insights
  useEffect(() => {
    const selectedTitles = insights
      .filter(i => i.selected)
      .map(i => i.title.split(' ').slice(0, 3).join(' '))
    if (selectedTitles.length > 0) {
      setContrail(selectedTitles.join(' + '))
    } else {
      setContrail('')
    }
  }, [insights])

  // Generate ideas
  const generateIdeas = async () => {
    setLoading(true)
    const selectedInsightTitles = insights
      .filter(i => i.selected)
      .map(i => i.title)
      .join(', ')

    try {
      const response = await callAIAgent(
        AGENT_IDS.BRAINSTORM_PARTNER,
        `Generate 3 content ideas for Instagram ${constraints.format} that align with these insights: ${selectedInsightTitles}. Effort level: ${constraints.effort > 66 ? 'high' : constraints.effort > 33 ? 'medium' : 'low'}. Tone: ${constraints.tone}. Time available: ${constraints.timeAvailable} minutes.`
      )

      if (response.status === 'success' && response.result) {
        const result = response.result as any
        const newIdeas: IdeaCard[] = [
          {
            id: '1',
            title: result.refined_idea || result.original_idea || 'The mistake I made before my first brand deal',
            whyItWorks: result.reasoning || 'Based on personal stories + save-heavy formats',
            hookPreview: 'I almost lost everything before I learned this...',
            effortLevel: constraints.effort > 66 ? 'high' : constraints.effort > 33 ? 'medium' : 'low',
            basedOn: insights.filter(i => i.selected).map(i => i.title.split(' ').slice(0, 3).join(' ')),
            status: 'new'
          }
        ]

        if (result.validation_points && Array.isArray(result.validation_points)) {
          result.validation_points.forEach((point: string, idx: number) => {
            if (idx < 2) {
              newIdeas.push({
                id: `${idx + 2}`,
                title: point,
                whyItWorks: 'Validated by AI analysis',
                hookPreview: point.substring(0, 50) + '...',
                effortLevel: constraints.effort > 66 ? 'high' : constraints.effort > 33 ? 'medium' : 'low',
                basedOn: insights.filter(i => i.selected).map(i => i.title.split(' ').slice(0, 3).join(' ')),
                status: 'new'
              })
            }
          })
        }

        setIdeas(newIdeas)
        setCurrentScreen('idea-board')
      }
    } catch (error) {
      console.error('Error generating ideas:', error)
    }
    setLoading(false)
  }

  // Refine idea
  const refineIdea = async () => {
    if (!selectedIdea) return
    setLoading(true)

    try {
      const response = await callAIAgent(
        AGENT_IDS.BRAINSTORM_PARTNER,
        `Refine this content idea: "${selectedIdea.title}". Make it ${refinementSliders.personalEducational > 50 ? 'more personal' : 'more educational'}, ${refinementSliders.softBold > 50 ? 'bolder' : 'softer'}, ${refinementSliders.shortStoryLed > 50 ? 'story-led' : 'short and punchy'}. ${refinementSliders.vulnerability ? 'Add vulnerability.' : ''} ${refinementSliders.controversy ? 'Add mild controversy.' : ''} ${refinementSliders.practicalTakeaway ? 'Include practical takeaway.' : ''}`
      )

      if (response.status === 'success' && response.result) {
        const result = response.result as any
        const refinedIdea: IdeaCard = {
          ...selectedIdea,
          title: result.refined_idea || selectedIdea.title,
          whyItWorks: result.reasoning || selectedIdea.whyItWorks
        }
        setSelectedIdea(refinedIdea)
        setIdeas(ideas.map(i => i.id === selectedIdea.id ? refinedIdea : i))
      }
    } catch (error) {
      console.error('Error refining idea:', error)
    }
    setLoading(false)
  }

  // Turn into draft
  const turnIntoDraft = async (idea: IdeaCard) => {
    setLoading(true)
    try {
      const voiceSettings = `casualness=${voicePreset.casualness}, sharpness=${voicePreset.sharpness}, emotional=${voicePreset.emotional}`

      const response = await callAIAgent(
        AGENT_IDS.VOICE_WRITER,
        `Write an Instagram ${constraints.format} caption for this idea: "${idea.title}". Why it works: ${idea.whyItWorks}. Voice settings: ${voiceSettings}. ${matchMyPosts ? 'Match my past posts style.' : ''} Make it authentic and non-AI-sounding.`
      )

      if (response.status === 'success' && response.result) {
        const result = response.result as any
        setDraft({
          hook: result.hook || result.generated_content?.split('\n\n')[0] || '',
          body: result.body || result.generated_content?.split('\n\n').slice(1, -1).join('\n\n') || '',
          cta: result.cta || result.generated_content?.split('\n\n').slice(-1)[0] || ''
        })
        setCurrentScreen('draft-editor')
      }
    } catch (error) {
      console.error('Error generating draft:', error)
    }
    setLoading(false)
  }

  // Rewrite section
  const rewriteSection = async (text: string, instruction: string, section: 'hook' | 'body' | 'cta') => {
    setLoading(true)
    try {
      const voiceSettings = `casualness=${voicePreset.casualness}, sharpness=${voicePreset.sharpness}, emotional=${voicePreset.emotional}`

      const response = await callAIAgent(
        AGENT_IDS.VOICE_WRITER,
        `Rewrite this text: "${text}". Instruction: ${instruction}. Voice settings: ${voiceSettings}. Keep it authentic.`
      )

      if (response.status === 'success' && response.result) {
        const result = response.result as any
        const rewritten = result.generated_content || result.body || text
        setDraft({ ...draft, [section]: rewritten })
      }
    } catch (error) {
      console.error('Error rewriting:', error)
    }
    setLoading(false)
  }

  // Context Rail Actions
  const handleContextAction = async (action: ContextAction, idea: IdeaCard) => {
    setContextRail({ ...contextRail, isOpen: true, action, selectedIdea: idea })
    setLoading(true)

    try {
      let prompt = ''
      switch (action) {
        case 'why-this-works':
          prompt = `Explain in one sentence why this content idea works: "${idea.title}". Based on: ${idea.whyItWorks}`
          break
        case 'stress-test':
          prompt = `Stress-test this content idea: "${idea.title}". Identify one potential weakness and suggest how to fix it. Keep response to 2 sentences max.`
          break
        case 'make-riskier':
          prompt = `Make this content idea bolder and riskier: "${idea.title}". Suggest one way to push boundaries. One sentence.`
          break
        case 'make-safer':
          prompt = `Make this content idea safer and more approachable: "${idea.title}". Suggest one adjustment. One sentence.`
          break
      }

      const response = await callAIAgent(AGENT_IDS.BRAINSTORM_PARTNER, prompt)

      if (response.status === 'success' && response.result) {
        const result = response.result as any
        const aiResponse = result.reasoning || result.refined_idea || 'This idea aligns with proven patterns from your top-performing content.'
        setContextRail({ ...contextRail, isOpen: true, action, selectedIdea: idea, response: aiResponse })
      }
    } catch (error) {
      console.error('Error in context action:', error)
    }
    setLoading(false)
  }

  // Update confidence indicators based on draft
  useEffect(() => {
    const hookLength = draft.hook.split(' ').length
    const totalLength = (draft.hook + draft.body + draft.cta).length

    setConfidence({
      hookStrength: hookLength <= 7 && hookLength > 0 ? 4 : hookLength <= 10 ? 3 : 2,
      clarity: totalLength > 100 && totalLength < 1000 ? 4 : totalLength > 50 ? 3 : 2,
      savePotential: draft.hook.length > 0 && draft.body.length > 0 ? 3 : 2
    })
  }, [draft])

  // Save to calendar with intent
  const saveToCalendarWithIntent = () => {
    const newPost: CalendarPost = {
      id: Date.now().toString(),
      title: draft.hook.substring(0, 50) + '...',
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
      format: constraints.format,
      status: 'draft',
      contrail: contrail,
      intent: publishIntent
    }
    setCalendarPosts([...calendarPosts, newPost])
    setCurrentScreen('session-complete')
  }

  // Proceed to Direction Lock
  const proceedToDirectionLock = (idea: IdeaCard) => {
    setDirectionLock({
      contrail: contrail,
      ideaSummary: idea.title,
      riskLevel: idea.effortLevel as RiskLevel,
      approach: 'safe'
    })
    setCurrentScreen('direction-lock')
  }

  // ONBOARDING SCREEN
  const OnboardingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">CreatorPilot</h1>
          <p className="text-xl text-slate-300">Your AI Content Strategist</p>
        </div>

        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur">
          <CardContent className="pt-8">
            {/* Progress Indicators */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {[1, 2, 3].map(step => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step === onboardingStep
                      ? 'bg-purple-500'
                      : step < onboardingStep
                      ? 'bg-purple-700'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Platform & Type */}
            {onboardingStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    What do you make?
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-300 mb-3 block">Platform</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['instagram', 'tiktok', 'youtube'] as Platform[]).map(platform => (
                          <button
                            key={platform}
                            onClick={() => setSelectedPlatform(platform)}
                            className={`px-6 py-4 rounded-xl text-sm font-medium transition-all ${
                              selectedPlatform === platform
                                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {platform === 'instagram' && <FiInstagram className="mx-auto mb-2 text-xl" />}
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-slate-300 mb-3 block">Content Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['creator', 'educator', 'brand', 'manager'] as CreatorType[]).map(type => (
                          <button
                            key={type}
                            onClick={() => setCreatorType(type)}
                            className={`px-6 py-4 rounded-xl text-sm font-medium transition-all ${
                              creatorType === type
                                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setOnboardingStep(2)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6"
                >
                  Continue
                  <FiArrowRight className="ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Goals */}
            {onboardingStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    What matters most right now?
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    {([
                      { value: 'reach', label: 'Reach', icon: FiTrendingUp },
                      { value: 'saves', label: 'Saves', icon: FiTarget },
                      { value: 'consistency', label: 'Consistency', icon: FiActivity },
                      { value: 'brand-deals', label: 'Brand Deals', icon: FiZap }
                    ] as const).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setPrimaryGoal(value)}
                        className={`px-6 py-6 rounded-xl text-sm font-medium transition-all ${
                          primaryGoal === value
                            ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="mx-auto mb-2 text-2xl" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setOnboardingStep(1)}
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-300 py-6"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setOnboardingStep(3)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6"
                  >
                    Continue
                    <FiArrowRight className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Connect */}
            {onboardingStep === 3 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Connect Instagram
                  </h2>
                  <p className="text-slate-400 mb-8">
                    We'll analyze your last 30 posts to understand what's working
                  </p>

                  {syncingPosts ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-purple-900/30 rounded-full flex items-center justify-center">
                        <div className="animate-spin">
                          <FiRefreshCw className="text-purple-400 text-2xl" />
                        </div>
                      </div>
                      <p className="text-purple-300 animate-pulse">Syncing your last 30 posts...</p>
                    </div>
                  ) : (
                    <Button
                      onClick={completeOnboarding}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg"
                    >
                      <FiInstagram className="mr-2 text-xl" />
                      Connect Instagram Account
                    </Button>
                  )}
                </div>

                {!syncingPosts && (
                  <Button
                    onClick={() => setOnboardingStep(2)}
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300"
                  >
                    Back
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // DASHBOARD SCREEN
  const DashboardScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">CreatorPilot</h1>
            <p className="text-slate-400">Your daily command center</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentScreen('content-calendar')}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <FiCalendar className="mr-2" />
            Calendar
          </Button>
        </div>

        {/* Performance Reflection - Shows after post publishes */}
        {showReflection && (
          <Card className={`border mb-8 backdrop-blur ${
            lastPostPerformance.success
              ? 'bg-green-900/20 border-green-700/50'
              : 'bg-yellow-900/20 border-yellow-700/50'
          }`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {lastPostPerformance.success ? (
                    <FiTrendingUp className="text-green-400 text-2xl" />
                  ) : (
                    <FiTrendingDown className="text-yellow-400 text-2xl" />
                  )}
                  <div>
                    <CardTitle className={`${lastPostPerformance.success ? 'text-green-100' : 'text-yellow-100'}`}>
                      {lastPostPerformance.success ? 'Your last post performed well' : 'Your last post underperformed'}
                    </CardTitle>
                    <p className="text-sm text-slate-400 mt-1">Based on your usual metrics</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReflection(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <FiX />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">What we learned:</p>
                <p className="text-white">{lastPostPerformance.learning}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Suggestion:</p>
                <p className="text-white">{lastPostPerformance.suggestion}</p>
              </div>
              <Button
                onClick={() => {
                  // Apply learning: pre-fill insights based on learning
                  setInsights(insights.map(i => ({
                    ...i,
                    selected: i.title.toLowerCase().includes('question') || i.title.toLowerCase().includes('uncertainty')
                  })))
                  setShowReflection(false)
                  setCurrentScreen('insight-canvas')
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                Apply This Learning
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Daily Insight - Hero */}
        <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-700/50 mb-8 backdrop-blur">
          <CardContent className="pt-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-purple-100 leading-tight">
                {dailyInsight}
              </h2>
              <p className="text-sm text-slate-400">Based on your last 12 posts</p>

              <button
                onClick={() => setInsightExpanded(!insightExpanded)}
                className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors"
              >
                {insightExpanded ? <FiChevronUp /> : <FiChevronDown />}
                <span className="text-sm font-medium">Why?</span>
              </button>

              {insightExpanded && (
                <div className="pt-4 space-y-2">
                  <div className="flex items-start gap-2 text-slate-300">
                    <FiCheck className="mt-1 text-purple-400 flex-shrink-0" />
                    <p>Authentic, unfiltered posts get 2.4x more saves</p>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <FiCheck className="mt-1 text-purple-400 flex-shrink-0" />
                    <p>Your audience values real experiences over perfect execution</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Snapshot - 3 Cards ONLY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Top Post */}
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur hover:border-purple-700/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm text-slate-400">Top Post This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="aspect-square bg-gradient-to-br from-purple-800/30 to-blue-800/30 rounded-lg flex items-center justify-center">
                  <FiBarChart2 className="text-4xl text-purple-300" />
                </div>
                <div className="bg-purple-900/30 rounded-full px-3 py-1 inline-block">
                  <p className="text-xs text-purple-200 font-medium">Personal Story</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pattern */}
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur hover:border-blue-700/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm text-slate-400">Pattern Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FiEye className="text-blue-300 text-xl" />
                </div>
                <p className="text-white font-medium">Text hooks outperform visuals</p>
              </div>
            </CardContent>
          </Card>

          {/* Opportunity */}
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur hover:border-yellow-700/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm text-slate-400">Missed Opportunity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <FiClock className="text-yellow-300 text-xl" />
                </div>
                <p className="text-white font-medium">Earlier posting = higher retention</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => setCurrentScreen('insight-canvas')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg px-12 py-6 rounded-xl shadow-lg shadow-purple-900/50"
          >
            Set Your Contrail
          </Button>
          <Button
            onClick={() => {
              // Quick generate without canvas
              generateIdeas()
            }}
            variant="outline"
            className="border-purple-700 text-purple-300 hover:bg-purple-900/20 text-lg px-12 py-6 rounded-xl"
          >
            Generate Ideas
          </Button>
        </div>
      </div>
    </div>
  )

  // INSIGHT CANVAS SCREEN
  const InsightCanvasScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Set Your Contrail</h1>
            <p className="text-slate-400">Strategy without talking</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentScreen('dashboard')}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <FiX className="mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Insight Stack */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Insight Stack</h2>

            {insights.map(insight => (
              <Card
                key={insight.id}
                className={`bg-slate-900/50 border transition-all cursor-pointer ${
                  insight.selected
                    ? 'border-purple-500 bg-purple-900/20 ring-2 ring-purple-500/30'
                    : 'border-slate-700/50 hover:border-slate-600'
                }`}
                onClick={() => {
                  setInsights(insights.map(i =>
                    i.id === insight.id ? { ...i, selected: !i.selected } : i
                  ))
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white mb-2">
                        {insight.title}
                      </h3>
                      <div className="flex items-center gap-1">
                        {[...Array(4)].map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full ${
                              idx < insight.confidence ? 'bg-purple-400' : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      insight.selected
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-slate-600'
                    }`}>
                      {insight.selected && <FiCheckCircle className="text-white text-sm" />}
                    </div>
                  </div>

                  {insight.example && (
                    <div className="bg-slate-800/50 rounded-lg p-3 mt-3">
                      <p className="text-xs text-slate-400 mb-1">Example:</p>
                      <p className="text-sm text-slate-300 italic">{insight.example}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CENTER: Contrail Canvas */}
          <div className="lg:col-span-4">
            <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/50 backdrop-blur sticky top-8">
              <CardHeader>
                <CardTitle className="text-white text-center">Your Contrail</CardTitle>
              </CardHeader>
              <CardContent>
                {contrail ? (
                  <div className="space-y-4">
                    <div className="bg-slate-900/50 rounded-xl p-6 text-center">
                      <p className="text-sm text-purple-300 mb-2">You're optimizing for:</p>
                      <p className="text-2xl font-bold text-white leading-relaxed">
                        {contrail}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {insights.filter(i => i.selected).map(insight => (
                        <div key={insight.id} className="bg-purple-900/50 rounded-full px-4 py-2">
                          <p className="text-sm text-purple-200">{insight.title.split(' ').slice(0, 3).join(' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiTarget className="mx-auto text-5xl text-slate-600 mb-4" />
                    <p className="text-slate-400">Select insights to build your contrail</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Constraints Panel */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur sticky top-8">
              <CardHeader>
                <CardTitle className="text-white text-sm">Constraints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Format */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['reel', 'carousel', 'story'] as ContentType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setConstraints({ ...constraints, format: type })}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                          constraints.format === type
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Effort */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-400">Effort</label>
                    <span className="text-xs text-slate-500">
                      {constraints.effort < 33 ? 'Low' : constraints.effort < 66 ? 'Medium' : 'High'}
                    </span>
                  </div>
                  <Slider
                    value={[constraints.effort]}
                    onValueChange={(value) => setConstraints({ ...constraints, effort: value[0] })}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                {/* Tone */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Tone</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['raw', 'polished', 'bold'] as Tone[]).map(tone => (
                      <button
                        key={tone}
                        onClick={() => setConstraints({ ...constraints, tone })}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                          constraints.tone === tone
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Face toggle */}
                <div>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-400">Face on</span>
                    <input
                      type="checkbox"
                      checked={constraints.faceOn}
                      onChange={(e) => setConstraints({ ...constraints, faceOn: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-purple-600"
                    />
                  </label>
                </div>

                {/* Time */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Time Available</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 30, 60].map(mins => (
                      <button
                        key={mins}
                        onClick={() => setConstraints({ ...constraints, timeAvailable: mins })}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                          constraints.timeAvailable === mins
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate */}
                <Button
                  onClick={generateIdeas}
                  disabled={insights.filter(i => i.selected).length === 0 || loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {loading ? 'Generating...' : 'Generate Ideas'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )

  // IDEA BOARD SCREEN
  const IdeaBoardScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Idea Board</h1>
            {contrail && (
              <p className="text-sm text-purple-300">Optimized for: {contrail}</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentScreen('insight-canvas')}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <FiX className="mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ideas Grid */}
          <div className={`${showRefinementPanel ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-purple-300">Generating ideas...</div>
              </div>
            ) : ideas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No ideas generated yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ideas.map(idea => (
                  <Card
                    key={idea.id}
                    className={`bg-slate-900/50 border transition-all ${
                      idea.status === 'saved'
                        ? 'border-green-700/50 bg-green-900/10'
                        : idea.status === 'dismissed'
                        ? 'opacity-50 border-red-700/30'
                        : 'border-slate-700/50 hover:border-purple-700/50'
                    }`}
                  >
                    <CardHeader>
                      <CardTitle className="text-base text-white leading-tight">
                        {idea.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Why it works:</p>
                        <p className="text-sm text-slate-300">{idea.whyItWorks}</p>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Hook preview:</p>
                        <p className="text-sm text-purple-200 italic">{idea.hookPreview}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          idea.effortLevel === 'low'
                            ? 'bg-green-900/30 text-green-300'
                            : idea.effortLevel === 'medium'
                            ? 'bg-yellow-900/30 text-yellow-300'
                            : 'bg-red-900/30 text-red-300'
                        }`}>
                          {idea.effortLevel}
                        </span>
                        {idea.basedOn.slice(0, 1).map((tag, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300">
                            {tag.length > 15 ? tag.substring(0, 15) + '...' : tag}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedIdea(idea)
                              setShowRefinementPanel(true)
                            }}
                            className="border-slate-700 text-slate-300 hover:text-white text-xs"
                          >
                            Tweak
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => proceedToDirectionLock(idea)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                          >
                            Turn into Draft
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setIdeas(ideas.map(i =>
                              i.id === idea.id ? { ...i, status: 'saved' } : i
                            ))}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-slate-800 hover:bg-green-900/30 text-slate-400 hover:text-green-300 transition-colors"
                          >
                            <FiThumbsUp className="text-xs" />
                          </button>
                          <button
                            onClick={() => generateIdeas()}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-slate-800 hover:bg-blue-900/30 text-slate-400 hover:text-blue-300 transition-colors"
                          >
                            <FiRefreshCw className="text-xs" />
                          </button>
                          <button
                            onClick={() => setIdeas(ideas.map(i =>
                              i.id === idea.id ? { ...i, status: 'dismissed' } : i
                            ))}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-300 transition-colors"
                          >
                            <FiThumbsDown className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Refinement Side Panel */}
          {showRefinementPanel && selectedIdea && (
            <div className="lg:col-span-1">
              <Card className="bg-slate-900/80 border-purple-700/50 backdrop-blur sticky top-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">Refine</CardTitle>
                    <button
                      onClick={() => {
                        setShowRefinementPanel(false)
                        setSelectedIdea(null)
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <FiX />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sliders */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-slate-400">Personal</label>
                      <label className="text-xs text-slate-400">Educational</label>
                    </div>
                    <Slider
                      value={[refinementSliders.personalEducational]}
                      onValueChange={(value) =>
                        setRefinementSliders({ ...refinementSliders, personalEducational: value[0] })
                      }
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-slate-400">Soft</label>
                      <label className="text-xs text-slate-400">Bold</label>
                    </div>
                    <Slider
                      value={[refinementSliders.softBold]}
                      onValueChange={(value) =>
                        setRefinementSliders({ ...refinementSliders, softBold: value[0] })
                      }
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-slate-400">Short</label>
                      <label className="text-xs text-slate-400">Story-led</label>
                    </div>
                    <Slider
                      value={[refinementSliders.shortStoryLed]}
                      onValueChange={(value) =>
                        setRefinementSliders({ ...refinementSliders, shortStoryLed: value[0] })
                      }
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3 pt-4 border-t border-slate-700">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-slate-400">Add vulnerability</span>
                      <input
                        type="checkbox"
                        checked={refinementSliders.vulnerability}
                        onChange={(e) => setRefinementSliders({ ...refinementSliders, vulnerability: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-slate-400">Add controversy</span>
                      <input
                        type="checkbox"
                        checked={refinementSliders.controversy}
                        onChange={(e) => setRefinementSliders({ ...refinementSliders, controversy: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs text-slate-400">Practical takeaway</span>
                      <input
                        type="checkbox"
                        checked={refinementSliders.practicalTakeaway}
                        onChange={(e) => setRefinementSliders({ ...refinementSliders, practicalTakeaway: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                    </label>
                  </div>

                  <Button
                    onClick={refineIdea}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loading ? 'Refining...' : 'Apply'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Context Rail - Bottom of Screen */}
        <div className={`fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-700 backdrop-blur transition-all ${contextRail.isOpen ? 'h-48' : 'h-14'}`}>
          {!contextRail.isOpen ? (
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
              <p className="text-sm text-slate-400">Want to explore an angle deeper?</p>
              <div className="flex gap-2">
                {ideas.length > 0 && (
                  <>
                    <button
                      onClick={() => handleContextAction('why-this-works', ideas[0])}
                      className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-purple-900/30 text-slate-300 hover:text-purple-200 transition-colors"
                    >
                      Ask "Why this works"
                    </button>
                    <button
                      onClick={() => handleContextAction('stress-test', ideas[0])}
                      className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-purple-900/30 text-slate-300 hover:text-purple-200 transition-colors"
                    >
                      Stress-test this idea
                    </button>
                    <button
                      onClick={() => handleContextAction('make-riskier', ideas[0])}
                      className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-purple-900/30 text-slate-300 hover:text-purple-200 transition-colors"
                    >
                      Make it riskier
                    </button>
                    <button
                      onClick={() => handleContextAction('make-safer', ideas[0])}
                      className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-purple-900/30 text-slate-300 hover:text-purple-200 transition-colors"
                    >
                      Make it safer
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-6 py-4 h-48 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-300 mb-2">
                    {contextRail.action === 'why-this-works' && 'Why this works'}
                    {contextRail.action === 'stress-test' && 'Stress Test'}
                    {contextRail.action === 'make-riskier' && 'Make it Riskier'}
                    {contextRail.action === 'make-safer' && 'Make it Safer'}
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {loading ? 'Thinking...' : contextRail.response}
                  </p>
                </div>
                <button
                  onClick={() => setContextRail({ ...contextRail, isOpen: false })}
                  className="text-slate-400 hover:text-white ml-4"
                >
                  <FiX />
                </button>
              </div>
              {!loading && contextRail.selectedIdea && (
                <div className="mt-auto flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setContextRail({ ...contextRail, isOpen: false })
                      if (contextRail.selectedIdea) {
                        proceedToDirectionLock(contextRail.selectedIdea)
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                  >
                    Proceed to Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setContextRail({ ...contextRail, isOpen: false })}
                    className="border-slate-700 text-slate-300 text-xs"
                  >
                    Keep Exploring
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // DIRECTION LOCK SCREEN
  const DirectionLockScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <Card className="bg-slate-900/80 border-purple-700/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-center text-xl">Lock Direction?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {directionLock && (
              <>
                <div className="space-y-4">
                  <div className="bg-purple-900/20 rounded-lg p-4">
                    <p className="text-xs text-purple-300 mb-1">Your Contrail:</p>
                    <p className="text-sm text-white font-medium">{directionLock.contrail}</p>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Idea Summary:</p>
                    <p className="text-sm text-white">{directionLock.ideaSummary}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400">Risk Level:</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      directionLock.riskLevel === 'low'
                        ? 'bg-green-900/30 text-green-300'
                        : directionLock.riskLevel === 'medium'
                        ? 'bg-yellow-900/30 text-yellow-300'
                        : 'bg-red-900/30 text-red-300'
                    }`}>
                      {directionLock.riskLevel}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-slate-400">Choose your approach:</p>
                  {(['safe', 'push-boundaries', 'experimental'] as const).map(approach => (
                    <button
                      key={approach}
                      onClick={() => setDirectionLock({ ...directionLock, approach })}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        directionLock.approach === approach
                          ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {approach === 'safe' && 'Ship Safe'}
                      {approach === 'push-boundaries' && 'Push Boundaries'}
                      {approach === 'experimental' && 'Experimental'}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={async () => {
                    setLoading(true)
                    // Generate draft based on locked direction
                    const idea: IdeaCard = {
                      id: '1',
                      title: directionLock.ideaSummary,
                      whyItWorks: `Optimized for ${directionLock.contrail}`,
                      hookPreview: '',
                      effortLevel: directionLock.riskLevel as EffortLevel,
                      basedOn: [],
                      status: 'new'
                    }
                    await turnIntoDraft(idea)
                    setLoading(false)
                  }}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6"
                >
                  {loading ? 'Generating Draft...' : 'Proceed to Draft'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // DRAFT EDITOR SCREEN
  const DraftEditorScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Draft Editor</h1>
            <p className="text-slate-400">Execution zone</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentScreen('idea-board')}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <FiX className="mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hook */}
            <Card className="bg-slate-900/50 border-slate-700/50 relative">
              {/* Confidence Indicator - Left Margin */}
              <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center justify-center gap-4 border-r border-slate-700/50 bg-slate-800/30">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex flex-col gap-1">
                    {[...Array(4)].map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          idx < confidence.hookStrength ? 'bg-purple-400' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[8px] text-slate-500 writing-mode-vertical transform rotate-180 mt-2">Hook</p>
                </div>
              </div>
              <div className="pl-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">Hook</CardTitle>
                    <div className="flex gap-2">
                      <button
                        onClick={() => rewriteSection(draft.hook, 'Make this more me', 'hook')}
                        className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-purple-900/30 text-slate-400 hover:text-purple-300 transition-colors"
                      >
                        More me
                      </button>
                      <button
                        onClick={() => rewriteSection(draft.hook, 'Make this punchier', 'hook')}
                        className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-purple-900/30 text-slate-400 hover:text-purple-300 transition-colors"
                      >
                        Punchier
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={draft.hook}
                    onChange={(e) => setDraft({ ...draft, hook: e.target.value })}
                    className="w-full bg-slate-800/50 text-white rounded-lg p-4 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Your hook..."
                  />
                </CardContent>
              </div>
            </Card>

            {/* Body */}
            <Card className="bg-slate-900/50 border-slate-700/50 relative">
              {/* Confidence Indicators - Left Margin */}
              <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center justify-center gap-4 border-r border-slate-700/50 bg-slate-800/30">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex flex-col gap-1">
                    {[...Array(4)].map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          idx < confidence.clarity ? 'bg-blue-400' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[8px] text-slate-500 writing-mode-vertical transform rotate-180 mt-2">Clarity</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex flex-col gap-1">
                    {[...Array(4)].map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          idx < confidence.savePotential ? 'bg-green-400' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[8px] text-slate-500 writing-mode-vertical transform rotate-180 mt-2">Save</p>
                </div>
              </div>
              <div className="pl-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">Body</CardTitle>
                    <div className="flex gap-2">
                      <button
                        onClick={() => rewriteSection(draft.body, 'Shorten this', 'body')}
                        className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-purple-900/30 text-slate-400 hover:text-purple-300 transition-colors"
                      >
                        Shorten
                      </button>
                      <button
                        onClick={() => rewriteSection(draft.body, 'Make more personal', 'body')}
                        className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-purple-900/30 text-slate-400 hover:text-purple-300 transition-colors"
                      >
                        Personal
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    className="w-full bg-slate-800/50 text-white rounded-lg p-4 min-h-[200px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Your content..."
                  />
                </CardContent>
              </div>
            </Card>

            {/* CTA */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-sm">CTA</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={draft.cta}
                  onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
                  className="w-full bg-slate-800/50 text-white rounded-lg p-4 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Call to action..."
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(`${draft.hook}\n\n${draft.body}\n\n${draft.cta}`)
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white"
              >
                <FiCopy className="mr-2" />
                Copy Caption
              </Button>
              <Button
                onClick={() => setCurrentScreen('pre-flight')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <FiSave className="mr-2" />
                Ready to Publish
              </Button>
            </div>
          </div>

          {/* Voice & Structure Sidebar */}
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700/50 sticky top-8">
              <CardHeader>
                <CardTitle className="text-white text-sm">Voice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Voice sliders */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-400">Casual</label>
                    <label className="text-xs text-slate-400">Sharp</label>
                  </div>
                  <Slider
                    value={[voicePreset.casualness]}
                    onValueChange={(value) => setVoicePreset({ ...voicePreset, casualness: value[0] })}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-400">Emotional</label>
                    <label className="text-xs text-slate-400">Direct</label>
                  </div>
                  <Slider
                    value={[voicePreset.emotional]}
                    onValueChange={(value) => setVoicePreset({ ...voicePreset, emotional: value[0] })}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-400">Match my past posts</span>
                    <input
                      type="checkbox"
                      checked={matchMyPosts}
                      onChange={(e) => setMatchMyPosts(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-sm">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Characters</span>
                  <span className="text-xs text-white font-medium">
                    {(draft.hook + draft.body + draft.cta).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )

  // PRE-FLIGHT CHECK SCREEN
  const PreFlightScreen = () => {
    const checklistItems = [
      { label: 'Hook appears in first 2 seconds', checked: draft.hook.split(' ').length <= 7 },
      { label: 'Matches your contrail', checked: contrail.length > 0 },
      { label: 'Tone consistent with past wins', checked: matchMyPosts },
      { label: 'CTA present', checked: draft.cta.length > 0 }
    ]

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center px-6">
        <div className="max-w-lg w-full">
          <Card className="bg-slate-900/80 border-purple-700/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-center text-2xl">Pre-Flight Check</CardTitle>
              <p className="text-center text-slate-400 text-sm mt-2">Are you ready?</p>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Auto-Checked Checklist */}
              <div className="space-y-3">
                {checklistItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.checked
                        ? 'bg-green-600'
                        : 'bg-slate-700'
                    }`}>
                      {item.checked && <FiCheck className="text-white text-sm" />}
                    </div>
                    <p className={`text-sm ${item.checked ? 'text-white' : 'text-slate-400'}`}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Intent Selection */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400">What's your intent with this post?</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['teach', 'connect', 'trigger-conversation', 'test-new'] as PublishIntent[]).map(intent => (
                    <button
                      key={intent}
                      onClick={() => setPublishIntent(intent)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                        publishIntent === intent
                          ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {intent === 'teach' && 'Teach'}
                      {intent === 'connect' && 'Connect'}
                      {intent === 'trigger-conversation' && 'Trigger conversation'}
                      {intent === 'test-new' && 'Test something new'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setCurrentScreen('draft-editor')}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  Back to Draft
                </Button>
                <Button
                  onClick={saveToCalendarWithIntent}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  Ready to Publish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // CONTENT CALENDAR SCREEN
  const ContentCalendarScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Content Calendar</h1>
            <p className="text-slate-400">Light, not heavy</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentScreen('dashboard')}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <FiX className="mr-2" />
            Close
          </Button>
        </div>

        {/* Insight */}
        <Card className="bg-purple-900/20 border-purple-700/50 mb-8">
          <CardContent className="pt-6">
            <p className="text-purple-200">
              You usually perform better posting on Tue & Thu
            </p>
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="space-y-4">
          {calendarPosts.map(post => (
            <Card key={post.id} className="bg-slate-900/50 border-slate-700/50 hover:border-purple-700/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        post.status === 'posted'
                          ? 'bg-green-900/30 text-green-300'
                          : post.status === 'scheduled'
                          ? 'bg-blue-900/30 text-blue-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {post.status}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-purple-900/30 text-purple-300">
                        {post.format}
                      </span>
                      <span className="text-xs text-slate-500">{post.date}</span>
                    </div>
                    <h3 className="text-white font-medium mb-1">{post.title}</h3>
                    {post.contrail && (
                      <p className="text-sm text-slate-400">Strategy: {post.contrail}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="border-slate-700 text-slate-300">
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fill Gap CTA */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => setCurrentScreen('insight-canvas')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Fill Gap With Idea
          </Button>
        </div>
      </div>
    </div>
  )

  // SESSION COMPLETE SCREEN
  const SessionCompleteScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <FiCheckCircle className="text-green-400 text-4xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Session Complete</h1>
          <p className="text-xl text-slate-300 mb-2">We'll track how this performs</p>
          <p className="text-sm text-slate-500">Your intent and contrail are saved for analysis</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => setCurrentScreen('content-calendar')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6"
          >
            <FiCalendar className="mr-2" />
            View Calendar
          </Button>
          <Button
            onClick={() => {
              setCurrentScreen('dashboard')
              // Set reflection to show on next visit
              setTimeout(() => setShowReflection(true), 500)
            }}
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:text-white py-6"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )

  // RENDER
  if (!isOnboarded && currentScreen === 'onboarding') {
    return <OnboardingScreen />
  }

  return (
    <>
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'insight-canvas' && <InsightCanvasScreen />}
      {currentScreen === 'idea-board' && <IdeaBoardScreen />}
      {currentScreen === 'direction-lock' && <DirectionLockScreen />}
      {currentScreen === 'draft-editor' && <DraftEditorScreen />}
      {currentScreen === 'pre-flight' && <PreFlightScreen />}
      {currentScreen === 'session-complete' && <SessionCompleteScreen />}
      {currentScreen === 'content-calendar' && <ContentCalendarScreen />}
    </>
  )
}
