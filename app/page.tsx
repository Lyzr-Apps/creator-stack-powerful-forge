'use client'

import { useState, useEffect, useRef } from 'react'
import { callAIAgent, type NormalizedAgentResponse } from '@/lib/aiAgent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { FiSend, FiSettings, FiTrendingUp, FiMessageCircle, FiEdit3, FiChevronDown, FiChevronUp, FiX, FiRefreshCw } from 'react-icons/fi'

// Agent IDs
const AGENT_IDS = {
  CREATOR_PARTNER_MANAGER: '69858798094c8b2d4207dcba',
  INSIGHT_COACH: '69858743e17e33c11eed19b3',
  BRAINSTORM_PARTNER: '698587582237a2c55706b012',
  VOICE_WRITER: '6985876eb90162af337b1ea1',
  TREND_CONTEXT: '6985878307ec48e3dc90a194',
}

// TypeScript interfaces from actual test responses
interface CreatorPartnerManagerResult {
  detected_intent: 'insight' | 'brainstorm' | 'write' | 'trend'
  routed_to_agent: string
  context_summary: string
  routing_confidence: 'low' | 'medium' | 'high'
  user_message_interpretation: string
}

interface InsightCoachResult {
  observation: string
  explanation: string
  suggestion?: string | null
  emotional_insight: string
  confidence_level: 'low' | 'medium' | 'high'
}

interface BrainstormPartnerResult {
  original_idea: string
  refined_idea: string
  clarifying_questions: string[]
  validation_points: string[]
  evolution_stage: 'initial' | 'refining' | 'final'
  reasoning: string
}

interface VoiceWriterResult {
  content_type: string
  generated_content: string
  hook: string
  body: string
  cta: string
  voice_parameters_used: {
    casualness: number
    boldness: number
    emoji_usage: string
    professionalism: number
  }
  variations: string[]
}

interface TrendContextResult {
  trend_name: string
  trend_description: string
  relevance_to_creator: string
  past_winner_match?: string
  actionable_insight: string
  confidence_level: 'low' | 'medium' | 'high'
  uncertainty_note?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agentType?: 'insight' | 'brainstorm' | 'write' | 'trend' | 'manager'
  data?: any
}

interface VoicePreset {
  name: string
  casualness: number
  boldness: number
  emoji_usage: number
  professionalism: number
}

interface IdeaEvolution {
  original: string
  refined: string
  stage: string
  contributions: string[]
}

