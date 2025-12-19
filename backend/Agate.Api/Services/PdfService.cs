using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Agate.Api.DTOs;

namespace Agate.Api.Services;

public class PdfService : IPdfService
{
    public PdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public Task<byte[]> GenerateCampaignReportPdfAsync(CampaignSuggestionResponseDto report, string campaignTitle, string clientName)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header()
                    .Row(row =>
                    {
                        row.RelativeItem().Column(column =>
                        {
                            column.Item().Text("Campaign Analysis Report")
                                .FontSize(20)
                                .FontFamily(Fonts.Calibri)
                                .Bold()
                                .FontColor(Colors.Blue.Darken2);

                            column.Item().PaddingTop(5).Text($"{campaignTitle}")
                                .FontSize(14)
                                .FontFamily(Fonts.Calibri)
                                .Bold();

                            column.Item().PaddingTop(3).Text($"Client: {clientName}")
                                .FontSize(11)
                                .FontFamily(Fonts.Calibri)
                                .FontColor(Colors.Grey.Darken1);
                        });

                        row.ConstantItem(50).AlignRight().Text(DateTime.Now.ToString("dd MMM yyyy"))
                            .FontSize(9)
                            .FontFamily(Fonts.Calibri)
                            .FontColor(Colors.Grey.Medium);
                    });

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Spacing(15);

                        // Summary Section
                        if (report.PerformanceAnalysis != null)
                        {
                            column.Item().PaddingBottom(10).Column(summaryColumn =>
                            {
                                summaryColumn.Item().Text("Summary")
                                    .FontSize(16)
                                    .FontFamily(Fonts.Calibri)
                                    .Bold()
                                    .FontColor(Colors.Blue.Darken2);

                                summaryColumn.Item().PaddingTop(5).Text(report.PerformanceAnalysis.Summary)
                                    .FontSize(10)
                                    .FontFamily(Fonts.Calibri)
                                    .AlignLeft()
                                    .LineHeight(1.5f);
                            });

                            // Metrics
                            column.Item().PaddingVertical(10).Row(metricsRow =>
                            {
                                metricsRow.RelativeItem().PaddingRight(10).Background(Colors.Grey.Lighten3)
                                    .Padding(10)
                                    .Column(metricCol =>
                                    {
                                        metricCol.Item().Text("Budget Utilization")
                                            .FontSize(9)
                                            .FontFamily(Fonts.Calibri)
                                            .FontColor(Colors.Grey.Darken2);
                                        metricCol.Item().PaddingTop(3).Text($"{report.PerformanceAnalysis.BudgetUtilization:F1}%")
                                            .FontSize(14)
                                            .FontFamily(Fonts.Calibri)
                                            .Bold()
                                            .FontColor(Colors.Blue.Darken2);
                                    });

                                metricsRow.RelativeItem().Background(Colors.Grey.Lighten3)
                                    .Padding(10)
                                    .Column(metricCol =>
                                    {
                                        metricCol.Item().Text("Advert Completion Rate")
                                            .FontSize(9)
                                            .FontFamily(Fonts.Calibri)
                                            .FontColor(Colors.Grey.Darken2);
                                        metricCol.Item().PaddingTop(3).Text($"{report.PerformanceAnalysis.AdvertCompletionRate}%")
                                            .FontSize(14)
                                            .FontFamily(Fonts.Calibri)
                                            .Bold()
                                            .FontColor(Colors.Blue.Darken2);
                                    });
                            });

                            // Strengths
                            if (report.PerformanceAnalysis.Strengths.Any())
                            {
                                column.Item().PaddingTop(10).Column(strengthsColumn =>
                                {
                                    strengthsColumn.Item().Text("Strengths")
                                        .FontSize(14)
                                        .FontFamily(Fonts.Calibri)
                                        .Bold()
                                        .FontColor(Colors.Green.Darken2);

                                    foreach (var strength in report.PerformanceAnalysis.Strengths)
                                    {
                                        strengthsColumn.Item().PaddingTop(3).Row(row =>
                                        {
                                            row.ConstantItem(10).Text("•")
                                                .FontSize(12)
                                                .FontColor(Colors.Green.Darken1);
                                            row.RelativeItem().Text(strength)
                                                .FontSize(10)
                                                .FontFamily(Fonts.Calibri)
                                                .LineHeight(1.4f);
                                        });
                                    }
                                });
                            }

                            // Weaknesses
                            if (report.PerformanceAnalysis.Weaknesses.Any())
                            {
                                column.Item().PaddingTop(10).Column(weaknessesColumn =>
                                {
                                    weaknessesColumn.Item().Text("Weaknesses")
                                        .FontSize(14)
                                        .FontFamily(Fonts.Calibri)
                                        .Bold()
                                        .FontColor(Colors.Red.Darken2);

                                    foreach (var weakness in report.PerformanceAnalysis.Weaknesses)
                                    {
                                        weaknessesColumn.Item().PaddingTop(3).Row(row =>
                                        {
                                            row.ConstantItem(10).Text("•")
                                                .FontSize(12)
                                                .FontColor(Colors.Red.Darken1);
                                            row.RelativeItem().Text(weakness)
                                                .FontSize(10)
                                                .FontFamily(Fonts.Calibri)
                                                .LineHeight(1.4f);
                                        });
                                    }
                                });
                            }

                            // Recommendations
                            if (report.PerformanceAnalysis.Recommendations.Any())
                            {
                                column.Item().PaddingTop(10).Column(recommendationsColumn =>
                                {
                                    recommendationsColumn.Item().Text("Recommendations")
                                        .FontSize(14)
                                        .FontFamily(Fonts.Calibri)
                                        .Bold()
                                        .FontColor(Colors.Blue.Darken2);

                                    foreach (var recommendation in report.PerformanceAnalysis.Recommendations)
                                    {
                                        recommendationsColumn.Item().PaddingTop(3).Row(row =>
                                        {
                                            row.ConstantItem(10).Text("•")
                                                .FontSize(12)
                                                .FontColor(Colors.Blue.Darken1);
                                            row.RelativeItem().Text(recommendation)
                                                .FontSize(10)
                                                .FontFamily(Fonts.Calibri)
                                                .LineHeight(1.4f);
                                        });
                                    }
                                });
                            }
                        }

