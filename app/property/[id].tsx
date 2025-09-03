import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View, Image, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CashFlowQuadrant from '@/components/CashFlowQuadrant';
import { useChecklistTemplates } from '@/context/ChecklistTemplatesContext';
import type { AnyChecklistTemplate } from '@/context/ChecklistTemplatesContext';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Button, IconButton, Chip, Surface, Text, useTheme, List, Portal, Modal, TextInput, Checkbox } from 'react-native-paper';
import { useProperties } from '@/context/PropertiesContext';
import { useDataService } from '@/hooks/useDataService';
import type { Utility, Insurance, Tax, Loan, Property, Checklist } from '@/types/property';
import { documentTemplates, type DocumentTemplate } from '@/utils/documentTemplates';
import { generateDocumentPrompt } from '@/utils/promptTemplates';
import { investmentAdvisor, InvestmentInsight } from '@/services/investmentAdvisorService';
import { useFinancials } from '@/context/FinancialsContext';
import { useMaintenance } from '@/context/MaintenanceContext';

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    properties, 
    updateProperty, 
    deleteProperty,
    getPropertyById,
    addUtilityToProperty,
    updateUtilityOnProperty,
    deleteUtilityFromProperty,
    addInsuranceToProperty,
    updateInsuranceOnProperty,
    deleteInsuranceFromProperty,
    addTaxToProperty,
    updateTaxOnProperty,
    deleteTaxFromProperty,
    addLoanToProperty,
    updateLoanOnProperty,
    deleteLoanFromProperty,
    addChecklistToProperty,
    updateChecklistItemStatus,
    deleteChecklistFromProperty,
  } = useProperties();
  const { transactions } = useFinancials();
  const { requests: maintenanceRequests } = useMaintenance();
  const { allTemplates } = useChecklistTemplates();
  const { deletePropertyAndCascade } = useDataService();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [utilitiesExpanded, setUtilitiesExpanded] = useState<boolean>(true);
  const [utilityModalVisible, setUtilityModalVisible] = useState<boolean>(false);
  const [editingUtility, setEditingUtility] = useState<Utility | null>(null);
  const [formProvider, setFormProvider] = useState<string>('');
  const [formAccountNumber, setFormAccountNumber] = useState<string>('');
  const [formContactInfo, setFormContactInfo] = useState<string>('');
  const [utilityPaymentDay, setUtilityPaymentDay] = useState<string>('');

  const [insuranceExpanded, setInsuranceExpanded] = useState<boolean>(false);
  const [insuranceModalVisible, setInsuranceModalVisible] = useState<boolean>(false);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
  const [insProvider, setInsProvider] = useState<string>('');
  const [insPolicyNumber, setInsPolicyNumber] = useState<string>('');
  const [insRenewalDate, setInsRenewalDate] = useState<string>('');
  const [datePickerVisible, setDatePickerVisible] = useState<boolean>(false);
  const [dpYear, setDpYear] = useState<number>(new Date().getFullYear());
  const [dpMonth, setDpMonth] = useState<number>(new Date().getMonth() + 1);
  const [dpDay, setDpDay] = useState<number>(new Date().getDate());
  const [insAnnualCost, setInsAnnualCost] = useState<string>('');

  const [taxesExpanded, setTaxesExpanded] = useState<boolean>(false);
  const [taxModalVisible, setTaxModalVisible] = useState<boolean>(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [taxAuthority, setTaxAuthority] = useState<string>('');
  const [taxDueDate, setTaxDueDate] = useState<string>('');
  const [taxAmount, setTaxAmount] = useState<string>('');
  const [taxDatePickerVisible, setTaxDatePickerVisible] = useState<boolean>(false);
  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear());
  const [taxMonth, setTaxMonth] = useState<number>(new Date().getMonth() + 1);
  const [taxDay, setTaxDay] = useState<number>(new Date().getDate());

  const [loansExpanded, setLoansExpanded] = useState<boolean>(false);
  const [loanModalVisible, setLoanModalVisible] = useState<boolean>(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [loanLender, setLoanLender] = useState<string>('');
  const [loanPrincipal, setLoanPrincipal] = useState<string>('');
  const [loanInterestRate, setLoanInterestRate] = useState<string>('');
  const [loanTermYears, setLoanTermYears] = useState<string>('');
  const [loanMonthlyPayment, setLoanMonthlyPayment] = useState<string>('');
  const [loanPaymentDay, setLoanPaymentDay] = useState<string>('');

  const [checklistsExpanded, setChecklistsExpanded] = useState<boolean>(false);
  const [checklistModalVisible, setChecklistModalVisible] = useState<boolean>(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);

  const [docModalVisible, setDocModalVisible] = useState<boolean>(false);
  const [aiInsightsLoading, setAiInsightsLoading] = useState<boolean>(false);
  const [maintenanceInsights, setMaintenanceInsights] = useState<InvestmentInsight[]>([]);

  const property = useMemo(() => (typeof id === 'string' ? getPropertyById(id) : undefined), [id, getPropertyById]);

  const selectedChecklist = useMemo(() => {
    if (!property) return null;
    if (!selectedChecklistId) return null;
    const found = (property.checklists ?? []).find(c => c.id === selectedChecklistId) ?? null;
    return found;
  }, [property, selectedChecklistId]);

  const onEdit = useCallback(() => {
    if (!property) return;
    router.push({ pathname: '/modal', params: { mode: 'edit', id: property.id } });
  }, [property]);

  const openAddUtility = useCallback(() => {
    setEditingUtility(null);
    setFormProvider('');
    setFormAccountNumber('');
    setFormContactInfo('');
    setUtilityPaymentDay('');
    setUtilityModalVisible(true);
  }, []);

  const openEditUtility = useCallback((u: Utility) => {
    setEditingUtility(u);
    setFormProvider(u.provider);
    setFormAccountNumber(u.accountNumber);
    setFormContactInfo(u.contactInfo ?? '');
    setUtilityPaymentDay(u.paymentDayOfMonth != null ? String(u.paymentDayOfMonth) : '');
    setUtilityModalVisible(true);
  }, []);

  const onSaveUtility = useCallback(() => {
    if (!property) return;
    if (!formProvider || !formAccountNumber) {
      Alert.alert('Missing fields', 'Provider and Account Number are required.');
      return;
    }
    const payDay = utilityPaymentDay.trim() === '' ? undefined : Number(utilityPaymentDay);
    if (payDay != null && (Number.isNaN(payDay) || payDay < 1 || payDay > 31)) {
      Alert.alert('Invalid day', 'Payment Day of Month must be a number between 1 and 31.');
      return;
    }
    if (editingUtility) {
      updateUtilityOnProperty(property.id, { id: editingUtility.id, provider: formProvider, accountNumber: formAccountNumber, contactInfo: formContactInfo, paymentDayOfMonth: payDay });
    } else {
      addUtilityToProperty(property.id, { provider: formProvider, accountNumber: formAccountNumber, contactInfo: formContactInfo, paymentDayOfMonth: payDay });
    }
    setUtilityModalVisible(false);
  }, [property, formProvider, formAccountNumber, formContactInfo, editingUtility, addUtilityToProperty, updateUtilityOnProperty]);

  const onDeleteUtility = useCallback((utilityId: string) => {
    if (!property) return;
    Alert.alert('Delete Utility', 'Are you sure you want to delete this utility?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteUtilityFromProperty(property.id, utilityId) },
    ]);
  }, [property, deleteUtilityFromProperty]);

  const openAddLoan = useCallback(() => {
    setEditingLoan(null);
    setLoanLender('');
    setLoanPrincipal('');
    setLoanInterestRate('');
    setLoanTermYears('');
    setLoanMonthlyPayment('');
    setLoanPaymentDay('');
    setLoanModalVisible(true);
  }, []);

  const openEditLoan = useCallback((l: Loan) => {
    setEditingLoan(l);
    setLoanLender(l.lender);
    setLoanPrincipal(String(l.principalAmount ?? ''));
    setLoanInterestRate(String(l.interestRate ?? ''));
    setLoanTermYears(String(l.loanTerm ?? ''));
    setLoanMonthlyPayment(String(l.monthlyPayment ?? ''));
    setLoanPaymentDay(l.paymentDayOfMonth != null ? String(l.paymentDayOfMonth) : '');
    setLoanModalVisible(true);
  }, []);

  const onSaveLoan = useCallback(() => {
    if (!property) return;
    if (!loanLender) {
      Alert.alert('Missing fields', 'Lender is required.');
      return;
    }
    const principal = Number(loanPrincipal ?? '0');
    const rate = Number(loanInterestRate ?? '0');
    const term = Number(loanTermYears ?? '0');
    const monthly = Number(loanMonthlyPayment ?? '0');
    if ([principal, rate, term, monthly].some(n => Number.isNaN(n))) {
      Alert.alert('Invalid numbers', 'Principal, Interest Rate, Term, and Monthly Payment must be numbers.');
      return;
    }
    const payDay = loanPaymentDay.trim() === '' ? undefined : Number(loanPaymentDay);
    if (payDay != null && (Number.isNaN(payDay) || payDay < 1 || payDay > 31)) {
      Alert.alert('Invalid day', 'Payment Day of Month must be a number between 1 and 31.');
      return;
    }
    if (editingLoan) {
      updateLoanOnProperty(property.id, { id: editingLoan.id, lender: loanLender, principalAmount: principal, interestRate: rate, loanTerm: term, monthlyPayment: monthly, paymentDayOfMonth: payDay });
    } else {
      addLoanToProperty(property.id, { lender: loanLender, principalAmount: principal, interestRate: rate, loanTerm: term, monthlyPayment: monthly, paymentDayOfMonth: payDay });
    }
    setLoanModalVisible(false);
  }, [property, loanLender, loanPrincipal, loanInterestRate, loanTermYears, loanMonthlyPayment, editingLoan, addLoanToProperty, updateLoanOnProperty]);

  const onDelete = useCallback(() => {
    if (!property) return;
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              void deletePropertyAndCascade(property.id);
              router.back();
            } catch (e) {
              console.error('[PropertyDetails] delete error', e);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [property, deletePropertyAndCascade]);

  const generateMaintenanceInsights = useCallback(async () => {
    if (!property) return;

    setAiInsightsLoading(true);
    try {
      const propertyMaintenanceRequests = maintenanceRequests.filter(req => req.propertyId === property.id);
      const propertyTransactions = transactions.filter(t => t.propertyId === property.id);
      
      const insights = await investmentAdvisor.predictMaintenance(
        property,
        propertyMaintenanceRequests,
        propertyTransactions
      );
      
      setMaintenanceInsights(insights);
      
      if (insights.length > 0) {
        Alert.alert(
          'AI Insights Generated',
          `Found ${insights.length} predictive maintenance insights for this property.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Insights Found',
          'No specific maintenance predictions available for this property at this time.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[PropertyDetails] Maintenance insights failed:', error);
      Alert.alert(
        'Analysis Failed', 
        'Could not generate maintenance insights. Please check your gateway connection.',
        [{ text: 'OK' }]
      );
    } finally {
      setAiInsightsLoading(false);
    }
  }, [property, maintenanceRequests, transactions]);

  const openAddInsurance = useCallback(() => {
    setEditingInsurance(null);
    setInsProvider('');
    setInsPolicyNumber('');
    setInsRenewalDate('');
    setInsAnnualCost('');
    setInsuranceModalVisible(true);
  }, []);

  const openEditInsurance = useCallback((i: Insurance) => {
    setEditingInsurance(i);
    setInsProvider(i.provider);
    setInsPolicyNumber(i.policyNumber);
    setInsRenewalDate(i.renewalDate);
    setInsAnnualCost(String(i.annualCost ?? ''));
    setInsuranceModalVisible(true);
  }, []);

  const daysInMonth = useCallback((year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  }, []);

  const clampDay = useCallback((year: number, month: number, day: number) => {
    const dim = daysInMonth(year, month);
    return Math.min(Math.max(1, day), dim);
  }, [daysInMonth]);

  const openDatePicker = useCallback(() => {
    setDatePickerVisible(true);
  }, []);

  const confirmDatePicker = useCallback(() => {
    const d = clampDay(dpYear, dpMonth, dpDay);
    const yyyy = String(dpYear);
    const mm = String(dpMonth).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    setInsRenewalDate(`${yyyy}-${mm}-${dd}`);
    setDatePickerVisible(false);
  }, [dpYear, dpMonth, dpDay, clampDay]);

  const confirmTaxDatePicker = useCallback(() => {
    const d = clampDay(taxYear, taxMonth, taxDay);
    const yyyy = String(taxYear);
    const mm = String(taxMonth).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    setTaxDueDate(`${yyyy}-${mm}-${dd}`);
    setTaxDatePickerVisible(false);
  }, [taxYear, taxMonth, taxDay, clampDay]);

  const onSaveInsurance = useCallback(() => {
    if (!property) return;
    if (!insProvider || !insPolicyNumber || !insRenewalDate) {
      Alert.alert('Missing fields', 'Provider, Policy Number and Renewal Date are required.');
      return;
    }
    const annualCostNum = Number(insAnnualCost ?? '0');
    if (Number.isNaN(annualCostNum)) {
      Alert.alert('Invalid cost', 'Annual cost must be a number.');
      return;
    }
    if (editingInsurance) {
      updateInsuranceOnProperty(property.id, { id: editingInsurance.id, provider: insProvider, policyNumber: insPolicyNumber, renewalDate: insRenewalDate, annualCost: annualCostNum });
    } else {
      addInsuranceToProperty(property.id, { provider: insProvider, policyNumber: insPolicyNumber, renewalDate: insRenewalDate, annualCost: annualCostNum });
    }
    setInsuranceModalVisible(false);
  }, [property, insProvider, insPolicyNumber, insRenewalDate, insAnnualCost, editingInsurance, addInsuranceToProperty, updateInsuranceOnProperty]);

  const onDeleteInsurance = useCallback((insuranceId: string) => {
    if (!property) return;
    Alert.alert('Delete Insurance', 'Are you sure you want to delete this policy?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteInsuranceFromProperty(property.id, insuranceId) },
    ]);
  }, [property, deleteInsuranceFromProperty]);

  const openAddTax = useCallback(() => {
    setEditingTax(null);
    setTaxAuthority('');
    setTaxDueDate('');
    setTaxAmount('');
    setTaxModalVisible(true);
  }, []);

  const openEditTax = useCallback((t: Tax) => {
    setEditingTax(t);
    setTaxAuthority(t.authority);
    setTaxDueDate(t.dueDate);
    setTaxAmount(String(t.amount ?? ''));
    setTaxModalVisible(true);
  }, []);

  const onSaveTax = useCallback(() => {
    if (!property) return;
    if (!taxAuthority || !taxDueDate) {
      Alert.alert('Missing fields', 'Authority and Due Date are required.');
      return;
    }
    const amt = Number(taxAmount ?? '0');
    if (Number.isNaN(amt)) {
      Alert.alert('Invalid amount', 'Amount must be a number.');
      return;
    }
    if (editingTax) {
      updateTaxOnProperty(property.id, { id: editingTax.id, authority: taxAuthority, dueDate: taxDueDate, amount: amt });
    } else {
      addTaxToProperty(property.id, { authority: taxAuthority, dueDate: taxDueDate, amount: amt });
    }
    setTaxModalVisible(false);
  }, [property, taxAuthority, taxDueDate, taxAmount, editingTax, addTaxToProperty, updateTaxOnProperty]);

  const onDeleteTax = useCallback((taxId: string) => {
    if (!property) return;
    Alert.alert('Delete Tax', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTaxFromProperty(property.id, taxId) },
    ]);
  }, [property, deleteTaxFromProperty]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom header positioned over the top so the hero image reaches the top of the screen */}
  <View style={[styles.customHeader, { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingTop: insets.top, height: insets.top + 72, backgroundColor: '#ffffff', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 }]}>
        <View style={[styles.headerLeft, { alignItems: 'center' }]}> 
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text variant="headlineSmall" style={styles.customTitle} numberOfLines={1}>{property?.address ?? 'Property'}</Text>
        </View>
        <View style={styles.headerActions}>
          <Button testID="editPropertyBtn" onPress={onEdit} compact>
            <Text>Edit</Text>
          </Button>
          <Button testID="deletePropertyBtn" onPress={onDelete} compact textColor={theme.colors.error}>
            <Text>Delete</Text>
          </Button>
        </View>
      </View>
  <KeyboardAwareScrollView style={[styles.container, { backgroundColor: 'transparent', paddingTop: 0 }]} contentContainerStyle={styles.content} enableOnAndroid={true} extraScrollHeight={12}>
        {!property ? (
          <Surface style={styles.missing} elevation={0}>
            <Text variant="titleMedium">Property not found</Text>
            <Button mode="text" onPress={() => router.back()} style={styles.mt8}>
              <Text>Go Back</Text>
            </Button>
          </Surface>
        ) : (
          <View>
            <Image
              source={{ uri: property.imageUrl }}
              style={styles.hero}
              resizeMode="cover"
            />
            {/* Quadrant */}
            <View style={styles.quadrantWrap}>
              <CashFlowQuadrant property={property as Property} />
            </View>
            <Surface style={styles.card} elevation={1}>
              <Text variant="headlineSmall" style={styles.address} testID="detailsAddress">
                {property.address}
              </Text>
              <Text variant="bodyMedium" style={styles.cityState}>
                {property.city}, {property.province} {property.postalCode} · {property.country}
              </Text>

              <View style={styles.rowBetween}>
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: property.isOccupied ? theme.colors.primaryContainer : theme.colors.tertiaryContainer }]}
                  textStyle={styles.chipText}
                >
                  {property.isOccupied ? 'Occupied' : 'Vacant'}
                </Chip>
                {property.monthlyRent != null && (
                  <Text variant="titleMedium" style={styles.rent}>
                    ${property.monthlyRent.toLocaleString()}/mo
                  </Text>
                )}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Beds</Text>
                  <Text style={styles.statValue}>{property.bedrooms ?? '-'}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Baths</Text>
                  <Text style={styles.statValue}>{property.bathrooms ?? '-'}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Sq Ft</Text>
                  <Text style={styles.statValue}>{property.squareFeet ? property.squareFeet.toLocaleString() : '-'}</Text>
                </View>
              </View>

              <View style={styles.inlineActions}>
                <Button mode="contained" onPress={onEdit} testID="inlineEditBtn" style={styles.flex1} textColor={theme.colors.onPrimary}>
                  <Text>Edit Property</Text>
                </Button>
                <Button mode="outlined" onPress={onDelete} testID="inlineDeleteBtn" style={styles.flex1} textColor={theme.colors.error}>
                  <Text>Delete</Text>
                </Button>
              </View>
              <View style={styles.inlineActions}>
                <Button mode="contained" onPress={() => setDocModalVisible(true)} testID="generateDocBtn" style={styles.flex1}>
                  <Text>Generate Document</Text>
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={generateMaintenanceInsights}
                  testID="aiInsightsBtn" 
                  style={styles.flex1}
                  loading={aiInsightsLoading}
                  disabled={aiInsightsLoading}
                >
                  <Text>AI Insights</Text>
                </Button>
              </View>

              {maintenanceInsights.length > 0 && (
                <List.Section>
                  <List.Accordion
                    title={`AI Maintenance Insights (${maintenanceInsights.length})`}
                    expanded={true}
                    id="ai-insights-accordion"
                  >
                    {maintenanceInsights.map((insight) => (
                      <List.Item
                        key={insight.id}
                        title={insight.title}
                        description={insight.description}
                        left={() => (
                          <Chip 
                            mode="outlined" 
                            compact 
                            style={{ 
                              borderColor: insight.priority === 'high' ? theme.colors.error : 
                                          insight.priority === 'medium' ? '#f59e0b' : theme.colors.primary,
                              marginRight: 8
                            }}
                          >
                            {insight.priority.toUpperCase()}
                          </Chip>
                        )}
                        right={() => (
                          <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                            {insight.estimatedImpact?.financial ? 
                              `$${Math.abs(insight.estimatedImpact.financial)}` : 
                              `${Math.round(insight.confidence * 100)}% confidence`
                            }
                          </Text>
                        )}
                      />
                    ))}
                  </List.Accordion>
                </List.Section>
              )}

              <List.Section>
                <List.Accordion
                  title="Utilities"
                  expanded={utilitiesExpanded}
                  onPress={() => setUtilitiesExpanded((e) => !e)}
                  id="utilities-accordion"
                >
                  {(property.utilities ?? []).length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <Text>No utilities added.</Text>
                    </View>
                  ) : (
                    (property.utilities ?? []).map((u) => (
                      <List.Item
                        key={u.id}
                        title={u.provider}
                        description={`Account: ${u.accountNumber}${u.contactInfo ? `\nContact: ${u.contactInfo}` : ''}`}
                        right={() => (
                          <View style={styles.utilityActions}>
                            <Button onPress={() => openEditUtility(u)} compact>
                              <Text>Edit</Text>
                            </Button>
                            <Button onPress={() => onDeleteUtility(u.id)} compact textColor={theme.colors.error}>
                              <Text>Delete</Text>
                            </Button>
                          </View>
                        )}
                      />
                    ))
                  )}
                  <View style={styles.addUtilityWrap}>
                    <Button mode="contained" onPress={openAddUtility} testID="addUtilityBtn">
                      <Text>Add Utility</Text>
                    </Button>
                  </View>
                </List.Accordion>

                <List.Accordion
                  title="Insurance"
                  expanded={insuranceExpanded}
                  onPress={() => setInsuranceExpanded((e) => !e)}
                  id="insurance-accordion"
                >
                  {(property.insurances ?? []).length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <Text>No insurance policies added.</Text>
                    </View>
                  ) : (
                    (property.insurances ?? []).map((i) => (
                      <List.Item
                        key={i.id}
                        title={i.provider}
                        description={`Policy: ${i.policyNumber}\nRenewal: ${i.renewalDate}\nAnnual Cost: ${i.annualCost?.toLocaleString?.() ?? i.annualCost}`}
                        right={() => (
                          <View style={styles.utilityActions}>
                            <Button onPress={() => openEditInsurance(i)} compact>
                              <Text>Edit</Text>
                            </Button>
                            <Button onPress={() => onDeleteInsurance(i.id)} compact textColor={theme.colors.error}>
                              <Text>Delete</Text>
                            </Button>
                          </View>
                        )}
                      />
                    ))
                  )}
                  <View style={styles.addUtilityWrap}>
                    <Button mode="contained" onPress={openAddInsurance} testID="addInsuranceBtn">
                      <Text>Add Insurance</Text>
                    </Button>
                  </View>
                </List.Accordion>

                <List.Accordion
                  title="Property Taxes"
                  expanded={taxesExpanded}
                  onPress={() => setTaxesExpanded((e) => !e)}
                  id="taxes-accordion"
                >
                  {(property.taxes ?? []).length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <Text>No property tax records.</Text>
                    </View>
                  ) : (
                    (property.taxes ?? []).map((t) => (
                      <List.Item
                        key={t.id}
                        title={t.authority}
                        description={`Due: ${t.dueDate}\nAmount: ${t.amount?.toLocaleString?.() ?? t.amount}`}
                        right={() => (
                          <View style={styles.utilityActions}>
                            <Button onPress={() => openEditTax(t)} compact>
                              <Text>Edit</Text>
                            </Button>
                            <Button onPress={() => onDeleteTax(t.id)} compact textColor={theme.colors.error}>
                              <Text>Delete</Text>
                            </Button>
                          </View>
                        )}
                      />
                    ))
                  )}
                  <View style={styles.addUtilityWrap}>
                    <Button mode="contained" onPress={openAddTax} testID="addTaxBtn">
                      <Text>Add Tax</Text>
                    </Button>
                  </View>
                </List.Accordion>

                <List.Accordion
                  title="Loans & Liabilities"
                  expanded={loansExpanded}
                  onPress={() => setLoansExpanded((e) => !e)}
                  id="loans-accordion"
                >
                  {(property.loans ?? []).length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <Text>No loans added.</Text>
                    </View>
                  ) : (
                    (property.loans ?? []).map((l) => (
                      <List.Item
                        key={l.id}
                        title={l.lender}
                        description={`Principal: ${l.principalAmount?.toLocaleString?.() ?? l.principalAmount}\nRate: ${l.interestRate}%\nTerm: ${l.loanTerm} years\nMonthly: ${l.monthlyPayment?.toLocaleString?.() ?? l.monthlyPayment}`}
                        right={() => (
                          <View style={styles.utilityActions}>
                            <Button onPress={() => openEditLoan(l)} compact>
                              <Text>Edit</Text>
                            </Button>
                            <Button onPress={() => deleteLoanFromProperty(property.id, l.id)} compact textColor={theme.colors.error}>
                              <Text>Delete</Text>
                            </Button>
                          </View>
                        )}
                      />
                    ))
                  )}
                  <View style={styles.addUtilityWrap}>
                    <Button mode="contained" onPress={openAddLoan} testID="addLoanBtn">
                      <Text>Add Loan</Text>
                    </Button>
                  </View>
                </List.Accordion>

                <List.Accordion
                  title="Checklists"
                  expanded={checklistsExpanded}
                  onPress={() => setChecklistsExpanded((e) => !e)}
                  id="checklists-accordion"
                >
                  {(property.checklists ?? []).length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <Text>No checklists yet.</Text>
                    </View>
                  ) : (
                    (property.checklists ?? []).map((cl) => (
                      <List.Item
                        key={cl.id}
                        title={cl.templateName}
                        description={cl.items.map(ci => `${ci.isChecked ? '☑' : '☐'} ${ci.text}`).join('\n')}
                        right={() => (
                          <View style={styles.utilityActions}>
                            <Button onPress={() => { setSelectedChecklistId(cl.id); setChecklistModalVisible(true); }} compact>
                              <Text>View</Text>
                            </Button>
                            <Button onPress={() => deleteChecklistFromProperty(property.id, cl.id)} compact textColor={theme.colors.error}>
                              <Text>Delete</Text>
                            </Button>
                          </View>
                        )}
                      />
                    ))
                  )}
                  <View style={styles.addUtilityWrap}>
                    <Button mode="contained" onPress={() => { setSelectedChecklistId(null); setChecklistModalVisible(true); }} testID="addChecklistBtn">
                      <Text>Add Checklist</Text>
                    </Button>
                  </View>
                </List.Accordion>
              </List.Section>
            </Surface>
          </View>
        )}
  </KeyboardAwareScrollView>
  <Portal>
        <Modal visible={utilityModalVisible} onDismiss={() => setUtilityModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <View>
            <Text variant="titleMedium" style={styles.mb12}>{editingUtility ? 'Edit Utility' : 'Add Utility'}</Text>
            <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={12}>
              <TextInput
                label="Provider"
                value={formProvider}
                onChangeText={setFormProvider}
                style={styles.mb8}
                testID="utilityProviderInput"
              />
              <TextInput
                label="Account Number"
                value={formAccountNumber}
                onChangeText={setFormAccountNumber}
                style={styles.mb8}
                testID="utilityAccountInput"
              />
              <TextInput
                label="Contact Info"
                value={formContactInfo}
                onChangeText={setFormContactInfo}
                style={styles.mb8}
                testID="utilityContactInput"
              />
              <TextInput
                label="Payment Day of Month"
                value={utilityPaymentDay}
                onChangeText={setUtilityPaymentDay}
                keyboardType="numeric"
                style={styles.mb12}
                testID="utilityPaymentDayInput"
              />
            </KeyboardAwareScrollView>
            <View style={styles.rowBetween}>
              <Button mode="text" onPress={() => setUtilityModalVisible(false)}>
                <Text>Cancel</Text>
              </Button>
              <Button mode="contained" onPress={onSaveUtility} testID="saveUtilityBtn">
                <Text>Save</Text>
              </Button>
            </View>
          </View>
        </Modal>

        <Modal visible={insuranceModalVisible} onDismiss={() => setInsuranceModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <View>
            <Text variant="titleMedium" style={styles.mb12}>{editingInsurance ? 'Edit Insurance' : 'Add Insurance'}</Text>
            <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={12}>
              <TextInput
                label="Provider"
                value={insProvider}
                onChangeText={setInsProvider}
                style={styles.mb8}
                testID="insuranceProviderInput"
              />
              <TextInput
                label="Policy Number"
                value={insPolicyNumber}
                onChangeText={setInsPolicyNumber}
                style={styles.mb8}
                testID="insurancePolicyInput"
              />
              <Pressable onPress={openDatePicker} testID="openDatePickerBtn" accessibilityRole="button">
                <View pointerEvents="none">
                  <TextInput
                    label="Renewal Date"
                    value={insRenewalDate}
                    style={styles.mb8}
                    editable={false}
                    right={<TextInput.Affix text="📅" />}
                  />
                </View>
              </Pressable>
              <TextInput
                label="Annual Cost"
                value={insAnnualCost}
                onChangeText={setInsAnnualCost}
                keyboardType="numeric"
                style={styles.mb12}
                testID="insuranceCostInput"
              />
            </KeyboardAwareScrollView>
            <View style={styles.rowBetween}>
              <Button mode="text" onPress={() => setInsuranceModalVisible(false)}>
                <Text>Cancel</Text>
              </Button>
              <Button mode="contained" onPress={onSaveInsurance} testID="saveInsuranceBtn">
                <Text>Save</Text>
              </Button>
            </View>
          </View>
        </Modal>

        <Modal visible={datePickerVisible} onDismiss={() => setDatePickerVisible(false)} contentContainerStyle={styles.modalContent}>
          <Text variant="titleMedium" style={styles.mb12}>Select Renewal Date</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Year</Text>
              <View style={styles.dateControls}>
                <Button mode="outlined" compact onPress={() => setDpYear((y) => y - 1)} testID="yearDec"><Text>-</Text></Button>
                <Text style={styles.dateValue} testID="yearValue">{dpYear}</Text>
                <Button mode="outlined" compact onPress={() => setDpYear((y) => y + 1)} testID="yearInc"><Text>+</Text></Button>
              </View>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Month</Text>
              <View style={styles.dateControls}>
                <Button mode="outlined" compact onPress={() => setDpMonth((m) => (m <= 1 ? 12 : m - 1))} testID="monthDec"><Text>-</Text></Button>
                <Text style={styles.dateValue} testID="monthValue">{dpMonth}</Text>
                <Button mode="outlined" compact onPress={() => setDpMonth((m) => (m >= 12 ? 1 : m + 1))} testID="monthInc"><Text>+</Text></Button>
              </View>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Day</Text>
              <View style={styles.dateControls}>
                <Button mode="outlined" compact onPress={() => setDpDay((d) => clampDay(dpYear, dpMonth, d - 1))} testID="dayDec"><Text>-</Text></Button>
                <Text style={styles.dateValue} testID="dayValue">{clampDay(dpYear, dpMonth, dpDay)}</Text>
                <Button mode="outlined" compact onPress={() => setDpDay((d) => clampDay(dpYear, dpMonth, d + 1))} testID="dayInc"><Text>+</Text></Button>
              </View>
            </View>
          </View>
          <View style={styles.rowBetween}>
            <Button mode="text" onPress={() => setDatePickerVisible(false)}><Text>Cancel</Text></Button>
            <Button mode="contained" onPress={confirmDatePicker} testID="confirmDateBtn"><Text>Confirm</Text></Button>
          </View>
        </Modal>
      
        <Modal visible={taxModalVisible} onDismiss={() => setTaxModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <View>
            <Text variant="titleMedium" style={styles.mb12}>{editingTax ? 'Edit Tax' : 'Add Tax'}</Text>
            <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={12}>
              <TextInput
                label="Authority"
                value={taxAuthority}
                onChangeText={setTaxAuthority}
                style={styles.mb8}
                testID="taxAuthorityInput"
              />
              <Pressable onPress={() => setTaxDatePickerVisible(true)} testID="openTaxDatePickerBtn" accessibilityRole="button">
                <View pointerEvents="none">
                  <TextInput
                    label="Due Date"
                    value={taxDueDate}
                    style={styles.mb8}
                    editable={false}
                    right={<TextInput.Affix text="📅" />}
                  />
                </View>
              </Pressable>
              <TextInput
                label="Amount"
                value={taxAmount}
                onChangeText={setTaxAmount}
                keyboardType="numeric"
                style={styles.mb12}
                testID="taxAmountInput"
              />
            </KeyboardAwareScrollView>
            <View style={styles.rowBetween}>
              <Button mode="text" onPress={() => setTaxModalVisible(false)}>
                <Text>Cancel</Text>
              </Button>
              <Button mode="contained" onPress={onSaveTax} testID="saveTaxBtn">
                <Text>Save</Text>
              </Button>
            </View>
          </View>
        </Modal>

        <Modal visible={taxDatePickerVisible} onDismiss={() => setTaxDatePickerVisible(false)} contentContainerStyle={styles.modalContent}>
          <Text variant="titleMedium" style={styles.mb12}>Select Due Date</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Year</Text>
              <View style={styles.dateControls}>
                <Button mode="outlined" compact onPress={() => setTaxYear((y) => y - 1)} testID="taxYearDec"><Text>-</Text></Button>
                <Text style={styles.dateValue} testID="taxYearValue">{taxYear}</Text>
                <Button mode="outlined" compact onPress={() => setTaxYear((y) => y + 1)} testID="taxYearInc"><Text>+</Text></Button>
              </View>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Month</Text>
              <View style={styles.dateControls}>
                <Button mode="outlined" compact onPress={() => setTaxMonth((m) => (m <= 1 ? 12 : m - 1))} testID="taxMonthDec"><Text>-</Text></Button>
                <Text style={styles.dateValue} testID="taxMonthValue">{taxMonth}</Text>
                <Button mode="outlined" compact onPress={() => setTaxMonth((m) => (m >= 12 ? 1 : m + 1))} testID="taxMonthInc"><Text>+</Text></Button>
              </View>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Day</Text>
              <View style={styles.dateControls}>
                <Button mode="outlined" compact onPress={() => setTaxDay((d) => clampDay(taxYear, taxMonth, d - 1))} testID="taxDayDec"><Text>-</Text></Button>
                <Text style={styles.dateValue} testID="taxDayValue">{clampDay(taxYear, taxMonth, taxDay)}</Text>
                <Button mode="outlined" compact onPress={() => setTaxDay((d) => clampDay(taxYear, taxMonth, d + 1))} testID="taxDayInc"><Text>+</Text></Button>
              </View>
            </View>
          </View>
          <View style={styles.rowBetween}>
            <Button mode="text" onPress={() => setTaxDatePickerVisible(false)}><Text>Cancel</Text></Button>
            <Button mode="contained" onPress={confirmTaxDatePicker} testID="confirmTaxDateBtn"><Text>Confirm</Text></Button>
          </View>
        </Modal>
        <Modal visible={loanModalVisible} onDismiss={() => setLoanModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <View>
            <Text variant="titleMedium" style={styles.mb12}>{editingLoan ? 'Edit Loan' : 'Add Loan'}</Text>
            <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={12}>
              <TextInput
                label="Lender"
                value={loanLender}
                onChangeText={setLoanLender}
                style={styles.mb8}
                testID="loanLenderInput"
              />
              <TextInput
                label="Principal Amount"
                value={loanPrincipal}
                onChangeText={setLoanPrincipal}
                keyboardType="numeric"
                style={styles.mb8}
                testID="loanPrincipalInput"
              />
              <TextInput
                label="Interest Rate (%)"
                value={loanInterestRate}
                onChangeText={setLoanInterestRate}
                keyboardType="numeric"
                style={styles.mb8}
                testID="loanRateInput"
              />
              <TextInput
                label="Loan Term (years)"
                value={loanTermYears}
                onChangeText={setLoanTermYears}
                keyboardType="numeric"
                style={styles.mb8}
                testID="loanTermInput"
              />
              <TextInput
                label="Monthly Payment"
                value={loanMonthlyPayment}
                onChangeText={setLoanMonthlyPayment}
                keyboardType="numeric"
                style={styles.mb8}
                testID="loanMonthlyInput"
              />
              <TextInput
                label="Payment Day of Month"
                value={loanPaymentDay}
                onChangeText={setLoanPaymentDay}
                keyboardType="numeric"
                style={styles.mb12}
                testID="loanPaymentDayInput"
              />
            </KeyboardAwareScrollView>
            <View style={styles.rowBetween}>
              <Button mode="text" onPress={() => setLoanModalVisible(false)}>
                <Text>Cancel</Text>
              </Button>
              <Button mode="contained" onPress={onSaveLoan} testID="saveLoanBtn">
                <Text>Save</Text>
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal visible={docModalVisible} onDismiss={() => setDocModalVisible(false)} contentContainerStyle={styles.modalContent}>
          {!property ? (
            <View />
          ) : (
            <View>
              <Text variant="titleMedium" style={styles.mb12}>Select a Template</Text>
              <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={12}>
                <View style={{ gap: 8 }}>
                  {documentTemplates.map((tpl: DocumentTemplate) => (
                    <Button
                      key={tpl.name}
                      mode="outlined"
                      testID={`docTpl-${tpl.name.replace(/\s+/g, '-')}`}
                      onPress={() => {
                        const p = property as Property;
                        const prompt = generateDocumentPrompt(tpl, p, undefined, {
                          allowExternalScripts: false
                        });
                        setDocModalVisible(false);
                        router.push({ pathname: '/documents/viewer', params: { prompt } });
                      }}
                    >
                      <Text>{tpl.name}</Text>
                    </Button>
                  ))}
                </View>
              </KeyboardAwareScrollView>
              <View style={styles.rowBetween}>
                <Button mode="text" onPress={() => setDocModalVisible(false)}>
                  <Text>Close</Text>
                </Button>
              </View>
            </View>
          )}
        </Modal>

        <Modal visible={checklistModalVisible} onDismiss={() => { setChecklistModalVisible(false); setSelectedChecklistId(null); }} contentContainerStyle={styles.modalContent}>
          {!property ? (
            <View />
          ) : selectedChecklist ? (
            <View>
              <Text variant="titleMedium" style={styles.mb12}>{selectedChecklist.templateName}</Text>
              <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={12}>
                <View style={{ gap: 8 }}>
                  {selectedChecklist.items.map((it) => (
                    <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Checkbox
                        status={it.isChecked ? 'checked' : 'unchecked'}
                        onPress={() => updateChecklistItemStatus(property.id, selectedChecklist.id, it.id, !it.isChecked)}
                        testID={`checklistItem-${it.id}`}
                      />
                      <Text>{it.text}</Text>
                    </View>
                  ))}
                </View>
              </KeyboardAwareScrollView>
              <View style={styles.rowBetween}>
                <Button mode="text" onPress={() => { setSelectedChecklistId(null); }}>
                  <Text>Close</Text>
                </Button>
              </View>
            </View>
          ) : (
            <View>
              <Text variant="titleMedium" style={styles.mb12}>Add Checklist</Text>
              <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={12}>
                <View style={{ gap: 8 }}>
                  {allTemplates.map((tpl: AnyChecklistTemplate) => (
                    <Button key={tpl.name + ('id' in tpl ? tpl.id : '')} mode="outlined" onPress={() => { addChecklistToProperty(property.id, { name: tpl.name, items: tpl.items }); setChecklistModalVisible(false); }} testID={`addChecklist-${tpl.name.replace(/\s+/g, '-')}`}>
                      <Text>{tpl.name}</Text>
                    </Button>
                  ))}
                  <Button mode="contained" onPress={() => { setChecklistModalVisible(false); router.push({ pathname: '/checklists/builder', params: { propertyId: property.id } }); }} testID="openChecklistBuilderBtn">
                    <Text>Create Custom Checklist</Text>
                  </Button>
                </View>
              </KeyboardAwareScrollView>
            </View>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  content: { paddingBottom: 40 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 },
  hero: { width: '100%', height: 220, backgroundColor: '#e5e7eb' },
  card: { marginHorizontal: 20, marginTop: 12, borderRadius: 12, padding: 16, backgroundColor: '#fff' },
  address: { fontWeight: '600' as const, color: '#2c3e50', marginBottom: 4 },
  cityState: { color: '#7f8c8d', marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusChip: { height: 28 },
  chipText: { fontSize: 12, fontWeight: '500' as const },
  rent: { fontWeight: '600' as const, color: '#34495e' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { color: '#95a5a6', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 },
  statValue: { color: '#34495e', fontWeight: '500' as const },
  inlineActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  flex1: { flex: 1 },
  missing: { margin: 20, padding: 16, borderRadius: 12 },
  mt8: { marginTop: 8 },
  emptyWrap: { paddingVertical: 8, paddingHorizontal: 12 },
  addUtilityWrap: { paddingHorizontal: 12, paddingVertical: 8 },
  utilityActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalContent: { backgroundColor: '#fff', margin: 20, padding: 16, borderRadius: 12 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  dateCol: { flex: 1 },
  dateLabel: { color: '#7f8c8d', marginBottom: 6 },
  dateControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateValue: { minWidth: 40, textAlign: 'center', fontWeight: '600' as const },
  quadrantWrap: { marginTop: -40 },
  customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '70%' },
  customTitle: { fontWeight: '600' as const, color: '#111' },
});