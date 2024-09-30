"use client";
import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="bg-black text-white min-h-screen py-32 px-8">
      <h1 className="text-4xl font-bold text-center mb-8">Privacy Policy</h1>

      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p className="text-lg">
            We respect your privacy and are committed to protecting your
            personal information. This privacy policy explains how we collect,
            use, disclose, and safeguard your information when you visit our
            website.
          </p>
        </section>

        {/* Information Collection */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Information We Collect
          </h2>
          <p className="text-lg">
            We may collect information about you in a variety of ways. The
            information we may collect on the website includes:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-4 text-lg">
            <li>Personal Data: Name, email address, phone number, etc.</li>
            <li>
              Financial Data: Payment details for processing transactions.
            </li>
            <li>
              Usage Data: IP address, browser type, and interaction with the
              website.
            </li>
          </ul>
        </section>

        {/* Use of Information */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Use of Your Information
          </h2>
          <p className="text-lg">
            We use the information we collect in various ways, including to:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-4 text-lg">
            <li>Provide, operate, and maintain our website.</li>
            <li>Process and manage transactions.</li>
            <li>Improve and personalize user experience.</li>
          </ul>
        </section>

        {/* Sharing Information */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Sharing Your Information
          </h2>
          <p className="text-lg">
            We may share information with third parties in specific situations,
            such as:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-4 text-lg">
            <li>With vendors for payment processing.</li>
            <li>To comply with legal obligations.</li>
            <li>To protect the rights and safety of others.</li>
          </ul>
        </section>

        {/* Contact Us */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-lg">
            If you have questions or comments about this Privacy Policy, please
            contact us at: info@example.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