                        // Campaign Ideas
                        if (report.Ideas.Any())
                        {
                            column.Item().PageBreak();
                            column.Item().PaddingTop(10).Column(ideasColumn =>
                            {
                                ideasColumn.Item().Text("Campaign Ideas")
                                    .FontSize(16)
                                    .FontFamily(Fonts.Calibri)
                                    .Bold()
                                    .FontColor(Colors.Blue.Darken2);

                                foreach (var idea in report.Ideas)
                                {
                                    ideasColumn.Item().PaddingTop(10).Background(Colors.Grey.Lighten4)
                                        .Padding(12)
                                        .Column(ideaCol =>
                                        {
                                            ideaCol.Item().Row(ideaRow =>
                                            {
                                                ideaRow.RelativeItem().Text(idea.Title)
                                                    .FontSize(12)
                                                    .FontFamily(Fonts.Calibri)
                                                    .Bold()
                                                    .FontColor(Colors.Blue.Darken2);

                                                ideaRow.ConstantItem(80).AlignRight()
                                                    .Padding(5)
                                                    .Background(idea.Priority == 1 ? Colors.Green.Lighten3 : 
                                                               idea.Priority == 2 ? Colors.Yellow.Lighten3 : Colors.Orange.Lighten3)
                                                    .Text($"Priority {idea.Priority}")
                                                    .FontSize(8)
                                                    .FontFamily(Fonts.Calibri)
                                                    .Bold();
                                            });

                                            ideaCol.Item().PaddingTop(5).Text(idea.Description)
                                                .FontSize(10)
                                                .FontFamily(Fonts.Calibri)
                                                .LineHeight(1.4f);

                                            if (!string.IsNullOrEmpty(idea.Category))
                                            {
                                                ideaCol.Item().PaddingTop(5).Text($"Category: {idea.Category}")
                                                    .FontSize(9)
                                                    .FontFamily(Fonts.Calibri)
                                                    .FontColor(Colors.Grey.Darken1)
                                                    .Italic();
                                            }
                                        });
                                }
                            });
                        }

