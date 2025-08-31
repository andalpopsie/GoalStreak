/**
 * Basic Test Suite
 * This test ensures that Jest is working correctly
 */

describe('Basic Jest Setup', () => {
  it('should run basic tests', () => {
    expect(true).toBe(true);
  });

  it('should handle numbers', () => {
    expect(2 + 2).toBe(4);
    expect(5 * 3).toBe(15);
  });

  it('should handle strings', () => {
    expect('hello').toBe('hello');
    expect('hello world'.split(' ')).toEqual(['hello', 'world']);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr).toContain(2);
  });

  it('should handle objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj).toHaveProperty('value', 42);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('async result');
    const result = await promise;
    expect(result).toBe('async result');
  });

  it('should handle mock functions', () => {
    const mockFn = jest.fn();
    mockFn('test');
    
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});