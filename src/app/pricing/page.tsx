"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Rocket, Crown, LogIn, ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false); // Default to Monthly
  const [quantities, setQuantities] = useState({ basic: 1, pro: 1, max: 1 });
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [currency, setCurrency] = useState("USD");

  const currencySymbols: { [key: string]: string } = {
    USD: "$",
    GBP: "£",
    EUR: "€",
  };

  const plans = [
    {
      id: "basic",
      name: "Basic",
      icon: Zap,
      description: "Perfect for individuals and light users",
      price: {
        monthly: 15.00,
        annual: 12.00,
        annualTotal: 144.00,
        originalMonthly: 15.00,
        originalAnnual: 180.00,
      },
      credits: {
        monthly: "150 credits/month",
        annual: "1800 credits/year"
      },
      images: "75 high-quality images/month",
      features: [
        "75 high-quality images/month",
        "All style templates included",
        "Standard generation speed",
        "Basic customer support",
        "JPG/PNG format downloads",
        "Commercial Use License",
      ],
      cta: "Subscribe Now",
      popular: false,
      // Creem Product IDs - Create separate products for monthly/annual in Creem Dashboard
      productId: {
        monthly: "prod_2zUJFfU5Mc9TT7mSr1OyEo", // Replace with your Creem Product ID for Basic Monthly
        annual: "prod_2zUJFfU5Mc9TT7mSr1OyEo"     // Replace with your Creem Product ID for Basic Annual
      },
    },
    {
      id: "pro",
      name: "Pro",
      icon: Rocket,
      description: "For professional creators and teams",
      price: {
        monthly: 39.00,
        annual: 19.50,
        annualTotal: 234.00,
        originalMonthly: 39.00,
        originalAnnual: 468.00
      },
      credits: {
        monthly: "800 credits/month",
        annual: "9600 credits/year"
      },
      images: "400 high-quality images/month",
      features: [
        "400 high-quality images/month",
        "Support Seedream-4 Model",
        "Support Nanobanana-Pro Model",
        "All style templates included",
        "Priority generation queue",
        "Priority customer support",
        "JPG/PNG/WebP format downloads",
        "Batch generation feature",
        "Image editing tools (Coming in October)",
        "Commercial Use License",
      ],
      cta: "Subscribe Now",
      popular: true,
      productId: {
        monthly: "prod_2zUJFfU5Mc9TT7mSr1OyEo", // Your existing Product ID (use for Pro Monthly)
        annual: "prod_2zUJFfU5Mc9TT7mSr1OyEo"  // Create another product for Pro Annual
      },
    },
    {
      id: "max",
      name: "Max",
      icon: Crown,
      description: "Designed for large enterprises and professional studios",
      price: {
        monthly: 160.00,
        annual: 80.00,
        annualTotal: 960.00,
        originalMonthly: 160.00,
        originalAnnual: 1920.00
      },
      credits: {
        monthly: "4600 credits/month",
        annual: "55200 credits/year"
      },
      images: "2300 high-quality images/month",
      features: [
        "2300 high-quality images/month",
        "Support Seedream-4 Model",
        "Support Nanobanana-Pro Model",
        "All style templates included",
        "Fastest generation speed",
        "Dedicated account manager",
        "All format downloads",
        "Batch generation feature",
        "Professional editing suite (Coming in October)",
        "Commercial Use License",
      ],
      cta: "Subscribe Now",
      popular: false,
      productId: {
        monthly: "prod_2zUJFfU5Mc9TT7mSr1OyEo", // Replace with your Creem Product ID for Max Monthly
        annual: "prod_2zUJFfU5Mc9TT7mSr1OyEo"    // Replace with your Creem Product ID for Max Annual
      },
    },
  ];

  const faqs = [
    {
      question: "What are credits and how do they work?",
      answer: "2 credits generate 1 high-quality image. Credits are automatically refilled at the start of each billing cycle - monthly for monthly plans, all at once for yearly plans."
    },
    {
      question: "Can I change my plan anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the next billing cycle."
    },
    {
      question: "Do unused credits roll over?",
      answer: "Monthly plan credits do not roll over to the next month. Yearly plan credits are valid for the entire subscription period. We recommend choosing a plan based on your actual usage needs."
    },
    {
      question: "What payment methods are supported?",
      answer: "We support credit cards, debit cards, Apple, WeChat Pay, and various other payment methods. All payments are processed through secure third-party payment platforms."
    }
  ];

  const handleQuantityChange = (planId: string, value: number) => {
    setQuantities(prev => ({ ...prev, [planId]: value }));
  };

  const handleSubscribe = async (productId: { monthly: string; annual: string } | null, planType: string, quantity: number) => {
    if (!productId) {
      window.location.href = "/";
      return;
    }

    try {
      const selectedProductId = isAnnual ? productId.annual : productId.monthly;

      const response = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProductId,
          planType: isAnnual ? 'annual' : 'monthly',
          units: quantity, // Pass quantity to multiply the base price
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.error) {
        alert("Failed to create checkout: " + data.error);
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Failed to create checkout");
    }
  };

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

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6 text-sm">
              <Link href="/" className="text-gray-700 hover:text-orange-600">Image Editor</Link>
              <Link href="/#showcase" className="text-gray-700 hover:text-orange-600">Showcase</Link>
              <Link href="#" className="text-gray-700 hover:text-orange-600">Toolbox</Link>
              <Link href="/pricing" className="text-gray-900 font-semibold">Pricing</Link>
              <Link href="#" className="text-gray-700 hover:text-orange-600">API</Link>
            </nav>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 hover:from-yellow-600 hover:to-orange-600"
              >
                🚀 Launch Now
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                💰 0 credits
              </Button>
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Disclaimer Banner */}
      <div className="bg-blue-50 border-b border-blue-100 py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            NanoBanana is an independent product and is not affiliated with Google or other AI model providers. We provide access to AI models through our custom interface.
          </p>
        </div>
      </div>

      {/* Limited Time Banner */}
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium text-orange-800">
            ⏰ Limited Time: Save 20% with Annual Billing
          </p>
        </div>
      </div>

      {/* Pricing Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-orange-600 mb-3">
              Choose Your Perfect Plan
            </h1>
            <p className="text-lg text-gray-700">
              Unlimited creativity starts here
            </p>
          </div>

          {/* Currency Selector */}
          <div className="flex justify-center mb-6">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[200px] border-gray-300">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">💵 $ USD - US Dollar</SelectItem>
                <SelectItem value="GBP">💷 £ GBP - British Pound</SelectItem>
                <SelectItem value="EUR">💶 € EUR - Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <div className="flex justify-center space-x-4 mb-6">
            <Button
              onClick={() => setActiveTab("subscriptions")}
              className={`rounded-full ${
                activeTab === "subscriptions"
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              📝 Subscriptions
            </Button>
            <Button
              onClick={() => setActiveTab("teams")}
              className={`rounded-full ${
                activeTab === "teams"
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              👥 Team Plans
            </Button>
            <Button
              onClick={() => setActiveTab("credits")}
              className={`rounded-full ${
                activeTab === "credits"
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              🎁 Credit Packs
            </Button>
          </div>

          {/* Monthly/Yearly Toggle */}
          <div className="flex justify-center items-center space-x-4 mb-10">
            <Button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full font-medium ${
                !isAnnual
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              Monthly
            </Button>
            <Button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full font-medium flex items-center space-x-2 ${
                isAnnual
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <span>Yearly</span>
              <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full border-0">
                🔥 LIMITED TIME: Save 50%
              </Badge>
            </Button>
          </div>

          {/* Pricing Cards */}
          {activeTab === "subscriptions" && (
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const quantity = quantities[plan.id as keyof typeof quantities];
                const displayPrice = isAnnual ? plan.price.annual : plan.price.monthly;
                const totalPrice = displayPrice * quantity;

                return (
                  <Card
                    key={plan.id}
                    className={`relative p-6 ${
                      plan.popular
                        ? 'border-2 border-orange-300 bg-gradient-to-b from-yellow-50 to-orange-50 shadow-xl'
                        : 'border border-gray-200 bg-white'
                    }`}
                  >
                    {plan.popular && (
                      <Badge className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 rounded-full border-0">
                        ⭐ Most Popular
                      </Badge>
                    )}

                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-xl mb-4 ${
                      plan.id === "basic"
                        ? 'bg-gradient-to-br from-yellow-300 to-yellow-400'
                        : plan.id === "pro"
                        ? 'bg-gradient-to-br from-orange-400 to-orange-500'
                        : 'bg-gradient-to-br from-yellow-500 to-orange-600'
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Plan Name and Description */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

                    {/* Quantity Adjustment */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">🎁 Quantity Adjustment</span>
                        <span className="text-lg font-bold">{quantity}x</span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(plan.id, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #f59e0b ${(quantity - 1) * 11.11}%, #e5e7eb ${(quantity - 1) * 11.11}%)`
                          }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-md pointer-events-none"
                          style={{ left: `calc(${(quantity - 1) * 11.11}% - 8px)` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1x</span>
                        <span>10x (up to 60% bonus)</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-orange-600">
                          {currencySymbols[currency]}{totalPrice.toFixed(2)}
                        </span>
                        <span className="text-gray-600">/mo</span>
                      </div>
                      {isAnnual && (
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          <span className="text-gray-500 line-through text-sm">
                            {currencySymbols[currency]}{plan.price.originalAnnual.toFixed(2)}
                          </span>
                          <span className="text-green-600 font-medium text-sm">
                            {currencySymbols[currency]}{plan.price.annualTotal.toFixed(2)}/year
                          </span>
                          <Badge className="bg-red-500 text-white text-xs px-2 rounded-full border-0">
                            🔥 SAVE 50%
                          </Badge>
                        </div>
                      )}
                      <div className="mt-3">
                        <Badge className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                          {isAnnual ? plan.credits.annual : plan.credits.monthly}
                        </Badge>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className={`w-full mb-2 font-medium ${
                        plan.popular
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                          : 'bg-yellow-50 hover:bg-yellow-100 text-orange-700 border border-orange-200'
                      }`}
                      onClick={() => handleSubscribe(plan.productId, plan.id, quantity)}
                    >
                      {plan.cta}
                    </Button>

                    {/* Features */}
                    <div className="space-y-3 mt-6">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className={`text-sm ${
                            feature.includes('Commercial Use License')
                              ? 'text-orange-600 font-semibold'
                              : 'text-gray-700'
                          }`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === "teams" && (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">Team Plans coming soon...</p>
            </div>
          )}

          {activeTab === "credits" && (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">Credit Packs coming soon...</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-center text-sm text-gray-600 mb-12">
            Nanobanana.ai is an independent product and is not affiliate with Google or any of its brands.
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-orange-600 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="p-6 bg-white border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-700 mb-4">Have more questions? We're here to help</p>
              <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600">
            © 2025 nanobanana.ai All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
