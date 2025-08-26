import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Text, Surface, Card, useTheme, Divider, FAB, Portal, Modal, TextInput, Button, SegmentedButtons, IconButton, Dialog } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, DollarSign, Plus, Pencil, Trash2, Wallet } from 'lucide-react-native';
import { useFinancials } from '@/context/FinancialsContext';
import { useProperties } from '@/context/PropertiesContext';
import EmptyState from '@/components/EmptyState';

export default function FinancialsScreen() {
  const theme = useTheme();
  const { transactions, totals, addTransaction, updateTransaction, deleteTransaction } = useFinancials();
  const { properties } = useProperties();

  const totalIncome = totals.income;
  const totalExpenses = totals.expenses;
  const netIncome = totals.net;

  const [visible, setVisible] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [propertyId, setPropertyId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState<string>('');
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);

  const openModal = useCallback(() => setVisible(true), []);
  const closeModal = useCallback(() => setVisible(false), []);

  const resetForm = useCallback(() => {
    setDescription('');
    setAmount('');
    setType('income');
    setPropertyId('');
    setEditingId(null);
    const today = new Date();
    const iso = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().slice(0,10);
    setDateStr(iso);
  }, []);

  const onSave = useCallback(() => {
    const parsed = parseFloat(amount);
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr).getTime());
    if (!description.trim() || isNaN(parsed) || !propertyId || !isValidDate) return;
    const payload = { description: description.trim(), amount: Math.abs(parsed), date: dateStr, propertyId, type };
    if (editingId) {
      updateTransaction(editingId, payload);
    } else {
      addTransaction(payload);
    }
    resetForm();
    closeModal();
  }, [description, amount, propertyId, type, editingId, addTransaction, updateTransaction, resetForm, closeModal, dateStr]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Surface style={styles.headerSurface} elevation={0}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Financials
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Overview
          </Text>
        </Surface>

        <View style={styles.summaryCards}>
          <Card style={[styles.summaryCard, styles.incomeCard]} mode="elevated" elevation={1}>
            <Card.Content style={styles.summaryContent}>
              <View style={styles.iconContainer}>
                <TrendingUp size={20} color={theme.colors.primary} />
              </View>
              <Text variant="labelMedium" style={styles.summaryLabel}>Total Income</Text>
              <Text variant="headlineSmall" style={styles.summaryAmount}>
                ${totalIncome.toLocaleString()}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.summaryCard, styles.expenseCard]} mode="elevated" elevation={1}>
            <Card.Content style={styles.summaryContent}>
              <View style={styles.iconContainer}>
                <TrendingDown size={20} color={theme.colors.error} />
              </View>
              <Text variant="labelMedium" style={styles.summaryLabel}>Total Expenses</Text>
              <Text variant="headlineSmall" style={styles.summaryAmount}>
                ${totalExpenses.toLocaleString()}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.netIncomeCard} mode="elevated" elevation={2}>
          <Card.Content style={styles.netIncomeContent}>
            <View style={styles.netIncomeHeader}>
              <DollarSign size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.netIncomeLabel}>Net Income</Text>
            </View>
            <Text variant="headlineMedium" style={styles.netIncomeAmount}>
              ${netIncome.toLocaleString()}
            </Text>
          </Card.Content>
        </Card>

        <Surface style={styles.transactionsSurface} elevation={1}>
          <Text variant="titleMedium" style={styles.transactionsTitle}>
            Recent Transactions
          </Text>
          <Divider style={styles.divider} />
          
          {transactions.length === 0 ? (
            <EmptyState
              testID="financialsEmpty"
              icon={<Wallet size={28} color={theme.colors.primary} />}
              title="No Transactions"
              message="Add income or expenses to see your financial summary."
            />
          ) : (
            transactions.map((transaction, index) => (
              <React.Fragment key={transaction.id}>
                <View style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <Text variant="bodyMedium" style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    <Text variant="bodySmall" style={styles.transactionDate}>
                      {transaction.date}
                    </Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text 
                      variant="titleMedium" 
                      style={[
                        styles.transactionAmount,
                        { color: transaction.type === 'income' ? theme.colors.primary : theme.colors.error }
                      ]}
                    >
                      {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
                    </Text>
                    <View style={styles.rowActions}>
                      <IconButton
                        testID={`tx-edit-${transaction.id}`}
                        icon={() => <Pencil size={18} color="#2c3e50" />}
                        onPress={() => {
                          setEditingId(transaction.id);
                          setDescription(transaction.description);
                          setAmount(String(transaction.amount));
                          setType(transaction.type);
                          setPropertyId(transaction.propertyId);
                          setDateStr(transaction.date);
                          openModal();
                        }}
                        accessibilityLabel="Edit transaction"
                      />
                      <IconButton
                        testID={`tx-delete-${transaction.id}`}
                        icon={() => <Trash2 size={18} color="#e74c3c" />}
                        onPress={() => {
                          Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(transaction.id) },
                          ]);
                        }}
                        accessibilityLabel="Delete transaction"
                      />
                    </View>
                  </View>
                </View>
                {index < transactions.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </Surface>
      </ScrollView>

      <FAB
        testID="addTransactionFab"
        icon={() => <Plus size={20} color={theme.colors.onPrimary} />}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => { resetForm(); openModal(); }}
      />

      <Portal>
        <Modal visible={visible} onDismiss={closeModal} contentContainerStyle={styles.modalContainer}>
          <Surface style={styles.modalCard} elevation={2}>
            <Text variant="headlineSmall" style={styles.modalTitle}>{editingId ? 'Edit Transaction' : 'Add Transaction'}</Text>
            <KeyboardAwareScrollView enableOnAndroid={true} extraScrollHeight={12} keyboardOpeningTime={0}>
              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                testID="txDescription"
              />

              <TextInput
                label="Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={styles.input}
                testID="txAmount"
              />

              <TextInput
                label="Date (YYYY-MM-DD)"
                value={dateStr}
                onChangeText={setDateStr}
                right={<TextInput.Icon icon="calendar" onPress={() => setDatePickerOpen(true)} />}
                style={styles.input}
                testID="txDate"
              />

              <Text style={styles.selectorLabel}>Type</Text>
              <SegmentedButtons
                value={type}
                onValueChange={(v) => setType(v as 'income' | 'expense')}
                buttons={[
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                ]}
              />

              <Text style={styles.selectorLabel}>Select Property</Text>
              <Surface style={styles.dropdown} elevation={0}>
                {properties.length === 0 ? (
                  <Text variant="bodySmall" style={styles.emptyText}>No properties available</Text>
                ) : (
                  properties.map(p => (
                    <View key={p.id} style={styles.dropdownItem}>
                      <Button
                        mode={propertyId === p.id ? 'contained' : 'text'}
                        onPress={() => setPropertyId(p.id)}
                        testID={`tx-prop-${p.id}`}
                      >
                        <Text>{p.address}, {p.city}</Text>
                      </Button>
                    </View>
                  ))
                )}
              </Surface>
            </KeyboardAwareScrollView>

            <Button mode="contained" onPress={onSave} disabled={!description.trim() || !amount || !propertyId || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)} testID="saveTxBtn">
              <Text>Save</Text>
            </Button>
            <Button onPress={() => { resetForm(); closeModal(); }} style={styles.cancelBtn}><Text>Cancel</Text></Button>
          </Surface>
        </Modal>
      </Portal>
      <Portal>
        <Dialog visible={datePickerOpen} onDismiss={() => setDatePickerOpen(false)}>
          <Dialog.Title><Text>Select Date</Text></Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="YYYY-MM-DD"
              value={dateStr}
              onChangeText={setDateStr}
              keyboardType="numbers-and-punctuation"
              testID="txDateInput"
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button onPress={() => {
                const today = new Date();
                const iso = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().slice(0,10);
                setDateStr(iso);
              }} testID="txDateToday"><Text>Today</Text></Button>
              <Button onPress={() => setDateStr('')} testID="txDateClear"><Text>Clear</Text></Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDatePickerOpen(false)} testID="txDateDone"><Text>Done</Text></Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  headerSurface: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#f4f6f8',
  },
  headerTitle: {
    fontWeight: '600' as const,
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#7f8c8d',
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  incomeCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#34495e',
  },
  expenseCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
  },
  summaryContent: {
    paddingVertical: 16,
  },
  iconContainer: {
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#7f8c8d',
    marginBottom: 4,
  },
  summaryAmount: {
    fontWeight: '600' as const,
    color: '#2c3e50',
  },
  netIncomeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#34495e',
  },
  netIncomeContent: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  netIncomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  netIncomeLabel: {
    color: '#ffffff',
    opacity: 0.9,
  },
  netIncomeAmount: {
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 12,
  },
  transactionsSurface: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  transactionsTitle: {
    fontWeight: '600' as const,
    color: '#2c3e50',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDescription: {
    color: '#2c3e50',
    marginBottom: 2,
  },
  transactionDate: {
    color: '#95a5a6',
  },
  transactionAmount: {
    fontWeight: '600' as const,
    marginRight: 8,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
  },
  modalContainer: {
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontWeight: '600' as const,
    color: '#2c3e50',
  },
  input: {
    backgroundColor: '#ffffff',
  },
  selectorLabel: {
    color: '#2c3e50',
    fontWeight: '500' as const,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 10,
    paddingVertical: 6,
  },
  dropdownItem: {
    paddingHorizontal: 4,
  },
  emptyText: {
    color: '#7f8c8d',
    padding: 12,
  },
  cancelBtn: {
    marginTop: 4,
  },
});