export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-6">Last updated: January 4, 2026</p>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">1. Information We Collect</h2>
              <p>Voice Scheduler collects the following information when you use our service:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Your name (provided verbally during scheduling)</li>
                <li>Meeting details (date, time, title)</li>
                <li>Google Calendar access (with your permission) to create events</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">2. How We Use Your Information</h2>
              <p>We use the information solely to:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Process your voice commands to schedule meetings</li>
                <li>Create calendar events in your Google Calendar</li>
                <li>Provide voice responses during the scheduling process</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">3. Data Storage</h2>
              <p>
                Voice Scheduler does not permanently store your personal data. Voice recordings are 
                processed in real-time and not saved. Calendar access tokens are stored only in your 
                browser session and are cleared when you close the browser.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">4. Third-Party Services</h2>
              <p>We use the following third-party services:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li><strong>Google Calendar API:</strong> To create events in your calendar</li>
                <li><strong>Google Gemini AI:</strong> To process natural language for scheduling</li>
                <li><strong>Web Speech API:</strong> To convert your voice to text (browser-based)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. All communications 
                are encrypted using HTTPS. We do not sell, trade, or share your personal information 
                with third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Revoke Google Calendar access at any time via your Google Account settings</li>
                <li>Request deletion of any data we may have</li>
                <li>Opt out of using our service at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">7. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at: 
                <a href="mailto:chittaedu18@gmail.com" className="text-blue-600 hover:underline ml-1">
                  chittaedu18@gmail.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-2">8. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date.
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
