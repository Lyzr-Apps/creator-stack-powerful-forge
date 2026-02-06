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
  FiHeart,
  FiBookmark
} from 'react-icons/fi'

// Agent IDs
const AGENT_IDS = {
  INSIGHT_COACH: '69858743e17e33c11eed19b3',
  BRAINSTORM_PARTNER: '698587582237a2c55706b012',
  VOICE_WRITER: '6985876eb90162af337b1ea1',
  TREND_CONTEXT: '6985878307ec48e3dc90a194',
}

// Types
type Screen = 'dashboard' | 'insight-canvas' | 'idea-board' | 'draft-editor'
type ContentType = 'reel' | 'carousel' | 'story'
type Goal = 'reach' | 'saves' | 'authority'
type EffortLevel = 'low' | 'medium' | 'high'
type Tone = 'raw' | 'polished' | 'bold'

interface InsightCard {
  id: string
  title: string
  confidence: 'high' | 'medium' | 'low'
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
  boldness: number
  emojiUsage: number
  professionalism: number
}

interface DraftContent {
  caption: string
  hook: string
  body: string
  cta?: string
}

export default function CreatorPilot() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [loading, setLoading] = useState(false)

  // Dashboard state
  const [dailyInsight, setDailyInsight] = useState<string>(
    "Your audience saves story-led posts 3.2× more than trend-led posts"
  )
  const [insightExpanded, setInsightExpanded] = useState(false)

  // Insight Canvas state
  const [insights, setInsights] = useState<InsightCard[]>([
    {
      id: '1',
      title: 'Hooks with questions retain viewers longer',
      confidence: 'high',
      selected: false,
      example: 'Ever wonder why some posts just stop you scrolling?'
    },
    {
      id: '2',
      title: 'Carousels outperform reels when topic is personal',
      confidence: 'high',
      selected: false,
      example: 'Share your journey in slides, not rushed videos'
    },
    {
      id: '3',
      title: 'Audience drops off after 5 seconds if no text appears',
      confidence: 'medium',
      selected: false,
      example: 'Add text overlay immediately'
    }
  ])
  const [constraints, setConstraints] = useState({
    contentType: 'carousel' as ContentType,
    goal: 'saves' as Goal,
    effortLevel: 'medium' as EffortLevel,
    tone: 'polished' as Tone
  })

  // Idea Board state
  const [ideas, setIdeas] = useState<IdeaCard[]>([])
  const [selectedIdea, setSelectedIdea] = useState<IdeaCard | null>(null)

  // Refinement state
  const [refinementSliders, setRefinementSliders] = useState({
    personalEducational: 50,
    softBold: 50,
    controversy: 0
  })

  // Draft Editor state
  const [draft, setDraft] = useState<DraftContent>({
    caption: '',
    hook: '',
    body: '',
    cta: ''
  })
  const [voicePreset, setVoicePreset] = useState<VoicePreset>({
    name: 'My Default Voice',
    casualness: 7,
    boldness: 5,
    emojiUsage: 3,
    professionalism: 4
  })
  const [showVoicePanel, setShowVoicePanel] = useState(false)
  const [matchMyPosts, setMatchMyPosts] = useState(true)
  const [dontSoundAI, setDontSoundAI] = useState(true)

  // Generate insights using AI
  const generateInsights = async () => {
    setLoading(true)
    try {
      const response = await callAIAgent(
        AGENT_IDS.INSIGHT_COACH,
        "Analyze my recent Instagram content and provide 3 actionable insights about what's working"
      )

      if (response.status === 'success' && response.result) {
        const result = response.result as any
        // Map AI response to insight cards
        const newInsights: InsightCard[] = [
          {
            id: '1',
            title: result.emotional_insight || result.observation || 'Personal stories resonate more',
            confidence: result.confidence_level || 'high',
            selected: false
          },
          {
            id: '2',
            title: result.explanation || 'Your audience engages more with vulnerability',
            confidence: 'medium',
            selected: false
          }
        ]
        if (result.suggestion) {
          newInsights.push({
            id: '3',
            title: result.suggestion,
            confidence: 'medium',
            selected: false
          })
        }
        setInsights(newInsights)
      }
    } catch (error) {
      console.error('Error generating insights:', error)
    }
    setLoading(false)
  }

  // Generate ideas based on selected insights
  const generateIdeas = async () => {
    setLoading(true)
    const selectedInsightTitles = insights
      .filter(i => i.selected)
      .map(i => i.title)
      .join(', ')

    try {
      const response = await callAIAgent(
        AGENT_IDS.BRAINSTORM_PARTNER,
        `Generate 3 content ideas for Instagram ${constraints.contentType} that align with these insights: ${selectedInsightTitles}. Goal: ${constraints.goal}. Effort level: ${constraints.effortLevel}. Tone: ${constraints.tone}.`
      )

      if (response.status === 'success' && response.result) {
        const result = response.result as any
        const newIdeas: IdeaCard[] = [
          {
            id: '1',
            title: result.refined_idea || result.original_idea || 'The mistake I made before my first brand deal',
            whyItWorks: result.reasoning || 'Based on personal stories + save-heavy formats',
            hookPreview: 'I almost lost everything before I learned this...',
            effortLevel: constraints.effortLevel,
            basedOn: selectedInsightTitles ? [selectedInsightTitles] : ['Personal stories', 'Save-heavy formats'],
            status: 'new'
          }
        ]

        // Add more ideas if we have validation points
        if (result.validation_points && Array.isArray(result.validation_points)) {
          result.validation_points.forEach((point: string, idx: number) => {
            if (idx < 2) {
              newIdeas.push({
                id: `${idx + 2}`,
                title: point,
                whyItWorks: 'Validated by AI analysis',
                hookPreview: point.substring(0, 50) + '...',
                effortLevel: constraints.effortLevel,
                basedOn: selectedInsightTitles ? [selectedInsightTitles] : ['AI Validation'],
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

  // Refine selected idea
  const refineIdea = async (idea: IdeaCard) => {
    setLoading(true)
    try {
      const response = await callAIAgent(
        AGENT_IDS.BRAINSTORM_PARTNER,
        `Refine this content idea: "${idea.title}". Make it ${refinementSliders.personalEducational > 50 ? 'more personal' : 'more educational'}, ${refinementSliders.softBold > 50 ? 'bolder' : 'softer'}, ${refinementSliders.controversy > 30 ? 'with some controversy' : 'non-controversial'}.`
      )

      if (response.status === 'success' && response.result) {
        const result = response.result as any
        const refinedIdea: IdeaCard = {
          ...idea,
          title: result.refined_idea || idea.title,
          whyItWorks: result.reasoning || idea.whyItWorks
        }
        setSelectedIdea(refinedIdea)
        setIdeas(ideas.map(i => i.id === idea.id ? refinedIdea : i))
      }
    } catch (error) {
      console.error('Error refining idea:', error)
    }
    setLoading(false)
  }

  // Turn idea into draft
  const turnIntoDraft = async (idea: IdeaCard) => {
    setLoading(true)
    try {
      const voiceSettings = `casualness=${voicePreset.casualness}, boldness=${voicePreset.boldness}, emoji_usage=${voicePreset.emojiUsage}, professionalism=${voicePreset.professionalism}`

      const response = await callAIAgent(
        AGENT_IDS.VOICE_WRITER,
        `Write an Instagram ${constraints.contentType} caption for this idea: "${idea.title}". Why it works: ${idea.whyItWorks}. Voice settings: ${voiceSettings}. ${matchMyPosts ? 'Match my past posts.' : ''} ${dontSoundAI ? 'Don\'t sound AI-generated.' : ''}`
      )

      if (response.status === 'success' && response.result) {
        const result = response.result as any
        setDraft({
          caption: result.generated_content || result.body || '',
          hook: result.hook || '',
          body: result.body || result.generated_content || '',
          cta: result.cta || ''
        })
        setCurrentScreen('draft-editor')
      }
    } catch (error) {
      console.error('Error generating draft:', error)
    }
    setLoading(false)
  }

  // Rewrite section of draft
  const rewriteSection = async (text: string, instruction: string) => {
    setLoading(true)
    try {
      const voiceSettings = `casualness=${voicePreset.casualness}, boldness=${voicePreset.boldness}, emoji_usage=${voicePreset.emojiUsage}, professionalism=${voicePreset.professionalism}`

      const response = await callAIAgent(
        AGENT_IDS.VOICE_WRITER,
        `Rewrite this text: "${text}". Instruction: ${instruction}. Voice settings: ${voiceSettings}.`
      )

      if (response.status === 'success' && response.result) {
        const result = response.result as any
        // Return the rewritten text
        return result.generated_content || result.body || text
      }
    } catch (error) {
      console.error('Error rewriting:', error)
    }
    setLoading(false)
    return text
  }

  // DASHBOARD SCREEN
  const DashboardScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">CreatorPilot</h1>
          <p className="text-slate-400">Your AI Content Strategist</p>
        </div>

        {/* Daily Insight - Hero */}
        <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-700/50 mb-8 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-white font-bold">
              Your Content Reality Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-purple-100 leading-tight">
                {dailyInsight}
              </h2>
              <p className="text-sm text-slate-400">Based on your last 14 posts</p>

              <button
                onClick={() => setInsightExpanded(!insightExpanded)}
                className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors"
              >
                {insightExpanded ? <FiChevronUp /> : <FiChevronDown />}
                <span className="text-sm font-medium">Why This Matters</span>
              </button>

              {insightExpanded && (
                <div className="pt-4 border-t border-purple-700/30 space-y-3">
                  <p className="text-slate-300">
                    Your audience connects more deeply when you share personal experiences and insights.
                    They're not just scrolling past - they're saving your content to revisit later.
                  </p>
                  <div className="bg-purple-950/50 rounded-lg p-4">
                    <p className="text-sm text-purple-200 font-medium mb-2">What to try:</p>
                    <p className="text-sm text-slate-300">
                      Lead with a personal story in your next 3 posts instead of jumping straight to tips
                    </p>
                  </div>
                  <div className="bg-red-950/30 rounded-lg p-4">
                    <p className="text-sm text-red-200 font-medium mb-2">What happens if you don't:</p>
                    <p className="text-sm text-slate-300">
                      You'll keep getting views, but miss the deeper connection that turns followers into fans
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Best Performing Post */}
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur hover:border-purple-700/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <FiTrendingUp className="text-green-400" />
                Best Performing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="aspect-square bg-gradient-to-br from-purple-800/30 to-blue-800/30 rounded-lg flex items-center justify-center">
                  <FiBarChart2 className="text-4xl text-purple-300" />
                </div>
                <div className="bg-purple-900/30 rounded-full px-3 py-1 inline-block">
                  <p className="text-xs text-purple-200 font-medium">Story-led carousel</p>
                </div>
                <p className="text-sm text-slate-300">2.3K saves, 89% completion rate</p>
              </div>
            </CardContent>
          </Card>

          {/* Pattern Detected */}
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur hover:border-purple-700/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <FiTarget className="text-blue-400" />
                Pattern Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FiEye className="text-blue-300 text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Face + text hook</p>
                    <p className="text-xs text-slate-400">Wins every time</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300">Posts with your face visible in frame 1 get 2.1x more engagement</p>
              </div>
            </CardContent>
          </Card>

          {/* Missed Opportunity */}
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur hover:border-yellow-700/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <FiAlertCircle className="text-yellow-400" />
                Missed Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <FiZap className="text-yellow-300 text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Posting time</p>
                    <p className="text-xs text-slate-400">Could improve reach</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300">Posting 1 hour earlier could increase initial reach by 30%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary CTA */}
        <div className="flex justify-center">
          <Button
            onClick={() => {
              generateInsights()
              setCurrentScreen('insight-canvas')
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg px-12 py-6 rounded-xl shadow-lg shadow-purple-900/50"
          >
            Improve My Next Post
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
            <h1 className="text-3xl font-bold text-white mb-1">Insight Canvas</h1>
            <p className="text-slate-400">Select insights that resonate, then set your constraints</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentScreen('dashboard')}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <FiX className="mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Insight Stack */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Available Insights</h2>

            {loading && insights.length === 3 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-purple-300">Loading insights...</div>
              </div>
            ) : (
              insights.map(insight => (
                <Card
                  key={insight.id}
                  className={`bg-slate-900/50 border transition-all cursor-pointer ${
                    insight.selected
                      ? 'border-purple-500 bg-purple-900/20'
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
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            insight.confidence === 'high'
                              ? 'bg-green-900/30 text-green-300'
                              : insight.confidence === 'medium'
                              ? 'bg-yellow-900/30 text-yellow-300'
                              : 'bg-red-900/30 text-red-300'
                          }`}>
                            {insight.confidence} confidence
                          </span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
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
              ))
            )}

            <Button
              onClick={generateInsights}
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:text-white mt-4"
            >
              <FiRefreshCw className="mr-2" />
              Refresh Insights
            </Button>
          </div>

          {/* RIGHT: Constraints Panel */}
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Set Your Constraints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Content Type */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Content Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['reel', 'carousel', 'story'] as ContentType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setConstraints({ ...constraints, contentType: type })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          constraints.contentType === type
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Goal</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['reach', 'saves', 'authority'] as Goal[]).map(goal => (
                      <button
                        key={goal}
                        onClick={() => setConstraints({ ...constraints, goal })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          constraints.goal === goal
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {goal.charAt(0).toUpperCase() + goal.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Effort Level */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Effort Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as EffortLevel[]).map(level => (
                      <button
                        key={level}
                        onClick={() => setConstraints({ ...constraints, effortLevel: level })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          constraints.effortLevel === level
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Tone</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['raw', 'polished', 'bold'] as Tone[]).map(tone => (
                      <button
                        key={tone}
                        onClick={() => setConstraints({ ...constraints, tone })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          constraints.tone === tone
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generateIdeas}
                  disabled={insights.filter(i => i.selected).length === 0 || loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {loading ? 'Generating...' : 'Generate Ideas'}
                </Button>

                {insights.filter(i => i.selected).length === 0 && (
                  <p className="text-xs text-slate-500 text-center">
                    Select at least one insight to continue
                  </p>
                )}
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
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Idea Board</h1>
            <p className="text-slate-400">Choose an idea to refine or turn into a draft</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentScreen('insight-canvas')}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <FiX className="mr-2" />
            Back to Canvas
          </Button>
        </div>

        {/* Ideas Grid */}
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
                  <CardTitle className="text-lg text-white leading-tight">
                    {idea.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Why it works:</p>
                    <p className="text-sm text-slate-300">{idea.whyItWorks}</p>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Hook preview:</p>
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
                      {idea.effortLevel} effort
                    </span>
                    {idea.basedOn.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300">
                        {tag.length > 20 ? tag.substring(0, 20) + '...' : tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedIdea(idea)
                        // Show refinement UI
                      }}
                      className="border-slate-700 text-slate-300 hover:text-white"
                    >
                      <FiEdit3 className="mr-1 text-xs" />
                      Tweak
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => turnIntoDraft(idea)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Turn into Draft
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setIdeas(ideas.map(i =>
                        i.id === idea.id ? { ...i, status: 'saved' } : i
                      ))}
                      className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-green-900/30 text-slate-400 hover:text-green-300 transition-colors"
                    >
                      <FiThumbsUp className="text-xs" />
                      <span className="text-xs">Save</span>
                    </button>
                    <button
                      onClick={() => generateIdeas()}
                      className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-blue-900/30 text-slate-400 hover:text-blue-300 transition-colors"
                    >
                      <FiRefreshCw className="text-xs" />
                      <span className="text-xs">Similar</span>
                    </button>
                    <button
                      onClick={() => setIdeas(ideas.map(i =>
                        i.id === idea.id ? { ...i, status: 'dismissed' } : i
                      ))}
                      className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-300 transition-colors"
                    >
                      <FiThumbsDown className="text-xs" />
                      <span className="text-xs">Dismiss</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Refinement Panel (shown when idea selected) */}
        {selectedIdea && (
          <Card className="mt-8 bg-slate-900/80 border-purple-700/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Refine: {selectedIdea.title}</CardTitle>
                <button
                  onClick={() => setSelectedIdea(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <FiX />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-300">More Personal</label>
                  <label className="text-sm text-slate-300">More Educational</label>
                </div>
                <Slider
                  value={[refinementSliders.personalEducational]}
                  onValueChange={(value) =>
                    setRefinementSliders({ ...refinementSliders, personalEducational: value[0] })
                  }
                  min={0}
                  max={100}
                  step={1}
                  className="mb-4"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-300">Soft Hook</label>
                  <label className="text-sm text-slate-300">Bold Hook</label>
                </div>
                <Slider
                  value={[refinementSliders.softBold]}
                  onValueChange={(value) =>
                    setRefinementSliders({ ...refinementSliders, softBold: value[0] })
                  }
                  min={0}
                  max={100}
                  step={1}
                  className="mb-4"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-300">Add Controversy?</label>
                  <span className="text-sm text-slate-400">{refinementSliders.controversy}%</span>
                </div>
                <Slider
                  value={[refinementSliders.controversy]}
                  onValueChange={(value) =>
                    setRefinementSliders({ ...refinementSliders, controversy: value[0] })
                  }
                  min={0}
                  max={100}
                  step={1}
                  className="mb-4"
                />
              </div>

              <Button
                onClick={() => refineIdea(selectedIdea)}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? 'Refining...' : 'Apply Refinements'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  // DRAFT EDITOR SCREEN
  const DraftEditorScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Draft Editor</h1>
            <p className="text-slate-400">Fine-tune your content with inline AI assistance</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowVoicePanel(!showVoicePanel)}
              className="border-slate-700 text-slate-300 hover:text-white"
            >
              <FiSettings className="mr-2" />
              Voice Settings
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentScreen('idea-board')}
              className="border-slate-700 text-slate-300 hover:text-white"
            >
              <FiX className="mr-2" />
              Back to Ideas
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-purple-300">Generating draft...</div>
              </div>
            ) : (
              <>
                {/* Hook Section */}
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-sm">Hook</CardTitle>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            const rewritten = await rewriteSection(draft.hook, 'Make this more me')
                            setDraft({ ...draft, hook: rewritten })
                          }}
                          className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-purple-900/30 text-slate-400 hover:text-purple-300 transition-colors"
                        >
                          Make this more me
                        </button>
                        <button
                          onClick={async () => {
                            const rewritten = await rewriteSection(draft.hook, 'Make this punchier')
                            setDraft({ ...draft, hook: rewritten })
                          }}
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
                      placeholder="Your hook goes here..."
                    />
                  </CardContent>
                </Card>

                {/* Body Section */}
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-sm">Body</CardTitle>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            const rewritten = await rewriteSection(draft.body, 'Shorten this')
                            setDraft({ ...draft, body: rewritten })
                          }}
                          className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-purple-900/30 text-slate-400 hover:text-purple-300 transition-colors"
                        >
                          Shorten
                        </button>
                        <button
                          onClick={async () => {
                            const rewritten = await rewriteSection(draft.body, 'Make this more personal')
                            setDraft({ ...draft, body: rewritten })
                          }}
                          className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-purple-900/30 text-slate-400 hover:text-purple-300 transition-colors"
                        >
                          More personal
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      className="w-full bg-slate-800/50 text-white rounded-lg p-4 min-h-[200px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Your content body..."
                    />
                  </CardContent>
                </Card>

                {/* CTA Section */}
                {draft.cta && (
                  <Card className="bg-slate-900/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Call to Action</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        value={draft.cta}
                        onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
                        className="w-full bg-slate-800/50 text-white rounded-lg p-4 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Your call to action..."
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Full Caption Preview */}
                <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/50">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Full Caption</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-slate-200 whitespace-pre-wrap">
                        {draft.caption || `${draft.hook}\n\n${draft.body}${draft.cta ? `\n\n${draft.cta}` : ''}`}
                      </p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            draft.caption || `${draft.hook}\n\n${draft.body}${draft.cta ? `\n\n${draft.cta}` : ''}`
                          )
                        }}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white"
                      >
                        <FiCopy className="mr-2" />
                        Copy Caption
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      >
                        <FiSave className="mr-2" />
                        Save to Calendar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Voice Sidebar */}
          <div className="space-y-6">
            {showVoicePanel && (
              <Card className="bg-slate-900/80 border-purple-700/50 backdrop-blur sticky top-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Voice Control</CardTitle>
                    <button
                      onClick={() => setShowVoicePanel(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <FiX />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Voice Preset Name */}
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Preset Name</label>
                    <input
                      type="text"
                      value={voicePreset.name}
                      onChange={(e) => setVoicePreset({ ...voicePreset, name: e.target.value })}
                      className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Casualness Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-slate-300">Casualness</label>
                      <span className="text-sm text-slate-400">{voicePreset.casualness}/10</span>
                    </div>
                    <Slider
                      value={[voicePreset.casualness]}
                      onValueChange={(value) =>
                        setVoicePreset({ ...voicePreset, casualness: value[0] })
                      }
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>

                  {/* Boldness Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-slate-300">Boldness</label>
                      <span className="text-sm text-slate-400">{voicePreset.boldness}/10</span>
                    </div>
                    <Slider
                      value={[voicePreset.boldness]}
                      onValueChange={(value) =>
                        setVoicePreset({ ...voicePreset, boldness: value[0] })
                      }
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>

                  {/* Emoji Usage Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-slate-300">Emoji Usage</label>
                      <span className="text-sm text-slate-400">{voicePreset.emojiUsage}/10</span>
                    </div>
                    <Slider
                      value={[voicePreset.emojiUsage]}
                      onValueChange={(value) =>
                        setVoicePreset({ ...voicePreset, emojiUsage: value[0] })
                      }
                      min={0}
                      max={10}
                      step={1}
                    />
                  </div>

                  {/* Professionalism Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-slate-300">Professionalism</label>
                      <span className="text-sm text-slate-400">{voicePreset.professionalism}/10</span>
                    </div>
                    <Slider
                      value={[voicePreset.professionalism]}
                      onValueChange={(value) =>
                        setVoicePreset({ ...voicePreset, professionalism: value[0] })
                      }
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3 pt-4 border-t border-slate-700">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-slate-300">Match my past posts</span>
                      <input
                        type="checkbox"
                        checked={matchMyPosts}
                        onChange={(e) => setMatchMyPosts(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-purple-600 focus:ring-2 focus:ring-purple-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-slate-300">Don't sound AI-ish</span>
                      <input
                        type="checkbox"
                        checked={dontSoundAI}
                        onChange={(e) => setDontSoundAI(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-purple-600 focus:ring-2 focus:ring-purple-500"
                      />
                    </label>
                  </div>

                  {/* Sample Preview */}
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-2">Sample with current settings:</p>
                    <p className="text-sm text-slate-300 italic">
                      {voicePreset.casualness > 7
                        ? "Hey! So I just discovered something crazy about my morning routine..."
                        : voicePreset.professionalism > 7
                        ? "Today I want to share an important insight about productivity strategies."
                        : "Let me tell you about something I learned this week."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-sm">Draft Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Character count</span>
                  <span className="text-sm text-white font-medium">
                    {(draft.caption || `${draft.hook}\n\n${draft.body}${draft.cta ? `\n\n${draft.cta}` : ''}`).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Estimated read time</span>
                  <span className="text-sm text-white font-medium">
                    {Math.ceil((draft.caption || `${draft.hook}\n\n${draft.body}`).split(' ').length / 200)} min
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )

  // RENDER
  return (
    <>
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'insight-canvas' && <InsightCanvasScreen />}
      {currentScreen === 'idea-board' && <IdeaBoardScreen />}
      {currentScreen === 'draft-editor' && <DraftEditorScreen />}
    </>
  )
}
