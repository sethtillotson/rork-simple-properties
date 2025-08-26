import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Surface, Button, useTheme, TextInput, HelperText, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { useProperties } from '@/context/PropertiesContext';
import { Property, CountryCode } from '@/types/property';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function AddPropertyModal() {
  const theme = useTheme();
  const { addProperty, updateProperty, getPropertyById } = useProperties();
  const params = useLocalSearchParams<{ mode?: string; id?: string }>();
  const isEdit = (params.mode ?? '') === 'edit' && typeof params.id === 'string' && params.id.length > 0;
  const editingId = (isEdit ? (params.id as string) : null);

  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [province, setProvince] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [country, setCountry] = useState<CountryCode>('US');
  const [beds, setBeds] = useState<string>('');
  const [baths, setBaths] = useState<string>('');
  const [sqft, setSqft] = useState<string>('');
  const [rent, setRent] = useState<string>('');
  const [cashInvested, setCashInvested] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && editingId) {
      const existing = getPropertyById(editingId);
      console.log('[AddPropertyModal] Prefill for edit', editingId, existing);
      if (existing) {
        setAddress(existing.address ?? '');
        setCity(existing.city ?? '');
        setProvince(existing.province ?? '');
        setPostalCode(existing.postalCode ?? '');
        setCountry(existing.country ?? 'US');
        setBeds(existing.bedrooms != null ? String(existing.bedrooms) : '');
        setBaths(existing.bathrooms != null ? String(existing.bathrooms) : '');
        setSqft(existing.squareFeet != null ? String(existing.squareFeet) : '');
        setRent(existing.monthlyRent != null ? String(existing.monthlyRent) : '');
        setCashInvested(existing.cashInvested != null ? String(existing.cashInvested) : '');
        setPurchasePrice(existing.purchasePrice != null ? String(existing.purchasePrice) : '');
        setImageUri(existing.imageUrl ?? null);
      }
    }
  }, [isEdit, editingId, getPropertyById]);

  const isSaveDisabled = useMemo(() => {
    const hasProvince = province.trim().length > 0;
    const hasPostal = postalCode.trim().length > 0;
    return address.trim().length === 0 || city.trim().length === 0 || !hasProvince || !hasPostal;
  }, [address, city, province, postalCode]);

  const parseNumber = useCallback((v: string): number | undefined => {
    const cleaned = v.replace(/[^0-9.]/g, '');
    if (cleaned.length === 0) return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }, []);

  const onSave = useCallback(() => {
    try {
      setError(null);
      if (isSaveDisabled) {
        setError('Please fill in Address, City, and valid region/postal code.');
        return;
      }

      const existing = isEdit && editingId ? getPropertyById(editingId) : undefined;
      const payload: Omit<Property, 'id'> = {
        address: address.trim(),
        city: city.trim(),
        province: province.trim(),
        postalCode: postalCode.trim(),
        country,
        imageUrl: imageUri ?? existing?.imageUrl ?? 'https://images.unsplash.com/photo-1505692794403-34f27b478d9d?w=1200&q=80',
        bedrooms: parseNumber(beds),
        bathrooms: parseNumber(baths),
        squareFeet: parseNumber(sqft),
        monthlyRent: parseNumber(rent),
        isOccupied: existing?.isOccupied ?? false,
        cashInvested: parseNumber(cashInvested),
        purchasePrice: parseNumber(purchasePrice),
      };

      if (isEdit && editingId) {
        console.log('[AddPropertyModal] Updating property', editingId, payload);
        updateProperty(editingId, payload);
      } else {
        console.log('[AddPropertyModal] Creating property', payload);
        addProperty(payload);
      }
      router.back();
    } catch (e) {
      console.error('[AddPropertyModal] Error saving property', e);
      setError('Something went wrong while saving. Please try again.');
    }
  }, [address, city, province, postalCode, country, beds, baths, sqft, rent, cashInvested, purchasePrice, imageUri, addProperty, updateProperty, isSaveDisabled, parseNumber, isEdit, editingId, getPropertyById]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Surface style={styles.header} elevation={0}>
        <Text testID="addPropertyHeaderTitle" variant="headlineSmall" style={styles.title}>
          {isEdit ? 'Edit Property' : 'Add New Property'}
        </Text>
        <Button
          testID="closeAddProperty"
          mode="text"
          onPress={() => router.back()}
          icon={() => <X size={20} color={theme.colors.onSurface} />}
          style={styles.closeButton}
        >
          <Text>Close</Text>
        </Button>
      </Surface>

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.formContent}
        enableOnAndroid={true}
        extraScrollHeight={12}
        keyboardOpeningTime={0}
      >
          <TextInput
            testID="inputAddress"
            mode="outlined"
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St"
            style={styles.input}
            returnKeyType="next"
          />
          <TextInput
            testID="inputCity"
            mode="outlined"
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="Fargo"
            style={styles.input}
            returnKeyType="next"
          />
          <SegmentedButtons
            value={country}
            onValueChange={(val) => setCountry((val as CountryCode) ?? 'US')}
            buttons={[
              { value: 'US', label: 'United States' },
              { value: 'UK', label: 'United Kingdom' },
            ]}
            style={styles.segmented}
          />

          <View style={styles.row}>
            <TextInput
              testID="inputProvince"
              mode="outlined"
              label={country === 'US' ? 'State' : 'County'}
              value={province}
              onChangeText={setProvince}
              placeholder={country === 'US' ? 'ND' : 'Surrey'}
              style={[styles.input, styles.rowInput]}
              returnKeyType="next"
            />
            <TextInput
              testID="inputPostalCode"
              mode="outlined"
              label={country === 'US' ? 'Zip Code' : 'Postal Code'}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder={country === 'US' ? '58102' : 'SW1A 1AA'}
              keyboardType={country === 'US' ? 'number-pad' : 'default'}
              style={[styles.input, styles.rowInput]}
              returnKeyType="next"
              maxLength={12}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              testID="inputBeds"
              mode="outlined"
              label="Beds"
              value={beds}
              onChangeText={setBeds}
              placeholder="3"
              keyboardType="number-pad"
              style={[styles.input, styles.rowInput]}
              returnKeyType="next"
            />
            <TextInput
              testID="inputBaths"
              mode="outlined"
              label="Baths"
              value={baths}
              onChangeText={setBaths}
              placeholder="2"
              keyboardType="decimal-pad"
              style={[styles.input, styles.rowInput]}
              returnKeyType="next"
            />
          </View>

          <View style={styles.row}>
            <TextInput
              testID="inputSqft"
              mode="outlined"
              label="Square Feet"
              value={sqft}
              onChangeText={setSqft}
              placeholder="1850"
              keyboardType="number-pad"
              style={[styles.input, styles.rowInput]}
              returnKeyType="next"
            />
            <TextInput
              testID="inputRent"
              mode="outlined"
              label="Monthly Rent"
              value={rent}
              onChangeText={setRent}
              placeholder="1450"
              keyboardType="number-pad"
              style={[styles.input, styles.rowInput]}
              returnKeyType="next"
            />
          </View>

          <View style={styles.row}>
            <TextInput
              testID="inputCashInvested"
              mode="outlined"
              label="Total Cash Invested"
              value={cashInvested}
              onChangeText={setCashInvested}
              placeholder="50000"
              keyboardType="number-pad"
              style={[styles.input, styles.rowInput]}
              returnKeyType="next"
            />
            <TextInput
              testID="inputPurchasePrice"
              mode="outlined"
              label="Purchase Price"
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="250000"
              keyboardType="number-pad"
              style={[styles.input, styles.rowInput]}
              returnKeyType="done"
            />
          </View>

          <View style={styles.imageSection}>
            {imageUri ? (
              <Image
                testID="propertyImagePreview"
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.imagePlaceholder} testID="propertyImagePlaceholder">
                <Text variant="bodyMedium" style={styles.imagePlaceholderText}>No photo selected</Text>
              </View>
            )}
            <Button
              testID="selectPhotoBtn"
              mode="outlined"
              onPress={async () => {
                try {
                  setError(null);
                  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (!perm.granted) {
                    setError('Permission to access photos was denied. Please enable it in settings.');
                    return;
                  }
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 1,
                    allowsMultipleSelection: false,
                    base64: false,
                    exif: false,
                  });
                  if (!result.canceled && result.assets && result.assets.length > 0) {
                    const picked = result.assets[0];
                    if (picked.uri) {
                      setImageUri(picked.uri);
                    }
                  }
                } catch (e) {
                  console.error('[AddPropertyModal] Image pick error', e);
                  setError('Unable to select image. Please try again.');
                }
              }}
              style={styles.selectPhotoBtn}
            >
              <Text>Select Photo</Text>
            </Button>
          </View>

          {error && (
            <HelperText type="error" visible={true} testID="addPropertyError">
              <Text>{error}</Text>
            </HelperText>
          )}

          <Button
            testID="savePropertyBtn"
            mode="contained"
            onPress={onSave}
            disabled={isSaveDisabled}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
            textColor={theme.colors.onPrimary}
          >
            <Text>{isEdit ? 'Save Changes' : 'Save Property'}</Text>
          </Button>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f4f6f8',
  },
  title: {
    fontWeight: '600' as const,
    color: '#2c3e50',
  },
  closeButton: {
    margin: 0,
  },
  flex: { flex: 1 },
  formContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  input: {
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowInput: {
    flex: 1,
  },
  segmented: {
    marginTop: 4,
    marginBottom: 4,
  },
  stateInput: {
    width: 100,
  },
  zipInput: {
    flex: 1,
  },
  imageSection: {
    marginTop: 8,
    gap: 8,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#e8ecf1',
  },
  imagePlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#e8ecf1',
  },
  imagePlaceholderText: {
    color: '#6b7280',
  },
  selectPhotoBtn: {
    alignSelf: 'flex-start',
  },
  saveButton: {
    marginTop: 12,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
});