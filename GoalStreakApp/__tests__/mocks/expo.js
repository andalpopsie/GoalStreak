module.exports = {
  Constants: {
    expoConfig: {},
    platform: { ios: {}, android: {} }
  },
  Font: {
    loadAsync: jest.fn(),
    isLoaded: jest.fn(() => true)
  },
  Haptics: {
    impactAsync: jest.fn()
  }
};