export default function Home() {
  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeMode, setActiveMode] = useState<'insight' | 'brainstorm' | 'write' | null>(null)
  const [showVoicePanel, setShowVoicePanel] = useState(false)
  const [dailyInsight, setDailyInsight] = useState<InsightCoachResult | null>(null)
  const [ideaEvolution, setIdeaEvolution] = useState<IdeaEvolution | null>(null)

  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState({
    casualness: 5,
    boldness: 5,
    emoji_usage: 5,
    professionalism: 5,
  })

  const [voicePresets, setVoicePresets] = useState<VoicePreset[]>([
    { name: 'Professional', casualness: 3, boldness: 4, emoji_usage: 2, professionalism: 8 },
    { name: 'Casual & Fun', casualness: 8, boldness: 6, emoji_usage: 8, professionalism: 3 },
    { name: 'Balanced', casualness: 5, boldness: 5, emoji_usage: 5, professionalism: 5 },
  ])

  const [selectedPreset, setSelectedPreset] = useState<string>('Balanced')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load daily insight on mount
  useEffect(() => {
    loadDailyInsight()
  }, [])

  const loadDailyInsight = async () => {
    const result = await callAIAgent(
      'Give me an insight about my recent content performance',
      AGENT_IDS.INSIGHT_COACH
    )
    if (result.success && result.response.status === 'success') {
      setDailyInsight(result.response.result as InsightCoachResult)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // First, route through Creator Partner Manager
      const routingResult = await callAIAgent(inputValue, AGENT_IDS.CREATOR_PARTNER_MANAGER)

      if (routingResult.success && routingResult.response.status === 'success') {
        const managerData = routingResult.response.result as CreatorPartnerManagerResult
        const intent = managerData.detected_intent

        // Set active mode based on routing
        setActiveMode(intent)

        // Route to appropriate sub-agent
        let agentId = AGENT_IDS.CREATOR_PARTNER_MANAGER
        if (intent === 'insight') agentId = AGENT_IDS.INSIGHT_COACH
        else if (intent === 'brainstorm') agentId = AGENT_IDS.BRAINSTORM_PARTNER
        else if (intent === 'write') agentId = AGENT_IDS.VOICE_WRITER
        else if (intent === 'trend') agentId = AGENT_IDS.TREND_CONTEXT

        // Call the routed agent
        let finalMessage = inputValue
        if (intent === 'write') {
          // Add voice parameters for writer agent
          finalMessage = `${inputValue}. Voice settings: casualness=${voiceSettings.casualness}, boldness=${voiceSettings.boldness}, emoji_usage=${voiceSettings.emoji_usage}, professionalism=${voiceSettings.professionalism}`
        }

        const agentResult = await callAIAgent(finalMessage, agentId)

        if (agentResult.success && agentResult.response.status === 'success') {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: getMessageContent(agentResult.response, intent),
            timestamp: new Date(),
            agentType: intent,
            data: agentResult.response.result,
          }

          setMessages(prev => [...prev, assistantMessage])

          // Update idea evolution for brainstorm
          if (intent === 'brainstorm') {
            const brainstormData = agentResult.response.result as BrainstormPartnerResult
            setIdeaEvolution({
              original: brainstormData.original_idea,
              refined: brainstormData.refined_idea,
              stage: brainstormData.evolution_stage,
              contributions: brainstormData.validation_points,
            })
          }
        } else {
          addErrorMessage(agentResult.response.message || 'Failed to get response')
        }
      } else {
        addErrorMessage('Failed to route message')
      }
    } catch (error) {
      addErrorMessage('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const addErrorMessage = (errorText: string) => {
    const errorMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `I'm not fully sure about this - here's what I can see: ${errorText}`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, errorMessage])
  }

  const getMessageContent = (response: NormalizedAgentResponse, intent: string): string => {
    const result = response.result

    if (intent === 'insight') {
      const data = result as InsightCoachResult
      return data.observation || 'No insight available'
    } else if (intent === 'brainstorm') {
      const data = result as BrainstormPartnerResult
      return data.refined_idea || 'No refined idea available'
    } else if (intent === 'write') {
      const data = result as VoiceWriterResult
      return data.generated_content || 'No content generated'
    } else if (intent === 'trend') {
      const data = result as TrendContextResult
      return data.trend_description || data.uncertainty_note || 'No trend data available'
    }

    return 'Response received'
  }

  const applyVoicePreset = (presetName: string) => {
    const preset = voicePresets.find(p => p.name === presetName)
    if (preset) {
      setVoiceSettings({
        casualness: preset.casualness,
        boldness: preset.boldness,
        emoji_usage: preset.emoji_usage,
        professionalism: preset.professionalism,
      })
      setSelectedPreset(presetName)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
      {/* Breathing gradient header */}
      <div className="h-2 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-purple-500/50 animate-pulse" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Daily Insight Card */}
        {dailyInsight && <DailyInsightCard insight={dailyInsight} onRefresh={loadDailyInsight} />}

        {/* Main Content Area */}
        <div className="mt-6 flex gap-6">
          {/* Conversation Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages Container */}
            <div className="flex-1 mb-4 overflow-y-auto max-h-[calc(100vh-400px)] space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-20">
                  <FiMessageCircle className="mx-auto text-6xl text-gray-600 mb-4" />
                  <h2 className="text-2xl font-light text-gray-400 mb-2">Ready to Create</h2>
                  <p className="text-gray-500">Start a conversation to get insights, brainstorm ideas, or write content</p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))
              )}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 animate-pulse" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Idea Evolution View */}
            {ideaEvolution && <IdeaEvolutionView evolution={ideaEvolution} />}

            {/* Input Area */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50">
              <div className="flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="What would you like to explore today?"
                  className="flex-1 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <FiSend className="text-xl" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mode Indicators - Right Edge */}
          <ModeIndicators activeMode={activeMode} onVoiceClick={() => setShowVoicePanel(true)} />
        </div>
      </div>

      {/* Voice Control Panel */}
      {showVoicePanel && (
        <VoiceControlPanel
          voiceSettings={voiceSettings}
          setVoiceSettings={setVoiceSettings}
          voicePresets={voicePresets}
          selectedPreset={selectedPreset}
          applyVoicePreset={applyVoicePreset}
          onClose={() => setShowVoicePanel(false)}
        />
      )}
    </div>
  )
}

