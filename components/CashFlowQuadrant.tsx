import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme, IconButton, Dialog, Portal } from 'react-native-paper';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import type { Property } from '@/types/property';
import { useFinancials } from '@/context/FinancialsContext';

interface Props {
  property: Property;
}

export default function CashFlowQuadrant({ property }: Props) {
  const theme = useTheme();
  const [showRoiHelp, setShowRoiHelp] = useState<boolean>(false);
  const [expandExpenses, setExpandExpenses] = useState<boolean>(false);
  const [expandCashFlow, setExpandCashFlow] = useState<boolean>(false);
  const { transactions } = useFinancials();

  const calculations = useMemo(() => {
    const income = property.monthlyRent ?? 0;
    const loanPayments = (property.loans ?? []).reduce((sum, l) => sum + (l.monthlyPayment ?? 0), 0);
    const insuranceMonthly = (property.insurances ?? []).reduce((sum, i) => sum + ((i.annualCost ?? 0) / 12), 0);
    const taxesMonthly = (property.taxes ?? []).reduce((sum, t) => sum + ((t.amount ?? 0) / 12), 0);
    const fixedMonthlyExpenses = loanPayments + insuranceMonthly + taxesMonthly;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const variableMonthlyExpenses = transactions
      .filter(t => t.type === 'expense' && t.propertyId === property.id)
      .filter(t => {
        const d = new Date(t.date);
        return d >= startOfMonth && d <= endOfMonth;
      })
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);

    const totalExpenses = fixedMonthlyExpenses + variableMonthlyExpenses;
    const expectedCashFlow = income - fixedMonthlyExpenses;
    const actualCashFlow = income - totalExpenses;
    const hasCashInvested = (property.cashInvested ?? 0) > 0;
    const cashOnCashRoi = hasCashInvested ? (actualCashFlow * 12) / (property.cashInvested as number) : 0;

    console.log('[CashFlowQuadrant] calculations', { income, fixedMonthlyExpenses, variableMonthlyExpenses, totalExpenses, expectedCashFlow, actualCashFlow, cashOnCashRoi });

    return { income, fixedMonthlyExpenses, variableMonthlyExpenses, totalExpenses, expectedCashFlow, actualCashFlow, cashOnCashRoi, hasCashInvested };
  }, [property, transactions]);

  const formatCurrency = (n: number) => `$${n.toFixed(0)}`;
  const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <View style={styles.grid} testID="cashFlowQuadrant">
      <Card style={styles.card} elevation={1}>
        <Card.Content>
          <Text style={styles.label}>Total Monthly Income</Text>
          <Text style={[styles.value, { color: theme.colors.primary }]}>{formatCurrency(calculations.income)}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card} elevation={1} onPress={() => setExpandExpenses(v => !v)} testID="expensesCard">
        <Card.Content>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Total Monthly Expenses</Text>
            <View>
              {expandExpenses ? <ChevronUp size={16} color={theme.colors.onSurfaceVariant} /> : <ChevronDown size={16} color={theme.colors.onSurfaceVariant} />}
            </View>
          </View>
          <Text style={[styles.value, { color: theme.colors.error }]}>{formatCurrency(calculations.totalExpenses)}</Text>
          {expandExpenses && (
            <View style={styles.breakdown} testID="expensesBreakdown">
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Fixed</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(calculations.fixedMonthlyExpenses)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Variable</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(calculations.variableMonthlyExpenses)}</Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card} elevation={1} onPress={() => setExpandCashFlow(v => !v)} testID="cashFlowCard">
        <Card.Content>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Monthly Cash Flow</Text>
            <View>
              {expandCashFlow ? <ChevronUp size={16} color={theme.colors.onSurfaceVariant} /> : <ChevronDown size={16} color={theme.colors.onSurfaceVariant} />}
            </View>
          </View>
          <Text style={[styles.value, { color: calculations.actualCashFlow >= 0 ? '#16a34a' : '#ef4444' }]}>{formatCurrency(calculations.actualCashFlow)}</Text>
          {expandCashFlow && (
            <View style={styles.breakdown} testID="cashFlowBreakdown">
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Expected</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(calculations.expectedCashFlow)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Actual</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(calculations.actualCashFlow)}</Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card} elevation={1}>
        <Card.Content>
          <Text style={styles.label}>Cash-on-Cash ROI</Text>
          {calculations.hasCashInvested ? (
            <Text style={[styles.value, { color: theme.colors.tertiary }]} testID="roiValue">{formatPercent(calculations.cashOnCashRoi)}</Text>
          ) : (
            <View style={styles.roiRow}>
              <Text style={[styles.value, { color: theme.colors.tertiary }]} testID="roiNA">N/A</Text>
              <IconButton
                testID="roiHelpButton"
                icon={() => <HelpCircle size={20} color={theme.colors.tertiary} />}
                onPress={() => setShowRoiHelp(true)}
                accessibilityLabel="How to calculate ROI"
                style={styles.roiHelpIcon}
              />
            </View>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={showRoiHelp} onDismiss={() => setShowRoiHelp(false)}>
          <Dialog.Title><Text>Cash-on-Cash ROI</Text></Dialog.Title>
          <Dialog.Content>
            <Text>
              To calculate Cash-on-Cash ROI, please edit this property and enter your "Total Cash Invested" (your down payment plus any closing costs).
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <IconButton testID="roiHelpClose" icon="check" onPress={() => setShowRoiHelp(false)} />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: 20,
    marginTop: -60,
    marginBottom: 12,
  },
  card: {
    flexBasis: '48%',
    borderRadius: 12,
  },
  label: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  roiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roiHelpIcon: {
    margin: 0,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdown: {
    marginTop: 8,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  breakdownValue: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
