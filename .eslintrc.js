module.exports = {
  "extends": "airbnb",
  "parser": "babel-eslint",
  "env": {
    "browser": true,
    "node": true,
    "es6": true,
  },
  "rules": {
    "no-undef": "off",
    "no-underscore-dangle": "off",
    "prefer-arrow-callback": ["error", { "allowNamedFunctions": true }],
    "no-unused-expressions": ["error", {
      "allowShortCircuit": true,
      "allowTernary": true,
      "allowTaggedTemplates": true
    }],
    "quotes": ["error", "single", {
       "avoidEscape": true,
       "allowTemplateLiterals": true
     }],
    "import/no-extraneous-dependencies": "off",
    "import/extensions": "off",
    "import/no-unresolved": "off",
    "no-param-reassign": "off"
  },
};
