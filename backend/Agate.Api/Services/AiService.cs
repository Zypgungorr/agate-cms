using System.Text;
using System.Text.Json;
using Agate.Api.DTOs;
using Agate.Api.Models;
using Microsoft.EntityFrameworkCore;
using Agate.Api.Data;

namespace Agate.Api.Services;

public class AiService : IAiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly AgateDbContext _context;
    private readonly ILogger<AiService> _logger;

    public AiService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        AgateDbContext context,
        ILogger<AiService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _context = context;
        _logger = logger;
    }

    public async Task<CampaignSuggestionResponseDto> GetCampaignSuggestionAsync(CampaignSuggestionRequestDto request)
    {
        try
        {
            // Get campaign data for context
            var campaign = await _context.Campaigns
                .Include(c => c.Client)
                .Include(c => c.Adverts)
                .Include(c => c.BudgetLines)
                .AsSplitQuery()
                .FirstOrDefaultAsync(c => c.Id == request.CampaignId);

            if (campaign == null)
            {
                throw new ArgumentException("Campaign not found");
            }

            // Build prompt based on analysis type
            var prompt = BuildCampaignAnalysisPrompt(campaign, request.AnalysisType, request.AdditionalContext);

            // Call AI API
            var aiResponseJson = await GenerateTextAsync(prompt, new Dictionary<string, object>
            {
                ["campaignId"] = campaign.Id,
                ["campaignTitle"] = campaign.Title,
                ["clientName"] = campaign.Client.Name
            });

            // Parse JSON response directly
            var budgetUtilization = campaign.EstimatedBudget > 0 
                ? (campaign.ActualCost / campaign.EstimatedBudget) * 100 
                : 0;

            var completionRate = campaign.Adverts.Count > 0
                ? (campaign.Adverts.Count(a => a.Status == "completed") * 100) / campaign.Adverts.Count
                : 0;

            JsonElement jsonResponse;
            try
            {
                jsonResponse = JsonSerializer.Deserialize<JsonElement>(aiResponseJson);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse AI JSON response. Response: {Response}", aiResponseJson);
                throw new InvalidOperationException($"AI returned invalid JSON. Response: {aiResponseJson.Substring(0, Math.Min(200, aiResponseJson.Length))}", ex);
            }
            
            var response = new CampaignSuggestionResponseDto
            {
                CampaignId = request.CampaignId,
                AnalysisType = request.AnalysisType ?? "performance",
                GeneratedAt = DateTime.UtcNow
            };

            // Parse performance analysis from JSON
            if (jsonResponse.TryGetProperty("summary", out var summary))
            {
                response.PerformanceAnalysis = new CampaignPerformanceAnalysis
                {
                    Summary = summary.GetString() ?? "",
                    BudgetUtilization = (decimal)budgetUtilization,
                    AdvertCompletionRate = completionRate,
                    Strengths = jsonResponse.TryGetProperty("strengths", out var strengths) 
                        ? strengths.EnumerateArray().Select(s => s.GetString() ?? "").Where(s => !string.IsNullOrEmpty(s)).ToList()
                        : new List<string>(),
                    Weaknesses = jsonResponse.TryGetProperty("weaknesses", out var weaknesses)
                        ? weaknesses.EnumerateArray().Select(w => w.GetString() ?? "").Where(w => !string.IsNullOrEmpty(w)).ToList()
                        : new List<string>(),
                    Recommendations = jsonResponse.TryGetProperty("recommendations", out var recommendations)
                        ? recommendations.EnumerateArray().Select(r => r.GetString() ?? "").Where(r => !string.IsNullOrEmpty(r)).ToList()
                        : new List<string>()
                };
                response.Content = summary.GetString() ?? "";
            }

            // Parse ideas from JSON
            if (jsonResponse.TryGetProperty("ideas", out var ideas))
            {
                response.Ideas = ideas.EnumerateArray().Select(idea => new CampaignIdea
                {
                    Title = idea.TryGetProperty("title", out var title) ? title.GetString() ?? "" : "",
                    Description = idea.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : "",
                    Category = idea.TryGetProperty("category", out var cat) ? cat.GetString() ?? "" : "",
                    Priority = idea.TryGetProperty("priority", out var prio) ? prio.GetInt32() : 2
                }).Where(i => !string.IsNullOrEmpty(i.Title)).ToList();
            }

            // Parse suggestions from JSON
            if (jsonResponse.TryGetProperty("suggestions", out var suggestions))
            {
                response.Suggestions = suggestions.EnumerateArray().Select(s => s.GetString() ?? "").Where(s => !string.IsNullOrEmpty(s)).ToList();
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating campaign suggestion for campaign {CampaignId}", request.CampaignId);
            throw;
        }
    }

    public async Task SaveAiSuggestionAsync(
        Guid campaignId,
        Guid? authorUserId,
        string kind,
        object promptSnapshot,
        object result)
    {
        try
        {
            var promptJson = JsonSerializer.Serialize(promptSnapshot);
            var resultJson = JsonSerializer.Serialize(result);

            var aiSuggestion = new AiSuggestion
            {
                Id = Guid.NewGuid(),
                CampaignId = campaignId,
                AuthorUserId = authorUserId,
                Kind = kind,
                PromptSnapshot = JsonDocument.Parse(promptJson),
                Result = JsonDocument.Parse(resultJson),
                CreatedAt = DateTime.UtcNow
            };

            _context.AiSuggestions.Add(aiSuggestion);
            await _context.SaveChangesAsync();

            _logger.LogInformation("AI suggestion saved: {Id}, Kind: {Kind}, Campaign: {CampaignId}", 
                aiSuggestion.Id, kind, campaignId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving AI suggestion to database: {Error}. StackTrace: {StackTrace}", 
                ex.Message, ex.StackTrace);
            // Don't throw - we don't want to fail the request if saving fails
        }
    }

    public async Task<CreativeIdeaResponseDto> GetCreativeIdeaAsync(CreativeIdeaRequestDto request)
    {
        try
        {
            // Get campaign and concept note data for context
            var campaign = await _context.Campaigns
                .Include(c => c.Client)
                .Include(c => c.ConceptNotes)
                .FirstOrDefaultAsync(c => c.Id == request.CampaignId);

            if (campaign == null)
            {
                throw new ArgumentException("Campaign not found");
            }

            ConceptNote? conceptNote = null;
            if (request.ConceptNoteId.HasValue)
            {
                conceptNote = await _context.ConceptNotes
                    .FirstOrDefaultAsync(cn => cn.Id == request.ConceptNoteId.Value);
            }

            // Build prompt for creative ideas
            var prompt = BuildCreativeIdeaPrompt(campaign, conceptNote, request);

            // Call AI API
            var aiResponseJson = await GenerateTextAsync(prompt, new Dictionary<string, object>
            {
                ["campaignId"] = campaign.Id,
                ["campaignTitle"] = campaign.Title,
                ["clientName"] = campaign.Client.Name,
                ["requestType"] = request.RequestType
            });

            // Clean and validate JSON before parsing
            var cleanedJson = aiResponseJson.Trim();
            
            // Try to fix incomplete JSON (add closing braces if missing)
            if (!cleanedJson.EndsWith("}") && !cleanedJson.EndsWith("]"))
            {
                var openBraces = cleanedJson.Count(c => c == '{');
                var closeBraces = cleanedJson.Count(c => c == '}');
                var openBrackets = cleanedJson.Count(c => c == '[');
                var closeBrackets = cleanedJson.Count(c => c == ']');
                
                // Try to complete the JSON
                while (openBraces > closeBraces)
                {
                    cleanedJson += "}";
                    closeBraces++;
                }
                while (openBrackets > closeBrackets)
                {
                    cleanedJson += "]";
                    closeBrackets++;
                }
                
                _logger.LogWarning("Attempted to fix incomplete JSON response");
            }
            
            JsonElement jsonResponse;
            try
            {
                jsonResponse = JsonSerializer.Deserialize<JsonElement>(cleanedJson);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse AI JSON response. Original length: {Length}, Response: {Response}", 
                    aiResponseJson.Length, aiResponseJson.Substring(0, Math.Min(500, aiResponseJson.Length)));
                
                // Try to extract partial data if possible
                var errorMsg = $"AI returned invalid or incomplete JSON. ";
                if (aiResponseJson.Length < 100)
                {
                    errorMsg += $"Response too short: {aiResponseJson}";
                }
                else
                {
                    errorMsg += $"First 500 chars: {aiResponseJson.Substring(0, Math.Min(500, aiResponseJson.Length))}...";
                }
                
                throw new InvalidOperationException(errorMsg, ex);
            }
            
            var response = new CreativeIdeaResponseDto
            {
                CampaignId = request.CampaignId,
                ConceptNoteId = request.ConceptNoteId,
                RequestType = request.RequestType,
                GeneratedAt = DateTime.UtcNow
            };

            // Parse content from JSON
            if (jsonResponse.TryGetProperty("content", out var content))
            {
                response.Content = content.GetString() ?? "";
            }

            // Parse ideas from JSON
            if (jsonResponse.TryGetProperty("ideas", out var ideas))
            {
                response.Ideas = ideas.EnumerateArray().Select(idea => new CreativeIdea
                {
                    Title = idea.TryGetProperty("title", out var title) ? title.GetString() ?? "" : "",
                    Description = idea.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : "",
                    Type = idea.TryGetProperty("type", out var type) ? type.GetString() ?? request.RequestType : request.RequestType,
                    Tags = idea.TryGetProperty("tags", out var tags) 
                        ? tags.EnumerateArray().Select(t => t.GetString() ?? "").Where(t => !string.IsNullOrEmpty(t)).ToList()
                        : new List<string>(),
                    Rationale = idea.TryGetProperty("rationale", out var rationale) ? rationale.GetString() : null
                }).Where(i => !string.IsNullOrEmpty(i.Title)).ToList();
            }

            // Parse suggestions from JSON
            if (jsonResponse.TryGetProperty("suggestions", out var suggestions))
            {
                response.Suggestions = suggestions.EnumerateArray().Select(s => s.GetString() ?? "").Where(s => !string.IsNullOrEmpty(s)).ToList();
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating creative idea for campaign {CampaignId}", request.CampaignId);
            throw;
        }
    }

    public async Task<string> GenerateTextAsync(string prompt, Dictionary<string, object>? context = null)
    {
        var provider = _configuration["Ai:Provider"] ?? "gemini";
        var apiKey = _configuration["Ai:ApiKey"];
        var model = _configuration["Ai:Model"] ?? "gemini-2.5-flash";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("AI API key not configured. Returning mock response.");
            return GenerateMockResponse(prompt);
        }

        try
        {
            if (provider.ToLower() == "gemini")
            {
                return await CallGeminiApiAsync(prompt, apiKey, model);
            }
            else
            {
                return await CallOpenAiApiAsync(prompt, apiKey, model);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AI API. Provider: {Provider}", provider);
            // Fallback to mock response
            return GenerateMockResponse(prompt);
        }
    }

    private async Task<string> CallOpenAiApiAsync(string prompt, string apiKey, string model)
    {
        var httpClient = _httpClientFactory.CreateClient();
        var url = "https://api.openai.com/v1/chat/completions";
        
        var requestBody = new
        {
            model = model,
            messages = new[]
            {
                new { role = "system", content = "You are a helpful marketing and creative assistant for an advertising agency." },
                new { role = "user", content = prompt }
            },
            temperature = 0.7,
            max_tokens = 2000
        };

        httpClient.DefaultRequestHeaders.Clear();
        httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await httpClient.PostAsync(url, content);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);

        return responseObj.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
    }

    private async Task<string> CallGeminiApiAsync(string prompt, string apiKey, string model)
    {
        var httpClient = _httpClientFactory.CreateClient();
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
        
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.7,
                maxOutputTokens = 4096
            }
        };

        httpClient.DefaultRequestHeaders.Clear();

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await httpClient.PostAsync(url, content);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError("Gemini API error: {StatusCode} - {Error}", response.StatusCode, errorContent);
            throw new HttpRequestException($"Gemini API returned {response.StatusCode}: {errorContent}");
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        
        JsonElement responseObj;
        try
        {
            responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse Gemini API response JSON: {Response}", responseJson);
            throw new InvalidOperationException($"Gemini API returned invalid JSON: {responseJson.Substring(0, Math.Min(200, responseJson.Length))}", ex);
        }

        // Handle Gemini API response structure
        if (responseObj.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
        {
            var candidate = candidates[0];
            
            // Check for errors in candidate
            if (candidate.TryGetProperty("finishReason", out var finishReason))
            {
                var reason = finishReason.GetString();
                if (reason == "SAFETY" || reason == "RECITATION" || reason == "OTHER")
                {
                    var errorMsg = candidate.TryGetProperty("safetyRatings", out var safety) 
                        ? $"Gemini API blocked response due to: {reason}" 
                        : $"Gemini API returned finishReason: {reason}";
                    _logger.LogWarning("Gemini API blocked response: {Reason}", reason);
                    throw new InvalidOperationException(errorMsg);
                }
            }
            
            if (candidate.TryGetProperty("content", out var contentObj))
            {
                if (contentObj.TryGetProperty("parts", out var parts) && parts.GetArrayLength() > 0)
                {
                    var part = parts[0];
                    if (part.TryGetProperty("text", out var text))
                    {
                        var textContent = text.GetString() ?? "";
                        if (string.IsNullOrWhiteSpace(textContent))
                        {
                            throw new InvalidOperationException("Gemini API returned empty response");
                        }
                        
                        // Clean up JSON if it's wrapped in markdown code blocks
                        textContent = textContent.Trim();
                        if (textContent.StartsWith("```json"))
                        {
                            textContent = textContent.Substring(7);
                        }
                        if (textContent.StartsWith("```"))
                        {
                            textContent = textContent.Substring(3);
                        }
                        if (textContent.EndsWith("```"))
                        {
                            textContent = textContent.Substring(0, textContent.Length - 3);
                        }
                        return textContent.Trim();
                    }
                }
            }
        }

        // Check for error in response
        if (responseObj.TryGetProperty("error", out var error))
        {
            var errorMessage = error.TryGetProperty("message", out var msg) ? msg.GetString() : "Unknown error";
            _logger.LogError("Gemini API error: {Error}", errorMessage);
            throw new InvalidOperationException($"Gemini API error: {errorMessage}");
        }

        // Fallback if structure is different
        _logger.LogError("Unexpected Gemini API response structure: {Response}", responseJson);
        throw new InvalidOperationException($"Unexpected Gemini API response structure. Response: {responseJson.Substring(0, Math.Min(500, responseJson.Length))}");
    }

    private string GenerateMockResponse(string prompt)
    {
        // Mock JSON response for development/testing when API key is not configured
        return @"{
  ""summary"": ""This is a mock response. Please configure your AI API key in appsettings.json to get real AI responses."",
  ""strengths"": [""Mock strength 1"", ""Mock strength 2""],
  ""weaknesses"": [""Mock weakness 1""],
  ""recommendations"": [""Configure API key"", ""Test with real data""],
  ""ideas"": [
    {
      ""title"": ""Mock Campaign Idea"",
      ""description"": ""This is a placeholder idea. Configure your API key for real suggestions."",
      ""category"": ""strategy"",
      ""priority"": 2
    }
  ],
  ""suggestions"": [""Configure API key"", ""Test endpoint""]
}";
    }

    private string BuildCampaignAnalysisPrompt(Campaign campaign, string? analysisType, string? additionalContext)
    {
        var budgetUtilization = campaign.EstimatedBudget > 0 
            ? (campaign.ActualCost / campaign.EstimatedBudget) * 100 
            : 0;

        var completionRate = campaign.Adverts.Count > 0
            ? (campaign.Adverts.Count(a => a.Status == "completed") * 100) / campaign.Adverts.Count
            : 0;

        var prompt = $@"Analyze the following campaign and return ONLY valid JSON. Do not include any text before or after the JSON.

Campaign Data:
- Title: {campaign.Title}
- Client: {campaign.Client.Name}
- Status: {campaign.Status}
- Description: {campaign.Description ?? "N/A"}
- Budget: {campaign.EstimatedBudget:C}
- Actual Cost: {campaign.ActualCost:C}
- Budget Variance: {campaign.ActualCost - campaign.EstimatedBudget:C}
- Start Date: {campaign.StartDate?.ToString() ?? "N/A"}
- End Date: {campaign.EndDate?.ToString() ?? "N/A"}
- Total Adverts: {campaign.Adverts.Count}
- Completed Adverts: {campaign.Adverts.Count(a => a.Status == "completed")}
- Budget Lines: {campaign.BudgetLines.Count}
- Budget Utilization: {budgetUtilization:F1}%
- Advert Completion Rate: {completionRate}%

";

        if (analysisType == "performance")
        {
            prompt += @"Return JSON in this exact format:
{
  ""summary"": ""Detailed performance summary text"",
  ""strengths"": [""strength1"", ""strength2"", ""strength3""],
  ""weaknesses"": [""weakness1"", ""weakness2"", ""weakness3""],
  ""recommendations"": [""recommendation1"", ""recommendation2"", ""recommendation3""],
  ""ideas"": [
    {
      ""title"": ""Idea title"",
      ""description"": ""Idea description"",
      ""category"": ""strategy|content|channel|timing"",
      ""priority"": 1
    }
  ],
  ""suggestions"": [""suggestion1"", ""suggestion2""]
}";
        }
        else if (analysisType == "ideas")
        {
            prompt += @"Return JSON in this exact format:
{
  ""summary"": ""Brief summary of ideas"",
  ""strengths"": [],
  ""weaknesses"": [],
  ""recommendations"": [],
  ""ideas"": [
    {
      ""title"": ""Campaign idea title"",
      ""description"": ""Detailed description of the idea"",
      ""category"": ""strategy|content|channel|timing"",
      ""priority"": 2
    }
  ],
  ""suggestions"": [""suggestion1"", ""suggestion2"", ""suggestion3""]
}";
        }
        else
        {
            prompt += @"Return JSON in this exact format:
{
  ""summary"": ""Comprehensive analysis summary"",
  ""strengths"": [""strength1"", ""strength2""],
  ""weaknesses"": [""weakness1"", ""weakness2""],
  ""recommendations"": [""recommendation1"", ""recommendation2"", ""recommendation3""],
  ""ideas"": [
    {
      ""title"": ""Idea title"",
      ""description"": ""Idea description"",
      ""category"": ""strategy|content|channel|timing"",
      ""priority"": 2
    }
  ],
  ""suggestions"": [""suggestion1"", ""suggestion2""]
}";
        }

        if (!string.IsNullOrEmpty(additionalContext))
        {
            prompt += $"\n\nAdditional Context: {additionalContext}\n";
        }

        prompt += "\n\nIMPORTANT: Return ONLY the JSON object. No markdown, no code blocks, no explanations. Just the raw JSON.";

        return prompt;
    }

    private string BuildCreativeIdeaPrompt(Campaign campaign, ConceptNote? conceptNote, CreativeIdeaRequestDto request)
    {
        var prompt = $@"Generate creative ideas for the following campaign and return ONLY valid JSON. Do not include any text before or after the JSON.

Campaign Data:
- Title: {campaign.Title}
- Client: {campaign.Client.Name}
- Description: {campaign.Description ?? "N/A"}
- Request Type: {request.RequestType}
";

        if (conceptNote != null)
        {
            prompt += $@"- Existing Concept Note:
  Title: {conceptNote.Title}
  Content: {conceptNote.Content}
  Tags: {string.Join(", ", conceptNote.Tags ?? Array.Empty<string>())}
";
        }

        if (!string.IsNullOrEmpty(request.Brief))
        {
            prompt += $"- Brief: {request.Brief}\n";
        }

        if (!string.IsNullOrEmpty(request.TargetAudience))
        {
            prompt += $"- Target Audience: {request.TargetAudience}\n";
        }

        if (!string.IsNullOrEmpty(request.Tone))
        {
            prompt += $"- Tone: {request.Tone}\n";
        }

        prompt += @"

Return JSON in this exact format:
{
  ""content"": ""Overall creative concept summary"",
  ""ideas"": [
    {
      ""title"": ""Creative idea title"",
      ""description"": ""Detailed description of the creative idea"",
      ""type"": """ + request.RequestType + @""",
      ""tags"": [""tag1"", ""tag2"", ""tag3""],
      ""rationale"": ""Why this idea works""
    }
  ],
  ""suggestions"": [""suggestion1"", ""suggestion2"", ""suggestion3""]
}

IMPORTANT: Return ONLY the JSON object. No markdown, no code blocks, no explanations. Just the raw JSON.";

        return prompt;
    }
}

