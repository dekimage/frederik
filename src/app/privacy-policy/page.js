"use client";
import React from "react";

const PrivacyPolicy = () => {
  return (
    <div
      className="bg-black text-white min-h-screen py-32 px-8"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto mt-8">
        <h1 className="text-4xl font-bold text-center mb-12">PRIVACY POLICY</h1>

        <div className="space-y-8 text-lg leading-relaxed">
          {/* Introduction */}
          <section>
            <p>
              At https://www.wolfskinphotography.com we value your privacy. In
              this privacy policy, we explain what information we collect, why
              we collect it and how we protect your information.
            </p>
          </section>

          {/* What Data Do We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              WHAT DATA DO WE COLLECT?
            </h2>
            <ul className="space-y-2">
              <li>
                - Personal data: such as your name, email address, phone number
                and address, when you place an order or contact us;
              </li>
              <li>
                - Usage data: such as your IP address, browser information and
                how you use our website (via cookies).
              </li>
            </ul>
          </section>

          {/* Why Do We Collect This Data */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              WHY DO WE COLLECT THIS DATA?
            </h2>
            <ul className="space-y-2">
              <li>- To process and deliver your orders;</li>
              <li>- To answer your questions or requests;</li>
              <li>- To improve the website and make it more user friendly;</li>
              <li>
                - To keep you informed about offers or updates (only with your
                permission).
              </li>
            </ul>
          </section>

          {/* Do We Share Your Data */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              DO WE SHARE YOUR DATA?
            </h2>
            <p className="mb-4">
              We never share your data with third parties unless it is necessary
              to:
            </p>
            <ul className="space-y-2">
              <li>
                - Process an order (for example, with a delivery service);
              </li>
              <li>- To comply with legal obligations.</li>
            </ul>
          </section>

          {/* How Do We Protect Your Data */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              HOW DO WE PROTECT YOUR DATA?
            </h2>
            <p>
              We take appropriate technical and organizational measures to
              protect your data from loss, theft or unauthorized access.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">YOUR RIGHTS</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="space-y-2">
              <li>- Review, correct or delete your data;</li>
              <li>- Revoke your consent to the use of your data.</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">COOKIES:</h2>
            <p>
              Our website uses cookies to improve ease of use. You can refuse
              cookies through your browser settings. Read more about it in our
              cookies policy at https://www.wolfskinphotography.com/cookies.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">CONTACT</h2>
            <p>
              For questions about this privacy policy or your information,
              please contact us at contact@wolfskinphotography.com.
            </p>
          </section>

          {/* Last Updated */}
          <section className="pt-8 border-t border-gray-700">
            <p className="text-gray-400">Last updated: 01.02.2025</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
