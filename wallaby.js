module.exports = (wallaby) => {
  return {
    files: [
      'src/*.ts'
    ],

    tests: [
      'test/*.ts'
    ],

    env: {
      type: 'node'
    },

    testFramework: 'mocha',

    debug: false
  };
};
