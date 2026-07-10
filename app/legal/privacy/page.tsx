import { Card } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Card>
        <div className="p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                Ember ("we" or "us" or "our") operates the Ember website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Information Collection and Use</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                We collect several different types of information for various purposes to provide and improve our Service to you.
              </p>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">Types of Data Collected:</h3>
              <ul className="list-disc pl-6 text-zinc-700 dark:text-zinc-300 space-y-2">
                <li><strong>Personal Data:</strong> Email address, name, phone number, age, location, profile photos</li>
                <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, time and date of visits</li>
                <li><strong>KYC Data:</strong> Identity verification documents, age verification, mobile verification</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Use of Data</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                Ember uses the collected data for various purposes:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 dark:text-zinc-300 space-y-2">
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service</li>
                <li>To provide customer care and support</li>
                <li>To gather analysis or valuable information so we can improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Security of Data</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 dark:text-zinc-300 space-y-2">
                <li>Email: privacy@ember.app</li>
                <li>Address: Ember Inc., Mumbai, India</li>
              </ul>
            </section>
          </div>

          <div className="mt-12 p-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Last updated: July 3, 2026
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
