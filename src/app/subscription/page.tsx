"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SubscriptionInfo } from "@/components/SubscriptionInfo";

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-sm">🍌</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Nano Banana</span>
            </Link>

            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-orange-600 mb-3">
              My Subscription
            </h1>
            <p className="text-lg text-gray-700">
              Manage your subscription and track your credits
            </p>
          </div>

          {/* Subscription Info Component */}
          <SubscriptionInfo />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600">
            © 2025 nanobanana.ai All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
