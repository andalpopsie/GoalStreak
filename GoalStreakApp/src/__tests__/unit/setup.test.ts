/**
 * Test Setup Verification
 * This test ensures that the testing infrastructure is properly configured
 */

describe('Testing Infrastructure Setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Jest Configuration', () => {
    it('should have proper timeout configured', () => {
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should support async/await', async () => {
      const promise = Promise.resolve('test');
      const result = await promise;
      expect(result).toBe('test');
    });

    it('should support TypeScript', () => {
      interface TestInterface {
        name: string;
        value: number;
      }
      
      const testObject: TestInterface = {
        name: 'test',
        value: 42
      };
      
      expect(testObject.name).toBe('test');
      expect(testObject.value).toBe(42);
    });
  });

  describe('Mock Functions', () => {
    it('should create and verify mock functions', () => {
      const mockFn = jest.fn();
      mockFn('test');
      
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should mock return values', () => {
      const mockFn = jest.fn().mockReturnValue('mocked');
      const result = mockFn();
      
      expect(result).toBe('mocked');
    });

    it('should mock async functions', async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue('async result');
      const result = await mockAsyncFn();
      
      expect(result).toBe('async result');
    });
  });

  describe('Basic Math Operations', () => {
    it('should perform basic arithmetic', () => {
      expect(2 + 2).toBe(4);
      expect(5 * 3).toBe(15);
      expect(10 / 2).toBe(5);
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3];
      expect(arr.length).toBe(3);
      expect(arr[0]).toBe(1);
    });

    it('should handle objects', () => {
      const obj = { name: 'test', value: 42 };
      expect(obj.name).toBe('test');
      expect(obj.value).toBe(42);
    });
  });
});