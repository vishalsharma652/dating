import { Card } from '@/components/ui/container';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Card>
        <div className="p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>

          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                By accessing and using Ember, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                Permission is granted to temporarily download one copy of the materials (information or software) on Ember for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 text-zinc-700 dark:text-zinc-300 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose, or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on Ember</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                The materials on Ember are provided on an 'as is' basis. Ember makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                In no event shall Ember or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Ember, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Accuracy of Materials</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                The materials appearing on Ember could include technical, typographical, or photographic errors. Ember does not warrant that any of the materials on its website are accurate, complete, or current. Ember may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Links</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                Ember has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Ember of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Modifications</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                Ember may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
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
