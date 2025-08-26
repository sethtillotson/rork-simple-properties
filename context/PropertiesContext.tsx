import createContextHook from '@nkzw/create-context-hook';
import React, { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Property, Utility, Insurance, Tax, Loan, Checklist, ChecklistItem } from '@/types/property';

import { scheduleLocalNotification, cancelScheduledNotification, getNextMonthlyDate } from '@/services/notificationService';

const mockProperties: Property[] = [
  {
    id: '1',
    address: '123 Main Street',
    city: 'Fargo',
    province: 'ND',
    postalCode: '58102',
    country: 'US',
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1850,
    monthlyRent: 1450,
    isOccupied: true,
  },
  {
    id: '2',
    address: '456 Prairie Avenue',
    city: 'Bismarck',
    province: 'ND',
    postalCode: '58501',
    country: 'US',
    imageUrl: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&q=80',
    bedrooms: 4,
    bathrooms: 2.5,
    squareFeet: 2200,
    monthlyRent: 1750,
    isOccupied: true,
  },
  {
    id: '3',
    address: '789 River Road',
    city: 'Grand Forks',
    province: 'ND',
    postalCode: '58201',
    country: 'US',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 1200,
    monthlyRent: 950,
    isOccupied: false,
  },
  {
    id: '4',
    address: '321 Oak Street',
    city: 'Minot',
    province: 'ND',
    postalCode: '58701',
    country: 'US',
    imageUrl: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
    bedrooms: 3,
    bathrooms: 1.5,
    squareFeet: 1600,
    monthlyRent: 1250,
    isOccupied: true,
  },
];

