import { describe, it, expect } from 'vitest';
import { processTimeDecimal, type TimeDecimalConfig } from '../tools/datetime/time-decimal-converter';

describe('Time Decimal Converter', () => {
  const defaultConfig: TimeDecimalConfig = {
    inputFormat: 'auto',
    outputFormat: 'both',
    decimalPrecision: 2,
    roundingMode: 'standard',
    timeFormat: '24hour',
    includeSeconds: false,
    calculatePayroll: false,
    batchMode: false,
    showBreakdown: true,
  };

  describe('Time to Decimal Conversion', () => {
    it('should convert 8:30 to 8.5 decimal hours', () => {
      const result = processTimeDecimal('8:30', defaultConfig);
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(8.5);
    });

    it('should convert 7:45 to 7.75 decimal hours', () => {
      const result = processTimeDecimal('7:45', defaultConfig);
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(7.75);
    });

    it('should convert 2:15 to 2.25 decimal hours', () => {
      const result = processTimeDecimal('2:15', defaultConfig);
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(2.25);
    });

    it('should handle 12-hour format with AM/PM', () => {
      const result = processTimeDecimal('8:30 AM', defaultConfig);
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(8.5);
    });

    it('should handle 12-hour format with PM', () => {
      const result = processTimeDecimal('2:30 PM', defaultConfig);
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(14.5);
    });

    it('should handle midnight correctly', () => {
      const result = processTimeDecimal('12:00 AM', defaultConfig);
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(0);
    });

    it('should handle noon correctly', () => {
      const result = processTimeDecimal('12:00 PM', defaultConfig);
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(12);
    });
  });

  describe('Decimal to Time Conversion', () => {
    it('should convert 8.5 decimal hours to 8:30', () => {
      const config = { ...defaultConfig, inputFormat: 'decimal' as const };
      const result = processTimeDecimal('8.5', config);
      expect(result.success).toBe(true);
      expect(result.metadata?.formattedTime).toBe('08:30');
    });

    it('should convert 7.75 decimal hours to 7:45', () => {
      const config = { ...defaultConfig, inputFormat: 'decimal' as const };
      const result = processTimeDecimal('7.75', config);
      expect(result.success).toBe(true);
      expect(result.metadata?.formattedTime).toBe('07:45');
    });

    it('should convert 2.25 decimal hours to 2:15', () => {
      const config = { ...defaultConfig, inputFormat: 'decimal' as const };
      const result = processTimeDecimal('2.25', config);
      expect(result.success).toBe(true);
      expect(result.metadata?.formattedTime).toBe('02:15');
    });
  });

  describe('Rounding Modes', () => {
    it('should round to legal billing increments (6-minute blocks)', () => {
      const config = { ...defaultConfig, roundingMode: 'legal' as const };
      const result = processTimeDecimal('2:23', config); // Should round to 2.4 (2:24)
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(2.4);
    });

    it('should round to payroll increments (1-minute blocks)', () => {
      const config = { ...defaultConfig, roundingMode: 'payroll' as const };
      const result = processTimeDecimal('2:23', config);
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBeCloseTo(2.38, 2); // 2:23 = 2.383... rounds to 2.38
    });

    it('should round to quarter hour increments', () => {
      const config = { ...defaultConfig, roundingMode: 'quarter' as const };
      const result = processTimeDecimal('2:23', config); // 2:23 = 2.3833 hours, rounds to 2.5
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(2.5);
    });
  });

  describe('Payroll Calculations', () => {
    it('should calculate payroll with hourly rate', () => {
      const config = {
        ...defaultConfig,
        calculatePayroll: true,
        hourlyRate: 25.00
      };
      const result = processTimeDecimal('8:30', config);
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(8.5);
      expect(result.metadata?.payrollAmount).toBe(212.5); // 8.5 * 25 = 212.5
    });

    it('should handle fractional hourly rates', () => {
      const config = {
        ...defaultConfig,
        calculatePayroll: true,
        hourlyRate: 22.50
      };
      const result = processTimeDecimal('7:45', config);
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(7.75);
      expect(result.metadata?.payrollAmount).toBe(174.375); // 7.75 * 22.50 = 174.375
    });
  });

  describe('Batch Mode', () => {
    it('should process multiple time entries', () => {
      const config = { ...defaultConfig, batchMode: true };
      const input = '8:30\n7:45\n8:15';
      const result = processTimeDecimal(input, config);

      expect(result.success).toBe(true);
      expect(result.metadata?.totalEntries).toBe(3);
      expect(result.metadata?.totalDecimalHours).toBe(24.5); // 8.5 + 7.75 + 8.25
      expect(result.metadata?.averageHours).toBeCloseTo(8.17, 2);
    });

    it('should calculate total payroll for batch entries', () => {
      const config = {
        ...defaultConfig,
        batchMode: true,
        calculatePayroll: true,
        hourlyRate: 20.00
      };
      const input = '8:00\n8:00\n8:00\n8:00\n8:00'; // 40 hours total
      const result = processTimeDecimal(input, config);

      expect(result.success).toBe(true);
      expect(result.metadata?.totalDecimalHours).toBe(40);
      expect(result.metadata?.totalPay).toBe(800); // 40 * 20 = 800
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty input', () => {
      const result = processTimeDecimal('', defaultConfig);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Input is empty');
    });

    it('should handle invalid time format', () => {
      const result = processTimeDecimal('25:00', defaultConfig);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid hours');
    });

    it('should handle invalid minutes', () => {
      const result = processTimeDecimal('8:60', defaultConfig);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid minutes');
    });

    it('should handle invalid decimal format', () => {
      const config = { ...defaultConfig, inputFormat: 'decimal' as const };
      const result = processTimeDecimal('abc', config);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid decimal number');
    });

    it('should handle seconds when enabled', () => {
      const config = { ...defaultConfig, includeSeconds: true };
      const result = processTimeDecimal('8:30:30', config);
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBeCloseTo(8.508, 3); // 8:30:30 = 8.508333...
    });
  });

  describe('Output Formats', () => {
    it('should output decimal only when specified', () => {
      const config = { ...defaultConfig, outputFormat: 'decimal' as const };
      const result = processTimeDecimal('8:30', config);
      expect(result.success).toBe(true);
      expect(result.output).toContain('8.50');
      expect(result.output).not.toContain('08:30');
    });

    it('should output time only when specified', () => {
      const config = { ...defaultConfig, outputFormat: 'time' as const, inputFormat: 'decimal' as const };
      const result = processTimeDecimal('8.5', config);
      expect(result.success).toBe(true);
      expect(result.output).toContain('08:30');
      expect(result.output).not.toContain('8.50');
    });

    it('should output both formats by default', () => {
      const result = processTimeDecimal('8:30', defaultConfig);
      expect(result.success).toBe(true);
      expect(result.output).toContain('8.50');
      expect(result.output).toContain('08:30');
    });

    it('should handle 12-hour output format', () => {
      const config = { ...defaultConfig, timeFormat: '12hour' as const, inputFormat: 'decimal' as const };
      const result = processTimeDecimal('14.5', config);
      expect(result.success).toBe(true);
      expect(result.output).toContain('2:30 PM');
    });
  });

  describe('Precision Settings', () => {
    it('should respect decimal precision setting', () => {
      const config = { ...defaultConfig, decimalPrecision: 1 as const };
      const result = processTimeDecimal('8:33', config); // 8.55 hours
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(8.6); // Should round to 1 decimal place
    });

    it('should handle high precision', () => {
      const config = { ...defaultConfig, decimalPrecision: 4 as const };
      const result = processTimeDecimal('8:33', config);
      expect(result.success).toBe(true);
      expect(result.metadata?.decimalHours).toBe(8.55); // 8:33 = 8.55 exactly
    });
  });

  describe('Enhanced Bidirectional Features', () => {
    it('should detect input type for time format', () => {
      const result = processTimeDecimal('8:30', defaultConfig);
      expect(result.success).toBe(true);
      expect(result.metadata?.detectedInputType).toBe('time');
    });

    it('should detect input type for decimal format', () => {
      const config = { ...defaultConfig, inputFormat: 'decimal' as const };
      const result = processTimeDecimal('8.5', config);
      expect(result.success).toBe(true);
      expect(result.metadata?.detectedInputType).toBe('decimal');
    });

    it('should use smart output format for time input', () => {
      const config = { ...defaultConfig, outputFormat: 'auto' as const };
      const result = processTimeDecimal('8:30', config);
      expect(result.success).toBe(true);
      expect(result.output).toContain('→ Decimal Hours');
      expect(result.output).toContain('**Detected**: Time Format');
    });

    it('should use smart output format for decimal input', () => {
      const config = { ...defaultConfig, outputFormat: 'auto' as const, inputFormat: 'decimal' as const };
      const result = processTimeDecimal('8.5', config);
      expect(result.success).toBe(true);
      expect(result.output).toContain('→ Time Format');
      expect(result.output).toContain('**Detected**: Decimal Hours');
    });
  });
});