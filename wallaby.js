module.exports = (wallaby) => {
  return {
    files: [
      'src/*.ts'
    ],

    tests: [
      'test/unit/*.ts'
    ],

    env: {
      type: 'node'
    },

    testFramework: 'mocha',

    debug: false
  };
};
