import { redirect } from 'next/navigation';

export default function AuthVerifyOtpRedirect() {
  redirect('/verify-otp');
}
