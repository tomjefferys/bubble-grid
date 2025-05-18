import { Axial, HexMap, getRingCoords, getSpiralCoords } from './hex';

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
    expect(result.q).toBe(0);
    expect(result.r).toBe(-1);
  });

  it('should be able to calculate a ring of coordinates for radius 0', () => {
    const ringCoords = getRingCoords([1,1], 0).map(getQRCoords);
    expect(ringCoords.length).toBe(1);
    expect(ringCoords).toContainEqual([1, 1]);
  });

  it('should be able to calculate a ring of coordinates for radius > 1', () => {
    const ringCoords = getRingCoords([1,1], 2).map(getQRCoords);
    expect(ringCoords.length).toBe(12);

    expect(ringCoords).toContainEqual([-1, 3]);
    expect(ringCoords).toContainEqual([0, 3]);
    expect(ringCoords).toContainEqual([1, 3]);

    expect(ringCoords).toContainEqual([2, 2]);
    expect(ringCoords).toContainEqual([3, 1]);
    expect(ringCoords).toContainEqual([3, 0]);

    expect(ringCoords).toContainEqual([3, -1]);
    expect(ringCoords).toContainEqual([2, -1]);
    expect(ringCoords).toContainEqual([1, -1]);

    expect(ringCoords).toContainEqual([0, 0]);
    expect(ringCoords).toContainEqual([-1, 1]);
    expect(ringCoords).toContainEqual([-1, 2]);
  });

  it('should be able to calculate a ring of coordinates', () => {
    const spiralCoords = getSpiralCoords([1,1], 9).map(getQRCoords);

    expect(spiralCoords.length).toBe(9);

    expect(spiralCoords).toContainEqual([1, 1]);
    expect(spiralCoords).toContainEqual([0, 2]);
    expect(spiralCoords).toContainEqual([1, 2]);
    expect(spiralCoords).toContainEqual([2, 1]);
    expect(spiralCoords).toContainEqual([2, 0]);
    expect(spiralCoords).toContainEqual([1, 0]);
    expect(spiralCoords).toContainEqual([0, 1]);
    expect(spiralCoords).toContainEqual([-1, 3]);
    expect(spiralCoords).toContainEqual([0, 3]);
  });

  it.each([
      [[0,0], [0,0]],
      [[1,0], [1,0]],
      [[-2,0], [-2,0]],
      [[-1,-2], [-2,-2]],
      [[1,1], [1,1]],
      [[0,2], [1,2]],
  ])('should be able to convert %s to cartesian coordinates', 
      ([q,r], [col, row]) => {
        const axial = Axial.from([q,r]);
        const cartesian = axial.toCartesian();
        expect(cartesian).toEqual([col, row]);
  });

  it.each([
      [[0,0], [0,0]],
      [[1,0], [1,0]],
      [[-2,0], [-2,0]],
      [[-2, -2], [-1,-2]],
      [[1,1], [1,1]],
      [[1,2], [0,2]],
  ])('should be able to convert %s from cartesian coordinates', 
      ([col,row], [q, r]) => {
        const axial = Axial.fromCartesian(col, row);
        expect({...axial}).toMatchObject({q, r});
  });

});

