import { useCallback } from 'react';
import { useProperties } from '@/context/PropertiesContext';
import { useTenants } from '@/context/TenantsContext';
import { useMaintenance } from '@/context/MaintenanceContext';
import { useFinancials } from '@/context/FinancialsContext';

export type DataService = {
  deletePropertyAndCascade: (propertyId: string) => Promise<void>;
};

export function useDataService(): DataService {
  const { deleteProperty } = useProperties();
  const { deleteTenantsByPropertyId } = useTenants();
  const { deleteMaintenanceByPropertyId } = useMaintenance();
  const { deleteTransactionsByPropertyId } = useFinancials();

  const deletePropertyAndCascade = useCallback(async (propertyId: string) => {
    try {
      console.log('[DataService] Cascade delete start', { propertyId });
      // Remove linked data first so UI stays consistent
      deleteTenantsByPropertyId(propertyId);
      deleteMaintenanceByPropertyId(propertyId);
      deleteTransactionsByPropertyId(propertyId);
      // Finally remove the property itself
      deleteProperty(propertyId);
      console.log('[DataService] Cascade delete complete', { propertyId });
    } catch (e) {
      console.error('[DataService] Cascade delete error', e);
      throw e;
    }
  }, [deleteMaintenanceByPropertyId, deleteProperty, deleteTenantsByPropertyId, deleteTransactionsByPropertyId]);

  return { deletePropertyAndCascade };
}
