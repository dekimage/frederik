"use client";
import React from "react";

const CopyrightStatement = () => {
  return (
    <div className="bg-black text-white min-h-screen py-32 px-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Copyright Statement
      </h1>

      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p className="text-lg">
            All content on this website, including photography, text, graphics,
            logos, and images, is the property of [Your Company Name] and is
            protected by international copyright laws.
          </p>
        </section>

        {/* Copyright Infringement */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Copyright Infringement
          </h2>
          <p className="text-lg">
            Unauthorized use, reproduction, or distribution of our copyrighted
            material is strictly prohibited. We take copyright infringement
            seriously and will take appropriate legal action to protect our
            rights.
          </p>
        </section>

        {/* Permission to Use */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Permission to Use</h2>
          <p className="text-lg">
            If you wish to use any content from this website, please contact us
            at info@example.com to request permission. Proper attribution and a
            link back to our website are required if permission is granted.
          </p>
        </section>

        {/* Reporting Infringement */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Reporting Infringement
          </h2>
          <p className="text-lg">
            If you believe your copyrighted work is being used on this website
            without permission, please contact us with the following
            information:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-4 text-lg">
            <li>Your contact information.</li>
            <li>A description of the copyrighted work.</li>
            <li>
              A description of where the material is located on our website.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default CopyrightStatement;