// Daily Insight Card Component
function DailyInsightCard({ insight, onRefresh }: { insight: InsightCoachResult; onRefresh: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-xs text-purple-300 mb-2 font-medium">TODAY'S INSIGHT</div>
            <CardTitle className="text-2xl font-light text-white leading-relaxed">
              {insight.emotional_insight}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-purple-300 hover:text-purple-200"
          >
            <FiRefreshCw className="text-lg" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-gray-300 text-sm">{insight.observation}</p>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-300 hover:text-purple-200 text-sm"
          >
            {isExpanded ? (
              <>
                <FiChevronUp className="mr-2" /> Hide Details
              </>
            ) : (
              <>
                <FiChevronDown className="mr-2" /> Why This Matters
              </>
            )}
          </Button>

          {isExpanded && (
            <div className="mt-4 p-4 bg-black/30 rounded-lg">
              <p className="text-gray-300 text-sm leading-relaxed">{insight.explanation}</p>
              {insight.suggestion && (
                <div className="mt-3 pt-3 border-t border-purple-500/20">
                  <p className="text-purple-200 text-sm font-medium mb-2">Suggestion:</p>
                  <p className="text-gray-300 text-sm">{insight.suggestion}</p>
                </div>
              )}
              <div className="mt-3 text-xs text-gray-500">
                Confidence: {insight.confidence_level}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Message Bubble Component
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'ml-12' : 'mr-12'}`}>
        <div
          className={`rounded-2xl px-5 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
              : 'bg-gray-800/70 text-gray-100 backdrop-blur-sm border border-gray-700/50'
          }`}
        >
          {message.agentType && !isUser && (
            <div className="text-xs text-purple-300 mb-2 font-medium uppercase">
              {message.agentType} mode
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

          {/* Render special components based on agent type */}
          {!isUser && message.data && (
            <div className="mt-4">
              {message.agentType === 'insight' && <InsightCard data={message.data as InsightCoachResult} />}
              {message.agentType === 'brainstorm' && <BrainstormCard data={message.data as BrainstormPartnerResult} />}
              {message.agentType === 'write' && <WriteCard data={message.data as VoiceWriterResult} />}
              {message.agentType === 'trend' && <TrendCard data={message.data as TrendContextResult} />}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-600 mt-1 px-2">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

// Insight Card Component
function InsightCard({ data }: { data: InsightCoachResult }) {
  return (
    <div className="bg-black/30 rounded-lg p-4 space-y-3">
      <div>
        <div className="text-xs text-purple-300 mb-1">EXPLANATION</div>
        <p className="text-sm text-gray-300">{data.explanation}</p>
      </div>
      {data.suggestion && (
        <div>
          <div className="text-xs text-purple-300 mb-1">SUGGESTION</div>
          <p className="text-sm text-gray-300">{data.suggestion}</p>
        </div>
      )}
    </div>
  )
}

// Brainstorm Card Component
function BrainstormCard({ data }: { data: BrainstormPartnerResult }) {
  return (
    <div className="bg-black/30 rounded-lg p-4 space-y-3">
      {data.clarifying_questions && data.clarifying_questions.length > 0 && (
        <div>
          <div className="text-xs text-purple-300 mb-2">QUESTIONS TO CONSIDER</div>
          <ul className="space-y-1">
            {data.clarifying_questions.map((q, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.validation_points && data.validation_points.length > 0 && (
        <div>
          <div className="text-xs text-purple-300 mb-2">VALIDATION POINTS</div>
          <ul className="space-y-1">
            {data.validation_points.map((p, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Write Card Component
function WriteCard({ data }: { data: VoiceWriterResult }) {
  const [showVariations, setShowVariations] = useState(false)

  return (
    <div className="bg-black/30 rounded-lg p-4 space-y-3">
      <div className="space-y-2">
        <div className="text-xs text-purple-300">HOOK</div>
        <p className="text-sm text-gray-300">{data.hook}</p>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-purple-300">BODY</div>
        <p className="text-sm text-gray-300">{data.body}</p>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-purple-300">CTA</div>
        <p className="text-sm text-gray-300">{data.cta}</p>
      </div>

      {data.variations && data.variations.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVariations(!showVariations)}
            className="text-purple-300 hover:text-purple-200 text-xs"
          >
            {showVariations ? 'Hide' : 'Show'} Variations ({data.variations.length})
          </Button>

          {showVariations && (
            <div className="mt-3 space-y-2">
              {data.variations.map((v, i) => (
                <div key={i} className="p-3 bg-gray-900/50 rounded text-sm text-gray-300">
                  {v}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Trend Card Component
function TrendCard({ data }: { data: TrendContextResult }) {
  return (
    <div className="bg-black/30 rounded-lg p-4 space-y-3">
      {data.trend_name && (
        <div>
          <div className="text-xs text-purple-300 mb-1">TREND</div>
          <p className="text-sm font-medium text-white">{data.trend_name}</p>
        </div>
      )}
      {data.relevance_to_creator && (
        <div>
          <div className="text-xs text-purple-300 mb-1">RELEVANCE</div>
          <p className="text-sm text-gray-300">{data.relevance_to_creator}</p>
        </div>
      )}
      {data.actionable_insight && (
        <div>
          <div className="text-xs text-purple-300 mb-1">ACTION</div>
          <p className="text-sm text-gray-300">{data.actionable_insight}</p>
        </div>
      )}
      {data.uncertainty_note && (
        <div className="text-xs text-yellow-300/70 italic">
          {data.uncertainty_note}
        </div>
      )}
    </div>
  )
}

// Mode Indicators Component
function ModeIndicators({
  activeMode,
  onVoiceClick
}: {
  activeMode: 'insight' | 'brainstorm' | 'write' | null
  onVoiceClick: () => void
}) {
  const modes = [
    { id: 'insight' as const, icon: FiTrendingUp, label: 'Insight' },
    { id: 'brainstorm' as const, icon: FiMessageCircle, label: 'Brainstorm' },
    { id: 'write' as const, icon: FiEdit3, label: 'Write' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {modes.map((mode) => (
        <div
          key={mode.id}
          className={`p-3 rounded-full transition-all ${
            activeMode === mode.id
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/50'
              : 'bg-gray-800/50 border border-gray-700/50'
          }`}
        >
          <mode.icon className={`text-xl ${activeMode === mode.id ? 'text-white' : 'text-gray-500'}`} />
        </div>
      ))}

      <Button
        onClick={onVoiceClick}
        variant="ghost"
        size="sm"
        className="p-3 rounded-full bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50"
      >
        <FiSettings className="text-xl text-gray-400" />
      </Button>
    </div>
  )
}

// Voice Control Panel Component
function VoiceControlPanel({
  voiceSettings,
  setVoiceSettings,
  voicePresets,
  selectedPreset,
  applyVoicePreset,
  onClose,
}: {
  voiceSettings: { casualness: number; boldness: number; emoji_usage: number; professionalism: number }
  setVoiceSettings: (settings: any) => void
  voicePresets: VoicePreset[]
  selectedPreset: string
  applyVoicePreset: (name: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end">
      <div className="bg-gray-900 h-full w-full max-w-md border-l border-gray-700 shadow-2xl animate-slide-in-right">
        <div className="p-6 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light text-white">Voice Control</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <FiX className="text-xl text-gray-400" />
            </Button>
          </div>

          {/* Presets */}
          <div className="mb-8">
            <div className="text-xs text-purple-300 mb-3 font-medium">PRESETS</div>
            <div className="grid grid-cols-3 gap-2">
              {voicePresets.map((preset) => (
                <Button
                  key={preset.name}
                  onClick={() => applyVoicePreset(preset.name)}
                  variant={selectedPreset === preset.name ? 'default' : 'outline'}
                  className={
                    selectedPreset === preset.name
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                      : 'border-gray-700 text-gray-300'
                  }
                  size="sm"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-6">
            <VoiceSlider
              label="Casualness"
              description="Formal ↔ Conversational"
              value={voiceSettings.casualness}
              onChange={(value) => setVoiceSettings({ ...voiceSettings, casualness: value })}
            />
            <VoiceSlider
              label="Boldness"
              description="Subtle ↔ Bold"
              value={voiceSettings.boldness}
              onChange={(value) => setVoiceSettings({ ...voiceSettings, boldness: value })}
            />
            <VoiceSlider
              label="Emoji Usage"
              description="Minimal ↔ Expressive"
              value={voiceSettings.emoji_usage}
              onChange={(value) => setVoiceSettings({ ...voiceSettings, emoji_usage: value })}
            />
            <VoiceSlider
              label="Professionalism"
              description="Playful ↔ Professional"
              value={voiceSettings.professionalism}
              onChange={(value) => setVoiceSettings({ ...voiceSettings, professionalism: value })}
            />
          </div>

          {/* Sample Preview */}
          <div className="mt-8 p-4 bg-black/30 rounded-lg border border-purple-500/20">
            <div className="text-xs text-purple-300 mb-2">SAMPLE CAPTION PREVIEW</div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Your caption will reflect these voice settings when you request content from the Write mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Voice Slider Component
function VoiceSlider({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-white font-medium">{label}</div>
        <div className="text-xs text-purple-300">{value}/10</div>
      </div>
      <Slider
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        min={1}
        max={10}
        step={1}
        className="mb-1"
      />
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  )
}

// Idea Evolution View Component
function IdeaEvolutionView({ evolution }: { evolution: IdeaEvolution }) {
  return (
    <Card className="mb-4 bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-light text-white">Idea Evolution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-purple-300 font-medium">ORIGINAL</div>
            <div className="p-3 bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-300">{evolution.original}</p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-purple-400">→</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-green-300 font-medium">REFINED</div>
            <div className="p-3 bg-gradient-to-br from-green-900/20 to-blue-900/20 rounded-lg border border-green-500/20">
              <p className="text-sm text-gray-300">{evolution.refined}</p>
            </div>
          </div>
        </div>
        {evolution.contributions && evolution.contributions.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-purple-300 mb-2">YOUR CONTRIBUTIONS</div>
            <div className="flex flex-wrap gap-2">
              {evolution.contributions.map((contrib, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full text-xs border border-purple-500/30"
                >
                  {contrib}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
