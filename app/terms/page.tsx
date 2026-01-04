export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-6">Last updated: January 4, 2026</p>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Voice Scheduler, you accept and agree to be bound by these 
                Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">2. Description of Service</h2>
              <p>
                Voice Scheduler is a voice-activated scheduling assistant that helps you create 
                calendar events using natural language. The service integrates with Google Calendar 
                to create events on your behalf.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">3. User Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Provide accurate information when scheduling events</li>
                <li>Use the service only for lawful purposes</li>
                <li>Not attempt to interfere with or disrupt the service</li>
                <li>Keep your Google account credentials secure</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">4. Google Calendar Access</h2>
              <p>
                By connecting your Google Calendar, you authorize Voice Scheduler to create 
                calendar events on your behalf. You can revoke this access at any time through 
                your Google Account settings at{" "}
                <a 
                  href="https://myaccount.google.com/permissions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  myaccount.google.com/permissions
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">5. Disclaimer of Warranties</h2>
              <p>
                Voice Scheduler is provided "as is" without warranties of any kind. We do not 
                guarantee that the service will be uninterrupted, error-free, or that voice 
                recognition will be 100% accurate.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">6. Limitation of Liability</h2>
              <p>
                Voice Scheduler shall not be liable for any indirect, incidental, special, or 
                consequential damages arising from your use of the service, including but not 
                limited to missed appointments or incorrect scheduling.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">7. Modifications to Service</h2>
              <p>
                We reserve the right to modify, suspend, or discontinue the service at any time 
                without prior notice. We may also update these Terms of Service from time to time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">8. Contact</h2>
              <p>
                For questions about these Terms of Service, please contact us at:{" "}
                <a href="mailto:chittaedu18@gmail.com" className="text-blue-600 hover:underline">
                  chittaedu18@gmail.com
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Voice Scheduler
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
