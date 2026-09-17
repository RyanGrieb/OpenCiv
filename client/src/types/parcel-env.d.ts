// Parcel statically replaces process.env.NODE_ENV at build time (a plain string
// substitution, not a real Node runtime), even in browser bundles. tsconfig.json
// sets "types": [] to keep Node's ambient globals out of client code, so `process`
// isn't otherwise declared here - this covers just the one field Parcel provides.
declare const process: {
  env: {
    NODE_ENV: "development" | "production";
  };
};
