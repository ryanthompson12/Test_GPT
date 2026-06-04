import { forecast, whatIf, type ForecastSample } from '../forecast';

const m = (
  id: string,
  date: string,
  revenue: number,
  totalExpenses: number,
  marketTypeId: string | null = 'craft',
): ForecastSample => ({ id, date, revenue, totalExpenses, marketTypeId });

describe('forecast', () => {
  it('averages the most recent N similar markets and reports a range', () => {
    // Five craft fairs with profits: 300,400,500,420,540 (cents *100 omitted for clarity)
    const samples = [
      m('1', '2026-01-10', 60000, 30000), // 300
      m('2', '2026-02-10', 70000, 30000), // 400
      m('3', '2026-03-10', 80000, 30000), // 500
      m('4', '2026-04-10', 72000, 30000), // 420
      m('5', '2026-05-10', 84000, 30000), // 540
    ];
    const r = forecast(samples, { marketTypeId: 'craft', window: 5 });
    expect(r).not.toBeNull();
    expect(r!.basis).toBe('type');
    expect(r!.sampleSize).toBe(5);
    expect(r!.confidence).toBe('good');
    expect(r!.expectedProfit).toBe(43200); // mean of 30000,40000,50000,42000,54000
    expect(r!.rangeLow).toBe(30000);
    expect(r!.rangeHigh).toBe(54000);
    // newest first
    expect(r!.sourceMarketIds[0]).toBe('5');
  });

  it('respects the window, keeping only the most recent markets', () => {
    const samples = [
      m('old', '2026-01-01', 100000, 0), // would be huge but excluded by window
      m('a', '2026-02-01', 50000, 20000), // 300
      m('b', '2026-03-01', 50000, 20000), // 300
      m('c', '2026-04-01', 50000, 20000), // 300
    ];
    const r = forecast(samples, { marketTypeId: 'craft', window: 3 });
    expect(r!.sampleSize).toBe(3);
    expect(r!.expectedProfit).toBe(30000);
    expect(r!.sourceMarketIds).toEqual(['c', 'b', 'a']);
  });

  it('falls back to all markets when too few of the requested type', () => {
    const samples = [
      m('1', '2026-01-01', 50000, 20000, 'farmers'),
      m('2', '2026-02-01', 60000, 20000, 'farmers'),
      m('3', '2026-03-01', 40000, 20000, 'holiday'),
    ];
    // Only one 'craft' market -> below minCohort -> fall back to all 3.
    const r = forecast(samples, { marketTypeId: 'craft' });
    expect(r!.basis).toBe('all');
    expect(r!.sampleSize).toBe(3);
  });

  it('labels confidence by sample size', () => {
    const two = forecast([m('1', '2026-01-01', 50000, 20000), m('2', '2026-02-01', 50000, 20000)]);
    expect(two!.confidence).toBe('low');
  });

  it('returns null with no history', () => {
    expect(forecast([])).toBeNull();
  });
});

describe('whatIf', () => {
  it('projects profit from overrides and reports the delta', () => {
    const baseline = forecast([
      m('1', '2026-01-01', 50000, 10000), // 400
      m('2', '2026-02-01', 50000, 10000), // 400
      m('3', '2026-03-01', 50000, 10000), // 400
    ])!;
    expect(baseline.expectedProfit).toBe(40000);

    // Raise the booth fee: expenses go from $100 to $190 expected.
    const r = whatIf(baseline, { expenses: 19000 });
    expect(r.projectedProfit).toBe(31000); // 50000 - 19000
    expect(r.deltaVsBaseline).toBe(-9000); // $90 worse
  });
});
