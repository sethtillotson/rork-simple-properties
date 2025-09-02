import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Card, Text, Surface, useTheme, FAB, Portal, Modal, Button, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { TrendingUp, Brain, Target, AlertTriangle, DollarSign, Calendar, Zap } from 'lucide-react-native';
import { useProperties } from '@/context/PropertiesContext';
import { useFinancials } from '@/context/FinancialsContext';
import { useMaintenance } from '@/context/MaintenanceContext';
import { investmentAdvisor, InvestmentInsight, PortfolioAnalysis } from '@/services/investmentAdvisorService';
import EmptyState from '@/components/EmptyState';

export default function InvestmentAdvisorScreen() {
  const theme = useTheme();
  const { properties } = useProperties();
  const { transactions } = useFinancials();
  const { requests: maintenanceRequests } = useMaintenance();
  
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<InvestmentInsight | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const analyzePortfolio = useCallback(async () => {
    if (properties.length === 0) {
      Alert.alert('No Properties', 'Add some properties to your portfolio first to get AI insights.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await investmentAdvisor.analyzePortfolio(
        properties,
        transactions,
        maintenanceRequests
      );
      setAnalysis(result);
    } catch (err) {
      console.error('[InvestmentAdvisor] Analysis failed:', err);
      setError('Failed to analyze portfolio. Please check your gateway connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [properties, transactions, maintenanceRequests]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.error;
      case 'medium': return '#f59e0b';
      case 'low': return theme.colors.primary;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'cash_flow': return DollarSign;
      case 'maintenance': return Calendar;
      case 'tenant': return Target;
      case 'market': return TrendingUp;
      case 'risk': return AlertTriangle;
      default: return Brain;
    }
  };

  const openInsightDetails = (insight: InvestmentInsight) => {
    setSelectedInsight(insight);
    setModalVisible(true);
  };

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={null}
        title="No Properties Yet"
        message="Add properties to your portfolio to get AI-powered investment insights"
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Surface style={styles.headerSurface} elevation={0}>
          <View style={styles.headerContent}>
            <Brain size={24} color={theme.colors.primary} />
            <View style={styles.headerText}>
              <Text variant="headlineMedium" style={styles.headerTitle}>
                Investment Advisor
              </Text>
              <Text variant="bodyMedium" style={styles.headerSubtitle}>
                AI-powered portfolio insights
              </Text>
            </View>
          </View>
        </Surface>

        {loading && (
          <Card style={styles.loadingCard} elevation={1}>
            <Card.Content style={styles.loadingContent}>
              <ActivityIndicator size="small" />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Analyzing your portfolio...
              </Text>
            </Card.Content>
          </Card>
        )}

        {error && (
          <Card style={[styles.card, styles.errorCard]} elevation={1}>
            <Card.Content>
              <View style={styles.errorContent}>
                <AlertTriangle size={20} color={theme.colors.error} />
                <Text variant="bodyMedium" style={styles.errorText}>{error}</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {analysis && (
          <>
            {/* Portfolio Overview */}
            <Card style={styles.card} elevation={1}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>Portfolio Overview</Text>
                <View style={styles.overviewGrid}>
                  <View style={styles.overviewItem}>
                    <Text variant="labelSmall" style={styles.overviewLabel}>Total Value</Text>
                    <Text variant="titleLarge" style={[styles.overviewValue, { color: theme.colors.primary }]}>
                      ${analysis.totalValue.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <Text variant="labelSmall" style={styles.overviewLabel}>Monthly Cash Flow</Text>
                    <Text variant="titleLarge" style={[styles.overviewValue, { color: analysis.totalCashFlow >= 0 ? '#16a34a' : theme.colors.error }]}>
                      ${analysis.totalCashFlow.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <Text variant="labelSmall" style={styles.overviewLabel}>Average ROI</Text>
                    <Text variant="titleLarge" style={[styles.overviewValue, { color: theme.colors.primary }]}>
                      {(analysis.averageROI * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <Text variant="labelSmall" style={styles.overviewLabel}>Risk Score</Text>
                    <Text variant="titleLarge" style={[styles.overviewValue, { color: analysis.riskScore > 0.7 ? theme.colors.error : analysis.riskScore > 0.4 ? '#f59e0b' : '#16a34a' }]}>
                      {(analysis.riskScore * 100).toFixed(0)}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* AI Insights */}
            {analysis.insights && analysis.insights.length > 0 && (
              <Card style={styles.card} elevation={1}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>AI Insights</Text>
                  <View style={styles.insightsContainer}>
                    {analysis.insights.map((insight) => {
                      const IconComponent = getInsightIcon(insight.type);
                      return (
                        <Card 
                          key={insight.id} 
                          style={styles.insightCard} 
                          elevation={0}
                          onPress={() => openInsightDetails(insight)}
                        >
                          <Card.Content style={styles.insightContent}>
                            <View style={styles.insightHeader}>
                              <View style={styles.insightIconContainer}>
                                <IconComponent size={16} color={theme.colors.primary} />
                              </View>
                              <Chip 
                                mode="outlined" 
                                compact 
                                textStyle={[styles.priorityChip, { color: getPriorityColor(insight.priority) }]}
                                style={{ borderColor: getPriorityColor(insight.priority) }}
                              >
                                {insight.priority.toUpperCase()}
                              </Chip>
                            </View>
                            <Text variant="titleSmall" style={styles.insightTitle}>
                              {insight.title}
                            </Text>
                            <Text variant="bodySmall" style={styles.insightDescription} numberOfLines={2}>
                              {insight.description}
                            </Text>
                            {insight.estimatedImpact?.financial && (
                              <View style={styles.impactContainer}>
                                <DollarSign size={12} color={theme.colors.onSurfaceVariant} />
                                <Text variant="labelSmall" style={styles.impactText}>
                                  ${Math.abs(insight.estimatedImpact.financial).toLocaleString()} impact
                                </Text>
                              </View>
                            )}
                          </Card.Content>
                        </Card>
                      );
                    })}
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommendations && (
              <Card style={styles.card} elevation={1}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Recommendations</Text>
                  
                  {analysis.recommendations.buy && analysis.recommendations.buy.length > 0 && (
                    <View style={styles.recommendationSection}>
                      <Text variant="titleSmall" style={[styles.recommendationTitle, { color: '#16a34a' }]}>
                        Consider Buying
                      </Text>
                      {analysis.recommendations.buy.map((item, index) => (
                        <Text key={index} variant="bodySmall" style={styles.recommendationItem}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                  )}

                  {analysis.recommendations.improve && analysis.recommendations.improve.length > 0 && (
                    <View style={styles.recommendationSection}>
                      <Text variant="titleSmall" style={[styles.recommendationTitle, { color: '#f59e0b' }]}>
                        Improvements
                      </Text>
                      {analysis.recommendations.improve.map((item, index) => (
                        <Text key={index} variant="bodySmall" style={styles.recommendationItem}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                  )}

                  {analysis.recommendations.sell && analysis.recommendations.sell.length > 0 && (
                    <View style={styles.recommendationSection}>
                      <Text variant="titleSmall" style={[styles.recommendationTitle, { color: theme.colors.error }]}>
                        Consider Selling
                      </Text>
                      {analysis.recommendations.sell.map((item, index) => (
                        <Text key={index} variant="bodySmall" style={styles.recommendationItem}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                  )}
                </Card.Content>
              </Card>
            )}
          </>
        )}
      </ScrollView>

      {/* Analyze FAB */}
      <FAB
        icon="brain"
        label="Analyze Portfolio"
        style={styles.fab}
        onPress={analyzePortfolio}
        loading={loading}
        disabled={loading || properties.length === 0}
      />

      {/* Insight Details Modal */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContent}>
          {selectedInsight && (
            <View>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={styles.modalTitle}>
                  {selectedInsight.title}
                </Text>
                <Chip 
                  mode="outlined" 
                  compact 
                  textStyle={[styles.priorityChip, { color: getPriorityColor(selectedInsight.priority) }]}
                  style={{ borderColor: getPriorityColor(selectedInsight.priority) }}
                >
                  {selectedInsight.priority.toUpperCase()}
                </Chip>
              </View>
              
              <Text variant="bodyMedium" style={styles.modalDescription}>
                {selectedInsight.description}
              </Text>

              {selectedInsight.actionItems && selectedInsight.actionItems.length > 0 && (
                <>
                  <Divider style={styles.divider} />
                  <Text variant="titleSmall" style={styles.actionItemsTitle}>Action Items</Text>
                  {selectedInsight.actionItems.map((item, index) => (
                    <Text key={index} variant="bodySmall" style={styles.actionItem}>
                      {index + 1}. {item}
                    </Text>
                  ))}
                </>
              )}

              {selectedInsight.estimatedImpact && (
                <>
                  <Divider style={styles.divider} />
                  <Text variant="titleSmall" style={styles.impactTitle}>Estimated Impact</Text>
                  {selectedInsight.estimatedImpact.financial && (
                    <Text variant="bodySmall" style={styles.impactDetail}>
                      Financial: ${Math.abs(selectedInsight.estimatedImpact.financial).toLocaleString()}
                    </Text>
                  )}
                  {selectedInsight.estimatedImpact.timeframe && (
                    <Text variant="bodySmall" style={styles.impactDetail}>
                      Timeframe: {selectedInsight.estimatedImpact.timeframe}
                    </Text>
                  )}
                  <Text variant="bodySmall" style={styles.impactDetail}>
                    Confidence: {(selectedInsight.confidence * 100).toFixed(0)}%
                  </Text>
                </>
              )}

              <Button 
                mode="contained" 
                onPress={() => setModalVisible(false)} 
                style={styles.closeButton}
              >
                Close
              </Button>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  headerSurface: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerSubtitle: {
    opacity: 0.7,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  loadingCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    opacity: 0.7,
  },
  errorCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#ef4444',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  overviewItem: {
    flex: 1,
    minWidth: '45%',
  },
  overviewLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  overviewValue: {
    fontWeight: '700',
  },
  insightsContainer: {
    gap: 8,
  },
  insightCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  insightContent: {
    paddingVertical: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityChip: {
    fontSize: 10,
    fontWeight: '600',
  },
  insightTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  insightDescription: {
    opacity: 0.8,
    lineHeight: 18,
  },
  impactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  impactText: {
    opacity: 0.7,
  },
  recommendationSection: {
    marginBottom: 16,
  },
  recommendationTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationItem: {
    marginLeft: 8,
    marginBottom: 4,
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    flex: 1,
    fontWeight: '600',
    marginRight: 8,
  },
  modalDescription: {
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 12,
  },
  actionItemsTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  actionItem: {
    marginBottom: 6,
    lineHeight: 18,
  },
  impactTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  impactDetail: {
    marginBottom: 4,
    opacity: 0.8,
  },
  closeButton: {
    marginTop: 16,
  },
});
