import next from "eslint-config-next/core-web-vitals";

export default [
  ...next,
  { ignores: [".next/**", "node_modules/**"] },
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
      "@next/next/no-img-element": "off",
    },
  },
];
