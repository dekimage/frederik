"use client";
import React from "react";

const CopyrightStatement = () => {
  return (
    <div
      className="bg-black text-white min-h-screen py-32 px-8"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto mt-8">
        <h1 className="text-4xl font-bold text-center mb-12">
          COPYRIGHT STATEMENT
        </h1>

        <div className="space-y-8 text-lg leading-relaxed">
          {/* Introduction */}
          <section>
            <p>
              The entire contents of this website, including photographs, text,
              graphics, logos and images, are the property of WOLFSKIN
              Photography™ and protected by international intellectual property
              laws.
            </p>
          </section>

          {/* Copyright Infringement */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              COPYRIGHT INFRINGEMENT
            </h2>
            <p>
              Unauthorized use, reproduction or distribution of our copyrighted
              material is strictly prohibited. We take copyright infringement
              extremely seriously and will take appropriate legal action to
              protect our rights.
            </p>
          </section>

          {/* Usage Permission */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">USAGE PERMISSION</h2>
            <p>
              If you wish to use content from this website, please contact us at
              contact@wolfskinphotography.com to request permission. Proper
              attribution and a link back to our website are required if
              permission is granted.
            </p>
          </section>

          {/* Notification of Infringement */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              NOTIFICATION OF INFRINGEMENT
            </h2>
            <p className="mb-4">
              If you believe your copyrighted work is being used on this website
              without permission, please contact us at
              contact@wolfskinphotography.com with the following information:
            </p>
            <ul className="space-y-2">
              <li>- Your contact details;</li>
              <li>- A description of the copyrighted work;</li>
              <li>
                - A description of where the material is located on our website.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CopyrightStatement;
