"use client";
import React from "react";

const CookiesPolicy = () => {
  return (
    <div
      className="bg-black text-white min-h-screen py-32 px-8"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto mt-8">
        <h1 className="text-4xl font-bold text-center mb-12">COOKIES</h1>

        <div className="space-y-8 text-lg leading-relaxed">
          {/* Introduction */}
          <section>
            <p>
              At https://www.wolfskinphotography.com, we use cookies to improve
              your experience. In this policy, we explain what cookies are, what
              cookies we use and how you can manage them.
            </p>
          </section>

          {/* What Are Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">WHAT ARE COOKIES?</h2>
            <p>
              Cookies are small text files that are stored on your device when
              you visit our website. They help us to make the website work
              better and to understand how visitors use the site.
            </p>
          </section>

          {/* What Cookies Do We Use */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              WHAT COOKIES DO WE USE?
            </h2>
            <p className="mb-4">We use the following types of cookies:</p>
            <ul className="space-y-3">
              <li>
                - Necessary cookies: these cookies are essential for the website
                to function properly, for example to place an order or log in;
              </li>
              <li>
                - Functional cookies: these cookies remember your preferences,
                such as your language choice or shopping basket, to make the
                website more user-friendly;
              </li>
              <li>
                - Analytical cookies: we use analytical cookies to understand
                how visitors use our website. This helps us to improve the
                website. For example, we use Google Analytics;
              </li>
              <li>
                - Advertising and tracking cookies: with your permission, we can
                use cookies to tailor advertisements to your interests.
              </li>
            </ul>
          </section>

          {/* How to Manage or Delete Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              HOW TO MANAGE OR DELETE COOKIES?
            </h2>
            <p>
              You can manage or delete cookies through your browser settings.
              Please note that some features of the website may not work
              properly if you disable cookies.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              CHANGES TO THIS POLICY
            </h2>
            <p>
              We may update this cookie policy from time to time. Please check
              this page regularly for updates.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">CONTACT</h2>
            <p>
              Do you have questions about our use of cookies? Please feel free
              to contact us at contact@wolfskinphotography.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiesPolicy;
