module.exports = {
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default)
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 }))
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((styles) => styles)
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  Image: 'Image',
  TextInput: 'TextInput',
  ActivityIndicator: 'ActivityIndicator',
  Alert: {
    alert: jest.fn()
  }
};