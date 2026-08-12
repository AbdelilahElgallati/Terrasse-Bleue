import { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api/client';
import { useRestaurantSettings } from '@/api/restaurant';
import { Button } from '@/components/Button';
import { InlineNotice } from '@/components/InlineNotice';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/StateViews';
import { CheckoutSummary } from '@/features/checkout/components/CheckoutSummary';
import { DeliveryAddressForm } from '@/features/checkout/components/DeliveryAddressForm';
import { FulfillmentSelector } from '@/features/checkout/components/FulfillmentSelector';
import { PaymentMethodSelector } from '@/features/checkout/components/PaymentMethodSelector';
import { checkoutDeliveryFee, checkoutTotal } from '@/features/checkout/pricing';
import { EMPTY_DELIVERY_ADDRESS, type CheckoutFulfillment, type CheckoutPayment, type DeliveryAddressDraft, type DeliveryAddressErrors } from '@/features/checkout/types';
import { hasAddressErrors, sanitizeDeliveryAddress, validateDeliveryAddress } from '@/features/checkout/validation';
import { useAuthStore } from '@/store/auth-store';
import { selectCartTotal, useCartStore } from '@/store/cart-store';
import { useOrderStore } from '@/store/order-store';
import { colors, radius } from '@/theme/colors';
import { mapOrder, type ApiOrder, type ApiOrderType } from '@/types/menu';
import { formatPrice } from '@/utils/currency';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore(selectCartTotal);
  const clearCart = useCartStore((state) => state.clear);
  const setCurrentOrder = useOrderStore((state) => state.setCurrentOrder);
  const user = useAuthStore((state) => state.user);
  const [fulfillment, setFulfillment] = useState<CheckoutFulfillment>('DINE_IN');
  const [payment, setPayment] = useState<CheckoutPayment>('CASH');
  const [address, setAddress] = useState<DeliveryAddressDraft>(() => ({ ...EMPTY_DELIVERY_ADDRESS, recipientName: user?.name ?? '', phone: user?.phone ?? '' }));
  const [addressErrors, setAddressErrors] = useState<DeliveryAddressErrors>({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string; action?: boolean }>();
  const restaurant = useRestaurantSettings();
  const unavailable = restaurant.data && (!restaurant.data.isOpen || !restaurant.data.acceptsOrders);
  const deliveryFee = checkoutDeliveryFee(fulfillment);
  const total = checkoutTotal(subtotal, fulfillment);

  if (!items.length) return <View style={[styles.page, { paddingTop: insets.top }]}><ScreenHeader title="Validation" /><EmptyState title="Rien à confirmer" description="Ajoutez un produit avant de passer votre commande." actionLabel="Voir le menu" onAction={() => router.replace('/menu')} /></View>;

  function selectFulfillment(value: CheckoutFulfillment) {
    setFulfillment(value);
    setAddressErrors({});
    setNotice(undefined);
  }

  async function confirm() {
    if (unavailable) {
      setNotice({ title: restaurant.data?.isOpen ? 'Commandes temporairement en pause' : 'Restaurant actuellement fermé', message: `Votre panier est conservé. Temps de préparation habituel : ${restaurant.data?.estimatedPrepMinutes ?? 25} min.` });
      return;
    }
    if (!user) {
      setNotice({ title: 'Connexion requise', message: 'Connectez-vous avant de confirmer cette commande afin de pouvoir la suivre.', action: true });
      return;
    }
    const sanitizedAddress = sanitizeDeliveryAddress(address);
    if (fulfillment === 'DELIVERY') {
      const errors = validateDeliveryAddress(sanitizedAddress);
      setAddressErrors(errors);
      if (hasAddressErrors(errors)) {
        setNotice({ title: 'Adresse à compléter', message: 'Vérifiez les informations nécessaires à la livraison.' });
        return;
      }
    }
    setNotice(undefined);
    setSubmitting(true);
    try {
      if (payment === 'ONLINE') await new Promise((resolve) => setTimeout(resolve, 700));
      const response = await api.post<ApiOrder>('/orders', { items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity, selectedOptions: item.selectedOptions })), orderType: fulfillment as ApiOrderType, paymentMethod: payment, deliveryAddress: fulfillment === 'DELIVERY' ? sanitizedAddress : undefined, notes });
      setCurrentOrder(mapOrder(response));
      clearCart();
      router.replace('/confirmation');
    } catch (error) {
      setNotice({ title: 'Commande non envoyée', message: error instanceof Error ? error.message : 'Vérifiez vos choix et votre connexion, puis réessayez.' });
    } finally {
      setSubmitting(false);
    }
  }

  const buttonLabel = payment === 'ONLINE' ? `Payer en ligne · ${formatPrice(total)}` : `Confirmer · ${formatPrice(total)}`;

  return <View style={[styles.page, { paddingTop: insets.top }]}>
    <ScreenHeader title="Finaliser la commande" />
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Votre sélection</Text>
        <View style={styles.card}>{items.map((item) => <View key={item.id} style={styles.itemRow}><Text style={styles.itemQuantity}>{item.quantity}×</Text><Text numberOfLines={1} style={styles.itemName}>{item.product.name}</Text><Text style={styles.itemPrice}>{formatPrice(item.unitPrice * item.quantity)}</Text></View>)}</View>
        <Text style={styles.sectionTitle}>Comment souhaitez-vous commander ?</Text>
        <FulfillmentSelector value={fulfillment} onChange={selectFulfillment} />
        {fulfillment === 'DELIVERY' ? <View style={styles.sectionGap}><DeliveryAddressForm value={address} errors={addressErrors} onChange={(value) => { setAddress(value); setAddressErrors({}); }} /></View> : null}
        <Text style={styles.sectionTitle}>Mode de paiement</Text>
        <PaymentMethodSelector value={payment} fulfillment={fulfillment} onChange={(value) => { setPayment(value); setNotice(undefined); }} />
        <Text style={styles.sectionTitle}>Une précision ?</Text>
        <TextInput accessibilityLabel="Notes pour la cuisine" value={notes} onChangeText={setNotes} placeholder="Ex. sans piment, allergie…" placeholderTextColor={colors.muted} multiline maxLength={240} style={styles.notes} />
        <CheckoutSummary subtotal={subtotal} deliveryFee={deliveryFee} total={total} demo={false} />
      </ScrollView>
    </KeyboardAvoidingView>
    <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {unavailable && !notice ? <InlineNotice kind="warning" title={restaurant.data?.isOpen ? 'Commandes en pause' : 'Restaurant fermé'} message="Vous pouvez garder votre panier et revenir lorsque le service reprendra." /> : null}
      {notice ? <InlineNotice title={notice.title} message={notice.message} actionLabel={notice.action ? 'Se connecter' : undefined} onAction={notice.action ? () => router.push('/auth') : undefined} /> : null}
      <Button label={unavailable ? 'Commande indisponible' : buttonLabel} disabled={Boolean(unavailable)} loading={submitting} onPress={() => void confirm()} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.warmIvory }, keyboard: { flex: 1 }, content: { padding: 18, paddingBottom: 30 }, sectionTitle: { marginTop: 18, marginBottom: 10, color: colors.primaryBlue, fontSize: 18, fontWeight: '800' }, sectionGap: { marginTop: 12 },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, gap: 12 }, itemRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, itemQuantity: { color: colors.terracotta, fontWeight: '800' }, itemName: { flex: 1, color: colors.charcoal }, itemPrice: { color: colors.charcoal, fontWeight: '700' },
  notes: { minHeight: 104, padding: 14, textAlignVertical: 'top', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.charcoal, fontSize: 15 },
  bottom: { padding: 14, paddingHorizontal: 18, gap: 10, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
});
