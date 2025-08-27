import { Logger, createComponentLogger } from '../logger'

// Mock winston to avoid actual logging during tests
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    add: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}))

describe('Logger', () => {
  describe('createComponentLogger', () => {
    it('should create a logger with component context', () => {
      const logger = createComponentLogger('test-component')
      expect(logger).toBeInstanceOf(Logger)
    })

    it('should create a logger with additional context', () => {
      const logger = createComponentLogger('test-component', { userId: '123' })
      expect(logger).toBeInstanceOf(Logger)
    })
  })

  describe('Logger instance', () => {
    let logger: Logger

    beforeEach(() => {
      logger = new Logger({ component: 'test' })
    })

    it('should have all logging methods', () => {
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.debug).toBe('function')
    })

    it('should have convenience methods', () => {
      expect(typeof logger.apiError).toBe('function')
      expect(typeof logger.dbOperation).toBe('function')
      expect(typeof logger.authEvent).toBe('function')
      expect(typeof logger.paymentEvent).toBe('function')
    })

    it('should create child loggers', () => {
      const childLogger = logger.child({ userId: '123' })
      expect(childLogger).toBeInstanceOf(Logger)
      expect(childLogger).not.toBe(logger)
    })
  })
})