describe('HexGrid', () => {
  it('should create a HexGrid and add values', () => {
    const grid = new HexMap<number>();
    const axial = new Axial(1, 2);
    grid.set(axial, 42);
    expect(grid.get(axial)).toBe(42);
  });

  it('should not allow duplicate keys', () => {
    const grid = new HexMap<number>();
    const axial1 = new Axial(1, 2);
    const axial2 = new Axial(1, 2); // Same coordinates
    grid.set(axial1, 42);
    grid.set(axial2, 43); // This should overwrite the previous value
    expect(grid.get(axial1)).toBe(43);
  });

  it('should be able to return all neighbours', () => {
    const grid = new HexMap<number>();
    const centre = new Axial(0, 0);

    grid.set(centre, 1);
    grid.set(centre.northEast(), 2);
    grid.set(centre.northWest(), 3);
    grid.set(centre.east(), 4);
    grid.set(centre.southEast(), 5);
    grid.set(centre.southWest(), 6);
    grid.set(centre.west(), 7);

    const centreNeighbours = grid.getNeighbors(centre);
    expect(centreNeighbours.length).toBe(6);
    expect(centreNeighbours).toContain(2);
    expect(centreNeighbours).toContain(3);
    expect(centreNeighbours).toContain(4);
    expect(centreNeighbours).toContain(5);
    expect(centreNeighbours).toContain(6);
    expect(centreNeighbours).toContain(7);

    const northWestNeighbours = grid.getNeighbors(centre.northWest());
    expect(northWestNeighbours.length).toBe(3);
    expect(northWestNeighbours).toContain(1);
    expect(northWestNeighbours).toContain(2);
    expect(northWestNeighbours).toContain(7);
    expect(northWestNeighbours).not.toContain(3);
    expect(northWestNeighbours).not.toContain(4);
    expect(northWestNeighbours).not.toContain(5);
    expect(northWestNeighbours).not.toContain(6);
  });

  it('should be able to generate a hexagonal grid from a 2d array', () => { 
    const grid = HexMap.fromArray([0, 0], [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);

    expect(grid.get([0, 0])).toBe(1);
    expect(grid.get([1, 0])).toBe(2);
    expect(grid.get([2, 0])).toBe(3);

    expect(grid.get([0, 1])).toBe(4);
    expect(grid.get([1, 1])).toBe(5);
    expect(grid.get([2, 1])).toBe(6);

    expect(grid.get([-1, 2])).toBe(7);
    expect(grid.get([0, 2])).toBe(8);
    expect(grid.get([1, 2])).toBe(9);
  });

  it('should be able to return all hexes in a ring around a given hex', () => {
    const grid = HexMap.fromArray([0, 0], [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);
    const ring = grid.getRing([1, 1], 1);

    expect(ring.length).toBe(6);
    expect(ring).toContain(2);
    expect(ring).toContain(3);
    expect(ring).toContain(4);
    expect(ring).toContain(6);
    expect(ring).toContain(8);
    expect(ring).toContain(9);
  });

  it('should be able to return all hexes as an array', () => {
    const hexGrid = HexMap.fromArray([0, 0], [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);

    const grid2 = hexGrid.toArray();
    expect(grid2).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
  });

  it('should be able to return all hexes as an array even if not at origin', () => {
    const hexGrid = HexMap.fromArray([-2, -2], [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);

    const grid2 = hexGrid.toArray();
    expect(grid2).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
  });

  it('should be able to return all hexes as an array with undefined values', () => {
    const hexGrid = HexMap.fromArray([0, 0], [
      [1, 2, 3],
      [4],
      [7, 8, 9],
    ]);

    const grid2 = hexGrid.toArray();
    expect(grid2).toEqual([
      [1, 2, 3],
      [4, undefined, undefined],
      [7, 8, 9],
    ])
  });

  it("should be able to return hexes as an array, with correct indentation for even numbered rows", () => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const hexMap = HexMap.fromSpiral([0, 0], nums);
    const array = hexMap.toArray().map(row => row.map(cell => cell ?? 0));

    expect(array).toEqual([ 
      [0, 6, 5, 13],
      [7, 1, 4, 12],
      [0, 2, 3, 11],
      [8, 9, 10, 0],
    ]);

  });

  it("should be able to return hexes as an array, with correct indentation for odd numbered rows", () => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const hexMap = HexMap.fromSpiral([0, 0], nums);
    const array = hexMap.toArray().map(row => row.map(cell => cell ?? 0));

    expect(array).toEqual([ 
      [0, 0, 14,0],
      [6, 5, 13, 0],
      [7, 1, 4, 12],
      [2, 3, 11, 0],
      [8, 9, 10, 0],
    ]);

  });

});

const getQRCoords = (hex: Axial): [number,number] => [hex.q, hex.r];