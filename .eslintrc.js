module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
  },
  plugins: ["@typescript-eslint", "simple-import-sort", "prettier"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  rules: {
    eqeqeq: "error",
    yoda: "error",
    curly: "error",
    "prefer-template": "error",
    "max-lines-per-function": ["warn", 50],
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-var-requires": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

    "no-async-promise-executor": "warn",

    "prettier/prettier": "error",

    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",

    "require-jsdoc": [
      "warn",
      {
        require: {
          ClassDeclaration: true,
          FunctionDeclaration: true,
          // MethodDefinition: true, // TODO:
        },
      },
    ],
  },
};
