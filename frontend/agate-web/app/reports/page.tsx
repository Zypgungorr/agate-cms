'use client';

import { useState, useEffect } from 'react';
import { 
  getCampaigns, 
  type CampaignListItem,
  CAMPAIGN_STATUS_LABELS
} from '../../lib/campaigns';
import {
  getCampaignSuggestion,
  getCreativeIdea,
  exportCampaignSuggestionPdf,
  exportCreativeIdeaPdf,
  type CampaignSuggestionResponse,
  type CreativeIdeaResponse,
  type CampaignSuggestionRequest,
  type CreativeIdeaRequest
} from '../../lib/ai';

export default function ReportsPage() {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const [analysisType, setAnalysisType] = useState<string>('performance');
  const [additionalContext, setAdditionalContext] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Campaign Suggestion Results
  const [campaignSuggestionResult, setCampaignSuggestionResult] = useState<CampaignSuggestionResponse | null>(null);
  
  // Creative Idea Results
  const [requestType, setRequestType] = useState<string>('creative');
  const [brief, setBrief] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [tone, setTone] = useState<string>('professional');
  const [creativeIdeaResult, setCreativeIdeaResult] = useState<CreativeIdeaResponse | null>(null);
  
  const [activeTab, setActiveTab] = useState<'campaign' | 'creative'>('campaign');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const campaignsData = await getCampaigns();
      setCampaigns(campaignsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error loading campaigns:', err);
      setError(errorMessage);
    }
  };

  const handleCampaignSuggestion = async () => {
    if (!selectedCampaignId) {
      setError('Please select a campaign');
      return;
    }

    setLoading(true);
    setError(null);
    setCampaignSuggestionResult(null);

    try {
      const request: CampaignSuggestionRequest = {
        campaignId: selectedCampaignId,
        analysisType: analysisType || undefined,
        additionalContext: additionalContext || undefined,
      };

      const result = await getCampaignSuggestion(request);
      setCampaignSuggestionResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error generating campaign suggestion';
      console.error('Error generating campaign suggestion:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreativeIdea = async () => {
    if (!selectedCampaignId) {
      setError('Please select a campaign');
      return;
    }

    setLoading(true);
    setError(null);
    setCreativeIdeaResult(null);

    try {
      const request: CreativeIdeaRequest = {
        campaignId: selectedCampaignId,
        requestType: requestType,
        brief: brief || undefined,
        targetAudience: targetAudience || undefined,
        tone: tone || undefined,
      };

      const result = await getCreativeIdea(request);
      setCreativeIdeaResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error generating creative idea';
      console.error('Error generating creative idea:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">AI Reports & Analysis</h1>
          <p className="text-gray-600 mt-2">Get AI-powered insights and suggestions for your campaigns</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('campaign')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'campaign'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Campaign Analysis
              </button>
              <button
                onClick={() => setActiveTab('creative')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'creative'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Creative Ideas
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Campaign Selection */}
            <div className="mb-6">
              <label htmlFor="campaign-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Campaign *
              </label>
              <select
                id="campaign-select"
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                <option value="">-- Select a campaign --</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title} - {campaign.clientName} ({CAMPAIGN_STATUS_LABELS[campaign.status as keyof typeof CAMPAIGN_STATUS_LABELS] || campaign.status})
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'campaign' && (
              <>
                {/* Campaign Analysis Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="analysis-type" className="block text-sm font-medium text-gray-700 mb-2">
                      Analysis Type
                    </label>
                    <select
                      id="analysis-type"
                      value={analysisType}
                      onChange={(e) => setAnalysisType(e.target.value)}
                      className="w-full px-3 py-2 border  border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                      <option value="performance">Performance Analysis</option>
                      <option value="ideas">Ideas & Suggestions</option>
                      <option value="optimization">Optimization</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="additional-context" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Context (Optional)
                    </label>
                    <textarea
                      id="additional-context"
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add any specific context or questions..."
                    />
                  </div>

                  <button
                    onClick={handleCampaignSuggestion}
                    disabled={loading || !selectedCampaignId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                    {loading ? 'Generating Analysis...' : 'Generate Campaign Analysis'}
                  </button>
                </div>

                {/* Campaign Analysis Results */}
                {campaignSuggestionResult && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
                      <button
                        onClick={async () => {
                          try {
                            const blob = await exportCampaignSuggestionPdf(campaignSuggestionResult);
                            const url = globalThis.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Campaign_Report_${selectedCampaign?.title?.replaceAll(/\s+/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            globalThis.URL.revokeObjectURL(url);
                            a.remove();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Error exporting PDF');
                          }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export PDF
                      </button>
                    </div>
                    
                    {campaignSuggestionResult.performanceAnalysis && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {campaignSuggestionResult.performanceAnalysis.summary}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600">Budget Utilization:</span>
                            <span className="ml-2 font-semibold text-gray-700">
                              {campaignSuggestionResult.performanceAnalysis.budgetUtilization.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Advert Completion Rate:</span>
                            <span className="ml-2 font-semibold text-gray-700">
                              {campaignSuggestionResult.performanceAnalysis.advertCompletionRate}%
                            </span>
                          </div>
                        </div>

                        {campaignSuggestionResult.performanceAnalysis.strengths.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                              {campaignSuggestionResult.performanceAnalysis.strengths.map((strength) => (
                                <li key={strength}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {campaignSuggestionResult.performanceAnalysis.weaknesses.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-red-700 mb-2">Weaknesses</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                              {campaignSuggestionResult.performanceAnalysis.weaknesses.map((weakness) => (
                                <li key={weakness}>{weakness}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {campaignSuggestionResult.performanceAnalysis.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-blue-700 mb-2">Recommendations</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                              {campaignSuggestionResult.performanceAnalysis.recommendations.map((rec) => (
                                <li key={rec}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {campaignSuggestionResult.ideas.length > 0 ? (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Campaign Ideas</h3>
                        <div className="grid gap-4">
                          {campaignSuggestionResult.ideas.map((idea) => (
                            <div key={`${idea.title}-${idea.category}`} className="bg-white border border-gray-200 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900">{idea.title}</h4>
                              <p className="text-gray-700 mt-1">{idea.description}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {idea.category}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Priority: {idea.priority}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : campaignSuggestionResult.performanceAnalysis && (
                      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                        No campaign ideas generated. Focus on performance analysis above.
                      </div>
                    )}

                    {campaignSuggestionResult.suggestions.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Suggestions</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {campaignSuggestionResult.suggestions.map((suggestion) => (
                            <li key={suggestion}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      Generated at: {new Date(campaignSuggestionResult.generatedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'creative' && (
              <>
                {/* Creative Idea Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="request-type" className="block text-sm font-medium text-gray-700 mb-2">
                      Request Type *
                    </label>
                    <select
                      id="request-type"
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="creative">Creative Ideas</option>
                      <option value="concept">Concept</option>
                      <option value="tagline">Tagline/Slogan</option>
                      <option value="visual">Visual Ideas</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="brief" className="block text-sm font-medium text-gray-700 mb-2">
                      Brief (Optional)
                    </label>
                    <textarea
                      id="brief"
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe what you're looking for..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="target-audience" className="block text-sm font-medium text-gray-700 mb-2">
                        Target Audience (Optional)
                      </label>
                      <input
                        id="target-audience"
                        type="text"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 25-45 professionals"
                      />
                    </div>

                    <div>
                      <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
                        Tone (Optional)
                      </label>
                      <select
                        id="tone"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="humorous">Humorous</option>
                        <option value="emotional">Emotional</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleCreativeIdea}
                    disabled={loading || !selectedCampaignId}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating Ideas...' : 'Generate Creative Ideas'}
                  </button>
                </div>

                {/* Creative Idea Results */}
                {creativeIdeaResult && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Creative Ideas</h2>
                      <button
                        onClick={async () => {
                          try {
                            const blob = await exportCreativeIdeaPdf(creativeIdeaResult);
                            const url = globalThis.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Creative_Ideas_${selectedCampaign?.title?.replaceAll(/\s+/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            globalThis.URL.revokeObjectURL(url);
                            a.remove();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Error exporting PDF');
                          }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export PDF
                      </button>
                    </div>
                    
                    {creativeIdeaResult.ideas.length > 0 ? (
                      <div className="grid gap-4">
                        {creativeIdeaResult.ideas.map((idea) => (
                          <div key={`${idea.title}-${idea.type}`} className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900">{idea.title}</h4>
                            <p className="text-gray-700 mt-1">{idea.description}</p>
                            {idea.rationale && (
                              <p className="text-sm text-gray-600 mt-2 italic">{idea.rationale}</p>
                            )}
                            {idea.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {idea.tags.map((tag) => (
                                  <span key={tag} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                        No creative ideas generated yet. Please generate ideas first.
                      </div>
                    )}

                    {creativeIdeaResult.suggestions.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Suggestions</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {creativeIdeaResult.suggestions.map((suggestion) => (
                            <li key={suggestion}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      Generated at: {new Date(creativeIdeaResult.generatedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

