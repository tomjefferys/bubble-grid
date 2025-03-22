// Utilities for storing a hex grid

type Hex = { q: number, r: number, s: number };

//type Axial = { q: number, r: number };

export class Axial {
    constructor(public q: number, public r: number) {}

    static fromHex(h: Hex): Axial {
        return new Axial(h.q, h.r);
    }

    static NORTH_WEST : Axial = new Axial(-1, -1);
    static NORTH_EAST : Axial = new Axial(0, -1);
    static EAST : Axial = new Axial(1, 0);
    static SOUTH_EAST : Axial = new Axial(0,1);
    static SOUTH_WEST : Axial = new Axial(-1, 1);
    static WEST : Axial = new Axial(-1, 0);

    add(other: Axial): Axial {
        return new Axial(this.q + other.q, this.r + other.r);
    }

    toHex(): Hex {
        return { q: this.q, r: this.r, s: -this.q - this.r };
    }

    northWest(): Axial {
        return this.add(Axial.NORTH_WEST);
    }

    northEast(): Axial {
        return this.add(Axial.NORTH_EAST);
    }

    east(): Axial {
        return this.add(Axial.EAST);
    }
    
    southEast(): Axial {
        return this.add(Axial.SOUTH_EAST);
    }

    southWest(): Axial {
        return this.add(Axial.SOUTH_WEST);
    }   

    west(): Axial {
        return this.add(Axial.WEST);
    }
    
}

type HexGrid<V> = Map<Axial, V>;
