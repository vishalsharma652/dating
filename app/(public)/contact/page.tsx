import type { Metadata } from 'next';
import { ContactContent } from '@/components/contact-content';

export const metadata: Metadata = {
  title: 'Contact Us — Support & Inquiries',
  description:
    'Get in touch with the Saathika support team for help, questions, or feedback. We are here to assist you 7 days a week.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Saathika — We Are Here to Help',
    description:
      'Have questions or feedback? Contact the Saathika support team.',
    url: 'https://saathika.app/contact',
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
