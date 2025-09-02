import type { Property, Tenant } from '@/types/property';

export type DocVariables = {
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  lease_end_date?: string;

  property_address?: string;
  property_city?: string;
  property_province?: string;
  property_postal_code?: string;
  property_country?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  monthly_rent?: number;

  landlord_name: string;
  landlord_address: string;

  date_today: string;
};

export function buildDocVariables(property?: Property, tenant?: Tenant): DocVariables {
  const date_today = new Date().toISOString().slice(0, 10);
  return {
    tenant_name: tenant?.name || undefined,
    tenant_email: tenant?.email || undefined,
    tenant_phone: tenant?.phone || undefined,
    lease_end_date: tenant?.leaseEndDate || undefined,

    property_address: property?.address || undefined,
    property_city: property?.city || undefined,
    property_province: property?.province || undefined,
    property_postal_code: property?.postalCode || undefined,
    property_country: property?.country || undefined,
    bedrooms: property?.bedrooms,
    bathrooms: property?.bathrooms,
    square_feet: property?.squareFeet,
    monthly_rent: property?.monthlyRent,

    // Placeholders for landlord values until a Settings source exists
    landlord_name: '[LANDLORD_NAME]',
    landlord_address: '[LANDLORD_ADDRESS]',

    date_today,
  };
}
