"use client";

import { useEffect, useState } from "react";

export const ClientOnly = ({ children }) => {
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  });

  return clientReady ? <>children</> : null;
};

// usage =>? <ClientOnly>Client only content</ClientOnly>
