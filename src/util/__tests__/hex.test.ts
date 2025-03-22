import { Axial } from '../hex';

describe('Axial', () => {
  it('should add two Axial coordinates correctly', () => {
    const a = new Axial(1, 2);
    const b = new Axial(3, 4);
    const result = a.add(b);
    expect(result.q).toBe(4);
    expect(result.r).toBe(6);
  });

  it('should convert to Hex correctly', () => {
    const a = new Axial(2, 3);
    const hex = a.toHex();
    expect(hex.q).toBe(2);
    expect(hex.r).toBe(3);
    expect(hex.s).toBe(-5);
  });

  it('should calculate northWest correctly', () => {
    const a = new Axial(0, 0);
    const result = a.northWest();
    expect(result.q).toBe(-1);
    expect(result.r).toBe(-1);
  });
});