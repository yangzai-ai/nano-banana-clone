"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, CreditCard, Calendar, Zap } from "lucide-react";

interface Subscription {
  id: string;
  planName: string;
  planType: string;
  status: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  amount: number;
  currency: string;
  createdAt: string;
}

export function SubscriptionInfo() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscription");
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSubscription(data.subscription);
      }
    } catch (err) {
      setError("Failed to fetch subscription");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <p className="text-red-800">{error}</p>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="text-center">
          <p className="text-gray-700 mb-4">You don't have an active subscription</p>
          <Button
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            onClick={() => (window.location.href = "/pricing")}
          >
            View Plans
          </Button>
        </div>
      </Card>
    );
  }

  const planDisplayName = subscription.planName.charAt(0).toUpperCase() + subscription.planName.slice(1);
  const billingCycle = subscription.planType === "annual" ? "Yearly" : "Monthly";
  const creditsPercentage = (subscription.creditsRemaining / subscription.creditsTotal) * 100;
  const periodEnd = new Date(subscription.currentPeriodEnd);
  const daysUntilRenewal = Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Main Subscription Card */}
      <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{planDisplayName} Plan</h2>
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
            <p className="text-gray-600">{billingCycle} Billing</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-orange-600">
              ${subscription.amount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              /{subscription.planType === "annual" ? "year" : "month"}
            </p>
          </div>
        </div>

        {/* Credits Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-gray-900">Credits</span>
            </div>
            <span className="text-lg font-bold text-orange-600">
              {subscription.creditsRemaining.toLocaleString()} / {subscription.creditsTotal.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full transition-all duration-300"
              style={{ width: `${creditsPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {subscription.creditsUsed.toLocaleString()} credits used
          </p>
        </div>

        {/* Billing Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Next Billing Date</p>
              <p className="text-sm text-gray-600">
                {periodEnd.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {daysUntilRenewal} {daysUntilRenewal === 1 ? "day" : "days"} remaining
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CreditCard className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Subscription ID</p>
              <p className="text-sm text-gray-600 font-mono truncate">
                {subscription.id.slice(0, 16)}...
              </p>
            </div>
          </div>
        </div>

        {/* Cancel Warning */}
        {subscription.cancelAtPeriodEnd && (
          <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">Subscription Ending</p>
                <p className="text-sm text-yellow-800">
                  Your subscription will end on{" "}
                  {periodEnd.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
          onClick={() => (window.location.href = "/pricing")}
        >
          Upgrade Plan
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => alert("Manage subscription feature coming soon")}
        >
          Manage Subscription
        </Button>
      </div>
    </div>
  );
}
