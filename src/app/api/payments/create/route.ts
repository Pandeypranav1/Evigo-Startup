import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server';
import { createAdminClient } from '@/lib/supabase';
import { PaymentService } from '@/lib/payment/service';
import { PaymentMethod } from '@/lib/payment/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      amount,
      currency = 'INR',
      payment_method = 'upi',
      customer_name,
      customer_email,
      customer_phone,
      booking_id,
      combo_booking_id,
      metadata,
    } = body;

    // Validate required fields
    if (!amount || !customer_name || !customer_phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: amount, customer_name, customer_phone' },
        { status: 400 }
      );
    }

    // Validate payment method
    const validMethods: PaymentMethod[] = ['upi', 'card', 'netbanking', 'wallet', 'emi'];
    if (!validMethods.includes(payment_method)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Validate that either booking_id or combo_booking_id is provided
    if (!booking_id && !combo_booking_id) {
      return NextResponse.json(
        { success: false, error: 'Either booking_id or combo_booking_id is required' },
        { status: 400 }
      );
    }
    if (booking_id && combo_booking_id) {
      return NextResponse.json(
        { success: false, error: 'Provide only one of booking_id or combo_booking_id' },
        { status: 400 }
      );
    }

    // Verify the referenced booking belongs to the authenticated user and
    // that the requested amount matches the server-side booking amount.
    // Payment amounts must never be trusted from the client.
    const supabase = createAdminClient();
    let expectedAmount: number | null = null;

    if (booking_id) {
      const { data: booking, error: bookingLookupError } = await supabase
        .from('bookings')
        .select('client_id, amount, payment_status')
        .eq('id', booking_id)
        .maybeSingle();

      if (bookingLookupError) {
        console.error('[POST /api/payments/create] Booking lookup failed:', bookingLookupError);
        return NextResponse.json({ success: false, error: 'Unable to verify booking' }, { status: 500 });
      }
      if (!booking || booking.client_id !== user.id) {
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      }
      if (String(booking.payment_status || '').toLowerCase() === 'paid') {
        return NextResponse.json({ success: false, error: 'Booking already paid' }, { status: 400 });
      }

      const value = Number(booking.amount);
      if (Number.isFinite(value) && value > 0) {
        expectedAmount = value;
      }
    } else {
      const { data: comboBooking, error: comboLookupError } = await supabase
        .from('combo_bookings')
        .select('user_id, total_amount, payment_status')
        .eq('id', combo_booking_id)
        .maybeSingle();

      if (comboLookupError) {
        console.error('[POST /api/payments/create] Combo booking lookup failed:', comboLookupError);
        return NextResponse.json({ success: false, error: 'Unable to verify combo booking' }, { status: 500 });
      }
      if (!comboBooking || comboBooking.user_id !== user.id) {
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      }
      if (String(comboBooking.payment_status || '').toLowerCase() === 'paid') {
        return NextResponse.json({ success: false, error: 'Booking already paid' }, { status: 400 });
      }

      const value = Number(comboBooking.total_amount);
      if (Number.isFinite(value) && value > 0) {
        expectedAmount = value;
      }
    }

    if (expectedAmount === null) {
      return NextResponse.json(
        { success: false, error: 'Booking price is not confirmed yet. Please wait until the booking amount is available before making payment.' },
        { status: 409 }
      );
    }

    if (Math.abs(Number(amount) - expectedAmount) > 0.01) {
      return NextResponse.json(
        { success: false, error: 'Payment amount does not match the booking amount' },
        { status: 400 }
      );
    }

    // Create payment
    const result = await PaymentService.createPayment({
      user_id: user.id,
      amount: Number(amount),
      currency,
      payment_method,
      customer_name,
      customer_email,
      customer_phone,
      booking_id,
      combo_booking_id,
      metadata,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        payment_id: result.payment_id,
        checkout_data: result.checkout_data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/payments/create] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment creation failed' },
      { status: 500 }
    );
  }
}