export const [PropertiesProvider, useProperties] = createContextHook(() => {
  const STORAGE_KEY = 'properties';
  const [properties, setProperties] = useState<Property[]>(mockProperties);

  useEffect(() => {
    const load = async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json) as unknown;
          if (Array.isArray(parsed)) {
            const migrated = (parsed as any[]).map((p) => {
              const hasNew = typeof p.province === 'string' && typeof p.postalCode === 'string';
              return hasNew
                ? (p as Property)
                : ({
                    ...p,
                    province: (p.state as string) ?? '',
                    postalCode: (p.zip as string) ?? '',
                    country: 'US',
                  } as Property);
            });
            setProperties(migrated);
            console.log('[PropertiesContext] Loaded from storage', migrated.length);
          }
        } else {
          console.log('[PropertiesContext] No stored data, using mockProperties');
        }
      } catch (e) {
        console.error('[PropertiesContext] load error', e);
      }
    };
    load();
  }, []);

  const persist = useCallback(async (items: Property[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      console.log('[PropertiesContext] Persisted', items.length);
    } catch (e) {
      console.error('[PropertiesContext] persist error', e);
    }
  }, []);

  const addProperty = useCallback((property: Omit<Property, 'id'>) => {
    const newProperty: Property = {
      ...property,
      id: Date.now().toString(),
    };
    setProperties(prev => {
      const updated = [...prev, newProperty];
      void persist(updated);
      return updated;
    });
    console.log('Property added:', newProperty);
  }, [persist]);

  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    setProperties(prev => {
      const updated = prev.map(property =>
        property.id === id ? { ...property, ...updates } : property
      );
      void persist(updated);
      return updated;
    });
  }, [persist]);

  const addUtilityToProperty = useCallback((propertyId: string, utilityData: Omit<Utility, 'id'> & Partial<Pick<Utility, 'id'>>) => {
    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const nextId = utilityData.id ?? Date.now().toString();
        const nextUtilities: Utility[] = [
          ...(p.utilities ?? []),
          {
            id: nextId,
            provider: utilityData.provider,
            accountNumber: utilityData.accountNumber,
            contactInfo: utilityData.contactInfo,
            paymentDayOfMonth: utilityData.paymentDayOfMonth,
          },
        ];
        return { ...p, utilities: nextUtilities } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist]);

  const updateUtilityOnProperty = useCallback((propertyId: string, updatedUtility: Utility) => {
    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const utilities = (p.utilities ?? []).map(u => (u.id === updatedUtility.id ? { ...u, ...updatedUtility } : u));
        return { ...p, utilities } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist]);

  const deleteUtilityFromProperty = useCallback((propertyId: string, utilityId: string) => {
    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const utilities = (p.utilities ?? []).filter(u => u.id !== utilityId);
        return { ...p, utilities } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist]);

  const updatePropertyOccupancy = useCallback((id: string, status: 'Occupied' | 'Vacant') => {
    const isOccupied = status === 'Occupied';
    setProperties(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, isOccupied } : p));
      void persist(updated);
      return updated;
    });
    console.log('[PropertiesContext] updatePropertyOccupancy', { id, status, isOccupied });
  }, [persist]);

  const addInsuranceToProperty = useCallback(async (propertyId: string, insuranceData: Omit<Insurance, 'id'> & Partial<Pick<Insurance, 'id'>>) => {
    const nextId = insuranceData.id ?? Date.now().toString();
    let notificationId: string | null = null;
    if (insuranceData.renewalDate) {
      const date = new Date(insuranceData.renewalDate);
      notificationId = await scheduleLocalNotification({ id: `insurance-${propertyId}-${nextId}`, title: 'Insurance Renewal', body: `${insuranceData.provider} policy renews`, date });
    }

    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const nextInsurances: Insurance[] = [
          ...(p.insurances ?? []),
          {
            id: nextId,
            provider: insuranceData.provider,
            policyNumber: insuranceData.policyNumber,
            renewalDate: insuranceData.renewalDate,
            annualCost: insuranceData.annualCost ?? 0,
            notificationId: notificationId ?? undefined,
          },
        ];
        return { ...p, insurances: nextInsurances } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist]);

  const updateInsuranceOnProperty = useCallback(async (propertyId: string, updatedInsurance: Insurance) => {
    const current = properties.find(p => p.id === propertyId);
    const existing = current?.insurances?.find(i => i.id === updatedInsurance.id);

    if (existing?.notificationId) {
      await cancelScheduledNotification(existing.notificationId);
    }

    let notificationId: string | null = null;
    if (updatedInsurance.renewalDate) {
      const date = new Date(updatedInsurance.renewalDate);
      notificationId = await scheduleLocalNotification({ id: `insurance-${propertyId}-${updatedInsurance.id}`, title: 'Insurance Renewal', body: `${updatedInsurance.provider} policy renews`, date });
    }

    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const insurances = (p.insurances ?? []).map(i => (i.id === updatedInsurance.id ? { ...i, ...updatedInsurance, notificationId: notificationId ?? undefined } : i));
        return { ...p, insurances } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist, properties]);

  const deleteInsuranceFromProperty = useCallback(async (propertyId: string, insuranceId: string) => {
    const current = properties.find(p => p.id === propertyId);
    const existing = current?.insurances?.find(i => i.id === insuranceId);
    if (existing?.notificationId) {
      await cancelScheduledNotification(existing.notificationId);
    }

    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const insurances = (p.insurances ?? []).filter(i => i.id !== insuranceId);
        return { ...p, insurances } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist, properties]);

  const deleteProperty = useCallback((id: string) => {
    setProperties(prev => {
      const updated = prev.filter(property => property.id !== id);
      void persist(updated);
      return updated;
    });
    console.log('[PropertiesContext] deleteProperty', { id });
  }, [persist]);

  const getPropertyById = useCallback((id: string) => {
    return properties.find(property => property.id === id);
  }, [properties]);

  const addTaxToProperty = useCallback(async (propertyId: string, taxData: Omit<Tax, 'id'> & Partial<Pick<Tax, 'id'>>) => {
    const nextId = taxData.id ?? Date.now().toString();
    let notificationId: string | null = null;
    if (taxData.dueDate) {
      const date = new Date(taxData.dueDate);
      notificationId = await scheduleLocalNotification({ id: `tax-${propertyId}-${nextId}`, title: 'Property Tax Due', body: `${taxData.authority} tax is due`, date });
    }

    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const nextTaxes: Tax[] = [
          ...(p.taxes ?? []),
          {
            id: nextId,
            authority: taxData.authority,
            dueDate: taxData.dueDate,
            amount: taxData.amount ?? 0,
            notificationId: notificationId ?? undefined,
          },
        ];
        return { ...p, taxes: nextTaxes } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist]);

  const updateTaxOnProperty = useCallback(async (propertyId: string, updatedTax: Tax) => {
    const current = properties.find(p => p.id === propertyId);
    const existing = current?.taxes?.find(t => t.id === updatedTax.id);
    if (existing?.notificationId) {
      await cancelScheduledNotification(existing.notificationId);
    }
    let notificationId: string | null = null;
    if (updatedTax.dueDate) {
      const date = new Date(updatedTax.dueDate);
      notificationId = await scheduleLocalNotification({ id: `tax-${propertyId}-${updatedTax.id}`, title: 'Property Tax Due', body: `${updatedTax.authority} tax is due`, date });
    }

    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const taxes = (p.taxes ?? []).map(t => (t.id === updatedTax.id ? { ...t, ...updatedTax, notificationId: notificationId ?? undefined } : t));
        return { ...p, taxes } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist, properties]);

  const deleteTaxFromProperty = useCallback(async (propertyId: string, taxId: string) => {
    const current = properties.find(p => p.id === propertyId);
    const existing = current?.taxes?.find(t => t.id === taxId);
    if (existing?.notificationId) {
      await cancelScheduledNotification(existing.notificationId);
    }

    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const taxes = (p.taxes ?? []).filter(t => t.id !== taxId);
        return { ...p, taxes } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist, properties]);

  const addLoanToProperty = useCallback(async (propertyId: string, loanData: Omit<Loan, 'id'> & Partial<Pick<Loan, 'id'>>) => {
    const nextId = loanData.id ?? Date.now().toString();
    let notificationId: string | null = null;
    const nextDate = getNextMonthlyDate(loanData.paymentDayOfMonth);
    if (nextDate) {
      notificationId = await scheduleLocalNotification({ id: `loan-${propertyId}-${nextId}`, title: 'Loan Payment Due', body: `${loanData.lender} payment is due`, date: nextDate });
    }

    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const nextLoans: Loan[] = [
          ...(p.loans ?? []),
          {
            id: nextId,
            lender: loanData.lender,
            principalAmount: loanData.principalAmount ?? 0,
            interestRate: loanData.interestRate ?? 0,
            loanTerm: loanData.loanTerm ?? 0,
            monthlyPayment: loanData.monthlyPayment ?? 0,
            paymentDayOfMonth: loanData.paymentDayOfMonth,
            notificationId: notificationId ?? undefined,
          },
        ];
        return { ...p, loans: nextLoans } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist]);

  const updateLoanOnProperty = useCallback(async (propertyId: string, updatedLoan: Loan) => {
    const current = properties.find(p => p.id === propertyId);
    const existing = current?.loans?.find(l => l.id === updatedLoan.id);
    if (existing?.notificationId) {
      await cancelScheduledNotification(existing.notificationId);
    }
    let notificationId: string | null = null;
    const nextDate = getNextMonthlyDate(updatedLoan.paymentDayOfMonth);
    if (nextDate) {
      notificationId = await scheduleLocalNotification({ id: `loan-${propertyId}-${updatedLoan.id}`, title: 'Loan Payment Due', body: `${updatedLoan.lender} payment is due`, date: nextDate });
    }

    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const loans = (p.loans ?? []).map(l => (l.id === updatedLoan.id ? { ...l, ...updatedLoan, notificationId: notificationId ?? undefined } : l));
        return { ...p, loans } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist, properties]);

  const deleteLoanFromProperty = useCallback(async (propertyId: string, loanId: string) => {
    const current = properties.find(p => p.id === propertyId);
    const existing = current?.loans?.find(l => l.id === loanId);
    if (existing?.notificationId) {
      await cancelScheduledNotification(existing.notificationId);
    }

    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const loans = (p.loans ?? []).filter(l => l.id !== loanId);
        return { ...p, loans } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist, properties]);

  const addChecklistToProperty = useCallback((propertyId: string, template: { name: string; items: { id: string; text: string }[] }) => {
    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const newChecklistId = Date.now().toString();
        const items: ChecklistItem[] = template.items.map(it => ({ id: `${newChecklistId}-${it.id}` , text: it.text, isChecked: false }));
        const newChecklist: Checklist = { id: newChecklistId, templateName: template.name, items };
        const next = { ...p, checklists: [ ...(p.checklists ?? []), newChecklist ] } as Property;
        return next;
      });
      void persist(updated);
      return updated;
    });
  }, [persist]);

  const updateChecklistItemStatus = useCallback((propertyId: string, checklistId: string, itemId: string, isChecked: boolean) => {
    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const checklists = (p.checklists ?? []).map(cl => {
          if (cl.id !== checklistId) return cl;
          const items = cl.items.map(it => (it.id === itemId ? { ...it, isChecked } : it));
          return { ...cl, items };
        });
        return { ...p, checklists } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist]);

  const deleteChecklistFromProperty = useCallback((propertyId: string, checklistId: string) => {
    setProperties(prev => {
      const updated = prev.map(p => {
        if (p.id !== propertyId) return p;
        const checklists = (p.checklists ?? []).filter(cl => cl.id !== checklistId);
        return { ...p, checklists } as Property;
      });
      void persist(updated);
      return updated;
    });
  }, [persist]);

  return {
    properties,
    addProperty,
    updateProperty,
    updatePropertyOccupancy,
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
  };
});