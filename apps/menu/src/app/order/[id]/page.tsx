import { redirect } from 'next/navigation';

export default function OrderPage() {
  redirect('/menu?notice=use-mobile-app');
}