                        // Suggestions
                        if (report.Suggestions.Any())
                        {
                            column.Item().PaddingTop(15).Column(suggestionsColumn =>
                            {
                                suggestionsColumn.Item().Text("Additional Suggestions")
                                    .FontSize(14)
                                    .FontFamily(Fonts.Calibri)
                                    .Bold()
                                    .FontColor(Colors.Blue.Darken2);

                                foreach (var suggestion in report.Suggestions)
                                {
                                    suggestionsColumn.Item().PaddingTop(3).Row(row =>
                                    {
                                        row.ConstantItem(10).Text("•")
                                            .FontSize(12)
                                            .FontColor(Colors.Blue.Darken1);
                                        row.RelativeItem().Text(suggestion)
                                            .FontSize(10)
                                            .FontFamily(Fonts.Calibri)
                                            .LineHeight(1.4f);
                                    });
                                }
                            });
                        }
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.DefaultTextStyle(TextStyle.Default.FontSize(8).FontFamily(Fonts.Calibri).FontColor(Colors.Grey.Medium));
                        x.Span("Generated on ");
                        x.Span(DateTime.Now.ToString("dd MMM yyyy HH:mm")).Bold();
                        x.Span(" by Agate CMS");
                    });
            });
        });

        var pdfBytes = document.GeneratePdf();
        return Task.FromResult(pdfBytes);
    }

    public Task<byte[]> GenerateCreativeIdeaPdfAsync(CreativeIdeaResponseDto report, string campaignTitle, string clientName)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header()
                    .Row(row =>
                    {
                        row.RelativeItem().Column(column =>
                        {
                            column.Item().Text("Creative Ideas Report")
                                .FontSize(20)
                                .FontFamily(Fonts.Calibri)
                                .Bold()
                                .FontColor(Colors.Purple.Darken2);

                            column.Item().PaddingTop(5).Text($"{campaignTitle}")
                                .FontSize(14)
                                .FontFamily(Fonts.Calibri)
                                .Bold();

                            column.Item().PaddingTop(3).Text($"Client: {clientName} | Type: {report.RequestType}")
                                .FontSize(11)
                                .FontFamily(Fonts.Calibri)
                                .FontColor(Colors.Grey.Darken1);
                        });

                        row.ConstantItem(50).AlignRight().Text(DateTime.Now.ToString("dd MMM yyyy"))
                            .FontSize(9)
                            .FontFamily(Fonts.Calibri)
                            .FontColor(Colors.Grey.Medium);
                    });

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Spacing(15);

                        // Content Summary
                        if (!string.IsNullOrEmpty(report.Content))
                        {
                            column.Item().PaddingBottom(10).Column(contentColumn =>
                            {
                                contentColumn.Item().Text("Overview")
                                    .FontSize(16)
                                    .FontFamily(Fonts.Calibri)
                                    .Bold()
                                    .FontColor(Colors.Purple.Darken2);

                                contentColumn.Item().PaddingTop(5).Text(report.Content)
                                    .FontSize(10)
                                    .FontFamily(Fonts.Calibri)
                                    .AlignLeft()
                                    .LineHeight(1.5f);
                            });
                        }

                        // Creative Ideas
                        if (report.Ideas.Any())
                        {
                            column.Item().Column(ideasColumn =>
                            {
                                ideasColumn.Item().Text("Creative Ideas")
                                    .FontSize(16)
                                    .FontFamily(Fonts.Calibri)
                                    .Bold()
                                    .FontColor(Colors.Purple.Darken2);

                                foreach (var idea in report.Ideas)
                                {
                                    ideasColumn.Item().PaddingTop(10).Background(Colors.Purple.Lighten5)
                                        .Padding(12)
                                        .Column(ideaCol =>
                                        {
                                            ideaCol.Item().Text(idea.Title)
                                                .FontSize(12)
                                                .FontFamily(Fonts.Calibri)
                                                .Bold()
                                                .FontColor(Colors.Purple.Darken2);

                                            ideaCol.Item().PaddingTop(5).Text(idea.Description)
                                                .FontSize(10)
                                                .FontFamily(Fonts.Calibri)
                                                .LineHeight(1.4f);

                                            if (!string.IsNullOrEmpty(idea.Rationale))
                                            {
                                                ideaCol.Item().PaddingTop(5).PaddingLeft(10)
                                                    .BorderLeft(2)
                                                    .BorderColor(Colors.Purple.Lighten1)
                                                    .Text(idea.Rationale)
                                                    .FontSize(9)
                                                    .FontFamily(Fonts.Calibri)
                                                    .Italic()
                                                    .FontColor(Colors.Grey.Darken1)
                                                    .LineHeight(1.4f);
                                            }

                                            if (idea.Tags.Any())
                                            {
                                                ideaCol.Item().PaddingTop(5).Row(tagsRow =>
                                                {
                                                    foreach (var tag in idea.Tags)
                                                    {
                                                        tagsRow.RelativeItem().PaddingRight(5).PaddingTop(3)
                                                            .Background(Colors.Purple.Lighten3)
                                                            .Padding(5)
                                                            .Text(tag)
                                                            .FontSize(8)
                                                            .FontFamily(Fonts.Calibri)
                                                            .Bold()
                                                            .FontColor(Colors.Purple.Darken2);
                                                    }
                                                });
                                            }
                                        });
                                }
                            });
                        }

                        // Suggestions
                        if (report.Suggestions.Any())
                        {
                            column.Item().PaddingTop(15).Column(suggestionsColumn =>
                            {
                                suggestionsColumn.Item().Text("Additional Suggestions")
                                    .FontSize(14)
                                    .FontFamily(Fonts.Calibri)
                                    .Bold()
                                    .FontColor(Colors.Purple.Darken2);

                                foreach (var suggestion in report.Suggestions)
                                {
                                    suggestionsColumn.Item().PaddingTop(3).Row(row =>
                                    {
                                        row.ConstantItem(10).Text("•")
                                            .FontSize(12)
                                            .FontColor(Colors.Purple.Darken1);
                                        row.RelativeItem().Text(suggestion)
                                            .FontSize(10)
                                            .FontFamily(Fonts.Calibri)
                                            .LineHeight(1.4f);
                                    });
                                }
                            });
                        }
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.DefaultTextStyle(TextStyle.Default.FontSize(8).FontFamily(Fonts.Calibri).FontColor(Colors.Grey.Medium));
                        x.Span("Generated on ");
                        x.Span(DateTime.Now.ToString("dd MMM yyyy HH:mm")).Bold();
                        x.Span(" by Agate CMS");
                    });
            });
        });

        var pdfBytes = document.GeneratePdf();
        return Task.FromResult(pdfBytes);
    }
}
